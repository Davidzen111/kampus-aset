import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "./config";
import { api } from "./api";
import { toast } from "./components/dialogs";

// ===== Format tanggal, nama, URL =====
export const fileUrl = u => !u ? "" : /^(https?:|data:|blob:)/.test(u) ? u : API_BASE + (u.startsWith("/") ? "" : "/") + u;

export const initials = n =>
  String(n || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

export const fmtDate = v => v
  ? new Date(String(v).slice(0, 10) + "T00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  : "-";

// Status peminjaman: halaman lama memakai nama field berbeda (status_pinjam / status).
export const loanStatus = l => l.status_pinjam ?? l.status;

export function toDate(v) {
  if (!v) return null;
  let s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  if (s.includes("T") && !/[zZ]|[+-]\d\d:?\d\d$/.test(s)) s += "Z";
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

export function relTime(v) {
  const d = toDate(v); if (!d) return "";
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  if (m < 1440) return `${Math.floor(m / 60)} jam lalu`;
  if (m < 2880) return "Kemarin";
  return `${Math.floor(m / 1440)} hari lalu`;
}

// Angka YYYYMMDD untuk membandingkan tanggal tanpa pengaruh jam/zona.
export const dayKey = v => { const d = toDate(v); return d ? d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() : 0; };

// Tanggal lokal hari ini: "YYYY-MM-DD"
export function todayISO() {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
// "12–13 Sep 2026", "30 Sep – 02 Okt 2026", atau satu tanggal bila sama
export function fmtRange(a, b) {
  const d1 = toDate(a), d2 = toDate(b);
  if (!d1) return "";
  const p = n => String(n).padStart(2, "0");
  const one = `${p(d1.getDate())} ${BLN[d1.getMonth()]} ${d1.getFullYear()}`;
  if (!d2 || d2.toDateString() === d1.toDateString()) return one;
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear())
    return `${p(d1.getDate())}\u2013${p(d2.getDate())} ${BLN[d2.getMonth()]} ${d2.getFullYear()}`;
  return `${p(d1.getDate())} ${BLN[d1.getMonth()]} \u2013 ${p(d2.getDate())} ${BLN[d2.getMonth()]} ${d2.getFullYear()}`;
}

// ===== Pemuat data =====
// Ambil data dari path API. rows === null artinya masih memuat.
export function useLoad(path) {
  const [rows, setRows] = useState(null);
  const reload = useCallback(
    () => api(path).then(setRows).catch(e => { toast(e.message, true); setRows([]); }),
    [path]
  );
  useEffect(() => { reload(); }, [reload]);
  return [rows, reload];
}

// Jalankan aksi, lalu muat ulang data; error tampil sebagai toast.
export async function run(fn, reload) {
  try { await fn(); await reload?.(); } catch (e) { toast(e.message, true); }
}

// ===== Pembantu halaman user =====
// Nama kolom foto di data user (dicoba berurutan)
export const photoOf = u => ["photo_url", "foto_profil", "foto", "avatar_url", "avatar"].map(k => u?.[k]).find(Boolean) || "";

export const catOf = a => a?.category?.name || a?.category || "";

// [ikon, warna] berdasarkan nama/kategori aset
export function iconFor(name = "", cat = "") {
  const t = `${name} ${cat}`.toLowerCase();
  if (/proyektor|projector|video/.test(t)) return ["video", "blue"];
  if (/ruang|gedung|aula|room|lab/.test(t)) return ["building", "orange"];
  if (/laptop|komputer|pc|monitor/.test(t)) return ["monitor", "green"];
  if (/kamera|camera|dslr/.test(t)) return ["camera", "green"];
  return ["cube", "blue"];
}

// [teks, warna badge: g | b | y | r]
export const ASSET_BADGE = { tersedia: ["Tersedia", "g"], dipinjam: ["Dipinjam", "r"], maintenance: ["Maintenance", "y"] };
export const LOAN_BADGE = {
  menunggu: ["Menunggu Persetujuan", "y"], disetujui: ["Disetujui", "g"],
  ditolak: ["Ditolak", "r"], dikembalikan: ["Dikembalikan", "b"],
};
export const RETURN_BADGE = {
  menunggu_verifikasi: ["Menunggu Verifikasi Pengembalian", "y"],
  ditolak: ["Pengembalian Ditolak", "r"],
};

export function loanBadge(l) {
  const rb = RETURN_BADGE[String(l.status_pengembalian || "").toLowerCase()];
  const s = String(loanStatus(l) || "").toLowerCase();
  if (s === "disetujui" && rb) return rb;
  return LOAN_BADGE[s] || [loanStatus(l) || "-", "b"];
}
