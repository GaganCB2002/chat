import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, KeyRound, ArrowLeft, CheckCircle, Calendar } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Captcha } from './Captcha';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';

export function AuthModal() {
  const { showAuthModal, authMode, login, register, forgotPassword, resetPassword, setShowAuthModal } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(authMode);
  useEffect(() => {
    if (showAuthModal) setMode(authMode);
  }, [showAuthModal, authMode]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');

  if (!showAuthModal) return null;

  const close = () => { setShowAuthModal(false); setDoneMessage(''); };

  const resetAll = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setAge('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
    setError('');
    setDoneMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDoneMessage('');

    if (mode === 'login') {
      if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
      setLoading(true);
      const result = await login(email.trim(), password);
      if (!result.success) { setError(result.error ?? 'Login failed'); setCaptchaValid(false); }
      setLoading(false);
      return;
    }

    if (mode === 'register') {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
      if (!captchaValid) { setError('Please complete the CAPTCHA'); return; }
      setLoading(true);
      const result = await register({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim(), password, age: age ? parseInt(age, 10) : undefined });
      if (!result.success) { setError(result.error ?? 'Registration failed'); setCaptchaValid(false); }
      setLoading(false);
      return;
    }

    if (mode === 'forgot') {
      if (!email.trim()) { setError('Please enter your email'); return; }
      setLoading(true);
      const result = await forgotPassword(email.trim());
      setLoading(false);
      if (!result.success) { setError(result.error ?? 'Request failed'); return; }
      if (result.resetToken) {
        setResetToken(result.resetToken);
        setMode('reset');
      } else {
        setDoneMessage('If an account with that email exists, a reset link has been generated. Check your email.');
      }
      return;
    }

    if (mode === 'reset') {
      if (!newPassword.trim()) { setError('Please enter a new password'); return; }
      if (newPassword.length < 4) { setError('Password must be at least 4 characters'); return; }
      if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
      if (!resetToken) { setError('Session expired. Please try again.'); return; }
      setLoading(true);
      const result = await resetPassword(email.trim(), resetToken, newPassword);
      setLoading(false);
      if (!result.success) { setError(result.error ?? 'Reset failed'); return; }
      setDoneMessage('Password reset successfully! Sign in with your new password.');
      setTimeout(() => { setMode('login'); setPassword(''); resetAll(); }, 2500);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={close}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.15 }} className="w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border ">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-rose-500 flex items-center justify-center">
              {mode === 'login' && <LogIn className="w-3.5 h-3.5 text-white" />}
              {mode === 'register' && <UserPlus className="w-3.5 h-3.5 text-white" />}
              {mode === 'forgot' && <KeyRound className="w-3.5 h-3.5 text-white" />}
              {mode === 'reset' && <KeyRound className="w-3.5 h-3.5 text-white" />}
            </div>
            <h2 className="text-base font-semibold text-text ">
              {mode === 'login' && 'Sign In'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Update Password'}
            </h2>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={close}><X className="w-4 h-4" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'login' || mode === 'register' ? (
            <div className="flex rounded-xl bg-surface-secondary border border-border p-0.5">
              <button type="button" onClick={() => { setMode('login'); setError(''); setCaptchaValid(false); }} className={cn('flex-1 py-2 text-sm font-medium rounded-lg transition-all', mode === 'login' ? 'bg-white shadow-sm text-text dark:text-gray-900 ' : 'text-text-tertiary hover:text-text dark:text-text-secondary dark:hover:text-white ')}>Sign In</button>
              <button type="button" onClick={() => { setMode('register'); setError(''); setCaptchaValid(false); }} className={cn('flex-1 py-2 text-sm font-medium rounded-lg transition-all', mode === 'register' ? 'bg-white shadow-sm text-text dark:text-gray-900 ' : 'text-text-tertiary hover:text-text dark:text-text-secondary dark:hover:text-white ')}>Register</button>
            </div>
          ) : mode === 'forgot' && (
            <button type="button" onClick={() => { setMode('login'); resetAll(); }} className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-secondary" />
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-secondary" />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
                </div>
              </div>
            </>
          )}

          {mode !== 'reset' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {mode === 'login' ? 'Email or Username' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-secondary" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'login' ? 'you@example.com or username' : 'you@example.com'}
                  className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-secondary" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text dark:text-text-secondary dark:hover:text-white transition-all">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Age</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-secondary" />
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" min="1" max="150" className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="block text-xs text-primary-500 hover:text-primary-600 transition-colors -mt-2">
              Forgot password?
            </button>
          )}

          {mode === 'reset' && (
            <>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-secondary" />
                  <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text dark:text-text-secondary dark:hover:text-white transition-all">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-secondary" />
                  <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text dark:text-text-secondary dark:hover:text-white transition-all">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Security Check</label>
              <Captcha key={mode} onValidate={setCaptchaValid} disabled={loading} />
            </div>
          )}

          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-accent-rose bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">{error}</motion.p>
          )}

          {doneMessage && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> {doneMessage}
            </motion.p>
          )}

          <button type="submit" disabled={loading || !!doneMessage} className="w-full h-10 text-sm font-medium rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : mode === 'login' ? <><LogIn className="w-4 h-4" /> Sign In</> : mode === 'register' ? <><UserPlus className="w-4 h-4" /> Create Account</> : mode === 'forgot' ? <><KeyRound className="w-4 h-4" /> Send Reset Code</> : <><KeyRound className="w-4 h-4" /> Update Password</>}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
