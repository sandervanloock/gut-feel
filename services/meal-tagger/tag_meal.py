import hashlib
import json
import os
from google import genai
from google.cloud import firestore
from google.genai import types
from pydantic import ValidationError

from prompts import SYSTEM_PROMPT, MealAnalysis, build_user_message, get_response_schema

_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
MODEL = "gemini-3.5-flash"


def compute_input_hash(name: str, ingredients: list[str], followup_answers: dict) -> str:
    raw = name + "|" + ",".join(sorted(ingredients)) + "|" + json.dumps(followup_answers, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()


def tag_meal(doc_data: dict, uid: str, eid: str, db) -> dict | None:
    if doc_data.get("type") != "meal":
        return None

    name = doc_data.get("name", "")
    ingredients = doc_data.get("ingredients", [])
    notes = doc_data.get("notes", "")
    followup_answers = doc_data.get("analysis", {}).get("followupAnswers", {})

    input_hash = compute_input_hash(name, ingredients, followup_answers)

    existing = doc_data.get("analysis", {})

    # Primary guard: only run if the client explicitly requested analysis
    # by setting analysisRequestedAt. Drop/restore tag writes don't touch
    # this field, so they never trigger a re-run.
    analysis_requested_at = doc_data.get("analysisRequestedAt")
    if not analysis_requested_at:
        print(f"skip: no analysisRequestedAt for {uid}/{eid}")
        return None

    # Secondary guard: skip if we already processed this exact request
    # (Cloud Run's own write-back re-fires Eventarc; this breaks the loop).
    processed_request_at = existing.get("processedRequestAt")
    if processed_request_at and processed_request_at == analysis_requested_at:
        print(f"skip: already processed this request for {uid}/{eid}")
        return None

    try:
        user_message = build_user_message(name, ingredients, notes, followup_answers)
        response = _client.models.generate_content(
            model=MODEL,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=get_response_schema(),
            ),
        )
        raw_json = response.text

        parsed = MealAnalysis.model_validate_json(raw_json)
    except ValidationError as e:
        print(f"Validation error for {uid}/{eid}: {e}")
        analysis = {
            "status": "ready",
            "nutrition": None,
            "followup": None,
            "followupAnswers": followup_answers,
            "dropped": existing.get("dropped", []),
            "inputHash": input_hash,
            "model": MODEL,
            "version": 1,
            "processedRequestAt": analysis_requested_at,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
    except Exception as e:
        print(f"Gemini error for {uid}/{eid}: {e}")
        return None
    else:
        nutrition_dict = None
        if parsed.nutrition:
            n = parsed.nutrition
            nutrition_dict = {
                "kcal": n.kcal,
                "macros": {
                    "protein": n.macros.protein,
                    "carbs": n.macros.carbs,
                    "fat": n.macros.fat,
                },
                "fiber": n.fiber,
                "sugar": n.sugar,
                "sodium": n.sodium,
                "vitamins": [{"key": v.key, "name": v.name, "dv": v.dv} for v in (n.vitamins or [])],
                "conf": {
                    "calories": n.conf.calories.value,
                    "protein": n.conf.protein.value,
                    "carbs": n.conf.carbs.value,
                    "fat": n.conf.fat.value,
                    "fiber": n.conf.fiber.value,
                    "sugar": n.conf.sugar.value,
                    "sodium": n.conf.sodium.value,
                    "vitamins": n.conf.vitamins.value,
                },
                "knownRatio": n.knownRatio,
            }

        followup_dict = None
        if parsed.followup:
            f = parsed.followup
            followup_dict = {
                "id": f.id,
                "prompt": f.prompt,
                "hint": f.hint,
                "kind": f.kind,
            }
            if f.options:
                followup_dict["options"] = [{"value": o.value, "label": o.label} for o in f.options]
            if f.placeholder:
                followup_dict["placeholder"] = f.placeholder

        analysis = {
            "status": parsed.status,
            "nutrition": nutrition_dict,
            "followup": followup_dict,
            "followupAnswers": followup_answers,
            "dropped": existing.get("dropped", []),
            "inputHash": input_hash,
            "model": MODEL,
            "version": 1,
            "processedRequestAt": analysis_requested_at,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

    doc_ref = db.collection("users").document(uid).collection("entries").document(eid)
    doc_ref.update({"analysis": analysis})
    print(f"wrote analysis status={analysis['status']} for {uid}/{eid}")
    return analysis
