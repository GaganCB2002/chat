import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chat, Message, Folder, ViewMode, UploadedFile, QueueItem } from '../types';
import { createNewChat } from '../mock';
import { FOLDERS, MODEL_OLLAMA_MAP, MODELS } from '../constants';
import { chatCompletion } from '../api/ollama';
import { chatCompletionGemini } from '../api/gemini';
import { useSettingsStore } from './settingsStore';
import { useToastStore } from './toastStore';
import { useAuthStore } from './authStore';
import { slugify } from '../utils/format';

function getChatUrl(title: string, id: string): string {
  return `/chat/${slugify(title)}--${id}`;
}

function getUserStorageKey(): string {
  try {
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated && auth.user?.id) {
      return `kortex-chats-${auth.user.id}`;
    }
  } catch {}
  return 'kortex-chats-guest';
}

function migrateFromLegacyStorage() {
  try {
    const legacy = localStorage.getItem('kortex-chats');
    if (!legacy) return;
    const target = getUserStorageKey();
    if (!localStorage.getItem(target)) {
      localStorage.setItem(target, legacy);
    }
    localStorage.removeItem('kortex-chats');
  } catch {}
}

interface ChatState {
  chats: Chat[];
  folders: Folder[];
  currentChatId: string | null;
  isTyping: boolean;
  streamingContent: string;
  view: ViewMode;
  sidebarOpen: boolean;
  ollamaError: string | null;
  uploadedFiles: UploadedFile[];
  currentInputText: string;
  messageQueue: QueueItem[];
  queueHistory: QueueItem[];
  processingQueue: boolean;

  setCurrentInputText: (text: string) => void;
  addFile: (file: File) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setTyping: (v: boolean) => void;
  addMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void;
  setSidebarOpen: (v: boolean) => void;
  setView: (v: ViewMode) => void;
  selectChat: (id: string) => void;
  newChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  processQueue: () => Promise<void>;
  processQueueItem: (content: string, queueItemId: string) => Promise<void>;
  updateQueueProgress: (id: string, progress: number) => void;
  stopGeneration: () => void;
  deleteMessage: (id: string) => void;
  editMessage: (id: string, content: string) => void;
  likeMessage: (id: string) => void;
  dislikeMessage: (id: string) => void;
  togglePinMessage: (id: string) => void;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  duplicateChat: (id: string) => void;
  toggleFavoriteChat: (id: string) => void;
  toggleArchiveChat: (id: string) => void;
  exportChat: (id: string) => void;
  createFolder: (name: string) => void;
  moveChatToFolder: (chatId: string, folderId: string | null) => void;
}

let abortController: AbortController | null = null;

