from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin
from app.database import get_db
from app.models import Asset, Loan, User
from app.schemas.asset import AssetResponse, ScheduleItem
from app.services.storage import delete_image, save_image

router = APIRouter(prefix="/assets", tags=["Aset"])


def get_asset_or_404(db: Session, asset_id: int) -> Asset:
    asset = db.get(Asset, asset_id)
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Aset tidak ditemukan")
    return asset


# ---------- Baca (semua user login) ----------

@router.get("", response_model=list[AssetResponse])
def list_assets(
    search: str | None = None,
    category: str | None = None,
    status_aset: Literal["tersedia", "dipinjam", "maintenance"] | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Asset)
    if search:
        query = query.filter(Asset.name.ilike(f"%{search}%"))
    if category:
        query = query.filter(Asset.category == category)
    if status_aset:
        query = query.filter(Asset.status == status_aset)
    return query.order_by(Asset.created_at.desc()).all()


# Harus di atas /{asset_id} supaya "categories" tidak dibaca sebagai id
@router.get("/categories", response_model=list[str])
def list_categories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(Asset.category).distinct().order_by(Asset.category).all()
    return [r[0] for r in rows]


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_asset_or_404(db, asset_id)


@router.get("/{asset_id}/schedule", response_model=list[ScheduleItem])
def asset_schedule(
    asset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_asset_or_404(db, asset_id)
    return (
        db.query(Loan)
        .filter(Loan.asset_id == asset_id, Loan.status.in_(["menunggu", "disetujui"]))
        .order_by(Loan.tanggal_pinjam)
        .all()
    )


# ---------- Kelola (Admin) ----------

@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    name: str = Form(..., min_length=2, max_length=150),
    category: str = Form(..., min_length=1, max_length=100),
    location: str = Form(..., min_length=1, max_length=150),
    kondisi_aset: str = Form(..., min_length=1),
    description: str | None = Form(None),
    status_awal: Literal["tersedia", "maintenance"] = Form("tersedia"),
    photo: UploadFile | None = File(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    photo_url = None
    if photo is not None and photo.filename:
        photo_url = await save_image(photo, "assets")

    asset = Asset(
        name=name, category=category, location=location,
        kondisi_aset=kondisi_aset, description=description,
        status=status_awal, photo_url=photo_url,
    )
    db.add(asset)
    try:
        db.commit()
    except Exception:
        db.rollback()
        delete_image(photo_url)  # jangan tinggalkan file yatim
        raise
    db.refresh(asset)
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: int,
    name: str | None = Form(None, min_length=2, max_length=150),
    category: str | None = Form(None, min_length=1, max_length=100),
    location: str | None = Form(None, min_length=1, max_length=150),
    kondisi_aset: str | None = Form(None, min_length=1),
    description: str | None = Form(None),
    status_aset: Literal["tersedia", "maintenance"] | None = Form(None),
    photo: UploadFile | None = File(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    asset = get_asset_or_404(db, asset_id)

    # Status 'dipinjam' diatur otomatis oleh proses peminjaman, bukan manual
    if status_aset is not None and status_aset != asset.status:
        if asset.status == "dipinjam":
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Aset sedang dipinjam; status baru bisa diubah setelah dikembalikan",
            )
        asset.status = status_aset

    for field, value in {
        "name": name, "category": category, "location": location,
        "kondisi_aset": kondisi_aset, "description": description,
    }.items():
        if value is not None:
            setattr(asset, field, value)

    old_photo = None
    new_photo = None
    if photo is not None and photo.filename:
        new_photo = await save_image(photo, "assets")
        old_photo = asset.photo_url
        asset.photo_url = new_photo

    try:
        db.commit()
    except Exception:
        db.rollback()
        delete_image(new_photo)
        raise

    delete_image(old_photo)  # hapus foto lama hanya setelah commit berhasil
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    force: bool = False,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    asset = get_asset_or_404(db, asset_id)

    loans = db.query(Loan).filter(Loan.asset_id == asset_id)
    has_loans = loans.first() is not None
    if has_loans:
        if not force:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Aset memiliki riwayat peminjaman dan tidak dapat dihapus. "
                "Ubah statusnya menjadi 'maintenance'.",
            )
        # Hapus paksa tidak boleh bila masih ada pengajuan/peminjaman aktif
        if asset.status == "dipinjam" or loans.filter(
            Loan.status.in_(["menunggu", "disetujui"])
        ).first():
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Aset masih memiliki pengajuan atau peminjaman aktif; selesaikan dulu.",
            )

    photo_url = asset.photo_url
    try:
        if has_loans:
            loans.delete(synchronize_session=False)
        db.delete(asset)
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Aset masih dipakai data lain (misalnya notifikasi) dan tidak dapat dihapus. "
            f"Detail: {str(e.orig)[:200]}",
        )
    delete_image(photo_url)
    return {"message": "Aset dihapus"}