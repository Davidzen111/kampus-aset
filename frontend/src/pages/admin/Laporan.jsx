import { useEffect, useRef, useState } from "react";
import { api, download } from "../../api";
import { toast } from "../../components/dialogs";
import { Icon } from "../../components/ui";

const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const bln = k => BLN[+k.slice(5, 7) - 1];   // "2026-05" -> "Mei"
const thn = k => k.slice(0, 4);
const pct = v => String(v).replace(".", ",") + "%";

function periodLabel(items) {
  if (!items.length) return "";
  const a = items[0].bulan, b = items[items.length - 1].bulan;
  if (a === b) return `${bln(a)} ${thn(a)}`;
  return thn(a) === thn(b) ? `${bln(a)} – ${bln(b)} ${thn(b)}` : `${bln(a)} ${thn(a)} – ${bln(b)} ${thn(b)}`;
}

// Tinggi batang tertinggi (px). Kalau diubah, sesuaikan juga tinggi .bars di admin-theme.css
// (tinggi .bars = 18 + 8 + TINGGI_MAKS + 8 + 18).
const TINGGI_MAKS = 220;

function BarChart({ items }) {
  const puncak = Math.max(0, ...items.map(i => i.jumlah));
  const idxMax = puncak > 0 ? items.findIndex(i => i.jumlah === puncak) : -1;
  return (
    <div className="card chart">
      <div className="hd2"><h2>Peminjaman per bulan</h2><span className="per">{periodLabel(items)}</span></div>
      <div className="bars" role="img" aria-label="Grafik jumlah peminjaman per bulan">
        <div className="grid" aria-hidden="true">
          {[0, 1, 2, 3, 4].map(k => <i key={k} style={{ bottom: 26 + k * TINGGI_MAKS / 4 + "px" }} />)}
        </div>
        {items.map((i, n) => {
          const h = puncak ? Math.max(4, Math.round(i.jumlah / puncak * TINGGI_MAKS)) : 4;
          return (
            <div key={i.bulan} className={"col" + (n === idxMax ? " max" : "")} title={`${bln(i.bulan)} ${thn(i.bulan)}: ${i.jumlah} peminjaman`}>
              <span className="v">{i.jumlah}</span>
              <div className="bar" style={{ height: h + "px" }} />
              <span className="m">{bln(i.bulan)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCards({ report }) {
  const items = report.per_bulan;
  const bulanIni = items.length ? items[items.length - 1].jumlah : 0;
  const tw = report.tingkat_tepat_waktu;
  return (
    <div className="rstats">
      <div className="rstat">
        <span className="wm" aria-hidden="true"><Icon n="chart" /></span>
        <span className="ico"><Icon n="chart" /></span>
        <div><b>{bulanIni}</b><span className="l">Total peminjaman bulan ini</span></div>
      </div>
      <div className="rstat t-ok">
        <span className="wm" aria-hidden="true"><Icon n="clock" /></span>
        <span className="ico"><Icon n="clock" /></span>
        <div><b>{tw == null ? "-" : pct(tw)}</b><span className="l">Tingkat pengembalian tepat waktu</span></div>
      </div>
      <div className="rstat t-warm">
        <span className="wm" aria-hidden="true"><Icon n="cube" /></span>
        <span className="ico"><Icon n="cube" /></span>
        <div><b className="txt">{report.aset_terpopuler || "-"}</b><span className="l">Aset paling diminati</span></div>
      </div>
    </div>
  );
}

function DownloadMenu({ periode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    const away = e => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("click", away);
    return () => document.removeEventListener("click", away);
  }, []);

  const unduh = async format => {
    setOpen(false); setBusy(true);
    const { dari, sampai } = periode;
    try {
      await download(`/reports/loans/export?format=${format}&dari=${dari}&sampai=${sampai}`, `laporan_peminjaman_${dari}_${sampai}.${format}`);
      toast("Laporan diunduh");
    } catch (e) { toast(e.message, true); }
    setBusy(false);
  };

  return (
    <div className="tools" ref={box}>
      <button className="dl" type="button" disabled={busy} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Icon n="download" /><span>Unduh Laporan</span>
      </button>
      {open && (
        <div className="menu">
          <button type="button" onClick={() => unduh("xlsx")}>Excel (.xlsx)</button>
          <button type="button" onClick={() => unduh("pdf")}>PDF (.pdf)</button>
        </div>
      )}
    </div>
  );
}

// ===== Halaman =====
export default function Laporan() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  // default backend: 6 bulan terakhir sampai hari ini
  useEffect(() => { api("/reports/loans").then(setReport).catch(e => setError(e.message)); }, []);

  if (error) return <p className="empty">{error}</p>;
  if (!report) return <p className="empty">Memuat…</p>;
  return (
    <>
      <div className="tb">
        <div className="tb-t"><b>Ringkasan peminjaman</b><span>Statistik peminjaman aset kampus</span></div>
        <DownloadMenu periode={report.periode} />
      </div>
      <SummaryCards report={report} />
      <BarChart items={report.per_bulan} />
    </>
  );
}