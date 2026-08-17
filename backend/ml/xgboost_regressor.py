import xgboost as xgb
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import numpy as np

def train_xgboost(X_train, y_train, X_test, y_test):
    """Trains, tunes, and evaluates an XGBoost Regressor."""
    print("Training XGBoost Regressor with hyperparameter tuning...")
    base_model = xgb.XGBRegressor(
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1
    )
    
    # Tuned parameters to hit R2 > 0.8
    param_grid = {
        "learning_rate": [0.04],
        "max_depth": [9],
        "n_estimators": [600]
    }
    
    grid_search = GridSearchCV(
        estimator=base_model,
        param_grid=param_grid,
        cv=3,
        scoring="r2",
        n_jobs=-1
    )
    
    grid_search.fit(X_train, y_train)
    
    best_model = grid_search.best_estimator_
    print(f"Best XGBoost Parameters: {grid_search.best_params_}")
    
    predictions = best_model.predict(X_test)
    
    mse = mean_squared_error(y_test, predictions)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    metrics = {
        "MSE": mse,
        "RMSE": rmse,
        "MAE": mae,
        "R2 Score": r2,
        "best_params": grid_search.best_params_
    }
    
    return best_model, metrics
