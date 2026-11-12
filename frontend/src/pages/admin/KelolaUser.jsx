import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { run, useLoad } from "../../utils";
import { ask, toast } from "../../components/dialogs";
import { Table, Person, Badge, Icon } from "../../components/ui";

const STATUS = { approved: ["Aktif", "g"], inactive: ["Nonaktif", "r"], pending: ["Menunggu", "y"], rejected: ["Ditolak", "r"] };

// [kunci, label, ikon, warna kartu, fungsi penyaring]
const FILTERS = [
  ["all", "Semua akun", "users", "t-all", () => true],
  ["approved", "Aktif", "check", "t-ok", u => u.account_status === "approved"],
  ["pending", "Menunggu", "clock", "t-wait", u => u.account_status === "pending"],
  ["off", "Nonaktif / ditolak", "x", "t-off", u => u.account_status === "inactive" || u.account_status === "rejected"],
];

export default function KelolaUser() {
  const [rows, reload] = useLoad("/users");
  const [filter, setFilter] = useState("all");
  const [role, setRole] = useState("all");
  const [q, setQ] = useState("");

  const setStatus = (id, account_status) => run(async () => {
    if ((await ask(account_status === "inactive" ? "Nonaktifkan akun ini?" : "Aktifkan kembali akun ini?")) === null) return;
    await api(`/users/${id}/status`, { method: "PATCH", json: { account_status } });
    toast("Status akun diperbarui");
  }, reload);

 
  const shown = useMemo(() => {
    if (!rows) return null;
    const test = FILTERS.find(f => f[0] === filter)[4];
    const needle = q.trim().toLowerCase();
    return rows.filter(u =>
      test(u)
      && (role === "all" || (role === "admin") === !!u.is_admin)
      && (!needle || [u.name, u.nim_nip, u.program_studi, u.email].some(v => String(v || "").toLowerCase().includes(needle)))
    );
  }, [rows, filter, role, q]);

  const filtering = filter !== "all" || role !== "all" || q.trim() !== "";

  return (
    <>
      <div className="ku-stats">
        {FILTERS.map(([key, label, icon, tone, test]) => (
          <button key={key} type="button" className={`ku-stat ${tone}`} aria-pressed={filter === key} onClick={() => setFilter(key)}>
            <span className="wm" aria-hidden="true"><Icon n={icon} /></span>
            <span className="ic" aria-hidden="true"><Icon n={icon} /></span>
            <span className="v"><strong>{rows ? rows.filter(test).length : "–"}</strong><span>{label}</span></span>
          </button>
        ))}
      </div>

      <div className="ku-bar">
        <label className="ku-search">
          <Icon n="search" />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama, NIM/NIP, atau prodi…" aria-label="Cari akun" />
        </label>
        <select className="ku-select" value={role} onChange={e => setRole(e.target.value)} aria-label="Filter role">
          <option value="all">Semua role</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <section className="card ku-card">
        <header className="ku-head">
          <h2>Daftar akun</h2>
          {rows && <span className="ku-count">{shown.length} dari {rows.length} akun</span>}
        </header>
        <Table rows={shown} empty={filtering ? "Tidak ada akun yang cocok dengan pencarian atau filter ini." : "Belum ada user."} cols={[
          ["Nama", u => <Person name={u.name} sub={u.nim_nip} user={u} />],
          ["Prodi / unit", u => u.program_studi || <span className="muted">–</span>],
          ["Role", u => <Badge cls={u.is_admin ? "o" : ""}>{u.is_admin ? "Admin" : "User"}</Badge>],
          ["Status", u => { const s = STATUS[u.account_status] || [u.account_status, ""]; return <Badge cls={`${s[1]} dot`}>{s[0]}</Badge>; }],
          ["Aksi", u => {
            if (u.is_admin) return <span className="muted">–</span>;
            if (u.account_status === "approved") return <button className="btn dng" onClick={() => setStatus(u.id, "inactive")}><Icon n="x" />Nonaktifkan</button>;
            if (u.account_status === "inactive") return <button className="btn okk" onClick={() => setStatus(u.id, "approved")}><Icon n="check" />Aktifkan</button>;
            if (u.account_status === "pending") return <Link className="ku-link" to="/admin/verifikasi">Tinjau di Verifikasi</Link>;
            return <span className="muted">–</span>;
          }],
        ]} />
      </section>
    </>
  );
}