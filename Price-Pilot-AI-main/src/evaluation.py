import logging
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
from sklearn.model_selection import learning_curve, validation_curve
from src.config import PLOTS_DIR

logger = logging.getLogger(__name__)

# Premium color palette
PREMIUM_COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"]

def plot_actual_vs_predicted(y_true, y_pred, model_name):
    """
    Generates Actual vs Predicted scatter plot.
    """
    plt.figure(figsize=(8, 6))
    sns.scatterplot(x=y_true, y=y_pred, alpha=0.5, color=PREMIUM_COLORS[0])
    # Add identity line
    min_val = min(y_true.min(), y_pred.min())
    max_val = max(y_true.max(), y_pred.max())
    plt.plot([min_val, max_val], [min_val, max_val], 'r--', lw=2, label="Perfect Fit")
    
    plt.title(f"Actual vs Predicted Values - {model_name}")
    plt.xlabel("Actual Values (BRL)")
    plt.ylabel("Predicted Values (BRL)")
    plt.xscale("log")
    plt.yscale("log")
    plt.legend()
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "actual_vs_predicted.png", dpi=300)
    plt.close()
    logger.info("Actual vs Predicted plot saved.")

def plot_residuals(y_true, y_pred, model_name):
    """
    Generates Residual Plot (Residuals vs Predicted).
    """
    residuals = y_true - y_pred
    plt.figure(figsize=(8, 6))
    sns.scatterplot(x=y_pred, y=residuals, alpha=0.5, color=PREMIUM_COLORS[1])
    plt.axhline(y=0, color='r', linestyle='--', lw=2)
    
    plt.title(f"Residual Plot - {model_name}")
    plt.xlabel("Predicted Values (BRL)")
    plt.ylabel("Residuals (BRL)")
    plt.xscale("log")
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "residual_plot.png", dpi=300)
    plt.close()
    logger.info("Residual plot saved.")

def plot_residual_distribution(y_true, y_pred, model_name):
    """
    Generates Residual Distribution KDE.
    """
    residuals = y_true - y_pred
    plt.figure(figsize=(8, 6))
    sns.kdeplot(residuals, fill=True, color=PREMIUM_COLORS[2])
    plt.axvline(x=0, color='r', linestyle='--')
    
    plt.title(f"Residual Distribution - {model_name}")
    plt.xlabel("Residuals (BRL)")
    plt.ylabel("Density")
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "residual_distribution.png", dpi=300)
    plt.close()
    logger.info("Residual distribution plot saved.")

def plot_error_histogram(y_true, y_pred, model_name):
    """
    Generates Error Histogram.
    """
    errors = y_true - y_pred
    # Clip errors to filter out extreme outliers for visual clarity
    clipped_errors = np.clip(errors, np.percentile(errors, 5), np.percentile(errors, 95))
    
    plt.figure(figsize=(8, 6))
    sns.histplot(clipped_errors, kde=True, bins=30, color=PREMIUM_COLORS[3])
    plt.axvline(x=0, color='r', linestyle='--')
    
    plt.title(f"Error Histogram (Clipped at 5th and 95th percentiles) - {model_name}")
    plt.xlabel("Error (Actual - Predicted)")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "error_histogram.png", dpi=300)
    plt.close()
    logger.info("Error histogram saved.")

def plot_linear_fit_line(X_feature, y_true, feature_name):
    """
    Generates Linear Regression Best Fit Line on a prominent feature.
    """
    from sklearn.linear_model import LinearRegression
    X_feat = X_feature.values.reshape(-1, 1)
    
    lr = LinearRegression()
    lr.fit(X_feat, y_true)
    y_fit = lr.predict(X_feat)
    
    plt.figure(figsize=(8, 6))
    sns.scatterplot(x=X_feature, y=y_true, alpha=0.4, color=PREMIUM_COLORS[4], label="Actual Data")
    plt.plot(X_feature, y_fit, color="red", lw=2, label="Best Fit Line")
    
    plt.title(f"Linear Fit: {feature_name} vs Target")
    plt.xlabel(feature_name)
    plt.ylabel("Target Value (BRL)")
    plt.legend()
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "linear_fit_line.png", dpi=300)
    plt.close()
    logger.info("Linear fit best fit line plot saved.")

def plot_feature_importance(importances, feature_names, model_name):
    """
    Generates Feature Importance Plot.
    """
    feat_imp = pd.DataFrame({"Feature": feature_names, "Importance": importances})
    feat_imp = feat_imp.sort_values(by="Importance", ascending=False).head(15)
    
    plt.figure(figsize=(10, 6))
    sns.barplot(x="Importance", y="Feature", data=feat_imp, palette="Blues_r")
    plt.title(f"Feature Importance - {model_name}")
    plt.xlabel("Importance Score")
    plt.ylabel("Feature")
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "feature_importance_plot.png", dpi=300)
    plt.close()
    logger.info("Feature importance plot saved.")

