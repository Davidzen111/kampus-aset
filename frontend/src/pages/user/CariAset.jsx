import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLoad, todayISO, ASSET_BADGE, catOf } from "../../utils";
import { Icon, AssetThumb } from "../../components/ui";

// true  = tampilkan foto asli aset bila ada
// false = selalu tampilkan ilustrasi (sesuai desain)
const PAKAI_FOTO = false;

// warna latar kartu bergantian
const TINTS = ["green", "blue", "green", "blue", "sand", "green"];

// jenis ilustrasi dari nama / kategori aset
const kindOf = a => {
  const t = `${a.name || ""} ${catOf(a)}`.toLowerCase();
  if (/proyektor|projector|video/.test(t)) return "projector";
  if (/kamera|camera|dslr/.test(t)) return "camera";
  if (/aula|gedung|auditorium|hall/.test(t)) return "hall";
  if (/rapat|ruang|room|\blab\b/.test(t)) return "meeting";
  if (/laptop|komputer|\bpc\b|monitor/.test(t)) return "laptop";
  return "generic";
};

const Sparkles = () => (
  <g>
    <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M332 34v14M325 41h14" /><path d="M58 196v12M52 202h12" /></g>
    <g fill="#fff"><circle cx="48" cy="54" r="3" /><circle cx="352" cy="96" r="3.5" /><circle cx="338" cy="186" r="3" /><circle cx="74" cy="118" r="2.5" opacity=".7" /></g>
  </g>
);
const Floor = ({ w = 120 }) => <ellipse cx="200" cy="222" rx={w} ry="12" fill="#2F6552" opacity=".16" />;

