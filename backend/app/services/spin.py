"""Spin / wheel / user lottery helpers.

Behavior rules (from spec):
* Every `spend_per_spin_vnd` VND of *delivered* order history = 1 spin credit,
  accumulating across all delivered orders. Multiple credits may be granted
  at once when an order is delivered.
* Spinning consumes exactly one credit. The server picks a weighted prize
  from the active `WheelConfig` and writes an audit row to `spins`.

Prize resolution rules:
* If the prize picks ``product_id`` -> free product reward:
  - Create an Order + OrderItem for the winning user, unit_price=0,
    status=delivered, payment_method="spin_reward".
  - Set the Spin row's product_id and order_id.
* If the prize has ``coupon_discount_type`` + ``coupon_discount_value`` ->
  one-off coupon reward:
  - Mint a *new* Coupon row with a unique code (prefix "SP"), usage_limit=1,
    and persist the code on the Spin row so the user keeps it forever.
* Otherwise the spin is "consolation" (no extra artefact).
"""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone

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
    '{"name":"Mã giảm giá 2%","image":"/uploads/case.png","weight":35,"jackpot":false,"icon":"🎟️","coupon_id":null,"product_id":null,"coupon_discount_type":"percent","coupon_discount_value":2},'
    '{"name":"Cường Lực miễn phí","image":"/uploads/screen.png","weight":25,"jackpot":false,"icon":"🛡️","coupon_id":null,"product_id":null,"coupon_discount_type":"percent","coupon_discount_value":10},'
    '{"name":"Ốp Iphone miễn phí","image":"/uploads/cable.png","weight":20,"jackpot":false,"icon":"📱","coupon_id":null,"product_id":null,"coupon_discount_type":"percent","coupon_discount_value":5},'
    '{"name":"Dây sạc miễn phí","image":"/uploads/charger.png","weight":14,"jackpot":false,"icon":"🔌","coupon_id":null,"product_id":null,"coupon_discount_type":"percent","coupon_discount_value":5},'
    '{"name":"Mã giảm giá 5%","image":"/uploads/airpod.png","weight":5,"jackpot":false,"icon":"🎁","coupon_id":null,"product_id":null,"coupon_discount_type":"percent","coupon_discount_value":5},'
    '{"name":"Chúc bạn may mắn lần sau","image":"/uploads/smartwatch.png","weight":0.5,"jackpot":false,"icon":"🍀","coupon_id":null,"product_id":null},'
    '{"name":"Apple Watch","image":"/uploads/watch.png","weight":0.4,"jackpot":true,"icon":"⌚","coupon_id":null,"product_id":null},'
    '{"name":"IPhone 17 Pro Max","image":"/uploads/iphone.png","weight":0.1,"jackpot":true,"icon":"📱","coupon_id":null,"product_id":null}'
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
    raw = getattr(cfg, "prizes_json", None) if cfg is not None else None
    try:
        data = json.loads(raw or "[]")
    except Exception:
        data = []
    return data if isinstance(data, list) else []


def _classify_prize(prize: dict) -> str:
    """Return one of: free_product | coupon | jackpot | consolation."""
    if prize.get("reward_type"):
        return str(prize["reward_type"])
    if prize.get("product_id"):
        return "free_product"
    if (
        prize.get("coupon_id")
        or prize.get("coupon_discount_type")
        or prize.get("coupon_discount_value") is not None
    ):
        return "coupon"
    if prize.get("jackpot"):
        return "jackpot"
    return "consolation"


# ── credit / spend math ────────────────────────────────────────────────────


def _order_subtotal(order: Order) -> float:
    return sum((i.unit_price or 0) * (i.quantity or 0) for i in (order.items or []))


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
    return int(sum(_order_subtotal(o) for o in delivered))


