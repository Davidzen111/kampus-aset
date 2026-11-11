from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from typing import Literal


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    nim_nip: str | None
    program_studi: str | None
    phone: str | None


class AssetBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    category: str
    location: str
    photo_url: str | None
    kondisi_aset: str


class LoanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    asset_id: int
    tanggal_pinjam: date
    tanggal_kembali_rencana: date
    keperluan: str
    foto_kondisi_awal: str
    catatan_awal: str | None
    status: str
    approved_by: int | None
    approved_at: datetime | None
    tanggal_kembali_aktual: date | None
    foto_kondisi_akhir: str | None
    catatan_akhir: str | None
    status_pengembalian: str | None
    verified_by: int | None
    verified_at: datetime | None
    created_at: datetime
    user: UserBrief
    asset: AssetBrief


class DecisionNote(BaseModel):
    alasan: str | None = None


class VerifyRequest(BaseModel):
    keputusan: Literal["diterima", "ditolak"]
    alasan: str | None = None