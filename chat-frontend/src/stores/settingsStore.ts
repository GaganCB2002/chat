import { create } from 'zustand';
import type { AppSettings, ThemeMode, OllamaStatus, TokenQuota } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { checkConnection, listModels } from '../api/ollama';

interface SettingsState {
  settings: AppSettings;
  devMode: boolean;
  resolvedTheme: 'light' | 'dark';
  user: { name: string; email: string; avatar: string };
  ollamaStatus: OllamaStatus;
  mode: 'online' | 'offline';
  tokenQuota: TokenQuota;
  updateSettings: (s: Partial<AppSettings>) => void;
  toggleDevMode: () => void;
  recomputeTheme: () => void;
  signOut: () => void;
  checkOllama: () => Promise<void>;
  toggleMode: () => void;
  useTokens: (count: number, requests?: number) => void;
}

const SETTINGS_KEY = 'kortex-settings';
const QUOTA_KEY = 'kortex-quota';

function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function loadQuota(): TokenQuota & { date?: string } {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const today = new Date().toDateString();
      if (data.date === today) {
        return { dailyTokenLimit: 100000, dailyTokensUsed: 0, dailyRequestLimit: 500, dailyRequestsUsed: 0, plan: 'Free', ...data };
      }
    }
  } catch {}
  return { dailyTokenLimit: 100000, dailyTokensUsed: 0, dailyRequestLimit: 500, dailyRequestsUsed: 0, plan: 'Free' };
}

function saveQuota(quota: TokenQuota) {
  try { localStorage.setItem(QUOTA_KEY, JSON.stringify({ ...quota, date: new Date().toDateString() })); } catch {}
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
  return theme;
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = loadStoredSettings();
  const initialResolved = resolveTheme(initial.theme);
  applyTheme(initialResolved);

  return {
    settings: initial,
    devMode: false,
    resolvedTheme: initialResolved,
    user: { name: '', email: '', avatar: '' },
    mode: 'online',
    ollamaStatus: { connected: false, checking: true, availableModels: [] },
    tokenQuota: loadQuota(),

    useTokens: (count, requests = 1) => set((state) => {
      const updated = {
        ...state.tokenQuota,
        dailyTokensUsed: state.tokenQuota.dailyTokensUsed + count,
        dailyRequestsUsed: state.tokenQuota.dailyRequestsUsed + requests,
      };
      saveQuota(updated);
      return { tokenQuota: updated };
    }),

    updateSettings: (s) =>
      set((state) => {
        const updated = { ...state.settings, ...s };
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
        if (s.theme) {
          const resolved = resolveTheme(s.theme);
          applyTheme(resolved);
          return { settings: updated, resolvedTheme: resolved };
        }
        return { settings: updated };
      }),

    toggleDevMode: () => set((s) => ({ devMode: !s.devMode })),

    recomputeTheme: () =>
      set((state) => {
        const resolved = resolveTheme(state.settings.theme);
        applyTheme(resolved);
        return { resolvedTheme: resolved };
      }),

    signOut: () => {
      set({ user: { name: '', email: '', avatar: '' } });
    },

    toggleMode: () => {
      const state = get();
      if (state.mode === 'online') {
        set({ mode: 'offline', ollamaStatus: { connected: false, checking: false, availableModels: [] } });
      } else {
        set({ mode: 'online', ollamaStatus: { ...state.ollamaStatus, checking: true } });
        get().checkOllama();
      }
    },

    checkOllama: async () => {
      set((s) => ({ ollamaStatus: { ...s.ollamaStatus, checking: true } }));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const connected = await checkConnection();
        if (connected) {
          const models = await listModels();
          set({ ollamaStatus: { connected: true, checking: false, availableModels: models } });
        } else {
          set({ ollamaStatus: { connected: false, checking: false, availableModels: [] } });
        }
      } catch {
        set({ ollamaStatus: { connected: false, checking: false, availableModels: [] } });
      } finally {
        clearTimeout(timeout);
      }
    },
  };
});
