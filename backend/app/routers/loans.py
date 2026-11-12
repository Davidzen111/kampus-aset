from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_admin
from app.database import get_db
from app.models import Asset, Loan, Notification, User
from app.schemas.loan import DecisionNote, LoanResponse
from app.services.loans import find_conflict, today_local
from app.services.notify import notify_admins
from app.services.storage import delete_image, save_image

from app.schemas.loan import DecisionNote, LoanResponse, VerifyRequest

router = APIRouter(prefix="/loans", tags=["Peminjaman"])


def _base_query(db: Session):
    return db.query(Loan).options(joinedload(Loan.user), joinedload(Loan.asset))


def get_loan_or_404(db: Session, loan_id: int) -> Loan:
    loan = _base_query(db).filter(Loan.id == loan_id).first()
    if loan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Peminjaman tidak ditemukan")
    return loan


# ---------- User: ajukan peminjaman ----------

@router.post("", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
async def create_loan(
    asset_id: int = Form(...),
    tanggal_pinjam: date = Form(...),
    tanggal_kembali_rencana: date = Form(...),
    keperluan: str = Form(..., min_length=3),
    catatan_awal: str | None = Form(None),
    foto_kondisi_awal: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin tidak dapat mengajukan peminjaman")

    if not (user.nim_nip and user.program_studi and user.phone):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Lengkapi profil (NIM/NIP, Program Studi, No. Telepon) sebelum mengajukan peminjaman",
        )

    if tanggal_pinjam < today_local():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tanggal pinjam tidak boleh di masa lalu")
    if tanggal_kembali_rencana < tanggal_pinjam:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Tanggal kembali tidak boleh lebih awal dari tanggal pinjam",
        )

    asset = db.query(Asset).filter(Asset.id == asset_id).with_for_update().first()
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Aset tidak ditemukan")
    if asset.status == "maintenance":
        raise HTTPException(status.HTTP_409_CONFLICT, "Aset sedang dalam maintenance")

    conflict = find_conflict(db, asset_id, tanggal_pinjam, tanggal_kembali_rencana)
    if conflict:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Aset sudah dibooking pada {conflict.tanggal_pinjam} s.d. "
            f"{conflict.tanggal_kembali_rencana}. Pilih tanggal lain.",
        )

    photo_url = await save_image(foto_kondisi_awal, "loans")
    loan = Loan(
        user_id=user.id, asset_id=asset_id,
        tanggal_pinjam=tanggal_pinjam, tanggal_kembali_rencana=tanggal_kembali_rencana,
        keperluan=keperluan, foto_kondisi_awal=photo_url, catatan_awal=catatan_awal,
        status="menunggu",
    )
    db.add(loan)
    try:
        db.flush()  
        notify_admins(
            db, loan.id, "pengajuan",
            f"{user.name} mengajukan peminjaman {asset.name} "
            f"({tanggal_pinjam} s.d. {tanggal_kembali_rencana}).",
        )
        db.commit()
    except Exception:
        db.rollback()
        delete_image(photo_url)
        raise

    return get_loan_or_404(db, loan.id)


# ---------- User: lihat milik sendiri ----------
# Harus di atas /{loan_id} agar "mine" tidak dibaca sebagai id.

