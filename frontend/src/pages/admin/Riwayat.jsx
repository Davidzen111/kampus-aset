import { useState } from "react";
import { api } from "../../api";
import { fileUrl, fmtDate, loanStatus, run, todayISO, useLoad } from "../../utils";
import { Person } from "../../components/ui";
import { ask, toast } from "../../components/dialogs";
import "../../styles/kelola-aset.css";
import "../../styles/riwayat-admin.css";

const LOAN_BD = { menunggu: "y", disetujui: "b", dipinjam: "b", ditolak: "r", dikembalikan: "g", selesai: "g" };
const RET_BD = { menunggu_verifikasi: "y", diterima: "g", ditolak: "r" };
const label = v => String(v).replace(/_/g, " ");


const FILTERS = [
  ["", "Semua"],
  ["menunggu", "Menunggu"],
  ["disetujui", "Disetujui"],
  ["ditolak", "Ditolak"],
  ["dikembalikan", "Dikembalikan"],
  ["menunggu_verifikasi", "Menunggu verifikasi"],
  ["diterima", "Pengembalian diterima"],
];

/* ---------- Ikon garis ---------- */
const Ico = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const SearchIco = () => <Ico><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Ico>;
const XIco = () => <Ico><path d="M6 6l12 12M18 6 6 18" /></Ico>;
const CalIco = () => <Ico><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16" /></Ico>;
const ReturnIco = () => <Ico><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Ico>;
const BoxIco = () => <Ico><path d="M12 3 4 7.5v9L12 21l8-4.5v-9Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></Ico>;
const HistoryIco = () => <Ico><path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2L3.5 8.5" /><path d="M3.5 3.5v5h5M12 8v4.2l2.8 1.8" /></Ico>;
const BellIco = () => <Ico><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" /></Ico>;

