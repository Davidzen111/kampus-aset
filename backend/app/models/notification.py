from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey,
    CheckConstraint, func,
)
from sqlalchemy.orm import relationship
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    loan_id = Column(Integer, ForeignKey("loans.id", ondelete="RESTRICT"))
    type = Column(String(30), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "type IN ('pengajuan', 'persetujuan', 'penolakan', 'pengingat', 'verifikasi')",
            name="chk_notifications_type",
        ),
    )

    user = relationship("User", back_populates="notifications")
    loan = relationship("Loan", back_populates="notifications")