def grant_credits_for_delivered_order(db: Session, order: Order) -> int:
    """When an order transitions to 'delivered', give the buyer 1 spin per
    ``spend_per_spin_vnd`` VND of *delivered* order history (so credits
    accumulate across orders). Returns the number of newly-granted credits.
    """
    cfg = get_or_create_wheel(db)
    threshold = cfg.spend_per_spin_vnd or 3_000_000
    if threshold <= 0:
        return 0

    delivered = (
        db.query(Order)
        .filter(Order.user_id == order.user_id, Order.status == OrderStatus.delivered)
        .all()
    )
    if order.id is not None and order not in delivered:
        delivered.append(order)

    lifetime_spend = sum(_order_subtotal(o) for o in delivered)
    new_total_credits = int(lifetime_spend // threshold)

    granted_rows = (
        db.query(SpinCredit)
        .filter(
            SpinCredit.user_id == order.user_id,
            SpinCredit.reason == "delivered_order",
        )
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
    if not prizes:
        return -1
    total = sum(max(0.0, float(p.get("weight", 0))) for p in prizes)
    if total <= 0:
        return 0
    r = secrets.randbelow(10_000) / 10_000 * total
    acc = 0.0
    for i, p in enumerate(prizes):
        acc += max(0.0, float(p.get("weight", 0)))
        if r <= acc:
            return i
    return len(prizes) - 1


# ── helpers for reward fulfilment ──────────────────────────────────────────


def _gen_unique_code(db: Session, prefix: str = "SP") -> str:
    """Generate a unique 8-char coupon code prefixed with `prefix`."""
    for _ in range(20):
        candidate = f"{prefix}{secrets.token_hex(3).upper()}"
        exists = db.query(Coupon).filter(Coupon.code == candidate).first()
        if not exists:
            return candidate
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
    db: Session, prize: dict
) -> tuple[Coupon | None, str | None]:
    """Create a one-off Coupon row, unless the prize references an existing
    ``coupon_id`` (legacy mode). Returns (coupon_row, code_str).
    """
    existing_id = prize.get("coupon_id")
    if existing_id and not (prize.get("coupon_discount_value") is not None):
        coupon = db.get(Coupon, existing_id)
        if coupon is not None:
            return coupon, coupon.code

    dt = prize.get("coupon_discount_type")
    dv = prize.get("coupon_discount_value")
    if not dt or dv is None:
        return None, None

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


# ── main entry point ───────────────────────────────────────────────────────


def perform_spin(db: Session, user_id: int) -> tuple[dict, Spin]:
    """Consume one credit and pick a prize.

    Returns ``(prize_dict, spin_row)``. The prize_dict is augmented with
    ``reward_type``, ``coupon_code`` (when applicable), and
    ``product_name``/``product_image_url`` for free products.
    """
    cfg = get_or_create_wheel(db)
    prizes = parse_prizes(cfg)
    if not prizes:
        prizes = parse_prizes_raw(DEFAULT_PRIZES_JSON)

    idx = pick_prize_index(prizes)
    prize = prizes[idx] if idx >= 0 else {
        "name": "Quà bí mật",
        "image": "",
        "weight": 1,
        "jackpot": False,
        "icon": "🎁",
    }

    reward_type = _classify_prize(prize)

    chosen_product: Product | None = None
    chosen_coupon: Coupon | None = None
    coupon_code: str | None = None
    free_order_id: int | None = None

    if reward_type == "free_product":
        chosen_product = db.get(Product, prize["product_id"])
        if chosen_product is None:
            reward_type = "consolation"
        else:
            item = _fulfil_product_reward(db, user_id, chosen_product)
            free_order_id = item.order_id
            prize["product_name"] = chosen_product.name
            prize["product_image_url"] = chosen_product.image_url
    elif reward_type == "coupon":
        chosen_coupon, coupon_code = _fulfil_coupon_reward(db, prize)
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
    if coupon_code:
        prize["coupon_code"] = coupon_code
    if free_order_id:
        prize["free_order_id"] = free_order_id
    return prize, spin


def parse_prizes_raw(raw: str) -> list[dict]:
    try:
        data = json.loads(raw or "[]")
    except Exception:
        return []
    return data if isinstance(data, list) else []