from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models import Loan

ACTIVE_STATUSES = ("menunggu", "disetujui")


def today_local() -> date:
    """Tanggal hari ini di WITA (server bisa berjalan di UTC)."""
    return datetime.now(ZoneInfo("Asia/Makassar")).date()


def find_conflict(
    db: Session, asset_id: int, start: date, end: date, exclude_loan_id: int | None = None
) -> Loan | None:
    query = db.query(Loan).filter(
        Loan.asset_id == asset_id,
        Loan.status.in_(ACTIVE_STATUSES),
        Loan.tanggal_pinjam <= end,
        Loan.tanggal_kembali_rencana >= start,
    )
    if exclude_loan_id is not None:
        query = query.filter(Loan.id != exclude_loan_id)
    return query.first()