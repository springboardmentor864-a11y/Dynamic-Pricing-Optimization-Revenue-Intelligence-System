from sklearn.tree import DecisionTreeRegressor

from app.ML.preprocessing import prepare_data


def create_model():
    """
    Train a Decision Tree Regressor
    and return the trained model.
    """

    X_train, X_test, y_train, y_test = prepare_data()

    model = DecisionTreeRegressor(
        random_state=42,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2
    )

    model.fit(X_train, y_train)

    return model, X_test, y_test