import { useEffect, useRef, useState } from "react";
import { Person } from "../../components/ui";
import { api } from "../../api";
import { fileUrl, fmtDate, loanStatus, run, useLoad } from "../../utils";
import { ask, toast } from "../../components/dialogs";
import "../../styles/kelola-aset.css";

const STATUS = { tersedia: ["Tersedia", "g"], dipinjam: ["Dipinjam", "b"], maintenance: ["Maintenance", "y"] };

// Backend belum punya kolom kode aset; ini hanya tampilan turunan dari id.
const kode = a => "AST-" + String(a.id).padStart(4, "0");

const DEFAULT_CATEGORIES = ["Elektronik", "Ruangan", "Kendaraan", "Furnitur", "Peralatan Lab", "Perlengkapan Olahraga"];

function loanLabel(l) {
  const s = loanStatus(l);
  if (s === "menunggu") return ["Menunggu", "y"];
  if (s === "ditolak") return ["Ditolak", "r"];
  if (s === "dikembalikan" || s === "selesai") return ["Selesai", "g"];
  if (l.status_pengembalian === "menunggu_verifikasi") return ["Verifikasi", "b"];
  return new Date(l.tanggal_kembali_rencana + "T23:59") < new Date() ? ["Terlambat", "r"] : ["Dipinjam", "b"];
}

/* ---------- Ikon garis ---------- */
const Ico = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const SearchIco = () => <Ico><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Ico>;
const PlusIco = () => <Ico><path d="M12 5v14M5 12h14" /></Ico>;
const EyeIco = () => <Ico><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Ico>;
const PencilIco = () => <Ico><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></Ico>;
const TrashIco = () => <Ico><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Ico>;
const BoxIco = () => <Ico><path d="M12 3 4 7.5v9L12 21l8-4.5v-9Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></Ico>;
const CheckCircleIco = () => <Ico><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.5 2.5 4.5-5" /></Ico>;
const ClockIco = () => <Ico><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Ico>;
const WrenchIco = () => <Ico><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4Z" /></Ico>;
const PinIco = () => <Ico><path d="M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></Ico>;
const TagIco = () => <Ico><path d="M3 12V4h8l9 9-8 8Z" /><circle cx="7.5" cy="8.5" r="1.3" /></Ico>;
const CalIco = () => <Ico><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16" /></Ico>;
const XIco = () => <Ico><path d="M6 6l12 12M18 6 6 18" /></Ico>;
const ChevIco = () => <Ico><path d="m6 9 6 6 6-6" /></Ico>;
const ImageIco = () => <Ico><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="m4 18 5-5 4 4 3-3 4 4" /></Ico>;

const Pill = ({ cls, children }) => <span className={`ka-pill ${cls || ""}`}><i />{children}</span>;

// ===== Panel detail =====
function AsetDetailPanel({ asset: a, onClose, onEdit }) {
  const [loans, setLoans] = useState(null);
  const [err, setErr] = useState("");
  const st = STATUS[a.status] || [a.status, ""];

  useEffect(() => {
    api("/loans?asset_id=" + a.id).then(l => setLoans(l.slice(0, 8))).catch(e => setErr(e.message));
  }, [a.id]);

  const kv = [
    [<TagIco key="1" />, "Kategori", a.category],
    [<PinIco key="2" />, "Lokasi", a.location],
    [<CheckCircleIco key="3" />, "Kondisi", a.kondisi_aset],
    [<CalIco key="4" />, "Ditambahkan", fmtDate(a.created_at)],
  ];

  return (
    <>
      <div className="ka-back" onClick={onClose} />
      <aside className="ka-drawer" role="dialog" aria-label="Detail aset">
        <div className="ka-cover">
          {a.photo_url ? <img src={fileUrl(a.photo_url)} alt="" /> : <span className="ka-cover-ph"><BoxIco /></span>}
          <Pill cls={st[1]}>{st[0]}</Pill>
          <button type="button" className="ka-x" onClick={onClose} aria-label="Tutup"><XIco /></button>
        </div>

        <div className="ka-dbody">
          <h2>{a.name}</h2>
          <span className="ka-code">Kode aset: {kode(a)}</span>

          <div className="ka-kv">
            {kv.map(([ic, k, val]) => (
              <div key={k}><small>{ic}{k}</small><b>{val || "-"}</b></div>
            ))}
          </div>

          <h4>Deskripsi</h4>
          <p className="ka-desc">{a.description || "-"}</p>

          <h4>Riwayat Peminjaman Terakhir</h4>
          {err ? <p className="ka-note">{err}</p>
            : loans === null ? <p className="ka-note">Memuat…</p>
            : !loans.length ? <p className="ka-note">Belum ada peminjaman.</p>
            : loans.map(l => {
                const s = loanLabel(l);
                return (
                  <div className="ka-loan" key={l.id}>
                    <Person name={l.user.name} sub={`${fmtDate(l.tanggal_pinjam)} – ${fmtDate(l.tanggal_kembali_rencana)}`} user={l.user} />
                    <Pill cls={s[1]}>{s[0]}</Pill>
                  </div>
                );
              })}
        </div>

        <div className="ka-dfoot">
          <button className="ka-btn" onClick={onEdit}><PencilIco />Edit Aset</button>
          <button className="ka-btn pri" onClick={onClose}>Tutup</button>
        </div>
      </aside>
    </>
  );
}

