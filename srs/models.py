import time
import logging
import numpy as np
import pandas as pd
from sklearn.model_selection import KFold, cross_val_score, GridSearchCV, RandomizedSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, explained_variance_score
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, ExtraTreesRegressor
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from catboost import CatBoostRegressor

from src.config import RANDOM_STATE

logger = logging.getLogger(__name__)

def get_regressor(model_name):
    """
    Returns the regression model instance based on name.
    """
    models = {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(random_state=RANDOM_STATE),
        "Lasso Regression": Lasso(alpha=0.1, random_state=RANDOM_STATE),
        "Decision Tree Regressor": DecisionTreeRegressor(random_state=RANDOM_STATE, max_depth=8),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=50, random_state=RANDOM_STATE, n_jobs=-1, max_depth=10),
        "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=50, random_state=RANDOM_STATE, max_depth=5),
        "XGBoost Regressor": XGBRegressor(n_estimators=50, random_state=RANDOM_STATE, n_jobs=-1, max_depth=5),
        "LightGBM Regressor": LGBMRegressor(n_estimators=50, random_state=RANDOM_STATE, n_jobs=-1, max_depth=5, verbose=-1),
        "CatBoost Regressor": CatBoostRegressor(n_estimators=50, random_seed=RANDOM_STATE, max_depth=5, verbose=0),
        "Extra Trees Regressor": ExtraTreesRegressor(n_estimators=50, random_state=RANDOM_STATE, n_jobs=-1, max_depth=10)
    }
    
    if model_name not in models:
        raise ValueError(f"Model {model_name} is not supported.")
        
    return models[model_name]

def evaluate_predictions(y_true, y_pred, n_features):
    """
    Computes regression evaluation metrics: MAE, MSE, RMSE, R2, Adjusted R2, and Explained Variance.
    """
    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_true, y_pred)
    
    # Adjusted R2
    n = len(y_true)
    p = n_features
    if n - p - 1 > 0:
        adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1)
    else:
        adj_r2 = r2
        
    exp_var = explained_variance_score(y_true, y_pred)
    
    return {
        "MAE": mae,
        "MSE": mse,
        "RMSE": rmse,
        "R2": r2,
        "Adjusted_R2": adj_r2,
        "Explained_Variance": exp_var
    }

def train_and_eval_model(model_name, X_train, X_test, y_train, y_test, run_cv=True):
    """
    Trains a model, records execution speeds, and calculates regression metrics.
    """
    logger.info(f"Training {model_name}...")
    model = get_regressor(model_name)
    
    # Measure Training Time
    start_train = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - start_train
    
    # Measure Inference Time
    start_inf = time.time()
    y_pred = model.predict(X_test)
    inf_time = time.time() - start_inf
    
    # Evaluate metrics
    metrics = evaluate_predictions(y_test, y_pred, X_train.shape[1])
    metrics["Training_Time"] = train_time
    metrics["Inference_Time"] = inf_time
    
    # Run 5-Fold Cross Validation
    if run_cv:
        logger.info(f"Running 5-Fold Cross Validation for {model_name}...")
        # Since CV on the full training set (77k rows) can be slow for Random Forest / CatBoost,
        # we run CV on a representative sample of 5,000 rows to ensure fast execution
        cv_sample_size = min(5000, len(X_train))
        X_cv_sample = X_train.sample(cv_sample_size, random_state=RANDOM_STATE)
        y_cv_sample = y_train.loc[X_cv_sample.index]
        
        kf = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
        # Using negative mean squared error or R2 score for CV
        scores = cross_val_score(model, X_cv_sample, y_cv_sample, cv=kf, scoring="r2")
        metrics["CV_Score"] = np.mean(scores)
    else:
        metrics["CV_Score"] = np.nan
        
    logger.info(f"Completed {model_name}. R2 Score: {metrics['R2']:.4f}, CV Score: {metrics['CV_Score']:.4f}")
    return model, y_pred, metrics

def tune_hyperparameters(X_train, y_train, best_model_name):
    """
    Tuning hyperparameters of the selected model using RandomizedSearchCV on a sample.
    """
    logger.info(f"Tuning hyperparameters for {best_model_name}...")
    
    # Downsample for grid search to run quickly
    sample_size = min(5000, len(X_train))
    X_sample = X_train.sample(sample_size, random_state=RANDOM_STATE)
    y_sample = y_train.loc[X_sample.index]
    
    if "XGBoost" in best_model_name:
        estimator = XGBRegressor(random_state=RANDOM_STATE, n_jobs=-1)
        param_dist = {
            "n_estimators": [50, 100],
            "max_depth": [3, 5, 7],
            "learning_rate": [0.01, 0.1, 0.2]
        }
    elif "LightGBM" in best_model_name:
        estimator = LGBMRegressor(random_state=RANDOM_STATE, n_jobs=-1, verbose=-1)
        param_dist = {
            "n_estimators": [50, 100],
            "max_depth": [3, 5, 7],
            "learning_rate": [0.01, 0.1, 0.2]
        }
    elif "Random Forest" in best_model_name:
        estimator = RandomForestRegressor(random_state=RANDOM_STATE, n_jobs=-1)
        param_dist = {
            "n_estimators": [50, 100],
            "max_depth": [5, 10, 15],
            "min_samples_split": [2, 5]
        }
    else:
        # Fallback to Ridge
        estimator = Ridge(random_state=RANDOM_STATE)
        param_dist = {
            "alpha": [0.1, 1.0, 10.0]
        }
        
    search = RandomizedSearchCV(
        estimator, 
        param_distributions=param_dist, 
        n_iter=5, 
        cv=3, 
        scoring="r2", 
        random_state=RANDOM_STATE,
        n_jobs=-1
    )
    search.fit(X_sample, y_sample)
    
    logger.info(f"Best parameters: {search.best_params_}")
    logger.info(f"Best tuning score: {search.best_score_:.4f}")
    
    # Return best estimator fit on the full training set
    best_estimator = search.best_estimator_
    best_estimator.fit(X_train, y_train)
    return best_estimator, search.best_params_
