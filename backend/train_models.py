# ==========================================================
# PricePilot AI
# Module 5 - Machine Learning Model Training
# ==========================================================

# =========================
# Import Required Libraries
# =========================

import os
import joblib
import numpy as np
import pandas as pd

from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor

from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from catboost import CatBoostRegressor

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

# =========================
# Load Processed Dataset
# =========================

print("=" * 60)
print("MODEL TRAINING")
print("=" * 60)

X_train = pd.read_csv("../dataset/X_train.csv")
X_test = pd.read_csv("../dataset/X_test.csv")

y_train = pd.read_csv("../dataset/y_train.csv").squeeze()
y_test = pd.read_csv("../dataset/y_test.csv").squeeze()

print("\nDatasets Loaded Successfully!")

print("X_train Shape :", X_train.shape)
print("X_test Shape  :", X_test.shape)
print("y_train Shape :", y_train.shape)
print("y_test Shape  :", y_test.shape)

print("\nDataset Loading Completed Successfully!")

# =========================
# Define Machine Learning Models
# =========================

models = {

    "Linear Regression": LinearRegression(),

    "Decision Tree": DecisionTreeRegressor(
        random_state=42
    ),

    "Random Forest": RandomForestRegressor(
        n_estimators=100,
        random_state=42
    ),

    "Extra Trees": ExtraTreesRegressor(
        n_estimators=100,
        random_state=42
    ),

    "XGBoost": XGBRegressor(
        objective="reg:squarederror",
        random_state=42
    ),

    "LightGBM": LGBMRegressor(
        random_state=42
    ),

    "CatBoost": CatBoostRegressor(
        verbose=0,
        random_state=42
    )

}

print("\nAll Machine Learning Models Created Successfully!")
print("Total Models :", len(models))

# =========================
# Train Models
# =========================

results = []

print("\nTraining Models...\n")

for model_name, model in models.items():

    print(f"Training {model_name}...")

    # Train the model
    model.fit(X_train, y_train)

    # Predict
    predictions = model.predict(X_test)

    # Evaluation Metrics
    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, predictions)

    # Store Results
    results.append({
        "Model": model_name,
        "MAE": round(mae, 4),
        "MSE": round(mse, 4),
        "RMSE": round(rmse, 4),
        "R2 Score": round(r2, 4)
    })

print("\nAll Models Trained Successfully!")

# =========================
# Model Comparison
# =========================

results_df = pd.DataFrame(results)

print("\n")
print("=" * 70)
print("MODEL COMPARISON")
print("=" * 70)

print(results_df)

# =========================
# Save Comparison Report
# =========================

os.makedirs("../models", exist_ok=True)

results_df.to_csv(
    "../models/model_comparison.csv",
    index=False
)

print("\nModel comparison saved successfully!")
print("Location : ../models/model_comparison.csv")

print("\nModule 5 Completed Successfully!")
# ==========================================================
# Save the Best Model
# ==========================================================

best_model_name = "Extra Trees"
best_model = models[best_model_name]

os.makedirs("../trained_models", exist_ok=True)

joblib.dump(
    best_model,
    "../trained_models/best_price_model.pkl"
)

print("\nBest Model Saved Successfully!")
print("Best Model :", best_model_name)
print("Location   : ../trained_models/best_price_model.pkl")