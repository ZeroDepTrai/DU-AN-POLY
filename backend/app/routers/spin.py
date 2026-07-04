"""Spin / wheel endpoints (public for authenticated users; admin for config)."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_optional_user, require_admin
from app.models import Coupon, Product, Spin, User, WheelConfig
from app.schemas import (
    SpinHistoryItem,
    WheelConfigResponse,
    WheelConfigUpdate,
    WheelPrize,
)
from app.services.spin import (
    DEFAULT_PRIZES_JSON,
    get_or_create_wheel,
    parse_prizes,
    perform_spin,
    user_credit_balance,
    user_lifetime_spend_vnd,
)

router = APIRouter(prefix="/api", tags=["spin"])


def _decorate_prizes(prizes: list[dict], db: Session) -> list[WheelPrize]:
    """Inject product_name + product_image_url into the prize response."""
    out: list[WheelPrize] = []
    for p in prizes:
        pid = p.get("product_id")
        if pid and not p.get("product_name"):
            prod = db.get(Product, pid)
            if prod is not None:
                p["product_name"] = prod.name
                p["product_image_url"] = prod.image_url
        out.append(WheelPrize(**p))
    return out


@router.get("/spin/config", response_model=WheelConfigResponse)
def get_wheel_config(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    cfg = get_or_create_wheel(db)
    prizes = parse_prizes(cfg) or parse_prizes(DEFAULT_PRIZES_JSON)
    # Guests see the wheel but with 0 credits / 0 lifetime spend.
    user_credits = user_credit_balance(db, current_user.id) if current_user else 0
    lifetime_spend = (
        user_lifetime_spend_vnd(db, current_user.id) if current_user else 0
    )
    return WheelConfigResponse(
        id=cfg.id,
        title=cfg.title,
        background_url=cfg.background_url,
        prizes=_decorate_prizes(prizes, db),
        spend_per_spin_vnd=cfg.spend_per_spin_vnd,
        user_credits=user_credits,
        lifetime_spend_vnd=lifetime_spend,
    )


@router.post("/spin/play")
def play_spin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    balance = user_credit_balance(db, current_user.id)
    if balance <= 0:
        raise HTTPException(
            status_code=400,
            detail="Bạn chưa có lượt quay. Hãy mua thêm đơn hàng ≥3.000.000 VND để nhận lượt.",
        )

    prize, spin = perform_spin(db, current_user.id)

    # Lookup product/coupon for the response payload.
    product = None
    if spin.product_id:
        product = db.get(Product, spin.product_id)
        if product:
            prize["product_name"] = product.name
            prize["product_image_url"] = product.image_url

    coupon_code = spin.coupon_code
    discount_value: float | None = None
    if coupon_code is None and spin.coupon_id is not None:
        coupon = db.get(Coupon, spin.coupon_id)
        if coupon is not None:
            coupon_code = coupon.code
            discount_value = float(coupon.discount_value)

    return {
        "prize": prize,
        "spin_id": spin.id,
        "remaining_credits": user_credit_balance(db, current_user.id),
        "coupon_code": coupon_code,
        "discount_value": discount_value,
    }


@router.get("/spin/history", response_model=list[SpinHistoryItem])
def spin_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Spin)
        .filter(Spin.user_id == current_user.id)
        .order_by(Spin.id.desc())
        .all()
    )
    result: list[SpinHistoryItem] = []
    for s in rows:
        code = s.coupon_code
        discount_value: float | None = None
        if code is None and s.coupon_id is not None:
            coupon = db.get(Coupon, s.coupon_id)
            if coupon is not None:
                code = coupon.code
                discount_value = float(coupon.discount_value)

        product_name: str | None = None
        product_image_url: str | None = None
        if s.product_id is not None:
            product = db.get(Product, s.product_id)
            if product is not None:
                product_name = product.name
                product_image_url = product.image_url

        result.append(
            SpinHistoryItem(
                id=s.id,
                prize_label=s.prize_label,
                prize_kind=s.prize_kind,
                coupon_code=code,
                product_id=s.product_id,
                product_name=product_name,
                product_image_url=product_image_url,
                reward_type=s.prize_kind,
                discount_value=discount_value,
                created_at=s.created_at.isoformat() if s.created_at else "",
            )
        )
    return result


# ── Admin ──────────────────────────────────────────────────────────────


@router.get("/admin/wheel", response_model=WheelConfigResponse)
def admin_get_wheel(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    cfg = get_or_create_wheel(db)
    prizes = parse_prizes(cfg) or parse_prizes(DEFAULT_PRIZES_JSON)
    return WheelConfigResponse(
        id=cfg.id,
        title=cfg.title,
        background_url=cfg.background_url,
        prizes=_decorate_prizes(prizes, db),
        spend_per_spin_vnd=cfg.spend_per_spin_vnd,
        user_credits=0,
        lifetime_spend_vnd=0,
    )


@router.put("/admin/wheel", response_model=WheelConfigResponse)
def admin_update_wheel(
    payload: WheelConfigUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    import json

    cfg = get_or_create_wheel(db)

    if payload.title is not None:
        cfg.title = payload.title
    if payload.background_url is not None:
        cfg.background_url = payload.background_url
    if payload.spend_per_spin_vnd is not None:
        if payload.spend_per_spin_vnd < 0:
            raise HTTPException(status_code=400, detail="spend_per_spin_vnd phải ≥ 0")
        cfg.spend_per_spin_vnd = payload.spend_per_spin_vnd
    if payload.prizes is not None:
        cfg.prizes_json = json.dumps(
            [p.model_dump(exclude_none=True) for p in payload.prizes], ensure_ascii=False
        )
    cfg.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(cfg)
    prizes = parse_prizes(cfg) or parse_prizes(DEFAULT_PRIZES_JSON)
    return WheelConfigResponse(
        id=cfg.id,
        title=cfg.title,
        background_url=cfg.background_url,
        prizes=_decorate_prizes(prizes, db),
        spend_per_spin_vnd=cfg.spend_per_spin_vnd,
        user_credits=0,
        lifetime_spend_vnd=0,
    )


def parse_prizes(raw) -> list[dict]:
    """Module-level helper (kept for back-compat with old imports)."""
    import json

    if isinstance(raw, str):
        try:
            data = json.loads(raw or "[]")
        except Exception:
            data = []
    elif isinstance(raw, list):
        data = raw
    else:
        data = []
    return data if isinstance(data, list) else []
