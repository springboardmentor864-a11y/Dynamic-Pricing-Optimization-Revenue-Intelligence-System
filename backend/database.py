import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
DATASET_FOLDER = os.path.join(BASE_DIR, "datasets")
MODEL_FOLDER = os.path.join(BASE_DIR, "models")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATASET_FOLDER, exist_ok=True)
os.makedirs(MODEL_FOLDER, exist_ok=True)

LATEST_DATASET = os.path.join(
    DATASET_FOLDER,
    "latest_dataset.csv"
)

PRICE_MODEL = os.path.join(
    MODEL_FOLDER,
    "price_model.pkl"
)

DEMAND_MODEL = os.path.join(
    MODEL_FOLDER,
    "demand_model.pkl"
)

USERS_DB = os.path.join(
    BASE_DIR,
    "users.json"
)