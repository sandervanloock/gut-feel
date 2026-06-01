# Gut Feel — AI nutrition tagging via Cloud Run

## Context

The Claude Design handoff (`/tmp/claude-501/gutfeel-design/gut-feel/`, chat3.md "AI-powered meal tagging") adds an async
AI layer on top of every meal: structured nutrition tags (calories, macros, fiber/sugar/sodium, key vitamins/minerals),
per‑field confidence, optional follow‑up questions to sharpen the estimate, and droppable tags the user can dismiss when
wrong. The design ships a *local mock* (`analysis.jsx`, `nutrition.jsx`); the user's note in the chat is explicit: **"
ready to be swapped for a real vision/nutrition API when you wire one in."** That swap is this plan.

Constraints from the user:

- An **external system on Cloud Run (Python)** does the tagging — not a Cloud Function written in Node and not a
  client‑side call.
- Trigger: **a new meal entry** (Firestore onWrite via Eventarc).
- **Follow‑up answers re‑trigger** the same pipeline so numbers refine.
- **Zero‑cost** target — pick free‑tier LLMs.
- Meal input is **Dutch** and needs normalization before/while tagging.
- Storage choice (confirmed): **embed `analysis` on the entry doc** — matches the design's shape and the existing
  `useEntries` snapshot listener, so the timeline card and meal sheet update in real time without extra reads.
- Insights performance: today's `InsightsScreen` (`src/components/InsightsScreen.jsx`) only queries 7 days from a single
  collection — embedded tags are fine; no rollup doc needed yet.

## Target schema on `users/{uid}/entries/{id}` (meal entries only)

Mirror the design's shape so the React port is a near copy/paste of `nutrition.jsx`:

```
analysis: {
  status: 'pending' | 'needs-input' | 'ready',
  nutrition: null | {
    kcal: number,
    macros: { protein: number, carbs: number, fat: number },     // grams
    fiber: number, sugar: number, sodium: number,                // g, g, mg
    vitamins: [{ key, name, dv }],                                // top 5 by %DV
    conf: { calories, protein, carbs, fat, fiber, sugar, sodium, vitamins },  // 'high'|'med'|'low' each
    knownRatio: number
  },
  followup: null | {
    id: 'portion' | 'fat' | 'extras' | string,
    prompt: string, hint: string,
    kind: 'chips' | 'text',
    options?: [{ value, label }],
    placeholder?: string
  },
  followupAnswers: { [followupId]: string },   // user replies, kept so re-runs are deterministic
  dropped: string[],                            // tag keys user dismissed (e.g. 'sodium', 'vit:Fe')
  inputHash: string,                            // sha256 of (name|sorted ingredients|followupAnswers) — drives idempotency
  model: string,                                // e.g. 'gemini-2.5-flash'
  version: number,                              // bump if prompt/schema changes
  updatedAt: Timestamp
}
```

Two extra fields on the entry root for plumbing:

- `analysisRequestedAt: Timestamp` — written by the client when it wants a (re-)run (new meal, edit, follow-up answer).
  The Cloud Run service uses this as the loop‑breaker.
- `analysis.inputHash` matches what the service last produced — Cloud Run **skips** if the doc hasn't materially
  changed (prevents infinite onWrite loops from its own writes).

## Architecture

```
React PWA  ──write/update──▶  Firestore (users/{uid}/entries/{id})
                                    │
                                    │ Eventarc google.cloud.firestore.document.v1.written
                                    ▼
                          Cloud Run service (Python, FastAPI)
                                    │
                                    │ HTTPS w/ JSON-schema response
                                    ▼
                              Gemini 2.5 Flash API
                                    │
                                    ▼
                        normalize NL → EN canon, score, decide followup
                                    │
                                    │ Admin SDK write-back (merge)
                                    ▼
                          Firestore entry.analysis = {...}
```

### Loop prevention

The service computes
`inputHash = sha256(name + '|' + sortedIngredients.join(',') + '|' + JSON.stringify(followupAnswers))`. On every
Eventarc fire it:

1. Skips if doc is not a meal.
2. Skips if `analysis.inputHash === computedHash AND analysis.status === 'ready' AND dropped/extras unchanged`.
3. Otherwise runs, writes `analysis` + `inputHash` in one merge. The resulting onWrite fires again, but step 2
   short-circuits.

