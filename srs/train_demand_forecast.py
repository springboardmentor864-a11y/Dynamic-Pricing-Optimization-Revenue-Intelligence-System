import os
import logging
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from src.config import REPORTS_DIR, MODELS_DIR, RANDOM_STATE

logger = logging.getLogger(__name__)

def build_demand_features(df):
    """
    Aggregates transactions into daily demand time-series and builds temporal lag & rolling features.
    """
    df_copy = df.copy()
    df_copy["date"] = pd.to_datetime(df_copy["order_purchase_timestamp"]).dt.date
    
    # Aggregate daily units ordered and revenue
    daily = df_copy.groupby("date").agg(
        daily_units=("num_items_ordered", "sum"),
        order_count=("order_id", "count"),
        total_revenue=("total_order_value", "sum")
    ).reset_index()
    
    # Ensure continuous date index by reindexing complete date range
    min_date = daily["date"].min()
    max_date = daily["date"].max()
    full_date_range = pd.date_range(start=min_date, end=max_date, freq="D").date
    
    daily_full = pd.DataFrame({"date": full_date_range})
    daily = pd.merge(daily_full, daily, on="date", how="left").fillna(0)
    
    daily["date_dt"] = pd.to_datetime(daily["date"])
    daily["day_of_week"] = daily["date_dt"].dt.dayofweek
    daily["day_of_month"] = daily["date_dt"].dt.day
    daily["month"] = daily["date_dt"].dt.month
    daily["quarter"] = daily["date_dt"].dt.quarter
    daily["is_weekend"] = daily["day_of_week"].apply(lambda d: 1 if d >= 5 else 0)
    
    # Lag features on daily units
    daily["lag_1"] = daily["daily_units"].shift(1)
    daily["lag_7"] = daily["daily_units"].shift(7)
    daily["lag_14"] = daily["daily_units"].shift(14)
    daily["lag_30"] = daily["daily_units"].shift(30)
    
    # Rolling window statistics
    daily["rolling_7_mean"] = daily["daily_units"].shift(1).rolling(7).mean()
    daily["rolling_30_mean"] = daily["daily_units"].shift(1).rolling(30).mean()
    daily["rolling_7_std"] = daily["daily_units"].shift(1).rolling(7).std()
    
    # Drop initial NaN rows created by lags
    daily_clean = daily.dropna().reset_index(drop=True)
    return daily_clean

def train_and_save_demand_model():
    """
    Trains, evaluates, and serializes the demand forecasting model.
    """
    dataset_path = REPORTS_DIR / "final_cleaned_dataset.csv"
    if not dataset_path.exists():
        logger.warning(f"Cleaned dataset not found at {dataset_path}. Skipping demand training.")
        return None
        
    logger.info("Loading cleaned dataset for Demand Forecast training...")
    df = pd.read_csv(dataset_path, low_memory=False)
    
    daily_df = build_demand_features(df)
    
    feature_cols = [
        "day_of_week", "day_of_month", "month", "quarter", "is_weekend",
        "lag_1", "lag_7", "lag_14", "lag_30", "rolling_7_mean", "rolling_30_mean", "rolling_7_std"
    ]
    target_col = "daily_units"
    
    # Chronological Train (80%) / Test (20%) split
    split_idx = int(len(daily_df) * 0.8)
    train_df = daily_df.iloc[:split_idx]
    test_df = daily_df.iloc[split_idx:]
    
    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_test, y_test = test_df[feature_cols], test_df[target_col]
    
    logger.info(f"Training Demand Forecasting Regressor (Train shape: {X_train.shape}, Test shape: {X_test.shape})...")
    model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=RANDOM_STATE, n_jobs=-1)
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    # MAPE handling zero denominators
    non_zero = y_test != 0
    mape = float(np.mean(np.abs((y_test[non_zero] - y_pred[non_zero]) / y_test[non_zero])) * 100) if np.any(non_zero) else 0.0
    
    residuals = y_test - y_pred
    residual_std = float(np.std(residuals))
    
    logger.info(f"Demand Model Evaluation Results -> MAE: {mae:.2f}, RMSE: {rmse:.2f}, R2: {r2:.4f}, MAPE: {mape:.2f}%")
    
    # Fit final model on complete dataset
    X_full = daily_df[feature_cols]
    y_full = daily_df[target_col]
    model.fit(X_full, y_full)
    
    # Save model artifact dictionary
    artifact = {
        "model": model,
        "feature_cols": feature_cols,
        "residual_std": residual_std,
        "metrics": {"MAE": float(mae), "RMSE": float(rmse), "R2": float(r2), "MAPE": float(mape)},
        "last_known_row": daily_df.iloc[-1].to_dict(),
        "recent_daily_history": daily_df["daily_units"].tail(60).tolist(),
        "last_date": str(daily_df["date"].max())
    }
    
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODELS_DIR / "demand_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(artifact, f)
        
    logger.info(f"Demand model successfully saved to {model_path}")
    return artifact

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_and_save_demand_model()
