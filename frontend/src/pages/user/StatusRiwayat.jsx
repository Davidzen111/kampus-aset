import { useState } from "react";
import { fmtRange, loanStatus, toDate, useLoad, loanBadge } from "../../utils";
import { AssetThumb } from "../../components/ui";
import "../../styles/status-riwayat.css";

const ACTIVE = ["menunggu", "disetujui"];   // sisanya masuk Riwayat

/* ---------- Ikon garis ---------- */
const Ico = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const SearchIco = () => <Ico><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Ico>;
const XIco = () => <Ico><path d="M6 6l12 12M18 6 6 18" /></Ico>;
const CalIco = () => <Ico><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16" /></Ico>;
const CheckIco = () => <Ico><path d="m5 12.5 4.5 4.5L19 7.5" /></Ico>;
const ClockIco = () => <Ico><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Ico>;
const InfoIco = () => <Ico><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></Ico>;
const HourglassIco = () => <Ico><path d="M7 3h10M7 21h10M8 3v3.5c0 1.6 1.2 2.7 2.4 3.5l1.6 1 1.6-1c1.2-.8 2.4-1.9 2.4-3.5V3M8 21v-3.5c0-1.6 1.2-2.7 2.4-3.5l1.6-1 1.6 1c1.2.8 2.4 1.9 2.4 3.5V21" /></Ico>;
const HistoryIco = () => <Ico><path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2L3.5 8.5" /><path d="M3.5 3.5v5h5M12 8v4.2l2.8 1.8" /></Ico>;
const InboxIco = () => <Ico><path d="M4 13.5 6.5 5.8A2 2 0 0 1 8.4 4.5h7.2a2 2 0 0 1 1.9 1.3L20 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /><path d="M4 13.5h4.2l1 2.5h5.6l1-2.5H20" /></Ico>;

const PILL_ICO = { g: <CheckIco />, y: <ClockIco />, r: <XIco />, b: <InfoIco /> };

/* ---------- Komponen kecil ---------- */
const SectionHead = ({ icon, title, count }) => (
  <div className="sr-head">
    <span className="sr-hic">{icon}</span>
    <h2>{title}</h2>
    <span className={`sr-count ${count > 0 ? "on" : ""}`}>{count}</span>
  </div>
);

const Empty = ({ icon, text }) => (
  <div className="sr-empty"><span>{icon}</span><p>{text}</p></div>
);

const Skeleton = () => (
  <div className="sr-list" aria-busy="true">
    {[0, 1].map(i => (
      <div className="sr-item sr-sk" key={i}><span className="sr-thumb" /><div className="sr-info"><i className="w60" /><i className="w35" /></div><i className="pill" /></div>
    ))}
  </div>
);

function Row({ l, i }) {
  const [label, cls] = loanBadge(l);
  return (
    <div className={`sr-item ${cls || ""}`} style={{ "--i": i }}>
      <div className="sr-thumb"><AssetThumb asset={l.asset || {}} /></div>
      <div className="sr-info">
        <b>{l.asset?.name || "Aset"}</b>
        <small><CalIco />{fmtRange(l.tanggal_pinjam, l.tanggal_kembali_rencana)}</small>
      </div>
      <span className={`sr-pill ${cls || ""}`}>{PILL_ICO[cls] || <i className="sr-dot" />}{label}</span>
    </div>
  );
}

export default function StatusRiwayat() {
  const [loans] = useLoad("/loans/mine");
  const [q, setQ] = useState("");

  const list = (loans || [])
    .filter(l => !q || String(l.asset?.name || "").toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (toDate(b.created_at || b.tanggal_pinjam) || 0) - (toDate(a.created_at || a.tanggal_pinjam) || 0));
  const active = list.filter(l => ACTIVE.includes(loanStatus(l)));
  const history = list.filter(l => !active.includes(l));
  const none = (t, icon) => <Empty icon={q ? <SearchIco /> : icon} text={q ? "Tidak ada hasil." : t} />;

  return (
    <>
      {/* ===== Pencarian ===== */}
      <label className="sr-search">
        <SearchIco />
        <input type="search" placeholder="Cari nama aset…" aria-label="Cari nama aset" value={q} onChange={e => setQ(e.target.value)} />
        {q && <button type="button" className="sr-clear" onClick={() => setQ("")} aria-label="Hapus pencarian"><XIco /></button>}
      </label>

      {/* ===== Aktif ===== */}
      <SectionHead icon={<HourglassIco />} title="Status Pengajuan Aktif" count={active.length} />
      {loans === null ? <Skeleton />
        : active.length ? <div className="sr-list">{active.map((l, i) => <Row key={l.id} l={l} i={i} />)}</div>
        : none("Tidak ada pengajuan aktif.", <InboxIco />)}

      {/* ===== Riwayat ===== */}
      <div className="sr-gap" />
      <SectionHead icon={<HistoryIco />} title="Riwayat Peminjaman" count={history.length} />
      {loans === null ? <Skeleton />
        : history.length ? <div className="sr-list">{history.map((l, i) => <Row key={l.id} l={l} i={i} />)}</div>
        : none("Belum ada riwayat peminjaman.", <HistoryIco />)}
    </>
  );
}