import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { api, clearSession, goTo } from "../api";
import { ROUTES } from "../config";
import { fileUrl, initials, photoOf } from "../utils";
import { Icon } from "../components/ui";
import NotificationBell from "../components/NotificationBell";


const NAV = [
  ["UTAMA", [["/admin/dashboard", "Beranda", "home"]]],
  ["MANAJEMEN", [["/admin/aset", "Kelola Aset", "cube"], ["/admin/user", "Kelola User", "users"]]],
  ["PERSETUJUAN", [
    ["/admin/verifikasi", "Verifikasi Akun", "shield", "verifikasi_akun"],
    ["/admin/pengajuan", "Pengajuan", "inbox", "pengajuan"],
    ["/admin/pengembalian", "Pengembalian", "return", "pengembalian"],
  ]],
  ["ANALITIK", [["/admin/riwayat", "Riwayat", "history"], ["/admin/laporan", "Laporan", "chart"]]],
];

// Ilustrasi dekoratif untuk dasar sidebar
function SideArt() {
  return (
    <svg viewBox="0 0 232 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <circle cx="205" cy="38" r="14" fill="#DDE7A6" />
      <g fill="#9DBFAA" opacity=".85">
        <circle cx="40" cy="62" r="9" /><circle cx="54" cy="55" r="12" /><circle cx="70" cy="62" r="9" />
        <rect x="31" y="62" width="48" height="9" rx="4.5" />
      </g>
      <path d="M0 108C40 84 90 90 130 104S200 96 232 84V170H0Z" fill="#4E8C72" />
      <path d="M0 128C50 108 110 122 160 116S210 112 232 118V170H0Z" fill="#5F9F83" />
      <rect x="38" y="118" width="4" height="34" fill="#2F6E58" />
      <circle cx="40" cy="108" r="19" fill="#8BB8A0" /><circle cx="56" cy="124" r="11" fill="#6FA68A" /><circle cx="24" cy="126" r="10" fill="#6FA68A" />
      <rect x="108" y="128" width="3" height="22" fill="#2F6E58" />
      <circle cx="110" cy="120" r="11" fill="#8BB8A0" /><circle cx="120" cy="130" r="7" fill="#6FA68A" />
      <polygon points="160,112 190,92 220,112" fill="#EAF3EC" />
      <rect x="162" y="112" width="56" height="5" fill="#F4F9F5" />
      {[166, 180, 194, 208].map(x => <rect key={x} x={x} y="117" width="5" height="30" fill="#F4F9F5" />)}
      <rect x="158" y="147" width="64" height="5" fill="#DCEBE1" />
      <rect x="154" y="152" width="72" height="5" fill="#CFE2D6" />
    </svg>
  );
}

function AdminSidebar({ badge }) {
  const logout = async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch { /* abaikan */ }
    clearSession();
    goTo(ROUTES.login);
  };

  return (
    <aside className="side">
      <div className="brand">
        <span className="lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9.5 12 4l9 5.5M4.5 9.5h15M6.5 12v5M10.5 12v5M13.5 12v5M17.5 12v5M3.5 20h17" />
          </svg>
        </span>
        <b>Kampus<em>Aset</em></b>
      </div>
      {NAV.map(([group, items]) => (
        <div key={group}>
          <div className="group">{group}</div>
          <nav className="nav">
            {items.map(([to, label, ic, key]) => (
              <NavLink key={to} to={to} title={label} className={({ isActive }) => (isActive ? "on" : "")}>
                <Icon n={ic} /><span className="t">{label}</span>
                {key && badge[key] > 0 && <span className="cnt">{badge[key]}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
      <div className="side-art"><SideArt /></div>
      <div className="foot">
        <button className="logout" type="button" title="Keluar" onClick={logout}><Icon n="out" /><span>Keluar</span></button>
      </div>
    </aside>
  );
}

const TITLES = {
  "/admin/dashboard": ["Beranda", "Kondisi aset kampus saat ini"],
  "/admin/aset": ["Kelola aset", "CRUD data aset kampus"],
  "/admin/user": ["Kelola user", "Semua akun terdaftar di sistem"],
  "/admin/verifikasi": ["Verifikasi akun", "Akun baru menunggu persetujuan admin"],
  "/admin/pengajuan": ["Pengajuan menunggu persetujuan", "Tinjau dan setujui pengajuan peminjaman aset"],
  "/admin/pengembalian": ["Verifikasi pengembalian", "Periksa kondisi aset yang dikembalikan"],
  "/admin/riwayat": ["Riwayat peminjaman", "Seluruh catatan peminjaman dan pengembalian aset"],
  "/admin/laporan": ["Laporan peminjaman", "Rekap aktivitas peminjaman aset"],
  "/admin/profil": ["Profil Saya", "Kelola data identitas dan kontak"],
};

function AdminTopbar({ me }) {
  const { pathname } = useLocation();
  const [title, sub] = TITLES[pathname] || ["", ""];
  const pic = fileUrl(photoOf(me));
  return (
    <header className="top">
      <div><h1>{title}</h1><p>{sub}</p></div>
      <div className="right">
        <NotificationBell role="admin" />
        <div className="me">
          <div className="t"><b>{me.name}</b><span>Admin</span></div>
          <Link to="/admin/profil" className="av" title="Profil saya" aria-label="Profil saya"
            style={pic ? { backgroundImage: `url("${pic}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{pic ? "" : initials(me.name)}</Link>
        </div>
      </div>
    </header>
  );
}


export default function AdminLayout() {
  const { me, setMe } = useOutletContext();
  const [badge, setBadge] = useState({});

  const refreshBadges = useCallback(
    () => api("/dashboard/admin").then(d => setBadge(d.badge || {})).catch(() => {}), []
  );
  useEffect(() => { refreshBadges(); }, [refreshBadges]);

  return (
    <div className="app admin">
      <AdminSidebar badge={badge} />
      <div className="main">
        <AdminTopbar me={me} />
        <main className="content"><Outlet context={{ refreshBadges, badge, me, setMe }} /></main>
      </div>
    </div>
  );
}