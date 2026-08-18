from sklearn.ensemble import RandomForestRegressor

from app.ML.preprocessing import prepare_data


def create_model():
    """
    Train a Random Forest Regressor
    and return:
    - trained model
    - X_test
    - y_test
    """

    X_train, X_test, y_train, y_test = prepare_data()

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    return model, X_test, y_test