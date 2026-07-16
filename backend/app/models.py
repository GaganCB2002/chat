import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(64), default="")
    last_name: Mapped[str] = mapped_column(String(64), default="")
    age: Mapped[int | None] = mapped_column(default=None, nullable=True)
    email: Mapped[str] = mapped_column(String(256), unique=True, index=True, default="")
    hashed_password: Mapped[str] = mapped_column(String(256))
    reset_token: Mapped[str | None] = mapped_column(
        String(256), nullable=True, default=None
    )
    reset_token_expiry: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True, default=None
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    chats: Mapped[list["Chat"]] = relationship(
        "Chat", back_populates="user", cascade="all, delete-orphan"
    )
    tokens: Mapped[list["AuthToken"]] = relationship(
        "AuthToken", back_populates="user", cascade="all, delete-orphan"
    )


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    token: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped["User"] = relationship("User", back_populates="tokens")


class Chat(Base):
    __tablename__ = "chats"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(256), default="New Chat")
    model: Mapped[str] = mapped_column(String(64))
    mode: Mapped[str] = mapped_column(String(16), default="offline")
    messages: Mapped[str] = mapped_column(Text, default="[]")
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    folder_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_message_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped["User"] = relationship("User", back_populates="chats")
