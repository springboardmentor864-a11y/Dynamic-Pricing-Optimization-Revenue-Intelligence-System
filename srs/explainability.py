import logging
import os
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
import pickle
from src.config import SHAP_DIR

logger = logging.getLogger(__name__)

def generate_shap_explanations(best_model, X_train, X_test, model_name):
    """
    Computes SHAP values and generates Summary, Beeswarm, and Waterfall plots.
    """
    try:
        logger.info(f"Generating SHAP explanations for {model_name}...")
        
        # Subsample test data for SHAP computation (500 rows for speed and visual clarity)
        sample_size = min(500, len(X_test))
        X_sample = X_test.sample(sample_size, random_state=42)
        
        # Initialize explainer
        logger.info("Initializing SHAP Explainer...")
        
        # Select TreeExplainer for tree models, and general Kernel/Linear explainer for others
        is_tree = any(term in model_name for term in ["Random Forest", "Gradient Boosting", "XGBoost", "LightGBM", "CatBoost", "Decision Tree", "Extra Trees"])
        
        # Use shap.Explainer (recommends TreeExplainer or LinearExplainer automatically)
        explainer = shap.Explainer(best_model, X_sample)
        
        logger.info("Computing SHAP values...")
        shap_values = explainer(X_sample)
        
        # Save SHAP values to file
        SHAP_DIR.mkdir(parents=True, exist_ok=True)
        with open(SHAP_DIR / "shap_values.pkl", "wb") as f:
            pickle.dump(shap_values, f)
        logger.info(f"SHAP values saved to {SHAP_DIR / 'shap_values.pkl'}")
        
        # Save raw SHAP values as a DataFrame summary
        shap_df = pd.DataFrame(shap_values.values, columns=X_sample.columns)
        shap_df.to_csv(SHAP_DIR / "shap_values_summary.csv", index=False)
        
        # 1. SHAP Summary Plot
        logger.info("Generating SHAP Summary Plot...")
        plt.figure(figsize=(10, 6))
        # Clear current figure
        plt.clf()
        shap.summary_plot(shap_values.values, X_sample, show=False)
        plt.title(f"SHAP Summary Plot - {model_name}", fontsize=14, pad=15)
        plt.tight_layout()
        plt.savefig(SHAP_DIR / "shap_summary_plot.png", dpi=300)
        plt.close()
        
        # 2. SHAP Beeswarm Plot
        logger.info("Generating SHAP Beeswarm Plot...")
        plt.figure(figsize=(10, 6))
        plt.clf()
        shap.plots.beeswarm(shap_values, show=False)
        plt.title(f"SHAP Beeswarm Plot - {model_name}", fontsize=14, pad=15)
        plt.tight_layout()
        plt.savefig(SHAP_DIR / "shap_beeswarm_plot.png", dpi=300)
        plt.close()
        
        # 3. SHAP Waterfall Plot
        logger.info("Generating SHAP Waterfall Plot...")
        plt.figure(figsize=(10, 6))
        plt.clf()
        # Create waterfall plot for the first observation in sample
        shap.plots.waterfall(shap_values[0], show=False)
        plt.title(f"SHAP Waterfall Plot (First Observation) - {model_name}", fontsize=14, pad=15)
        plt.tight_layout()
        plt.savefig(SHAP_DIR / "shap_waterfall_plot.png", dpi=300)
        plt.close()
        
        logger.info("SHAP explainability plots generated successfully!")
    except Exception as e:
        logger.error(f"Error generating SHAP explanations: {str(e)}")
        # Log error and proceed so pipeline doesn't crash completely on SHAP details
        logger.warning("Continuing pipeline without SHAP plots.")
