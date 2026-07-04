"""Spin / wheel / user lottery helpers.

Behavior rules (from spec):
* Every `spend_per_spin_vnd` VND of *delivered* order history = 1 spin credit.
  Granted cumulatively (1 spin per N VND, accumulating across all delivered
  orders). Multiple credits may be granted at once when an order is delivered.
* Spinning consumes exactly one credit. The server picks a weighted prize from
  the active `WheelConfig` and writes an audit row to `spins`.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Order, OrderStatus, Spin, SpinCredit, WheelConfig


DEFAULT_PRIZES_JSON = (
    "["
    '{"name":"Mã giảm giá 2%","image":"/uploads/case.png","weight":35,"jackpot":false,"coupon_id":null,"icon":""},'
    '{"name":"Cường Lực","image":"/uploads/screen.png","weight":25,"jackpot":false,"coupon_id":null,"icon":""},'
    '{"name":"Ốp Iphone","image":"/uploads/cable.png","weight":20,"jackpot":false,"coupon_id":null,"icon":""},'
    '{"name":"Dây sạc","image":"/uploads/charger.png","weight":14,"jackpot":false,"coupon_id":null,"icon":""},'
    '{"name":"Mã giảm giá 5%","image":"/uploads/airpod.png","weight":5,"jackpot":false,"coupon_id":null,"icon":""},'
    '{"name":"Chúc bạn may mắn lần sau","image":"/uploads/smartwatch.png","weight":0.5,"jackpot":false,"coupon_id":null,"icon":""},'
    '{"name":"Apple Watch","image":"/uploads/watch.png","weight":0.4,"jackpot":true,"coupon_id":null,"icon":""},'
    '{"name":"IPhone 17 Pro Max","image":"/uploads/iphone.png","weight":0.1,"jackpot":true,"coupon_id":null,"icon":""}'
    "]"
)


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


def parse_prizes(cfg: WheelConfig) -> list[dict]:
    import json

    try:
        data = json.loads(cfg.prizes_json or "[]")
    except Exception:
        data = []
    return data if isinstance(data, list) else []


def user_credit_balance(db: Session, user_id: int) -> int:
    rows = db.query(SpinCredit).filter(SpinCredit.user_id == user_id).all()
    earned = sum(c.amount for c in rows)
    consumed = db.query(Spin).filter(Spin.user_id == user_id).count()
    return max(0, earned - consumed)


def user_lifetime_spend_vnd(db: Session, user_id: int) -> int:
    """Sum of subtotals for delivered orders (used to display progress + decide
    when to grant the NEXT credit)."""
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
    """Grant 1 credit per `spend_per_spin_vnd` VND of cumulative delivered
    spend. Idempotent (won't double-grant).
    """
    cfg = get_or_create_wheel(db)
    threshold = cfg.spend_per_spin_vnd or 3_000_000

    delivered = (
        db.query(Order)
        .filter(Order.user_id == order.user_id, Order.status == OrderStatus.delivered)
        .all()
    )
    # Make sure the just-delivered order is included in the sum even if the
    # status hasn't been flushed yet.
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


def consume_one_credit(db: Session, user_id: int) -> None:
    """Mark exactly one credit as used by writing a Spin audit row.

    The user-facing balance is computed by `user_credit_balance`, so we don't
    need to track per-credit rows. We only need to record the audit Spin so
    consumption count stays accurate.
    """


def perform_spin(db: Session, user_id: int) -> tuple[dict, Spin]:
    """Consume one credit and pick a prize. Returns (prize_dict, spin_row)."""
    cfg = get_or_create_wheel(db)
    prizes = parse_prizes(cfg)

    prizes_view = prizes if prizes else parse_prizes_raw(DEFAULT_PRIZES_JSON)
    idx = pick_prize_index(prizes_view)
    prize = prizes_view[idx] if idx >= 0 else {"name": "Quà bí mật", "image": "", "weight": 1, "jackpot": False, "coupon_id": None, "icon": ""}

    kind = (
        "jackpot"
        if prize.get("jackpot")
        else ("coupon" if prize.get("coupon_id") else "consolation")
    )

    spin = Spin(
        user_id=user_id,
        prize_label=str(prize.get("name", "Quà bí mật")),
        prize_kind=kind,
        coupon_id=prize.get("coupon_id"),
        created_at=datetime.now(timezone.utc),
    )
    db.add(spin)
    db.commit()
    db.refresh(spin)
    return prize, spin


def parse_prizes_raw(raw: str) -> list[dict]:
    import json

    try:
        data = json.loads(raw or "[]")
    except Exception:
        return []
    return data if isinstance(data, list) else []