function AssetArt({ kind }) {
  return (
    <svg className="ca-art" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Sparkles />

      {kind === "laptop" && (
        <g>
          <Floor w={125} />
          <path d="M88 196h224l-16 12H104z" fill="#BCD8C4" />
          <rect x="100" y="60" width="200" height="132" rx="13" fill="#2F6552" />
          <rect x="110" y="70" width="180" height="112" rx="7" fill="#EAF3EC" />
          <path d="M110 77a7 7 0 0 1 7-7h166a7 7 0 0 1 7 7v7H110z" fill="#7FA992" />
          <g fill="#fff"><circle cx="121" cy="77" r="2.2" /><circle cx="129" cy="77" r="2.2" /><circle cx="137" cy="77" r="2.2" /></g>
          <rect x="122" y="94" width="52" height="5" rx="2.5" fill="#9CC1AC" />
          <rect x="122" y="104" width="38" height="4" rx="2" fill="#C3D9CB" />
          <rect x="124" y="146" width="15" height="28" rx="2" fill="#7FA992" />
          <rect x="144" y="134" width="15" height="40" rx="2" fill="#2F6552" />
          <rect x="164" y="141" width="15" height="33" rx="2" fill="#7FA992" />
          <rect x="184" y="124" width="15" height="50" rx="2" fill="#2F6552" />
          <rect x="222" y="90" width="58" height="82" rx="9" fill="#F8FBF9" />
          <circle cx="251" cy="108" r="7" fill="#BFD16A" />
          <rect x="236" y="124" width="30" height="3.5" rx="1.75" fill="#C3D9CB" />
          <rect x="236" y="132" width="22" height="3.5" rx="1.75" fill="#C3D9CB" />
        </g>
      )}

      {kind === "projector" && (
        <g>
          <Floor w={130} />
          <path d="M300 126 398 92V196L300 160Z" fill="#fff" opacity=".35" />
          <rect x="92" y="96" width="214" height="84" rx="22" fill="#F7FBF8" />
          <rect x="92" y="150" width="214" height="30" rx="15" fill="#E3EEE7" />
          <circle cx="262" cy="138" r="32" fill="#2F6552" />
          <circle cx="262" cy="138" r="24" fill="#1B4435" />
          <circle cx="262" cy="138" r="15" fill="#8FBFA9" />
          <circle cx="257" cy="133" r="5" fill="#E3F1E8" />
          <rect x="298" y="120" width="14" height="36" rx="6" fill="#4F8A6F" />
          <g fill="#B5D0BE"><rect x="116" y="116" width="54" height="5" rx="2.5" /><rect x="116" y="128" width="54" height="5" rx="2.5" /><rect x="116" y="140" width="38" height="5" rx="2.5" /></g>
          <circle cx="122" cy="162" r="6" fill="#BFD16A" /><circle cx="140" cy="162" r="4.5" fill="#9CC1AC" />
          <rect x="122" y="180" width="26" height="7" rx="3.5" fill="#5F9A82" /><rect x="248" y="180" width="26" height="7" rx="3.5" fill="#5F9A82" />
        </g>
      )}

      {kind === "camera" && (
        <g>
          <Floor w={125} />
          <rect x="62" y="104" width="266" height="108" rx="20" fill="#2F6552" />
          <path d="M62 124a20 20 0 0 1 20-20h226a20 20 0 0 1 20 20v22H62z" fill="#3F7A62" />
          <path d="M148 104l12-28h76l12 28z" fill="#1F4A3A" />
          <rect x="84" y="90" width="18" height="15" rx="3.5" fill="#D8C46A" />
          <rect x="250" y="82" width="46" height="22" rx="6" fill="#8DBBA2" />
          <circle cx="195" cy="162" r="54" fill="#163A2C" />
          <circle cx="195" cy="162" r="44" fill="#2A5C48" />
          <circle cx="195" cy="162" r="32" fill="#1B3F31" />
          <circle cx="195" cy="162" r="21" fill="#8FBFA9" />
          <circle cx="188" cy="155" r="7" fill="#DDEEE3" />
          <circle cx="86" cy="134" r="6" fill="#E6D27A" />
          <rect x="266" y="126" width="38" height="13" rx="6.5" fill="#E6F2EA" />
        </g>
      )}

      {kind === "meeting" && (
        <g>
          <Floor w={140} />
          <rect x="110" y="38" width="192" height="106" rx="11" fill="#F3F8F5" stroke="#A9CBB5" strokeWidth="5" />
          <polyline points="130,114 154,92 176,106 216,72 252,80" fill="none" stroke="#3F7A62" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="254" cy="80" r="6.5" fill="#BFD16A" />
          <rect x="128" y="126" width="28" height="4.5" rx="2.25" fill="#A9CBB5" /><rect x="162" y="126" width="28" height="4.5" rx="2.25" fill="#A9CBB5" />
          <rect x="134" y="158" width="36" height="34" rx="13" fill="#5F9A82" />
          <rect x="190" y="158" width="36" height="34" rx="13" fill="#7FB09A" />
          <rect x="246" y="158" width="36" height="34" rx="13" fill="#5F9A82" />
          <rect x="104" y="190" width="214" height="11" rx="5.5" fill="#EAD9A6" />
          <rect x="124" y="201" width="9" height="13" rx="3" fill="#C8A964" /><rect x="290" y="201" width="9" height="13" rx="3" fill="#C8A964" />
          <rect x="50" y="172" width="26" height="36" rx="7" fill="#D6DE8A" />
          <ellipse cx="62" cy="148" rx="9" ry="22" transform="rotate(-14 62 148)" fill="#3F7A62" />
          <ellipse cx="76" cy="153" rx="8" ry="18" transform="rotate(20 76 153)" fill="#5F9A82" />
          <ellipse cx="55" cy="158" rx="6.5" ry="14" transform="rotate(-38 55 158)" fill="#7FB09A" />
        </g>
      )}

      {kind === "hall" && (
        <g>
          <Floor w={150} />
          <g transform="translate(-100 6)">
            <rect x="178" y="130" width="74" height="52" fill="#CFE3D6" />
            <rect x="348" y="130" width="74" height="52" fill="#CFE3D6" />
            <rect x="174" y="124" width="82" height="7" rx="2" fill="#EEF5F0" />
            <rect x="344" y="124" width="82" height="7" rx="2" fill="#EEF5F0" />
            <g fill="#9CC1AC">
              <rect x="190" y="142" width="11" height="22" rx="5.5" /><rect x="228" y="142" width="11" height="22" rx="5.5" />
              <rect x="360" y="142" width="11" height="22" rx="5.5" /><rect x="398" y="142" width="11" height="22" rx="5.5" />
            </g>
            <rect x="238" y="106" width="124" height="76" fill="#F1F7F3" />
            {[246, 264, 282, 309, 327, 345].map(x => <rect key={x} x={x} y="112" width="9" height="66" fill="#fff" />)}
            <path d="M291 182V158a9 9 0 0 1 18 0V182Z" fill="#2F6E58" />
            <rect x="232" y="98" width="136" height="9" rx="1" fill="#fff" />
            <polygon points="232,98 300,62 368,98" fill="#EEF5F0" />
            <polygon points="248,96 300,70 352,96" fill="#D9E9DF" />
            <circle cx="300" cy="86" r="6.5" fill="#2F6E58" stroke="#fff" strokeWidth="2.5" />
            <line x1="300" y1="62" x2="300" y2="34" stroke="#9CC1AC" strokeWidth="2" />
            <path d="M300 34l24 7-24 7z" fill="#C6D77A" />
            <rect x="226" y="182" width="148" height="6" fill="#E3EFE7" />
            <rect x="216" y="188" width="168" height="6" fill="#CFE3D6" />
            <rect x="206" y="194" width="188" height="7" fill="#BCD5C7" />
            <rect x="140" y="168" width="6" height="44" fill="#2D6B55" />
            <circle cx="143" cy="158" r="22" fill="#86B49C" /><circle cx="165" cy="176" r="15" fill="#A9CBB5" /><circle cx="126" cy="176" r="13" fill="#6CA68A" />
            <rect x="455" y="170" width="6" height="42" fill="#2D6B55" />
            <circle cx="458" cy="160" r="20" fill="#86B49C" /><circle cx="436" cy="180" r="14" fill="#A9CBB5" /><circle cx="478" cy="178" r="12" fill="#6CA68A" />
          </g>
        </g>
      )}

      {kind === "generic" && (
        <g>
          <Floor w={90} />
          <path d="M200 66 264 98 200 130 136 98Z" fill="#CFE3D6" />
          <path d="M136 98 200 130V204L136 172Z" fill="#7FB09A" />
          <path d="M264 98 200 130V204L264 172Z" fill="#3F7A62" />
        </g>
      )}
    </svg>
  );
}

