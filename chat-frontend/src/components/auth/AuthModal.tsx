import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Captcha } from './Captcha';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';

export function AuthModal() {
  const { showAuthModal, authMode, login, register, setShowAuthModal } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>(authMode);

  useEffect(() => {
    if (showAuthModal) setMode(authMode);
  }, [showAuthModal, authMode]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    if (mode === 'register' && !name.trim()) { setError('Please enter your name'); return; }
    if (!captchaValid) { setError('Please complete the CAPTCHA'); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const result = mode === 'login'
      ? login(email.trim(), password)
      : register(name.trim(), email.trim(), password);

    if (!result.success) {
      setError(result.error ?? 'Something went wrong');
      setCaptchaValid(false);
    }
    setLoading(false);
  };

  const close = () => setShowAuthModal(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={close}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.15 }} className="w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border ">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-rose-500 flex items-center justify-center">
              {mode === 'login' ? <LogIn className="w-3.5 h-3.5 text-white" /> : <UserPlus className="w-3.5 h-3.5 text-white" />}
            </div>
            <h2 className="text-base font-semibold text-text ">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={close}><X className="w-4 h-4" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex rounded-xl bg-surface-secondary border border-border p-0.5">
            <button type="button" onClick={() => { setMode('login'); setError(''); setCaptchaValid(false); }} className={cn('flex-1 py-2 text-sm font-medium rounded-lg transition-all', mode === 'login' ? 'bg-white shadow-sm text-text ' : 'text-text-tertiary hover:text-text ')}>Sign In</button>
            <button type="button" onClick={() => { setMode('register'); setError(''); setCaptchaValid(false); }} className={cn('flex-1 py-2 text-sm font-medium rounded-lg transition-all', mode === 'register' ? 'bg-white shadow-sm text-text ' : 'text-text-tertiary hover:text-text ')}>Register</button>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text transition-all">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Security Check</label>
            <Captcha onValidate={setCaptchaValid} disabled={loading} />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-accent-rose bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">{error}</motion.p>
          )}

          <button type="submit" disabled={loading} className="w-full h-10 text-sm font-medium rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : mode === 'login' ? <><LogIn className="w-4 h-4" /> Sign In</> : <><UserPlus className="w-4 h-4" /> Create Account</>}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
