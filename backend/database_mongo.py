import os
import json
import sqlite3
import threading
from datetime import datetime
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/pricepilot")
DB_NAME = "pricepilot"

_client = None
_mongo_available = None

FALLBACK_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mongo_fallback.db")

def get_fallback_db_conn():
    conn = sqlite3.connect(FALLBACK_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("""
    CREATE TABLE IF NOT EXISTS mongo_docs (
        collection_name TEXT,
        doc_id TEXT PRIMARY KEY,
        doc_json TEXT
    );
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_mongo_coll ON mongo_docs(collection_name);")
    conn.commit()
    return conn

_fallback_lock = threading.Lock()

def _serialize_doc(doc):
    def _default(obj):
        if isinstance(obj, datetime):
            return {"$date": obj.isoformat()}
        if isinstance(obj, ObjectId):
            return {"$oid": str(obj)}
        return str(obj)
    doc_copy = dict(doc)
    if "_id" in doc_copy and isinstance(doc_copy["_id"], ObjectId):
        doc_copy["_id"] = str(doc_copy["_id"])
    return json.dumps(doc_copy, default=_default)

def _deserialize_doc(json_str):
    doc = json.loads(json_str)
    for k, v in list(doc.items()):
        if isinstance(v, dict) and "$date" in v:
            try:
                doc[k] = datetime.fromisoformat(v["$date"])
            except Exception:
                pass
    return doc

def _matches_filter(doc, query):
    if not query:
        return True
    for key, val in query.items():
        if key == "$or":
            if not any(_matches_filter(doc, subq) for subq in val):
                return False
            continue
        doc_val = doc.get(key)
        if isinstance(val, dict):
            for op, op_val in val.items():
                if op == "$lt" and not (doc_val is not None and doc_val < op_val):
                    return False
                if op == "$gt" and not (doc_val is not None and doc_val > op_val):
                    return False
                if op == "$lte" and not (doc_val is not None and doc_val <= op_val):
                    return False
                if op == "$gte" and not (doc_val is not None and doc_val >= op_val):
                    return False
                if op == "$ne" and doc_val == op_val:
                    return False
                if op == "$in" and doc_val not in op_val:
                    return False
        else:
            if key == "_id" and isinstance(val, ObjectId):
                val = str(val)
            if str(doc_val).lower().strip() != str(val).lower().strip() and str(doc_val) != str(val):
                return False
    return True

class InsertOneResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

class InsertManyResult:
    def __init__(self, inserted_ids):
        self.inserted_ids = inserted_ids

class UpdateResult:
    def __init__(self, matched_count=1, modified_count=1):
        self.matched_count = matched_count
        self.modified_count = modified_count

class DeleteResult:
    def __init__(self, deleted_count=1):
        self.deleted_count = deleted_count

class FallbackMongoCollection:
    def __init__(self, collection_name):
        self.collection_name = collection_name

    def _get_all_docs(self):
        conn = get_fallback_db_conn()
        cursor = conn.cursor()
        rows = cursor.execute("SELECT doc_json FROM mongo_docs WHERE collection_name = ?", (self.collection_name,)).fetchall()
        docs = []
        for r in rows:
            try:
                docs.append(_deserialize_doc(r[0]))
            except Exception:
                pass
        return docs

    def _save_doc(self, doc):
        conn = get_fallback_db_conn()
        doc_id = str(doc.get("_id"))
        doc_json = _serialize_doc(doc)
        with _fallback_lock:
            conn.execute(
                "INSERT OR REPLACE INTO mongo_docs (collection_name, doc_id, doc_json) VALUES (?, ?, ?)",
                (self.collection_name, doc_id, doc_json)
            )
            conn.commit()

    def _delete_doc(self, doc_id):
        conn = get_fallback_db_conn()
        with _fallback_lock:
            conn.execute(
                "DELETE FROM mongo_docs WHERE collection_name = ? AND doc_id = ?",
                (self.collection_name, str(doc_id))
            )
            conn.commit()

    def find_one(self, filter=None, sort=None):
        docs = self.find(filter=filter, sort=sort, limit=1)
        return docs[0] if docs else None

    def find(self, filter=None, sort=None, skip=0, limit=0):
        docs = self._get_all_docs()
        if filter:
            docs = [d for d in docs if _matches_filter(d, filter)]

        if sort:
            if isinstance(sort, list) and len(sort) > 0:
                key, order = sort[0]
                reverse = (order == -1)
                docs.sort(key=lambda x: str(x.get(key) or ""), reverse=reverse)

        if skip:
            docs = docs[skip:]
        if limit and limit > 0:
            docs = docs[:limit]
        return docs

    def insert_one(self, doc):
        if "_id" not in doc or not doc["_id"]:
            doc["_id"] = str(ObjectId())
        elif isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])
        self._save_doc(doc)
        return InsertOneResult(doc["_id"])

    def insert_many(self, docs):
        ids = []
        for d in docs:
            res = self.insert_one(d)
            ids.append(res.inserted_id)
        return InsertManyResult(ids)

    def update_one(self, filter, update, upsert=False):
        target = self.find_one(filter)
        if not target:
            if upsert:
                new_doc = {}
                if "$set" in update:
                    new_doc.update(update["$set"])
                self.insert_one(new_doc)
                return UpdateResult(1, 1)
            return UpdateResult(0, 0)

        if "$set" in update:
            for k, v in update["$set"].items():
                target[k] = v
        if "$unset" in update:
            for k in update["$unset"].keys():
                target.pop(k, None)
        if "$inc" in update:
            for k, v in update["$inc"].items():
                target[k] = (target.get(k) or 0) + v

        self._save_doc(target)
        return UpdateResult(1, 1)

    def update_many(self, filter, update):
        docs = self.find(filter)
        count = 0
        for d in docs:
            if "$set" in update:
                for k, v in update["$set"].items():
                    d[k] = v
            if "$unset" in update:
                for k in update["$unset"].keys():
                    d.pop(k, None)
            if "$inc" in update:
                for k, v in update["$inc"].items():
                    d[k] = (d.get(k) or 0) + v
            self._save_doc(d)
            count += 1
        return UpdateResult(count, count)

    def delete_one(self, filter):
        target = self.find_one(filter)
        if target:
            self._delete_doc(target["_id"])
            return DeleteResult(1)
        return DeleteResult(0)

    def delete_many(self, filter):
        docs = self.find(filter)
        count = len(docs)
        for d in docs:
            self._delete_doc(d["_id"])
        return DeleteResult(count)

    def count_documents(self, filter=None):
        return len(self.find(filter))

    def create_index(self, keys, **kwargs):
        pass

    def aggregate(self, pipeline):
        docs = self._get_all_docs()
        for stage in pipeline:
            if "$match" in stage:
                docs = [d for d in docs if _matches_filter(d, stage["$match"])]
        return docs

class FallbackMongoDatabase:
    def __getattr__(self, name):
        return FallbackMongoCollection(name)
    def __getitem__(self, name):
        return FallbackMongoCollection(name)

def check_mongo_available():
    global _client, _mongo_available
    if _mongo_available is not None:
        return _mongo_available
    try:
        if _client is None:
            _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=1000)
        _client.admin.command('ping')
        _mongo_available = True
    except Exception:
        _mongo_available = False
    return _mongo_available

def get_mongo_client():
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=1000)
    return _client

def get_db():
    if check_mongo_available():
        return get_mongo_client()[DB_NAME]
    return FallbackMongoDatabase()

def init_db():
    try:
        db = get_db()
        db.Users.create_index("email", unique=True)
        db.Datasets.create_index([("user_id", ASCENDING), ("file_hash", ASCENDING)])
        db.Notifications.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        db.ActivityLogs.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        db.PasswordResetOTP.create_index([("user_id", ASCENDING), ("otp", ASCENDING)])
        db.sessions.create_index([("user_id", ASCENDING), ("refresh_token", ASCENDING)])
    except Exception as e:
        print(f"[Init DB Warning] {e}")

threading.Thread(target=init_db, daemon=True).start()

# --- HELPER FUNCTIONS ---

def to_oid(val):
    if not val:
        return val
    try:
        return ObjectId(str(val))
    except Exception:
        return str(val)

def get_user_active_dataset(user_id):
    db = get_db()
    oid = to_oid(user_id)
    user = db.Users.find_one({"_id": oid})
    if not user:
        user = db.users.find_one({"_id": oid})
    if not user:
        user = db.Users.find_one({"_id": str(user_id)})
    if not user:
        user = db.users.find_one({"_id": str(user_id)})
        
    active_hash = user.get("active_dataset_hash") if user else None
    
    if not active_hash:
        user_datasets = list(db.Datasets.find({"user_id": str(user_id)}))
        if not user_datasets:
            user_datasets = list(db.datasets.find({"user_id": str(user_id)}))
            
        completed = [d for d in user_datasets if d.get("status") == "Completed"]
        if completed:
            def get_date(x):
                d = x.get("updated_at")
                if isinstance(d, datetime):
                    return d
                return datetime.min
            completed.sort(key=get_date, reverse=True)
            active_hash = completed[0]["file_hash"]
            set_user_active_dataset(user_id, active_hash)
            
    return active_hash

def set_user_active_dataset(user_id, file_hash):
    db = get_db()
    oid = to_oid(user_id)
    db.Users.update_one({"_id": oid}, {"$set": {"active_dataset_hash": file_hash}})
    db.users.update_one({"_id": oid}, {"$set": {"active_dataset_hash": file_hash}})
    # Also update with string just in case
    db.Users.update_one({"_id": str(user_id)}, {"$set": {"active_dataset_hash": file_hash}})
    db.users.update_one({"_id": str(user_id)}, {"$set": {"active_dataset_hash": file_hash}})

def update_dataset_status(user_id, file_hash, status, progress, error_message=None, rows_count=0, columns_list=None, cleaning_report=None, stats=None, filename=None):
    db = get_db()
    dataset = db.Datasets.find_one({"user_id": str(user_id), "file_hash": file_hash})
    if not dataset:
        dataset = db.datasets.find_one({"user_id": str(user_id), "file_hash": file_hash})
    
    update_fields = {}
    if status is not None:
        update_fields["status"] = status
    if progress is not None:
        update_fields["progress"] = progress
    if error_message is not None:
        update_fields["error_message"] = error_message
    if rows_count:
        update_fields["rows"] = rows_count
        update_fields["rows_count"] = rows_count
    if columns_list is not None:
        update_fields["columns"] = columns_list
        update_fields["columns_list"] = columns_list
    if cleaning_report is not None:
        update_fields["cleaning_report"] = cleaning_report
    if stats is not None:
        update_fields["stats"] = stats
    if filename is not None:
        update_fields["dataset_name"] = filename
        update_fields["original_filename"] = filename
        update_fields["stored_filename"] = filename
        update_fields["filename"] = filename
        
    update_fields["updated_at"] = datetime.utcnow()

    if dataset:
        db.Datasets.update_one({"_id": dataset["_id"]}, {"$set": update_fields})
        db.datasets.update_one({"_id": dataset["_id"]}, {"$set": update_fields})
    else:
        new_doc = {
            "user_id": str(user_id),
            "file_hash": file_hash,
            "filename": filename or "dataset.csv",
            "dataset_name": filename or "dataset.csv",
            "original_filename": filename or "dataset.csv",
            "stored_filename": filename or "dataset.csv",
            "file_path": os.path.join("datasets", str(user_id), filename or "dataset.csv"),
            "rows": rows_count,
            "rows_count": rows_count,
            "columns": columns_list or [],
            "columns_list": columns_list or [],
            "status": status or "Uploading...",
            "progress": progress or 10,
            "error_message": error_message,
            "cleaning_report": cleaning_report or {},
            "stats": stats or {},
            "uploaded_at": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = db.Datasets.insert_one(new_doc)
        new_doc["_id"] = res.inserted_id
        db.datasets.insert_one(new_doc)

def get_dataset_metadata(user_id, file_hash):
    db = get_db()
    doc = db.Datasets.find_one({"user_id": str(user_id), "file_hash": file_hash})
    if not doc:
        doc = db.datasets.find_one({"user_id": str(user_id), "file_hash": file_hash})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

def clear_dataset_products(user_id, file_hash):
    import database_workspace
    database_workspace.clear_workspace_dataset(user_id, file_hash)

def bulk_insert_products(user_id, products_list, dataset_hash):
    # Stored in per-user workspace SQLite database instead of MongoDB
    pass

def bulk_insert_recommendations(user_id, recs_list, dataset_hash):
    import database_workspace
    database_workspace.bulk_insert_recommendations_sqlite(user_id, recs_list, dataset_hash)

def bulk_insert_anomalies(user_id, anoms_list, dataset_hash):
    import database_workspace
    database_workspace.bulk_insert_anomalies_sqlite(user_id, anoms_list, dataset_hash)

def calculate_database_stats(user_id, file_hash):
    import database_workspace
    return database_workspace.calculate_workspace_stats(user_id, file_hash)


def log_activity(user_id, action, details):
    db = get_db()
    db.ActivityLogs.insert_one({
        "user_id": str(user_id),
        "action": action,
        "description": details,
        "details": details,
        "created_at": datetime.utcnow(),
        "timestamp": datetime.utcnow()
    })
    db.activity_logs.insert_one({
        "user_id": str(user_id),
        "action": action,
        "details": details,
        "timestamp": datetime.utcnow()
    })

def add_user_notification(user_id, title, message):
    db = get_db()
    db.Notifications.insert_one({
        "user_id": str(user_id),
        "title": title,
        "message": message,
        "is_read": False,
        "read": False,
        "time": "Just now",
        "created_at": datetime.utcnow()
    })
    db.notifications.insert_one({
        "user_id": str(user_id),
        "title": title,
        "message": message,
        "read": False,
        "time": "Just now",
        "created_at": datetime.utcnow()
    })
