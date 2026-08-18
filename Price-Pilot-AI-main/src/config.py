import os
from pathlib import Path

# Project root path (Price-Pilot-AI)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Outputs directory structure
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
PLOTS_DIR = OUTPUTS_DIR / "plots"
REPORTS_DIR = OUTPUTS_DIR / "reports"
MODELS_DIR = OUTPUTS_DIR / "models"
SHAP_DIR = OUTPUTS_DIR / "shap"
FEATURE_IMPORTANCE_DIR = OUTPUTS_DIR / "feature_importance"
LOGS_DIR = PROJECT_ROOT / "logs"

# Ensure directories exist
for directory in [PLOTS_DIR, REPORTS_DIR, MODELS_DIR, SHAP_DIR, FEATURE_IMPORTANCE_DIR, LOGS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Dataset path detection
DATASET_CANDIDATES = [
    PROJECT_ROOT.parent / "Brazilian dataset",
    PROJECT_ROOT / "data",
    Path("C:/Users/Akhil's-OMEN/Desktop/Infosys Intern/Brazilian dataset"),
    Path("/workspace/Brazilian dataset")
]

DATA_DIR = None
for candidate in DATASET_CANDIDATES:
    if candidate.exists() and any(candidate.glob("*.csv")):
        DATA_DIR = candidate
        break

if not DATA_DIR:
    # Default to data folder in project if not found elsewhere
    DATA_DIR = PROJECT_ROOT / "data"
    DATA_DIR.mkdir(parents=True, exist_ok=True)

# Required files
REQUIRED_FILES = [
    "olist_orders_dataset.csv",
    "olist_order_items_dataset.csv",
    "olist_products_dataset.csv",
    "olist_customers_dataset.csv",
    "olist_sellers_dataset.csv",
    "olist_order_reviews_dataset.csv",
    "olist_order_payments_dataset.csv",
    "olist_geolocation_dataset.csv",
    "product_category_name_translation.csv"
]

# Random seed for reproducibility
RANDOM_STATE = 42

# ML Settings
TEST_SIZE = 0.2
CV_FOLDS = 5
TARGET_COLUMN = "total_order_value"
