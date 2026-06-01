import firebase_admin
import os
from fastapi import FastAPI, Request, HTTPException
from firebase_admin import firestore as admin_firestore

app = FastAPI()

if not firebase_admin._apps:
    firebase_admin.initialize_app()

# Cache clients by database ID to avoid re-creating on every request
_db_clients = {}


def get_db(database_id: str):
    if database_id not in _db_clients:
        _db_clients[database_id] = admin_firestore.client(database_id=database_id)
    return _db_clients[database_id]


@app.post("/")
async def handle_event(request: Request):
    # ce-source = //firestore.googleapis.com/projects/{project}/databases/{database}
    # ce-subject = documents/users/{uid}/entries/{eid}
    source = request.headers.get("ce-source", "")
    subject = request.headers.get("ce-subject", "")

    if not source or not subject:
        try:
            body_json = await request.json()
            source = source or body_json.get("source", "")
            subject = subject or body_json.get("subject", "")
        except Exception:
            pass

    if not subject:
        print(f"Missing ce-subject. Headers: {dict(request.headers)}")
        raise HTTPException(status_code=400, detail="Missing ce-subject header")

    # Parse database name from source
    # format: //firestore.googleapis.com/projects/{project}/databases/{database}
    database_id = "(default)"
    if "/databases/" in source:
        database_id = source.split("/databases/", 1)[1]
    print(f"database={database_id} subject={subject}")

    # Parse document path from subject: documents/users/{uid}/entries/{eid}
    if not subject.startswith("documents/"):
        print(f"skip: unexpected subject format: {subject}")
        return {"status": "skip", "reason": "unexpected subject format"}

    path_parts = subject.removeprefix("documents/").split("/")
    if len(path_parts) != 4 or path_parts[0] != "users" or path_parts[2] != "entries":
        print(f"skip: not an entry document: {subject}")
        return {"status": "skip", "reason": "not an entry document"}

    uid = path_parts[1]
    eid = path_parts[3]
    print(f"processing uid={uid} eid={eid}")

    db = get_db(database_id)
    doc_ref = db.collection("users").document(uid).collection("entries").document(eid)
    doc_snap = doc_ref.get()

    if not doc_snap.exists:
        print(f"skip: document not found uid={uid} eid={eid}")
        return {"status": "skip", "reason": "document not found"}

    doc_data = doc_snap.to_dict()

    from tag_meal import tag_meal
    result = tag_meal(doc_data, uid, eid, db)

    if result is None:
        return {"status": "skip"}

    return {"status": "ok", "analysis_status": result.get("status")}
