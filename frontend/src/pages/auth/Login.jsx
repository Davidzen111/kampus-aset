import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, ROUTES } from "../../config";
import { getToken, getUser, saveSession } from "../../api";
import { AuthLayout, RgField, RgPassword, RgSubmit } from "../../components/AuthLayout";

export default function Login() {
  const nav = useNavigate();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);

  const goHome = user => {
    nav(user?.is_admin ? ROUTES.adminHome : ROUTES.userHome, { replace: true });
  };

  useEffect(() => { if (getToken() && getUser()) goHome(getUser());  }, []);

  const submit = async e => {
    e.preventDefault();
    setAlert("");
    const id = identity.trim();
    const err = {};
    if (!id) err.identity = "NIM atau email wajib diisi.";
    else if (!id.includes("@")) err.identity = "Gunakan email kampus Anda untuk masuk.";
    if (!password) err.password = "Kata sandi wajib diisi.";
    setErrors(err);
    if (Object.keys(err).length) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: id.toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        saveSession(data.access_token, data.user, true);
        return goHome(data.user);
      }
      if (res.status === 422) setErrors({ identity: "Format email tidak valid." });
      else setAlert(typeof data.detail === "string" ? data.detail : "Gagal masuk. Coba lagi beberapa saat.");
    } catch (e2) {
      console.error("Login gagal terhubung:", e2);
      setAlert("Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi.");
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <h1 className="rg-title">Masuk</h1>
      {alert && <div className="rg-alert error" role="alert">{alert}</div>}

      <form onSubmit={submit} noValidate>
        <RgField id="identity" label="NIM atau Email Kampus" icon="mail" type="text" autoComplete="username" placeholder="nama@student.ac.id"
          value={identity} onChange={e => setIdentity(e.target.value)} error={errors.identity} />
        <RgPassword id="password" label="Kata Sandi" autoComplete="current-password" placeholder="Masukkan kata sandi"
          value={password} onChange={e => setPassword(e.target.value)} error={errors.password} />

        <div style={{ height: 8 }} />
        <RgSubmit loading={loading}>Masuk</RgSubmit>
      </form>

      <p className="rg-foot">Belum punya akun? <Link to="/register">Daftar</Link></p>
    </AuthLayout>
  );
}