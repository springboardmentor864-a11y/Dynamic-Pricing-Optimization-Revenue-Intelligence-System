import os
import pickle


MODEL_DIR = os.path.join(
    os.path.dirname(__file__),
    "saved_models"
)


def load_model(model_name="random_forest"):
    model_path = os.path.join(
        MODEL_DIR,
        f"{model_name}.pkl"
    )

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model not found: {model_path}"
        )

    with open(model_path, "rb") as file:
        model = pickle.load(file)

    return model