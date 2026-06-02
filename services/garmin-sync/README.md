# garmin-sync

Cloud Run service that syncs Garmin Connect activities into Gut Feel's Firestore as `type='activity'` entries. Triggered
every 2 hours by Cloud Scheduler.

Uses the unofficial [`garminconnect`](https://github.com/cyberjunky/python-garminconnect) Python library (
reverse-engineered Garmin mobile SSO). Acceptable for personal single-user use; not suitable for commercial/multi-user
apps.

## How it works

1. Loads Garmin OAuth tokens from Firestore (persists across Cloud Run cold starts)
2. Authenticates with Garmin Connect
3. Fetches activities since `lastSyncedDate` (or N days back on first run / backfill)
4. Deduplicates by Garmin `activityId` (`sourceId` field in Firestore)
5. Writes new entries to `users/{uid}/entries/` with `type='activity'`
6. Updates `users/{uid}/integrations/garmin` with `lastSyncedDate` and cached tokens

## Local development

```bash
cd services/garmin-sync
python3 -m pip install -r requirements.txt

cp env.example .env
# edit .env with your real values

python3 run_local.py
```

### `.env` variables

| Variable             | Required | Default | Description                              |
|----------------------|----------|---------|------------------------------------------|
| `GARMIN_EMAIL`       | yes      | —       | Garmin Connect account email             |
| `GARMIN_PASSWORD`    | yes      | —       | Garmin Connect password                  |
| `GARMIN_UID`         | yes      | —       | Firebase Auth UID to write entries under |
| `FIRESTORE_DATABASE` | no       | `local` | Firestore database ID                    |
| `BACKFILL_DAYS`      | no       | `30`    | Days to backfill on first run            |

### Finding your Firebase UID

Open the app in the browser, open DevTools console:

```js
firebase.auth().currentUser?.uid
```

### First-time 2FA

If your Garmin account has 2FA enabled, the first automated login may fail. To work around this, run the auth
interactively once:

```python
from garminconnect import Garmin

g = Garmin(email="you@example.com", password="secret")
g.login("/tmp/garmin_tokens")  # will prompt for MFA code in terminal
```

After that, tokens are cached and subsequent runs won't need 2FA.

## Deploy to Cloud Run

```bash
# Create service account
gcloud iam service-accounts create garmin-sync-sa \
  --display-name="Gut-Feel Garmin Sync Service Account"

# Grant Firestore access
gcloud projects add-iam-policy-binding gut-feel-sandervl \
  --member="serviceAccount:garmin-sync-sa@gut-feel-sandervl.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Store secrets
gcloud secrets create GARMIN_EMAIL --data-file=<(echo -n "you@example.com")
gcloud secrets create GARMIN_PASSWORD --data-file=<(echo -n "yourpassword")
gcloud secrets create GARMIN_UID --data-file=<(echo -n "your-firebase-uid")

# Grant service account access to the secrets
gcloud secrets add-iam-policy-binding GARMIN_EMAIL \
  --member="serviceAccount:garmin-sync-sa@gut-feel-sandervl.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding GARMIN_PASSWORD \
  --member="serviceAccount:garmin-sync-sa@gut-feel-sandervl.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding GARMIN_UID \
  --member="serviceAccount:garmin-sync-sa@gut-feel-sandervl.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Deploy
gcloud run deploy garmin-sync \
  --source . \
  --region europe-west1 \
  --no-allow-unauthenticated \
  --service-account garmin-sync-sa@gut-feel-sandervl.iam.gserviceaccount.com \
  --set-secrets GARMIN_EMAIL=GARMIN_EMAIL:latest,GARMIN_PASSWORD=GARMIN_PASSWORD:latest,GARMIN_UID=GARMIN_UID:latest \
  --set-env-vars FIRESTORE_DATABASE=production \
  --memory 512Mi --timeout 60s
```

## Cloud Scheduler job

```bash
# Grant the service account permission to invoke the Cloud Run service
gcloud run services add-iam-policy-binding garmin-sync \
  --region=europe-west1 \
  --member="serviceAccount:garmin-sync-sa@gut-feel-sandervl.iam.gserviceaccount.com" \
  --role="roles/run.invoker"

gcloud scheduler jobs create http garmin-sync-every-4h \
  --schedule="0 */4 * * *" \
  --uri="https://garmin-sync-1000278579376.europe-west1.run.app/sync" \
  --http-method=POST \
  --oidc-service-account-email=garmin-sync-sa@gut-feel-sandervl.iam.gserviceaccount.com \
  --location=europe-west1
```

## Backfill historical activities

After deploying, run once to import the last 90 days:

```bash
curl -X POST "https://GARMIN_SYNC_URL/sync?backfill_days=90" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)"
```
