import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_customer_support
from app.models import ChatConversation, ChatMessage, User
from app.schemas import (
    ChatAssignRequest,
    ChatConversationResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatStartRequest,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _conversation_to_response(conv: ChatConversation, db: Session) -> ChatConversationResponse:
    """Convert a ChatConversation model to response schema."""
    last_msg = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at.desc())
        .first()
    )

    assigned_name = None
    if conv.assigned_to:
        agent = db.get(User, conv.assigned_to)
        if agent:
            assigned_name = agent.name

    return ChatConversationResponse(
        id=conv.id,
        customer_name=conv.customer_name,
        customer_email=conv.customer_email,
        status=conv.status,
        assigned_to=conv.assigned_to,
        assigned_name=assigned_name,
        last_message=last_msg.content if last_msg else None,
        last_message_at=last_msg.created_at.isoformat() if last_msg else None,
        unread_count=conv.unread_count,
        created_at=conv.created_at.isoformat(),
    )


def _message_to_response(msg: ChatMessage) -> ChatMessageResponse:
    """Convert a ChatMessage model to response schema."""
    return ChatMessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_type=msg.sender_type,
        sender_name=msg.sender_name,
        content=msg.content,
        timestamp=msg.created_at.isoformat(),
        read=msg.read,
    )


# ──────────────────────────────────────────────────────────────────────────────
# REST endpoints for desktop app
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/conversations", response_model=list[ChatConversationResponse])
def list_conversations(
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """List all chat conversations."""
    conversations = (
        db.query(ChatConversation)
        .order_by(ChatConversation.updated_at.desc())
        .all()
    )
    return [_conversation_to_response(c, db) for c in conversations]


@router.get("/conversations/{conversation_id}", response_model=list[ChatMessageResponse])
def get_conversation_messages(
    conversation_id: str,
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """Get all messages in a conversation."""
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [_message_to_response(m) for m in messages]


@router.post("/conversations/{conversation_id}/assign")
def assign_conversation(
    conversation_id: str,
    payload: ChatAssignRequest,
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """Assign a conversation to an agent."""
    conv = (
        db.query(ChatConversation)
        .filter(ChatConversation.id == conversation_id)
        .first()
    )
    if not conv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Verify agent exists and has support role
    agent = db.get(User, payload.agent_id)
    if not agent:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Agent not found")

    from app.models import UserRole
    if agent.role not in [UserRole.admin, UserRole.customer_support]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="User is not a support agent")

    conv.assigned_to = payload.agent_id
    conv.status = "active"
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"ok": True}


@router.post("/conversations/{conversation_id}/close")
def close_conversation(
    conversation_id: str,
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """Close a conversation."""
    conv = (
        db.query(ChatConversation)
        .filter(ChatConversation.id == conversation_id)
        .first()
    )
    if not conv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv.status = "closed"
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"ok": True}


@router.post("/conversations/{conversation_id}/messages", response_model=ChatMessageResponse)
def send_agent_message(
    conversation_id: str,
    payload: ChatMessageCreate,
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """Send a message as an agent."""
    conv = (
        db.query(ChatConversation)
        .filter(ChatConversation.id == conversation_id)
        .first()
    )
    if not conv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    message = ChatMessage(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        sender_type="agent",
        sender_name=current_user.name or current_user.email.split("@")[0],
        content=payload.content,
        read=True,
    )
    db.add(message)

    conv.updated_at = datetime.now(timezone.utc)
    conv.status = "active"
    db.commit()
    db.refresh(message)

    return _message_to_response(message)


@router.post("/conversations/{conversation_id}/read")
def mark_conversation_read(
    conversation_id: str,
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """Mark all messages in a conversation as read."""
    db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id,
        ChatMessage.sender_type == "customer",
    ).update({"read": True})

    db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id
    ).update({"unread_count": 0})

    db.commit()
    return {"ok": True}


# ──────────────────────────────────────────────────────────────────────────────
# Public endpoints for website chat bubble
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/start", response_model=ChatConversationResponse)
def start_conversation(
    payload: ChatStartRequest,
    db: Session = Depends(get_db),
):
    """Start a new chat conversation from the website."""
    conv_id = str(uuid.uuid4())

    # Check for existing waiting conversation from same email
    existing = (
        db.query(ChatConversation)
        .filter(
            ChatConversation.customer_email == payload.customer_email,
            ChatConversation.status == "waiting",
        )
        .first()
    )

    if existing:
        return _conversation_to_response(existing, db)

    conv = ChatConversation(
        id=conv_id,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        status="waiting",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    return _conversation_to_response(conv, db)


@router.post("/conversations/{conversation_id}/customer-message", response_model=ChatMessageResponse)
def customer_send_message(
    conversation_id: str,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
):
    """Customer sends a message (public endpoint)."""
    conv = (
        db.query(ChatConversation)
        .filter(ChatConversation.id == conversation_id)
        .first()
    )
    if not conv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    message = ChatMessage(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        sender_type="customer",
        sender_name=conv.customer_name,
        content=payload.content,
        read=False,
    )
    db.add(message)

    conv.unread_count += 1
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)

    return _message_to_response(message)


@router.get("/conversations/{conversation_id}/messages/customer", response_model=list[ChatMessageResponse])
def customer_get_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    """Customer gets messages in their conversation."""
    conv = (
        db.query(ChatConversation)
        .filter(ChatConversation.id == conversation_id)
        .first()
    )
    if not conv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [_message_to_response(m) for m in messages]
