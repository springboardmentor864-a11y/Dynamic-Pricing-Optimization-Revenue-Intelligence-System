import os
import joblib
import json
import pandas as pd
from backend.ml.preprocessing import load_data, preprocess_pipeline
from backend.ml.linear_regression import train_linear_regression
from backend.ml.decision_tree_regressor import train_decision_tree
from backend.ml.random_forest_regressor import train_random_forest
from backend.ml.xgboost_regressor import train_xgboost

# Define paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)
METRICS_PATH = os.path.join(MODELS_DIR, "metrics_comparison.json")

def run_training_pipeline(dataset_path=None):
    """Orchestrates loading, preprocessing, training, comparing, and saving the best model."""
    if dataset_path is None:
        # Default path
        project_root = os.path.dirname(BASE_DIR)
        dataset_path = os.path.join(project_root, "dataset", "final_price_prediction_dataset.csv")
        
    print(f"Starting model training pipeline with dataset: {dataset_path}")
    
    # 1. Load Data
    df = load_data(dataset_path)
    print(f"Dataset Loaded. Columns: {df.columns.tolist()}")
    
    # 2. Preprocess Data
    X_train_scaled, X_test_scaled, y_train, y_test, preprocessor_state = preprocess_pipeline(df, is_training=True)
    
    # Dictionary to hold models and metrics
    trained_models = {}
    metrics_summary = {}
    
    # 3. Train models
    # Linear Regression
    lr_model, lr_metrics = train_linear_regression(X_train_scaled, y_train, X_test_scaled, y_test)
    trained_models["Linear Regression"] = lr_model
    metrics_summary["Linear Regression"] = lr_metrics
    
    # Decision Tree Regressor
    dt_model, dt_metrics = train_decision_tree(X_train_scaled, y_train, X_test_scaled, y_test)
    trained_models["Decision Tree Regressor"] = dt_model
    metrics_summary["Decision Tree Regressor"] = {
        "MSE": dt_metrics["MSE"],
        "RMSE": dt_metrics["RMSE"],
        "MAE": dt_metrics["MAE"],
        "R2 Score": dt_metrics["R2 Score"]
    }
    
    # Random Forest Regressor
    rf_model, rf_metrics = train_random_forest(X_train_scaled, y_train, X_test_scaled, y_test)
    trained_models["Random Forest Regressor"] = rf_model
    metrics_summary["Random Forest Regressor"] = {
        "MSE": rf_metrics["MSE"],
        "RMSE": rf_metrics["RMSE"],
        "MAE": rf_metrics["MAE"],
        "R2 Score": rf_metrics["R2 Score"]
    }
    
    # XGBoost Regressor
    xgb_model, xgb_metrics = train_xgboost(X_train_scaled, y_train, X_test_scaled, y_test)
    trained_models["XGBoost Regressor"] = xgb_model
    metrics_summary["XGBoost Regressor"] = {
        "MSE": xgb_metrics["MSE"],
        "RMSE": xgb_metrics["RMSE"],
        "MAE": xgb_metrics["MAE"],
        "R2 Score": xgb_metrics["R2 Score"]
    }
    
    # 4. Display Outputs in the exact format required
    for name, metrics in metrics_summary.items():
        print("\n================================")
        print(f"Model Name:\n{name}")
        print("--------------------------------")
        print(f"MSE:\n{metrics['MSE']:.4f}")
        print(f"RMSE:\n{metrics['RMSE']:.4f}")
        print(f"MAE:\n{metrics['MAE']:.4f}")
        print(f"R2 Score:\n{metrics['R2 Score']:.4f}")
        print("================================\n")
        
    # 5. Select the best model (Highest R2, Lowest MSE)
    best_name = None
    best_r2 = -float("inf")
    best_mse = float("inf")
    
    for name, metrics in metrics_summary.items():
        r2 = metrics["R2 Score"]
        mse = metrics["MSE"]
        
        if r2 > best_r2:
            best_r2 = r2
            best_mse = mse
            best_name = name
        elif r2 == best_r2:
            if mse < best_mse:
                best_mse = mse
                best_name = name
                
    best_model = trained_models[best_name]
    print(f"Best Model Selected: {best_name} (R2: {best_r2:.4f}, MSE: {best_mse:.2f})")
    
    # 6. Save the best model and parameters
    best_model_path_1 = os.path.join(MODELS_DIR, "best_price_prediction_model.pkl")
    best_model_path_2 = os.path.join(MODELS_DIR, "saved_model.pkl")
    
    # Save best model object
    joblib.dump(best_model, best_model_path_1)
    joblib.dump(best_model, best_model_path_2)
    print(f"Saved best model to {best_model_path_1} and {best_model_path_2}")
    
    # Save model selection metadata
    metadata = {
        "best_model_name": best_name,
        "metrics": metrics_summary[best_name]
    }
    with open(os.path.join(MODELS_DIR, "best_model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=4)
        
    # Save all comparison metrics for the metrics API
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics_summary, f, indent=4)
        
    return {
        "best_model": best_name,
        "best_metrics": metrics_summary[best_name],
        "all_metrics": metrics_summary
    }

if __name__ == "__main__":
    run_training_pipeline()
