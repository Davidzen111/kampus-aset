from datetime import date, timedelta

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models import Loan, Notification
from app.services.loans import today_local


def reminder_message(loan: Loan, today: date) -> str:
    nama = loan.asset.name
    selisih = (loan.tanggal_kembali_rencana - today).days
    if selisih < 0:
        return (f"{nama} terlambat dikembalikan {-selisih} hari "
                f"(batas {loan.tanggal_kembali_rencana}). Segera ajukan pengembalian.")
    if selisih == 0:
        return f"Hari ini batas pengembalian {nama}. Segera ajukan pengembalian."
    return f"Batas pengembalian {nama} besok ({loan.tanggal_kembali_rencana})."


def generate_reminders(db: Session) -> int:
    today = today_local()
    loans = (
        db.query(Loan)
        .options(joinedload(Loan.asset))
        .filter(
            Loan.status == "disetujui",
            or_(Loan.status_pengembalian.is_(None), Loan.status_pengembalian == "ditolak"),
            Loan.tanggal_kembali_rencana <= today + timedelta(days=1),
        )
        .all()
    )

    created = 0
    for loan in loans:
        sudah = db.query(Notification.id).filter(
            Notification.loan_id == loan.id,
            Notification.user_id == loan.user_id,
            Notification.type == "pengingat",
            Notification.created_at >= func.now() - timedelta(hours=20),
        ).first()
        if sudah:
            continue
        db.add(Notification(
            user_id=loan.user_id, loan_id=loan.id, type="pengingat",
            message=reminder_message(loan, today),
        ))
        created += 1

    db.commit()
    return created