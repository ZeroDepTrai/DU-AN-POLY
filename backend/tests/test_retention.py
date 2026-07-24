"""Unit tests for ``app.services.retention``.

We deliberately don't touch a real database here. Instead each test
stubs out ``SessionLocal`` with an in-memory fake that records the
SQLAlchemy ``execute()`` / ``commit()`` / ``rollback()`` calls, so we
can verify the right DELETE statement was issued (with the right
parameters) and that a DB error path returns ``0`` instead of
raising.
"""

from __future__ import annotations

import types

import pytest
from sqlalchemy.exc import SQLAlchemyError

import app.services.retention as retention


# ─── helpers ───────────────────────────────────────────────────────────────


class _FakeResult:
    def __init__(self, rowcount: int = 0) -> None:
        self.rowcount = rowcount


class _FakeRow:
    def __init__(self, id_: int, expires_at: str) -> None:
        self._id = id_
        self._expires_at = expires_at

    def __getitem__(self, idx: int):
        return (self._id, self._expires_at)[idx]

    def __iter__(self):
        yield self._id
        yield self._expires_at


class _FakeSession:
    """Records the queries a retention helper runs.

    The constructor takes a small spec: ``select_rows`` (for the coupon
    pre-scan), ``execute_raises`` (optional exc class), ``delete_rowcount``.
    """

    def __init__(
        self,
        *,
        select_rows: list[tuple[int, str]] | None = None,
        execute_raises: type[Exception] | None = None,
        delete_rowcount: int = 0,
    ) -> None:
        self.select_rows = select_rows or []
        self.execute_raises = execute_raises
        self.delete_rowcount = delete_rowcount
        self.executed: list[tuple[str, dict]] = []
        self.committed = False
        self.rolled_back = False

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, stmt, params=None):
        self.executed.append((str(stmt), params or {}))
        if self.execute_raises is not None:
            raise self.execute_raises("boom")
        # Mimic SQLAlchemy: ``DELETE ... RETURNING id`` for the chat
        # cleanup is just a normal statement; the rowcount is what
        # matters. For the coupon pre-scan we return our canned rows.
        sql_text = str(stmt).lstrip().lower()
        if sql_text.startswith("select"):
            # Return a result that iterates over the configured rows.
            return _FakeRows(self.select_rows)
        return _FakeResult(self.delete_rowcount)

    def commit(self):
        if self.execute_raises is not None:
            # SQLAlchemy only commits if execute succeeded; mimic that.
            raise self.execute_raises("commit blocked")
        self.committed = True

    def rollback(self):
        self.rolled_back = True


class _FakeRows:
    def __init__(self, rows: list[tuple]) -> None:
        self._rows = [_FakeRow(*r) for r in rows]

    def all(self) -> list[_FakeRow]:
        return list(self._rows)


@pytest.fixture
def fake_session_local(monkeypatch):
    """Patch ``SessionLocal`` so retention uses our fake session."""

    instances: list[_FakeSession] = []

    def _factory(**kwargs):
        s = _FakeSession(**kwargs)
        instances.append(s)
        return s

    def _session_local():
        # Each call to ``SessionLocal()`` returns a fresh fake.
        return _FakeSession(
            select_rows=next(iter(kwargs_iter), None) and next(iter(kwargs_iter)).get("select_rows"),
        )

    # Simpler approach: keep a queue of pre-built sessions.
    queue: list[_FakeSession] = []

    def _patched(**kwargs):
        s = _FakeSession(**kwargs)
        queue.append(s)
        instances.append(s)
        return s

    monkeypatch.setattr(retention, "SessionLocal", _patched)
    return types.SimpleNamespace(queue=queue, instances=instances)


# ─── timestamp parser ──────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "raw, expected_year",
    [
        ("", None),
        ("   ", None),
        ("not-a-date", None),
        ("2025-01-30", 2025),
        ("2025-01-30T12:00:00+00:00", 2025),
        ("2025-01-30T12:00:00Z", 2025),
        ("2026-12-31T23:59:59+07:00", 2026),
    ],
)
def test_parse_coupon_timestamp(raw, expected_year):
    parsed = retention._parse_coupon_timestamp(raw)
    if expected_year is None:
        assert parsed is None
    else:
        assert parsed is not None
        assert parsed.year == expected_year


# ─── chat retention ────────────────────────────────────────────────────────


def test_delete_old_chat_conversations_skips_when_disabled(monkeypatch):
    # days=0 means "feature disabled". The helper should issue no SQL
    # and return 0 immediately.
    monkeypatch.setattr(retention, "SessionLocal", _FakeSession)
    assert retention._delete_old_chat_conversations(0) == 0


