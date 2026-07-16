import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models import Chat, User
from app.schemas import ChatCreate, ChatResponse, ChatUpdate, Message

router = APIRouter(prefix="/api/chats", tags=["chats"])


def parse_messages(raw: str | list | None) -> list[dict]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return raw
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def safe_iso(dt: datetime | None) -> str:
    if dt is None:
        return datetime.now(timezone.utc).isoformat()
    return dt.isoformat()


def chat_to_response(chat: Chat) -> ChatResponse:
    messages = parse_messages(chat.messages)
    return ChatResponse(
        id=chat.id,
        title=chat.title,
        model=chat.model,
        mode=chat.mode,
        messages=[
            Message(**m)
            for m in messages
            if isinstance(m, dict) and "role" in m and "content" in m
        ],
        pinned=chat.pinned,
        is_favorite=chat.is_favorite,
        is_archived=chat.is_archived,
        folder_id=chat.folder_id,
        tags=chat.tags,
        created_at=safe_iso(chat.created_at),
        last_message_at=safe_iso(chat.last_message_at),
    )


@router.get("")
async def list_chats(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await session.execute(
        select(Chat)
        .where(Chat.user_id == user.id)
        .order_by(Chat.last_message_at.desc())
    )
    return [chat_to_response(c) for c in result.scalars()]


@router.post("", response_model=ChatResponse)
async def create_chat(
    body: ChatCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    chat = Chat(
        user_id=user.id,
        title=body.title,
        model=body.model,
        mode=body.mode,
    )
    session.add(chat)
    await session.commit()
    await session.refresh(chat)
    return chat_to_response(chat)


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await session.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == user.id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat_to_response(chat)


@router.put("/{chat_id}", response_model=ChatResponse)
async def update_chat(
    chat_id: str,
    body: ChatUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await session.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == user.id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if body.title is not None:
        chat.title = body.title
    if body.messages is not None:
        chat.messages = json.dumps([m.model_dump() for m in body.messages])
    if body.pinned is not None:
        chat.pinned = body.pinned
    if body.is_favorite is not None:
        chat.is_favorite = body.is_favorite
    if body.is_archived is not None:
        chat.is_archived = body.is_archived
    if body.folder_id is not None:
        chat.folder_id = body.folder_id
    if body.tags is not None:
        chat.tags = body.tags

    chat.last_message_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(chat)
    return chat_to_response(chat)


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await session.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == user.id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    await session.delete(chat)
    await session.commit()
    return {"ok": True}
