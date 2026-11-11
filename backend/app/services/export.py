from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

HEADERS = [
    "No", "Peminjam", "NIM/NIP", "Program Studi", "Aset", "Kategori",
    "Tgl Pinjam", "Rencana Kembali", "Kembali Aktual", "Status", "Ketepatan",
]


def _row(i: int, r: dict) -> list:
    return [
        i, r["peminjam"], r["nim_nip"], r["program_studi"], r["aset"], r["kategori"],
        str(r["tanggal_pinjam"]), str(r["tanggal_kembali_rencana"]),
        str(r["tanggal_kembali_aktual"] or "-"), r["status"], r["ketepatan"],
    ]


def _ringkasan(report: dict) -> list[tuple[str, str]]:
    p = report["periode"]
    tw = report["tingkat_tepat_waktu"]
    return [
        ("Periode", f'{p["dari"]} s.d. {p["sampai"]}'),
        ("Total peminjaman", str(report["total_peminjaman"])),
        ("Tingkat pengembalian tepat waktu", f"{tw}%" if tw is not None else "-"),
        ("Aset paling diminati", report["aset_terpopuler"] or "-"),
    ]


def to_xlsx(report: dict) -> bytes:
    wb = Workbook()

    ws = wb.active
    ws.title = "Ringkasan"
    ws.append(["Laporan Peminjaman Aset Kampus"])
    ws["A1"].font = Font(bold=True, size=14)
    ws.append([])
    for k, v in _ringkasan(report):
        ws.append([k, v])
    ws.append([])
    ws.append(["Bulan", "Jumlah Peminjaman"])
    for c in ws[ws.max_row]:
        c.font = Font(bold=True)
    for b in report["per_bulan"]:
        ws.append([b["bulan"], b["jumlah"]])
    ws.column_dimensions["A"].width = 38
    ws.column_dimensions["B"].width = 30

    ds = wb.create_sheet("Data Peminjaman")
    ds.append(HEADERS)
    for c in ds[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="222222")
    for i, r in enumerate(report["data"], 1):
        ds.append(_row(i, r))
    for col in ds.columns:
        panjang = max(len(str(c.value or "")) for c in col)
        ds.column_dimensions[col[0].column_letter].width = min(max(panjang + 2, 8), 40)
    ds.freeze_panes = "A2"

    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


def to_pdf(report: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=landscape(A4),
        leftMargin=24, rightMargin=24, topMargin=24, bottomMargin=24,
    )
    styles = getSampleStyleSheet()
    kecil = ParagraphStyle("kecil", parent=styles["Normal"], fontSize=7.5, leading=9)
    kepala = ParagraphStyle("kepala", parent=kecil, textColor=colors.white, fontName="Helvetica-Bold")

    elemen = [Paragraph("Laporan Peminjaman Aset Kampus", styles["Title"])]
    for k, v in _ringkasan(report):
        elemen.append(Paragraph(f"<b>{k}:</b> {v}", styles["Normal"]))
    elemen.append(Spacer(1, 10))

    data = [[Paragraph(h, kepala) for h in HEADERS]]
    for i, r in enumerate(report["data"], 1):
        data.append([Paragraph(str(c), kecil) for c in _row(i, r)])

    lebar = [22, 90, 60, 90, 90, 55, 55, 60, 60, 55, 55]
    tabel = Table(data, colWidths=lebar, repeatRows=1)
    tabel.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#222222")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F3F3F3")]),
    ]))
    elemen.append(tabel)
    if not report["data"]:
        elemen.append(Paragraph("Tidak ada data pada periode ini.", styles["Normal"]))

    doc.build(elemen)
    return buf.getvalue()