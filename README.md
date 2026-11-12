# 🏛️ KampusAset

**KampusAset** adalah aplikasi web yang dirancang untuk membantu kampus mengelola dan meminjamkan aset (proyektor, ruangan, laptop, kamera, dan lainnya) secara terstruktur. Mahasiswa/dosen dapat mencari aset, mengajukan peminjaman lengkap dengan foto kondisi awal, lalu mengajukan pengembalian dengan foto bukti kondisi akhir. Admin menyetujui atau menolak pengajuan, memverifikasi pengembalian, memverifikasi akun pendaftar baru, serta memantau dashboard dan laporan peminjaman yang dapat diunduh dalam format Excel dan PDF. Aplikasi ini juga dilengkapi fitur login/registrasi berbasis token JWT, notifikasi, riwayat peminjaman, dan manajemen profil pengguna.

---

## Tampilan Aplikasi

### Autentikasi

| Login                          | Register                             |
| ------------------------------ | ------------------------------------ |
| ![Login](assets/login.png)     | ![Register](assets/register.png)     |

### Admin

| Dashboard                                | Verifikasi Akun                                      | Kelola User                                  |
| ---------------------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| ![Dashboard](assets/dashboardadmin.png)  | ![Verifikasi Akun](assets/verifikasiakunadmin.png)   | ![Kelola User](assets/kelolauseradmin.png)   |

| Kelola Aset                                  | Pengajuan                                  | Pengembalian                                     |
| -------------------------------------------- | ------------------------------------------ | ------------------------------------------------ |
| ![Kelola Aset](assets/kelolaasetadmin.png)   | ![Pengajuan](assets/pengajuanadmin.png)    | ![Pengembalian](assets/pengembalianadmin.png)    |

| Riwayat                                  | Laporan                                  |
| ---------------------------------------- | ---------------------------------------- |
| ![Riwayat](assets/riwayatadmin.png)      | ![Laporan](assets/laporanadmin.png)      |

### User (Mahasiswa / Dosen)

| Beranda                                  | Cari Aset                                  |
| ---------------------------------------- | ------------------------------------------ |
| ![Beranda](assets/berandauser.png)       | ![Cari Aset](assets/cariasetuser.png)      |

| Status & Riwayat                                    | Pengembalian                                       |
| --------------------------------------------------- | -------------------------------------------------- |
| ![Status & Riwayat](assets/statusdanriwayatuser.png)   | ![Pengembalian](assets/pengembalianuser.png)       |

---

## Fitur

