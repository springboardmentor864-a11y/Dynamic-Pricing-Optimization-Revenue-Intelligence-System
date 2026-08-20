from app.ML.metrics import calculate_metrics


def evaluate_model(model, X_test, y_test, model_name):
    """
    Evaluate a trained regression model and print its metrics.
    """

    metrics = calculate_metrics(
        model,
        X_test,
        y_test
    )

    print("\n" + "=" * 50)
    print(f"Model : {model_name}")
    print("=" * 50)

    print(f"MAE  : {metrics['MAE']:.4f}")
    print(f"RMSE : {metrics['RMSE']:.4f}")
    print(f"R²   : {metrics['R2']:.4f}")

    return metrics