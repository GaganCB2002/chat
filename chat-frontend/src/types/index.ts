export type MessageRole = 'user' | 'assistant';
export type MessageAction = 'none' | 'like' | 'dislike';
export type ViewMode = 'chat' | 'dashboard';
export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'base' | 'lg';
export type ModelId = 'gemma2' | 'llama3' | 'gemini-pro' | 'qwen3.5';

export interface InstalledModel {
  name: string;
  modified_at: string;
  size: number;
}

export interface OllamaStatus {
  connected: boolean;
  checking: boolean;
  availableModels: InstalledModel[];
}
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ModelOption {
  id: ModelId;
  name: string;
  provider: string;
  description: string;
  icon: string;
}

export type MessageStatus = 'sending' | 'sent' | 'generating' | 'completed' | 'failed' | 'interrupted';

export interface ThinkingStep {
  label: string;
  status: 'pending' | 'active' | 'completed';
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isEditing?: boolean;
  action?: MessageAction;
  tokens?: number;
  pinned?: boolean;
  status?: MessageStatus;
  thinkingSteps?: ThinkingStep[];
}

export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
  pinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  messages: Message[];
  folderId?: string;
  tags?: string[];
  model?: ModelId;
}

export interface Folder {
  id: string;
  name: string;
  chatIds: string[];
  icon?: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  usageCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
}

export interface AppSettings {
  theme: ThemeMode;
  fontSize: FontSize;
  sendOnEnter: boolean;
  showTimestamps: boolean;
  showTokenCount: boolean;
  enableSuggestions: boolean;
  model: ModelId;
  language: string;
  reducedMotion: boolean;
  highContrast: boolean;
  focusMode: boolean;
  readingMode: boolean;
}

export interface DeveloperInfo {
  apiStatus: 'online' | 'degraded' | 'offline';
  backendStatus: 'online' | 'degraded' | 'offline';
  databaseStatus: 'online' | 'degraded' | 'offline';
  currentModel: ModelId;
  responseTime: number;
  environment: 'production' | 'staging' | 'development';
  version: string;
  latencyMs: number;
  streaming: boolean;
}

export interface Analytics {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  activeToday: number;
  avgMessagesPerConversation: number;
  topTopics: { topic: string; count: number }[];
  weeklyActivity: { day: string; value: number }[];
  dailyStats: { label: string; value: number; trend: number }[];
}

export interface UserCredits {
  plan: 'Free' | 'Pro' | 'Enterprise';
  inputCreditsUsed: number;
  inputCreditsLimit: number;
  outputCreditsUsed: number;
  outputCreditsLimit: number;
  dailyRequestsUsed: number;
  dailyRequestsLimit: number;
  totalTokensConsumed: number;
  avgTokensPerRequest: number;
  contextWindowUsed: number;
  contextWindowMax: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: Date;
}

export interface TokenQuota {
  dailyTokenLimit: number;
  dailyTokensUsed: number;
  dailyRequestLimit: number;
  dailyRequestsUsed: number;
  plan: 'Free' | 'Pro' | 'Enterprise';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CaptchaData {
  code: string;
  generatedAt: number;
  expiresAt: number;
}

export interface QueueItem {
  id: string;
  content: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
}

export interface Toast {
  id: string;
  variant: ToastType;
  title: string;
  description: string;
  duration?: number;
}
