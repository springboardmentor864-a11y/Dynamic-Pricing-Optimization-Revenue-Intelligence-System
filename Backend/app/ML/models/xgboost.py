from xgboost import XGBRegressor

from app.ML.preprocessing import prepare_data


def create_model():
    """
    Train an XGBoost Regressor
    and return:
    - trained model
    - X_test
    - y_test
    """

    X_train, X_test, y_train, y_test = prepare_data()

    model = XGBRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=8,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42
    )

    model.fit(X_train, y_train)

    return model, X_test, y_test