| No  | Fitur                          | Deskripsi                                                                                                                              |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Login & Registrasi**         | Autentikasi berbasis JWT (Bearer token). Akun baru berstatus `pending` sampai diverifikasi Admin; sesi dapat disimpan di localStorage   |
| 2   | **Logout Aman**                | Token yang di-logout dicatat ke tabel `revoked_tokens` (berdasarkan `jti`) sehingga tidak bisa dipakai lagi walaupun belum kedaluwarsa |
| 3   | **Verifikasi Akun (Admin)**    | Admin menyetujui atau menolak pendaftar baru; pendaftar mendapat notifikasi hasilnya                                                   |
| 4   | **Kelola User (Admin)**        | Daftar semua akun dengan filter/pencarian, serta mengaktifkan atau menonaktifkan akun yang sudah disetujui                             |
| 5   | **Kelola Aset (Admin)**        | Tambah, ubah, hapus aset dengan foto, kategori, lokasi, deskripsi, dan kondisi; status aset `tersedia` / `dipinjam` / `maintenance`    |
| 6   | **Kelola Kategori Aset**       | Admin dapat menambah dan menghapus kategori; kategori yang masih dipakai aset tidak dapat dihapus                                      |
| 7   | **Cari Aset (User)**           | Mencari aset berdasarkan nama, kategori, dan status, lengkap dengan badge status                                                       |
| 8   | **Pengajuan Peminjaman**       | Pilih tanggal pinjam & kembali, isi keperluan, dan unggah foto kondisi awal; data peminjam diambil otomatis dari profil akun           |
| 9   | **Cek Bentrok Jadwal**         | Sistem menolak pengajuan yang tanggalnya bertabrakan dengan peminjaman `menunggu`/`disetujui` lain pada aset yang sama                 |
| 10  | **Persetujuan Peminjaman**     | Admin menyetujui atau menolak (dengan alasan opsional); status aset otomatis menjadi `dipinjam` saat disetujui                         |
| 11  | **Batalkan Pengajuan**         | User dapat membatalkan pengajuan selama statusnya masih `menunggu`                                                                     |
| 12  | **Pengembalian & Verifikasi**  | User mengunggah foto kondisi akhir; Admin menerima atau menolak (alasan wajib). Bila ditolak, User dapat mengajukan ulang              |
| 13  | **Notifikasi**                 | Lonceng notifikasi dengan jumlah belum dibaca (diperbarui tiap 60 detik), tandai dibaca satuan atau semua                              |
| 14  | **Pengingat Pengembalian**     | Admin dapat mengirim pengingat ke peminjam atau menjalankan pembuatan pengingat massal untuk peminjaman yang jatuh tempo/terlambat     |
| 15  | **Dashboard Admin & User**     | Ringkasan statistik, aset paling sering dipinjam, aktivitas terbaru, dan badge jumlah tugas pada sidebar Admin                         |
| 16  | **Riwayat Peminjaman**         | Admin melihat seluruh riwayat dengan filter status & pencarian; User melihat status dan riwayat miliknya sendiri                       |
| 17  | **Laporan Peminjaman**         | Grafik batang peminjaman per bulan, tingkat pengembalian tepat waktu, dan aset paling diminati                                         |
| 18  | **Ekspor Laporan**             | Unduh laporan peminjaman dalam format Excel (`.xlsx`) atau PDF (`.pdf`) untuk periode tertentu                                         |
| 19  | **Manajemen Profil**           | Edit nama, NIM/NIP, program studi/unit kerja, nomor telepon, dan unggah foto profil                                                    |
| 20  | **Upload Foto ke Cloud**       | Foto aset, kondisi awal/akhir, dan profil (JPG/PNG/WEBP) disimpan di Vercel Blob dengan validasi tipe dan ukuran                       |
| 21  | **Akses Berbasis Peran**       | Halaman dan endpoint dibedakan untuk peran `admin` dan `user`; akun yang dinonaktifkan langsung kehilangan akses                       |
| 22  | **Zona Waktu WITA**            | Perhitungan tanggal hari ini, keterlambatan, dan pengingat memakai zona waktu `Asia/Makassar`                                          |

---

## Spesifikasi Teknis

| Komponen              | Detail                                                                        |
| --------------------- | ----------------------------------------------------------------------------- |
| **Bahasa**            | Python (backend), JavaScript / JSX (frontend)                                 |
| **Jenis Aplikasi**    | Web App (Single Page Application)                                             |
| **Backend**           | FastAPI (`title: KampusAset API`, `root_path: /api`)                          |
| **Frontend**          | React 19 + Vite                                                               |
| **Database**          | PostgreSQL (via SQLAlchemy + psycopg2)                                        |
| **Autentikasi**       | JWT HS256, masa berlaku token 60 menit (dapat diatur lewat `.env`)            |
| **Penyimpanan Sesi**  | localStorage / sessionStorage di browser                                      |
| **Penyimpanan File**  | Vercel Blob (akses publik, batas 4 MB per foto di sisi server)                |
| **Hosting**           | Vercel (layanan `backend` dan `frontend` dalam satu repositori)               |
| **Zona Waktu**        | `Asia/Makassar` (WITA)                                                        |
| **Arsitektur UI**     | Single Page Application + React Router (layout terpisah untuk Admin dan User) |
| **Nama Aplikasi**     | KampusAset                                                                    |

---

## Teknologi yang Digunakan

### Frontend

| Teknologi / Library  | Versi    | Kegunaan                                                   |
| -------------------- | -------- | ---------------------------------------------------------- |
| **React**            | ^19.3.1  | Library UI berbasis komponen                               |
| **React DOM**        | ^19.3.1  | Render React ke browser                                    |
| **React Router DOM** | ^7.18.5  | Routing antar halaman dan proteksi halaman berdasarkan peran |
| **Vite**             | ^8.3.5   | Build tool dan dev server                                  |
| **@vitejs/plugin-react** | ^6.2.1 | Plugin React untuk Vite                                  |
| **Fetch API**        | Built-in | Memanggil REST API backend (`src/api.js`)                  |
| **CSS Kustom**       | -        | Styling per halaman di folder `src/styles/` (tanpa framework CSS) |

### Backend

| Teknologi / Library          | Kegunaan                                                    |
| ---------------------------- | ----------------------------------------------------------- |
| **FastAPI**                  | Framework REST API                                          |
| **Uvicorn** (`[standard]`)   | ASGI server                                                 |
| **SQLAlchemy**               | ORM untuk akses database                                    |
| **psycopg2-binary**          | Driver PostgreSQL                                           |
| **Alembic**                  | Tercantum pada dependensi untuk migrasi database            |
| **python-dotenv**            | Membaca file `.env`                                         |
| **Pydantic** (`[email]`)     | Validasi data request/response dan validasi email           |
| **pydantic-settings**        | Konfigurasi aplikasi dari environment variable              |
| **python-jose** (`[cryptography]`) | Membuat dan memverifikasi token JWT                   |
| **bcrypt**                   | Hashing kata sandi                                          |
| **python-multipart**         | Menerima upload file dan form-data                          |
| **tzdata**                   | Data zona waktu untuk `Asia/Makassar`                       |
| **openpyxl**                 | Membuat laporan Excel (`.xlsx`)                             |
| **reportlab**                | Membuat laporan PDF                                         |
| **vercel-sdk**               | Mengunggah dan menghapus foto di Vercel Blob                |

---

## API yang Digunakan

Semua endpoint berada di bawah prefix `/api` dan (kecuali register & login) memerlukan header `Authorization: Bearer <token>`.

### Autentikasi — `/auth`

| Method | Endpoint          | Akses | Kegunaan                                     |
| ------ | ----------------- | ----- | -------------------------------------------- |
| POST   | `/auth/register`  | Publik | Mendaftar akun baru (status awal `pending`) |
| POST   | `/auth/login`     | Publik | Login dan mendapatkan token JWT             |
| GET    | `/auth/me`        | Login | Data akun yang sedang login                  |
| POST   | `/auth/logout`    | Login | Mencabut token yang sedang dipakai           |

### User — `/users`

| Method | Endpoint                   | Akses | Kegunaan                                              |
| ------ | -------------------------- | ----- | ----------------------------------------------------- |
| PUT    | `/users/me`                | Login | Ubah profil sendiri                                   |
| POST   | `/users/me/photo`          | Login | Unggah foto profil                                    |
| GET    | `/users/admin-contact`     | Login | Kontak Admin yang ditampilkan saat mengajukan pinjam  |
| GET    | `/users`                   | Admin | Daftar user (filter `account_status`, `search`)       |
| GET    | `/users/{user_id}`         | Admin | Detail user                                           |
| PATCH  | `/users/{user_id}/approve` | Admin | Menyetujui pendaftaran                                |
| PATCH  | `/users/{user_id}/reject`  | Admin | Menolak pendaftaran                                   |
| PATCH  | `/users/{user_id}/status`  | Admin | Mengaktifkan / menonaktifkan akun                     |

### Aset & Kategori — `/assets`, `/categories`

| Method | Endpoint                    | Akses | Kegunaan                                                   |
| ------ | --------------------------- | ----- | ---------------------------------------------------------- |
| GET    | `/assets`                   | Login | Daftar aset (filter `search`, `category`, `status_aset`)   |
| GET    | `/assets/categories`        | Login | Daftar nama kategori yang dipakai aset                     |
| GET    | `/assets/{asset_id}`        | Login | Detail aset                                                |
| GET    | `/assets/{asset_id}/schedule` | Login | Jadwal peminjaman aktif sebuah aset                      |
| POST   | `/assets`                   | Admin | Tambah aset (form-data + foto)                             |
| PUT    | `/assets/{asset_id}`        | Admin | Ubah aset                                                  |
| DELETE | `/assets/{asset_id}`        | Admin | Hapus aset (ditolak bila punya riwayat peminjaman)         |
| GET    | `/categories`               | Login | Kategori beserta jumlah aset yang memakainya               |
| POST   | `/categories`               | Admin | Tambah kategori                                            |
| DELETE | `/categories?name=...`      | Admin | Hapus kategori (ditolak bila masih dipakai aset)           |

### Peminjaman — `/loans`

| Method | Endpoint                  | Akses | Kegunaan                                                                 |
| ------ | ------------------------- | ----- | ------------------------------------------------------------------------ |
| POST   | `/loans`                  | User  | Ajukan peminjaman (form-data + foto kondisi awal)                        |
| GET    | `/loans/mine`             | Login | Peminjaman milik sendiri (filter `kelompok`: aktif, riwayat, siap_kembali, pengembalian) |
| GET    | `/loans`                  | Admin | Semua peminjaman (filter status, user, aset, rentang tanggal)            |
| GET    | `/loans/{loan_id}`        | Login | Detail peminjaman (User hanya miliknya)                                  |
| PATCH  | `/loans/{loan_id}/approve` | Admin | Menyetujui pengajuan                                                    |
| PATCH  | `/loans/{loan_id}/reject` | Admin | Menolak pengajuan (alasan opsional)                                      |
| DELETE | `/loans/{loan_id}`        | User  | Membatalkan pengajuan yang masih menunggu                                |
| POST   | `/loans/{loan_id}/return` | User  | Mengajukan pengembalian (form-data + foto kondisi akhir)                 |
| PATCH  | `/loans/{loan_id}/verify` | Admin | Menerima / menolak pengembalian                                          |

### Notifikasi, Dashboard, Laporan

| Method | Endpoint                           | Akses | Kegunaan                                          |
| ------ | ---------------------------------- | ----- | ------------------------------------------------- |
| GET    | `/notifications`                   | Login | Daftar notifikasi (`belum_dibaca`, `limit`)       |
| GET    | `/notifications/unread-count`      | Login | Jumlah notifikasi belum dibaca                    |
| PATCH  | `/notifications/read-all`          | Login | Tandai semua sudah dibaca                         |
| PATCH  | `/notifications/{id}/read`         | Login | Tandai satu notifikasi sudah dibaca               |
| POST   | `/notifications/reminders/run`     | Admin | Membuat pengingat untuk peminjaman jatuh tempo    |
| POST   | `/notifications/remind/{loan_id}`  | Admin | Mengirim pengingat ke satu peminjam               |
| GET    | `/dashboard/user`                  | Login | Ringkasan dashboard User                          |
| GET    | `/dashboard/admin`                 | Admin | Ringkasan dashboard Admin                         |
| GET    | `/reports/loans`                   | Admin | Data laporan peminjaman (`dari`, `sampai`)        |
| GET    | `/reports/loans/export`            | Admin | Unduh laporan (`format=xlsx` atau `pdf`)          |

### Layanan Eksternal

| Layanan         | Kegunaan                                              | Kredensial                       |
| --------------- | ----------------------------------------------------- | -------------------------------- |
| **Vercel Blob** | Menyimpan foto aset, kondisi awal/akhir, dan profil   | `BLOB_READ_WRITE_TOKEN`          |
| **PostgreSQL**  | Database utama (mis. Neon, dengan `sslmode=require`)  | `DATABASE_URL`                   |

> Dokumentasi interaktif API (Swagger UI) tersedia otomatis dari FastAPI pada `/api/docs`.

---

## Cara Penggunaan

### Sebagai User (Mahasiswa / Dosen)

1. **Buka aplikasi** — Anda diarahkan ke halaman login
2. **Registrasi** — Pilih peran Mahasiswa atau Dosen, isi nama, NIM/NIP, email, dan kata sandi (minimal 8 karakter)
3. **Tunggu verifikasi** — Akun berstatus `pending` sampai disetujui Admin, lalu login dengan email dan kata sandi
4. **Lengkapi profil** — Di halaman **Profil**, isi NIM/NIP, program studi, dan nomor telepon (wajib sebelum mengajukan peminjaman)
5. **Cari aset** — Buka **Cari Aset**, cari berdasarkan nama atau kategori, lalu ketuk aset untuk melihat detailnya
6. **Ajukan peminjaman** — Di **Detail Aset**, pilih tanggal pinjam & kembali, isi keperluan, unggah foto kondisi awal, lalu kirim
7. **Pantau status** — Buka **Status & Riwayat** untuk melihat pengajuan aktif dan riwayat peminjaman
8. **Ajukan pengembalian** — Buka **Pengembalian**, pilih aset yang sedang dipinjam, unggah foto kondisi akhir, lalu kirim untuk diverifikasi Admin
9. **Cek notifikasi** — Ikon lonceng menampilkan persetujuan, penolakan, verifikasi, dan pengingat

### Sebagai Admin

1. **Login** — Masuk dengan akun Admin; Anda diarahkan ke **Beranda** (dashboard)
2. **Verifikasi Akun** — Setujui atau tolak pendaftar baru
3. **Kelola Aset & Kategori** — Tambah, ubah, atau hapus aset beserta fotonya
4. **Pengajuan** — Setujui atau tolak pengajuan peminjaman
5. **Pengembalian** — Periksa foto kondisi akhir, lalu terima atau tolak (alasan wajib saat menolak)
6. **Kelola User** — Aktifkan atau nonaktifkan akun pengguna
7. **Riwayat & Laporan** — Lihat riwayat peminjaman dan grafik per bulan, lalu **Unduh Laporan** dalam Excel atau PDF

### Alur Status Peminjaman

```
menunggu ──(Admin setuju)──► disetujui ──(User ajukan kembali)──► menunggu_verifikasi
    │                                                                  │
    └──(Admin tolak / User batalkan)                  diterima ◄───────┴──────► ditolak
                                                    (status: dikembalikan)   (User ajukan ulang)
```

---

## Struktur Project

```
kampus-aset/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── deps.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── asset.py
│   │   │   ├── loan.py
│   │   │   ├── notification.py
│   │   │   └── revoked_token.py
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── assets.py
│   │   │   ├── categories.py
│   │   │   ├── loans.py
│   │   │   ├── notifications.py
│   │   │   ├── dashboard.py
│   │   │   └── reports.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── asset.py
│   │   │   ├── loan.py
│   │   │   └── notification.py
│   │   │
│   │   ├── services/
│   │   │   ├── export.py
│   │   │   ├── loans.py
│   │   │   ├── notify.py
│   │   │   ├── reminders.py
│   │   │   ├── reports.py
│   │   │   └── storage.py
│   │   │
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
│
├── database/
│   └── database_dump_ddl.sql
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthLayout.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── RequireRole.jsx
│   │   │   ├── dialogs.js
│   │   │   └── ui.jsx
│   │   │
│   │   ├── layouts/
│   │   │   ├── AdminLayout.jsx
│   │   │   └── UserLayout.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── KelolaAset.jsx
│   │   │   │   ├── KelolaUser.jsx
│   │   │   │   ├── VerifikasiAkun.jsx
│   │   │   │   ├── Pengajuan.jsx
│   │   │   │   ├── Pengembalian.jsx
│   │   │   │   ├── Riwayat.jsx
│   │   │   │   └── Laporan.jsx
│   │   │   ├── user/
│   │   │   │   ├── Beranda.jsx
│   │   │   │   ├── CariAset.jsx
│   │   │   │   ├── DetailAset.jsx
│   │   │   │   ├── Pengembalian.jsx
│   │   │   │   └── StatusRiwayat.jsx
│   │   │   └── Profil.jsx
│   │   │
│   │   ├── styles/
│   │   │   ├── base.css
│   │   │   ├── auth.css
│   │   │   ├── admin.css
│   │   │   ├── admin-theme.css
│   │   │   ├── user.css
│   │   │   ├── cari-aset.css
│   │   │   ├── kelola-aset.css
│   │   │   ├── pengembalian.css
│   │   │   ├── profil.css
│   │   │   ├── riwayat-admin.css
│   │   │   └── status-riwayat.css
│   │   │
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── config.js
│   │   ├── main.jsx
│   │   └── utils.js
│   │
│   ├── index.html
│   ├── package.json
│   ├── sidebar-spec.html
│   ├── vercel.json
│   └── vite.config.js
│
├── .gitignore
└── vercel.json
```

---

## Cara Install

### Cara 1 — Via Deploy ke Vercel (Mudah)

1. Push repositori ini ke GitHub
2. Buka **Vercel → Add New → Project**, lalu impor repositori tersebut
3. Vercel membaca `vercel.json` di root dan membuat dua layanan: `backend` (FastAPI) dan `frontend` (Vite). Permintaan `/api/*` diarahkan ke backend, sisanya ke frontend
4. Tambahkan **Environment Variables** berikut pada proyek:

   | Variable                      | Keterangan                                                  |
   | ----------------------------- | ----------------------------------------------------------- |
   | `DATABASE_URL`                | URL PostgreSQL, mis. `postgresql://user:password@host/dbname?sslmode=require` |
   | `SECRET_KEY`                  | String acak yang panjang untuk menandatangani JWT           |
   | `ALGORITHM`                   | Opsional, default `HS256`                                   |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | Opsional, default `60`                                      |
   | `BLOB_READ_WRITE_TOKEN`       | Token Vercel Blob (buat Blob store di dashboard Vercel)     |

5. Siapkan database (lihat bagian **Menyiapkan Database** di bawah), lalu klik **Deploy**

---

### Cara 2 — Via Source Code (Build Sendiri)

**Persyaratan:**

- Python 3.13 (versi yang dipakai pada proyek ini) atau yang kompatibel
- Node.js LTS beserta npm
- Database PostgreSQL (lokal atau cloud)
- Akun Vercel dan Vercel CLI (`npm i -g vercel`) untuk menjalankan frontend + backend sekaligus
- Koneksi internet (untuk instalasi dependensi dan Vercel Blob)

**Langkah-langkah:**

**1. Download source code dari GitHub**

- Klik tombol **Code → Download ZIP**, atau jalankan:
  ```bash
  git clone <url-repositori-kampus-aset>
  ```
- Extract file ZIP ke folder komputer kamu

**2. Siapkan backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # lalu isi nilainya
```

Isi file `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
SECRET_KEY=ganti-dengan-string-acak-panjang
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
BLOB_READ_WRITE_TOKEN=isi-token-vercel-blob
```

**3. Siapkan frontend**

```bash
cd frontend
npm install
```

**4. Menyiapkan Database**

Jalankan `database/database_dump_ddl.sql` pada database PostgreSQL kamu. Kode aplikasi juga memakai objek berikut yang **belum ada** di file DDL tersebut, sehingga perlu dibuat tambahan:

```sql
ALTER TABLE users ADD COLUMN photo_url VARCHAR(255);

CREATE TABLE revoked_tokens (
    jti VARCHAR(32) PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_revoked_tokens_expires ON revoked_tokens (expires_at);

CREATE TABLE asset_categories (
    name VARCHAR(100) PRIMARY KEY
);
```

**5. Jalankan aplikasi**

Frontend memanggil API lewat alamat relatif `/api`, sedangkan `vite.config.js` belum memiliki proxy. Karena itu jalankan keduanya lewat Vercel CLI dari folder root proyek:

```bash
vercel dev
```

Buka alamat yang ditampilkan di terminal (umumnya `http://localhost:3000`).

*Alternatif:* jalankan backend dengan `uvicorn main:app --reload --port 8000` di folder `backend`, dan frontend dengan `npm run dev` di folder `frontend` (port 5173), lalu tambahkan proxy `/api` → `http://127.0.0.1:8000` pada `vite.config.js`.

**6. Build produksi frontend**

```bash
cd frontend
npm run build      # hasil di folder frontend/dist
```

**7. Membuat akun Admin pertama**

Halaman registrasi hanya mendaftarkan akun `user`. Akun Admin dibuat lewat endpoint register dengan `role: "admin"` (langsung berstatus `approved`):

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin Kampus","email":"admin@kampus.ac.id","password":"minimal8karakter","role":"admin"}'
```

> Endpoint ini tidak membatasi pembuatan akun Admin. Untuk lingkungan produksi, sebaiknya batasi (misalnya nonaktifkan `role: "admin"` setelah Admin pertama dibuat).

---

## Developer

| Info      | Detail                                              |
| --------- | --------------------------------------------------- |
| **Nama**  | _KELOMPOK 3 PROYEK PERANGKAT LUNAK B_               |
| **Tema**  | Manajemen & Peminjaman Aset Kampus                  |
| **Stack** | FastAPI, React, PostgreSQL, Vercel Blob             |
| **Tahun** | 2026                                                |

---
