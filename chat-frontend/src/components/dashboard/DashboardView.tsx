import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight, Cpu, Globe, WifiOff, Clock, CheckCircle2, XCircle, Loader2, ListOrdered, Sparkles } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { MODELS } from '../../constants';
import { cn } from '../../utils/cn';

export function DashboardView() {
  const { chats, selectChat, setView, messageQueue, queueHistory } = useChatStore();
  const { settings, mode, ollamaStatus } = useSettingsStore();
  const [showHistory, setShowHistory] = useState(false);

  const recentChats = useMemo(() => chats.slice(0, 5), [chats]);
  const currentModel = MODELS.find((m) => m.id === settings.model);


  return (
    <div className="flex-1 overflow-y-auto scrollbar-subtle p-4 md:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg font-semibold text-text ">Dashboard</h1>
          <p className="text-sm text-text-secondary ">Your conversations</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">Active Model</h3>
            <button
              onClick={() => useChatStore.getState().setShowResumeOptimizer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-all shadow-sm shadow-primary-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" /> Resume Optimizer
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentModel?.icon || '🧠'}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">{currentModel?.name || settings.model}</p>
              <p className="text-xs text-text-tertiary">{currentModel?.description || ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-full', mode === 'offline' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400')}>
                {mode === 'offline' ? <WifiOff className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {mode === 'offline' ? 'Offline' : 'Online'}
              </span>
              {mode === 'offline' || settings.model !== 'gemini-pro' ? (
                <span className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-full', ollamaStatus.connected ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400')}>
                  <Cpu className="w-3 h-3" />
                  {ollamaStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              ) : null}
            </div>
          </div>
        </motion.div>

        {(messageQueue.length > 0 || queueHistory.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-primary-500" />
                Tasks
                {messageQueue.filter(q => q.status === 'processing' || q.status === 'queued').length > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                    {messageQueue.filter(q => q.status === 'processing' || q.status === 'queued').length} active
                  </span>
                )}
              </h3>
              {queueHistory.length > 0 && (
                <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-text-tertiary hover:text-text transition-all">
                  {showHistory ? 'Hide history' : `History (${queueHistory.length})`}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {messageQueue.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface-secondary border border-border">
                  {item.status === 'queued' && <Clock className="w-4 h-4 text-text-tertiary flex-shrink-0" />}
                  {item.status === 'processing' && <Loader2 className="w-4 h-4 text-primary-500 animate-spin flex-shrink-0" />}
                  {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  {item.status === 'failed' && <XCircle className="w-4 h-4 text-accent-rose flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text truncate">{item.content}</p>
                    {(item.status === 'processing' || item.status === 'queued') && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                          <motion.div
                            className={cn('h-full rounded-full', item.status === 'processing' ? 'bg-primary-500' : 'bg-amber-400')}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-[10px] text-text-tertiary flex-shrink-0 font-mono">{item.progress}%</span>
                      </div>
                    )}
                    {item.status === 'completed' && (
                      <p className="text-[10px] text-emerald-500 mt-0.5">Completed</p>
                    )}
                    {item.status === 'failed' && (
                      <p className="text-[10px] text-accent-rose mt-0.5">Failed</p>
                    )}
                  </div>
                </div>
              ))}
              {showHistory && queueHistory.slice(-5).reverse().map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg opacity-60">
                  {item.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-accent-rose flex-shrink-0" />}
                  <p className="text-xs text-text truncate flex-1">{item.content}</p>
                  <span className="text-[10px] text-text-tertiary flex-shrink-0">
                    {item.status === 'completed' ? 'Done' : 'Failed'}
                  </span>
                </div>
              ))}
              {messageQueue.length === 0 && !showHistory && (
                <p className="text-xs text-text-tertiary py-2 text-center">No active tasks</p>
              )}
            </div>
          </motion.div>
        )}

        {recentChats.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 text-center rounded-xl bg-surface border border-border ">
            <MessageSquare className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No conversations yet</p>
            <p className="text-xs text-text-tertiary mt-1">Start a new chat to begin</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-4 rounded-xl bg-surface border border-border ">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text ">Recent Conversations</h3>
              <button onClick={() => setView('chat')} className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
            </div>
            <div className="space-y-1">
              {recentChats.map((c) => (
                <button key={c.id} onClick={() => { selectChat(c.id); setView('chat'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left transition-all">
                  <MessageSquare className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                  <span className="text-sm text-text truncate flex-1">{c.title}</span>
                  <span className="text-xs text-text-tertiary">{c.messages.length} msgs</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
