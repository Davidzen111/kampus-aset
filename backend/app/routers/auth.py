from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_token_payload
from app.core.security import hash_password, verify_password, create_access_token
from app.database import get_db
from app.models import User, Notification, RevokedToken
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse, MessageResponse,
)

router = APIRouter(prefix="/auth", tags=["Autentikasi"])


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    email = data.email.lower()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email sudah terdaftar")

    # Role dipilih saat register: "user" atau "admin"
    is_admin = data.role == "admin"

    user = User(
        name=data.name,
        email=email,
        password_hash=hash_password(data.password),
        nim_nip=data.nim_nip,
        program_studi=data.program_studi,
        phone=data.phone,
        is_admin=is_admin,
        # Admin langsung aktif; User umum menunggu verifikasi Admin
        account_status="approved" if is_admin else "pending",
    )
    db.add(user)
    db.flush()  # agar user.id terisi sebelum commit

    if is_admin:
        db.commit()
        return {"message": "Pendaftaran admin berhasil. Silakan login."}

    # Notifikasi ke semua Admin aktif (sesuai sequence diagram Gambar 31)
    admins = db.query(User).filter(
        User.is_admin.is_(True), User.account_status == "approved"
    ).all()
    for admin in admins:
        db.add(Notification(
            user_id=admin.id,
            loan_id=None,
            type="verifikasi",
            message=f"Pendaftaran akun baru dari {user.name} menunggu verifikasi.",
        ))

    db.commit()
    return {"message": "Pendaftaran berhasil. Akun Anda menunggu verifikasi Admin."}


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()

    # Pesan sengaja sama untuk email salah maupun password salah
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email atau kata sandi salah")

    if user.account_status == "pending":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Akun Anda masih menunggu verifikasi Admin")
    if user.account_status == "rejected":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Pendaftaran akun Anda ditolak")
    if user.account_status == "inactive":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Akun Anda dinonaktifkan. Hubungi Admin")

    token = create_access_token(user.id, user.is_admin)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout", response_model=MessageResponse)
def logout(
    payload: dict = Depends(get_token_payload),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Idempoten: kalau jti sudah tercatat, get_token_payload sudah menolak (401)
    db.add(RevokedToken(
        jti=payload["jti"],
        expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc).replace(tzinfo=None),
    ))
    db.commit()
    return {"message": "Berhasil logout"}