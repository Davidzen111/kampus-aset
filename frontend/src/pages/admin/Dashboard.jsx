import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api";
import { relTime } from "../../utils";
import { Icon } from "../../components/ui";


const pick = (o, keys, d) => { for (const k of keys) if (o && o[k] !== undefined && o[k] !== null) return o[k]; return d; };
const norm = k => String(k).toLowerCase().replace(/[^a-z0-9]/g, "");
const isNum = v => v !== null && v !== undefined && v !== "" && typeof v !== "boolean" && !isNaN(Number(v));

function flatten(obj, out = {}, depth = 0) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || depth > 4) return out;
  for (const [k, v] of Object.entries(obj)) {
    const nk = norm(k);
    if (v !== null && typeof v === "object" && !Array.isArray(v)) flatten(v, out, depth + 1);
    else if (!(nk in out)) out[nk] = v;
  }
  return out;
}

function findList(obj, names, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 4) return null;
  const want = names.map(norm);
  for (const [k, v] of Object.entries(obj)) if (Array.isArray(v) && want.includes(norm(k))) return v;
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) { const r = findList(v, names, depth + 1); if (r) return r; }
  }
  return null;
}

const STATS = [
  { id: "sAset", names: ["total_assets","total_aset","assets_total","assets","aset","jumlah_aset","asset_count","total_asset","assets_count"],
    has: /asset|aset/, not: /borrow|loan|pinjam|pending|avail|tersedia|return|kembali|rusak|damage|maint|popular|top|user/ },
  { id: "sPinjam", names: ["borrowed_assets","active_loans","sedang_dipinjam","borrowed","assets_borrowed","aset_dipinjam","loaned_assets","currently_borrowed","borrowed_count","active_borrowings","on_loan","dipinjam"],
    has: /borrow|loan|pinjam/, not: /pending|request|ajuan|return|kembali|top|popular/ },
  { id: "sPending", names: ["pending_loans","pending_requests","pengajuan_pending","pending","pending_borrowings","pending_loan_requests","pengajuan","pending_submissions"],
    has: /pending|menunggu|ajuan|request/, not: /user|akun|account|return|kembali|verif|regist/ },
  { id: "sAkun", names: ["pending_users","pending_accounts","akun_perlu_verifikasi","unverified_users","pending_verifications","pending_registrations","akun_pending","users_pending"],
    has: /(?=.*(user|akun|account|regist))(?=.*(pending|unverif|verif|menunggu))/, not: /return|kembali|loan|pinjam/ },
  { id: "sUser", names: ["total_users","total_pengguna","users_total","users","jumlah_user","user_count","total_user","jumlah_pengguna"],
    has: /user|pengguna/, not: /pending|verif|active|aktif|akun|regist/ },
  { id: "sKembali", names: ["pending_returns","waiting_return_verification","menunggu_verifikasi_kembali","returns_pending","pending_return_verifications","return_pending","pengembalian_pending","pending_return"],
    has: /(?=.*(return|kembali))(?=.*(pending|wait|menunggu|verif))/, not: null },
];

function findStat(flat, def) {
  for (const n of def.names) { const v = flat[norm(n)]; if (isNum(v)) return Number(v); }
  for (const [k, v] of Object.entries(flat)) {
    if (!isNum(v)) continue;
    if (def.has.test(k) && !(def.not && def.not.test(k))) return Number(v);
  }
  return null;
}

const TOP_KEYS = ["top_assets","most_borrowed","aset_terpopuler","popular_assets","top_borrowed","most_borrowed_assets","top_loaned_assets","aset_paling_sering_dipinjam","top"];
const ACT_KEYS = ["recent_activity","activities","aktivitas","recent_activities","latest_activity","latest_activities","aktivitas_terbaru","activity","logs","recent"];

const ACT_STYLE = {
  loan:    { cls: "orange", icon: "inbox" },
  return:  { cls: "green",  icon: "return" },
  account: { cls: "red",    icon: "shield" },
  asset:   { cls: "blue",   icon: "cube" },
};

