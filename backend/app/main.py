import asyncio
import os

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models import RevokedToken
from app.routers import auth, users, assets, loans, notifications, dashboard, reports, categories
from app.services.reminders import generate_reminders


def _run_reminders() -> None:
    db = SessionLocal()
    try:
        jumlah = generate_reminders(db)
        if jumlah:
            print(f"[pengingat] {jumlah} notifikasi dibuat")

        # Token yang sudah kedaluwarsa tidak perlu lagi ada di blacklist
        sekarang = datetime.now(timezone.utc).replace(tzinfo=None)
        dihapus = db.query(RevokedToken).filter(RevokedToken.expires_at < sekarang).delete()
        db.commit()
        if dihapus:
            print(f"[token] {dihapus} token kedaluwarsa dibersihkan")
    finally:
        db.close()


async def reminder_loop():
    while True:
        try:
            await asyncio.to_thread(_run_reminders)
        except Exception as e:  # jangan sampai loop berhenti karena satu error
            print("[pengingat] gagal:", e)
        await asyncio.sleep(3600)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(reminder_loop())
    yield
    task.cancel()


app = FastAPI(title="KampusAset API", lifespan=lifespan)

# ===== CORS: izinkan frontend (Live Server) memanggil API =====
# Sesuaikan port dengan yang tampil di bilah alamat browser Anda.
ALLOWED_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    "http://127.0.0.1:5502",
    "http://localhost:5502",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(assets.router)
app.include_router(loans.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(categories.router)

os.makedirs("uploads", exist_ok=True)  # cegah error jika folder uploads belum ada
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")