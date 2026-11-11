import { Fragment, useState } from "react";
import { api, explainError } from "../../api";
import { dayKey, fileUrl, fmtDate, toDate, useLoad, catOf } from "../../utils";
import { toast } from "../../components/dialogs";
import { Icon, Badge, PhotoPicker, AssetThumb } from "../../components/ui";
import "../../styles/pengembalian.css";

const RET = {
  menunggu_verifikasi: { label: "Menunggu Verifikasi Admin", cls: "y", prefix: "Diajukan" },
  diterima: { label: "Diterima Admin", cls: "g", prefix: "Diverifikasi" },
  ditolak: { label: "Ditolak Admin", cls: "r", prefix: "Diverifikasi" },
};
const baseName = u => { try { return decodeURIComponent(String(u).split("?")[0].split("/").pop()); } catch { return "berkas"; } };

/* ---------- Ikon kecil (gaya garis) ---------- */
const Ico = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ReturnIco = () => <Ico><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Ico>;
const ShieldIco = () => <Ico><path d="M12 3 5 6v5.5c0 4.4 2.9 7.6 7 9.5 4.1-1.9 7-5.1 7-9.5V6l-7-3Z" /></Ico>;
const ShieldCheckIco = () => <Ico><path d="M12 3 5 6v5.5c0 4.4 2.9 7.6 7 9.5 4.1-1.9 7-5.1 7-9.5V6l-7-3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></Ico>;
const CalIco = () => <Ico><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16" /></Ico>;
const EyeIco = () => <Ico><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Ico>;
const CheckIco = () => <Ico><path d="m5 12.5 4.5 4.5L19 7.5" /></Ico>;
const ClockIco = () => <Ico><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Ico>;
const XIco = () => <Ico><path d="M6 6l12 12M18 6 6 18" /></Ico>;
const ArrowURIco = () => <Ico><path d="M7 17 17 7M8 7h9v9" /></Ico>;

