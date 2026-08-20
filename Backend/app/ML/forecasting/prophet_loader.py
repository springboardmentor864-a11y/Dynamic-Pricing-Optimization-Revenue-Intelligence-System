import os
import pickle


# Project root:
# Backend/app/ML/forecasting/prophet_loader.py
CURRENT_DIR = os.path.dirname(__file__)

MODEL_PATH = os.path.abspath(
    os.path.join(
        CURRENT_DIR,
        "..",
        "saved_models",
        "prophet.pkl"
    )
)


def load_prophet_model():

    if not os.path.exists(MODEL_PATH):

        raise FileNotFoundError(
            f"Prophet model not found: {MODEL_PATH}"
        )

    with open(
        MODEL_PATH,
        "rb"
    ) as file:

        model = pickle.load(file)

    return model
