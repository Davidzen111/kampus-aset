from sqlalchemy import Column, String, DateTime, Index
from app.database import Base


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    jti = Column(String(32), primary_key=True)
    expires_at = Column(DateTime, nullable=False)  # UTC, tanpa tzinfo

    __table_args__ = (Index("idx_revoked_tokens_expires", "expires_at"),)