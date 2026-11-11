from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/categories", tags=["Categories"])


class CategoryIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)


@router.get("")
def list_categories(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Semua kategori beserta jumlah aset yang memakainya."""
    rows = db.execute(text("""
        SELECT n.name, COUNT(a.id) AS used
        FROM (
            SELECT name FROM asset_categories
            UNION
            SELECT DISTINCT category FROM assets WHERE category IS NOT NULL
        ) n
        LEFT JOIN assets a ON a.category = n.name
        GROUP BY n.name
        ORDER BY n.name
    """)).all()
    return [{"name": r.name, "used": r.used} for r in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def add_category(data: CategoryIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    name = data.name.strip()
    db.execute(text("INSERT INTO asset_categories (name) VALUES (:n) ON CONFLICT (name) DO NOTHING"), {"n": name})
    db.commit()
    return {"name": name}


@router.delete("")
def delete_category(name: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    used = db.execute(text("SELECT COUNT(*) FROM assets WHERE category = :n"), {"n": name}).scalar()
    if used:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Kategori “{name}” masih dipakai {used} aset. Ubah kategori aset tersebut terlebih dahulu.",
        )
    db.execute(text("DELETE FROM asset_categories WHERE name = :n"), {"n": name})
    db.commit()
    return {"message": "Kategori dihapus"}