// ===== Form tambah / edit =====
const NEW = "__new";

// Pilihan kategori: daftar dengan ikon hapus di tiap kategori yang sudah ada.
function CategoryPicker({ value, isNew, cats, canDelete, onChange, onDelete }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    const away = e => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  return (
    <div className="ka-cpick" ref={box}>
      <button type="button" className={"ka-cpick-btn" + (value || isNew ? "" : " ph")} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span>{isNew ? "+ Kategori baru…" : value || "Pilih kategori"}</span><ChevIco />
      </button>
      {open && (
        <ul className="ka-cpick-list" role="listbox">
          {cats.map(c => (
            <li key={c.name} className={c.name === value && !isNew ? "sel" : ""}>
              <button type="button" className="ka-cpick-opt" onClick={() => { onChange(c.name); setOpen(false); }}>{c.name}</button>
              {canDelete && (
                <button type="button" className={"ka-cpick-del" + (c.used ? " off" : "")} title={c.used ? `Dipakai ${c.used} aset` : "Hapus kategori"}
                  aria-label={`Hapus kategori ${c.name}`} onClick={() => onDelete(c)}><TrashIco /></button>
              )}
            </li>
          ))}
          <li className="ka-cpick-new"><button type="button" className="ka-cpick-opt" onClick={() => { onChange(NEW); setOpen(false); }}><PlusIco />Kategori baru…</button></li>
        </ul>
      )}
    </div>
  );
}

