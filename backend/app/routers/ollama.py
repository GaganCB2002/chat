import os

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse

from app.schemas import (OllamaChatRequest, OllamaGenerateRequest,
                         OllamaPullRequest)

router = APIRouter(prefix="/api/ollama", tags=["ollama"])
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
REQUEST_TIMEOUT = 120
STREAM_TIMEOUT = 600

_client: httpx.AsyncClient | None = None


def get_client(timeout: int = REQUEST_TIMEOUT) -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=httpx.Timeout(timeout))
    return _client


@router.get("/")
async def check_ollama():
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(f"{OLLAMA_HOST}/")
            return Response(content=res.text, media_type="text/plain")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Ollama not reachable")


@router.get("/tags")
async def list_models():
    try:
        client = get_client(10)
        res = await client.get(f"{OLLAMA_HOST}/api/tags")
        if not res.is_success:
            raise HTTPException(
                status_code=res.status_code, detail="Ollama API error"
            )
        return res.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Ollama not reachable")


async def proxy_post(path: str, payload: dict, stream: bool):
    try:
        client = get_client(STREAM_TIMEOUT if stream else REQUEST_TIMEOUT)
        res = await client.post(f"{OLLAMA_HOST}{path}", json=payload)
        if not res.is_success:
            detail = "Ollama API error"
            try:
                detail = res.json().get("error", res.text)
            except Exception:
                detail = res.text[:500]
            raise HTTPException(status_code=res.status_code, detail=detail)
        if not stream:
            return res.json()
        return StreamingResponse(
            res.aiter_bytes(),
            media_type="application/x-ndjson",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama request timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Ollama not reachable")
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502, detail=f"Ollama request failed: {str(e)[:200]}"
        )


@router.post("/chat")
async def chat_completion(body: OllamaChatRequest):
    return await proxy_post("/api/chat", body.model_dump(), body.stream)


@router.post("/generate")
async def generate_completion(body: OllamaGenerateRequest):
    return await proxy_post("/api/generate", body.model_dump(), body.stream)


@router.post("/pull")
async def pull_model(body: OllamaPullRequest):
    return await proxy_post("/api/pull", body.model_dump(), body.stream)
