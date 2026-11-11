import os
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin
from app.database import get_db
from app.models import User, Notification
from app.schemas.auth import UserResponse
from app.schemas.user import ProfileUpdate, StatusUpdate

router = APIRouter(prefix="/users", tags=["Users"])

PROFILE_DIR = os.path.join("uploads", "profiles")
PHOTO_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
PHOTO_MAX_BYTES = 5 * 1024 * 1024


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User tidak ditemukan")
    return user


# ---------- Profil sendiri (User & Admin) ----------
# Didefinisikan SEBELUM /{user_id} agar "me" tidak dianggap sebagai id.

@router.put("/me", response_model=UserResponse)
def update_my_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updates = data.model_dump(exclude_unset=True)
    if updates.get("name") is None:
        updates.pop("name", None)  # name wajib, tidak boleh dikosongkan

    for field, value in updates.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/photo", response_model=UserResponse)
async def upload_my_photo(
    foto: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = PHOTO_TYPES.get(foto.content_type)
    if ext is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Format foto harus JPG, PNG, atau WEBP")
    content = await foto.read()
    if len(content) > PHOTO_MAX_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ukuran foto maksimal 5 MB")

    os.makedirs(PROFILE_DIR, exist_ok=True)
    name = f"{current_user.id}_{uuid.uuid4().hex[:10]}{ext}"
    with open(os.path.join(PROFILE_DIR, name), "wb") as f:
        f.write(content)

    # hapus foto lama bila ada
    old = current_user.photo_url
    if old and old.startswith("/uploads/profiles/"):
        try:
            os.remove(os.path.join(PROFILE_DIR, os.path.basename(old)))
        except OSError:
            pass

    current_user.photo_url = f"/uploads/profiles/{name}"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/admin-contact")
def admin_contact(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Kontak admin yang ditampilkan ke user saat mengajukan peminjaman.
    Admin dengan profil paling lengkap (ada foto, lalu ada telepon) dipilih lebih dulu."""
    admin = (
        db.query(User)
        .filter(User.is_admin.is_(True), User.account_status == "approved")
        .order_by(User.photo_url.is_(None), User.phone.is_(None), User.id)
        .first()
    )
    if admin is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Admin tidak ditemukan")
    return {
        "id": admin.id,
        "name": admin.name,
        "nim_nip": admin.nim_nip,
        "program_studi": admin.program_studi,
        "phone": admin.phone,
        "email": admin.email,
        "photo_url": admin.photo_url,
        "account_status": admin.account_status,
    }


# ---------- Khusus Admin ----------

@router.get("", response_model=list[UserResponse])
def list_users(
    account_status: Literal["pending", "approved", "rejected", "inactive"] | None = None,
    search: str | None = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if account_status:
        query = query.filter(User.account_status == account_status)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(
            User.name.ilike(like), User.email.ilike(like), User.nim_nip.ilike(like)
        ))
    return query.order_by(User.created_at.desc()).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return get_user_or_404(db, user_id)


def _decide_registration(db: Session, user_id: int, approve: bool) -> dict:
    user = get_user_or_404(db, user_id)
    if user.account_status != "pending":
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Hanya akun berstatus pending yang dapat diverifikasi"
        )

    user.account_status = "approved" if approve else "rejected"
    db.add(Notification(
        user_id=user.id,
        loan_id=None,
        type="persetujuan" if approve else "penolakan",
        message=(
            "Akun Anda telah disetujui. Silakan login."
            if approve else "Pendaftaran akun Anda ditolak oleh Admin."
        ),
    ))
    db.commit()
    return {"message": "Akun disetujui" if approve else "Akun ditolak"}


@router.patch("/{user_id}/approve")
def approve_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return _decide_registration(db, user_id, approve=True)


@router.patch("/{user_id}/reject")
def reject_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return _decide_registration(db, user_id, approve=False)


@router.patch("/{user_id}/status")
def set_user_status(
    user_id: int,
    data: StatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = get_user_or_404(db, user_id)

    if user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Status akun Admin tidak dapat diubah")
    if user.account_status not in ("approved", "inactive"):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Hanya akun yang sudah disetujui yang dapat diaktifkan/dinonaktifkan",
        )
    if user.account_status == data.account_status:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Akun sudah berstatus {user.account_status}")

    user.account_status = data.account_status
    db.add(Notification(
        user_id=user.id,
        loan_id=None,
        type="verifikasi",
        message=(
            "Akun Anda telah diaktifkan kembali oleh Admin."
            if data.account_status == "approved"
            else "Akun Anda dinonaktifkan oleh Admin. Hubungi Admin untuk informasi lebih lanjut."
        ),
    ))
    db.commit()
    return {"message": f"Status akun diubah menjadi {data.account_status}"}