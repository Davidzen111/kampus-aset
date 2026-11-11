import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { catOf, fileUrl, iconFor, initials, photoOf } from "../utils";
import { toast } from "./dialogs";

// ===== Ikon =====
const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const rect = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}a${r} ${r} 0 0 1 ${r} ${r}V${y + h - r}a${r} ${r} 0 0 1 ${-r} ${r}H${x + r}a${r} ${r} 0 0 1 ${-r} ${-r}V${y + r}a${r} ${r} 0 0 1 ${r} ${-r}Z`;

const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5",
  cube: "M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3ZM3.5 7.5 12 12l8.5-4.5M12 12v9",
  users: "M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.3c2 .8 3.5 2.6 3.5 5.7",
  shield: "M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6L12 3ZM9 12l2.2 2.2L15.5 10",
  inbox: "M12 3v11M7.5 10l4.5 4.5 4.5-4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4",
  return: "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
  chart: "M4 20V10M10 20V4M16 20v-8M21 20H3",
  history: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2",
  out: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2",
  download: "M12 4v11M7.5 11l4.5 4.5 4.5-4.5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  trash: "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6",
  sliders: "M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM11 8h9M4 8h1.5M16 13.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM4 16h9.5M18.5 16H20",
  search: circle(11, 11, 7) + "m20 20-3.5-3.5",
  user: circle(12, 8, 4) + "M4 21c0-4 3.6-7 8-7s8 3 8 7",
  camera: "M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" + circle(12, 13.5, 3.5),
  mail: rect(3, 5, 18, 14, 2) + "m3.5 7 8.5 6 8.5-6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
  pin: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" + circle(12, 9.5, 2.5),
  cal: rect(3.5, 5, 17, 15.5, 2.5) + "M3.5 10h17M8 3v4M16 3v4",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  x: "M6 6l12 12M18 6 6 18",
  check: "m5 12.5 4.5 4.5L19 7.5",
  image: rect(3, 4, 18, 16, 3) + circle(9, 10, 1.8) + "m21 16-5-5-8 8",
  hash: "M5 9h15M4 15h15M10 3 8 21M16 3l-2 18",
  id: rect(3, 5, 18, 14, 2) + circle(9, 11, 2) + "M6.5 16c.5-1.5 1.5-2 2.5-2s2 .5 2.5 2M14 10h4M14 14h3",
  cap: "M12 4 2 9l10 5 10-5-10-5ZM6 11.5V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.5",
  pie: circle(12, 12, 9) + "M12 7v5h5",
  sync: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M8 16H3v5",
  video: rect(2, 6, 14, 12, 3) + "m16 10 5-3v10l-5-3",
  building: rect(5, 3, 14, 18, 2) + "M9 8h1M14 8h1M9 12h1M14 12h1M10 21v-4h4v4",
  monitor: rect(3, 4, 18, 12, 2) + "M8 20h8M12 16v4",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
};

export const Icon = ({ n }) => <svg className="i" viewBox="0 0 24 24"><path d={PATHS[n]} /></svg>;

// ===== Tabel & label =====
// cols: [["JUDUL", row => elemen], ...]
export function Table({ cols, rows, empty }) {
  if (rows === null) return <p className="empty">Memuat…</p>;
  if (!rows.length) return <p className="empty">{empty}</p>;
  return (
    <table>
      <thead><tr>{cols.map(c => <th key={c[0]}>{c[0]}</th>)}</tr></thead>
      <tbody>{rows.map(r => <tr key={r.id}>{cols.map(c => <td key={c[0]}>{c[1](r)}</td>)}</tr>)}</tbody>
    </table>
  );
}

// cls: g (hijau) | b (biru) | y (kuning) | r (merah) | kosong (abu-abu)
export const Badge = ({ cls = "", children }) => <span className={`bd ${cls}`}>{children}</span>;

// ===== Direktori user (khusus admin) =====
// Daftar user dimuat sekali lalu dipakai ulang, supaya foto & detail tampil di semua tabel.
let dirCache = null, dirAt = 0;
function loadDirectory() {
  if (!dirCache || Date.now() - dirAt > 30000) {
    dirAt = Date.now();
    dirCache = api("/users").then(l => (Array.isArray(l) ? l : [])).catch(() => { dirCache = null; return []; });
  }
  return dirCache;
}
function useDirectory(enabled) {
  const [list, setList] = useState([]);
  useEffect(() => { if (enabled) loadDirectory().then(setList); }, [enabled]);
  return list;
}
// Cocokkan data user ringkas (dari peminjaman) dengan data lengkap di direktori.
const fullUser = (list, u) =>
  list.find(x => (u.id && x.id === u.id) || (u.email && x.email === u.email))
  || list.find(x => u.nim_nip && x.nim_nip === u.nim_nip && x.name === u.name)
  || u;

// Detail profil seseorang: isinya sama dengan halaman Profil (foto, identitas, kontak).
export function ProfileDialog({ user: u, onClose }) {
  useEffect(() => {
    const k = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);

  const pic = fileUrl(photoOf(u));
  const admin = !!u.is_admin;
  const status = { approved: ["Aktif", "g"], pending: ["Menunggu", "y"], rejected: ["Ditolak", "r"], inactive: ["Nonaktif", "r"] }[u.account_status];
  const rows = [
    [admin ? "NIP" : "NIM / NIP", u.nim_nip],
    [admin ? "Unit kerja" : "Program studi / Unit kerja", u.program_studi],
    ["Nomor telepon / WhatsApp", u.phone],
    ["Email kampus", u.email],
  ];
  return (
    <div className="ov" onClick={onClose}>
      <div className="dlg pdlg" role="dialog" aria-label="Profil" onClick={e => e.stopPropagation()}>
        <button className="pd-x" type="button" aria-label="Tutup" onClick={onClose}><Icon n="x" /></button>
        <div className="pd-av" style={pic ? { backgroundImage: `url("${pic}")` } : undefined}>{pic ? "" : initials(u.name)}</div>
        <h3>{u.name}</h3>
        <p className="pd-role">{admin ? "Admin" : "Mahasiswa"}{u.program_studi ? ` · ${u.program_studi}` : ""}{status && <Badge cls={status[1]}>{status[0]}</Badge>}</p>
        <div className="pd-rows">
          {rows.map(([k, v]) => (
            <div key={k}><span>{k}</span><b>{k === "Email kampus" && v ? <a href={`mailto:${v}`}>{v}</a> : v || "–"}</b></div>
          ))}
        </div>
        <button className="btn pri wide" type="button" onClick={onClose}>Tutup</button>
      </div>
    </div>
  );
}

// user (opsional): bila diberikan, foto bulat dan nama bisa diklik untuk melihat profil lengkapnya.
export function Person({ name, sub, user }) {
  const [open, setOpen] = useState(false);
  const full = fullUser(useDirectory(!!user), user || {});
  const pic = user ? fileUrl(photoOf(full)) : "";
  const body = (
    <>
      <span className="av2" style={pic ? { backgroundImage: `url("${pic}")`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : undefined}>{initials(name)}</span>
      <div><b>{name}</b>{sub && <small>{sub}</small>}</div>
    </>
  );
  if (!user) return <div className="who">{body}</div>;
  return (
    <>
      <button type="button" className="who link" title="Lihat profil" onClick={() => setOpen(true)}>{body}</button>
      {open && <ProfileDialog user={full} onClose={() => setOpen(false)} />}
    </>
  );
}

// Tombol bulat kecil untuk setuju (ok) / tolak (no) di tabel persetujuan.
export const IconButton = ({ kind, title, onClick }) => (
  <button className={`ic ${kind}`} title={title} onClick={onClick}>{kind === "ok" ? "✓" : "✕"}</button>
);

// ===== Unggah foto =====
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 5;

// Kotak unggah foto (klik atau seret). file: File | null. onChange(file | null)
export function PhotoPicker({ file, onChange, label = "Unggah foto", invalid }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const url = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const pick = f => {
    if (!f) return;
    if (!OK_TYPES.includes(f.type)) return toast("Gunakan foto JPG, PNG, atau WEBP", true);
    if (f.size > MAX_MB * 1048576) return toast(`Ukuran foto maksimal ${MAX_MB} MB`, true);
    onChange(f);
  };

  return (
    <div className={"drop" + (over ? " over" : "") + (invalid ? " bad" : "")} tabIndex={0} role="button" aria-label={label}
      onClick={() => input.current.click()}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current.click(); } }}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}>
      {url
        ? <><img src={url} alt="Pratinjau foto" /><button type="button" className="rm" onClick={e => { e.stopPropagation(); onChange(null); }}>Hapus</button></>
        : <><Icon n="upload" /><span>{label}</span></>}
      <input ref={input} type="file" hidden accept={OK_TYPES.join(",")} onChange={e => { pick(e.target.files[0]); e.target.value = ""; }} />
    </div>
  );
}

// Foto aset; bila tidak ada / gagal dimuat, tampil ikon.
export function AssetThumb({ asset }) {
  const [bad, setBad] = useState(false);
  const src = asset.photo_url && !bad ? fileUrl(asset.photo_url) : "";
  return src
    ? <img src={src} alt={asset.name} loading="lazy" onError={() => setBad(true)} />
    : <Icon n={iconFor(asset.name, catOf(asset))[0]} />;
}

// ===== Halaman login / register =====
// Kerangka halaman login/register: panel branding kiri + konten kanan.
export function AuthShell({ children }) {
  return (
    <div className="auth">
      <div className="a-page">
        <aside className="a-brand">
          <div className="a-main">
            <div className="a-logo" aria-hidden="true"><Icon n="cube" /></div>
            <h2>KampusAset</h2>
            <p>Sistem Manajemen Fasilitas Terpadu</p>
          </div>
          <div className="a-foot">
            <span>© 2025 KampusAset Universitas</span>
            <nav><a href="#">Privasi</a><span>•</span><a href="#">Bantuan</a></nav>
          </div>
        </aside>

        <main className="a-panel">
          <div className="a-center">{children}</div>
          <p className="a-secure">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            Data Anda terlindungi dan terenkripsi secara aman
          </p>
        </main>
      </div>
    </div>
  );
}

const ICONS = {
  mahasiswa: <path d="M12 4 2 9l10 5 10-5-10-5ZM6 11.5V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.5" />,
  dosen: <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM8 20h8M12 16v4" />,
};

// Pilihan peran (hanya tampilan; peran sebenarnya ditentukan backend lewat is_admin)
export function RoleToggle({ value, onChange }) {
  return (
    <>
      <span className="a-lbl" id="roleLbl">Peran Anda</span>
      <div className="a-roles" role="radiogroup" aria-labelledby="roleLbl">
        {["mahasiswa", "dosen"].map(r => (
          <button key={r} type="button" role="radio" aria-checked={value === r} onClick={() => onChange(r)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">{ICONS[r]}</svg>
            {r === "mahasiswa" ? "Mahasiswa" : "Dosen"}
          </button>
        ))}
      </div>
    </>
  );
}

export function PasswordField({ id, value, onChange, error, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="a-field">
      <label htmlFor={id}>Kata Sandi</label>
      <div className="a-input">
        <input id={id} type={show ? "text" : "password"} value={value} onChange={onChange} aria-invalid={!!error} {...rest} />
        <button type="button" className="a-eye" aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onClick={() => setShow(s => !s)}>
          <Icon n="eye" />
        </button>
      </div>
      {error && <p className="a-err">{error}</p>}
    </div>
  );
}