function actType(a) {
  const rawType = pick(a, ["type", "kind", "category", "jenis", "action", "event"], "");
  const msg = pick(a, ["message", "text", "description", "detail", "title", "activity", "keterangan"], "");
  const t = norm(rawType + " " + msg);
  if (/return|kembali/.test(t)) return "return";
  if (/loan|pinjam|ajuan|borrow|request/.test(t)) return "loan";
  if (/account|user|akun|regist|daftar|verif|mendaftar/.test(t)) return "account";
  return "asset";
}

function actText(a) {
  const m = pick(a, ["message", "text", "description", "detail", "title", "activity", "keterangan", "deskripsi", "pesan", "catatan"], "");
  if (m) return m;
  const nm = v => (v && typeof v === "object") ? (v.name || v.nama || "") : (v || "");
  const who = nm(pick(a, ["user_name", "nama_user", "user", "peminjam", "borrower", "actor"], ""));
  const asset = nm(pick(a, ["asset_name", "nama_aset", "asset", "aset"], ""));
  const act = pick(a, ["action", "aksi", "status", "status_pinjam", "type", "jenis", "event"], "");
  const parts = [who, act, asset].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return Object.entries(a || {})
    .filter(([k, v]) => typeof v === "string" && v && !/date|time|_at$|tanggal|waktu|^id$|_id$/i.test(k))
    .map(([, v]) => v).join(" · ") || "(tanpa keterangan)";
}

// ===== Ilustrasi banner =====
const Chip = ({ x, y, children }) => (
  <g transform={`translate(${x} ${y})`} filter="url(#adSh)">
    <rect width="46" height="46" rx="13" fill="#fff" />
    <g transform="translate(11 11)" fill="none" stroke="#3F7A62" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</g>
  </g>
);

function AdminArt() {
  return (
    <svg viewBox="0 0 500 245" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
      <defs>
        <filter id="adSh" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#10281f" floodOpacity=".25" />
        </filter>
      </defs>
      <circle cx="250" cy="118" r="104" fill="rgba(255,255,255,.07)" />
      <circle cx="250" cy="118" r="112" fill="none" stroke="#fff" strokeOpacity=".22" />
      <g fill="#fff" opacity=".75">
        <circle cx="132" cy="22" r="2" /><circle cx="205" cy="48" r="1.5" /><circle cx="388" cy="70" r="1.5" /><circle cx="470" cy="150" r="2" /><circle cx="96" cy="96" r="1.5" />
      </g>
      <g transform="translate(-50 0)">
        <ellipse cx="300" cy="224" rx="200" ry="28" fill="#4F8A6B" />
        <ellipse cx="300" cy="221" rx="165" ry="19" fill="#7DAE92" />
        <path d="M286 206h28l30 39h-88z" fill="#E6F0E9" />
        <rect x="178" y="130" width="74" height="52" fill="#DCE9E0" /><rect x="348" y="130" width="74" height="52" fill="#DCE9E0" />
        <rect x="174" y="124" width="82" height="7" rx="2" fill="#EEF5F0" /><rect x="344" y="124" width="82" height="7" rx="2" fill="#EEF5F0" />
        <g fill="#9CC1AC">
          <rect x="190" y="142" width="11" height="22" rx="5.5" /><rect x="228" y="142" width="11" height="22" rx="5.5" />
          <rect x="360" y="142" width="11" height="22" rx="5.5" /><rect x="398" y="142" width="11" height="22" rx="5.5" />
        </g>
        <rect x="238" y="106" width="124" height="76" fill="#E9F2EC" />
        {[246, 264, 282, 309, 327, 345].map(x => (
          <g key={x}><rect x={x} y="112" width="9" height="66" fill="#F7FBF8" /><rect x={x + 6} y="112" width="3" height="66" fill="#DCE9E0" opacity=".7" /></g>
        ))}
        <path d="M291 182V158a9 9 0 0 1 18 0V182Z" fill="#2F6E58" />
        <rect x="232" y="98" width="136" height="9" rx="1" fill="#F4F9F5" />
        <polygon points="232,98 300,62 368,98" fill="#E2EDE6" /><polygon points="248,96 300,70 352,96" fill="#D2E3D8" />
        <circle cx="300" cy="86" r="6.5" fill="#2F6E58" stroke="#F4F9F5" strokeWidth="2.5" />
        <line x1="300" y1="62" x2="300" y2="34" stroke="#EAF2E8" strokeWidth="2" /><path d="M300 34l24 7-24 7z" fill="#DDE87A" />
        <rect x="226" y="182" width="148" height="6" fill="#D9E8DE" /><rect x="216" y="188" width="168" height="6" fill="#CBDFD3" /><rect x="206" y="194" width="188" height="7" fill="#BCD5C7" />
        <rect x="140" y="168" width="6" height="44" fill="#2D6B55" /><circle cx="143" cy="158" r="22" fill="#86B49C" /><circle cx="165" cy="176" r="15" fill="#5C9A7D" /><circle cx="126" cy="176" r="13" fill="#6CA68A" />
        <rect x="455" y="170" width="6" height="42" fill="#2D6B55" /><circle cx="458" cy="160" r="20" fill="#86B49C" /><circle cx="436" cy="180" r="14" fill="#5C9A7D" /><circle cx="478" cy="178" r="12" fill="#6CA68A" />
      </g>
      <Chip x={34} y={30}><path d="M4 20V10M10 20V4M16 20v-8M21 20H3" /></Chip>
      <Chip x={46} y={118}><path d="M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.3c2 .8 3.5 2.6 3.5 5.7" /></Chip>
      <Chip x={398} y={20}><path d="M12 3v11M7.5 10l4.5 4.5 4.5-4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></Chip>
      <Chip x={448} y={62}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3ZM9 12l2 2 4-4" /></Chip>
      <Chip x={420} y={112}><path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3ZM3.5 7.5 12 12l8.5-4.5M12 12v9" /></Chip>
    </svg>
  );
}

