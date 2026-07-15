# Kortex — Local & Online AI Chat

A fully local AI chat application that runs against **Ollama** models on your machine, with optional **Online Mode** utilizing the **Google Gemini API**. Built with React 19, TypeScript, Zustand, and Tailwind CSS.

---

## Quick Start

```bash
# Step 1: Install Ollama (https://ollama.com) and pull models
ollama pull qwen3.5:2b
ollama pull llama3.2:1b

# Step 2: Start the Ollama server (keeps models loaded in RAM)
.\start-ollama.bat

# Step 3: Install project dependencies & start
npm install
npm run dev
```

---

## Features

### Core Chat
- **Local & Cloud AI**: Switch between offline Ollama models and online Google Gemini
- **Streaming Responses**: Real-time token-by-token streaming with live markdown rendering and a blinking cursor
- **AI Thinking Panel**: Beautifully simulated thinking stages (Understanding Request → Planning → Searching Context → Writing Response)
- **Message Queue**: Messages sent during generation are queued and auto-processed sequentially
- **Flawless Interrupts**: Cancel AI response mid-generation and save the exact partial response to history
- **Message Status**: Real-time indicators for sent, generating, interrupted, and failed messages
- **Regenerate & Edit**: Re-generate responses or edit your prompts seamlessly
- **Like/Dislike**: Rate assistant responses

### File & Media
- **Drag & Drop**: Drop files/images directly onto the chat input
- **File Upload**: Upload images, documents, code, archives via paperclip button
- **File Context**: Uploaded files are automatically attached as context to messages
- **Image Preview**: Inline image rendering with click-to-open lightbox

### Chat Management & Organization
- **Chronological Sidebar**: Chats dynamically group into *Today*, *Yesterday*, *Previous 7 Days*, *Previous 30 Days*, and *Older*
- **Action Dropdowns**: Every chat features a rich context menu to Duplicate, Archive, Export, Pin, or Favorite
- **True Persistence**: Robust state recovery—refreshing the browser restores the exact sidebar layout, open chat, model selection, and uploaded files perfectly
- **Chat Export**: Download any conversation as a clean Markdown file
- **Folders**: Organize chats into custom folders (Work, Personal, Research, Learning)
- **Auto-Summarize**: Automatic title generation after the first exchange
- **Message Search**: Ctrl+F to search within the current chat with result navigation

### UI & Experience
- **Virtual Scrolling**: Integrated `react-virtuoso` guarantees 60fps scrolling and zero lag, even for conversations with thousands of messages
- **Dashboard**: Active model status, live token/request quotas, task queue progress, and recent conversations
- **Command Palette**: Ctrl+K to quickly search chats and trigger actions
- **Theme**: Light/Dark/System mode with smooth CSS transitions
- **Responsive**: Mobile-friendly with an animated collapsible sidebar
- **Keyboard Shortcuts**: Ctrl+N (new chat), Ctrl+Shift+T (theme), Ctrl+B (sidebar), and more
- **Speech-to-Text**: Voice input via Web Speech API
- **Developer Mode**: Bottom status bar showing model, Ollama status, and version info

### Markdown Support
- **Full Renderer**: Bold, italic, inline code, code blocks with copy button
- **Tables**: Full table rendering with headers
- **Strikethrough**: ~~text~~ support
- **Images**: Inline image display
- **Links**: Clickable links opening in new tab
- **Blockquotes & Lists**: Nested quotes and ordered/unordered lists

### Authentication & Security
- **User Accounts**: Register/login with localStorage persistence
- **Trial System**: 5 free messages for unauthenticated users
- **Error Boundary**: Prevents white-screen crashes with graceful error recovery
- **CAPTCHA**: Simple math captcha for registration

---

## Project Architecture

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#d2b48c', 'primaryTextColor': '#000', 'primaryBorderColor': '#8c7355', 'lineColor': '#8c7355'}}}%%
graph TD
    UI[UI Layer: React Components]
    Store[State Layer: Zustand Stores]
    API_Ollama[API Layer: Ollama HTTP Client]
    API_Gemini[API Layer: Gemini HTTP Client]
    Queue[Message Queue]
    Ollama[(Ollama Backend localhost:11434)]
    Gemini[(Google Gemini API)]

    UI -->|Dispatches Actions| Store
    Store -->|Updates State| UI
    Store -->|Queue Messages| Queue
    Queue -->|Sequential Processing| API_Ollama
    Queue -->|Sequential Processing| API_Gemini
    Store -->|chatCompletion| API_Ollama
    Store -->|chatCompletionGemini| API_Gemini
    API_Ollama --> Ollama
    API_Gemini --> Gemini
```

---

## Complete Input Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'actorBkg': '#d2b48c', 'actorBorder': '#8c7355', 'actorTextColor': '#000', 'noteBkgColor': '#e6d5b8', 'noteBorderColor': '#8c7355', 'noteTextColor': '#000', 'signalColor': '#000'}}}%%
sequenceDiagram
    participant User
    participant UI as ChatView / AppShell
    participant Store as chatStore
    participant Queue as Message Queue
    participant API as API (Ollama/Gemini)

    User->>UI: Types message & presses Enter
    UI->>Store: sendMessage(content)

    rect rgb(230, 213, 184)
        Note over Store: Phase 1: Chat Creation & Validation
        alt No active chat
            Store->>Store: createNewChat()
            Store->>UI: Update URL via pushState(/chat/:id)
        end
    end

    rect rgb(210, 180, 140)
        Note over Store: Phase 2: Queue Check
        alt Is Typing
            Store->>Queue: Queue message (pending)
            Queue-->>UI: Show pending badge
        else Not Typing
            Store->>Store: Process immediately
        end
    end

    rect rgb(230, 213, 184)
        Note over Store,API: Phase 3: Model Routing
        alt mode === 'online' AND model === 'gemini-pro'
            Store->>API: chatCompletionGemini(messages)
        else
            Store->>API: chatCompletion(ollamaModel, messages)
        end
    end

    rect rgb(210, 180, 140)
        Note over API,UI: Phase 4: Streaming & Completion
        loop Every Token
            API-->>Store: onToken(chunk)
            Store-->>UI: Update streamingContent (Live Typing)
            Store-->>Queue: Update progress (0-100%)
        end
        API-->>Store: Full Response Completed
        Store->>Store: Save Assistant Message, setTyping(false)
        Store->>Queue: Process next queued message
        Store->>UI: Render Markdown Message
    end
```

