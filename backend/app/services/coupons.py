"""Coupon math helpers."""


def compute_discount(coupon, subtotal: float) -> float:
    """Return the discount amount (in VND) for a given coupon + subtotal."""
    subtotal = float(subtotal)
    if subtotal < float(coupon.min_order_total or 0):
        return 0.0
    if coupon.discount_type == "percent":
        d = subtotal * (float(coupon.discount_value) / 100.0)
    else:
        d = float(coupon.discount_value)
    if coupon.max_discount is not None:
        d = min(d, float(coupon.max_discount))
    d = min(d, subtotal)
    return max(0.0, d)