// ===== Komponen =====
function StatCard({ icon, tone, value, label, sub, to }) {
  return (
    <Link className={`ad-stat ${tone}`} to={to}>
      <span className="ad-orb"><Icon n={icon} /></span>
      <div className="ad-sic"><Icon n={icon} /></div>
      <div className="ad-val"><strong>{value ?? "–"}</strong><span>{label}</span></div>
      <small>{sub || "\u00A0"}</small>
    </Link>
  );
}

const count = r => Number(pick(r, ["count", "total", "loans", "loan_count", "borrow_count", "jumlah", "total_loans", "times_borrowed"], 0));

function TopAssets({ list }) {
  const rows = (Array.isArray(list) ? list : []).slice(0, 5);
  const max = Math.max(...rows.map(count), 1);
  return (
    <div className="ad-card">
      <header className="ad-head">
        <span className="ad-hic"><Icon n="chart" /></span>
        <div><h3>Aset paling sering dipinjam</h3><p>30 hari terakhir</p></div>
      </header>
      {!rows.length ? (
        <div className="ad-empty"><span><Icon n="chart" /></span><b>Belum ada data</b><p>Belum ada data peminjaman 30 hari terakhir.</p></div>
      ) : rows.map((r, i) => {
        const name = pick(r, ["name", "asset_name", "nama", "nama_aset", "title"], "Aset");
        const pct = pick(r, ["percent", "persen", "percentage"], null);
        const v = Math.min(100, pct !== null ? Math.round(Number(pct)) : Math.round(count(r) / max * 100));
        return (
          <div className="ad-bar" key={i}>
            <span className={"ad-rank" + (i === 0 ? " top" : "")}>{i + 1}</span>
            <div className="ad-barbody">
              <div className="ad-barrow"><span>{name}</span><em>{v}%</em></div>
              <div className="ad-track"><div className="ad-fill" style={{ width: v + "%" }} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentActivity({ list }) {
  const rows = (Array.isArray(list) ? list : []).slice(0, 5);
  return (
    <div className="ad-card">
      <header className="ad-head">
        <span className="ad-hic amber"><Icon n="clock" /></span>
        <div><h3>Aktivitas terbaru</h3><p>Ringkasan kejadian sistem</p></div>
        <span className="grow" />
        <Link className="ad-more" to="/admin/riwayat">Lihat semua →</Link>
      </header>
      {!rows.length ? (
        <div className="ad-empty"><span><Icon n="inbox" /></span><b>Belum ada aktivitas</b><p>Kejadian terbaru di sistem akan muncul di sini.</p></div>
      ) : rows.map((a, i) => {
        const st = ACT_STYLE[actType(a)];
        return (
          <div className="ad-act" key={i}>
            <span className={`ad-ico ${st.cls}`}><Icon n={st.icon} /></span>
            <p>{actText(a)}</p>
            <time>{relTime(pick(a, ["created_at", "time", "timestamp", "date", "waktu", "updated_at"], null))}</time>
          </div>
        );
      })}
    </div>
  );
}

// ===== Halaman =====
const CARDS = [
  { id: "sAset", label: "Total aset", icon: "cube", tone: "green", to: "/admin/aset" },
  { id: "sPinjam", label: "Sedang dipinjam", icon: "return", tone: "blue", to: "/admin/riwayat" },
  { id: "sPending", label: "Pengajuan pending", icon: "inbox", tone: "amber", sub: "Perlu ditinjau", to: "/admin/pengajuan" },
  { id: "sAkun", label: "Akun perlu verifikasi", icon: "shield", tone: "pink", sub: "Menunggu persetujuan", to: "/admin/verifikasi" },
  { id: "sUser", label: "Total pengguna", icon: "users", tone: "violet", to: "/admin/user" },
  { id: "sKembali", label: "Menunggu verifikasi kembali", icon: "clock", tone: "orange", sub: "Cek kondisi aset", to: "/admin/pengembalian" },
];

// Cari angka pendukung (mis. "tersedia", "aktif") di respons backend.
const extra = (flat, test) => {
  for (const [k, v] of Object.entries(flat)) if (isNum(v) && test(k)) return Number(v);
  return null;
};

export default function Dashboard() {
  const { me } = useOutletContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api("/dashboard/admin").then(setData).catch(e => setError(e.message)); }, []);

  if (error) return <div className="notice show">Gagal memuat dashboard: {error}</div>;
  if (!data) return <p className="empty">Memuat…</p>;

  const flat = flatten(data);
  const val = {};
  STATS.forEach(def => { val[def.id] = findStat(flat, def); });

  const tersedia = extra(flat, k => /avail|tersedia/.test(k));
  const aktif = extra(flat, k => /active|aktif/.test(k) && /user|pengguna/.test(k));
  const sub = {
    sAset: tersedia !== null ? `${tersedia} tersedia` : "",
    sPinjam: val.sAset && val.sPinjam !== null ? `${Math.round(val.sPinjam / val.sAset * 100)}% dari total aset` : "",
    sUser: aktif !== null ? `${aktif} aktif` : "",
  };
  const missing = STATS.some(def => val[def.id] === null);

  return (
    <>
      {/* ===== Banner ===== */}
      <section className="ad-hero">
        <div className="ad-hero-text">
          <span className="ad-chip"><i />Administrator</span>
          <h2>Selamat datang, <span className="ad-name">{me?.name || "Admin"}</span></h2>
          <p>Kondisi aset kampus saat ini</p>
          <div className="ad-cta">
            <Link className="ad-btn light" to="/admin/pengajuan">
              <Icon n="inbox" />Tinjau Pengajuan{val.sPending > 0 && <b className="ad-pc">{val.sPending}</b>}
            </Link>
            <Link className="ad-btn ghost" to="/admin/aset"><Icon n="cube" />Kelola Aset</Link>
          </div>
        </div>
        <div className="ad-hero-art"><AdminArt /></div>
      </section>

      {missing && (
        <div className="notice show">
          Sebagian angka tidak terbaca dari respons <b>/dashboard/admin</b>:
          <code>{JSON.stringify(data, null, 1).slice(0, 1500)}</code>
        </div>
      )}

      {/* ===== Statistik ===== */}
      <section className="ad-stats" aria-label="Ringkasan">
        {CARDS.map(c => <StatCard key={c.id} icon={c.icon} tone={c.tone} label={c.label} value={val[c.id]} sub={c.sub || sub[c.id]} to={c.to} />)}
      </section>

      <section className="ad-cols">
        <TopAssets list={findList(data, TOP_KEYS)} />
        <RecentActivity list={findList(data, ACT_KEYS)} />
      </section>
    </>
  );
}