// asset = null -> tambah aset baru; asset = objek -> edit
function AsetForm({ asset: a, onClose, onSaved }) {
  const dipinjam = a?.status === "dipinjam";
  const [cats, setCats] = useState([]);              // [{ name, used }]
  const [canDelete, setCanDelete] = useState(false); // true bila backend punya GET /categories
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    name: a?.name || "", cat: a?.category || "", catNew: "", location: a?.location || "",
    kondisi: a?.kondisi_aset || "", status: a?.status || "tersedia", description: a?.description || "",
  });
  const [photo, setPhoto] = useState(null);
  const [prev, setPrev] = useState(null);
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    api("/categories")
      .then(list => { setCats(list); setCanDelete(true); })
      .catch(() => api("/assets/categories").then(l => setCats(l.map(name => ({ name, used: 0 })))).catch(() => {}));
  }, []);

  // Pratinjau foto yang baru dipilih
  useEffect(() => {
    if (!photo) { setPrev(null); return; }
    const u = URL.createObjectURL(photo);
    setPrev(u);
    return () => URL.revokeObjectURL(u);
  }, [photo]);

  // Tanpa tabel kategori di backend, daftar bawaan tetap ditampilkan; dengan tabel, hanya isi database.
  const catList = (() => {
    const m = new Map();
    const base = canDelete ? cats : [...DEFAULT_CATEGORIES.map(name => ({ name, used: 0 })), ...cats];
    [...base, ...(a ? [{ name: a.category, used: 0 }] : [])].forEach(c => { if (c.name && !m.has(c.name)) m.set(c.name, c); });
    return [...m.values()].sort((x, y) => x.name.localeCompare(y.name, "id"));
  })();

  const deleteCat = async c => {
    if (c.used) return toast(`Kategori “${c.name}” masih dipakai ${c.used} aset`, true);
    if ((await ask(`Hapus kategori “${c.name}”?`, { ok: "Hapus" })) === null) return;
    try {
      await api(`/categories?name=${encodeURIComponent(c.name)}`, { method: "DELETE" });
      setCats(l => l.filter(x => x.name !== c.name));
      setF(s => (s.cat === c.name ? { ...s, cat: "" } : s));
      toast("Kategori dihapus");
    } catch (e) { toast(e.message, true); }
  };

  const submit = async e => {
    e.preventDefault();
    if (photo && photo.size > 5 * 1024 * 1024) return toast("Ukuran foto maksimal 5 MB", true);
    const category = f.cat === NEW ? f.catNew.trim() : f.cat;
    if (!category) return toast("Kategori wajib diisi", true);

    const fd = new FormData();
    fd.set("name", f.name);
    fd.set("category", category);
    fd.set("location", f.location);
    fd.set("kondisi_aset", f.kondisi);
    fd.set("description", f.description);
    if (photo) fd.set("photo", photo);
    if (!a) fd.set("status_awal", f.status);
    else if (!dipinjam) fd.set("status_aset", f.status);

    setSaving(true);
    try {
      await api(a ? `/assets/${a.id}` : "/assets", { method: a ? "PUT" : "POST", body: fd });
      if (f.cat === NEW && canDelete) { try { await api("/categories", { method: "POST", json: { name: category } }); } catch { /* abaikan */ } }
      toast("Aset disimpan");
      onSaved();
    } catch (err) { toast(err.message, true); setSaving(false); }
  };

  const shown = prev || (a?.photo_url ? fileUrl(a.photo_url) : null);

  return (
    <div className="ka-ov">
      <form className="ka-dlg" onSubmit={submit}>
        <div className="ka-dh">
          <span className="ka-hic">{a ? <PencilIco /> : <PlusIco />}</span>
          <div>
            <h3>{a ? "Edit Aset" : "Tambah Aset Baru"}</h3>
            <p>{a ? "Perbarui informasi aset di bawah ini." : "Lengkapi data aset yang akan ditambahkan."}</p>
          </div>
        </div>

        <div className="ka-fg">
          <div className="full"><label htmlFor="ka-name">Nama aset</label>
            <input id="ka-name" className="ka-in" required minLength={2} maxLength={150} placeholder="mis. Proyektor Epson X200" value={f.name} onChange={set("name")} /></div>

          <div><label>Kategori</label>
            <CategoryPicker value={f.cat} isNew={f.cat === NEW} cats={catList} canDelete={canDelete}
              onChange={v => setF(s => ({ ...s, cat: v }))} onDelete={deleteCat} />
            {f.cat === NEW && (
              <div className="ka-catnew">
                <input className="ka-in" autoFocus required maxLength={100} placeholder="Nama kategori baru" value={f.catNew} onChange={set("catNew")} />
              </div>
            )}
          </div>

          <div><label htmlFor="ka-loc">Lokasi</label><input id="ka-loc" className="ka-in" required maxLength={150} value={f.location} onChange={set("location")} /></div>
          <div><label htmlFor="ka-kon">Kondisi aset</label><input id="ka-kon" className="ka-in" required placeholder="mis. Baik" value={f.kondisi} onChange={set("kondisi")} /></div>
          <div><label htmlFor="ka-stat">{a ? "Status" : "Status awal"}</label>
            <select id="ka-stat" className="ka-in ka-sel" value={dipinjam ? "dipinjam" : f.status} disabled={dipinjam} onChange={set("status")}>
              {dipinjam && <option value="dipinjam">Dipinjam</option>}
              <option value="tersedia">Tersedia</option>
              <option value="maintenance">Maintenance</option>
            </select></div>
          <div className="full"><label htmlFor="ka-desc">Deskripsi</label>
            <textarea id="ka-desc" className="ka-in ka-ta" rows={3} placeholder="Catatan tambahan (opsional)" value={f.description} onChange={set("description")} /></div>

          <div className="full"><label>Foto aset</label>
            <div className="ka-photo">
              <div className="ka-ph-prev">{shown ? <img src={shown} alt="" /> : <ImageIco />}</div>
              <div className="ka-ph-txt">
                <label htmlFor="ka-file" className="ka-btn sm">{shown ? "Ganti foto" : "Pilih foto"}</label>
                <span>{photo ? photo.name : "JPG, PNG, atau WEBP · maks. 5 MB"}</span>
              </div>
              <input id="ka-file" type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e => setPhoto(e.target.files[0] || null)} />
            </div>
          </div>
        </div>

        <div className="ka-dfoot in">
          <button type="button" className="ka-btn" onClick={onClose}>Batal</button>
          <button className="ka-btn pri" disabled={saving}>{saving ? "Menyimpan…" : "Simpan Aset"}</button>
        </div>
      </form>
    </div>
  );
}