---

## Online vs Offline Mode Flow

The application intelligently routes requests based on the selected mode.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#d2b48c', 'primaryTextColor': '#000', 'primaryBorderColor': '#8c7355', 'lineColor': '#8c7355'}}}%%
graph TD
    Start([User sends message]) --> ModeCheck{Check App Mode}

    ModeCheck -->|Offline Mode| SendOllama[Send to Local Ollama Backend]
    ModeCheck -->|Online Mode| ModelCheck{Check Selected Model}

    ModelCheck -->|gemini-pro| SendGemini[Send to Google Gemini API]
    ModelCheck -->|Other Models| CheckConn{Is Ollama Connected?}

    CheckConn -->|Yes| SendOllama
    CheckConn -->|No| ShowError[Show Connection Error Toast]
```

---

## Auto-Summarize Flow

Automatically generates a descriptive title for new chats.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'actorBkg': '#d2b48c', 'actorBorder': '#8c7355', 'actorTextColor': '#000', 'noteBkgColor': '#e6d5b8', 'noteBorderColor': '#8c7355', 'noteTextColor': '#000', 'signalColor': '#000'}}}%%
sequenceDiagram
    participant Store as chatStore
    participant API as API (Ollama/Gemini)
    participant UI as TopBar / Sidebar

    Note over Store: First message exchange completes
    Store->>Store: Check if chat has exactly 2 messages
    Store->>API: Async Request: "Summarize this in 3-5 words"
    API-->>Store: Returns generated title
    Store->>Store: renameChat(chatId, newTitle)
    Store->>UI: Re-render Sidebar and TopBar with new title
```

---

## File Upload Flow

Supports both click-to-upload and drag-and-drop.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#d2b48c', 'primaryTextColor': '#000', 'primaryBorderColor': '#8c7355', 'lineColor': '#8c7355'}}}%%
graph TD
    Upload([User clicks paperclip / drags file]) --> FileReader[Read file via FileReader API]
    FileReader --> CreateObj[Create UploadedFile Object]
    CreateObj --> Base64[Convert to Base64 dataUrl]
    Base64 --> Store[Save to chatStore.uploadedFiles]
    Store --> UI[Render thumbnail in ChatInput]

    SendMsg --> Attach[Prepend file description to prompt]
    Attach --> Backend[Send to model as text context]
    Backend --> Clear[Auto-clear files after send]
```

---

## Tech Stack & Mode Mapping

### Core Stack
- **React 19 & TypeScript**: Robust, type-safe UI layer
- **Zustand**: Lightweight global state management with persist middleware
- **Tailwind CSS (v4)**: Utility-first styling with dark mode support
- **Framer Motion**: Layout-aware animations and transitions
- **Lucide React**: Clean, modern SVG icons
- **Radix UI**: Accessible dialog, dropdown, tooltip primitives

### Mode-Specific Backend Technologies

**1. Offline Mode (Local Processing)**
- **Tech:** Ollama (Local REST API) + Local GGUF Models
- **Purpose:** 100% private, air-gapped operation. All requests go to `127.0.0.1:11434`. Models kept in RAM (`OLLAMA_KEEP_ALIVE=-1`) for zero-latency responses. Supports any Ollama model (Qwen, Llama, Phi, Gemma, Mistral, etc.)

**2. Online Mode (Cloud Processing)**
- **Tech:** Google Gemini API (REST over HTTP) + Gemini 1.5 Pro
- **Purpose:** Unlocks cloud-based capabilities for advanced reasoning tasks too heavy for local hardware.

### Supported Models

| Model ID | Name | Provider | Size |
|----------|------|----------|------|
| `qwen3.5` | Qwen 3.5 | Alibaba via Ollama | 2B (~2.7GB) |
| `phi3` | Phi-3 Mini | Microsoft via Ollama | 3.8B (~2.5GB) |
| `kortex-lite` | Kortex Lite | Ollama | 3.8B (aliased to Phi-3) |
| `kortex-pro` | Kortex Pro | Ollama | 3.2B (aliased to Llama) |
| `gemma4` | Gemma 4 | Google via Ollama | 9B (~8.9GB) |
| `llama3` | Llama 3.2 | Meta via Ollama | 3.2B |
| `mistral` | Mistral | Mistral AI via Ollama | 7B |
| `gemini-pro` | Gemini 1.5 Pro | Google | Cloud (Online only) |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line |
| `Ctrl + N` | New chat |
| `Ctrl + K` | Command palette |
| `Ctrl + F` | Search in chat |
| `Ctrl + B` | Toggle sidebar |
| `Ctrl + Shift + T` | Toggle theme |
| `Ctrl + L` | Clear input |
| `Ctrl + Shift + F` | Search chats |
| `Escape` | Clear input / Close modals |
| `/` | Focus input |
