from sqlalchemy.orm import Session

from app.models import Notification, User


def notify_admins(db: Session, loan_id: int | None, type_: str, message: str) -> None:
    admins = db.query(User).filter(
        User.is_admin.is_(True), User.account_status == "approved"
    ).all()
    for admin in admins:
        db.add(Notification(user_id=admin.id, loan_id=loan_id, type=type_, message=message))