from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loan_id: int | None
    type: str
    message: str
    is_read: bool
    created_at: datetime