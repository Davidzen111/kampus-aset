import { useState } from "react";
import "../styles/auth.css";

/* ---------- Ikon garis ---------- */
const P = {
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="11" r="2" /><path d="M6.2 16c.5-1.5 1.5-2.2 2.8-2.2s2.3.7 2.8 2.2M14.5 10h4M14.5 14h3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7.5 8 6 8-6" /></>,
  lock: <><rect x="5" y="11" width="14" height="9.5" rx="2.5" /><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18M10.6 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.8C3.8 8.6 2 12 2 12s3.6 7 10 7c1.5 0 2.8-.3 4-.8M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  cap: <><path d="m2 9 10-5 10 5-10 5Z" /><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" /></>,
  screen: <><rect x="3" y="4" width="18" height="12" rx="2.5" /><path d="M8 20h8M12 16v4" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  home: <><path d="M3 9.5 12 4l9 5.5Z" /><path d="M6.5 12v6M10 12v6M14 12v6M17.5 12v6M4 20h16" /></>,
};
const I = ({ n, className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[n]}</svg>
);

/* ---------- Potongan form yang bisa dipakai ulang ---------- */
export function RgField({ id, label, icon, error, right, ...props }) {
  return (
    <div className="rg-field">
      <label htmlFor={id}>{label}</label>
      <div className={`rg-in ${error ? "bad" : ""}`}>
        <I n={icon} className="rg-lead" />
        <input id={id} aria-invalid={!!error} {...props} />
        {right}
      </div>
      {error && <p className="rg-err">{error}</p>}
    </div>
  );
}

export function RgPassword({ id = "password", label = "Kata Sandi", ...props }) {
  const [show, setShow] = useState(false);
  return (
    <RgField id={id} label={label} icon="lock" type={show ? "text" : "password"} {...props}
      right={
        <button type="button" className="rg-eye" onClick={() => setShow(s => !s)} aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
          <I n={show ? "eyeOff" : "eye"} />
        </button>
      } />
  );
}

export function RgRole({ value, onChange }) {
  const opts = [["mahasiswa", "Mahasiswa", "cap"], ["dosen", "Dosen", "screen"]];
  return (
    <div className="rg-role" role="radiogroup" aria-label="Peran">
      {opts.map(([k, l, ic]) => (
        <button type="button" role="radio" aria-checked={value === k} className={value === k ? "on" : ""} key={k} onClick={() => onChange(k)}>
          <I n={ic} />{l}
        </button>
      ))}
    </div>
  );
}

