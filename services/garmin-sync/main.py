import firebase_admin
import os
from fastapi import FastAPI, Query
from firebase_admin import firestore as admin_firestore

app = FastAPI()

if not firebase_admin._apps:
    firebase_admin.initialize_app()

_db = None


def get_db():
    global _db
    if _db is None:
        database_id = os.environ.get("FIRESTORE_DATABASE", "(default)")
        _db = admin_firestore.client(database_id=database_id)
    return _db


@app.post("/sync")
async def sync(backfill_days: int = Query(default=None)):
    uid = os.environ["GARMIN_UID"]
    db = get_db()

    from sync_activities import sync_garmin_activities
    new_count = sync_garmin_activities(db, uid, backfill_days=backfill_days)

    return {"status": "ok", "new_activities": new_count}
