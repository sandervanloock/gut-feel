"""
Run a local Garmin sync without starting the FastAPI server.

Usage:
    cd services/garmin-sync
    cp .env.example .env   # fill in your values
    pip install -r requirements.txt
    python3 run_local.py

.env file keys:
    GARMIN_EMAIL         required
    GARMIN_PASSWORD      required
    GARMIN_UID           required  (Firebase Auth UID)
    FIRESTORE_DATABASE   optional  (default: "local")
    BACKFILL_DAYS        optional  (default: 30)
"""
import os
from pathlib import Path

# Load .env if present (python-dotenv, falls back gracefully if not installed)
try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

import firebase_admin
from firebase_admin import firestore as admin_firestore

firebase_admin.initialize_app()

database_id = os.environ.get("FIRESTORE_DATABASE", "local")
uid = os.environ["GARMIN_UID"]
backfill_days = int(os.environ.get("BACKFILL_DAYS", "30"))

db = admin_firestore.client(database_id=database_id)

from sync_activities import sync_garmin_activities

sync_garmin_activities(db, uid=uid, backfill_days=backfill_days)