/* ---------- Ilustrasi kondisi kosong ---------- */
function EmptyArt() {
  const st = { stroke: "#4F8A6F", strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  return (
    <svg className="pk-art" viewBox="0 0 640 340" aria-hidden="true">
      <defs>
        <linearGradient id="pkBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DCEBE1" /><stop offset="1" stopColor="#C3DBCC" /></linearGradient>
        <linearGradient id="pkBadge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5C9A80" /><stop offset="1" stopColor="#2F5E4C" /></linearGradient>
        <radialGradient id="pkHalo" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset=".7" stopColor="#fff" stopOpacity=".6" /><stop offset="1" stopColor="#fff" stopOpacity=".12" /></radialGradient>
        <filter id="pkSh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#2F5E4C" floodOpacity=".2" /></filter>
        <filter id="pkBlur"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>

      {/* orbit putus-putus + cahaya */}
      <circle cx="320" cy="170" r="168" fill="none" stroke="#B7D3C4" strokeWidth="1.6" strokeDasharray="3 8" strokeLinecap="round" opacity=".85" />
      <circle cx="320" cy="168" r="128" fill="url(#pkHalo)" />
      <ellipse cx="320" cy="272" rx="140" ry="16" fill="#C5D1C9" opacity=".8" filter="url(#pkBlur)" />

      {/* kotak terbuka */}
      <polygon points="236,168 196,104 262,100 288,168" fill="#E4F0E8" />
      <polygon points="352,168 384,102 442,102 410,168" fill="#BAD6C6" />
      <polygon points="240,160 402,160 418,192 222,192" fill="#9FC8B1" />
      <rect x="222" y="190" width="196" height="84" rx="10" fill="url(#pkBody)" />
      <rect x="302" y="190" width="38" height="84" fill="#A8CDB8" />
      <polygon points="302,160 340,160 340,192 302,192" fill="#8DB9A2" opacity=".8" />
      <rect x="244" y="224" width="54" height="34" rx="8" fill="#F6FAF7" />
      <rect x="252" y="233" width="34" height="5" rx="2.5" fill="#BFD5C8" />
      <rect x="252" y="244" width="22" height="5" rx="2.5" fill="#CFE0D5" />

      {/* lencana centang */}
      <g filter="url(#pkSh)">
        <circle cx="398" cy="108" r="40" fill="#fff" />
        <circle cx="398" cy="108" r="32" fill="url(#pkBadge)" />
        <path d="M382 109l11 12 22-25" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* ubin melayang: laptop */}
      <g className="pk-fl a">
        <rect x="96" y="56" width="96" height="96" rx="26" fill="#fff" filter="url(#pkSh)" />
        <rect x="120" y="84" width="48" height="34" rx="7" fill="#EAF3EE" {...st} />
        <path d="M133 101l8 8 14-15" {...st} strokeWidth="4.5" />
        <path d="M112 130h64" {...st} />
      </g>
      {/* proyektor */}
      <g className="pk-fl b">
        <rect x="70" y="200" width="86" height="86" rx="24" fill="#fff" filter="url(#pkSh)" />
        <rect x="88" y="229" width="50" height="30" rx="9" fill="#EEF0C8" {...st} />
        <circle cx="122" cy="244" r="7.5" {...st} strokeWidth="4.5" />
        <circle cx="102" cy="244" r="3.2" fill="#4F8A6F" />
        <path d="M97 259v7M129 259v7" {...st} />
      </g>
      {/* kalender */}
      <g className="pk-fl c">
        <rect x="470" y="190" width="96" height="96" rx="26" fill="#fff" filter="url(#pkSh)" />
        <rect x="494" y="218" width="48" height="44" rx="10" fill="#EEF0C8" {...st} />
        <path d="M494 232h48M506 210v14M530 210v14" {...st} />
        <circle cx="507" cy="247" r="3.4" fill="#4F8A6F" /><circle cx="518" cy="247" r="3.4" fill="#4F8A6F" /><circle cx="529" cy="247" r="3.4" fill="#4F8A6F" />
      </g>

      {/* hiasan */}
      <path d="M232 52v22M221 63h22" stroke="#A5CDB8" strokeWidth="6" strokeLinecap="round" />
      <path d="M500 40v18M491 49h18" stroke="#A5CDB8" strokeWidth="5" strokeLinecap="round" />
      <path d="M150 176v16M142 184h16" stroke="#A5CDB8" strokeWidth="5" strokeLinecap="round" />
      <circle cx="108" cy="44" r="5" fill="#A9CFBB" /><circle cx="588" cy="96" r="6" fill="#B9D8C7" /><circle cx="604" cy="266" r="5" fill="#B9D8C7" />
    </svg>
  );
}

/* ---------- Komponen kecil halaman ---------- */
const SectionHead = ({ icon, title, count }) => (
  <div className="pk-head">
    <span className="pk-hic">{icon}</span>
    <h2>{title}</h2>
    <span className={`pk-count ${count > 0 ? "on" : ""}`}>{count}</span>
  </div>
);

function Steps({ status }) {
  const acc = status === "diterima";
  const rej = status === "ditolak";
  const steps = [
    { label: "Diajukan", st: "done", icon: <ArrowURIco /> },
    { label: "Diverifikasi", st: acc || rej ? "done" : "cur", icon: <ShieldIco /> },
    { label: rej ? "Ditolak" : "Diterima", st: acc ? "fin" : rej ? "rej" : "todo", icon: rej ? <XIco /> : <CheckIco /> },
  ];
  return (
    <div className="pk-steps" role="list" aria-label="Tahap pengembalian">
      {steps.map((x, i) => (
        <Fragment key={x.label}>
          {i > 0 && <span className={`pk-line ${i === 1 || acc || rej ? "on" : ""}`} />}
          <div className="pk-step" role="listitem"><span className={`pk-dot ${x.st}`}>{x.icon}</span><em>{x.label}</em></div>
        </Fragment>
      ))}
    </div>
  );
}