def test_delete_old_chat_conversations_issues_delete(monkeypatch):
    sessions: list[_FakeSession] = []

    def factory(**kwargs):
        s = _FakeSession(delete_rowcount=3)
        sessions.append(s)
        return s

    monkeypatch.setattr(retention, "SessionLocal", factory)
    deleted = retention._delete_old_chat_conversations(4)
    assert deleted == 3
    assert len(sessions) == 1
    stmt, params = sessions[0].executed[0]
    assert "DELETE FROM chat_conversations" in stmt
    assert "updated_at < :cutoff" in stmt
    assert "cutoff" in params
    assert sessions[0].committed is True


def test_delete_old_chat_conversations_swallows_db_errors(monkeypatch):
    def factory(**kwargs):
        return _FakeSession(execute_raises=SQLAlchemyError)

    monkeypatch.setattr(retention, "SessionLocal", factory)
    # Must NOT raise — retention failures must never bubble out.
    assert retention._delete_old_chat_conversations(4) == 0


# ─── verification code retention ───────────────────────────────────────────


def test_delete_expired_verification_codes_issues_delete(monkeypatch):
    sessions: list[_FakeSession] = []

    def factory(**kwargs):
        s = _FakeSession(delete_rowcount=5)
        sessions.append(s)
        return s

    monkeypatch.setattr(retention, "SessionLocal", factory)
    from datetime import datetime, timezone
    fixed_now = datetime(2026, 7, 24, 12, 0, 0, tzinfo=timezone.utc)
    deleted = retention._delete_expired_verification_codes(fixed_now)
    assert deleted == 5
    stmt, params = sessions[0].executed[0]
    assert "DELETE FROM verification_codes" in stmt
    assert params["now"] == fixed_now
    assert sessions[0].committed is True


def test_delete_expired_verification_codes_returns_zero_on_empty(monkeypatch):
    def factory(**kwargs):
        return _FakeSession(delete_rowcount=0)

    monkeypatch.setattr(retention, "SessionLocal", factory)
    assert retention._delete_expired_verification_codes() == 0


# ─── coupon retention ──────────────────────────────────────────────────────


def test_delete_expired_coupons_deletes_only_expired(monkeypatch):
    sessions: list[_FakeSession] = []

    # Mix of expired / active / malformed coupons. Only the expired one
    # with a parseable timestamp should be deleted.
    rows = [
        (1, ""),  # empty → keep
        (2, "not-a-date"),  # malformed → keep
        (3, "2099-01-01T00:00:00+00:00"),  # future → keep
        (4, "2020-01-01T00:00:00+00:00"),  # expired → delete
        (5, "2020-01-01"),  # expired date-only → delete
    ]

    def factory(**kwargs):
        s = _FakeSession(select_rows=rows, delete_rowcount=2)
        sessions.append(s)
        return s

    monkeypatch.setattr(retention, "SessionLocal", factory)
    from datetime import datetime, timezone
    fixed_now = datetime(2026, 7, 24, 12, 0, 0, tzinfo=timezone.utc)
    deleted = retention._delete_expired_coupons(fixed_now)
    assert deleted == 2
    # First query was the pre-scan SELECT.
    assert "SELECT id, expires_at FROM coupons" in sessions[0].executed[0][0]
    # Second query was the DELETE with the stale ids.
    delete_stmt, delete_params = sessions[0].executed[1]
    assert "DELETE FROM coupons" in delete_stmt
    assert sorted(delete_params["ids"]) == [4, 5]


def test_delete_expired_coupons_no_op_when_all_active(monkeypatch):
    def factory(**kwargs):
        return _FakeSession(
            select_rows=[(1, "2099-01-01")],
            delete_rowcount=0,
        )

    monkeypatch.setattr(retention, "SessionLocal", factory)
    assert retention._delete_expired_coupons() == 0


# ─── run_retention end-to-end (with stubbed settings) ──────────────────────


def test_run_retention_aggregates_counts(monkeypatch):
    calls: list[str] = []

    def fake_chat(days):
        calls.append(f"chat({days})")
        return 2

    def fake_codes(now=None):
        calls.append("codes")
        return 3

    def fake_coupons(now=None):
        calls.append("coupons")
        return 1

    monkeypatch.setattr(retention, "_delete_old_chat_conversations", fake_chat)
    monkeypatch.setattr(retention, "_delete_expired_verification_codes", fake_codes)
    monkeypatch.setattr(retention, "_delete_expired_coupons", fake_coupons)
    monkeypatch.setattr(retention.settings, "chat_retention_days", 7)

    result = retention.run_retention()
    assert result == {"chat_conversations": 2, "verification_codes": 3, "coupons": 1}
    assert calls == ["chat(7)", "codes", "coupons"]


def test_run_retention_returns_zeros_when_disabled(monkeypatch):
    monkeypatch.setattr(retention, "_delete_old_chat_conversations", lambda days: 0)
    monkeypatch.setattr(retention, "_delete_expired_verification_codes", lambda now=None: 0)
    monkeypatch.setattr(retention, "_delete_expired_coupons", lambda now=None: 0)
    assert retention.run_retention() == {
        "chat_conversations": 0,
        "verification_codes": 0,
        "coupons": 0,
    }