def plot_learning_curve(estimator, X, y, model_name):
    """
    Generates Learning Curve.
    """
    logger.info("Computing learning curve...")
    # Downsample for faster execution
    sample_size = min(2000, len(X))
    X_sample = X.sample(sample_size, random_state=42)
    y_sample = y.loc[X_sample.index]
    
    train_sizes, train_scores, test_scores = learning_curve(
        estimator, X_sample, y_sample, cv=3, n_jobs=-1, 
        train_sizes=np.linspace(0.1, 1.0, 5), scoring="r2"
    )
    
    train_mean = np.mean(train_scores, axis=1)
    train_std = np.std(train_scores, axis=1)
    test_mean = np.mean(test_scores, axis=1)
    test_std = np.std(test_scores, axis=1)
    
    plt.figure(figsize=(8, 6))
    plt.plot(train_sizes, train_mean, 'o-', color="r", label="Training score")
    plt.plot(train_sizes, test_mean, 'o-', color="g", label="Cross-validation score")
    
    plt.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, alpha=0.1, color="r")
    plt.fill_between(train_sizes, test_mean - test_std, test_mean + test_std, alpha=0.1, color="g")
    
    plt.title(f"Learning Curve - {model_name}")
    plt.xlabel("Training Examples")
    plt.ylabel("R2 Score")
    plt.legend(loc="best")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "learning_curve.png", dpi=300)
    plt.close()
    logger.info("Learning curve saved.")

def plot_validation_curve(estimator, X, y, param_name, param_range, model_name):
    """
    Generates Validation Curve.
    """
    logger.info("Computing validation curve...")
    sample_size = min(2000, len(X))
    X_sample = X.sample(sample_size, random_state=42)
    y_sample = y.loc[X_sample.index]
    
    train_scores, test_scores = validation_curve(
        estimator, X_sample, y_sample, param_name=param_name, param_range=param_range,
        cv=3, scoring="r2", n_jobs=-1
    )
    
    train_mean = np.mean(train_scores, axis=1)
    train_std = np.std(train_scores, axis=1)
    test_mean = np.mean(test_scores, axis=1)
    test_std = np.std(test_scores, axis=1)
    
    plt.figure(figsize=(8, 6))
    plt.plot(param_range, train_mean, 'o-', color="r", label="Training score")
    plt.plot(param_range, test_mean, 'o-', color="g", label="Cross-validation score")
    
    plt.fill_between(param_range, train_mean - train_std, train_mean + train_std, alpha=0.1, color="r")
    plt.fill_between(param_range, test_mean - test_std, test_mean + test_std, alpha=0.1, color="g")
    
    plt.title(f"Validation Curve - {model_name}")
    plt.xlabel(param_name)
    plt.ylabel("R2 Score")
    plt.legend(loc="best")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "validation_curve.png", dpi=300)
    plt.close()
    logger.info("Validation curve saved.")

def plot_prediction_error(y_true, y_pred, model_name):
    """
    Generates Prediction Error Plot.
    """
    plt.figure(figsize=(8, 6))
    plt.scatter(y_true, y_pred, alpha=0.5, color=PREMIUM_COLORS[5])
    plt.plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], 'k--', lw=2)
    
    plt.title(f"Prediction Error Plot - {model_name}")
    plt.xlabel("Actual Value (BRL)")
    plt.ylabel("Predicted Value (BRL)")
    plt.xscale("log")
    plt.yscale("log")
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "prediction_error_plot.png", dpi=300)
    plt.close()
    logger.info("Prediction error plot saved.")

def plot_feature_correlation_matrix(X):
    """
    Generates Feature Correlation Matrix plot.
    """
    plt.figure(figsize=(10, 8))
    sns.heatmap(X.corr(), annot=False, cmap="coolwarm")
    plt.title("Feature Correlation Matrix")
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "feature_correlation_matrix.png", dpi=300)
    plt.close()
    logger.info("Feature correlation matrix saved.")

def plot_model_comparison(comparison_df):
    """
    Generates Model Comparison Bar Chart.
    """
    df_sorted = comparison_df.sort_values(by="R2_Score", ascending=True)
    
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    
    # R2 Score comparison
    sns.barplot(x="R2_Score", y="Model_Name", data=df_sorted, ax=axes[0], palette="viridis")
    axes[0].set_title("R2 Score Comparison (Higher is Better)")
    axes[0].set_xlabel("R2 Score")
    axes[0].set_ylabel("")
    
    # MAE comparison
    df_sorted_mae = comparison_df.sort_values(by="MAE", ascending=False)
    sns.barplot(x="MAE", y="Model_Name", data=df_sorted_mae, ax=axes[1], palette="magma")
    axes[1].set_title("MAE Comparison (Lower is Better)")
    axes[1].set_xlabel("MAE (BRL)")
    axes[1].set_ylabel("")
    
    # RMSE comparison
    df_sorted_rmse = comparison_df.sort_values(by="RMSE", ascending=False)
    sns.barplot(x="RMSE", y="Model_Name", data=df_sorted_rmse, ax=axes[2], palette="plasma")
    axes[2].set_title("RMSE Comparison (Lower is Better)")
    axes[2].set_xlabel("RMSE (BRL)")
    axes[2].set_ylabel("")
    
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "model_comparison_bar_chart.png", dpi=300)
    plt.close()
    logger.info("Model comparison bar chart saved.")
