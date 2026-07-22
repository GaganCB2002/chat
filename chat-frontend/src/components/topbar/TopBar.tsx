import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Sun, Moon, Monitor, User, Settings, LogOut, Command, Cpu, LogIn, UserPlus, Download, Zap, KeyRound, Sparkles } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { MODELS } from '../../constants';
import { cn } from '../../utils/cn';
import { exportChatAsJSON, exportChatAsTXT, exportChatAsPDF } from '../../utils/export';


interface TopBarProps {
  onMobileMenu: () => void;
  onOpenCommand: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export function TopBar({ onMobileMenu, onOpenCommand, onOpenSettings, onSignOut }: TopBarProps) {
  const { currentChatId, chats, sidebarOpen, setSidebarOpen, view, streamingContent } = useChatStore();
  const { settings, updateSettings, ollamaStatus, mode, toggleMode } = useSettingsStore();
  const { isAuthenticated, user, setShowAuthModal } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themeIcons: Record<string, React.ComponentType<{ className?: string }>> = { light: Sun, dark: Moon, system: Monitor };
  const ThemeIcon = themeIcons[settings.theme] ?? Sun;

  const currentChat = chats.find((c) => c.id === currentChatId);
  const currentChatTokens = currentChat?.messages.reduce((sum, m) => sum + (m.tokens || 0), 0) || 0;
  const streamingTokens = Math.ceil(streamingContent.length / 4);
  const totalLiveTokens = currentChatTokens + streamingTokens;

  return (
    <header className="flex items-center justify-between px-3 h-12 border-b border-border bg-surface flex-shrink-0">
      <div className="flex items-center gap-2">
        {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="hidden md:flex p-1.5 rounded-md text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all"><Menu className="w-4 h-4" /></button>}
        <button onClick={onMobileMenu} className="md:hidden p-1.5 rounded-md text-text-tertiary hover:bg-black/5 dark:hover:bg-white/5 transition-all"><Menu className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-medium text-text truncate max-w-[180px] sm:max-w-md">
            {view === 'dashboard' ? 'Dashboard' : currentChat?.title || 'New conversation'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        {/* Token Counter */}
        {view === 'chat' && (
          <div className="flex items-center gap-1.5 px-2 py-1 mr-1 rounded-md text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" title="Live tokens consumed in this conversation">
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">{totalLiveTokens.toLocaleString()} tokens</span>
            <span className="sm:hidden">{totalLiveTokens.toLocaleString()}</span>
          </div>
        )}
        {/* Online/Offline Toggle */}
        <button
          onClick={toggleMode}
          className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all', mode === 'online' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30')}
          title={mode === 'online' ? 'Click to go offline (force Kortex Lite)' : 'Click to go online'}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', mode === 'online' ? 'bg-emerald-500' : ollamaStatus.checking ? 'bg-amber-400 animate-pulse' : 'bg-amber-500')} />
          <span className="hidden sm:inline">{mode === 'online' ? 'Online' : 'Offline'}</span>
        </button>

        {/* Model Selector */}
        <div className="relative">
          <button onClick={() => setShowModelMenu(!showModelMenu)} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <Cpu className="w-3 h-3" />
            <span className="hidden sm:inline">{MODELS.find((m) => m.id === settings.model)?.name || settings.model}</span>
          </button>
          <AnimatePresence>
            {showModelMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowModelMenu(false)} />
                <motion.div initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.96 }} transition={{ duration: 0.1 }} className="absolute right-0 top-full mt-1 z-40 w-56 p-1.5 rounded-xl bg-surface border border-border shadow-lg">
                  {MODELS.map((model) => (
                    <button key={model.id} onClick={() => { updateSettings({ model: model.id }); setShowModelMenu(false); }} className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all', settings.model === model.id ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-text hover:bg-black/5 dark:hover:bg-white/5')}>
                      <span className="text-base">{model.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{model.name}</p>
                        <p className="text-xs text-text-tertiary ">{model.description}</p>
                      </div>
                      {settings.model === model.id && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Export */}
        {currentChat && currentChat.messages.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              <Download className="w-3 h-3" />
            </button>
            <div className="absolute right-0 top-full mt-1 z-50 w-36 p-1 rounded-xl bg-surface border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto">
              <button onClick={() => { exportChatAsJSON(currentChat); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all">Export as JSON</button>
              <button onClick={() => { exportChatAsTXT(currentChat); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all">Export as TXT</button>
              <button onClick={() => { exportChatAsPDF(currentChat); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all">Export as PDF</button>
            </div>
          </div>
        )}

        {/* Resume Optimizer */}
        <button
          onClick={() => useChatStore.getState().setShowResumeOptimizer(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all mr-1"
          title="Optimize Resume for ATS"
        >
          <Sparkles className="w-3.5 h-3.5" /> Resume Optimizer
        </button>

        {/* Command Palette */}
        <button onClick={onOpenCommand} className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-all">
          <Command className="w-3 h-3" /> <kbd>K</kbd>
        </button>

        {/* Theme */}
        <div className="relative">
          <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="p-2 rounded-lg text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-all relative group" title={`Theme: ${settings.theme}`}>
            <ThemeIcon className="w-4 h-4" />
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-gray-900 dark:bg-gray-700 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none capitalize">{settings.theme}</span>
          </button>
          <AnimatePresence>
            {showThemeMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowThemeMenu(false)} />
                <motion.div initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.96 }} transition={{ duration: 0.1 }} className="absolute right-0 top-full mt-1 z-40 w-36 p-1.5 rounded-xl bg-surface border border-border shadow-lg">
                  {(['light', 'dark', 'system'] as const).map((id) => {
                    const Icon = themeIcons[id];
                    return (
                      <button key={id} onClick={() => { updateSettings({ theme: id }); setShowThemeMenu(false); }} className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all', settings.theme === id ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-text hover:bg-black/5 dark:hover:bg-white/5')}>
                        <Icon className="w-4 h-4" />
                        <span className="capitalize">{id}</span>
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button onClick={() => setShowProfile(!showProfile)} className="p-1.5 rounded-lg text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <div className="w-6 h-6 rounded-md bg-surface-tertiary flex items-center justify-center"><User className="w-3.5 h-3.5" /></div>
          </button>
          <AnimatePresence>
            {showProfile && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                <motion.div initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.96 }} transition={{ duration: 0.1 }} className="absolute right-0 top-full mt-1 z-50 w-52 p-1 rounded-xl bg-surface border border-border shadow-lg">
                  {isAuthenticated ? (
                    <div className="px-3 py-2 mb-0.5"><p className="text-sm font-medium text-text ">{user?.name || 'User'}</p><p className="text-xs text-text-tertiary">{user?.email}</p></div>
                  ) : (
                    <div className="px-3 py-2 mb-0.5"><p className="text-sm font-medium text-text ">Guest (Free Trial)</p><p className="text-xs text-text-tertiary">Create an account to save chats</p></div>
                  )}
                  <hr className="border-border mb-0.5" />
                  {!isAuthenticated && (
                    <>
                      <button onClick={() => { setShowAuthModal(true, 'login'); setShowProfile(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-all"><LogIn className="w-4 h-4" /> Sign In</button>
                      <button onClick={() => { setShowAuthModal(true, 'register'); setShowProfile(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"><UserPlus className="w-4 h-4" /> Create Account</button>
                      <hr className="border-border my-0.5" />
                    </>
                  )}
                  {isAuthenticated && <button onClick={() => { setShowAuthModal(true, 'change-password'); setShowProfile(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-all"><KeyRound className="w-4 h-4" /> Change Password</button>}
                  <button onClick={() => { onOpenSettings(); setShowProfile(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-all"><Settings className="w-4 h-4" /> Settings</button>
                  <hr className="border-border my-0.5" />
                  <button onClick={() => { onSignOut(); setShowProfile(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-accent-rose hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><LogOut className="w-4 h-4" /> {isAuthenticated ? 'Sign out' : 'Clear session'}</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
