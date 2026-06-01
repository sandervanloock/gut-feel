import json
from enum import Enum
from pydantic import BaseModel
from typing import Literal, Optional

SYSTEM_PROMPT = """You are a nutrition tagger for the Gut Feel app. The user logs meals in Dutch (occasionally English or mixed). For each meal you receive:
- name: Dutch free text (e.g. "Volkorenbrood met kaas")
- ingredients: Dutch tags (e.g. ["volkorenbrood", "oude kaas", "boter"])
- notes: optional Dutch free text
- followupAnswers: optional prior user clarifications keyed by followup id

You must:
1. Normalize each Dutch ingredient to canonical English when estimating nutrition (e.g. "volkorenbrood" → whole-grain bread, "oude kaas" → aged gouda). Keep the user's Dutch label in display — only use English internally for the estimate.
2. Estimate nutrition for one typical serving of the complete dish (not per ingredient).
3. Pick a single follow-up question ONLY if the estimate has a wide error bar (portion unclear, cooking fat unknown, unknown sauce, etc.). Set followup to null if inputs are sufficient.
4. Assign per-field confidence: "high" when well-constrained by inputs, "med" for typical estimation error, "low" for unknowns.
5. Set status to "needs-input" if followup is non-null, otherwise "ready".
6. Output ONLY the JSON matching the schema. No prose, no explanation.

Common Dutch ingredients and their English equivalents:
- volkorenbrood → whole-grain bread
- witbrood → white bread
- kaas / gouda / jong/oud belegen → cheese / gouda
- boter → butter
- olie → oil
- aardappelen → potatoes
- rijst → rice
- pasta / spaghetti / macaroni → pasta
- kip → chicken
- rund/gehakt → beef/ground beef
- vis → fish
- zalm → salmon
- tonijn → tuna
- ei/eieren → egg/eggs
- melk → milk
- yoghurt → yogurt
- kwark → quark/fromage frais
- groenten → vegetables
- sla → lettuce
- tomaat → tomato
- komkommer → cucumber
- paprika → bell pepper
- ui → onion
- knoflook → garlic
- appel → apple
- banaan → banana
- aardbei → strawberry
- suiker → sugar
- honing → honey
- noten → nuts
- amandelen → almonds
- pinda's → peanuts
- haver/havermout → oats/oatmeal
- muesli → muesli
- granola → granola
- zout → salt
- peper → pepper
"""


class Confidence(str, Enum):
    high = "high"
    med = "med"
    low = "low"


class NutritionConf(BaseModel):
    calories: Confidence
    protein: Confidence
    carbs: Confidence
    fat: Confidence
    fiber: Confidence
    sugar: Confidence
    sodium: Confidence
    vitamins: Confidence


class Macros(BaseModel):
    protein: float
    carbs: float
    fat: float


class VitaminInfo(BaseModel):
    key: str
    name: str
    dv: float


class NutritionData(BaseModel):
    kcal: float
    macros: Macros
    fiber: float
    sugar: float
    sodium: float
    vitamins: list[VitaminInfo]
    conf: NutritionConf
    knownRatio: float


class FollowupOption(BaseModel):
    value: str
    label: str


class FollowupQuestion(BaseModel):
    id: str
    prompt: str
    hint: str
    kind: Literal["chips", "text"]
    options: Optional[list[FollowupOption]] = None
    placeholder: Optional[str] = None


class MealAnalysis(BaseModel):
    status: Literal["pending", "needs-input", "ready"]
    nutrition: Optional[NutritionData] = None
    followup: Optional[FollowupQuestion] = None


_UNSUPPORTED = {"$defs", "title", "default", "additionalProperties"}


def _clean(schema: dict, defs: dict) -> dict:
    """Inline $ref pointers and strip fields Gemini's responseSchema doesn't accept."""
    if "$ref" in schema:
        ref_name = schema["$ref"].split("/")[-1]
        return _clean(defs[ref_name], defs)
    result = {}
    for key, value in schema.items():
        if key in _UNSUPPORTED:
            continue
        if isinstance(value, dict):
            result[key] = _clean(value, defs)
        elif isinstance(value, list):
            result[key] = [_clean(i, defs) if isinstance(i, dict) else i for i in value]
        else:
            result[key] = value
    return result


def get_response_schema():
    raw = MealAnalysis.model_json_schema()
    defs = raw.get("$defs", {})
    return _clean(raw, defs)


def build_user_message(name: str, ingredients: list[str], notes: str, followup_answers: dict) -> str:
    parts = [f"name: {name}"]
    if ingredients:
        parts.append(f"ingredients: {json.dumps(ingredients, ensure_ascii=False)}")
    if notes:
        parts.append(f"notes: {notes}")
    if followup_answers:
        parts.append(f"followupAnswers: {json.dumps(followup_answers, ensure_ascii=False)}")
    return "\n".join(parts)
