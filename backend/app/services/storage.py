import uuid

from fastapi import HTTPException, UploadFile, status
from vercel.blob import AsyncBlobClient, BlobClient

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
# Batas body request di Vercel sekitar 4,5 MB, jadi 4 MB agar aman
MAX_SIZE = 4 * 1024 * 1024

BLOB_HOST = "blob.vercel-storage.com"


def _url_dari(hasil) -> str:
    # Tahan terhadap perbedaan bentuk hasil (objek atau dict)
    url = getattr(hasil, "url", None)
    if url is None and isinstance(hasil, dict):
        url = hasil.get("url")
    if not url:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Gagal menyimpan foto")
    return url


async def save_image(file: UploadFile, subfolder: str) -> str:
    """Kirim gambar ke Vercel Blob, kembalikan URL publik lengkap."""
    ext = ALLOWED_TYPES.get(file.content_type)
    if ext is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Format foto harus JPG, PNG, atau WEBP"
        )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Ukuran foto maksimal 4 MB"
        )

    pathname = f"{subfolder}/{uuid.uuid4().hex}{ext}"
    try:
        client = AsyncBlobClient()  # membaca BLOB_READ_WRITE_TOKEN otomatis
        hasil = await client.put(
            pathname, content, access="public", content_type=file.content_type
        )
    except HTTPException:
        raise
    except Exception as e:
        print("[storage] upload gagal:", e)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Gagal menyimpan foto")
    return _url_dari(hasil)


def delete_image(url: str | None) -> None:
    # Hanya hapus URL Blob. Path lama "/uploads/..." diabaikan.
    if not url or BLOB_HOST not in url:
        return
    try:
        BlobClient().delete([url])
    except Exception as e:
        print("[storage] hapus gagal:", e)