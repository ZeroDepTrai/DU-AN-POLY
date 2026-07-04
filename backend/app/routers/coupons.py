"""Coupon admin endpoints + public validation endpoint."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_admin
from app.models import Coupon, Order, User
from app.schemas import (
    CouponCreate,
    CouponResponse,
    CouponUpdate,
    CouponValidateRequest,
    CouponValidateResponse,
)
from app.services.coupons import compute_discount

router = APIRouter(prefix="/api", tags=["coupons"])


# ── Public: validate a coupon for the current order total ──────────────

@router.post("/coupons/validate", response_model=CouponValidateResponse)
def validate_coupon(
    payload: CouponValidateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    coupon = (
        db.query(Coupon)
        .filter(Coupon.code == payload.code.strip().upper(), Coupon.active == True)  # noqa: E712
        .first()
    )
    if coupon is None:
        raise HTTPException(status_code=404, detail="Mã giảm giá không hợp lệ")

    subtotal = float(payload.order_total or 0)
    if subtotal < coupon.min_order_total:
        raise HTTPException(
            status_code=400,
            detail=f"Đơn hàng tối thiểu {int(coupon.min_order_total):,} VND để dùng mã này",
        )
    if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
        raise HTTPException(status_code=400, detail="Mã đã hết lượt sử dụng")

    discount = compute_discount(coupon, subtotal)
    new_total = max(0.0, subtotal - discount)

    return CouponValidateResponse(
        coupon=_to_response(coupon),
        discount=discount,
        new_total=new_total,
    )


# ── Admin: coupon CRUD ────────────────────────────────────────────────

@router.get("/admin/coupons", response_model=list[CouponResponse])
def list_coupons(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = db.query(Coupon).order_by(Coupon.id.desc()).all()
    return [_to_response(c) for c in rows]


@router.post("/admin/coupons", response_model=CouponResponse)
def create_coupon(
    payload: CouponCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    code = payload.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Mã giảm giá không được trống")
    existing = db.query(Coupon).filter(Coupon.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mã giảm giá đã tồn tại")

    if payload.discount_type == "percent" and (payload.discount_value <= 0 or payload.discount_value > 100):
        raise HTTPException(status_code=400, detail="Phần trăm phải trong khoảng 1..100")

    coupon = Coupon(
        code=code,
        description=payload.description or "",
        discount_type=payload.discount_type,
        discount_value=float(payload.discount_value),
        min_order_total=float(payload.min_order_total),
        max_discount=payload.max_discount,
        usage_limit=payload.usage_limit,
        usage_count=0,
        starts_at=payload.starts_at or "",
        expires_at=payload.expires_at or "",
        active=True,
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return _to_response(coupon)


@router.put("/admin/coupons/{coupon_id}", response_model=CouponResponse)
def update_coupon(
    coupon_id: int,
    payload: CouponUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    coupon = db.get(Coupon, coupon_id)
    if coupon is None:
        raise HTTPException(status_code=404, detail="Coupon không tồn tại")

    for field in (
        "description",
        "discount_type",
        "min_order_total",
        "max_discount",
        "usage_limit",
        "starts_at",
        "expires_at",
        "active",
    ):
        val = getattr(payload, field)
        if val is not None:
            setattr(coupon, field, val)
    if payload.discount_value is not None:
        coupon.discount_value = float(payload.discount_value)

    db.commit()
    db.refresh(coupon)
    return _to_response(coupon)


@router.delete("/admin/coupons/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    coupon = db.get(Coupon, coupon_id)
    if coupon is None:
        raise HTTPException(status_code=404, detail="Coupon không tồn tại")

    # Detach history first to avoid FK errors.
    db.query(Order).filter(Order.coupon_id == coupon.id).update({Order.coupon_id: None})
    db.delete(coupon)
    db.commit()
    return {"ok": True}


def _to_response(c: Coupon) -> CouponResponse:
    return CouponResponse(
        id=c.id,
        code=c.code,
        description=c.description,
        discount_type=c.discount_type,
        discount_value=c.discount_value,
        min_order_total=c.min_order_total,
        max_discount=c.max_discount,
        usage_limit=c.usage_limit,
        usage_count=c.usage_count,
        starts_at=c.starts_at,
        expires_at=c.expires_at,
        active=c.active,
    )
