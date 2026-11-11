import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { relTime } from "../utils";
import { toast } from "./dialogs";
import { Icon } from "./ui";


const KIND = {
  pengajuan: {
    icon: "inbox", cls: "orange",
    admin: { title: "Permohonan Pinjam Baru", tag: "Perlu Review", go: "/admin/pengajuan", btn: "Tinjau" },
    user: { title: "Pengajuan Terkirim", tag: "Menunggu", go: "/user/status-riwayat", btn: "Lihat Detail" },
  },
  persetujuan: {
    icon: "check", cls: "green",
    admin: { title: "Pengajuan Disetujui", tag: "Disetujui", go: "/admin/riwayat", btn: "Lihat Riwayat" },
    user: { title: "Peminjaman Disetujui", tag: "Disetujui", go: "/user/status-riwayat", btn: "Lihat Detail" },
  },
  penolakan: {
    icon: "x", cls: "red",
    admin: { title: "Pengajuan Ditolak", tag: "Ditolak", go: "/admin/riwayat", btn: "Lihat Riwayat" },
    user: { title: "Peminjaman Ditolak", tag: "Ditolak", go: "/user/status-riwayat", btn: "Lihat Detail" },
  },
  pengingat: {
    icon: "clock", cls: "amber",
    admin: { title: "Peringatan Keterlambatan", tag: "Terlambat", go: "/admin/riwayat", btn: "Lihat Riwayat", late: true },
    user: { title: "Batas Pengembalian Mendekati", tag: "Penting", go: "/user/pengembalian", btn: "Ajukan Pengembalian" },
  },
  verifikasi: {
    icon: "image", cls: "blue",
    admin: { title: "Bukti Pengembalian Baru", tag: "Butuh Review", go: "/admin/pengembalian", btn: "Tinjau" },
    user: { title: "Pengembalian Diperiksa", tag: "Selesai", go: "/user/pengembalian", btn: "Lihat Detail" },
  },
};
const FALLBACK = { icon: "bell", cls: "blue", title: "Notifikasi" };


const AKUN = {
  persetujuan: {
    icon: "shield", cls: "green",
    admin: { title: "Akun Disetujui", tag: "Disetujui", go: "/admin/profil", btn: "Lihat Profil" },
    user: { title: "Akun Disetujui", tag: "Disetujui", go: "/user/profil", btn: "Lihat Profil" },
  },
  penolakan: {
    icon: "x", cls: "red",
    admin: { title: "Pendaftaran Ditolak", tag: "Ditolak" },
    user: { title: "Pendaftaran Ditolak", tag: "Ditolak" },
  },
  verifikasi: {
    icon: "shield", cls: "blue",
    admin: { title: "Status Akun Diperbarui", tag: "Akun", go: "/admin/profil", btn: "Lihat Profil" },
    user: { title: "Status Akun Diperbarui", tag: "Akun", go: "/user/profil", btn: "Lihat Profil" },
  },
};


export default function NotificationBell({ role = "admin" }) {
  const admin = role === "admin";
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const [list, cnt] = await Promise.all([api("/notifications?limit=30"), api("/notifications/unread-count")]);
      setItems(Array.isArray(list) ? list : []);
      setUnread(Number(cnt.jumlah) || 0);
    } catch { setItems(s => s ?? []); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);
  useEffect(() => {
    if (!open) return;
    load();
    const esc = e => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, load]);

  const markRead = async n => { if (!n.is_read) { try { await api(`/notifications/${n.id}/read`, { method: "PATCH" }); } catch { /* abaikan */ } } };
  const readAll = async () => { try { await api("/notifications/read-all", { method: "PATCH" }); } catch { /* abaikan */ } load(); };
  const go = async (n, to) => { await markRead(n); setOpen(false); nav(to); load(); };
  const approve = async n => {
    try { await api(`/loans/${n.loan_id}/approve`, { method: "PATCH" }); toast("Pengajuan disetujui"); await markRead(n); } catch (e) { toast(e.message, true); }
    load();
  };

  const count = types => (items || []).filter(n => !n.is_read && types.includes(n.type)).length;

  return (
    <>
      <button className="bell" type="button" aria-label="Notifikasi" aria-expanded={open} onClick={() => setOpen(true)}>
        <Icon n="bell" />
        {unread > 0 && <span className="nb">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <>
          <div className="nback" onClick={() => setOpen(false)} />
          <aside className="ndrawer" role="dialog" aria-label="Notifikasi">
            <header className="nd-head">
              <span className="nd-ic"><Icon n="bell" /></span>
              <div className="nd-tt">
                <h3>{admin ? "Pusat Notifikasi Admin" : "Notifikasi"}{!admin && unread > 0 && <em>{unread} Baru</em>}</h3>
                <p>{admin ? "Pemberitahuan verifikasi pengajuan & pengembalian" : `${unread} notifikasi belum dibaca`}</p>
              </div>
              <button className="nd-x" type="button" aria-label="Tutup" onClick={() => setOpen(false)}><Icon n="x" /></button>
            </header>

            <div className="nd-bar">
              <button type="button" disabled={!unread} onClick={readAll}><Icon n="check" />{admin ? "Tandai Selesai" : "Tandai Semua Dibaca"}</button>
            </div>

            {admin && (
              <div className="nd-sum">
                <div className="blue"><Icon n="inbox" /><div><b>{count(["pengajuan", "verifikasi"])}</b><span>Menunggu Verifikasi</span></div></div>
                <div className="red"><Icon n="clock" /><div><b>{count(["pengingat"])}</b><span>Terlambat Kembali</span></div></div>
              </div>
            )}

            <div className="nd-list">
              {items === null ? <p className="empty">Memuat…</p>
                : !items.length ? <p className="empty">Belum ada notifikasi.</p>
                : items.map(n => {
                    const base = (!n.loan_id && AKUN[n.type]) || KIND[n.type] || FALLBACK;
                    const k = { icon: base.icon, cls: base.cls, ...(base[role] || { title: base.title }) };
                    return (
                      <div key={n.id} className={`nd-item ${k.cls}${n.is_read ? "" : " unread"}${k.late ? " late" : ""}`} onClick={() => markRead(n).then(load)}>
                        <span className={`ic2 nd-ico ${k.cls}`}><Icon n={k.icon} /></span>
                        <div className="nd-body">
                          <div className="nd-row"><b>{k.title}</b>{k.tag && <span className="nd-tag">{k.tag}</span>}</div>
                          <time>{relTime(n.created_at)}</time>
                          <p>{n.message}</p>
                          {(k.go || (admin && n.type === "pengajuan" && n.loan_id)) && (
                            <div className="nd-acts">
                              {k.go && <button type="button" className="a1" onClick={e => { e.stopPropagation(); go(n, k.go); }}>{k.btn}</button>}
                              {admin && n.type === "pengajuan" && n.loan_id && <button type="button" className="a2" onClick={e => { e.stopPropagation(); approve(n); }}>Setujui Langsung</button>}
                            </div>
                          )}
                        </div>
                        {!n.is_read && <span className="u" />}
                      </div>
                    );
                  })}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