export default function Riwayat() {
  const [rows] = useLoad("/loans");
  const [q, setQ] = useState("");
  const [f, setF] = useState("");
  const [busyId, setBusyId] = useState(null);   
  const [runAll, setRunAll] = useState(false);  
  const today = todayISO();

  const matchStatus = (l, v) => !v || loanStatus(l) === v || l.status_pengembalian === v;

  const canRemind = l => loanStatus(l) === "disetujui" && l.status_pengembalian !== "menunggu_verifikasi";
  const overdue = l => String(l.tanggal_kembali_rencana).slice(0, 10) < today;

  const remind = l => run(async () => {
    const ok = await ask(`Kirim pengingat pengembalian “${l.asset.name}” ke ${l.user.name}?`, { ok: "Kirim pengingat" });
    if (ok === null) return;
    setBusyId(l.id);
    try {
      const r = await api(`/notifications/remind/${l.id}`, { method: "POST" });
      toast(r.message || "Peringatan dikirim ke peminjam");
    } finally {
      setBusyId(null);
    }
  });

  const remindAll = () => run(async () => {
    const ok = await ask(
      "Kirim pengingat otomatis ke semua peminjam yang batas pengembaliannya besok, hari ini, atau sudah lewat? " +
      "Peminjam yang sudah diingatkan dalam 20 jam terakhir dilewati.",
      { ok: "Kirim sekarang" },
    );
    if (ok === null) return;
    setRunAll(true);
    try {
      const r = await api("/notifications/reminders/run", { method: "POST" });
      toast(r.dibuat > 0 ? `${r.dibuat} pengingat dikirim` : "Tidak ada pengingat baru yang perlu dikirim");
    } finally {
      setRunAll(false);
    }
  });

  const shown = rows && rows
    .filter(l => matchStatus(l, f))
    .filter(l => !q || `${l.user.name} ${l.user.nim_nip || ""} ${l.asset.name}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => String(b.tanggal_pinjam).localeCompare(String(a.tanggal_pinjam)));

  const count = v => (rows || []).filter(l => matchStatus(l, v)).length;
  const loading = rows === null;

  return (
    <div className="ka">
      {/* ===== Pencarian & pengingat otomatis ===== */}
      <div className="ka-bar">
        <label className="ka-search">
          <SearchIco />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari peminjam / aset…" aria-label="Cari peminjam atau aset" />
          {q && <button type="button" className="ka-clear" onClick={() => setQ("")} aria-label="Hapus pencarian"><XIco /></button>}
        </label>
        <button type="button" className="rh-auto" disabled={runAll} onClick={remindAll}
          title="Kirim pengingat ke peminjam yang jatuh tempo besok, hari ini, atau terlambat">
          <BellIco />{runAll ? "Memproses…" : "Pengingat otomatis"}
        </button>
      </div>

      {/* ===== Filter status ===== */}
      <div className="rh-chips" role="group" aria-label="Filter status">
        {FILTERS.map(([v, text]) => (
          <button type="button" key={text} className={`rh-chip ${f === v ? "on" : ""}`} aria-pressed={f === v} onClick={() => setF(v)}>
            {text}<b>{loading ? "–" : count(v)}</b>
          </button>
        ))}
      </div>

      {/* ===== Tabel ===== */}
      <div className="ka-card">
        <div className="ka-scroll">
          <table className="ka-table rh-table">
            <thead>
              <tr><th>Peminjam</th><th>Aset</th><th>Tanggal</th><th>Dikembalikan</th><th>Status pinjam</th><th>Pengembalian</th><th className="r">Aksi</th></tr>
            </thead>
            <tbody>
              {loading ? [0, 1, 2].map(i => (
                <tr className="ka-sk" key={i}><td colSpan={7}><span className="th" /><i className="w40" /><i className="w20" /></td></tr>
              )) : shown.map((l, i) => {
                const st = loanStatus(l);
                const late = canRemind(l) && overdue(l);
                return (
                  <tr key={l.id} style={{ "--i": Math.min(i, 12) }}>
                    <td><Person name={l.user.name} sub={l.user.nim_nip} user={l.user} /></td>
                    <td>
                      <div className="rh-asset">
                        {l.asset.photo_url ? <img className="ka-thumb" src={fileUrl(l.asset.photo_url)} alt="" /> : <span className="ka-thumb ph"><BoxIco /></span>}
                        <b>{l.asset.name}</b>
                      </div>
                    </td>
                    <td>
                      <div className="rh-date">
                        <span><CalIco />{fmtDate(l.tanggal_pinjam)} – {fmtDate(l.tanggal_kembali_rencana)}</span>
                        {l.keperluan && <small>{l.keperluan}</small>}
                      </div>
                    </td>
                    <td>
                      <span className="rh-ret"><ReturnIco />{fmtDate(l.tanggal_kembali_aktual)}</span>
                    </td>
                    <td><span className={`ka-pill cap ${LOAN_BD[st] || ""}`}><i />{label(st)}</span></td>
                    <td>
                      {l.status_pengembalian
                        ? <span className={`ka-pill cap ${RET_BD[l.status_pengembalian] || ""}`}><i />{label(l.status_pengembalian)}</span>
                        : <span className="rh-dash">-</span>}
                    </td>
                    <td className="r">
                      {canRemind(l)
                        ? <button type="button" className={`rh-remind${late ? " late" : ""}`} disabled={busyId === l.id} onClick={() => remind(l)}
                            title={late ? "Sudah melewati batas pengembalian" : "Kirim pengingat pengembalian"}
                            aria-label={`Ingatkan ${l.user.name} mengembalikan ${l.asset.name}`}>
                            <BellIco />{busyId === l.id ? "Mengirim…" : late ? "Ingatkan (terlambat)" : "Ingatkan"}
                          </button>
                        : <span className="rh-dash">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && !shown.length && (
          <div className="ka-empty">
            <span>{rows.length ? <SearchIco /> : <HistoryIco />}</span>
            <p>{rows.length ? "Tidak ada riwayat yang cocok." : "Belum ada riwayat."}</p>
          </div>
        )}
      </div>
    </div>
  );
}