import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from models.preprocessing import load_and_preprocess_price_data

MODELS_DIR = os.path.dirname(os.path.abspath(__file__))

def train_and_evaluate():
    import time
    # Load and preprocess data
    X_train, X_test, y_train, y_test, _ = load_and_preprocess_price_data(is_training=True)
    
    print("Training Random Forest model (this may take a few seconds)...")
    # Using optimized parameters
    model = RandomForestRegressor(n_estimators=150, max_depth=20, min_samples_split=4, random_state=42, n_jobs=-1)
    
    start_train = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - start_train
    
    # Predict
    start_pred = time.time()
    predictions = model.predict(X_test)
    pred_time = time.time() - start_pred
    
    # Calculate metrics
    mse = mean_squared_error(y_test, predictions)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    # Print results
    print("\n============================")
    print("RANDOM FOREST REGRESSOR")
    print("============================")
    print(f"MSE: {mse:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"R2 SCORE: {r2:.4f}")
    print(f"TRAIN TIME: {train_time:.4f}s")
    print(f"PRED TIME: {pred_time:.4f}s")
    
    print("\nSample Predictions:")
    print(f"{'Actual Price':<15}{'Predicted Price':<15}")
    for act, pred in zip(y_test[:10].values, predictions[:10]):
        print(f"{act:<15.2f}{pred:<15.2f}")
        
    # Save model to saved_models
    saved_models_dir = os.path.join(os.path.dirname(MODELS_DIR), "saved_models")
    os.makedirs(saved_models_dir, exist_ok=True)
    model_path = os.path.join(saved_models_dir, "random_forest.pkl")
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}\n")
    
    return model, {
        "MSE": float(mse),
        "RMSE": float(rmse),
        "MAE": float(mae),
        "R2 Score": float(r2),
        "Train Time": float(train_time),
        "Prediction Time": float(pred_time)
    }

if __name__ == "__main__":
    train_and_evaluate()
