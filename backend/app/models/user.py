from sqlalchemy import Column, Integer, String, Boolean, DateTime, CheckConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    nim_nip = Column(String(50))
    program_studi = Column(String(150))
    phone = Column(String(20))
    photo_url = Column(String(255), nullable=True)
    is_admin = Column(Boolean, nullable=False, server_default="false")
    account_status = Column(String(20), nullable=False, server_default="pending")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "account_status IN ('pending', 'approved', 'rejected', 'inactive')",
            name="chk_users_account_status",
        ),
    )

    # Peminjaman yang diajukan user ini
    loans = relationship("Loan", back_populates="user", foreign_keys="Loan.user_id")
    notifications = relationship("Notification", back_populates="user")