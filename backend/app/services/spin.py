"""Spin / wheel / user lottery helpers.

Behavior rules (from spec):
* Every `spend_per_spin_vnd` VND of *delivered* order history = 1 spin credit.
  Granted cumulatively (1 spin per N VND, accumulating across all delivered
  orders). Multiple credits may be granted at once when an order is delivered.
* Spinning consumes exactly one credit. The server picks a weighted prize from
  the active `WheelConfig` and writes an audit row to `spins`.

Prize resolution rules:
* If the prize picks ``product_id`` -> free product reward:
  - Create an Order + OrderItem for the winning user, unit_price=0,
    status=delivered, payment_method="spin_reward".
  - Set the Spin row's product_id and order_id.
* If the prize has ``coupon_discount_type``/``coupon_discount_value`` ->
  one-off coupon reward:
  - Mint a *new* Coupon row with a unique 8-char code, usage_limit=1,
    and apply it to the user. Persist the code on the Spin row so the user
    keeps it forever.
* If the prize picks an existing ``coupon_id`` -> just attach the coupon
  to the Spin (legacy behaviour).
* Otherwise the spin is "consolation" (no extra artefact).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy.orm import Session

from app.models import (
    Coupon,
    Order,
    OrderItem,
    OrderStatus,
    Product,
    Spin,
    SpinCredit,
    WheelConfig,
)


DEFAULT_PRIZES_JSON = (
    "["
    '{"name":"Mã giảm giá 2%","image":"/uploads/case.png","weight":35,"jackpot":false,"coupon_id":null,"coupon_discount_type":"percent","coupon_discount_value":2,"product_id":null,"icon":"🎟️"},'
    '{"name":"Cường Lực miễn phí","image":"/uploads/screen.png","weight":25,"jackpot":false,"coupon_id":null,"coupon_discount_type":"percent","coupon_discount_value":10,"product_id":null,"icon":"🛡️"},'
    '{"name":"Ốp Iphone miễn phí","image":"/uploads/cable.png","weight":20,"jackpot":false,"coupon_id":null,"coupon_discount_type":"percent","coupon_discount_value":5,"product_id":null,"icon":"📱"},'
    '{"name":"Dây sạc miễn phí","image":"/uploads/charger.png","weight":14,"jackpot":false,"coupon_id":null,"coupon_discount_type":"percent","coupon_discount_value":5,"product_id":null,"icon":"🔌"},'
    '{"name":"Mã giảm giá 5%","image":"/uploads/airpod.png","weight":5,"jackpot":false,"coupon_id":null,"coupon_discount_type":"percent","coupon_discount_value":5,"product_id":null,"icon":"🎁"},'
    '{"name":"Chúc bạn may mắn lần sau","image":"/uploads/smartwatch.png","weight":1,"jackpot":false,"coupon_id":null,"coupon_discount_type":null,"coupon_discount_value":null,"product_id":null,"icon":"🍀"},'
    '{"name":"Apple Watch","image":"/uploads/watch.png","weight":0.4,"jackpot":true,"coupon_id":null,"coupon_discount_type":null,"coupon_discount_value":null,"product_id":null,"icon":"⌚"},'
    '{"name":"IPhone 17 Pro Max","image":"/uploads/iphone.png","weight":0.1,"jackpot":true,"coupon_id":null,"coupon_discount_type":null,"coupon_discount_value":null,"product_id":null,"icon":"📱"}'
    "]"
)


# ── configuration / parsing ────────────────────────────────────────────────


def get_or_create_wheel(db: Session) -> WheelConfig:
    cfg = db.get(WheelConfig, 1) or db.query(WheelConfig).first()
    if cfg is None:
        cfg = WheelConfig(
            id=1,
            title="CellZone · Spin & Win",
            background_url="",
            prizes_json=DEFAULT_PRIZES_JSON,
            spend_per_spin_vnd=3_000_000,
        )
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


def parse_prizes(cfg: WheelConfig | None) -> list[dict]:
    import json

    raw = getattr(cfg, "prizes_json", None) if cfg is not None else None
    try:
        data = json.loads(raw or "[]")
    except Exception:
        data = []
    return data if isinstance(data, list) else []


def _classify_prize(prize: dict) -> str:
    """Return one of: free_product | coupon | jackpot | consolation."""
    if prize.get("jackpot") and (prize.get("product_id") or prize.get("name")):
        # Admin may mark a product prize as jackpot (jackpot + product_id wins free product)
        if prize.get("product_id"):
            return "free_product"
        return "jackpot"
    if prize.get("product_id"):
        return "free_product"
    if prize.get("coupon_id") or prize.get("coupon_discount_value") or prize.get("coupon_discount_type"):
        return "coupon"
    if prize.get("jackpot"):
        return "jackpot"
    return "consolation"


# ── credit / spend math ────────────────────────────────────────────────────


def user_credit_balance(db: Session, user_id: int) -> int:
    rows = db.query(SpinCredit).filter(SpinCredit.user_id == user_id).all()
    earned = sum(c.amount for c in rows)
    consumed = db.query(Spin).filter(Spin.user_id == user_id).count()
    return max(0, earned - consumed)


def user_lifetime_spend_vnd(db: Session, user_id: int) -> int:
    delivered = (
        db.query(Order)
        .filter(Order.user_id == user_id, Order.status == OrderStatus.delivered)
        .all()
    )
    total = 0.0
    for o in delivered:
        total += sum(i.unit_price * i.quantity for i in o.items)
    return int(total)


def grant_credits_for_delivered_order(db: Session, order: Order) -> int:
    cfg = get_or_create_wheel(db)
    threshold = cfg.spend_per_spin_vnd or 3_000_000

    delivered = (
        db.query(Order)
        .filter(Order.user_id == order.user_id, Order.status == OrderStatus.delivered)
        .all()
    )
    ids = {o.id for o in delivered}
    if order.id not in ids:
        delivered.append(order)

    lifetime_spend = 0.0
    for o in delivered:
        lifetime_spend += sum(i.unit_price * i.quantity for i in o.items)

    new_total_credits = int(lifetime_spend // threshold)

    granted_rows = (
        db.query(SpinCredit)
        .filter(SpinCredit.user_id == order.user_id, SpinCredit.reason == "delivered_order")
        .all()
    )
    already_granted = sum(c.amount for c in granted_rows)

    diff = new_total_credits - already_granted
    if diff > 0:
        db.add(
            SpinCredit(
                user_id=order.user_id,
                order_id=order.id,
                amount=diff,
                reason="delivered_order",
            )
        )
    return diff


# ── weighted draw ──────────────────────────────────────────────────────────


def pick_prize_index(prizes: list[dict]) -> int:
    import random

    if not prizes:
        return -1
    total = sum(float(p.get("weight", 0)) for p in prizes)
    if total <= 0:
        return 0
    r = random.uniform(0, total)
    acc = 0.0
    for i, p in enumerate(prizes):
        acc += float(p.get("weight", 0))
        if r <= acc:
            return i
    return len(prizes) - 1


# ── helpers for reward fulfilment ──────────────────────────────────────────


def _gen_unique_code(db: Session, prefix: str = "SP") -> str:
    """Generate a unique 8-char coupon code prefixed with `prefix`."""
    import secrets

    for _ in range(20):
        candidate = f"{prefix}{secrets.token_hex(3).upper()}"
        exists = db.query(Coupon).filter(Coupon.code == candidate).first()
        if not exists:
            return candidate
    # last resort
    return f"{prefix}{secrets.token_hex(4).upper()}"


def _fulfil_product_reward(db: Session, user_id: int, product: Product) -> OrderItem:
    """Create a zero-cost Order for the winning user, mark it delivered."""
    now = datetime.now(timezone.utc)
    tracking_code = "SPIN-" + now.strftime("%H%M%S") + "-" + str(user_id)[-3:]

    order = Order(
        user_id=user_id,
        status=OrderStatus.delivered,
        delivery_address="Trúng thưởng vòng quay — vui lòng liên hệ admin để nhận sản phẩm",
        delivery_phone="0000000000",
        delivery_lat=0.0,
        delivery_lng=0.0,
        current_lat=0.0,
        current_lng=0.0,
        tracking_code=tracking_code,
    )
    db.add(order)
    db.flush()  # populate order.id

    item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        quantity=1,
        unit_price=0.0,
    )
    db.add(item)
    return item


def _fulfil_coupon_reward(
    db: Session, user_id: int, prize: dict, fallback_id: int | None
) -> tuple[Coupon | None, str | None]:
    """Create a one-off Coupon row for this user.

    If the prize specifies ``coupon_discount_type``/``coupon_discount_value`` we
    mint a brand new coupon with a unique code (preferred for spin rewards).
    Otherwise we just attach the existing ``coupon_id`` (legacy).

    Returns (coupon_row, code_str).
    """
    dt = prize.get("coupon_discount_type")
    dv = prize.get("coupon_discount_value")
    if dt and dv is not None:
        code = _gen_unique_code(db)
        coupon = Coupon(
            code=code,
            description=f"Trúng từ vòng quay: {prize.get('name','')}",
            discount_type=str(dt),
            discount_value=float(dv),
            min_order_total=0.0,
            max_discount=None,
            usage_limit=1,
            usage_count=0,
            starts_at=datetime.now(timezone.utc).isoformat(),
            expires_at="",
            active=True,
        )
        db.add(coupon)
        db.flush()
        return coupon, code
    if fallback_id:
        coupon = db.get(Coupon, fallback_id)
        if coupon is not None:
            return coupon, coupon.code
    return None, None


# ── main entry point ───────────────────────────────────────────────────────


def perform_spin(db: Session, user_id: int) -> tuple[dict, Spin]:
    """Consume one credit and pick a prize.

    Returns ``(prize_dict, spin_row)``. The prize_dict is augmented with
    ``reward_type`` and ``product_name``/``product_image_url`` when applicable,
    and the Spin row stores the chosen product_id + coupon_code.
    """
    cfg = get_or_create_wheel(db)
    prizes = parse_prizes(cfg)
    prizes_view = prizes if prizes else parse_prizes_raw(DEFAULT_PRIZES_JSON)

    idx = pick_prize_index(prizes_view)
    prize = prizes_view[idx] if idx >= 0 else {
        "name": "Quà bí mật",
        "image": "",
        "weight": 1,
        "jackpot": False,
        "coupon_id": None,
        "product_id": None,
        "icon": "🎁",
    }

    reward_type = _classify_prize(prize)

    chosen_product: Product | None = None
    chosen_coupon: Coupon | None = None
    coupon_code: str | None = None

    if reward_type == "free_product":
        chosen_product = db.get(Product, prize["product_id"])
        if chosen_product is None:
            # fall back to consolation if product was deleted
            reward_type = "consolation"
        else:
            _fulfil_product_reward(db, user_id, chosen_product)
            prize["product_name"] = chosen_product.name
            prize["product_image_url"] = chosen_product.image_url
    elif reward_type == "coupon":
        chosen_coupon, coupon_code = _fulfil_coupon_reward(
            db, user_id, prize, fallback_id=prize.get("coupon_id")
        )
        if chosen_coupon is None:
            reward_type = "consolation"

    spin = Spin(
        user_id=user_id,
        prize_label=str(prize.get("name", "Quà bí mật")),
        prize_kind=reward_type,
        coupon_id=chosen_coupon.id if chosen_coupon else prize.get("coupon_id"),
        product_id=chosen_product.id if chosen_product else prize.get("product_id"),
        coupon_code=coupon_code,
        created_at=datetime.now(timezone.utc),
    )
    db.add(spin)
    db.commit()
    db.refresh(spin)
    prize["reward_type"] = reward_type
    return prize, spin


def parse_prizes_raw(raw: str) -> list[dict]:
    import json

    try:
        data = json.loads(raw or "[]")
    except Exception:
        return []
    return data if isinstance(data, list) else []
