from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models import User, RevokedToken

bearer_scheme = HTTPBearer()


def get_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> dict:
    payload = decode_access_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token tidak valid atau kedaluwarsa")

    if db.get(RevokedToken, payload["jti"]) is not None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token sudah tidak berlaku")

    return payload


def get_current_user(
    payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db),
) -> User:
    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token tidak valid atau kedaluwarsa")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User tidak ditemukan")

    # Dicek ke database setiap request, jadi akun yang baru dinonaktifkan
    # Admin langsung kehilangan akses walaupun tokennya belum kedaluwarsa.
    if user.account_status != "approved":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Akun tidak aktif")

    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Hanya Admin yang dapat mengakses")
    return user