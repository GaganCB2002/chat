import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (create_access_token, get_current_user, hash_password,
                      verify_password)
from app.database import get_session
from app.email_utils import send_welcome_email
from app.models import User
from app.schemas import (ChangePasswordRequest, ForgotPasswordRequest,
                         LoginRequest, RegisterRequest, ResetPasswordRequest,
                         TokenResponse, UserResponse, VerifyOtpRequest)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, session: AsyncSession = Depends(get_session)):
    first_name = body.first_name.strip()
    last_name = body.last_name.strip()
    email = body.email.strip().lower()
    age = body.age

    if not first_name:
        raise HTTPException(status_code=400, detail="First name is required")
    if not last_name:
        raise HTTPException(status_code=400, detail="Last name is required")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not body.password or len(body.password) < 4:
        raise HTTPException(
            status_code=400, detail="Password must be at least 4 characters"
        )
    if age is not None and (age < 1 or age > 150):
        raise HTTPException(status_code=400, detail="Age must be between 1 and 150")

    existing = await session.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    base_username = f"{first_name.lower()}.{last_name.lower()}".replace(" ", "")
    username = base_username
    counter = 1
    while True:
        existing_u = await session.execute(
            select(User).where(User.username == username)
        )
        if not existing_u.scalar_one_or_none():
            break
        username = f"{base_username}{counter}"
        counter += 1

    user = User(
        username=username,
        first_name=first_name,
        last_name=last_name,
        age=age,
        email=email,
        hashed_password=hash_password(body.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = await create_access_token(user.id, session)

    await send_welcome_email(email, user.first_name)

    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(User).where(
            or_(User.username == body.username, User.email == body.username)
        )
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = await create_access_token(user.id, session)
    return TokenResponse(access_token=token)


@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordRequest, session: AsyncSession = Depends(get_session)
):
    email = body.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    otp = f"{secrets.randbelow(1000000):06d}"
    user.reset_token = otp
    user.reset_token_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    await session.commit()

    return {"message": "OTP generated successfully", "otp": otp}


@router.post("/verify-otp")
async def verify_otp(
    body: VerifyOtpRequest, session: AsyncSession = Depends(get_session)
):
    email = body.email.strip().lower()
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.reset_token or not user.reset_token_expiry:
        raise HTTPException(status_code=400, detail="No reset token requested")
    if user.reset_token != body.token:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    expiry = user.reset_token_expiry
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="OTP has expired")

    return {"message": "OTP verified"}


@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordRequest, session: AsyncSession = Depends(get_session)
):
    email = body.email.strip().lower()
    if len(body.new_password) < 4:
        raise HTTPException(
            status_code=400, detail="Password must be at least 4 characters"
        )

    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.reset_token or not user.reset_token_expiry:
        raise HTTPException(status_code=400, detail="No reset token requested")
    if user.reset_token != body.token:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    expiry = user.reset_token_expiry
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user.hashed_password = hash_password(body.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    await session.commit()
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 4:
        raise HTTPException(
            status_code=400, detail="New password must be at least 4 characters"
        )

    user.hashed_password = hash_password(body.new_password)
    await session.commit()
    return {"message": "Password changed successfully"}


@router.get("/me", response_model=UserResponse | None)
async def get_me(user: User | None = Depends(get_current_user)):
    if user is None:
        return None
    full_name = f"{user.first_name} {user.last_name}".strip() or user.username
    return UserResponse(
        id=user.id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        name=full_name,
        email=user.email,
        age=user.age,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )
