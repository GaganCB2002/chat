import { create } from 'zustand';
import type { AuthUser } from '../types';

const TRIAL_LIMIT = 5;
const TRIAL_KEY = 'kortex-trial';
const AUTH_API = '/api/auth';

function loadTrial(): number {
  try {
    const raw = sessionStorage.getItem(TRIAL_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
}

function saveTrial(count: number) {
  try { sessionStorage.setItem(TRIAL_KEY, count.toString()); } catch { /* ignore */ }
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  trialUsed: number;
  trialLimit: number;
  showAuthModal: boolean;
  authMode: 'login' | 'register' | 'forgot' | 'reset' | 'change-password';

  init: () => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { first_name: string; last_name: string; email: string; password: string; age?: number }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; otp?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  incrementTrial: () => boolean;
  canSend: () => boolean;
  setShowAuthModal: (show: boolean, mode?: 'login' | 'register' | 'forgot' | 'reset' | 'change-password') => void;
}

function getToken(): string | null {
  try { return localStorage.getItem('kortex-token'); } catch { return null; }
}

function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem('kortex-token', token);
    else localStorage.removeItem('kortex-token');
  } catch { /* ignore */ }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  trialUsed: 0,
  trialLimit: TRIAL_LIMIT,
  showAuthModal: false,
  authMode: 'login',

  init: () => {
    const trial = loadTrial();
    const token = getToken();
    if (token) {
      fetch(`${AUTH_API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((user) => {
          if (user && user.id) {
            set({ user, isAuthenticated: true, trialUsed: trial });
          } else {
            setToken(null);
            set({ trialUsed: trial });
          }
        })
        .catch(() => set({ trialUsed: trial }));
    } else {
      set({ trialUsed: trial });
    }
  },

  login: async (username, password) => {
    try {
      const res = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail || 'Login failed' };

      setToken(data.access_token);
      const meRes = await fetch(`${AUTH_API}/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (!meRes.ok) throw new Error('Failed to fetch profile');
      const me = await meRes.json();
      set({ user: me, isAuthenticated: true, showAuthModal: false });
      return { success: true };
    } catch (err: any) {
      console.error("Login Error:", err);
      return { success: false, error: 'Network error. Is the backend running?' };
    }
  },

  register: async ({ first_name, last_name, email, password, age }) => {
    try {
      const res = await fetch(`${AUTH_API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name, last_name, email, password, age }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail || 'Registration failed' };

      setToken(data.access_token);
      const meRes = await fetch(`${AUTH_API}/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (!meRes.ok) throw new Error(`Profile fetch failed: ${meRes.status}`);
      const me = await meRes.json();
      set({ user: me, isAuthenticated: true, showAuthModal: false });
      return { success: true };
    } catch (err: any) {
      console.error("Register Error:", err);
      return { success: false, error: err.message || 'Network error. Is the backend running?' };
    }
  },

  logout: () => {
    setToken(null);
    set({ user: null, isAuthenticated: false });
  },

  forgotPassword: async (email) => {
    try {
      const res = await fetch(`${AUTH_API}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail || 'Request failed' };
      return { success: true, otp: data.otp };
    } catch {
      return { success: false, error: 'Network error. Is the backend running?' };
    }
  },

  verifyOtp: async (email, token) => {
    try {
      const res = await fetch(`${AUTH_API}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail || 'Verification failed' };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Is the backend running?' };
    }
  },

  resetPassword: async (email, token, newPassword) => {
    try {
      const res = await fetch(`${AUTH_API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail || 'Reset failed' };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Is the backend running?' };
    }
  },

  incrementTrial: () => {
    const next = get().trialUsed + 1;
    set({ trialUsed: next });
    saveTrial(next);
    return next >= TRIAL_LIMIT;
  },

  canSend: () => {
    const { isAuthenticated, trialUsed, trialLimit } = get();
    return isAuthenticated || trialUsed < trialLimit;
  },

  changePassword: async (currentPassword, newPassword) => {
    const token = getToken();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${AUTH_API}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail || 'Change failed' };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Is the backend running?' };
    }
  },

  setShowAuthModal: (show, mode) => {
    set({ showAuthModal: show, authMode: mode ?? 'login' });
  },
}));
