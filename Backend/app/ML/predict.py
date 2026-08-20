import pandas as pd

from app.ML.model_loader import load_model


FEATURE_NAMES = [
    "freight_value",
    "payment_value",
    "payment_installments",
    "product_weight_g",
    "product_length_cm",
    "product_height_cm",
    "product_width_cm",
]


def predict_price(features, model_name="random_forest"):

    model = load_model(model_name)

    input_data = pd.DataFrame(
        [features],
        columns=FEATURE_NAMES
    )

    prediction = model.predict(input_data)

    return float(prediction[0])