// ---------- Dialog unggah bukti ----------
function ReturnDialog({ loan, onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const fd = new FormData();
    fd.append("foto_kondisi_akhir", file);
    if (note.trim()) fd.append("catatan_akhir", note.trim());
    setSending(true); setErr("");
    try {
      await api(`/loans/${loan.id}/return`, { method: "POST", body: fd });
      toast("Bukti terkirim. Pengembalian menunggu verifikasi Admin.");
      onDone();
    } catch (e) { setErr(explainError(e, "Gagal mengirim bukti. Coba lagi.")); setSending(false); }
  };

  return (
    <div className="ov">
      <div className="dlg wide">
        <h3>Unggah Bukti Pengembalian</h3>
        <p className="muted">{loan.asset?.name} • Batas: {fmtDate(loan.tanggal_kembali_rencana)}</p>
        <p>Unggah foto kondisi fisik aset terkini untuk verifikasi dan serah terima bersama staf pengelola aset.</p>
        <PhotoPicker file={file} onChange={setFile} label="Klik atau seret foto kondisi aset (JPG, PNG, WEBP, maks. 5 MB)" />
        <textarea className="note-in" placeholder="Catatan kondisi akhir (opsional), mis. aset bersih dan lengkap" value={note} onChange={e => setNote(e.target.value)} />
        {err && <p className="ferr" style={{ whiteSpace: "pre-line" }}>{err}</p>}
        <div className="btns">
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn pri" disabled={!file || sending} onClick={send}>{sending ? "Mengirim…" : "Kirim Bukti & Ajukan"}</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Panel detail ----------
function ReturnDetail({ loan: l, onClose }) {
  const u = l.user || {};
  const rs = RET[l.status_pengembalian] || { label: l.status_pengembalian, cls: "y" };
  const late = l.tanggal_kembali_aktual && dayKey(l.tanggal_kembali_aktual) > dayKey(l.tanggal_kembali_rencana);
  const files = [[l.foto_kondisi_akhir, "Foto kondisi saat dikembalikan"], [l.foto_kondisi_awal, "Foto kondisi awal peminjaman"]].filter(([p]) => p);

  return (
    <aside className="dr" role="dialog" aria-label="Detail pengembalian">
      <Badge cls={rs.cls}>{rs.label}</Badge>
      <h2>Detail Pengembalian Aset</h2>
      <small className="muted">ID: #RET-{String(l.id).padStart(4, "0")}</small>

      <div className="dsec">PEMINJAM</div>
      <div className="box"><b>{u.name || "–"}</b><small>NIM: {u.nim_nip || "–"}{u.program_studi ? ` · ${u.program_studi}` : ""}</small>
        {u.email && <div className="ln"><Icon n="mail" />{u.email}</div>}
        {u.phone && <div className="ln"><Icon n="phone" />{u.phone}</div>}</div>

      <div className="dsec">ASET</div>
      <div className="box"><b>{l.asset?.name || "–"}</b><small>{catOf(l.asset) || "–"} · {l.asset?.location || "–"}</small></div>

      <div className="dsec">JADWAL</div>
      <div className="box">
        <div className="ln">Ketepatan waktu: <Badge cls={late ? "r" : "g"}>{late ? "Terlambat" : "Tepat Waktu"}</Badge></div>
        <div className="ln">Tanggal pinjam: {fmtDate(l.tanggal_pinjam)}</div>
        <div className="ln">Tanggal kembali: {fmtDate(l.tanggal_kembali_aktual)}</div>
        {l.catatan_akhir && <p className="note-q">“{l.catatan_akhir}”</p>}
      </div>

      <div className="dsec">LAMPIRAN</div>
      {files.length ? files.map(([p, label]) => (
        <div className="att" key={p}><div><b>{baseName(p)}</b><small>{label}</small></div><a className="lnk" href={fileUrl(p)} target="_blank" rel="noreferrer">Lihat</a></div>
      )) : <p className="empty">Belum ada lampiran.</p>}

      <div className="btns"><button className="btn pri" onClick={onClose}>Tutup</button></div>
    </aside>
  );
}

// ---------- Halaman ----------
export default function Pengembalian() {
  const [loans, reload] = useLoad("/loans/mine");
  const [target, setTarget] = useState(null);
  const [detail, setDetail] = useState(null);

  const status = l => String(l.status_pinjam ?? l.status ?? "").toLowerCase();
  const ready = (loans || []).filter(l => status(l) === "disetujui" && (!l.status_pengembalian || l.status_pengembalian === "ditolak"));
  const verif = (loans || []).filter(l => l.status_pengembalian)
    .sort((a, b) => (toDate(b.verified_at || b.tanggal_kembali_aktual) || 0) - (toDate(a.verified_at || a.tanggal_kembali_aktual) || 0));

  const Thumb = ({ l }) => <div className="pk-thumb"><AssetThumb asset={l.asset || {}} /></div>;

  return (
    <>
      {/* ===== Siap dikembalikan ===== */}
      <SectionHead icon={<ReturnIco />} title="Siap Dikembalikan" count={ready.length} />
      {loans === null ? <div className="pk-panel pk-load">Memuat…</div>
        : !ready.length ? (
          <div className="pk-panel">
            <EmptyArt />
            <p className="pk-empty-t">Tidak ada aset yang sedang dipinjam</p>
          </div>
        ) : (
          <div className="pk-list">
            {ready.map((l, i) => {
              const notStarted = dayKey(l.tanggal_pinjam) > dayKey(new Date());
              const hint = notStarted ? `Mulai ${fmtDate(l.tanggal_pinjam)} · ` : l.status_pengembalian === "ditolak" ? "Pengembalian ditolak, ajukan ulang · " : "";
              return (
                <div className="pk-item" key={l.id} style={{ "--i": i }}>
                  <Thumb l={l} />
                  <div className="pk-info"><b>{l.asset?.name}</b><small><CalIco />{hint}Batas kembali: {fmtDate(l.tanggal_kembali_rencana)}</small></div>
                  <button className="pk-btn" disabled={notStarted} onClick={() => setTarget(l)}><ReturnIco />Ajukan Pengembalian</button>
                </div>
              );
            })}
          </div>
        )}

      {/* ===== Status verifikasi ===== */}
      <div className="pk-gap" />
      <SectionHead icon={<ShieldCheckIco />} title="Status Verifikasi" count={verif.length} />
      {loans === null ? <div className="pk-panel pk-load slim">Memuat…</div>
        : !verif.length ? (
          <div className="pk-empty"><span><ShieldCheckIco /></span><p>Belum ada pengajuan pengembalian.</p></div>
        ) : (
          <div className="pk-list">
            {verif.map((l, i) => {
              const s = RET[l.status_pengembalian] || { label: l.status_pengembalian, cls: "y", prefix: "Diajukan" };
              return (
                <div className="pk-item" key={l.id} style={{ "--i": i }}>
                  <Thumb l={l} />
                  <div className="pk-info"><b>{l.asset?.name}</b><small><CalIco />{s.prefix} {fmtDate(s.cls === "y" ? l.tanggal_kembali_aktual : l.verified_at || l.tanggal_kembali_aktual)}</small></div>
                  <Steps status={l.status_pengembalian} />
                  <div className="pk-act">
                    <span className={`pk-pill ${s.cls}`}>{s.cls === "g" ? <CheckIco /> : s.cls === "r" ? <XIco /> : <ClockIco />}{s.label}</span>
                    <button className="pk-btn" onClick={() => setDetail(l)}><EyeIco />Detail</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {target && <ReturnDialog loan={target} onClose={() => setTarget(null)} onDone={() => { setTarget(null); reload(); }} />}
      {detail && <ReturnDetail loan={detail} onClose={() => setDetail(null)} />}
    </>
  );
}