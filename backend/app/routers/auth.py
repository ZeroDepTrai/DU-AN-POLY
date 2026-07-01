import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import create_access_token, get_current_user, hash_password, verify_password
from app.email import send_verification_email
from app.models import User, UserRole, VerificationCode
from app.schemas import MessageResponse, SendCodeRequest, TokenResponse, UserLogin, UserRegister, UserResponse, VerifyCodeRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register/send-code", response_model=MessageResponse)
def send_code(payload: SendCodeRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    code = "".join(secrets.choice("0123456789") for _ in range(6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    db.query(VerificationCode).filter(
        VerificationCode.email == payload.email,
        VerificationCode.used == False,
    ).delete()

    verification = VerificationCode(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
        code=code,
        expires_at=expires_at,
        used=False,
    )
    db.add(verification)
    db.commit()

    sent = send_verification_email(payload.email, code)
    if not sent:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send verification email")

    return MessageResponse(message="Verification code sent to your email")


@router.post("/register/verify", response_model=TokenResponse)
def verify_code(payload: VerifyCodeRequest, db: Session = Depends(get_db)):
    verification = (
        db.query(VerificationCode)
        .filter(
            VerificationCode.email == payload.email,
            VerificationCode.code == payload.code,
            VerificationCode.used == False,
        )
        .first()
    )

    if verification is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    if datetime.now(timezone.utc) > verification.expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code has expired")

    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
        role=UserRole.customer,
    )
    db.add(user)
    verification.used = True
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
