import os
import logging
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LinearRegression

from src.config import REPORTS_DIR, MODELS_DIR

logger = logging.getLogger(__name__)

def train_and_save_elasticity_model():
    """
    Fits empirical log-log price elasticity models per product category based on historical order transactions.
    log(Quantity) = alpha + elasticity * log(Price)
    """
    dataset_path = REPORTS_DIR / "final_cleaned_dataset.csv"
    if not dataset_path.exists():
        logger.warning(f"Cleaned dataset not found at {dataset_path}. Skipping elasticity fitting.")
        return None

    logger.info("Loading dataset for Price Elasticity model fitting...")
    df = pd.read_csv(dataset_path, low_memory=False)

    # Calculate elasticity per category
    elasticities = {}
    
    # Global fallback elasticity
    df_valid = df[(df["total_price"] > 0) & (df["num_items_ordered"] > 0)].copy()
    if len(df_valid) > 10:
        log_p = np.log(df_valid["total_price"])
        log_q = np.log(df_valid["num_items_ordered"])
        lr = LinearRegression()
        lr.fit(log_p.values.reshape(-1, 1), log_q.values)
        global_elasticity = float(lr.coef_[0])
        # Bound global elasticity between -3.0 and -0.2 for market realism
        global_elasticity = float(np.clip(global_elasticity, -3.0, -0.5))
    else:
        global_elasticity = -1.25

    logger.info(f"Fitted Global Price Elasticity: {global_elasticity:.4f}")

    # Category level elasticities
    if "product_category_name_english" in df.columns:
        cat_groups = df_valid.groupby("product_category_name_english")
        for cat, group in cat_groups:
            if len(group) >= 20:
                log_p_cat = np.log(group["total_price"])
                log_q_cat = np.log(group["num_items_ordered"])
                lr_cat = LinearRegression()
                lr_cat.fit(log_p_cat.values.reshape(-1, 1), log_q_cat.values)
                e_val = float(lr_cat.coef_[0])
                # Clip elasticity to realistic range [-3.5, -0.3]
                e_val = float(np.clip(e_val, -3.5, -0.3))
                elasticities[cat] = e_val

    artifact = {
        "global_elasticity": global_elasticity,
        "category_elasticities": elasticities
    }

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODELS_DIR / "elasticity_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(artifact, f)

    logger.info(f"Price Elasticity model saved to {model_path} ({len(elasticities)} category elasticities)")
    return artifact

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_and_save_elasticity_model()
