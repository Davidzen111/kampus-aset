import { useOutletContext } from "react-router-dom";
import { api } from "../../api";
import { fileUrl, fmtDate, run, useLoad, toDate, iconFor, catOf } from "../../utils";
import { ask, toast } from "../../components/dialogs";
import { Table, Person, Icon } from "../../components/ui";


const days = l => {
  const a = toDate(l.tanggal_pinjam), b = toDate(l.tanggal_kembali_rencana);
  return a && b ? Math.max(1, Math.round((b - a) / 86400000) + 1) : null;
};

export default function Pengajuan() {
  const { refreshBadges } = useOutletContext();
  const [rows, reload] = useLoad("/loans?status_pinjam=menunggu");

  const decide = (id, kind) => run(async () => {
    if (kind === "approve") {
      if ((await ask("Setujui pengajuan ini?", { ok: "Setujui" })) === null) return;
      await api(`/loans/${id}/approve`, { method: "PATCH" });
      toast("Pengajuan disetujui");
    } else {
      const r = await ask("Tolak pengajuan ini?", { reason: true, ok: "Tolak" });
      if (r === null) return;
      await api(`/loans/${id}/reject`, { method: "PATCH", json: { alasan: r || null } });
      toast("Pengajuan ditolak");
    }
    refreshBadges();
  }, reload);

  const n = Array.isArray(rows) ? rows.length : 0;

  return (
    <div className="card pj">
      <header className="pj-head">
        <span className="pj-hic"><Icon n="inbox" /></span>
        <div><h3>Daftar pengajuan</h3><p>Periksa foto kondisi awal dan keperluan sebelum menyetujui</p></div>
        <span className="grow" />
        {n > 0 && <span className="pj-count">{n} menunggu</span>}
      </header>

      {rows !== null && !rows.length ? (
        <div className="pj-empty">
          <span><Icon n="check" /></span>
          <b>Semua pengajuan sudah ditinjau</b>
          <p>Tidak ada pengajuan yang menunggu.</p>
        </div>
      ) : (
        <Table rows={rows} empty="Tidak ada pengajuan yang menunggu." cols={[
          ["PEMINJAM", l => <Person name={l.user.name} sub={l.user.nim_nip} user={l.user} />],
          ["PRODI", l => <span className="pj-prodi">{l.user.program_studi || "-"}</span>],
          ["ASET", l => {
            const a = l.asset || {};
            return (
              <span className="pj-asset">
                <span className="pj-aic"><Icon n={iconFor(a.name, catOf(a))[0]} /></span>
                <span><b>{a.name}</b><small>{catOf(a) || "—"}</small></span>
              </span>
            );
          }],
          ["FOTO AWAL", l => (
            <a className="pj-photo" href={fileUrl(l.foto_kondisi_awal)} target="_blank" rel="noreferrer" title="Lihat foto">
              <img src={fileUrl(l.foto_kondisi_awal)} alt="Foto kondisi awal" />
              <span className="pj-zoom"><Icon n="search" /></span>
            </a>
          )],
          ["TANGGAL", l => (
            <div className="pj-date">
              <div className="pj-line">
                <span className="pj-range"><Icon n="cal" />{fmtDate(l.tanggal_pinjam)} – {fmtDate(l.tanggal_kembali_rencana)}</span>
                {days(l) && <em>{days(l)} hari</em>}
              </div>
              <small>{l.keperluan}</small>
            </div>
          )],
          ["AKSI", l => (
            <div className="pj-act">
              <button type="button" className="pj-btn ok" onClick={() => decide(l.id, "approve")}><Icon n="check" />Setujui</button>
              <button type="button" className="pj-btn no" onClick={() => decide(l.id, "reject")}><Icon n="x" />Tolak</button>
            </div>
          )],
        ]} />
      )}
    </div>
  );
}