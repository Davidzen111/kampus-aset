from collections import Counter
from datetime import date

from sqlalchemy.orm import Session, joinedload

from app.models import Loan
from app.services.loans import today_local


def default_period() -> tuple[date, date]:
    """Enam bulan terakhir, dari tanggal 1 bulan ke-6 sampai hari ini."""
    t = today_local()
    m, y = t.month - 5, t.year
    if m <= 0:
        m += 12
        y -= 1
    return date(y, m, 1), t


def _ketepatan(loan: Loan, today: date) -> str:
    if loan.tanggal_kembali_aktual:
        return "Tepat waktu" if loan.tanggal_kembali_aktual <= loan.tanggal_kembali_rencana else "Terlambat"
    if loan.status == "disetujui" and today > loan.tanggal_kembali_rencana:
        return "Terlambat"
    return "-"


def build_report(db: Session, dari: date, sampai: date) -> dict:
    today = today_local()
    loans = (
        db.query(Loan)
        .options(joinedload(Loan.user), joinedload(Loan.asset))
        .filter(
            Loan.status.in_(["disetujui", "dikembalikan"]),
            Loan.tanggal_pinjam >= dari,
            Loan.tanggal_pinjam <= sampai,
        )
        .order_by(Loan.tanggal_pinjam)
        .all()
    )

    # Semua bulan dalam periode diisi, termasuk yang jumlahnya 0
    per_bulan: dict[str, int] = {}
    y, m = dari.year, dari.month
    while (y, m) <= (sampai.year, sampai.month):
        per_bulan[f"{y}-{m:02d}"] = 0
        m += 1
        if m > 12:
            m, y = 1, y + 1
    for l in loans:
        per_bulan[l.tanggal_pinjam.strftime("%Y-%m")] += 1

    selesai = [l for l in loans if l.status == "dikembalikan" and l.tanggal_kembali_aktual]
    tepat = sum(1 for l in selesai if l.tanggal_kembali_aktual <= l.tanggal_kembali_rencana)
    populer = Counter(l.asset.name for l in loans).most_common(1)

    return {
        "periode": {"dari": dari, "sampai": sampai},
        "total_peminjaman": len(loans),
        "tingkat_tepat_waktu": round(tepat / len(selesai) * 100, 1) if selesai else None,
        "aset_terpopuler": populer[0][0] if populer else None,
        "per_bulan": [{"bulan": k, "jumlah": v} for k, v in per_bulan.items()],
        "data": [
            {
                "id": l.id,
                "peminjam": l.user.name,
                "nim_nip": l.user.nim_nip or "-",
                "program_studi": l.user.program_studi or "-",
                "aset": l.asset.name,
                "kategori": l.asset.category,
                "tanggal_pinjam": l.tanggal_pinjam,
                "tanggal_kembali_rencana": l.tanggal_kembali_rencana,
                "tanggal_kembali_aktual": l.tanggal_kembali_aktual,
                "status": l.status,
                "ketepatan": _ketepatan(l, today),
            }
            for l in loans
        ],
    }