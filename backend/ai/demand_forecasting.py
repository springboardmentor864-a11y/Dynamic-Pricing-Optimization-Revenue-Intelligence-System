import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.neural_network import MLPRegressor

try:
    import xgboost as xgb
except ImportError:
    xgb = None

try:
    import lightgbm as lgb
except ImportError:
    lgb = None

try:
    from catboost import CatBoostRegressor
except ImportError:
    CatBoostRegressor = None

def get_model_path(user_id):
    path = f"models/{user_id}/demand_model.pkl"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path

def train_demand_model(df, user_id):
    required = ["price", "stock", "revenue", "sales"]

    for col in required:
        if col not in df.columns:
            return False

    X = df[["price", "stock", "revenue"]].fillna(0)
    y = df["sales"].fillna(0)
    model_path = get_model_path(user_id)

    if len(df) < 5:
        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X, y)
        joblib.dump({"model": model, "type": "Random Forest", "score": 1.0}, model_path)
        return True

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    models_to_compare = {}
    
    # 1. Random Forest
    rf = RandomForestRegressor(n_estimators=25, max_depth=6, random_state=42)
    rf.fit(X_train, y_train)
    models_to_compare["Random Forest"] = (rf, rf.score(X_val, y_val))

    # 2. MLP Deep Learning (Neural Net) - optimized iterations and hidden layers for speed
    mlp = MLPRegressor(hidden_layer_sizes=(32, 16), max_iter=25, random_state=42, early_stopping=True)
    try:
        mlp.fit(X_train, y_train)
        models_to_compare["Deep Learning (MLP)"] = (mlp, mlp.score(X_val, y_val))
    except Exception:
        pass

    # 3. XGBoost
    if xgb is not None:
        try:
            xgbr = xgb.XGBRegressor(n_estimators=25, max_depth=4, random_state=42, verbosity=0)
            xgbr.fit(X_train, y_train)
            models_to_compare["XGBoost"] = (xgbr, xgbr.score(X_val, y_val))
        except Exception:
            pass

    # 4. LightGBM
    if lgb is not None:
        try:
            lgbr = lgb.LGBMRegressor(n_estimators=25, max_depth=4, random_state=42, verbose=-1)
            lgbr.fit(X_train, y_train)
            models_to_compare["LightGBM"] = (lgbr, lgbr.score(X_val, y_val))
        except Exception:
            pass

    # 5. CatBoost
    if CatBoostRegressor is not None:
        try:
            catr = CatBoostRegressor(iterations=25, depth=4, random_state=42, verbose=0)
            catr.fit(X_train, y_train)
            models_to_compare["CatBoost"] = (catr, catr.score(X_val, y_val))
        except Exception:
            pass

    # Compare and select best
    best_name = "Random Forest"
    best_model, best_score = models_to_compare["Random Forest"]

    for name, (model, score) in models_to_compare.items():
        if score > best_score:
            best_score = score
            best_name = name
            best_model = model

    print(f"[AI] Demand Forecasting Model Winner for {user_id}: {best_name} (R2 Score: {best_score:.4f})")

    joblib.dump({
        "model": best_model,
        "type": best_name,
        "score": float(best_score)
    }, model_path)

    return True

def forecast_demand(price, stock, revenue, user_id):
    model_path = get_model_path(user_id)
    if not os.path.exists(model_path):
        return None

    try:
        data = joblib.load(model_path)
        model = data["model"]
        prediction = model.predict([[price, stock, revenue]])
        return float(prediction[0])
    except Exception:
        return None