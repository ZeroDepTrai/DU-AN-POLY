import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import create_access_token, get_current_user, hash_password, require_admin, require_customer_support
from app.models import User, UserRole
from app.schemas import (
    SupportUserCreate,
    SupportUserResponse,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[SupportUserResponse])
def list_users(
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """List all users (admin and customer support can view)."""
    users = db.query(User).order_by(User.id.desc()).all()
    return [
        SupportUserResponse(
            id=u.id,
            email=u.email,
            role=u.role,
            name=u.name,
            created_at=str(u.created_at) if u.created_at else None,
        )
        for u in users
    ]


@router.post("/support", response_model=SupportUserResponse)
def create_support_user(
    payload: SupportUserCreate,
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """Create a customer support account (admin or support can create)."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=payload.email,
        name=payload.email.split("@")[0],
        password_hash=hash_password(payload.password),
        role=UserRole.customer_support,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return SupportUserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        name=user.name,
        created_at=str(user.created_at) if user.created_at else None,
    )


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """Delete a user (admin and customer support, cannot delete self)."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.delete(user)
    db.commit()
    return {"ok": True}


@router.post("/support/login", response_model=TokenResponse)
def support_login(
    payload: SupportUserCreate,
    db: Session = Depends(get_db),
):
    """Login for support staff - returns token and user info."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    from app.deps import verify_password
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if user.role not in [UserRole.admin, UserRole.customer_support]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a support account",
        )

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token)
