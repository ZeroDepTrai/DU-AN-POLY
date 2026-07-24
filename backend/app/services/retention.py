"""Database retention policies.

Three classes of rows age out of the database automatically so the
``chat_messages`` / ``verification_codes`` / ``coupons`` tables stay
small and free of stale data:

* **Chat conversations + messages** — kept for
  ``settings.chat_retention_days`` (default 4 days) measured from the
  conversation's ``updated_at``. The ``chat_messages`` rows have an
  ``ondelete="CASCADE"`` FK so they vanish with their parent.
* **Verification codes** — deleted as soon as ``expires_at`` is in the
  past, regardless of whether they were ever used. Spent codes that
  aren't deleted become stale clutter and pose a (tiny) replay risk.
* **Coupons** — deleted as soon as ``expires_at`` is in the past.
  ``Coupon.starts_at`` / ``expires_at`` are stored as ``VARCHAR(64)``
  rather than timestamps (a legacy choice), so we parse them with
  :func:`_parse_coupon_timestamp` which tolerates both ISO strings and
  the ``datetime.isoformat()`` format the rest of the app writes.

The :func:`run_retention` function is intentionally exception-safe:
each cleanup step runs in its own transaction and any failure is
logged + swallowed so a database hiccup never breaks the request the
middleware is attached to.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.database import SessionLocal

logger = logging.getLogger("uvicorn.error")


def _parse_coupon_timestamp(raw: str) -> datetime | None:
    """Best-effort parse of a Coupon.starts_at / expires_at string.

    Returns ``None`` for empty values (the column default) or anything
    we cannot interpret. Two formats show up in the wild:
    ``datetime.isoformat()`` (e.g. ``2025-01-30T12:00:00+00:00``) and
    bare ISO date strings (``2025-01-30``). Both are accepted.

    The result is always timezone-aware (UTC when the input doesn't
    carry an offset) so callers can compare it against
    :func:`datetime.now(timezone.utc)` without hitting
    ``TypeError: can't compare offset-naive and offset-aware datetimes``.
    """
    if not raw:
        return None
    candidate = raw.strip()
    if not candidate:
        return None
    # fromisoformat handles "+00:00" in 3.11+; the ``Z`` suffix is a
    # common hand-written alternative we normalize to "+00:00".
    if candidate.endswith("Z"):
        candidate = candidate[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError:
        # Fall back to date-only strings; attach UTC at midnight so
        # the comparison against the tz-aware ``now`` works.
        try:
            parsed = datetime.fromisoformat(candidate + "T00:00:00+00:00")
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _delete_old_chat_conversations(days: int) -> int:
    """Delete chat_conversations older than ``days`` (0 = disabled).

    Returns the number of conversations deleted so the caller can log
    a one-line summary. The ``chat_messages`` rows cascade away with
    the parent because of the FK's ``ondelete="CASCADE"``.
    """
    if days <= 0:
        return 0
    cutoff = datetime.now(timezone.utc).timestamp() - days * 86_400
    with SessionLocal() as db:
        try:
            # ``updated_at`` is the best anchor: it tracks the last
            # customer or agent activity. A conversation that hasn't
            # been touched in N days is safe to evict.
            result = db.execute(
                text(
                    "DELETE FROM chat_conversations "
                    "WHERE updated_at < :cutoff"
                ),
                {"cutoff": datetime.fromtimestamp(cutoff, tz=timezone.utc)},
            )
            db.commit()
            return result.rowcount or 0
        except SQLAlchemyError as exc:
            db.rollback()
            logger.warning("[retention] chat cleanup failed: %s", exc)
            return 0


def _delete_expired_verification_codes(now: datetime | None = None) -> int:
    """Delete verification_codes whose ``expires_at`` is in the past."""
    now = now or datetime.now(timezone.utc)
    with SessionLocal() as db:
        try:
            result = db.execute(
                text(
                    "DELETE FROM verification_codes "
                    "WHERE expires_at < :now"
                ),
                {"now": now},
            )
            db.commit()
            return result.rowcount or 0
        except SQLAlchemyError as exc:
            db.rollback()
            logger.warning("[retention] verification-code cleanup failed: %s", exc)
            return 0


def _delete_expired_coupons(now: datetime | None = None) -> int:
    """Delete coupons whose ``expires_at`` string is in the past.

    Coupons whose ``expires_at`` is empty or unparseable are left
    alone — we'd rather keep an undated promo than accidentally
    delete an active one whose format we don't recognize.
    """
    now = now or datetime.now(timezone.utc)
    with SessionLocal() as db:
        try:
            # Pull candidates first so we can parse the string column
            # in Python. Doing the comparison in SQL would require a
            # brittle CAST chain for the dozen input formats the app
            # has produced over time.
            rows: Iterable[tuple[int, str]] = db.execute(
                text("SELECT id, expires_at FROM coupons")
            ).all()
            stale_ids = [
                row[0]
                for row in rows
                if (parsed := _parse_coupon_timestamp(row[1] or "")) is not None
                and parsed < now
            ]
            if not stale_ids:
                return 0
            result = db.execute(
                text("DELETE FROM coupons WHERE id = ANY(:ids)"),
                {"ids": stale_ids},
            )
            db.commit()
            return result.rowcount or 0
        except SQLAlchemyError as exc:
            db.rollback()
            logger.warning("[retention] coupon cleanup failed: %s", exc)
            return 0


def run_retention() -> dict[str, int]:
    """Run all retention policies. Returns a per-table deleted count.

    Safe to call on every request: each sub-cleanup has its own
    transaction, and any single failure is logged + swallowed so the
    request still completes normally.
    """
    deleted_chat = _delete_old_chat_conversations(settings.chat_retention_days)
    deleted_codes = _delete_expired_verification_codes()
    deleted_coupons = _delete_expired_coupons()
    total = deleted_chat + deleted_codes + deleted_coupons
    if total:
        logger.info(
            "[retention] removed chat=%d codes=%d coupons=%d (cutoff=%dd)",
            deleted_chat,
            deleted_codes,
            deleted_coupons,
            settings.chat_retention_days,
        )
    return {
        "chat_conversations": deleted_chat,
        "verification_codes": deleted_codes,
        "coupons": deleted_coupons,
    }
