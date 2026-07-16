from pydantic import BaseModel


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    age: int | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    token: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    username: str
    first_name: str
    last_name: str
    name: str = ""
    email: str
    age: int | None
    created_at: str = ""


class Message(BaseModel):
    role: str
    content: str


class ChatCreate(BaseModel):
    title: str = "New Chat"
    model: str = "qwen3.5"
    mode: str = "offline"


class ChatUpdate(BaseModel):
    title: str | None = None
    messages: list[Message] | None = None
    pinned: bool | None = None
    is_favorite: bool | None = None
    is_archived: bool | None = None
    folder_id: str | None = None
    tags: str | None = None


class ChatResponse(BaseModel):
    id: str
    title: str
    model: str
    mode: str
    messages: list[Message]
    pinned: bool
    is_favorite: bool
    is_archived: bool
    folder_id: str | None
    tags: str | None
    created_at: str
    last_message_at: str


class OllamaChatRequest(BaseModel):
    model: str
    messages: list[Message]
    stream: bool = True


class OllamaGenerateRequest(BaseModel):
    model: str
    prompt: str
    stream: bool = True


class OllamaPullRequest(BaseModel):
    name: str
    stream: bool = True


class GeminiChatRequest(BaseModel):
    model: str = "gemini-3.5-flash"
    messages: list[Message]
