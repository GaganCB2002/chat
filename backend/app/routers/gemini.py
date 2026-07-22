import os

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas import GeminiChatRequest

router = APIRouter(prefix="/api/gemini", tags=["gemini"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY", "")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
REQUEST_TIMEOUT = 60

ALLOWED_MODELS = {
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
}

MODEL_ALIASES = {
    "gemini-pro": "gemini-2.5-flash",
    "gemini-3.5-flash": "gemini-2.5-flash",
}

_client: httpx.AsyncClient | None = None

def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=httpx.Timeout(REQUEST_TIMEOUT))
    return _client


@router.post("/chat")
async def gemini_chat(body: GeminiChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Gemini API key not configured. Set GEMINI_API_KEY in .env",
        )

    model_name = MODEL_ALIASES.get(body.model, body.model)
    if model_name not in ALLOWED_MODELS:
        model_name = "gemini-2.5-flash"

    gemini_messages = []
    for m in body.messages:
        role = "model" if m.role == "assistant" else "user"
        gemini_messages.append({"role": role, "parts": [{"text": m.content}]})

    combined = []
    for msg in gemini_messages:
        if combined and combined[-1]["role"] == msg["role"]:
            combined[-1]["parts"][0]["text"] += "\n\n" + msg["parts"][0]["text"]
        else:
            combined.append(msg)

    url = f"{GEMINI_BASE_URL}/{model_name}:streamGenerateContent?alt=sse"
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}

    client = get_client()
    try:
        res = await client.post(url, json={"contents": combined}, headers=headers)
        if not res.is_success:
            detail = "Gemini API error"
            try:
                detail = res.json().get("error", {}).get("message", res.text[:500])
            except Exception:
                detail = res.text[:500]
            raise HTTPException(status_code=res.status_code, detail=detail)

        async def stream_sse():
            buffer = ""
            async for chunk in res.aiter_bytes():
                decoded = chunk.decode("utf-8", errors="replace")
                buffer += decoded
                lines = buffer.split("\n")
                buffer = lines.pop() or ""
                for line in lines:
                    if line.startswith("data: "):
                        yield line + "\n"
            if buffer:
                yield buffer + "\n"

        return StreamingResponse(
            stream_sse(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Gemini API request timed out")
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Gemini API not reachable. Check your internet connection.",
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502, detail=f"Gemini API request failed: {str(e)[:200]}"
        )
