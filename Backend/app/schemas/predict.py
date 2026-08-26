from pydantic import BaseModel, Field
from typing import Literal


class PredictionRequest(BaseModel):

    model_name: Literal[
        "linear_regression",
        "decision_tree",
        "random_forest",
        "xgboost"
    ] = "random_forest"

    freight_value: float = Field(gt=0)
    payment_value: float = Field(gt=0)
    payment_installments: int = Field(ge=1)

    product_weight_g: float = Field(gt=0)
    product_length_cm: float = Field(gt=0)
    product_height_cm: float = Field(gt=0)
    product_width_cm: float = Field(gt=0)