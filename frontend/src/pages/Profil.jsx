import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api, explainError, setStoredUser } from "../api";
import { fileUrl, initials, loanStatus, photoOf } from "../utils";
import { Icon } from "../components/ui";
import { toast } from "../components/dialogs";
import "../styles/profil.css";


const UPDATE = [["PUT", "/users/me"], ["PATCH", "/users/me"]];
const PHOTO = [["POST", "/users/me/photo"]];

async function tryEndpoints(list, make) {
  let last;
  for (const [method, url] of list) {
    try { return await api(url, { method, ...make() }); }
    catch (e) { last = e; if (e.status !== 404 && e.status !== 405) throw e; }   
  }
  throw last;
}

/* ---------- Ikon garis kecil ---------- */
const Ico = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ShieldIco = () => <Ico><path d="M12 3 5 6v5.5c0 4.4 2.9 7.6 7 9.5 4.1-1.9 7-5.1 7-9.5V6l-7-3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></Ico>;
const UserIco = () => <Ico><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" /></Ico>;
const LockIco = () => <Ico><rect x="5" y="11" width="14" height="9.5" rx="2.5" /><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></Ico>;
const CheckIco = () => <Ico><path d="m5 12.5 4.5 4.5L19 7.5" /></Ico>;
const ListIco = () => <Ico><rect x="5" y="4" width="14" height="17" rx="3" /><path d="M9 9h6M9 13h6M9 17h3" /></Ico>;
const BoxIco = () => <Ico><path d="M12 3 4 7.5v9L12 21l8-4.5v-9Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></Ico>;
const BadgeIco = () => <Ico><circle cx="12" cy="9" r="5" /><path d="m9 13.5-1.5 7L12 18l4.5 2.5-1.5-7" /></Ico>;

