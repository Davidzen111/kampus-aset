from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database import get_db
from app.models import User
from app.services.export import to_pdf, to_xlsx
from app.services.reports import build_report, default_period

router = APIRouter(prefix="/reports", tags=["Laporan"])

MEDIA = {
    "pdf": "application/pdf",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def _period(dari: date | None, sampai: date | None) -> tuple[date, date]:
    d, s = default_period()
    dari, sampai = dari or d, sampai or s
    if dari > sampai:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tanggal 'dari' tidak boleh setelah 'sampai'")
    return dari, sampai


@router.get("/loans")
def loan_report(
    dari: date | None = None,
    sampai: date | None = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dari, sampai = _period(dari, sampai)
    return build_report(db, dari, sampai)


@router.get("/loans/export")
def export_loan_report(
    format: Literal["pdf", "xlsx"] = "xlsx",
    dari: date | None = None,
    sampai: date | None = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    dari, sampai = _period(dari, sampai)
    report = build_report(db, dari, sampai)
    content = to_pdf(report) if format == "pdf" else to_xlsx(report)
    filename = f"laporan_peminjaman_{dari}_{sampai}.{format}"
    return Response(
        content=content,
        media_type=MEDIA[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )