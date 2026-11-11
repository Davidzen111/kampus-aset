CREATE TABLE users (
id SERIAL PRIMARY KEY,
name VARCHAR(150) NOT NULL,
email VARCHAR(150) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL,
nim_nip VARCHAR(50),-- NIM (mahasiswa) / NIP (dosen)
program_studi VARCHAR(150),-- Program Studi / Unit Kerja
phone VARCHAR(20),
is_admin BOOLEAN NOT NULL DEFAULT FALSE,
account_status VARCHAR(20) NOT NULL DEFAULT 'pending',
created_at TIMESTAMP NOT NULL DEFAULT NOW(),
CONSTRAINT chk_users_account_status
CHECK (account_status IN ('pending', 'approved', 'rejected', 'inactive'))
);


CREATE TABLE assets (
id SERIAL PRIMARY KEY,
name VARCHAR(150) NOT NULL,
category VARCHAR(100) NOT NULL,
location VARCHAR(150) NOT NULL,
description TEXT,
photo_url VARCHAR(255),
kondisi_aset TEXT NOT NULL,
status VARCHAR(20) NOT NULL DEFAULT 'tersedia',
created_at TIMESTAMP NOT NULL DEFAULT NOW(),
CONSTRAINT chk_assets_status
CHECK (status IN ('tersedia', 'dipinjam', 'maintenance'))
);


CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    tanggal_pinjam DATE NOT NULL,
    tanggal_kembali_rencana DATE NOT NULL,
    keperluan TEXT NOT NULL,
    foto_kondisi_awal VARCHAR(255) NOT NULL,
    catatan_awal TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'menunggu',
    approved_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    approved_at TIMESTAMP,
    tanggal_kembali_aktual DATE,
    foto_kondisi_akhir VARCHAR(255),
    catatan_akhir TEXT,
    status_pengembalian VARCHAR(30),
    verified_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_loans_status
        CHECK (status IN ('menunggu', 'disetujui', 'ditolak', 'dikembalikan')),
    CONSTRAINT chk_loans_status_pengembalian
        CHECK (status_pengembalian IN ('menunggu_verifikasi', 'diterima', 'ditolak')),
    CONSTRAINT chk_tanggal_valid
        CHECK (tanggal_kembali_rencana >= tanggal_pinjam)
);

CREATE INDEX idx_loans_asset_jadwal
ON loans (asset_id, tanggal_pinjam, tanggal_kembali_rencana);


CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    loan_id INTEGER REFERENCES loans(id) ON DELETE RESTRICT,
    type VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_notifications_type
        CHECK (type IN ('pengajuan', 'persetujuan', 'penolakan', 'pengingat', 'verifikasi'))
);