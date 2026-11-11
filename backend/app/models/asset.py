from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    location = Column(String(150), nullable=False)
    description = Column(Text)
    photo_url = Column(String(255))
    kondisi_aset = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, server_default="tersedia")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('tersedia', 'dipinjam', 'maintenance')",
            name="chk_assets_status",
        ),
    )

    loans = relationship("Loan", back_populates="asset")