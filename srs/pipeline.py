import os
import logging
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error, explained_variance_score
from tqdm import tqdm

from src.config import MODELS_DIR, REPORTS_DIR, RANDOM_STATE, TEST_SIZE
from src.data_loader import load_datasets
from src.preprocessor import preprocess_timestamps, clean_datasets, merge_datasets
from src.feature_engineering import engineer_features
from src.eda import run_eda_pipeline
from src.feature_selection import preprocess_and_select_features
from src.models import train_and_eval_model, tune_hyperparameters
from src.evaluation import (
    plot_actual_vs_predicted, plot_residuals, plot_residual_distribution,
    plot_error_histogram, plot_linear_fit_line, plot_feature_importance,
    plot_learning_curve, plot_validation_curve, plot_prediction_error,
    plot_feature_correlation_matrix, plot_model_comparison
)
from src.explainability import generate_shap_explanations
from src.train_demand_forecast import train_and_save_demand_model
from src.train_elasticity import train_and_save_elasticity_model

# Configure logging
LOG_FILE = os.path.join("logs", "pipeline.log")
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def run_pipeline():
    """
    Runs the complete production-grade machine learning pipeline from end to end.
    """
    try:
        logger.info("=========================================")
        logger.info("   STARTING OLIST E-COMMERCE ML PIPELINE  ")
        logger.info("=========================================")
        
        # 1. Dataset Loading
        logger.info("STEP 1: Dataset Loading...")
        raw_dfs = load_datasets()
        
        # 2. Data Preprocessing & Cleaning
        logger.info("STEP 2: Data Preprocessing & Cleaning...")
        preprocessed_dfs = preprocess_timestamps(raw_dfs)
        cleaned_dfs = clean_datasets(preprocessed_dfs)
        
        # 3. Dataset Merging
        logger.info("STEP 3: Dataset Merging...")
        master_df = merge_datasets(cleaned_dfs)
        
        # 4. Feature Engineering
        logger.info("STEP 4: Feature Engineering...")
        engineered_df = engineer_features(master_df)
        
        # 5. Save Final Cleaned Dataset
        logger.info("Saving final cleaned dataset...")
        # To avoid committing large CSVs, it is saved under outputs/reports/ which is ignored or light.
        # We also save a preview or sample if needed, but saving the full cleaned CSV is fine.
        final_csv_path = REPORTS_DIR / "final_cleaned_dataset.csv"
        # Only save a 20,000 row sample to final_cleaned_dataset.csv if we want to save space,
        # but the instructions say "Save: Final cleaned dataset". We will save the full dataset.
        engineered_df.to_csv(final_csv_path, index=False)
        logger.info(f"Final cleaned dataset saved to {final_csv_path} (Shape: {engineered_df.shape})")
        
        # 6. Exploratory Data Analysis
        logger.info("STEP 6: Exploratory Data Analysis & Profiling...")
        run_eda_pipeline(engineered_df, cleaned_dfs)
        
        # 7. Train/Test Split
        logger.info("STEP 7: Train/Test Split...")
        engineered_df = engineered_df.reset_index(drop=True)
        train_df, test_df = train_test_split(
            engineered_df, test_size=TEST_SIZE, random_state=RANDOM_STATE
        )
        
        # 8. Feature Selection, Encoding & Scaling
        logger.info("STEP 8: Feature Encoding, Scaling & Selection...")
        X_train_scaled, X_test_scaled, y_train, y_test, top_features, importance_df = preprocess_and_select_features(train_df, test_df)
        
        # Train on the top selected features
        X_train = X_train_scaled[top_features]
        X_test = X_test_scaled[top_features]
        logger.info(f"Train Shape: {X_train.shape}, Test Shape: {X_test.shape}")
        
        # Reconstruct combined datasets for validation plotting with unique indices
        X_model = pd.concat([X_train, X_test]).reset_index(drop=True)
        X_raw = X_model
        y = pd.concat([y_train, y_test]).reset_index(drop=True)
        
        # 9. Model Training & Comparison
        logger.info("STEP 9: Training 10 Regressors & Comparing Performance...")
        model_names = [
            "Linear Regression",
            "Ridge Regression",
            "Lasso Regression",
            "Decision Tree Regressor",
            "Random Forest Regressor",
            "Gradient Boosting Regressor",
            "XGBoost Regressor",
            "LightGBM Regressor",
            "CatBoost Regressor",
            "Extra Trees Regressor"
        ]
        
        results = []
        trained_models = {}
        predictions = {}
        
        # Using tqdm progress bar for model training
        for name in tqdm(model_names, desc="Training models"):
            try:
                model, y_pred, metrics = train_and_eval_model(name, X_train, X_test, y_train, y_test, run_cv=True)
                trained_models[name] = model
                predictions[name] = y_pred
                
                results.append({
                    "Model_Name": name,
                    "Training_Time": metrics["Training_Time"],
                    "Inference_Time": metrics["Inference_Time"],
                    "MAE": metrics["MAE"],
                    "RMSE": metrics["RMSE"],
                    "R2_Score": metrics["R2"],
                    "CV_Score": metrics["CV_Score"]
                })
            except Exception as model_err:
                logger.error(f"Error training {name}: {str(model_err)}")
                
        comparison_df = pd.DataFrame(results)
        # Rank models by R2 score (highest to lowest)
        comparison_df = comparison_df.sort_values(by="R2_Score", ascending=False).reset_index(drop=True)
        
        # Save comparison results
        comparison_df.to_csv(REPORTS_DIR / "model_comparison_report.csv", index=False)
        
        # Print comparison table
        logger.info("\n=======================================================")
        logger.info("               MODEL COMPARISON TABLE                 ")
        logger.info("=======================================================")
        for index, row in comparison_df.iterrows():
            logger.info(f"Rank {index+1}: {row['Model_Name']} | R2: {row['R2_Score']:.4f} | CV: {row['CV_Score']:.4f} | RMSE: {row['RMSE']:.2f}")
        logger.info("=======================================================")
        
        # Generate model comparison bar chart
        plot_model_comparison(comparison_df)
        
        # 10. Hyperparameter Tuning
        logger.info("STEP 10: Hyperparameter Tuning on Best Model...")
        best_model_row = comparison_df.iloc[0]
        best_model_name = best_model_row["Model_Name"]
        logger.info(f"Best performing model identified: {best_model_name}")
        
        tuned_model, best_params = tune_hyperparameters(X_train, y_train, best_model_name)
        
        # Evaluate Tuned Model
        y_pred_tuned = tuned_model.predict(X_test)
        tuned_r2 = r2_score(y_test, y_pred_tuned)
        logger.info(f"Tuned {best_model_name} R2 Score: {tuned_r2:.4f}")
        
        # 11. Model Visualisations
        logger.info("STEP 11: Generating Model Evaluation Plots...")
        # Act vs Pred
        plot_actual_vs_predicted(y_test, y_pred_tuned, f"Tuned {best_model_name}")
        # Residuals
        plot_residuals(y_test, y_pred_tuned, f"Tuned {best_model_name}")
        # Residual distribution KDE
        plot_residual_distribution(y_test, y_pred_tuned, f"Tuned {best_model_name}")
        # Error histogram
        plot_error_histogram(y_test, y_pred_tuned, f"Tuned {best_model_name}")
        # Prediction Error
        plot_prediction_error(y_test, y_pred_tuned, f"Tuned {best_model_name}")
        
        # Linear Regression Best Fit Line
        # Fit on a single prominent feature like the top select feature
        top_feature = top_features[0]
        logger.info(f"Generating Linear Regression best fit line for top feature: {top_feature}")
        plot_linear_fit_line(X_raw[top_feature], y, top_feature)
        
        # Feature Importance Plot
        if hasattr(tuned_model, "feature_importances_"):
            plot_feature_importance(tuned_model.feature_importances_, top_features, f"Tuned {best_model_name}")
        elif hasattr(tuned_model, "coef_"):
            plot_feature_importance(np.abs(tuned_model.coef_), top_features, f"Tuned {best_model_name}")
        
        # Feature correlation matrix
        plot_feature_correlation_matrix(X_raw[top_features])
        
        # Learning curve & Validation curve
        plot_learning_curve(tuned_model, X_model, y, f"Tuned {best_model_name}")
        
        # Validation curve for tuning hyperparameter
        if "XGBoost" in best_model_name or "LightGBM" in best_model_name:
            plot_validation_curve(tuned_model, X_model, y, "max_depth", [3, 5, 7, 9], f"Tuned {best_model_name}")
        else:
            plot_validation_curve(tuned_model, X_model, y, "alpha" if hasattr(tuned_model, "alpha") else "max_depth", [1.0, 5.0, 10.0], f"Tuned {best_model_name}")
            
        # 12. SHAP Explainability
        logger.info("STEP 12: Generating SHAP Explainability Plots...")
        generate_shap_explanations(tuned_model, X_train, X_test, f"Tuned {best_model_name}")
        
        # 13. Model Serialization
        logger.info("STEP 13: Exporting Best Model...")
        best_model_path = MODELS_DIR / "best_model.pkl"
        with open(best_model_path, "wb") as f:
            pickle.dump(tuned_model, f)
        logger.info(f"Best model serialized successfully and exported to {best_model_path}")
        
        # 14. Train Demand Forecasting Model & Price Elasticity Model
        logger.info("STEP 14: Training Demand Forecasting & Price Elasticity Models...")
        train_and_save_demand_model()
        train_and_save_elasticity_model()
        
        # 15. Export final pipeline reports
        logger.info("Generating final evaluation report...")
        report_text = f"===========================================\n"
        report_text += f"       OLIST ML PIPELINE EVALUATION REPORT  \n"
        report_text += f"===========================================\n"
        report_text += f"Best Model: {best_model_name}\n"
        report_text += f"Best Hyperparameters: {best_params}\n\n"
        report_text += f"Tuned Model Performance Metrics:\n"
        report_text += f" - MAE: {mean_absolute_error(y_test, y_pred_tuned):.4f}\n"
        report_text += f" - MSE: {mean_squared_error(y_test, y_pred_tuned):.4f}\n"
        report_text += f" - RMSE: {np.sqrt(mean_squared_error(y_test, y_pred_tuned)):.4f}\n"
        report_text += f" - R2 Score: {r2_score(y_test, y_pred_tuned):.4f}\n"
        report_text += f" - Explained Variance: {explained_variance_score(y_test, y_pred_tuned):.4f}\n\n"
        report_text += f"Model Rankings Summary:\n"
        report_text += comparison_df.to_string(index=False)
        
        with open(REPORTS_DIR / "final_evaluation_report.txt", "w") as f:
            f.write(report_text)
        logger.info("Final evaluation report saved successfully!")
        
        logger.info("=========================================")
        logger.info("   PIPELINE EXECUTION COMPLETED SUCCESSFULLY! ")
        logger.info("=========================================")
        
    except Exception as e:
        logger.error(f"Fatal error in pipeline execution: {str(e)}")
        raise e

if __name__ == "__main__":
    run_pipeline()
