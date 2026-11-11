from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_admin
from app.database import get_db
from app.models import Loan, Notification, User
from app.schemas.notification import NotificationResponse
from app.services.loans import today_local
from app.services.reminders import generate_reminders, reminder_message

router = APIRouter(prefix="/notifications", tags=["Notifikasi"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    belum_dibaca: bool = False,
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(Notification.user_id == user.id)
    if belum_dibaca:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).limit(min(limit, 200)).all()


@router.get("/unread-count")
def unread_count(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    jumlah = db.query(func.count(Notification.id)).filter(
        Notification.user_id == user.id, Notification.is_read.is_(False)
    ).scalar()
    return {"jumlah": jumlah}


@router.patch("/read-all")
def read_all(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    jumlah = db.query(Notification).filter(
        Notification.user_id == user.id, Notification.is_read.is_(False)
    ).update({"is_read": True})
    db.commit()
    return {"message": "Semua notifikasi ditandai dibaca", "jumlah": jumlah}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = db.get(Notification, notification_id)
    if notif is None or notif.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notifikasi tidak ditemukan")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


# ---------- Admin ----------

@router.post("/reminders/run")
def run_reminders(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    jumlah = generate_reminders(db)
    return {"message": "Pengingat diproses", "dibuat": jumlah}


@router.post("/remind/{loan_id}")
def remind_borrower(
    loan_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    loan = db.query(Loan).options(joinedload(Loan.asset)).filter(Loan.id == loan_id).first()
    if loan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Peminjaman tidak ditemukan")
    if loan.status != "disetujui" or loan.status_pengembalian == "menunggu_verifikasi":
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Peminjaman ini tidak memerlukan pengingat pengembalian"
        )
    db.add(Notification(
        user_id=loan.user_id, loan_id=loan.id, type="pengingat",
        message=reminder_message(loan, today_local()),
    ))
    db.commit()
    return {"message": "Peringatan dikirim ke peminjam"}