This is cleaner than an explicit `needsAnalysis` boolean because the client never has to remember to set/clear a flag —
it just writes the data and the Cloud Run figures out what changed.

### Client write paths (3 of them)

| Action                                              | Client writes                                                 | Triggers re-run?                                                       |
|-----------------------------------------------------|---------------------------------------------------------------|------------------------------------------------------------------------|
| Save new meal                                       | full entry incl. `analysisRequestedAt`                        | yes (no hash yet)                                                      |
| Edit name/ingredients in `LogMealSheet`             | merge updated fields + `analysisRequestedAt`                  | yes (hash changes)                                                     |
| Answer follow‑up (chips or typed) in NutritionPanel | merge `analysis.followupAnswers.<id>` + `analysisRequestedAt` | yes (hash changes — follow‑up answers are in the hash)                 |
| Drop a tag / undo drop                              | merge `analysis.dropped` only                                 | **no** (hash unchanged; service skips)                                 |
| Edit notes only                                     | merge `notes`                                                 | **no** (notes not in hash, matching design behaviour in `app.jsx:220`) |

## LLM choice — zero cost

| Provider / model                        | Free tier (per project)                          | Dutch quality                                          | Structured JSON                           | Latency      | Fit                                     |
|-----------------------------------------|--------------------------------------------------|--------------------------------------------------------|-------------------------------------------|--------------|-----------------------------------------|
| **Gemini 2.5 Flash** (Google AI Studio) | 1,500 req/day, 1M TPM, 15 RPM, no credit card    | Strong (Google's strongest multilingual model in tier) | **Native JSON Schema** (`responseSchema`) | ~1–3 s       | **PRIMARY**                             |
| Gemini 2.5 Flash‑Lite                   | same RPD bucket, cheaper if you ever exceed free | Good                                                   | Native JSON Schema                        | ~0.5–1 s     | fallback / batch mode                   |
| Groq Llama 3.3 70B                      | ~30 RPM, 6K TPM                                  | Decent, less consistent on Dutch food slang            | JSON mode (looser)                        | ~0.2 s       | secondary fallback if Gemini quota hits |
| Cloudflare Workers AI                   | 10K neurons/day                                  | Mixed                                                  | Tool-call JSON                            | edge latency | not worth the extra deploy target       |
| Mistral Small (La Plateforme free)      | 1 RPS theoretical                                | OK on Dutch                                            | JSON mode                                 | ~1 s         | only if Gemini disallowed in region     |

**Pick Gemini 2.5 Flash** as the primary and only model. Reasons:

- 1,500 req/day is **~10× a single user's load** (5 meals + 2 follow‑ups + some edits ≈ 15 calls/day).
- `responseSchema` lets us pin the exact shape above so the service never has to do brittle regex repair.
- The same single API call does Dutch‑to‑English ingredient normalization, nutrition estimation, confidence assignment,
  and follow‑up selection — no separate "cleanup" hop. Cleaner prompt, cheaper, lower latency.
- Already pays itself off if usage grows: paid Flash is $0.30/M input + $2.50/M output — at ~2K input + 400 output per
  meal that's ~$0.0016/meal, ~$0.05/month per user.

**Fallback strategy** (not for v1): wrap the call in a thin client that tries Gemini, then Groq Llama 3.3 70B on
`RESOURCE_EXHAUSTED`. Postpone — the design is mocked, getting one provider live is the priority.

## Files to create

### `services/meal-tagger/` (new Cloud Run service, Python)

| File               | Purpose                                                                                                                                            |
|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| `main.py`          | FastAPI app. One route `POST /` accepts a CloudEvent (Eventarc). Parses Firestore document protobuf, runs `tag_meal()`, writes back via Admin SDK. |
| `tag_meal.py`      | Builds the prompt, calls Gemini with `responseSchema`, validates, returns the `analysis` dict. Computes `inputHash`. Decides skip vs run.          |
| `prompts.py`       | The Dutch‑aware system prompt + JSON schema definition (Pydantic → JSON schema).                                                                   |
| `requirements.txt` | `fastapi`, `uvicorn[standard]`, `google-cloud-firestore`, `google-genai`, `pydantic`, `cloudevents`.                                               |
| `Dockerfile`       | python:3.12-slim, `uvicorn main:app --host 0.0.0.0 --port $PORT`.                                                                                  |
| `.gcloudignore`    | exclude `.venv`, `__pycache__`.                                                                                                                    |
| `README.md`        | deploy + local dev instructions.                                                                                                                   |

### Prompt (single LLM call does it all)

System prompt sketch (Dutch‑aware):

```
You are a nutrition tagger for the Gut Feel app. The user logs meals in Dutch
(occasionally English). For each meal you receive:
  - name (Dutch free text, e.g. "Volkorenbrood met kaas")
  - ingredients (Dutch tags, e.g. ["volkorenbrood", "oude kaas", "boter"])
  - notes (optional, Dutch free text)
  - followupAnswers (optional, prior user clarifications)

You must:
1. Normalize each Dutch ingredient to a canonical English form when scoring
   (e.g. "volkorenbrood" → whole-grain bread). Keep the user's Dutch label in
   the output for display.
2. Estimate nutrition for one typical serving of the dish (not per ingredient).
3. Pick a single follow-up question if (and only if) the estimate has a wide
   error bar (e.g. portion size unclear, oil/butter unknown). Otherwise null.
4. Assign per-field confidence: 'high' when the estimate is well constrained
   by the inputs, 'med' for typical estimation, 'low' for unknowns.
5. Output ONLY the JSON matching the schema. No prose.
```

JSON schema = the `analysis.nutrition + followup` shape above, encoded as a Pydantic model so we get validation for
free.

### `firestore.rules` (update)

Add: **the `analysis` and `analysisRequestedAt` fields may only be written by the service account** (i.e. the client may
not forge tags). Two options:

- Simpler v1: rely on the fact that only the Cloud Run runs server-side; clients can technically write but they don't.
  Trust the client.
- Stricter: split into a subcollection `users/{uid}/entries/{id}/ai/result` writable only by service account, and let
  the client read it. Adds a read but is cheap.

Pick simpler v1 (trust the client; the surface is single-user). Mention the stricter variant in the README.

### Frontend wiring

Add **port** of `nutrition.jsx` + `analysis.jsx` styles, **minus** the local `analyzeMeal/pickFollowup` — those move to
Cloud Run. Reuse the design's component API verbatim:

| New / changed file                                            | Action                                                                                                                                                                                                                                                                 |
|---------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `src/components/NutritionPanel.jsx`                           | port from design `nutrition.jsx` lines 92‑207 (NutritionPanel + MacroBlock). Drop the local‑mock branches; rely on `entry.analysis` from Firestore.                                                                                                                    |
| `src/components/MealAnalysisStrip.jsx`                        | port from design `nutrition.jsx` lines 239‑294. Renders timeline‑card status.                                                                                                                                                                                          |
| `src/components/FollowupPrompt.jsx`                           | port from design `nutrition.jsx` lines 40‑75.                                                                                                                                                                                                                          |
| `src/components/Icon.jsx`                                     | add `sparkle`, `chevron-r` if missing (check existing icon set first).                                                                                                                                                                                                 |
| `src/components/TimelineRow.jsx`                              | insert `<MealAnalysisStrip analysis={entry.analysis} />` below the ingredients tag row for meal entries (the spot in the design screenshot at `today.png`).                                                                                                            |
| `src/sheets/LogMealSheet.jsx`                                 | mount `<NutritionPanel>` below the existing notes textarea. Wire `onAnswerFollowup`, `onDropTag`, `onRestoreTags` to the new hook callbacks below.                                                                                                                     |
| `src/hooks/useEntries.js`                                     | add three helpers: `answerFollowup(id, ans)`, `dropTag(id, key)`, `restoreTags(id)`. Each is a `updateDoc` merge — see Client write paths table above. The new‑meal/`updateEntry` paths set `analysisRequestedAt: serverTimestamp()` whenever name/ingredients change. |
| `src/styles/app.css` (or wherever current global styles live) | append the design's nutrition CSS block. The verifier in chat3 confirmed it renders cleanly — copy it as-is.                                                                                                                                                           |
| `scripts/seed.mjs`                                            | extend each seeded meal with a pre-filled `analysis` object (mirror the design's seed states in `data.jsx`) so local dev shows the panel without needing the Cloud Run online.                                                                                         |

### Existing utilities to reuse

- `serverTimestamp` import (already used in `useEntries.js:33`).
- `updateDoc` with merge for partial writes (`useEntries.js:38`).
- Firestore snapshot listener (`useEntries.js:24`) automatically picks up the Cloud Run's write — no React refetch logic
  needed.

## Cost breakdown

### Usage model

Per active user, per day:

- 5 meals logged → 5 invocations
- ~40% answer a follow-up → +2 invocations (re-run with the answer)
- ~15% edit ingredients later → +0.75 invocations
- **Total: ~7.75 invocations/user/day → ~232 invocations/user/month** (rounded to 250 for safety)

Per invocation (measured assumption, refine after first deploy):

- **Wall time**: ~3 s (Gemini API call dominates; service work is ~50 ms)
- **CPU during request**: 1 vCPU (Cloud Run default; CPU only billed while handling, not idle)
- **Memory**: 512 MiB allocated (FastAPI + google-genai + protobuf parsing fits comfortably)
- **Request payload**: ~1 KB in (Firestore CloudEvent), ~3 KB out (analysis write — but write goes to Firestore, not
  back through Cloud Run)
- **Gemini token usage**: ~2,000 input (system prompt + meal data + schema), ~400 output (structured JSON)

### Cloud Run cost detail (the part you asked about)

Cloud Run free tier per billing account per month:

- 2,000,000 requests
- 360,000 vCPU‑seconds
- 180,000 GiB‑seconds
- 1 GiB North America egress

Per-meter price after free tier (europe‑west1, default tier-1 pricing as of 2026):

- $0.00002400 per vCPU‑second
- $0.00000250 per GiB‑second
- $0.40 per million requests

**Per-user monthly Cloud Run footprint** (250 invocations × 3 s × 1 vCPU × 0.5 GiB):
| Meter | Usage | Free remaining | Cost |
|---|---|---|---|
| Requests | 250 | 1,999,750 | $0.00 |
| vCPU‑seconds | 750 | 359,250 | $0.00 |
| GiB‑seconds | 375 | 179,625 | $0.00 |
| Egress | <1 MB | full | $0.00 |
| **Cloud Run total** | | | **$0.00/user/mo** |

**Scaling break-even — when does Cloud Run start to cost?**

vCPU‑seconds is the binding constraint (most expensive meter, highest utilization). 360,000 free vCPU‑seconds ÷ 3
s/invocation = **120,000 free invocations/month** before paid usage kicks in. That's:

- ~480 users at 250 invocations/month, or
- ~120 users at 1,000 invocations/month (heavy use), or
- ~16 users if every meal had a vision/photo pass making each invocation 30 s instead of 3 s.

Past that threshold, Cloud Run cost is roughly **$0.072 per 1,000 invocations** at 3 s/1 vCPU/0.5 GiB
(= 3 × $0.000024 + 1.5 × $0.0000025 ≈ $0.0000758 × 1,000).

### Cold starts (worth flagging)

- Python + FastAPI cold start on Cloud Run is **~2–4 s** for this image size (Python 3.12 slim + google-genai). That's
  *added to* the ~3 s LLM call when the instance was scaled to zero.
- Free tier behaviour: `min-instances=0` (default) — instance scales to zero between meals. **A user's meal save will
  feel like ~5–7 s before the panel flips to `ready`.** The UI handles this gracefully because it shows the `analysing…`
  shimmer immediately on the timeline card (design `MealAnalysisStrip` lines 244–250).
- Setting `min-instances=1` to eliminate cold starts would cost ~720 hours × $0.000024/vCPU‑sec × 3600 = **~$62/month**
  even with no traffic (instance is billed continuously) → **do not do this** for v1. Cold start is acceptable given the
  async UX.

### Other line items

| Item                                                 | Free tier                                                        | Per-user usage                                             | Cost                   |
|------------------------------------------------------|------------------------------------------------------------------|------------------------------------------------------------|------------------------|
| Gemini 2.5 Flash                                     | 1,500 req/day, 1M TPM                                            | 250 req/mo, ~2K in + 400 out per call                      | $0.00 (under free RPD) |
| Eventarc                                             | 100K events/mo free per project                                  | 250 events × (writes from client + Cloud Run) ≈ 500 events | $0.00                  |
| Firestore writes                                     | 20K/day free                                                     | ~10 writes/user/day                                        | $0.00                  |
| Firestore document reads (Cloud Run reads the entry) | 50K/day free                                                     | 250 reads/user/mo                                          | $0.00                  |
| Artifact Registry (container storage)                | 0.5 GiB free per region                                          | ~250 MB image                                              | $0.00                  |
| Cloud Build (build the container)                    | 120 build‑minutes/day free                                       | ~2 minutes per deploy                                      | $0.00                  |
| Egress                                               | 1 GiB North America free; cross-region from europe-west1 differs | tiny (LLM call is from Cloud Run to Google, internal)      | $0.00                  |
| **Monthly total per user**                           |                                                                  |                                                            | **$0.00**              |

### Where Gemini hits the free-tier wall first

The Gemini free tier (**1,500 req/day**) caps shared across the whole API key, not per user. So:

- **1 user** at 7.75/day → uses 0.5% of daily quota.
- **193 users** at 7.75/day → 1,496/day, hits the wall.
- At that point switch to **paid Gemini 2.5 Flash**: $0.30/M input + $2.50/M output. Per invocation ≈ (
  2K × $0.30/M) + (0.4K × $2.50/M) ≈ **$0.0016/call → $0.40/user/month**.

### Scaling cost summary

| Scale                          | Cloud Run                               | Gemini                              | Eventarc | Total     |
|--------------------------------|-----------------------------------------|-------------------------------------|----------|-----------|
| 1 user                         | $0                                      | $0 (free)                           | $0       | **$0**    |
| 50 users                       | $0                                      | $0 (free)                           | $0       | **$0**    |
| 200 users                      | $0                                      | $0.40/user × 200 = $80 (paid Flash) | $0       | **~$80**  |
| 1,000 users (250K invocations) | (250K − 120K) × 3 s × $0.000024 ≈ $9.40 | $400 (paid Flash)                   | $0       | **~$410** |

For Sander's actual use case (personal app, 1–3 users), the answer is unambiguously **$0/month**.

## Verification

End‑to‑end test on a real local Firestore + a deployed Cloud Run staging instance:

1. **Local mock first** — `npm run dev`, save a new meal in Dutch ("Volkorenbrood met kaas"). The seeded `analysis` from
   `seed.mjs` should make the panel appear immediately. UI ports verified visually against
   `/tmp/claude-501/gutfeel-design/gut-feel/project/screenshots/today.png` and `sheet-nutri.png`.
2. **Service unit** — `pytest services/meal-tagger/` runs `tag_meal()` with three hand‑crafted Dutch meals and asserts
   the JSON validates against the schema and follow‑up appears only when expected.
3. **Deploy** —
   `gcloud run deploy meal-tagger --source services/meal-tagger --region europe-west1 --no-allow-unauthenticated`.
4. **Wire trigger** —
   `gcloud eventarc triggers create meal-tagger-trg --location=europe-west1 --service-account=... --destination-run-service=meal-tagger --event-filters="type=google.cloud.firestore.document.v1.written" --event-filters="database=local" --event-filters-path-pattern="document=users/{uid}/entries/{eid}" --event-data-content-type="application/protobuf"`.
5. **E2E happy path** — in the dev app, log "Quinoa met kikkererwten" with no follow‑up answer. Within ~3 s the panel
   flips `pending → needs-input` with a `portion` chip. Tap "Large" → flips to `ready`, calories scale up, confidence
   meters fill.
6. **Idempotency** — drop the sodium tag in the UI. Confirm Cloud Run logs show "skip: hash match" rather than running
   again.
7. **Edit re‑trigger** — edit ingredients (add "tahini dressing"). Confirm panel goes back to `pending` and resolves
   with higher fat / lower confidence on sodium.
8. **Quota guard** — temporarily lower the Gemini key's daily cap in AI Studio; confirm the service returns a graceful
   `status: 'ready'` with `conf: low` everywhere rather than a crash (i.e., a clear failure mode rather than retry
   storms).
