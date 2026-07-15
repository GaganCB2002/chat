import { create } from 'zustand';
import type { AuthUser } from '../types';

const TRIAL_LIMIT = 5;
const AUTH_KEY = 'kortex-auth';
const SESSION_KEY = 'kortex-session';
const TRIAL_KEY = 'kortex-trial';

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h:' + hash.toString(36);
}

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  trialUsed: number;
  trialLimit: number;
  showAuthModal: boolean;
  authMode: 'login' | 'register';

  init: () => void;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  incrementTrial: () => boolean;
  canSend: () => boolean;
  setShowAuthModal: (show: boolean, mode?: 'login' | 'register') => void;
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAccounts(accounts: StoredAccount[]) {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(accounts)); } catch { /* ignore */ }
}

function loadTrial(): number {
  try {
    const raw = sessionStorage.getItem(TRIAL_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
}

function saveTrial(count: number) {
  try { sessionStorage.setItem(TRIAL_KEY, count.toString()); } catch { /* ignore */ }
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
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set({ user: saved, isAuthenticated: true, trialUsed: trial });
        return;
      }
    } catch {}
    set({ trialUsed: trial });
  },

  login: (email, password) => {
    const accounts = loadAccounts();
    const account = accounts.find((a) => a.email === email);
    if (!account) return { success: false, error: 'No account found with this email' };
    if (account.passwordHash !== hashPassword(password)) return { success: false, error: 'Incorrect password' };
    const user: AuthUser = { id: account.id, name: account.name, email: account.email, createdAt: account.createdAt };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* ignore */ }
    set({ user, isAuthenticated: true, showAuthModal: false });
    return { success: true };
  },

  register: (name, email, password) => {
    const accounts = loadAccounts();
    if (accounts.some((a) => a.email === email)) return { success: false, error: 'An account with this email already exists' };
    const newAccount: StoredAccount = { id: `user-${Date.now()}`, name, email, passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
    saveAccounts([...accounts, newAccount]);
    const user: AuthUser = { id: newAccount.id, name: newAccount.name, email: newAccount.email, createdAt: newAccount.createdAt };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* ignore */ }
    set({ user, isAuthenticated: true, showAuthModal: false });
    return { success: true };
  },

  logout: () => {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    set({ user: null, isAuthenticated: false });
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

  setShowAuthModal: (show, mode) => {
    set({ showAuthModal: show, authMode: mode ?? 'login' });
  },
}));
