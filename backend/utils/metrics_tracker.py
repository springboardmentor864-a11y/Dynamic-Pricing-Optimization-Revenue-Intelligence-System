import os
import json
import datetime
from typing import Dict, Any

# Root folder paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRAINED_MODELS_DIR = os.path.join(BASE_DIR, "trained_models")
os.makedirs(TRAINED_MODELS_DIR, exist_ok=True)

METRICS_PATH = os.path.join(TRAINED_MODELS_DIR, "metrics.json")

# Sensible default/fallback stats in case metrics.json is completely empty initially
DEFAULT_DASHBOARD_STATS = {
    "dataset_records": 112650,
    "gross_revenue": 15843553.24,
    "total_products": 32951,
    "average_price": 120.65,
    "best_model": "XGBoost Regressor",
    "r2_score": 0.8228,
    "mse": 727.30,
    "rmse": 26.97,
    "mae": 15.48,
    "train_time": 10.53,
    "prediction_time": 0.00016,  # in seconds (0.16 ms)
    "latest_training_date": "N/A"
}

def load_metrics_file() -> Dict[str, Any]:
    """Loads the main metrics.json file from disk, returning fallbacks if missing."""
    if not os.path.exists(METRICS_PATH):
        # Create empty initial template if missing
        initial_data = {
            "models": {},
            "dashboard_stats": DEFAULT_DASHBOARD_STATS
        }
        save_metrics_file(initial_data)
        return initial_data
        
    try:
        with open(METRICS_PATH, "r") as f:
            data = json.load(f)
            # Ensure proper keys exist
            if "models" not in data:
                data["models"] = {}
            if "dashboard_stats" not in data:
                data["dashboard_stats"] = DEFAULT_DASHBOARD_STATS
            return data
    except Exception as e:
        print(f"Error reading metrics.json: {str(e)}")
        return {
            "models": {},
            "dashboard_stats": DEFAULT_DASHBOARD_STATS
        }

def save_metrics_file(data: Dict[str, Any]) -> None:
    """Saves the metrics dictionary to trained_models/metrics.json."""
    try:
        with open(METRICS_PATH, "w") as f:
            json.dump(data, f, indent=4)
        print(f"Successfully saved metrics to {METRICS_PATH}")
    except Exception as e:
        print(f"Failed to save metrics.json: {str(e)}")

def update_model_metrics(
    model_name: str, 
    metrics: Dict[str, float], 
    dataset_info: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Updates the metrics for a single model in metrics.json, recalculates the winner,
    re-computes dashboard stats, and saves everything back to disk.
    """
    data = load_metrics_file()
    
    # Store or update this model's metrics
    data["models"][model_name] = {
        "R2 Score": metrics.get("R2 Score", 0.0),
        "R²": metrics.get("R2 Score", 0.0), # Duplicate for convenience
        "MSE": metrics.get("MSE", 0.0),
        "RMSE": metrics.get("RMSE", 0.0),
        "MAE": metrics.get("MAE", 0.0),
        "Train Time": metrics.get("Train Time", 0.0),
        "Training Time": metrics.get("Train Time", 0.0), # Duplicate for convenience
        "Prediction Time": metrics.get("Prediction Time", 0.0),
        "Model Name": model_name,
        "Winner": False
    }
    
    # Recalculate winner automatically (Highest R2, Lowest MSE)
    best_name = None
    best_r2 = -float("inf")
    best_mse = float("inf")
    
    for m_name, m_val in data["models"].items():
        r2 = m_val.get("R2 Score", -9999.0)
        mse = m_val.get("MSE", 999999.0)
        if r2 > best_r2:
            best_r2 = r2
            best_mse = mse
            best_name = m_name
        elif r2 == best_r2:
            if mse < best_mse:
                best_mse = mse
                best_name = m_name
                
    # Update Winner flags
    for m_name in data["models"]:
        data["models"][m_name]["Winner"] = (m_name == best_name)
        
    # Update dashboard stats
    db_stats = data["dashboard_stats"]
    
    # If new dataset info is provided (e.g. calculated during training), update it
    if dataset_info:
        db_stats["dataset_records"] = dataset_info.get("dataset_records", db_stats["dataset_records"])
        db_stats["gross_revenue"] = dataset_info.get("gross_revenue", db_stats["gross_revenue"])
        db_stats["total_products"] = dataset_info.get("total_products", db_stats["total_products"])
        db_stats["average_price"] = dataset_info.get("average_price", db_stats["average_price"])
        
    # Update champion metrics on the dashboard
    if best_name:
        champ_metrics = data["models"][best_name]
        db_stats["best_model"] = best_name
        db_stats["r2_score"] = champ_metrics["R2 Score"]
        db_stats["mse"] = champ_metrics["MSE"]
        db_stats["rmse"] = champ_metrics["RMSE"]
        db_stats["mae"] = champ_metrics["MAE"]
        db_stats["train_time"] = champ_metrics["Train Time"]
        db_stats["prediction_time"] = champ_metrics["Prediction Time"]
        
    db_stats["latest_training_date"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    save_metrics_file(data)
    return data