// Dipakai bersama oleh /admin/profil dan /user/profil
export default function Profil() {
  const { me, setMe, badge = {} } = useOutletContext();
  const admin = !!me.is_admin;
  const FIELDS = [
    ["name", "Nama lengkap", "user", "text"],
    ["nim_nip", admin ? "NIP" : "NIM / NIP", "id", "text"],
    ["program_studi", admin ? "Unit kerja" : "Program studi / Unit kerja", admin ? "building" : "cap", "text"],
    ["phone", "Nomor telepon / WhatsApp", "phone", "tel"],
  ];

  const [v, setV] = useState(() => Object.fromEntries(FIELDS.map(([k]) => [k, me[k] || ""])));
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loans, setLoans] = useState(null);
  const input = useRef(null);

  useEffect(() => { api(admin ? "/loans" : "/loans/mine").then(setLoans).catch(() => setLoans(false)); }, [admin]);

  const apply = async u => {
    const next = u?.name ? u : await api("/auth/me");
    setMe(next); setStoredUser(next);
  };

  const save = async e => {
    e.preventDefault();
    setAlert(null);
    const err = {};
    FIELDS.forEach(([k, label]) => { if (!v[k].trim()) err[k] = `${label} wajib diisi.`; });
    if (v.phone && !/^[0-9+\-\s()]{8,20}$/.test(v.phone.trim())) err.phone = "Nomor telepon tidak valid.";
    setErrors(err);
    if (Object.keys(err).length) return;

    setSaving(true);
    try {
      const body = Object.fromEntries(FIELDS.map(([k]) => [k, v[k].trim()]));
      await apply(await tryEndpoints(UPDATE, () => ({ json: body })));
      setAlert({ type: "ok", msg: "Perubahan berhasil disimpan." });
    } catch (e2) {
      const fe = {};
      if (e2.status === 422 && Array.isArray(e2.data?.detail)) e2.data.detail.forEach(x => { const k = x.loc?.[x.loc.length - 1]; if (v[k] !== undefined) fe[k] = x.msg; });
      setErrors(fe);
      const hint = e2.status === 404 || e2.status === 405 ? " (endpoint belum ada di backend, lihat backend_users_tambahan.py)" : "";
      setAlert({ type: "error", msg: explainError(e2, "Gagal menyimpan perubahan.") + hint });
    }
    setSaving(false);
  };

  const upload = async f => {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return toast("Gunakan foto JPG, PNG, atau WEBP", true);
    if (f.size > 5 * 1048576) return toast("Ukuran foto maksimal 5 MB", true);
    setUploading(true);
    try {
      await apply(await tryEndpoints(PHOTO, () => { const fd = new FormData(); fd.append("foto", f); return { body: fd }; }));
      toast("Foto profil diperbarui");
    } catch (e) { toast(explainError(e, "Gagal mengunggah foto.") + (e.status === 404 || e.status === 405 ? " (endpoint belum ada di backend)" : ""), true); }
    setUploading(false);
  };

  const pic = fileUrl(photoOf(me));
  const L = Array.isArray(loans) ? loans : [];
  const rows = admin
    ? [["Pengajuan diproses", loans ? `${L.filter(l => loanStatus(l) !== "menunggu").length} kali` : "–"],
       ["Menunggu tindakan", `${(badge.pengajuan || 0) + (badge.pengembalian || 0) + (badge.verifikasi_akun || 0)} item`]]
    : [["Total peminjaman", loans ? `${L.length} kali` : "–"],
       ["Sedang dipinjam", loans ? `${L.filter(l => loanStatus(l) === "disetujui").length} aset` : "–"]];
  const active = ["approved", "aktif", "active"].includes(String(me.account_status || "approved").toLowerCase());
  const STAT_ICO = [<ListIco key="a" />, <BoxIco key="b" />];

  return (
    <div className="pr-grid">
      <div className="pr-col">
        {/* ===== Kartu profil ===== */}
        <section className="pr-card pr-hero">
          <div className="pr-banner" />
          <div className="pr-avwrap">
            <div className="pr-av" style={pic ? { backgroundImage: `url("${pic}")` } : undefined}>{pic ? "" : initials(me.name)}</div>
            <button className="pr-cam" type="button" disabled={uploading} aria-label="Ganti foto profil" title="Ganti foto profil" onClick={() => input.current.click()}><Icon n="camera" /></button>
            <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e => { upload(e.target.files[0]); e.target.value = ""; }} />
          </div>
          <h2 className="pr-name">{me.name}</h2>
          <span className="pr-role"><BadgeIco />{admin ? "Admin" : "Mahasiswa"}</span>
          {me.program_studi && <p className="pr-prodi">{me.program_studi}</p>}
          <p className="pr-hint">{uploading ? "Mengunggah foto…" : "JPG, PNG, atau WEBP · maks. 5 MB"}</p>
        </section>

        {/* ===== Ringkasan ===== */}
        <section className="pr-card pr-pad">
          <div className="pr-head"><span className="pr-hic"><ShieldIco /></span><h2>Ringkasan akun</h2></div>
          <div className="pr-status">
            <span>Status akun</span>
            <span className={`pr-pill ${active ? "ok" : "pend"}`}><i />{active ? "Aktif" : String(me.account_status || "–")}</span>
          </div>
          <div className="pr-stats">
            {rows.map(([k, val], i) => (
              <div className="pr-stat" key={k}>
                <span className="pr-sic">{STAT_ICO[i]}</span>
                <b>{val}</b>
                <small>{k}</small>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ===== Form ===== */}
      <section className="pr-card pr-pad pr-form">
        <div className="pr-head"><span className="pr-hic"><UserIco /></span><h2>Informasi pribadi</h2></div>
        <p className="pr-sub">{admin ? "Data ini digunakan untuk keperluan administrasi dan verifikasi sistem" : "Data ini digunakan otomatis saat mengajukan peminjaman aset"}</p>
        {alert && <div className={`pr-alert ${alert.type}`} role="alert" style={{ whiteSpace: "pre-line" }}>{alert.msg}</div>}

        <form onSubmit={save} noValidate>
          <div className="pr-fields">
            {FIELDS.map(([k, label, ic, type]) => (
              <div className={`pr-fld pr-f-${k}`} key={k}>
                <label htmlFor={k}>{label}</label>
                <div className={`pr-inp ${errors[k] ? "bad" : ""}`}>
                  <Icon n={ic} />
                  <input id={k} type={type} value={v[k]} onChange={e => setV(s => ({ ...s, [k]: e.target.value }))} aria-invalid={!!errors[k]} />
                </div>
                {errors[k] && <p className="pr-err">{errors[k]}</p>}
              </div>
            ))}
            <div className="pr-fld pr-f-email">
              <label htmlFor="email">Email kampus</label>
              <div className="pr-inp ro">
                <Icon n="mail" />
                <input id="email" type="email" value={me.email || ""} readOnly title="Email tidak dapat diubah" />
                <span className="pr-lock"><LockIco />Terkunci</span>
              </div>
            </div>
          </div>
          <button className="pr-save" disabled={saving}>{saving ? "Menyimpan…" : <><CheckIco />Simpan perubahan</>}</button>
        </form>
      </section>
    </div>
  );
}