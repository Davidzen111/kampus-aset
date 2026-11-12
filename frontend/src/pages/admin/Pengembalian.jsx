import { useOutletContext } from "react-router-dom";
import { api } from "../../api";
import { fileUrl, fmtDate, run, useLoad } from "../../utils";
import { ask, toast } from "../../components/dialogs";
import { Table, Person, Badge, Icon, AssetThumb } from "../../components/ui";


const isLate = l =>
  !!l.tanggal_kembali_aktual && !!l.tanggal_kembali_rencana
  && String(l.tanggal_kembali_aktual).slice(0, 10) > String(l.tanggal_kembali_rencana).slice(0, 10);

export default function Pengembalian() {
  const { refreshBadges } = useOutletContext();
  const [rows, reload] = useLoad("/loans?status_pengembalian=menunggu_verifikasi");

  const verify = (id, keputusan) => run(async () => {
    let alasan = null;
    if (keputusan === "diterima") {
      if ((await ask("Terima pengembalian ini?", { ok: "Terima" })) === null) return;
    } else {
      alasan = await ask("Tolak pengembalian ini?", { reason: true, required: true, ok: "Tolak" });
      if (alasan === null) return;
    }
    await api(`/loans/${id}/verify`, { method: "PATCH", json: { keputusan, alasan } });
    toast(keputusan === "diterima" ? "Pengembalian diterima" : "Pengembalian ditolak");
    refreshBadges();
  }, reload);

  return (
    <>
      {rows?.length > 0 && (
        <div className="vk-banner" role="status">
          <span className="ic" aria-hidden="true"><Icon n="return" /></span>
          <div className="tx">
            <b>{rows.length} pengembalian menunggu verifikasi</b>
            <span>Periksa foto kondisi aset sebelum menerima pengembalian.</span>
          </div>
        </div>
      )}

      <section className="card ku-card">
        <header className="ku-head">
          <h2>Menunggu pemeriksaan</h2>
          {rows && <span className="ku-count">{rows.length} pengembalian</span>}
        </header>
        <Table rows={rows} cols={[
          ["Peminjam", l => <Person name={l.user.name} sub={l.user.nim_nip} user={l.user} />],
          ["Aset", l => (
            <div className="pg-asset">
              <span className="pg-thumb"><AssetThumb asset={l.asset} /></span>
              <b>{l.asset.name}</b>
            </div>
          )],
          ["Tgl kembali", l => (
            <div className="pg-date">
              <b>{fmtDate(l.tanggal_kembali_aktual)}</b>
              <small>Rencana: {fmtDate(l.tanggal_kembali_rencana)}</small>
              {l.tanggal_kembali_aktual && l.tanggal_kembali_rencana && (
                <Badge cls={isLate(l) ? "r dot" : "g dot"}>{isLate(l) ? "Terlambat" : "Tepat waktu"}</Badge>
              )}
            </div>
          )],
          ["Kondisi akhir", l => (
            <div className="pg-cond">
              {l.foto_kondisi_akhir
                ? (
                  <a className="pg-photo" href={fileUrl(l.foto_kondisi_akhir)} target="_blank" rel="noreferrer">
                    <img src={fileUrl(l.foto_kondisi_akhir)} alt="Foto kondisi akhir" loading="lazy" onError={e => { e.currentTarget.style.visibility = "hidden"; }} />
                    <span className="ku-link">Lihat foto kondisi</span>
                  </a>
                )
                : <span className="muted">Tidak ada foto</span>}
              {l.catatan_akhir && <small>{l.catatan_akhir}</small>}
            </div>
          )],
          ["Aksi", l => (
            <div className="vk-acts">
              <button type="button" className="btn pri" onClick={() => verify(l.id, "diterima")}><Icon n="check" />Terima</button>
              <button type="button" className="btn dng" onClick={() => verify(l.id, "ditolak")}><Icon n="x" />Tolak</button>
            </div>
          )],
        ]} empty={
          <span className="vk-empty">
            <span className="orb" aria-hidden="true"><Icon n="return" /></span>
            <b>Semua pengembalian sudah diperiksa</b>
            <span className="sub">Tidak ada pengembalian yang menunggu verifikasi.</span>
          </span>
        } />
      </section>
    </>
  );
}