export function RgCheck({ checked, onChange, children }) {
  return (
    <label className="rg-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}

export function RgSubmit({ loading, children }) {
  return (
    <button className="rg-submit" disabled={loading}>
      <span>{loading ? "Memproses…" : children}</span>
      {!loading && <I n="arrow" />}
    </button>
  );
}

/* ---------- Ilustrasi kampus (panel kiri) ---------- */
export function AuthArt() {
  const s = { fill: "none", stroke: "#4F8A6F", strokeWidth: 4.5, strokeLinecap: "round", strokeLinejoin: "round" };
  const Col = ({ x }) => (
    <g>
      <rect x={x} y={418} width={13} height={176} fill="#EDF2EC" />
      <rect x={x + 9} y={418} width={4} height={176} fill="#CBDDD2" />
      <rect x={x - 4} y={411} width={21} height={9} rx={2} fill="#F4F7F2" />
      <rect x={x - 4} y={589} width={21} height={10} rx={2} fill="#F4F7F2" />
    </g>
  );
  return (
    <svg className="rg-svg" viewBox="0 0 770 820" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <filter id="rgSh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#0F2A1F" floodOpacity=".3" /></filter>
        <linearGradient id="rgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#74AF93" /><stop offset="1" stopColor="#3F7560" /></linearGradient>
      </defs>

      {/* cincin & cahaya */}
      <circle cx="385" cy="452" r="272" fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth="1.4" />
      <circle cx="385" cy="457" r="215" fill="#fff" fillOpacity=".07" />

      {/* awan */}
      <g fill="#9DB1A5" opacity=".78"><ellipse cx="403" cy="56" rx="45" ry="12" /><circle cx="414" cy="41" r="17" /><circle cx="392" cy="46" r="12" /></g>
      <g fill="#EEF1EF"><ellipse cx="657" cy="106" rx="67" ry="18" /><circle cx="673" cy="84" r="26" /><circle cx="640" cy="93" r="18" /></g>
      <g fill="#9AAB9F" opacity=".85"><ellipse cx="193" cy="192" rx="55" ry="15" /><circle cx="206" cy="172" r="22" /><circle cx="178" cy="181" r="15" /></g>

      {/* tanah & semak */}
      <ellipse cx="385" cy="674" rx="339" ry="42" fill="#2F5C49" />
      <ellipse cx="385" cy="662" rx="322" ry="33" fill="#7BAC85" />
      <ellipse cx="208" cy="659" rx="42" ry="20" fill="#4F8A6F" /><ellipse cx="237" cy="663" rx="28" ry="14" fill="#86B397" />
      <ellipse cx="562" cy="659" rx="42" ry="20" fill="#4F8A6F" /><ellipse cx="532" cy="663" rx="27" ry="14" fill="#86B397" />
      <polygon points="322,655 448,655 493,728 276,728" fill="#D7E5DC" />

      {/* sayap kiri & kanan */}
      <rect x="158" y="447" width="106" height="154" fill="#CBDFD3" />
      <rect x="157" y="447" width="108" height="16" rx="2" fill="#F2F5F0" />
      <rect x="188" y="485" width="22" height="44" rx="11" fill="#8FB9A1" /><rect x="221" y="485" width="22" height="44" rx="11" fill="#8FB9A1" />
      <rect x="188" y="545" width="22" height="36" rx="11" fill="#A9CDB8" /><rect x="221" y="545" width="22" height="36" rx="11" fill="#A9CDB8" />
      <rect x="508" y="447" width="96" height="154" fill="#CBDFD3" />
      <rect x="508" y="447" width="104" height="16" rx="2" fill="#F2F5F0" />
      <rect x="524" y="485" width="22" height="44" rx="11" fill="#8FB9A1" /><rect x="557" y="485" width="22" height="44" rx="11" fill="#8FB9A1" />
      <rect x="524" y="545" width="22" height="36" rx="11" fill="#A9CDB8" /><rect x="557" y="545" width="22" height="36" rx="11" fill="#A9CDB8" />

      {/* bangunan utama */}
      <rect x="262" y="410" width="246" height="190" fill="#C6DDD0" />
      {[270, 300, 330, 427, 457, 487].map(x => <Col key={x} x={x} />)}
      <path d="M360 601v-62a25 25 0 0 1 50 0v62Z" fill="#3D6F5B" />
      <path d="M367 601v-58a18 18 0 0 1 36 0v58Z" fill="#6DA68B" />
      <path d="M385 525v76" stroke="#3D6F5B" strokeWidth="2" />
      <circle cx="378" cy="566" r="2.2" fill="#E8F0C8" /><circle cx="392" cy="566" r="2.2" fill="#E8F0C8" />

      {/* atap segitiga */}
      <rect x="235" y="397" width="299" height="15" rx="2" fill="#F1F5EF" />
      <polygon points="385,307 240,397 530,397" fill="#EEF3EC" />
      <polygon points="385,326 281,390 489,390" fill="#C9DED2" />
      <circle cx="385" cy="365" r="18" fill="#4F8A6F" /><circle cx="385" cy="365" r="10" fill="#DDE8B4" />
      <rect x="383" y="242" width="3.5" height="66" fill="#fff" />
      <polygon points="386,250 433,259 386,271" fill="#C9D98C" />

      {/* tangga */}
      <rect x="244" y="600" width="282" height="20" rx="3" fill="#E6EEE8" />
      <rect x="226" y="620" width="318" height="20" rx="3" fill="#D3E2D8" />
      <rect x="237" y="640" width="296" height="15" rx="3" fill="#E6EEE8" />

      {/* pohon kiri */}
      <rect x="116" y="588" width="10" height="66" rx="2" fill="#2D5A47" />
      <circle cx="152" cy="579" r="31" fill="#548F76" /><circle cx="122" cy="536" r="37" fill="#5C9980" />
      <circle cx="89" cy="577" r="29" fill="#8FBAA3" /><circle cx="108" cy="530" r="13" fill="#A9CDB8" />
      {/* pohon kanan */}
      <rect x="644" y="588" width="10" height="66" rx="2" fill="#2D5A47" />
      <circle cx="615" cy="579" r="31" fill="#548F76" /><circle cx="649" cy="534" r="37" fill="#5C9980" />
      <circle cx="680" cy="578" r="29" fill="#8FBAA3" /><circle cx="663" cy="528" r="13" fill="#A9CDB8" />

      {/* hiasan */}
      <path d="M293 247v12M287 253h12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M571 339v12M565 345h12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="139" cy="136" r="3" fill="#fff" fillOpacity=".85" /><circle cx="518" cy="238" r="4" fill="#fff" fillOpacity=".9" />
      <circle cx="259" cy="308" r="3" fill="#fff" fillOpacity=".85" /><circle cx="705" cy="356" r="3" fill="#fff" fillOpacity=".85" />

      {/* ubin ikon melayang */}
      <g className="rg-fl a">
        <rect x="310" y="107" width="76" height="76" rx="20" fill="#fff" filter="url(#rgSh)" />
        <path d="M348 138c-6-4-16-5-24-4v31c8-1 18 0 24 4 6-4 16-5 24-4v-31c-8-1-18 0-24 4Z" fill="#E6F0D8" {...s} strokeWidth="4" />
        <path d="M348 138v31" {...s} strokeWidth="4" />
      </g>
      <g className="rg-fl b">
        <rect x="463" y="153" width="76" height="76" rx="20" fill="#fff" filter="url(#rgSh)" />
        <path d="M501 167l23 9v17c0 15-10 24-23 30-13-6-23-15-23-30v-17Z" fill="#E8F1D2" {...s} strokeWidth="4" />
        <path d="M491 194l8 8 14-15" {...s} strokeWidth="4" />
      </g>
      <g className="rg-fl c">
        <rect x="621" y="182" width="76" height="76" rx="20" fill="#fff" filter="url(#rgSh)" />
        <rect x="638" y="207" width="42" height="38" rx="8" fill="#E9F0D9" {...s} strokeWidth="4" />
        <path d="M638 220h42M649 200v12M669 200v12" {...s} strokeWidth="4" />
        <circle cx="650" cy="233" r="2.8" fill="#4F8A6F" /><circle cx="659" cy="233" r="2.8" fill="#4F8A6F" /><circle cx="668" cy="233" r="2.8" fill="#4F8A6F" />
      </g>
      <g className="rg-fl b">
        <rect x="84" y="218" width="76" height="76" rx="20" fill="#fff" filter="url(#rgSh)" />
        <rect x="100" y="241" width="44" height="30" rx="6" fill="#E3EFE8" {...s} strokeWidth="4" />
        <path d="M112 256l6 6 11-12M94 281h56" {...s} strokeWidth="4" />
      </g>
      <g className="rg-fl a">
        <rect x="73" y="401" width="77" height="76" rx="20" fill="#fff" filter="url(#rgSh)" />
        <rect x="88" y="428" width="46" height="26" rx="8" fill="#EEF0C8" {...s} strokeWidth="4" />
        <circle cx="116" cy="441" r="6.5" {...s} strokeWidth="3.8" /><circle cx="98" cy="441" r="2.8" fill="#4F8A6F" />
        <path d="M95 454v7M127 454v7" {...s} strokeWidth="4" />
      </g>
      <g className="rg-fl c">
        <rect x="619" y="401" width="77" height="76" rx="20" fill="#fff" filter="url(#rgSh)" />
        <path d="M657 417l24 13v27l-24 13-24-13v-27Z" fill="#EEF0C8" {...s} strokeWidth="4" />
        <path d="M633 430l24 13 24-13M657 443v27" {...s} strokeWidth="4" />
      </g>

      {/* kartu daftar */}
      <g className="rg-fl a">
        <rect x="68" y="313" width="153" height="54" rx="16" fill="#fff" filter="url(#rgSh)" />
        <circle cx="96" cy="340" r="14" fill="url(#rgG)" />
        <path d="M90 340l4.5 4.5L103 336" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="121" y="331" width="62" height="8" rx="4" fill="#D3E3DA" /><rect x="121" y="346" width="40" height="7" rx="3.5" fill="#E3E6F3" />
        <rect x="188" y="334" width="21" height="12" rx="6" fill="#E7E4A8" />
      </g>
      <g className="rg-fl b">
        <rect x="541" y="269" width="153" height="54" rx="16" fill="#fff" filter="url(#rgSh)" />
        <circle cx="570" cy="296" r="15" fill="url(#rgG)" />
        <path d="M570 288v8l5 3" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="594" y="287" width="56" height="8" rx="4" fill="#D3E3DA" /><rect x="594" y="302" width="43" height="7" rx="3.5" fill="#E3E6F3" />
        <rect x="657" y="290" width="25" height="12" rx="6" fill="#EBDDA0" />
      </g>
    </svg>
  );
}

/* ---------- Layout dua panel ---------- */
export function AuthLayout({ children }) {
  return (
    <div className="rg">
      <aside className="rg-art">
        <AuthArt />
        <div className="rg-brand">
          <span className="rg-logo"><I n="home" /></span>
          <div><b>Kampus<em>Aset</em></b><small>Manajemen Fasilitas Terpadu</small></div>
        </div>
      </aside>

      <main className="rg-side">
        <svg className="rg-leaves" viewBox="0 0 300 300" aria-hidden="true">
          <g transform="translate(170 300) rotate(-18)"><path d="M0 0C34-56 34-124 0-190-34-124-34-56 0 0Z" fill="#B5C67E" opacity=".4" /></g>
          <g transform="translate(222 306) rotate(8) scale(1.1)"><path d="M0 0C34-56 34-124 0-190-34-124-34-56 0 0Z" fill="#8FBFA5" opacity=".38" /></g>
          <g transform="translate(262 312) rotate(24) scale(1.25)"><path d="M0 0C34-56 34-124 0-190-34-124-34-56 0 0Z" fill="#A9C6A0" opacity=".34" /></g>
          <g transform="translate(120 306) rotate(-32) scale(.7)"><path d="M0 0C34-56 34-124 0-190-34-124-34-56 0 0Z" fill="#C7D58E" opacity=".45" /></g>
        </svg>

        <div className="rg-wrap">
          <div className="rg-mark"><span><I n="home" /></span></div>
          {children}
        </div>
      </main>
    </div>
  );
}