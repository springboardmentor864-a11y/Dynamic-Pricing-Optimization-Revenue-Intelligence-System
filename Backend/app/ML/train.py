import os
import pickle

from app.ML.models.linear_regression import create_model as linear_regression_model
from app.ML.models.decision_tree import create_model as decision_tree_model
from app.ML.models.random_forest import create_model as random_forest_model
from app.ML.models.xgboost import create_model as xgboost_model

from app.ML.evaluate import evaluate_model


# ==========================================================
# SAVE DIRECTORY
# ==========================================================

SAVE_DIR = os.path.join(
    os.path.dirname(__file__),
    "saved_models"
)

os.makedirs(SAVE_DIR, exist_ok=True)


# ==========================================================
# SAVE MODEL
# ==========================================================

def save_model(model, filename):

    path = os.path.join(
        SAVE_DIR,
        filename
    )

    with open(path, "wb") as file:

        pickle.dump(
            model,
            file
        )

    print(f"Saved: {filename}")


# ==========================================================
# TRAIN ALL MODELS
# ==========================================================

def train_all_models():

    print("=" * 60)

    print("PRICEPILOT AI MODEL TRAINING")

    print("=" * 60)


    results = {}


    # ======================================================
    # LINEAR REGRESSION
    # ======================================================

    print("\nTraining Linear Regression...")

    model, X_test, y_test = linear_regression_model()

    metrics = evaluate_model(
        model,
        X_test,
        y_test,
        "Linear Regression"
    )

    results["Linear Regression"] = metrics

    save_model(
        model,
        "linear_regression.pkl"
    )


    # ======================================================
    # DECISION TREE
    # ======================================================

    print("\nTraining Decision Tree...")

    model, X_test, y_test = decision_tree_model()

    metrics = evaluate_model(
        model,
        X_test,
        y_test,
        "Decision Tree"
    )

    results["Decision Tree"] = metrics

    save_model(
        model,
        "decision_tree.pkl"
    )


    # ======================================================
    # RANDOM FOREST
    # ======================================================

    print("\nTraining Random Forest...")

    model, X_test, y_test = random_forest_model()

    metrics = evaluate_model(
        model,
        X_test,
        y_test,
        "Random Forest"
    )

    results["Random Forest"] = metrics

    save_model(
        model,
        "random_forest.pkl"
    )


    # ======================================================
    # XGBOOST
    # ======================================================

    print("\nTraining XGBoost...")

    model, X_test, y_test = xgboost_model()

    metrics = evaluate_model(
        model,
        X_test,
        y_test,
        "XGBoost"
    )

    results["XGBoost"] = metrics

    save_model(
        model,
        "xgboost.pkl"
    )


    # ======================================================
    # MODEL COMPARISON
    # ======================================================

    print("\n")

    print("=" * 70)

    print("MODEL COMPARISON")

    print("=" * 70)


    print(
        f"{'Model':<25}"
        f"{'MAE':<15}"
        f"{'RMSE':<15}"
        f"{'R²':<15}"
    )


    print("-" * 70)


    for model_name, metrics in results.items():

        print(
            f"{model_name:<25}"
            f"{metrics['MAE']:<15.4f}"
            f"{metrics['RMSE']:<15.4f}"
            f"{metrics['R2']:<15.4f}"
        )


    # ======================================================
    # BEST MODEL
    # ======================================================

    best_model_name = max(
        results,
        key=lambda name: results[name]["R2"]
    )


    print("\n")

    print("=" * 70)

    print(
        f"BEST MODEL: {best_model_name}"
    )

    print(
        f"BEST R²: "
        f"{results[best_model_name]['R2']:.4f}"
    )

    print("=" * 70)


    print("\n")

    print("=" * 60)

    print("TRAINING COMPLETED")

    print("=" * 60)


    return results


# ==========================================================
# MAIN
# ==========================================================

if __name__ == "__main__":

    train_all_models()