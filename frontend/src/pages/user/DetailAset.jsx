import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { api, explainError } from "../../api";
import { fileUrl, fmtDate, initials, photoOf, todayISO, ASSET_BADGE, catOf } from "../../utils";
import { toast } from "../../components/dialogs";
import { Icon, Badge, PhotoPicker, ProfileDialog } from "../../components/ui";

export default function DetailAset() {
  const { me } = useOutletContext();
  const nav = useNavigate();
  const id = useSearchParams()[0].get("id");
  const today = todayISO();

  const [asset, setAsset] = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [f, setF] = useState({ start: "", end: "", purpose: "", note: "" });
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [sending, setSending] = useState(false);
  const [adminContact, setAdminContact] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }));

  useEffect(() => { api("/users/admin-contact").then(setAdminContact).catch(() => {}); }, []);

  useEffect(() => {
    if (!id) { setLoadErr("Aset tidak ditemukan"); return; }
    api(`/assets/${id}`).then(setAsset).catch(e => setLoadErr(e.status === 404 ? "Aset tidak ditemukan" : "Gagal memuat aset"));
  }, [id]);

  // Hanya aset maintenance yang ditolak; bentrok jadwal dicek backend.
  const available = asset && asset.status !== "maintenance";
  const [badgeLabel, badgeCls] = asset ? (ASSET_BADGE[asset.status] || [asset.status, ""]) : ["", ""];

  const submit = async e => {
    e.preventDefault();
    setAlert(null);
    const err = {};
    if (!f.start) err.start = "Pilih tanggal pinjam.";
    else if (f.start < today) err.start = "Tanggal pinjam tidak boleh sebelum hari ini.";
    if (!f.end) err.end = "Pilih tanggal kembali.";
    else if (f.start && f.end < f.start) err.end = "Tanggal kembali tidak boleh sebelum tanggal pinjam.";
    if (f.purpose.trim().length < 3) err.purpose = "Keperluan minimal 3 karakter.";
    if (!photo) err.photo = "Foto kondisi awal aset wajib diunggah.";
    setErrors(err);
    if (Object.keys(err).length) { if (err.photo && Object.keys(err).length === 1) setAlert({ type: "error", msg: err.photo }); return; }

    const fd = new FormData();
    fd.append("asset_id", id);
    fd.append("tanggal_pinjam", f.start);
    fd.append("tanggal_kembali_rencana", f.end);
    fd.append("keperluan", f.purpose.trim());
    if (f.note.trim()) fd.append("catatan_awal", f.note.trim());
    fd.append("foto_kondisi_awal", photo);

    setSending(true);
    try {
      await api("/loans", { method: "POST", body: fd });
      toast("Pengajuan terkirim, menunggu persetujuan Admin");
      nav("/user/status-riwayat");
    } catch (e2) {
      setAlert({ type: "error", msg: explainError(e2, "Pengajuan gagal. Coba lagi beberapa saat.") });
      setSending(false);
    }
  };

  if (loadErr) return <p className="empty">{loadErr}. Kembali ke daftar aset lalu coba lagi.</p>;
  if (!asset) return <p className="empty">Memuat…</p>;

  const contact = asset.admin_contact || asset.admin || adminContact;
  return (
    <div className="dgrid">
      <div className="dcol">
        <section className="card pad">
          <div className="photo">{asset.photo_url ? <img src={fileUrl(asset.photo_url)} alt={asset.name} /> : <Icon n="cube" />}</div>
          <h2 className="aname">{asset.name}</h2>
          <ul className="meta">
            <li><Icon n="cube" />Kategori: {catOf(asset) || "–"}</li>
            <li><Icon n="pin" />Lokasi: {asset.location || "–"}</li>
            <li><Icon n="hash" />Kode Aset: AST-{String(asset.id).padStart(4, "0")}</li>
            <li><Icon n="cal" />Ditambahkan: {fmtDate(asset.created_at)}</li>
          </ul>
          <div className="desc">{asset.description || "Tidak ada deskripsi."}</div>
          <Badge cls={badgeCls}>{badgeLabel}</Badge>
        </section>

        <section className="card pad">
          <div className="sec">DATA PEMINJAM <small>(otomatis dari profil akun)</small></div>
          {[["Nama", me.name], ["NIM/NIP", me.nim_nip], ["Program Studi", me.program_studi], ["No. Telepon", me.phone]].map(([k, v]) => (
            <div className="kv" key={k}><span>{k}</span><b>{v || "–"}</b></div>
          ))}
        </section>
      </div>

      <section className="card pad form">
        <h2>Form Pengajuan Peminjaman</h2>
        {alert && <div className={`alert ${alert.type}`} role="alert">{alert.msg}</div>}
        <form onSubmit={submit} noValidate>
          <div className="two">
            <div className="fld"><label>Tanggal pinjam</label>
              <input type="date" min={today} value={f.start} onChange={set("start")} aria-invalid={!!errors.start} />
              {errors.start && <p className="ferr">{errors.start}</p>}</div>
            <div className="fld"><label>Tanggal kembali (rencana)</label>
              <input type="date" min={f.start || today} value={f.end} onChange={set("end")} aria-invalid={!!errors.end} />
              {errors.end && <p className="ferr">{errors.end}</p>}</div>
          </div>
          <div className="fld"><label>Keperluan peminjaman</label>
            <textarea rows={2} placeholder="cth: presentasi tugas akhir kelompok…" value={f.purpose} onChange={set("purpose")} aria-invalid={!!errors.purpose} />
            {errors.purpose && <p className="ferr">{errors.purpose}</p>}</div>
          <div className="fld"><label>Foto kondisi awal aset (wajib)</label>
            <PhotoPicker file={photo} onChange={setPhoto} label="Unggah foto kondisi awal aset" invalid={!!errors.photo} /></div>
          <div className="fld"><label>Catatan kondisi awal</label>
            <textarea rows={2} placeholder="cth: kabel HDMI lengkap, ada goresan kecil di bodi…" value={f.note} onChange={set("note")} /></div>

          {contact && (
            <div className="contact">
              <div className="chead">KONTAK ADMIN <small>(hubungi jika ada kendala peminjaman)</small></div>
              <button type="button" className="cwho cbtn" title="Lihat profil admin" onClick={() => setShowAdmin(true)}>
  <span className="ca" style={fileUrl(photoOf(contact)) ? { backgroundImage: `url("${fileUrl(photoOf(contact))}")` } : undefined}>{photoOf(contact) ? "" : initials(contact.name)}</span>
  <div><b>{contact.name}</b><small>{contact.role || `Admin${contact.program_studi ? ` · ${contact.program_studi}` : ""}`}</small></div>
  <span className="cmore">Lihat profil</span>
</button>
              {contact.phone && <div className="cline"><Icon n="phone" />{contact.phone}</div>}
              {contact.email && <div className="cline"><Icon n="mail" />{contact.email}</div>}
            </div>
          )}
          <button className="btn pri wide" disabled={!available || sending}>{sending ? "Mengirim…" : available ? "Ajukan Peminjaman" : "Aset sedang maintenance"}</button>
        </form>
      </section>
      {showAdmin && contact && <ProfileDialog user={{ ...contact, is_admin: true }} onClose={() => setShowAdmin(false)} />}
    </div>
  );
}