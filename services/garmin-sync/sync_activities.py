import datetime
import os
from firebase_admin import firestore
from garminconnect import Garmin
from pathlib import Path

TOKEN_DIR = "/tmp/garmin_tokens"

ACTIVITY_TYPE_MAP = {
    "running": "Run",
    "cycling": "Ride",
    "road_biking": "Ride",
    "mountain_biking": "Ride",
    "gravel_cycling": "Ride",
    "indoor_cycling": "Ride",
    "strength_training": "Strength",
    "yoga": "Yoga",
    "swimming": "Swim",
    "open_water_swimming": "Swim",
    "walking": "Walk",
    "hiking": "Walk",
    "trail_running": "Run",
    "treadmill_running": "Run",
}


def _load_tokens(db, uid):
    doc = db.collection("users").document(uid).collection("integrations").document("garmin").get()
    if not doc.exists:
        return
    token_data = (doc.to_dict() or {}).get("tokenData")
    if not token_data:
        return
    Path(TOKEN_DIR).mkdir(parents=True, exist_ok=True)
    for filename, content in token_data.items():
        (Path(TOKEN_DIR) / filename).write_text(content)
    print(f"Loaded {len(token_data)} token file(s) from Firestore")


def _save_tokens(db, uid):
    token_dir = Path(TOKEN_DIR)
    if not token_dir.exists():
        return
    token_data = {f.name: f.read_text() for f in token_dir.iterdir() if f.is_file()}
    if token_data:
        db.collection("users").document(uid).collection("integrations").document("garmin").set(
            {"tokenData": token_data}, merge=True
        )
        print(f"Saved {len(token_data)} token file(s) to Firestore")


def _map_activity_type(type_key: str) -> str:
    if not type_key:
        return "Activity"
    return ACTIVITY_TYPE_MAP.get(type_key, type_key.replace("_", " ").title())


def sync_garmin_activities(db, uid: str, backfill_days: int = None) -> int:
    email = os.environ["GARMIN_EMAIL"]
    password = os.environ["GARMIN_PASSWORD"]

    _load_tokens(db, uid)

    garmin = Garmin(email=email, password=password)
    garmin.login(TOKEN_DIR)
    _save_tokens(db, uid)

    integration_ref = (
        db.collection("users").document(uid).collection("integrations").document("garmin")
    )
    integration_doc = integration_ref.get()
    integration_data = integration_doc.to_dict() if integration_doc.exists else {}

    if backfill_days:
        start_date = datetime.date.today() - datetime.timedelta(days=backfill_days)
    elif integration_data.get("lastSyncedDate"):
        # Re-fetch the last synced day in case any activities were added after the sync
        start_date = datetime.date.fromisoformat(integration_data["lastSyncedDate"]) - datetime.timedelta(days=1)
    else:
        start_date = datetime.date.today() - datetime.timedelta(days=7)

    end_date = datetime.date.today()
    print(f"uid={uid} fetching activities {start_date} → {end_date}")

    activities = garmin.get_activities_by_date(str(start_date), str(end_date))
    print(f"Got {len(activities)} activities from Garmin")

    # Build set of existing Garmin sourceIds to skip duplicates
    existing_ids: set[str] = set()
    for snap in (
            db.collection("users").document(uid).collection("entries")
                    .where("source", "==", "Garmin")
                    .stream()
    ):
        sid = (snap.to_dict() or {}).get("sourceId")
        if sid:
            existing_ids.add(str(sid))

    new_count = 0
    for act in activities:
        activity_id = str(act.get("activityId", ""))
        if not activity_id or activity_id in existing_ids:
            continue

        # Use UTC date to match how the rest of the app stores dates (UTC-based).
        begin_ts = act.get("beginTimestamp")
        if begin_ts:
            dt = datetime.datetime.fromtimestamp(begin_ts / 1000, tz=datetime.timezone.utc)
        else:
            start_time_local = act.get("startTimeLocal", "")
            if not start_time_local:
                continue
            try:
                dt = datetime.datetime.strptime(start_time_local, "%Y-%m-%d %H:%M:%S").replace(
                    tzinfo=datetime.timezone.utc
                )
            except ValueError:
                print(f"skip {activity_id}: unexpected startTimeLocal format: {start_time_local}")
                continue

        distance = act.get("distance")
        calories = int(act.get("calories", 0)) or None
        duration_seconds = act.get("duration", 0)

        # The app stores date as UTC date minus 1 day (existing convention for all entry types).
        date_str = (dt.date() - datetime.timedelta(days=1)).isoformat()

        entry = {
            "type": "activity",
            "date": date_str,
            "time": dt.strftime("%H:%M"),
            "activityType": _map_activity_type(act.get("activityType", {}).get("typeKey", "")),
            "durationMinutes": round(duration_seconds / 60) if duration_seconds else 0,
            "caloriesBurned": calories,
            "distanceMeters": int(distance) if distance else None,
            "source": "Garmin",
            "sourceId": activity_id,
            "syncedAt": firestore.SERVER_TIMESTAMP,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        db.collection("users").document(uid).collection("entries").add(entry)
        existing_ids.add(activity_id)
        new_count += 1
        print(f"Added {entry['activityType']} on {entry['date']} ({activity_id})")

    integration_ref.set(
        {"lastSyncedDate": str(end_date), "lastSyncedAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )
    print(f"Sync done: {new_count} new activities")
    return new_count
