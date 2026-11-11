from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)  # batas bcrypt 72 byte
    nim_nip: str | None = Field(default=None, max_length=50)
    program_studi: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    role: Literal["user", "admin"] = "user"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    nim_nip: str | None
    program_studi: str | None
    phone: str | None
    photo_url: str | None = None
    is_admin: bool
    account_status: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str