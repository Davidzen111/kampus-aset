import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../../config";
import { AuthLayout, RgField, RgPassword, RgRole, RgCheck, RgSubmit } from "../../components/AuthLayout";

const ROLE_TO_API = { mahasiswa: "user", dosen: "user" };
const EMPTY = { name: "", nim_nip: "", email: "", password: "" };

function validate(v, agree) {
  const e = {};
  if (!v.name.trim()) e.name = "Nama lengkap wajib diisi.";
  if (!v.nim_nip.trim()) e.nim_nip = "NIM / NIP wajib diisi.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "Masukkan alamat email yang valid.";
  if (v.password.length < 8) e.password = "Kata sandi minimal 8 karakter.";
  if (!agree) e.agree = "Anda perlu menyetujui ketentuan untuk melanjutkan.";
  return e;
}

export default function Register() {
  const [role, setRole] = useState("mahasiswa");
  const [v, setV] = useState(EMPTY);
  const [agree, setAgree] = useState(true);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null); // { type: "ok" | "error", msg }
  const [loading, setLoading] = useState(false);
  const set = k => e => setV(s => ({ ...s, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setAlert(null);
    const err = validate(v, agree);
    setErrors(err);
    if (Object.keys(err).length) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: v.name.trim(), nim_nip: v.nim_nip.trim(), email: v.email.trim().toLowerCase(), password: v.password, role: ROLE_TO_API[role] }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 200 || res.status === 201) {
        setV(EMPTY); setAgree(true);
        setAlert({ type: "ok", msg: data.message || "Pendaftaran berhasil. Akun Anda menunggu verifikasi Admin." });
      } else if (res.status === 409) {
        setErrors({ email: data.detail || "Email sudah terdaftar." });
      } else if (res.status === 422 && Array.isArray(data.detail)) {
        const fe = {};
        data.detail.forEach(d => { const f = d.loc?.[d.loc.length - 1]; if (["name", "nim_nip", "email", "password"].includes(f)) fe[f] = d.msg; });
        setErrors(fe);
        setAlert({ type: "error", msg: "Periksa kembali data yang Anda isi." });
      } else {
        setAlert({ type: "error", msg: typeof data.detail === "string" ? data.detail : "Pendaftaran gagal. Coba lagi beberapa saat." });
      }
    } catch (e2) {
      console.error("Pendaftaran gagal terhubung:", e2);
      setAlert({ type: "error", msg: "Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi." });
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <h1 className="rg-title">Daftar</h1>
      {alert && <div className={`rg-alert ${alert.type}`} role="alert">{alert.msg}</div>}

      <form onSubmit={submit} noValidate>
        <RgRole value={role} onChange={setRole} />

        <RgField id="name" label="Nama Lengkap" icon="user" type="text" autoComplete="name" placeholder="Nama lengkap"
          value={v.name} onChange={set("name")} error={errors.name} />
        <RgField id="nim_nip" label="NIM / NIP" icon="card" type="text" inputMode="numeric" placeholder="2111522001"
          value={v.nim_nip} onChange={set("nim_nip")} error={errors.nim_nip} />
        <RgField id="email" label="Email Kampus" icon="mail" type="email" autoComplete="email" placeholder="nama@student.ac.id"
          value={v.email} onChange={set("email")} error={errors.email} />
        <RgPassword id="password" label="Kata Sandi" autoComplete="new-password" placeholder="Min. 8 karakter"
          value={v.password} onChange={set("password")} error={errors.password} />

        <RgCheck checked={agree} onChange={e => setAgree(e.target.checked)}>Setuju dengan Ketentuan &amp; Privasi</RgCheck>
        {errors.agree && <p className="rg-err" style={{ marginTop: -8, marginBottom: 12 }}>{errors.agree}</p>}

        <RgSubmit loading={loading}>Daftar</RgSubmit>
      </form>

      <p className="rg-foot">Sudah punya akun? <Link to="/login">Masuk</Link></p>
    </AuthLayout>
  );
}