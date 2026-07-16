import type { AppSettings, ModelOption } from '../types';

export const APP_NAME = 'Kortex';
export const APP_DESCRIPTION = 'Enterprise AI platform for professionals.';
export const APP_VERSION = '2.1.0';
export const ENVIRONMENT = 'development' as const;

export const SHORTCUTS = {
  SEND: 'Ctrl+Enter',
  NEW_CHAT: 'Ctrl+N',
  CLEAR_INPUT: 'Ctrl+L',
  TOGGLE_THEME: 'Ctrl+Shift+T',
  COMMAND_PALETTE: 'Ctrl+K',
  SEARCH: 'Ctrl+Shift+F',
  FOCUS_INPUT: '/',
  TOGGLE_SIDEBAR: 'Ctrl+B',
  ESCAPE: 'Escape',
} as const;

export const CHARACTER_LIMIT = 8000;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

export const MODELS: ModelOption[] = [
  { id: 'qwen3.5', name: 'Qwen 3.5', provider: 'Alibaba via Ollama', description: '2B local model (~2.7GB)', icon: '🧠' },
  { id: 'gemma2', name: 'Gemma 2', provider: 'Google via Ollama', description: 'Lightweight 2B local model (~1.6GB)', icon: '🟢' },
  { id: 'llama3', name: 'Llama 3.2', provider: 'Meta via Ollama', description: '1.3B local model (~1.3GB)', icon: '🎯' },
  { id: 'gemini-pro', name: 'Gemini 3.5 Flash', provider: 'Google', description: 'Fast online model', icon: '✨' },
];

export const MODEL_OLLAMA_MAP: Record<string, string> = {
  'qwen3.5': 'qwen3.5:2b',
  'gemma2': 'gemma2:2b',
  'llama3': 'llama3.2:1b',
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fontSize: 'base',
  sendOnEnter: true,
  showTimestamps: true,
  showTokenCount: false,
  enableSuggestions: false,
  model: 'qwen3.5',
  language: 'en',
  reducedMotion: false,
  highContrast: false,
  focusMode: false,
  readingMode: false,
};

export const FOLDERS = ['Work', 'Personal', 'Research', 'Learning'];

export const THEME_CYCLE: Record<string, 'light' | 'dark' | 'system'> = { light: 'dark', dark: 'system', system: 'light' };
export const THEME_ICONS: Record<string, string> = { light: 'Moon', dark: 'Monitor', system: 'Sun' };
