import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api";
import { fmtRange, loanStatus, relTime, toDate, loanBadge, iconFor, catOf } from "../../utils";
import { Icon } from "../../components/ui";

// Ilustrasi dekoratif untuk banner
const Chip = ({ x, y, children }) => (
  <g transform={`translate(${x} ${y})`} filter="url(#chipSh)">
    <rect width="46" height="46" rx="13" fill="#fff" />
    <g transform="translate(11 11)" fill="none" stroke="#3F7A62" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  </g>
);

function HeroArt() {
  return (
    <svg viewBox="0 0 500 245" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
      <defs>
        <filter id="chipSh" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1d3d31" floodOpacity=".22" />
        </filter>
      </defs>

      {/* lingkaran halus di belakang gedung */}
      <circle cx="250" cy="118" r="104" fill="rgba(255,255,255,.07)" />
      <circle cx="250" cy="118" r="112" fill="none" stroke="#fff" strokeOpacity=".22" />

      {/* percikan */}
      <g fill="#fff" opacity=".75">
        <circle cx="132" cy="22" r="2" /><circle cx="205" cy="48" r="1.5" />
        <circle cx="388" cy="70" r="1.5" /><circle cx="470" cy="150" r="2" />
        <circle cx="96" cy="96" r="1.5" />
      </g>

      <g transform="translate(-50 0)">
        {/* halaman rumput & jalan */}
        <ellipse cx="300" cy="224" rx="200" ry="28" fill="#4F8A6B" />
        <ellipse cx="300" cy="221" rx="165" ry="19" fill="#7DAE92" />
        <path d="M286 206h28l30 39h-88z" fill="#E6F0E9" />

        {/* sayap kiri & kanan */}
        <rect x="178" y="130" width="74" height="52" fill="#DCE9E0" />
        <rect x="348" y="130" width="74" height="52" fill="#DCE9E0" />
        <rect x="174" y="124" width="82" height="7" rx="2" fill="#EEF5F0" />
        <rect x="344" y="124" width="82" height="7" rx="2" fill="#EEF5F0" />
        <g fill="#9CC1AC">
          <rect x="190" y="142" width="11" height="22" rx="5.5" /><rect x="228" y="142" width="11" height="22" rx="5.5" />
          <rect x="360" y="142" width="11" height="22" rx="5.5" /><rect x="398" y="142" width="11" height="22" rx="5.5" />
        </g>

        {/* bangunan utama */}
        <rect x="238" y="106" width="124" height="76" fill="#E9F2EC" />
        <g>
          {[246, 264, 282, 309, 327, 345].map(x => (
            <g key={x}>
              <rect x={x} y="112" width="9" height="66" fill="#F7FBF8" />
              <rect x={x + 6} y="112" width="3" height="66" fill="#DCE9E0" opacity=".7" />
            </g>
          ))}
        </g>
        <path d="M291 182V158a9 9 0 0 1 18 0V182Z" fill="#2F6E58" />
        <path d="M300 149v33" stroke="#4E8F78" strokeWidth="1" />
        <rect x="232" y="98" width="136" height="9" rx="1" fill="#F4F9F5" />
        <polygon points="232,98 300,62 368,98" fill="#E2EDE6" />
        <polygon points="248,96 300,70 352,96" fill="#D2E3D8" />
        <circle cx="300" cy="86" r="6.5" fill="#2F6E58" stroke="#F4F9F5" strokeWidth="2.5" />
        <line x1="300" y1="62" x2="300" y2="34" stroke="#EAF2E8" strokeWidth="2" />
        <path d="M300 34l24 7-24 7z" fill="#DDE87A" />

        {/* tangga */}
        <rect x="226" y="182" width="148" height="6" fill="#D9E8DE" />
        <rect x="216" y="188" width="168" height="6" fill="#CBDFD3" />
        <rect x="206" y="194" width="188" height="7" fill="#BCD5C7" />

        {/* pohon kiri */}
        <rect x="140" y="168" width="6" height="44" fill="#2D6B55" />
        <circle cx="143" cy="158" r="22" fill="#86B49C" />
        <circle cx="165" cy="176" r="15" fill="#5C9A7D" />
        <circle cx="126" cy="176" r="13" fill="#6CA68A" />
        {/* pohon kanan */}
        <rect x="455" y="170" width="6" height="42" fill="#2D6B55" />
        <circle cx="458" cy="160" r="20" fill="#86B49C" />
        <circle cx="436" cy="180" r="14" fill="#5C9A7D" />
        <circle cx="478" cy="178" r="12" fill="#6CA68A" />
      </g>

      {/* ikon melayang */}
      <Chip x={34} y={30}><path d="M5 5h14a1 1 0 0 1 1 1v9H4V6a1 1 0 0 1 1-1ZM2.5 19h19M9 10.2l2 2 4-4" /></Chip>
      <Chip x={46} y={118}><path d="M3 8h18a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM7 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M16 11.5h3M6 19v-3M18 19v-3" /></Chip>
      <Chip x={398} y={20}><path d="M6 5H18a2.5 2.5 0 0 1 2.5 2.5V18a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5V7.5A2.5 2.5 0 0 1 6 5ZM3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01" /></Chip>
      <Chip x={448} y={62}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3ZM9 12l2 2 4-4" /></Chip>
      <Chip x={420} y={112}><path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3ZM3.5 7.5 12 12l8.5-4.5M12 12v9" /></Chip>
    </svg>
  );
}

const byNewest = (a, b) => (toDate(b.created_at) || 0) - (toDate(a.created_at) || 0);

