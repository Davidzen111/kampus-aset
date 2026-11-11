from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    location: str
    description: str | None
    photo_url: str | None
    kondisi_aset: str
    status: str
    created_at: datetime


class ScheduleItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tanggal_pinjam: date
    tanggal_kembali_rencana: date
    status: str