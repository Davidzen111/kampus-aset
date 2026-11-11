import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

UPLOAD_DIR = Path("uploads")
ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB


async def save_image(file: UploadFile, subfolder: str) -> str:
    """Simpan gambar, kembalikan URL relatif, mis. /uploads/assets/abc123.jpg"""
    ext = ALLOWED_TYPES.get(file.content_type)
    if ext is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Format foto harus JPG, PNG, atau WEBP"
        )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Ukuran foto maksimal 5 MB"
        )

    folder = UPLOAD_DIR / subfolder
    folder.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    (folder / filename).write_bytes(content)
    return f"/uploads/{subfolder}/{filename}"


def delete_image(url: str | None) -> None:
    if not url:
        return
    path = Path(url.lstrip("/"))
    try:
        path.resolve().relative_to(UPLOAD_DIR.resolve())  # pastikan masih di dalam uploads/
    except ValueError:
        return
    path.unlink(missing_ok=True)