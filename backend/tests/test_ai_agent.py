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
    HUMAN_HANDOFF_BUTTON,
    _extract_product_buttons,
    _format_product_context,
    _history_to_gemini,
    _is_human_handoff_request,
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


# ─── Product chip extractor ─────────────────────────────────────────────────


def test_extract_product_buttons_returns_empty_when_no_match():
    products = [_Product(1, "iPhone 15", 20_000_000)]
    assert _extract_product_buttons("Xin chào, mình giúp gì được cho bạn?", products) == []


def test_extract_product_buttons_finds_mentioned_products():
    products = [
        _Product(1, "iPhone 15 Pro Max", 30_000_000),
        _Product(2, "Samsung Galaxy S24", 18_000_000),
        _Product(3, "Xiaomi Redmi Note 13", 5_000_000),
    ]
    reply = (
        "CellZone đang có Samsung Galaxy S24 và Xiaomi Redmi Note 13. "
        "iPhone 15 Pro Max cũng có sẵn."
    )
    chips = _extract_product_buttons(reply, products)
    # Longest names come first so the chip label is the exact product
    # the model cited (rather than a partial substring).
    assert [c["id"] for c in chips] == [3, 2, 1]
    assert all(c["type"] == "product" for c in chips)
    assert chips[0]["label"] == "Xiaomi Redmi Note 13"


def test_extract_product_buttons_case_insensitive_and_dedup():
    products = [_Product(7, "iphone 15", 20_000_000)]
    chips = _extract_product_buttons("IPHONE 15 đang giảm giá!", products)
    assert len(chips) == 1
    assert chips[0]["id"] == 7


def test_extract_product_buttons_prefers_longest_name():
    # Both products match because "samsung galaxy s24" is a substring
    # of "samsung galaxy s24 ultra"; the extractor must pick the longer
    # one first so the chip label is the exact product the model cited.
    products = [
        _Product(1, "Samsung Galaxy S24 Ultra", 30_000_000),
        _Product(2, "Samsung Galaxy S24", 20_000_000),
    ]
    chips = _extract_product_buttons("Gợi ý Samsung Galaxy S24 Ultra cho bạn", products)
    assert [c["id"] for c in chips] == [1, 2]


def test_extract_product_buttons_respects_max_cap():
    products = [_Product(i, f"Phone {i}", 1_000_000) for i in range(1, 10)]
    reply = " ".join(f"Phone {i}" for i in range(1, 10))
    chips = _extract_product_buttons(reply, products)
    assert len(chips) == ai_agent.MAX_PRODUCT_BUTTONS


def test_extract_product_buttons_handles_markdown_bold():
    # The model wraps product names in ``**...**`` to draw attention.
    # The extractor must still match the inner product name.
    products = [
        _Product(1, "SMARTPHONE XIAOMI POCO M8 5G (8GB/256GB)", 5_000_000),
        _Product(2, "iPhone 15 Pro Max", 30_000_000),
    ]
    reply = (
        "CellZone đang có **SMARTPHONE XIAOMI POCO M8 5G (8GB/256GB)** "
        "với giá tốt, và cả **iPhone 15 Pro Max**."
    )
    chips = _extract_product_buttons(reply, products)
    assert [c["id"] for c in chips] == [1, 2]
    assert chips[0]["label"] == "SMARTPHONE XIAOMI POCO M8 5G (8GB/256GB)"


def test_extract_product_buttons_handles_line_breaks():
    # The model sometimes inserts a newline between the asterisks and
    # the product name. Whitespace normalization must bridge that gap.
    products = [_Product(1, "Samsung Galaxy S24", 18_000_000)]
    reply = "**\nSamsung Galaxy S24\n** đang giảm giá."
    chips = _extract_product_buttons(reply, products)
    assert [c["id"] for c in chips] == [1]


def test_extract_product_buttons_handles_bold_italic():
    # ``***Product***`` (bold + italic) should also match.
    products = [_Product(1, "OPPO Reno 11", 9_000_000)]
    reply = "Mời bạn xem ***OPPO Reno 11*** nhé."
    chips = _extract_product_buttons(reply, products)
    assert [c["id"] for c in chips] == [1]


# ─── Handoff detection ───────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "message, expected",
    [
        ("Cho mình gặp nhân viên tư vấn nhé", True),
        ("Tôi muốn nói chuyện với người thật", True),
        ("Có thể gặp tư vấn viên không?", True),
        ("Cho mình gặp NHÂN VIÊN", True),
        ("I want to talk to a real person", True),
        ("Speak to a human agent please", True),
        ("Giá iPhone 15 bao nhiêu?", False),
        ("Bao giờ hàng về?", False),
        ("", False),
    ],
)
def test_is_human_handoff_request(message, expected):
    assert _is_human_handoff_request(message) is expected


def test_human_handoff_button_shape():
    # The frontend relies on this exact shape to render the chip.
    assert HUMAN_HANDOFF_BUTTON == {
        "type": "human_handoff",
        "label": "Liên hệ nhân viên",
    }
