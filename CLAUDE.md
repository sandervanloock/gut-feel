# Gut Feel — CLAUDE.md

Personal mobile-first PWA for meal, bowel, and fitness activity tracking. Firebase backend, React frontend, Cloud Run
services for AI tagging and Garmin sync.

## Tech stack

- **Frontend**: React 18, Vite, PWA (vite-plugin-pwa), plain CSS (no Tailwind)
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting)
- **AI tagging**: Cloud Run Python service (`services/meal-tagger/`) triggered by Eventarc
- **Garmin sync**: Cloud Run Python service (`services/garmin-sync/`) triggered by Cloud Scheduler every 4 hours
- **Language**: Firestore data is written in Dutch (user's language); Cloud Run normalises to English for nutrition
  estimation

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build
npm run deploy:indexes  # deploy Firestore indexes only
node scripts/seed.mjs <uid> [--days=14] [--env=.env.local]  # seed local DB
```

Deploy Cloud Run services:

```bash
cd services/meal-tagger
gcloud run deploy meal-tagger --source . --region europe-west1 \
  --no-allow-unauthenticated \
  --service-account meal-tagger-sa@PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars GEMINI_API_KEY=... --memory 512Mi --timeout 60s

cd services/garmin-sync
gcloud run deploy garmin-sync --source . --region europe-west1 \
  --no-allow-unauthenticated \
  --service-account garmin-sync-sa@PROJECT_ID.iam.gserviceaccount.com \
  --set-secrets GARMIN_EMAIL=GARMIN_EMAIL:latest,GARMIN_PASSWORD=GARMIN_PASSWORD:latest,GARMIN_UID=GARMIN_UID:latest \
  --set-env-vars FIRESTORE_DATABASE=production --memory 512Mi --timeout 60s
# See services/garmin-sync/README.md for full setup (service account, secrets, scheduler)
```

## Project structure

```
src/
  App.jsx                      # root component, all Firestore writes live here
  auth/                        # AuthContext + LoginScreen
  components/
    TimelineRow.jsx             # renders meal/snack/bowel entries; shows MealAnalysisStrip
    NutritionPanel.jsx          # full nutrition breakdown shown in LogMealSheet
    MealAnalysisStrip.jsx       # compact kcal+macro strip on timeline cards
    FollowupPrompt.jsx          # chips or text input for AI follow-up questions
    Icon.jsx                    # all SVG icons (add here if new icon needed)
    ...
  hooks/
    useEntries.js               # Firestore snapshot + addEntry/updateEntry/deleteEntry
                                # + answerFollowup / dropTag / restoreTags
  sheets/
    LogMealSheet.jsx            # meal create/edit sheet; mounts NutritionPanel
    LogGutSheet.jsx
    SnackEditSheet.jsx
  styles/
    tokens.css                  # design tokens (colours, type, radii)
    app.css                     # global styles + component CSS (nutrition panel at bottom)
  config/firebase.js            # Firebase init; reads VITE_* env vars
scripts/
  seed.mjs                      # seeds local Firestore with meals, gut, snack + activity entries
services/
  meal-tagger/                  # Cloud Run Python FastAPI service
    main.py                     # POST / endpoint; parses Eventarc ce-source header
    tag_meal.py                 # Gemini 2.5 Flash call, inputHash idempotency, Firestore write-back
    prompts.py                  # Pydantic schema + system prompt + build_user_message()
    requirements.txt
    Dockerfile
  garmin-sync/                  # Cloud Run Python FastAPI service; triggered by Cloud Scheduler
    main.py                     # POST /sync endpoint; accepts ?backfill_days=N
    sync_activities.py          # garminconnect auth, fetch, dedup, Firestore write
    run_local.py                # local dev helper (reads .env)
    README.md                   # full setup + deploy instructions
    requirements.txt
    Dockerfile
firestore.rules                 # auth-gated per-user reads/writes
```

## Environments

| Env file           | Firestore DB     | Use                                    |
|--------------------|------------------|----------------------------------------|
| `.env.local`       | `local`          | local dev; seed.mjs only seeds this DB |
| `.env.development` | `local` or named | `npm run dev`                          |
| `.env.production`  | `production`     | deployed app                           |

Env vars required: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIRESTORE_DATABASE`.

## Firestore data model

```
users/{uid}/entries/{id}
  type: 'meal' | 'bowel' | 'snack' | 'activity'
  date: 'YYYY-MM-DD'
  time: 'HH:MM'
  createdAt / updatedAt: Timestamp

  # meal only
  name: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'other'
  ingredients: string[]
  notes: string
  photoUrl: string | null
  analysisRequestedAt: Timestamp    # set by client on save/edit to trigger Cloud Run
  analysis: {                       # written by Cloud Run meal-tagger service
    status: 'pending' | 'needs-input' | 'ready'
    nutrition: { kcal, macros, fiber, sugar, sodium, vitamins, conf, knownRatio } | null
    followup: { id, prompt, hint, kind, options?, placeholder? } | null
    followupAnswers: { [followupId]: string }
    dropped: string[]               # tag keys dismissed by user
    inputHash: string               # sha256 — loop-breaker for Eventarc re-fires
    model: string
    version: number
    updatedAt: Timestamp
  }

  # bowel only
  bristol: 1-7
  urgency / effort: 1-5

  # snack only
  item: string
  count: number

  # activity only (written by garmin-sync Cloud Run service)
  activityType: string          # e.g. 'Run', 'Ride', 'Strength', 'Yoga', 'Walk', 'Swim'
  durationMinutes: number
  caloriesBurned: number | null
  distanceMeters: number | null
  source: 'Garmin'
  sourceId: string              # Garmin activityId — used for dedup
  syncedAt: Timestamp

users/{uid}/integrations/garmin
  lastSyncedDate: 'YYYY-MM-DD'  # incremental sync cursor
  lastSyncedAt: Timestamp
  tokenData: { [filename]: string }  # cached Garmin OAuth tokens
```

## AI tagging architecture

```
Client save/edit  ──▶  Firestore (analysisRequestedAt set)
                              │ Eventarc onWrite
                              ▼
                      Cloud Run meal-tagger (Python/FastAPI)
                              │ Gemini 2.5 Flash (free tier: 1500 req/day)
                              ▼
                      entry.analysis written back → Firestore snapshot
                      listener picks it up, UI updates in real time
```

Loop prevention: service computes `inputHash = sha256(name|sortedIngredients|followupAnswers)`. Skips if hash matches
existing `ready` analysis.

Client write paths:

- New meal / edit name+ingredients → sets `analysisRequestedAt` → triggers re-run
- Answer follow-up → sets `analysis.followupAnswers.<id>` + `analysisRequestedAt` → triggers re-run
- Drop/restore tag → updates `analysis.dropped` only → **no** re-run (hash unchanged)

## GCP infra (already provisioned)

- Cloud Run service: `meal-tagger`, region `europe-west1`
- Service account: `meal-tagger-sa@PROJECT_ID.iam.gserviceaccount.com` (role: `datastore.user`)
- Eventarc triggers: one per Firestore database (`meal-tagger-trg-local`, `meal-tagger-trg-production`)
- Gemini API key stored as `GEMINI_API_KEY` env var on the Cloud Run service

- Cloud Run service: `garmin-sync`, region `europe-west1`
- Service account: `garmin-sync-sa@PROJECT_ID.iam.gserviceaccount.com` (roles: `datastore.user`,
  `secretmanager.secretAccessor`)
- Cloud Scheduler job: `garmin-sync-every-4h` — `POST /sync` every 4 hours
- Secrets in Secret Manager: `GARMIN_EMAIL`, `GARMIN_PASSWORD`, `GARMIN_UID`

## Style conventions

- No Tailwind — plain CSS in `app.css` using design tokens from `tokens.css`
- All icons via `<Icon name="..." />` in `Icon.jsx` — add new SVGs there
- Colour palette uses OKLCH; `--sage` is the primary accent, `--terracotta` for destructive, `--amber` for warnings,
  `--move` for activity/fitness entries
- Sheet components are `BottomSheet`-wrapped; don't create modal dialogs
- No comments unless the WHY is non-obvious
