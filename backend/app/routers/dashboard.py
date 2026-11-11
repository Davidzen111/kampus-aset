from sqlalchemy import func, or_
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_admin
from app.database import get_db
from app.models import Asset, Loan, Notification, User
from app.services.loans import today_local

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

BELUM_KEMBALI = or_(Loan.status_pengembalian.is_(None), Loan.status_pengembalian == "ditolak")


def _count(db: Session, column, *conditions) -> int:
    return db.query(func.count(column)).filter(*conditions).scalar() or 0


def _activity(loan: Loan) -> dict:
    return {
        "loan_id": loan.id,
        "peminjam": loan.user.name,
        "aset": loan.asset.name,
        "status": loan.status,
        "status_pengembalian": loan.status_pengembalian,
        "waktu": loan.created_at,
    }


@router.get("/user")
def user_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    terbaru = (
        db.query(Loan).options(joinedload(Loan.user), joinedload(Loan.asset))
        .filter(Loan.user_id == user.id)
        .order_by(Loan.created_at.desc()).limit(5).all()
    )
    notif = (
        db.query(Notification).filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc()).limit(3).all()
    )
    return {
        "sedang_dipinjam": _count(db, Loan.id, Loan.user_id == user.id, Loan.status == "disetujui"),
        "menunggu_persetujuan": _count(db, Loan.id, Loan.user_id == user.id, Loan.status == "menunggu"),
        "total_riwayat": _count(db, Loan.id, Loan.user_id == user.id,
                                Loan.status.in_(["ditolak", "dikembalikan"])),
        "notifikasi_baru": _count(db, Notification.id, Notification.user_id == user.id,
                                  Notification.is_read.is_(False)),
        "aktivitas_terbaru": [_activity(l) for l in terbaru],
        "notifikasi_terbaru": [
            {"id": n.id, "type": n.type, "message": n.message,
             "is_read": n.is_read, "created_at": n.created_at}
            for n in notif
        ],
    }


@router.get("/admin")
def admin_dashboard(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    today = today_local()
    awal_bulan = today.replace(day=1)

    total_aset = _count(db, Asset.id)
    aset_dipinjam = _count(db, Asset.id, Asset.status == "dipinjam")
    pengajuan_pending = _count(db, Loan.id, Loan.status == "menunggu")
    akun_pending = _count(db, User.id, User.account_status == "pending")
    menunggu_verifikasi = _count(db, Loan.id, Loan.status_pengembalian == "menunggu_verifikasi")

    # Aset paling sering dipinjam (peminjaman yang pernah disetujui)
    valid = Loan.status.in_(["disetujui", "dikembalikan"])
    total_valid = _count(db, Loan.id, valid)
    top_rows = (
        db.query(Asset.id, Asset.name, func.count(Loan.id).label("jumlah"))
        .join(Loan, Loan.asset_id == Asset.id)
        .filter(valid)
        .group_by(Asset.id, Asset.name)
        .order_by(func.count(Loan.id).desc())
        .limit(3).all()
    )

    terbaru = (
        db.query(Loan).options(joinedload(Loan.user), joinedload(Loan.asset))
        .order_by(Loan.created_at.desc()).limit(5).all()
    )

    return {
        "total_aset": total_aset,
        "aset_bulan_ini": _count(db, Asset.id, Asset.created_at >= awal_bulan),
        "sedang_dipinjam": aset_dipinjam,
        "persen_dipinjam": round(aset_dipinjam / total_aset * 100) if total_aset else 0,
        "pengajuan_pending": pengajuan_pending,
        "akun_perlu_verifikasi": akun_pending,
        "total_pengguna": _count(db, User.id, User.is_admin.is_(False),
                                 User.account_status.in_(["approved", "inactive"])),
        "pengguna_bulan_ini": _count(db, User.id, User.is_admin.is_(False),
                                     User.created_at >= awal_bulan),
        "menunggu_verifikasi_kembali": menunggu_verifikasi,
        "terlambat_kembali": _count(
            db, Loan.id, Loan.status == "disetujui", BELUM_KEMBALI,
            Loan.tanggal_kembali_rencana < today,
        ),
        # Badge sidebar Admin (Gambar 16)
        "badge": {
            "verifikasi_akun": akun_pending,
            "pengajuan": pengajuan_pending,
            "pengembalian": menunggu_verifikasi,
        },
        "aset_terpopuler": [
            {"asset_id": r.id, "nama": r.name, "jumlah": r.jumlah,
             "persen": round(r.jumlah / total_valid * 100)}
            for r in top_rows
        ],
        "aktivitas_terbaru": [_activity(l) for l in terbaru],
    }