migrateFromLegacyStorage();

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
  chats: [],
  folders: FOLDERS.map((name, i) => ({ id: `folder-${i}`, name, chatIds: [] })),
  currentChatId: null,
  isTyping: false,
  streamingContent: '',
  view: 'chat',
  sidebarOpen: true,
  ollamaError: null,
  uploadedFiles: [],
  currentInputText: '',
  messageQueue: [],
  queueHistory: [],
  processingQueue: false,

  setCurrentInputText: (text) => set({ currentInputText: text }),

  addFile: (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const uf: UploadedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: (typeof reader.result === 'string' ? reader.result : ''),
        uploadedAt: new Date(),
      };
      set((s) => ({ uploadedFiles: [...s.uploadedFiles, uf] }));
      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
      useToastStore.getState().addToast('success', `Uploaded: ${file.name}`, `${file.type || 'Unknown type'} · ${sizeStr}`);
    };
    reader.onerror = () => {
      useToastStore.getState().addToast('error', 'Upload failed', `Could not read ${file.name}`);
    };
    reader.readAsDataURL(file);
  },

  removeFile: (id) => set((s) => ({ uploadedFiles: s.uploadedFiles.filter((f) => f.id !== id) })),

  clearFiles: () => set({ uploadedFiles: [] }),

  setTyping: (v) => set({ isTyping: v }),

  addMessage: (msg) => {
    const { currentChatId } = get();
    if (!currentChatId) return;
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
      tokens: Math.ceil(msg.content.length / 4),
      action: 'none',
    };
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === currentChatId
          ? {
              ...c,
              title: c.messages.length === 0 && msg.role === 'user' ? msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : '') : c.title,
              messages: [...c.messages, message],
              lastMessageAt: new Date(),
            }
          : c
      ),
    }));
    if (msg.role === 'user') {
      const updated = get().chats.find((c) => c.id === currentChatId);
      if (updated && updated.messages.length === 1) {
        window.history.replaceState({}, '', getChatUrl(updated.title, currentChatId!));
      }
    }
  },

  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setView: (v) => set({ view: v }),
  selectChat: (id) => {
    const chat = get().chats.find((c) => c.id === id);
    window.history.pushState({}, '', getChatUrl(chat?.title || 'chat', id));
    set({ currentChatId: id, view: 'chat' });
  },

  newChat: () => {
    const chat = createNewChat();
    window.history.pushState({}, '', getChatUrl(chat.title, chat.id));
    set((s) => ({ chats: [chat, ...s.chats], currentChatId: chat.id, view: 'chat' }));
  },

  sendMessage: async (content) => {
    const state = get();
    const itemId = `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (state.isTyping) {
      const queueItem: QueueItem = {
        id: itemId,
        content,
        status: 'queued',
        progress: 0,
        createdAt: new Date(),
      };
      set((s) => ({ messageQueue: [...s.messageQueue, queueItem] }));
      return;
    }

    const queueItem: QueueItem = {
      id: itemId,
      content,
      status: 'processing',
      progress: 0,
      createdAt: new Date(),
    };
    set((s) => ({ messageQueue: [...s.messageQueue, queueItem] }));
    await get().processQueueItem(content, itemId);
  },

  updateQueueProgress: (id, progress) => {
    set((s) => ({
      messageQueue: s.messageQueue.map((q) => q.id === id ? { ...q, progress: Math.min(progress, 100) } : q),
    }));
  },

  processQueue: async () => {
    const state = get();
    if (state.processingQueue || state.messageQueue.length === 0) return;
    set({ processingQueue: true });
    try {
      while (get().messageQueue.length > 0) {
        const next = get().messageQueue[0];
        if (next.status === 'completed' || next.status === 'failed') {
          set((s) => ({ messageQueue: s.messageQueue.slice(1) }));
          continue;
        }
        set((s) => ({
          messageQueue: s.messageQueue.map((q) => q.id === next.id ? { ...q, status: 'processing' } : q),
        }));
        await get().processQueueItem(next.content, next.id);
      }
    } catch (e) {
      console.error('Queue processing error:', e);
    } finally {
      set({ processingQueue: false });
    }
  },

  processQueueItem: async (content: string, queueItemId: string) => {
    try {
      const state = get();
      let chatId = state.currentChatId;
      const chatExists = state.chats.some(c => c.id === chatId);

      if (!chatId || !chatExists) {
        const chat = createNewChat();
        set((s) => ({ chats: [chat, ...s.chats], currentChatId: chat.id }));
        chatId = chat.id;
        window.history.pushState({}, '', getChatUrl(chat.title, chatId));
      }

      const auth = useAuthStore.getState();
      if (!auth.isAuthenticated && auth.trialUsed >= auth.trialLimit) {
        auth.setShowAuthModal(true, 'register');
        set({ ollamaError: 'Free trial used. Create an account to continue.' });
        get().updateQueueProgress(queueItemId, 100);
        set((s) => ({
          messageQueue: s.messageQueue.map((q) => q.id === queueItemId ? { ...q, status: 'failed' } : q),
        }));
        return;
      }
      if (!auth.isAuthenticated) {
        auth.incrementTrial();
      }

      const store = useSettingsStore.getState();
      const settings = store.settings;
      if (store.mode === 'online' && settings.model !== 'gemini-pro' && !store.ollamaStatus.connected) {
        set({ ollamaError: 'Ollama is not connected. Start Ollama and try again.' });
        get().updateQueueProgress(queueItemId, 100);
        set((s) => ({
          messageQueue: s.messageQueue.map((q) => q.id === queueItemId ? { ...q, status: 'failed' } : q),
        }));
        return;
      }

      const files = state.uploadedFiles;
      let fileContext = '';
      if (files.length > 0) {
        const fileDescriptions = files.map((f) => {
          const isImage = f.type.startsWith('image/');
          if (isImage) {
            return `[ attached image: ${f.name} ]`;
          }
          return `[ attached file: ${f.name} (${f.type}) ]`;
        });
        fileContext = fileDescriptions.join('\n') + '\n\n';
      }

      const fullContent = fileContext + content;
      get().clearFiles();

      get().updateQueueProgress(queueItemId, 5);

      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: fullContent,
        timestamp: new Date(),
        tokens: Math.ceil(fullContent.length / 4),
        status: 'sent',
      };

      set((s) => ({
        ollamaError: null,
        chats: s.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                title: c.messages.length === 0 ? content.slice(0, 40) + (content.length > 40 ? '...' : '') : c.title,
                messages: [...c.messages, userMsg],
                lastMessageAt: new Date(),
              }
            : c
        ),
      }));

      const activeModel = settings.model;
      const ollamaModel = MODEL_OLLAMA_MAP[activeModel] || activeModel;

      abortController = new AbortController();
      const signal = abortController.signal;

      set({ isTyping: true, streamingContent: '' });

      const assistantId = `msg-${Date.now() + 1}`;

      get().updateQueueProgress(queueItemId, 10);
      const inputTokens = Math.ceil(fullContent.length / 4);
      useSettingsStore.getState().useTokens(inputTokens, 1);

      try {
      const messages = get().chats.find((c) => c.id === chatId)?.messages ?? [];
      const ollamaMessages = [
        {
          role: 'system' as const,
          content: `You are ${MODELS.find(m => m.id === activeModel)?.name || 'an AI assistant'}. You must be 100% accurate and precise. Do not claim to be any other model. Never hallucinate. Always respond in English only.`,
        },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        }))
      ];

      let fullResponse = '';
      let tokenCount = 0;
      let unrecordedTokens = 0;
      
      const onToken = (token: string) => {
        fullResponse += token;
        tokenCount++;
        unrecordedTokens++;
        const progress = Math.min(10 + Math.floor((tokenCount / 200) * 85), 95);
        get().updateQueueProgress(queueItemId, progress);
        set({ streamingContent: fullResponse });

        if (unrecordedTokens >= 15) {
          useSettingsStore.getState().useTokens(unrecordedTokens, 0);
          unrecordedTokens = 0;
        }
      };
      
      if (store.mode === 'online' && activeModel === 'gemini-pro') {
        const geminiMessages = [
          { role: 'user' as const, content: 'You must always respond in English only.' },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        ];
        await chatCompletionGemini(geminiMessages, onToken, signal);
      } else {
        await chatCompletion(ollamaModel, ollamaMessages, onToken, signal);
      }

      get().updateQueueProgress(queueItemId, 100);

      if (unrecordedTokens > 0) {
        useSettingsStore.getState().useTokens(unrecordedTokens, 0);
      }

      if (signal.aborted) {
        set((s) => ({
          isTyping: false,
          streamingContent: '',
          chats: s.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    {
                      id: assistantId,
                      role: 'assistant',
                      content: fullResponse,
                      timestamp: new Date(),
                      tokens: Math.ceil(fullResponse.length / 4),
                      action: 'none',
                      status: 'interrupted',
                    } as Message,
                  ],
                  lastMessageAt: new Date(),
                }
              : c
          ),
          messageQueue: s.messageQueue.map((q) => q.id === queueItemId ? { ...q, status: 'failed' } : q),
          queueHistory: [
            ...s.queueHistory,
            ...s.messageQueue.filter((q) => q.id === queueItemId).map((q) => ({ ...q, status: 'failed' as const })),
          ],
        }));
        get().processQueue().catch(() => {});
        return;
      }

      set((s) => ({
        isTyping: false,
        streamingContent: '',
        chats: s.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: assistantId,
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: new Date(),
                    tokens: Math.ceil(fullResponse.length / 4),
                    action: 'none',
                    status: 'completed',
                    thinkingSteps: [
                      { label: 'Understanding Request', status: 'completed' },
                      { label: 'Planning', status: 'completed' },
                      { label: 'Searching Context', status: 'completed' },
                      { label: 'Writing Response', status: 'completed' },
                      { label: 'Completed', status: 'completed' },
                    ]
                  } as Message,
                ],
                lastMessageAt: new Date(),
              }
            : c
        ),
        messageQueue: s.messageQueue.map((q) =>
          q.id === queueItemId ? { ...q, status: 'completed', progress: 100 } : q
        ),
        queueHistory: [
          ...s.queueHistory,
          ...s.messageQueue.filter((q) => q.id === queueItemId).map((q) => ({ ...q, status: 'completed' as const, progress: 100 })),
        ],
      }));

      // Token consumption is now tracked live during the stream

      // Auto-summarize title after the first exchange
      const updatedChat = get().chats.find((c) => c.id === chatId);
      if (updatedChat && updatedChat.messages.length === 2 && updatedChat.title.endsWith('...')) {
        const summaryMessages = [
          { role: 'user' as const, content: `Summarize the following conversation in a short 3-5 word English title. Only return the title in English, no quotes or extra text.\n\nUser: ${updatedChat.messages[0].content}\nAssistant: ${updatedChat.messages[1].content}` }
        ];
        
        try {
          let title = '';
          if (store.mode === 'online' && activeModel === 'gemini-pro') {
            title = await chatCompletionGemini(summaryMessages);
          } else {
            title = await chatCompletion(ollamaModel, summaryMessages);
          }
          if (title) {
            get().renameChat(chatId, title.trim().replace(/^["']|["']$/g, ''));
          }
        } catch (e) {
          console.error('Failed to auto-summarize title', e);
        }
      }

    } catch (err: unknown) {
      set({ isTyping: false, streamingContent: '' });
      const msg = err instanceof Error ? err.message : 'Failed to connect to Ollama';
      set({ ollamaError: msg });
      useToastStore.getState().addToast('error', 'Ollama Error', msg);
      get().updateQueueProgress(queueItemId, 100);
      set((s) => ({
        messageQueue: s.messageQueue.map((q) => q.id === queueItemId ? { ...q, status: 'failed' } : q),
        queueHistory: [
          ...s.queueHistory,
          ...s.messageQueue.filter((q) => q.id === queueItemId).map((q) => ({ ...q, status: 'failed' as const, progress: 100 })),
        ],
      }));
    }

    get().processQueue().catch(() => {});
  } catch (e) {
    console.error('processQueueItem fatal error:', e);
    set((s) => ({
      isTyping: false,
      streamingContent: '',
      messageQueue: s.messageQueue.map((q) => q.id === queueItemId ? { ...q, status: 'failed', progress: 100 } : q),
    }));
  }
  },

  stopGeneration: () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    set((s) => ({
      isTyping: false,
      streamingContent: '',
      messageQueue: s.messageQueue.map((q) => q.status === 'processing' ? { ...q, status: 'failed', progress: 100 } : q),
      queueHistory: [
        ...s.queueHistory,
        ...s.messageQueue.filter((q) => q.status === 'processing').map((q) => ({ ...q, status: 'failed' as const, progress: 100 })),
      ],
    }));
    get().processQueue().catch(() => {});
  },

  togglePinMessage: (id) => {
    const { currentChatId } = get();
    if (!currentChatId) return;
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === currentChatId
          ? { ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)) }
          : c
      ),
    }));
  },

  deleteMessage: (id) => {
    const { currentChatId } = get();
    if (!currentChatId) return;
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === currentChatId ? { ...c, messages: c.messages.filter((m) => m.id !== id) } : c
      ),
    }));
  },

  editMessage: (id, content) => {
    const { currentChatId } = get();
    if (!currentChatId) return;
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === currentChatId
          ? { ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, content, isEditing: false } : m)) }
          : c
      ),
    }));
  },

  likeMessage: (id) => {
    const { currentChatId } = get();
    if (!currentChatId) return;
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === currentChatId
          ? { ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, action: m.action === 'like' ? 'none' : 'like' } : m)) }
          : c
      ),
    }));
  },

  dislikeMessage: (id) => {
    const { currentChatId } = get();
    if (!currentChatId) return;
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === currentChatId
          ? { ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, action: m.action === 'dislike' ? 'none' : 'dislike' } : m)) }
          : c
      ),
    }));
  },

  deleteChat: (id) => {
    set((s) => ({
      chats: s.chats.filter((c) => c.id !== id),
      folders: s.folders.map((f) => ({ ...f, chatIds: f.chatIds.filter((cid) => cid !== id) })),
      currentChatId: s.currentChatId === id ? null : s.currentChatId,
    }));
  },

  renameChat: (id, title) => {
    set((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, title } : c)) }));
    if (get().currentChatId === id) {
      window.history.replaceState({}, '', getChatUrl(title, id));
    }
  },

  duplicateChat: (id) => {
    const state = get();
    const chatToDuplicate = state.chats.find((c) => c.id === id);
    if (!chatToDuplicate) return;
    
    const newChat: Chat = {
      ...chatToDuplicate,
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${chatToDuplicate.title} (Copy)`,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      messages: chatToDuplicate.messages.map(m => ({ ...m, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      pinned: false,
      isFavorite: false,
      isArchived: false,
    };
    
    set((s) => ({ chats: [newChat, ...s.chats], currentChatId: newChat.id, view: 'chat' }));
    window.history.pushState({}, '', getChatUrl(newChat.title, newChat.id));
  },

  toggleFavoriteChat: (id) => {
    set((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)) }));
  },

  toggleArchiveChat: (id) => {
    set((s) => ({ chats: s.chats.map((c) => (c.id === id ? { ...c, isArchived: !c.isArchived, pinned: false } : c)), currentChatId: s.currentChatId === id ? null : s.currentChatId }));
  },

  exportChat: (id) => {
    const state = get();
    const chat = state.chats.find(c => c.id === id);
    if (!chat) return;

    let content = `# ${chat.title}\n\n`;
    chat.messages.forEach(m => {
      content += `### ${m.role === 'user' ? 'User' : 'Assistant'} (${new Date(m.timestamp).toLocaleString()})\n\n`;
      content += `${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  createFolder: (name) => {
    const folder: Folder = { id: `folder-${Date.now()}`, name, chatIds: [] };
    set((s) => ({ folders: [...s.folders, folder] }));
  },

  moveChatToFolder: (chatId, folderId) => {
    set((s) => ({
      chats: s.chats.map((c) => (c.id === chatId ? { ...c, folderId: folderId ?? undefined } : c)),
      folders: s.folders.map((f) => ({
        ...f,
        chatIds: f.id === folderId
          ? [...f.chatIds.filter((id) => id !== chatId), chatId]
          : f.chatIds.filter((id) => id !== chatId),
      })),
    }));
  },
    }),
    {
      name: 'kortex-chats',
      partialize: (state) => ({
        chats: state.chats,
        folders: state.folders,
        currentChatId: state.currentChatId,
        view: state.view,
        sidebarOpen: state.sidebarOpen,
        uploadedFiles: state.uploadedFiles,
      }),
      storage: {
        getItem: (_name) => {
          try {
            const key = getUserStorageKey();
            const str = localStorage.getItem(key);
            if (!str) return null;
            return JSON.parse(str, (key, value) => {
              if (['timestamp', 'createdAt', 'lastMessageAt', 'uploadedAt'].includes(key) && typeof value === 'string') {
                return new Date(value);
              }
              return value;
            });
          } catch {
            return null;
          }
        },
        setItem: (_name, value) => { try { localStorage.setItem(getUserStorageKey(), JSON.stringify(value)); } catch { /* ignore storage errors */ } },
        removeItem: (_name) => { try { localStorage.removeItem(getUserStorageKey()); } catch { /* ignore storage errors */ } },
      },
    }
  )
);

function afterRehydrate() {
  const { chats, currentChatId } = useChatStore.getState();
  if (!currentChatId || !chats.some(c => c.id === currentChatId)) {
    const latest = chats.length > 0 ? chats[0] : null;
    if (latest) {
      useChatStore.getState().selectChat(latest.id);
    } else {
      useChatStore.getState().newChat();
    }
  }
}

useAuthStore.subscribe((newState, oldState) => {
  const newId = newState.isAuthenticated ? newState.user?.id : null;
  const oldId = oldState.isAuthenticated ? oldState.user?.id : null;
  if (newId !== oldId) {
    if (newState.isAuthenticated) {
      migrateFromLegacyStorage();
      const result = useChatStore.persist.rehydrate();
      if (result instanceof Promise) { result.then(afterRehydrate); } else { afterRehydrate(); }
    } else {
      const fresh = createNewChat();
      useChatStore.setState({
        chats: [fresh],
        currentChatId: fresh.id,
        isTyping: false,
        streamingContent: '',
        ollamaError: null,
        uploadedFiles: [],
        messageQueue: [],
        queueHistory: [],
        processingQueue: false,
        view: 'chat',
      });
      window.history.pushState({}, '', getChatUrl(fresh.title, fresh.id));
    }
  }
});

