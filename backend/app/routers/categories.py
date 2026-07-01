from fastapi import APIRouter
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product
from app.schemas import CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=CategoryResponse)
def get_categories(db: Session = get_db):
    rows = db.query(Product.tag, func.count(Product.id)).group_by(Product.tag).all()
    phone_tags = [r.tag for r in rows if any(t in r.tag.lower() for t in ["iphone", "samsung", "xiaomi", "oppo", "android", "flagship"])]
    accessory_tags = [r.tag for r in rows if not any(t in r.tag.lower() for t in ["iphone", "samsung", "xiaomi", "oppo", "android", "flagship"])]
    return CategoryResponse(phone=phone_tags, accessory=accessory_tags)
