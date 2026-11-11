from typing import Literal
from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    nim_nip: str | None = Field(default=None, max_length=50)
    program_studi: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=20)


class StatusUpdate(BaseModel):
    account_status: Literal["approved", "inactive"]