@router.get("/mine", response_model=list[LoanResponse])
def my_loans(
    kelompok: Literal["aktif", "riwayat", "siap_kembali", "pengembalian"] | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = _base_query(db).filter(Loan.user_id == user.id)
    if kelompok == "aktif":
        query = query.filter(Loan.status.in_(["menunggu", "disetujui"]))
    elif kelompok == "riwayat":
        query = query.filter(Loan.status.in_(["ditolak", "dikembalikan"]))
    elif kelompok == "siap_kembali":
        query = query.filter(
            Loan.status == "disetujui",
            (Loan.status_pengembalian.is_(None)) | (Loan.status_pengembalian == "ditolak"),
        )
    elif kelompok == "pengembalian":
        query = query.filter(Loan.status_pengembalian.is_not(None))
    return query.order_by(Loan.created_at.desc()).all()


# ---------- Admin: daftar semua ----------

@router.get("", response_model=list[LoanResponse])
def list_loans(
    status_pinjam: Literal["menunggu", "disetujui", "ditolak", "dikembalikan"] | None = None,
    status_pengembalian: Literal["menunggu_verifikasi", "diterima", "ditolak"] | None = None,
    user_id: int | None = None,
    asset_id: int | None = None,
    dari: date | None = None,
    sampai: date | None = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = _base_query(db)
    if status_pinjam:
        query = query.filter(Loan.status == status_pinjam)
    if status_pengembalian:
        query = query.filter(Loan.status_pengembalian == status_pengembalian)
    if user_id:
        query = query.filter(Loan.user_id == user_id)
    if asset_id:
        query = query.filter(Loan.asset_id == asset_id)
    if dari:
        query = query.filter(Loan.tanggal_pinjam >= dari)
    if sampai:
        query = query.filter(Loan.tanggal_pinjam <= sampai)
    return query.order_by(Loan.created_at.desc()).all()


@router.get("/{loan_id}", response_model=LoanResponse)
def get_loan(
    loan_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    loan = get_loan_or_404(db, loan_id)
    if not user.is_admin and loan.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Anda tidak berhak melihat peminjaman ini")
    return loan


# ---------- Admin: setujui / tolak ----------

@router.patch("/{loan_id}/approve", response_model=LoanResponse)
def approve_loan(
    loan_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(Loan.id == loan_id).with_for_update().first()
    if loan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Peminjaman tidak ditemukan")
    if loan.status != "menunggu":
        raise HTTPException(status.HTTP_409_CONFLICT, "Hanya pengajuan berstatus menunggu yang dapat disetujui")

    asset = db.query(Asset).filter(Asset.id == loan.asset_id).with_for_update().first()
    if asset.status == "maintenance":
        raise HTTPException(status.HTTP_409_CONFLICT, "Aset sedang maintenance, pengajuan tidak dapat disetujui")

    loan.status = "disetujui"
    loan.approved_by = admin.id
    loan.approved_at = func.now()
    asset.status = "dipinjam"

    db.add(Notification(
        user_id=loan.user_id, loan_id=loan.id, type="persetujuan",
        message=f"Pengajuan peminjaman {asset.name} disetujui. "
                f"Ambil aset di {asset.location} pada {loan.tanggal_pinjam}.",
    ))
    db.commit()
    return get_loan_or_404(db, loan_id)


@router.patch("/{loan_id}/reject", response_model=LoanResponse)
def reject_loan(
    loan_id: int,
    data: DecisionNote | None = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(Loan.id == loan_id).with_for_update().first()
    if loan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Peminjaman tidak ditemukan")
    if loan.status != "menunggu":
        raise HTTPException(status.HTTP_409_CONFLICT, "Hanya pengajuan berstatus menunggu yang dapat ditolak")

    asset = db.get(Asset, loan.asset_id)
    loan.status = "ditolak"
    loan.approved_by = admin.id
    loan.approved_at = func.now()

    message = f"Pengajuan peminjaman {asset.name} ditolak."
    if data and data.alasan:
        message += f" Alasan: {data.alasan}"
    db.add(Notification(
        user_id=loan.user_id, loan_id=loan.id, type="penolakan", message=message,
    ))
    db.commit()
    return get_loan_or_404(db, loan_id)


# ---------- User: batalkan pengajuan ----------

@router.delete("/{loan_id}")
def cancel_loan(
    loan_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(Loan.id == loan_id).with_for_update().first()
    if loan is None or loan.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Peminjaman tidak ditemukan")
    if loan.status != "menunggu":
        raise HTTPException(status.HTTP_409_CONFLICT, "Hanya pengajuan yang masih menunggu yang dapat dibatalkan")

    photo_url = loan.foto_kondisi_awal
    db.query(Notification).filter(Notification.loan_id == loan.id).delete()
    db.delete(loan)
    db.commit()
    delete_image(photo_url)
    return {"message": "Pengajuan dibatalkan"}


# ---------- User: ajukan pengembalian ----------

@router.post("/{loan_id}/return", response_model=LoanResponse)
async def submit_return(
    loan_id: int,
    catatan_akhir: str | None = Form(None),
    foto_kondisi_akhir: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(Loan.id == loan_id).with_for_update().first()
    if loan is None or loan.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Peminjaman tidak ditemukan")
    if loan.status != "disetujui":
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Hanya peminjaman yang disetujui yang dapat dikembalikan"
        )
    if loan.status_pengembalian == "menunggu_verifikasi":
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Pengembalian sudah diajukan dan menunggu verifikasi Admin"
        )
    if today_local() < loan.tanggal_pinjam:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Peminjaman baru dimulai pada {loan.tanggal_pinjam}, belum dapat dikembalikan",
        )

    asset = db.get(Asset, loan.asset_id)
    old_photo = loan.foto_kondisi_akhir  
    new_photo = await save_image(foto_kondisi_akhir, "returns")

    loan.foto_kondisi_akhir = new_photo
    loan.catatan_akhir = catatan_akhir
    loan.tanggal_kembali_aktual = today_local()
    loan.status_pengembalian = "menunggu_verifikasi"
    loan.verified_by = None
    loan.verified_at = None

    try:
        notify_admins(
            db, loan.id, "verifikasi",
            f"{user.name} mengajukan pengembalian {asset.name}. Bukti kondisi menunggu diverifikasi.",
        )
        db.commit()
    except Exception:
        db.rollback()
        delete_image(new_photo)
        raise

    delete_image(old_photo)  
    return get_loan_or_404(db, loan_id)


# ---------- Admin: verifikasi pengembalian ----------

@router.patch("/{loan_id}/verify", response_model=LoanResponse)
def verify_return(
    loan_id: int,
    data: VerifyRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).filter(Loan.id == loan_id).with_for_update().first()
    if loan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Peminjaman tidak ditemukan")
    if loan.status_pengembalian != "menunggu_verifikasi":
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Tidak ada pengembalian yang menunggu verifikasi"
        )
    if data.keputusan == "ditolak" and not (data.alasan and data.alasan.strip()):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Alasan wajib diisi saat menolak pengembalian"
        )

    asset = db.query(Asset).filter(Asset.id == loan.asset_id).with_for_update().first()

    loan.verified_by = admin.id
    loan.verified_at = func.now()

    if data.keputusan == "diterima":
        loan.status_pengembalian = "diterima"
        loan.status = "dikembalikan"

        masih_dipinjam = db.query(Loan).filter(
            Loan.asset_id == asset.id,
            Loan.status == "disetujui",
            Loan.id != loan.id,
        ).first()
        if asset.status == "dipinjam" and masih_dipinjam is None:
            asset.status = "tersedia"

        message = f"Pengembalian {asset.name} diterima. Terima kasih."
    else:
        loan.status_pengembalian = "ditolak"
        message = (
            f"Pengembalian {asset.name} ditolak. Alasan: {data.alasan.strip()}. "
            "Silakan perbaiki data dan ajukan ulang."
        )

    db.add(Notification(
        user_id=loan.user_id, loan_id=loan.id, type="verifikasi", message=message,
    ))
    db.commit()
    return get_loan_or_404(db, loan_id)