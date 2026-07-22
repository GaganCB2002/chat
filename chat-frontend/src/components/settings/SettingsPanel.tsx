import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Settings, Palette, Cpu, Sun, Moon, Monitor, User, Coins, MessageSquare, BarChart3, Zap, RefreshCw, HardDrive, CheckCircle2, WifiOff, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { MODELS, MODEL_OLLAMA_MAP } from '../../constants';
import type { FontSize, InstalledModel } from '../../types';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';

interface SettingsPanelProps {
  onClose: () => void;
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'model', label: 'Model', icon: Cpu },
  { id: 'general', label: 'General', icon: Settings },
] as const;

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings, tokenQuota, ollamaStatus } = useSettingsStore();
  const { chats } = useChatStore();
  const { user, changePassword } = useAuthStore();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('usage');

  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwDone, setPwDone] = useState('');

  const totalMessages = chats.reduce((sum, c) => sum + c.messages.length, 0);
  const totalTokens = chats.reduce((sum, c) => sum + c.messages.reduce((s, m) => s + (m.tokens ?? 0), 0), 0);

  const tokenPercent = tokenQuota.dailyTokenLimit > 0 ? Math.min((tokenQuota.dailyTokensUsed / tokenQuota.dailyTokenLimit) * 100, 100) : 0;
  const requestPercent = tokenQuota.dailyRequestLimit > 0 ? Math.min((tokenQuota.dailyRequestsUsed / tokenQuota.dailyRequestLimit) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-2xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border ">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-primary-500" />
            <h2 className="text-base font-semibold text-text ">Settings</h2>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-0.5 px-4 pt-3 border-b border-border overflow-x-auto scrollbar-subtle">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn('flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-t-lg transition-all border-b-2 border-transparent flex-shrink-0',
                tab === id ? 'text-primary-600 dark:text-primary-400 border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-text-secondary hover:text-text '
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="p-5 max-h-[32rem] overflow-y-auto">
          {tab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-primary-50 to-rose-50 dark:from-primary-900/20 dark:to-rose-900/20 border border-primary-200 dark:border-primary-800">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-rose-400 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-text ">{user?.name || 'Guest User'}</p>
                  <p className="text-sm text-text-secondary">{user?.email || 'No email'}</p>
                </div>
              </div>

              {chats.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-2">Lifetime Usage</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Chats', value: chats.length.toString(), icon: MessageSquare },
                      { label: 'Messages', value: totalMessages.toString(), icon: Coins },
                      { label: 'Tokens', value: totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}K` : totalTokens.toString(), icon: MessageSquare },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="p-2.5 rounded-lg bg-surface-secondary border border-border text-center">
                        <Icon className="w-3.5 h-3.5 mx-auto mb-1 text-primary-500" />
                        <p className="text-sm font-semibold text-text ">{value}</p>
                        <p className="text-[10px] text-text-tertiary">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {user && (
                <div className="border-t border-border pt-5">
                  <p className="text-xs font-medium text-text-secondary mb-3 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Change Password
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-secondary" />
                        <input type={showPwCurrent ? 'text' : 'password'} value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} placeholder="Current password" className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
                        <button type="button" onClick={() => setShowPwCurrent(!showPwCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text dark:text-text-secondary dark:hover:text-white transition-all">
                          {showPwCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-secondary" />
                        <input type={showPwNew ? 'text' : 'password'} value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="New password" className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
                        <button type="button" onClick={() => setShowPwNew(!showPwNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text dark:text-text-secondary dark:hover:text-white transition-all">
                          {showPwNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary dark:text-text-secondary" />
                        <input type={showPwConfirm ? 'text' : 'password'} value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Confirm new password" className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-border bg-surface-secondary text-text placeholder-text-tertiary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
                        <button type="button" onClick={() => setShowPwConfirm(!showPwConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text dark:text-text-secondary dark:hover:text-white transition-all">
                          {showPwConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {pwError && (
                      <p className="text-xs text-accent-rose bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">{pwError}</p>
                    )}
                    {pwDone && (
                      <p className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5" /> {pwDone}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={pwLoading}
                      onClick={async () => {
                        setPwError('');
                        setPwDone('');
                        if (!pwCurrent.trim() || !pwNew.trim() || !pwConfirm.trim()) { setPwError('Please fill in all fields'); return; }
                        if (pwNew.length < 4) { setPwError('New password must be at least 4 characters'); return; }
                        if (pwNew !== pwConfirm) { setPwError('Passwords do not match'); return; }
                        setPwLoading(true);
                        const result = await changePassword(pwCurrent, pwNew);
                        setPwLoading(false);
                        if (!result.success) { setPwError(result.error ?? 'Change failed'); return; }
                        setPwDone('Password changed successfully!');
                        setPwCurrent(''); setPwNew(''); setPwConfirm('');
                      }}
                      className="w-full h-9 text-sm font-medium rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {pwLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock className="w-4 h-4" /> Update Password</>}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'usage' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text ">Daily Usage</p>
                  <p className="text-xs text-text-tertiary mt-0.5">Resets at midnight</p>
                </div>
                <span className={cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-semibold',
                  tokenQuota.plan === 'Free' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                  tokenQuota.plan === 'Pro' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' :
                  'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                )}>
                  {tokenQuota.plan}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-primary-500" />
                      <span className="text-xs font-medium text-text ">Tokens</span>
                    </div>
                    <span className="text-xs text-text-tertiary">
                      {tokenQuota.dailyTokensUsed.toLocaleString()} / {tokenQuota.dailyTokenLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface-tertiary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(tokenPercent, 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full transition-colors',
                        tokenPercent > 90 ? 'bg-accent-rose' : tokenPercent > 70 ? 'bg-amber-500' : 'bg-primary-500'
                      )}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-primary-500" />
                      <span className="text-xs font-medium text-text ">Requests</span>
                    </div>
                    <span className="text-xs text-text-tertiary">
                      {tokenQuota.dailyRequestsUsed.toLocaleString()} / {tokenQuota.dailyRequestLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface-tertiary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(requestPercent, 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                      className={cn(
                        'h-full rounded-full transition-colors',
                        requestPercent > 90 ? 'bg-accent-rose' : requestPercent > 70 ? 'bg-amber-500' : 'bg-primary-500'
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-surface-secondary border border-border p-4">
                <p className="text-xs font-semibold text-text mb-3">Usage Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white dark:bg-surface-tertiary border border-border ">
                    <p className="text-[10px] text-text-tertiary mb-0.5">Tokens Used</p>
                    <p className="text-lg font-semibold text-text ">{tokenQuota.dailyTokensUsed.toLocaleString()}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">of {tokenQuota.dailyTokenLimit.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-surface-tertiary border border-border ">
                    <p className="text-[10px] text-text-tertiary mb-0.5">Requests Made</p>
                    <p className="text-lg font-semibold text-text ">{tokenQuota.dailyRequestsUsed.toLocaleString()}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">of {tokenQuota.dailyRequestLimit.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-surface-tertiary border border-border ">
                    <p className="text-[10px] text-text-tertiary mb-0.5">Tokens Remaining</p>
                    <p className="text-lg font-semibold text-text ">{(tokenQuota.dailyTokenLimit - tokenQuota.dailyTokensUsed).toLocaleString()}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{Math.round(100 - tokenPercent)}% left</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-surface-tertiary border border-border ">
                    <p className="text-[10px] text-text-tertiary mb-0.5">Requests Remaining</p>
                    <p className="text-lg font-semibold text-text ">{(tokenQuota.dailyRequestLimit - tokenQuota.dailyRequestsUsed).toLocaleString()}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{Math.round(100 - requestPercent)}% left</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'appearance' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div>
                <p className="text-sm font-medium text-text mb-3">Theme</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light' as const, label: 'Light', icon: Sun, desc: 'Always light' },
                    { id: 'dark' as const, label: 'Dark', icon: Moon, desc: 'Always dark' },
                    { id: 'system' as const, label: 'System', icon: Monitor, desc: 'Follows device' },
                  ].map(({ id, label, icon: Icon, desc }) => (
                    <button key={id} onClick={() => updateSettings({ theme: id })} className={cn('flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-medium border-2 transition-all', settings.theme === id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm' : 'border-border text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:border-text-tertiary/30')}>
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center transition-all', settings.theme === id ? 'bg-primary-100 dark:bg-primary-800/40' : 'bg-surface-tertiary ')}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold capitalize">{label}</span>
                      <span className="text-text-tertiary text-[10px] -mt-1">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-text mb-2">Font Size</p>
                <div className="flex gap-2">
                  {(['sm', 'base', 'lg'] as FontSize[]).map((s) => (
                    <button key={s} onClick={() => updateSettings({ fontSize: s })} className={cn('flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all capitalize', settings.fontSize === s ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'border-border text-text-secondary hover:bg-black/5 dark:hover:bg-white/5')}>{s}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'model' && (
            <ModelTabContent
              models={MODELS}
              installedModels={ollamaStatus.availableModels}
              selectedModel={settings.model}
              onSelect={(id) => updateSettings({ model: id as typeof settings.model })}
              ollamaConnected={ollamaStatus.connected}
            />
          )}

          {tab === 'general' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <ToggleRow label="Send on Enter" description="Press Enter to send, Shift+Enter for new line" checked={settings.sendOnEnter} onChange={(v) => updateSettings({ sendOnEnter: v })} />
              <ToggleRow label="Show timestamps" description="Display message timestamps in chat" checked={settings.showTimestamps} onChange={(v) => updateSettings({ showTimestamps: v })} />
              <ToggleRow label="Show token counts" description="Display token usage per message" checked={settings.showTokenCount} onChange={(v) => updateSettings({ showTokenCount: v })} />
              <ToggleRow label="Enable suggestions" description="Show contextual suggestions while typing" checked={settings.enableSuggestions} onChange={(v) => updateSettings({ enableSuggestions: v })} />
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function ModelTabContent({
  models,
  installedModels,
  selectedModel,
  onSelect,
  ollamaConnected,
}: {
  models: typeof MODELS;
  installedModels: InstalledModel[];
  selectedModel: string;
  onSelect: (id: string) => void;
  ollamaConnected: boolean;
}) {
  const maxSize = useMemo(() => Math.max(...installedModels.map((m) => m.size), 1), [installedModels]);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {installedModels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-primary-500" />
              <p className="text-sm font-semibold text-text ">Installed Models</p>
            </div>
            <span className="text-xs text-text-tertiary">{installedModels.length} models</span>
          </div>
          <div className="space-y-2">
            {installedModels
              .slice()
              .sort((a, b) => b.size - a.size)
              .map((m) => {
                const match = models.find((mo) => mo.id === m.name || MODEL_OLLAMA_MAP[mo.id] === m.name);
                const pct = (m.size / maxSize) * 100;
                const color = m.size > 5e9 ? 'bg-gradient-to-r from-primary-500 to-rose-500' : m.size > 2e9 ? 'bg-gradient-to-r from-primary-400 to-primary-500' : 'bg-gradient-to-r from-sky-400 to-primary-400';
                return (
                  <div key={m.name} className="p-3 rounded-lg bg-surface-secondary border border-border ">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{match?.icon || '🧠'}</span>
                        <div className="truncate">
                          <p className="text-sm font-medium text-text truncate">{match?.name || m.name}</p>
                          <p className="text-[10px] text-text-tertiary truncate">{match?.description || m.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <span className="text-[10px] font-mono text-text-tertiary">{formatSize(m.size)}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {!ollamaConnected && installedModels.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-center">
          <WifiOff className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Ollama disconnected</p>
          <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 mt-0.5">Start Ollama to see installed models</p>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-text mb-3">Select Model</p>
        <div className="space-y-1">
          {models.map((model) => {
            const installed = installedModels.some((m) => m.name === model.id || m.name === MODEL_OLLAMA_MAP[model.id] || m.name === `${model.id}:latest`);
            return (
              <button key={model.id} onClick={() => onSelect(model.id)} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all border', selectedModel === model.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5')}>
                <span className="text-lg">{model.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text ">{model.name}</p>
                  <p className="text-xs text-text-tertiary truncate">{model.description}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {installed && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium">Installed</span>}
                  {!installed && ollamaConnected && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-text-tertiary font-medium">Not installed</span>}
                  {selectedModel === model.id && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text ">{label}</p>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <button onClick={() => onChange(!checked)} className={cn('relative w-10 h-6 rounded-full transition-all flex-shrink-0', checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600')}>
        <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform', checked && 'translate-x-4')} />
      </button>
    </div>
  );
}
