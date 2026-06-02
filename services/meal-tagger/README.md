# meal-tagger

Cloud Run service that listens for Firestore `entries` document writes via Eventarc and uses Gemini 2.5 Flash to tag
meal entries with nutrition data.

## Architecture

```
Firestore write → Eventarc → Cloud Run (meal-tagger) → Gemini 2.5 Flash → Firestore update
```

The service receives a CloudEvent, reads the full document, calls `tag_meal()`, and writes back an `analysis` object.
Non-meal entries and unchanged meals (hash match + status `ready`) are skipped.

## Environment variables

| Variable         | Source                            | Description    |
|------------------|-----------------------------------|----------------|
| `GEMINI_API_KEY` | Secret Manager (`GEMINI_API_KEY`) | Gemini API key |

Firebase Admin SDK uses Application Default Credentials — no explicit key needed on Cloud Run.

## Secret Manager setup

Create the secret (run once):

```bash
echo -n "your-api-key" | gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --replication-policy=automatic
```

Grant the service account access:

```bash
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:meal-tagger-sa@gut-feel-sandervl.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

To rotate the key later:

```bash
echo -n "new-api-key" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

## Deploy

```bash
gcloud run deploy meal-tagger \
  --source . \
  --region europe-west1 \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --no-allow-unauthenticated
```

Then create the Eventarc trigger:

```bash
gcloud eventarc triggers create meal-tagger-trigger \
  --location europe-west1 \
  --destination-run-service meal-tagger \
  --destination-run-region europe-west1 \
  --event-filters "type=google.cloud.firestore.document.v1.written" \
  --event-filters "database=(default)" \
  --event-filters-path-pattern "document=users/*/entries/*" \
  --service-account YOUR_SA@PROJECT.iam.gserviceaccount.com
```

## Local development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export GEMINI_API_KEY=your-key
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

uvicorn main:app --reload --port 8080
```

Send a test CloudEvent:

```bash
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -H "ce-specversion: 1.0" \
  -H "ce-type: google.cloud.firestore.document.v1.written" \
  -H "ce-id: test-1" \
  -H "ce-source: //firestore.googleapis.com/projects/YOUR_PROJECT/databases/(default)/documents/users/UID/entries/EID" \
  -d '{}'
```
