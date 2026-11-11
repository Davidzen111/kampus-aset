import { useOutletContext } from "react-router-dom";
import { api } from "../../api";
import { run, useLoad } from "../../utils";
import { ask, toast } from "../../components/dialogs";
import { Table, Person, Icon } from "../../components/ui";

export default function VerifikasiAkun() {
  const { refreshBadges } = useOutletContext();
  const [rows, reload] = useLoad("/users?account_status=pending");

  const decide = (id, act) => run(async () => {
    const ok = act === "approve";
    if ((await ask(ok ? "Setujui akun ini?" : "Tolak pendaftaran akun ini?", { ok: ok ? "Setujui" : "Tolak" })) === null) return;
    toast((await api(`/users/${id}/${act}`, { method: "PATCH" })).message);
    refreshBadges();
  }, reload);

  return (
    <>
      {rows?.length > 0 && (
        <div className="vk-banner" role="status">
          <span className="ic" aria-hidden="true"><Icon n="shield" /></span>
          <div className="tx">
            <b>{rows.length} akun baru menunggu persetujuan</b>
            <span>Mereka belum dapat login ke sistem sebelum disetujui.</span>
          </div>
        </div>
      )}

      <section className="card ku-card">
        <header className="ku-head">
          <h2>Menunggu verifikasi</h2>
          {rows && <span className="ku-count">{rows.length} akun</span>}
        </header>
        <Table rows={rows} cols={[
          ["Nama", u => <Person name={u.name} user={u} />],
          ["NIM / NIP", u => u.nim_nip || "-"],
          ["Prodi", u => u.program_studi || "-"],
          ["Email", u => <a className="vk-mail" href={`mailto:${u.email}`}>{u.email}</a>],
          ["Aksi", u => (
            <div className="vk-acts">
              <button type="button" className="btn pri" onClick={() => decide(u.id, "approve")}><Icon n="check" />Setujui</button>
              <button type="button" className="btn dng" onClick={() => decide(u.id, "reject")}><Icon n="x" />Tolak</button>
            </div>
          )],
        ]} empty={
          <span className="vk-empty">
            <span className="orb" aria-hidden="true"><Icon n="shield" /></span>
            <b>Semua akun sudah diverifikasi</b>
            <span className="sub">Tidak ada akun yang menunggu verifikasi.</span>
          </span>
        } />
      </section>
    </>
  );
}