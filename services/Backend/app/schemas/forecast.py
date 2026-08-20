from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):

    periods: int = Field(
        default=30,
        ge=1,
        le=365
    )