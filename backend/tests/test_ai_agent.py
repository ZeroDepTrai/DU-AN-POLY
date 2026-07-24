"""Unit tests for the AI customer-support agent.

These tests exercise the pure helpers in
``backend/app/services/ai_agent.py`` without requiring a real database
or a Gemini API key. They cover:

* the history-formatting rule for Gemini (alternating user/model, leading
  user, no trailing model),
* the "should reply" guard (closed conversations and assigned
  conversations are skipped),
* the product-context formatter (truncation of long descriptions), and
* the ``schedule_ai_reply`` shim when no event loop is running.
"""

from __future__ import annotations

import types

import pytest

from app.services import ai_agent
from app.services.ai_agent import (
    FALLBACK_REPLY,
    _format_product_context,
    _history_to_gemini,
    _should_reply,
    schedule_ai_reply,
)


class _Msg:
    """Lightweight stand-in for ChatMessage rows used by the tests."""

    def __init__(self, sender_type: str, content: str) -> None:
        self.sender_type = sender_type
        self.content = content


class _Conv:
    def __init__(self, status: str = "waiting", assigned_to: int | None = None) -> None:
        self.status = status
        self.assigned_to = assigned_to


class _Product:
    def __init__(self, id: int, name: str, price: float, description: str = "") -> None:
        self.id = id
        self.name = name
        self.price = price
        self.description = description


def test_history_to_gemini_alternates_and_starts_with_user():
    history = [
        _Msg("agent", "Chào bạn"),
        _Msg("customer", "Giá iPhone 15 bao nhiêu?"),
        _Msg("agent", "Khoảng 20 triệu"),
        _Msg("customer", "Có màu đen không?"),
    ]
    out = _history_to_gemini(history)
    assert [entry["role"] for entry in out] == ["user", "model", "user"]


def test_history_to_gemini_collapses_runs_of_same_role():
    history = [
        _Msg("customer", "Câu hỏi 1"),
        _Msg("customer", "Câu hỏi 2"),
        _Msg("agent", "Trả lời 1"),
        _Msg("agent", "Trả lời 2"),
        _Msg("customer", "Câu hỏi 3"),
    ]
    out = _history_to_gemini(history)
    assert [entry["role"] for entry in out] == ["user", "model", "user"]
    assert "Câu hỏi 1" in out[0]["parts"][0]["text"]
    assert "Câu hỏi 2" in out[0]["parts"][0]["text"]
    assert "Trả lời 1" in out[1]["parts"][0]["text"]
    assert "Trả lời 2" in out[1]["parts"][0]["text"]


def test_history_to_gemini_drops_leading_model():
    history = [
        _Msg("agent", "Chào bạn"),
        _Msg("customer", "Giá bao nhiêu?"),
    ]
    out = _history_to_gemini(history)
    assert [entry["role"] for entry in out] == ["user"]


def test_history_to_gemini_drops_trailing_model_but_keeps_leading_user():
    history = [
        _Msg("customer", "Giá bao nhiêu?"),
        _Msg("agent", "Khoảng 20 triệu"),
    ]
    out = _history_to_gemini(history)
    # The trailing model turn is discarded but the leading user turn
    # is preserved — the caller is expected to re-append the most
    # recent user message before posting to Gemini.
    assert [entry["role"] for entry in out] == ["user"]


def test_history_to_gemini_truncates_to_window():
    history = [
        _Msg("customer", f"q{i}") for i in range(ai_agent.HISTORY_TURN_LIMIT + 5)
    ]
    out = _history_to_gemini(history)
    # always alternates user / model once merged; with only customer
    # messages the history collapses into a single turn.
    assert len(out) == 1
    assert out[0]["role"] == "user"


@pytest.mark.parametrize(
    "conv, expected",
    [
        (_Conv("waiting", assigned_to=None), True),
        (_Conv("active", assigned_to=None), True),
        (_Conv("closed", assigned_to=None), False),
        (_Conv("waiting", assigned_to=42), False),
        (None, False),
    ],
)
def test_should_reply_guard(conv, expected):
    assert _should_reply(conv) is expected


def test_format_product_context_includes_price_and_truncates_long_description():
    long = "x" * 300
    products = [
        _Product(1, "iPhone 15", 20_000_000, ""),
        _Product(2, "Galaxy S24", 18_000_000, long),
    ]
    out = _format_product_context(products)
    assert "iPhone 15" in out
    assert "20,000,000 VND" in out
    assert "Galaxy S24" in out
    # Long description should be trimmed to under 120 characters plus "...".
    assert "x" * 121 not in out
    assert "..." in out


def test_format_product_context_empty_when_no_products():
    assert _format_product_context([]) == "(hiện chưa có sản phẩm trong cửa hàng)"


def test_fallback_reply_is_non_empty():
    assert FALLBACK_REPLY
    assert "CellZone" in FALLBACK_REPLY


def test_schedule_ai_reply_returns_none_without_event_loop(monkeypatch):
    # ``asyncio.get_running_loop`` raises ``RuntimeError`` outside an
    # event loop; the shim must convert that into a no-op rather than
    # blowing up at import/run time.
    monkeypatch.setattr(
        ai_agent.asyncio,
        "get_running_loop",
        lambda: (_ for _ in ()).throw(RuntimeError("no running loop")),
    )
    assert schedule_ai_reply("conv-id") is None