// ===== Halaman =====
export default function KelolaAset() {
  const [assets, reload] = useLoad("/assets");
  const [detail, setDetail] = useState(null);   // aset yang detailnya dibuka
  const [form, setForm] = useState(undefined);  // undefined = tertutup, null = tambah, objek = edit
  const [q, setQ] = useState("");
  const [flt, setFlt] = useState("");           // "" = semua status

  const remove = a => run(async () => {
    if ((await ask(`Hapus aset “${a.name}”?`, { ok: "Hapus" })) === null) return;
    await api(`/assets/${a.id}`, { method: "DELETE" });
    toast("Aset dihapus");
  }, reload);

  const A = assets || [];
  const cnt = s => A.filter(a => a.status === s).length;
  const needle = q.trim().toLowerCase();
  const list = A.filter(a =>
    (!flt || a.status === flt) &&
    (!needle || [a.name, kode(a), a.category, a.location].some(x => String(x || "").toLowerCase().includes(needle))));
  const loading = assets === null;

  const stats = [
    ["", "Total aset", A.length, <BoxIco key="t" />, "n"],
    ["tersedia", "Tersedia", cnt("tersedia"), <CheckCircleIco key="a" />, "g"],
    ["dipinjam", "Dipinjam", cnt("dipinjam"), <ClockIco key="d" />, "b"],
    ["maintenance", "Maintenance", cnt("maintenance"), <WrenchIco key="m" />, "y"],
  ];

  return (
    <div className="ka">
      {/* ===== Ringkasan (klik untuk menyaring) ===== */}
      <div className="ka-stats">
        {stats.map(([key, label, n, ic, tone]) => (
          <button type="button" key={label} className={`ka-stat ${tone} ${flt === key ? "on" : ""}`} aria-pressed={flt === key}
            onClick={() => setFlt(flt === key ? "" : key)}>
            <span className="ka-sic">{ic}</span>
            <span><b>{loading ? "–" : n}</b><small>{label}</small></span>
          </button>
        ))}
      </div>

      {/* ===== Toolbar ===== */}
      <div className="ka-bar">
        <label className="ka-search">
          <SearchIco />
          <input type="search" placeholder="Cari nama, kode, kategori, atau lokasi…" aria-label="Cari aset" value={q} onChange={e => setQ(e.target.value)} />
          {q && <button type="button" className="ka-clear" onClick={() => setQ("")} aria-label="Hapus pencarian"><XIco /></button>}
        </label>
        <button className="ka-add" type="button" onClick={() => setForm(null)}><PlusIco />Tambah Aset</button>
      </div>

      {/* ===== Tabel ===== */}
      <div className="ka-card">
        <div className="ka-scroll">
          <table className="ka-table">
            <thead>
              <tr><th>Nama Aset</th><th>Kategori</th><th>Lokasi</th><th>Status</th><th className="r">Aksi</th></tr>
            </thead>
            <tbody>
              {loading ? [0, 1, 2].map(i => (
                <tr className="ka-sk" key={i}><td colSpan={5}><span className="th" /><i className="w40" /><i className="w20" /></td></tr>
              )) : list.map((a, i) => {
                const s = STATUS[a.status] || [a.status, ""];
                return (
                  <tr key={a.id} style={{ "--i": i }}>
                    <td>
                      <div className="ka-who">
                        {a.photo_url ? <img className="ka-thumb" src={fileUrl(a.photo_url)} alt="" /> : <span className="ka-thumb ph"><BoxIco /></span>}
                        <div><b>{a.name}</b><small>{kode(a)}</small></div>
                      </div>
                    </td>
                    <td><span className="ka-chip">{a.category}</span></td>
                    <td><span className="ka-loc"><PinIco />{a.location}</span></td>
                    <td><Pill cls={s[1]}>{s[0]}</Pill></td>
                    <td className="r">
                      <div className="ka-acts">
                        <button className="ka-ib" onClick={() => setDetail(a)} title="Detail" aria-label={`Detail ${a.name}`}><EyeIco /></button>
                        <button className="ka-ib" onClick={() => setForm(a)} title="Edit" aria-label={`Edit ${a.name}`}><PencilIco /></button>
                        <button className="ka-ib dng" onClick={() => remove(a)} title="Hapus" aria-label={`Hapus ${a.name}`}><TrashIco /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && !list.length && (
          <div className="ka-empty">
            <span>{A.length ? <SearchIco /> : <BoxIco />}</span>
            <p>{A.length ? "Tidak ada aset yang cocok." : "Belum ada aset. Klik “Tambah Aset”."}</p>
          </div>
        )}
      </div>

      {detail && <AsetDetailPanel asset={detail} onClose={() => setDetail(null)} onEdit={() => { setForm(detail); setDetail(null); }} />}
      {form !== undefined && <AsetForm asset={form} onClose={() => setForm(undefined)} onSaved={() => { setForm(undefined); reload(); }} />}
    </div>
  );
}