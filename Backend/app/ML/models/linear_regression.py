from sklearn.linear_model import LinearRegression

from app.ML.preprocessing import prepare_data


def create_model():
    """
    Train a Linear Regression model and return:
    - model
    - X_test
    - y_test
    """

    X_train, X_test, y_train, y_test = prepare_data()

    model = LinearRegression()

    model.fit(X_train, y_train)

    return model, X_test, y_test