const sv = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
const CatIcon = ({ cat }) => /ruang|gedung|aula|room/i.test(cat || "")
  ? <svg {...sv}><path d="M7 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M5 21h14M13.5 12h.01" /></svg>
  : <svg {...sv}><path d="M9 9h6v6H9zM4 9h2M4 15h2M18 9h2M18 15h2M9 4v2M15 4v2M9 18v2M15 18v2" /></svg>;

function CardSkeleton() {
  return (
    <div className="ca-card ca-sk">
      <div className="ca-pic" />
      <div className="ca-body"><div className="ca-info"><i className="w70" /><i className="w40" /></div><span className="ca-go" /></div>
    </div>
  );
}

export default function CariAset() {
  const [assets] = useLoad("/assets");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [date, setDate] = useState("");

  const cats = useMemo(() => [...new Set((assets || []).map(catOf).filter(Boolean))].sort(), [assets]);
  const list = (assets || []).filter(a =>
    (!q || String(a.name || "").toLowerCase().includes(q.trim().toLowerCase())) &&
    (!cat || catOf(a) === cat) &&
    (!date || a.status === "tersedia"));   // filter tanggal: hanya aset berstatus tersedia

  const active = q || cat || date;
  const reset = () => { setQ(""); setCat(""); setDate(""); };

  return (
    <>
      {/* ===== Bilah pencarian ===== */}
      <div className="ca-bar">
        <label className="ca-field grow">
          <Icon n="search" />
          <input type="search" placeholder="Cari nama aset…" aria-label="Cari nama aset" value={q} onChange={e => setQ(e.target.value)} />
        </label>
        <label className="ca-field sel">
          <svg {...sv}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>
          <select value={cat} onChange={e => setCat(e.target.value)} aria-label="Kategori">
            <option value="">Semua kategori</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="ca-field dt">
          <Icon n="cal" />
          <input type="date" min={todayISO()} value={date} onChange={e => setDate(e.target.value)}
            title="Pilih tanggal untuk hanya menampilkan aset yang tersedia" aria-label="Tanggal" />
        </label>
        {active && <button type="button" className="ca-reset" onClick={reset}><Icon n="x" />Reset</button>}
      </div>

      {/* ===== Daftar aset ===== */}
      <section className="ca-grid">
        {assets === null ? Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)
          : !list.length ? (
            <div className="ca-empty">
              <span className="ca-empty-ic"><Icon n="search" /></span>
              <b>{assets.length ? "Aset tidak ditemukan" : "Belum ada aset"}</b>
              <p>{assets.length ? "Coba ubah kata kunci atau pilih kategori lain." : "Aset kampus yang bisa dipinjam akan tampil di sini."}</p>
              {active && <button type="button" className="ca-reset solid" onClick={reset}>Reset pencarian</button>}
            </div>
          )
          : list.map((a, i) => {
              const [label, cls] = ASSET_BADGE[a.status] || [a.status || "–", ""];
              const foto = PAKAI_FOTO && a.photo_url;
              return (
                <Link className={"ca-card" + (a.status && a.status !== "tersedia" ? " off" : "")} key={a.id} to={`/user/detail-aset?id=${a.id}`}>
                  <div className={`ca-pic t-${TINTS[i % TINTS.length]}`}>
                    {foto ? <AssetThumb asset={a} /> : <AssetArt kind={kindOf(a)} />}
                    <span className={`ca-st ${cls}`}>{label}</span>
                  </div>
                  <div className="ca-body">
                    <div className="ca-info">
                      <h3 title={a.name}>{a.name}</h3>
                      <span className="ca-cat"><CatIcon cat={catOf(a)} />{catOf(a) || "Tanpa kategori"}</span>
                    </div>
                    <span className="ca-go" aria-hidden="true">
                      <svg {...sv} strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                  </div>
                </Link>
              );
            })}
      </section>
    </>
  );
}