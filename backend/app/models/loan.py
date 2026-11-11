from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, ForeignKey,
    CheckConstraint, Index, func,
)
from sqlalchemy.orm import relationship
from app.database import Base


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="RESTRICT"), nullable=False)
    tanggal_pinjam = Column(Date, nullable=False)
    tanggal_kembali_rencana = Column(Date, nullable=False)
    keperluan = Column(Text, nullable=False)

    # Diunggah User saat mengajukan peminjaman
    foto_kondisi_awal = Column(String(255), nullable=False)
    catatan_awal = Column(Text)

    status = Column(String(20), nullable=False, server_default="menunggu")
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"))
    approved_at = Column(DateTime)

    # Diisi saat pengembalian
    tanggal_kembali_aktual = Column(Date)
    foto_kondisi_akhir = Column(String(255))
    catatan_akhir = Column(Text)
    status_pengembalian = Column(String(30))
    verified_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"))
    verified_at = Column(DateTime)

    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('menunggu', 'disetujui', 'ditolak', 'dikembalikan')",
            name="chk_loans_status",
        ),
        CheckConstraint(
            "status_pengembalian IN ('menunggu_verifikasi', 'diterima', 'ditolak')",
            name="chk_loans_status_pengembalian",
        ),
        CheckConstraint(
            "tanggal_kembali_rencana >= tanggal_pinjam",
            name="chk_tanggal_valid",
        ),
        Index("idx_loans_asset_jadwal", "asset_id", "tanggal_pinjam", "tanggal_kembali_rencana"),
    )

    user = relationship("User", back_populates="loans", foreign_keys=[user_id])
    asset = relationship("Asset", back_populates="loans")
    approver = relationship("User", foreign_keys=[approved_by])
    verifier = relationship("User", foreign_keys=[verified_by])
    notifications = relationship("Notification", back_populates="loan")