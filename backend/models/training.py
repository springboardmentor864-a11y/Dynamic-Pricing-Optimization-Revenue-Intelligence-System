from pydantic import BaseModel, Field
from typing import List, Optional

class TrainRequest(BaseModel):
    mode: str = Field(default="compare", description="single or compare")
    selected_model: Optional[str] = Field(default="", description="Name of the model if mode is single")
    user_email: Optional[str] = Field(default="guest@pricepilot.ai", description="Email of the logged in user")

class TrainedModelSummary(BaseModel):
    model: str
    status: str
    time: float
    r2: float

class TrainStatusResponse(BaseModel):
    status: str
    current_model: str
    progress_percentage: float
    trained_models: List[TrainedModelSummary]
    model_index: Optional[int] = 0
    total_models: Optional[int] = 0
    elapsed_time: Optional[float] = 0.0
    estimated_remaining_time: Optional[float] = 0.0
    logs: Optional[List[str]] = []