// ikon + warna notifikasi menurut jenisnya
const notifVis = n => {
  if (/akun/i.test(String(n.message || ""))) return ["user", "amber"];
  return ({
    verifikasi: ["check", "green"], persetujuan: ["monitor", "blue"], penolakan: ["x", "red"],
    pengingat: ["clock", "amber"], pengajuan: ["inbox", "amber"],
  })[n.type] || ["bell", "green"];
};

function Skeleton({ rows = 3 }) {
  return (
    <div className="bh-skel">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="bh-skel-row"><span /><i /></div>)}
    </div>
  );
}

export default function Beranda() {
  const { me } = useOutletContext();
  const [loans, setLoans] = useState(null);     // null = memuat, false = gagal
  const [notifs, setNotifs] = useState(null);

  useEffect(() => {
    api("/loans/mine").then(setLoans).catch(() => setLoans(false));
    api("/notifications").then(setNotifs).catch(() => setNotifs(false));
  }, []);

  const L = Array.isArray(loans) ? loans : [];
  const N = Array.isArray(notifs) ? notifs : [];
  const unread = N.filter(n => !n.is_read).length;
  const count = st => L.filter(l => loanStatus(l) === st).length;

  const stats = [
    { icon: "cube", tone: "green", v: loans ? count("disetujui") : "–", label: "Sedang dipinjam" },
    { icon: "clock", tone: "amber", v: loans ? count("menunggu") : "–", label: "Menunggu persetujuan" },
    { icon: "sync", tone: "blue", v: loans ? L.length : "–", label: "Total riwayat" },
    { icon: "bell", tone: "pink", v: notifs ? unread : "–", label: "Notifikasi baru" },
  ];

  return (
    <>
      {/* ===== Banner ===== */}
      <section className="bh-hero">
        <div className="bh-hero-text">
          <span className="bh-chip"><i />Mahasiswa</span>
          <h2>Selamat datang, <span className="bh-name">{me.name}</span></h2>
          <p>Kelola peminjaman asetmu di sini</p>
          <Link className="bh-btn light" to="/user/status-riwayat"><Icon n="clock" />Riwayat Saya</Link>
        </div>
        <div className="bh-hero-art"><HeroArt /></div>
      </section>

      {/* ===== Statistik ===== */}
      <section className="bh-stats">
        {stats.map(s => (
          <div className={`bh-stat ${s.tone}`} key={s.label}>
            <span className="bh-orb"><Icon n={s.icon} /></span>
            <div className="bh-sic"><Icon n={s.icon} /></div>
            <div className="bh-val"><strong>{s.v}</strong><span>{s.label}</span></div>
          </div>
        ))}
      </section>

      {/* ===== Aktivitas & Notifikasi ===== */}
      <section className="bh-cols">
        <div className="bh-card">
          <header className="bh-head">
            <span className="bh-hic"><Icon n="clock" /></span>
            <h3>Aktivitas terbaru</h3>
          </header>

          <div className="bh-list">
            {loans === null ? <Skeleton />
              : loans === false ? <p className="bh-empty-txt">Data peminjaman gagal dimuat.</p>
              : !L.length ? (
                <div className="bh-empty">
                  <span className="bh-empty-ic"><Icon n="inbox" /></span>
                  <b>Belum ada aktivitas peminjaman</b>
                  <p>Ajukan peminjaman pertamamu dan statusnya akan muncul di sini.</p>
                </div>
              ) : [...L].sort(byNewest).slice(0, 3).map(l => {
                  const [label, cls] = loanBadge(l);
                  return (
                    <div className="bh-item" key={l.id}>
                      <span className="bh-ico green"><Icon n={iconFor(l.asset?.name, catOf(l.asset))[0]} /></span>
                      <div className="bh-info">
                        <b>{l.asset?.name || "Aset"}</b>
                        <small><Icon n="cal" />{fmtRange(l.tanggal_pinjam, l.tanggal_kembali_rencana)}</small>
                      </div>
                      <span className={`bh-pill ${cls}`}>{label}</span>
                    </div>
                  );
                })}
          </div>

          <Link className="bh-dash" to="/user/cari-aset"><Icon n="search" />Cari aset</Link>
        </div>

        <div className="bh-card">
          <header className="bh-head">
            <span className="bh-hic pink"><Icon n="bell" /></span>
            <h3>Notifikasi</h3>
            <span className="grow" />
            {unread > 0 && <span className="bh-count">{unread}</span>}
          </header>

          <div className="bh-list">
            {notifs === null ? <Skeleton />
              : notifs === false ? <p className="bh-empty-txt">Notifikasi gagal dimuat.</p>
              : !N.length ? (
                <div className="bh-empty">
                  <span className="bh-empty-ic"><Icon n="bell" /></span>
                  <b>Belum ada notifikasi</b>
                  <p>Kabar terbaru tentang pengajuanmu akan tampil di sini.</p>
                </div>
              ) : [...N].sort(byNewest).slice(0, 4).map(n => {
                  const [ic, tone] = notifVis(n);
                  return (
                    <div className={"bh-item" + (n.is_read ? " read" : " unread")} key={n.id}>
                      <span className={`bh-ico ${tone}`}><Icon n={ic} /></span>
                      <div className="bh-info">
                        <b>{n.message}</b>
                        <small>{relTime(n.created_at)}</small>
                      </div>
                      {!n.is_read && <span className="bh-dot" title="Belum dibaca" />}
                    </div>
                  );
                })}
          </div>
        </div>
      </section>
    </>
  );
}