import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '../sidebar/Sidebar';
import { TopBar } from '../topbar/TopBar';
import { ChatView } from '../chat/ChatView';
import { DashboardView } from '../dashboard/DashboardView';
import { CommandPalette } from '../common/CommandPalette';
import { SettingsPanel } from '../settings/SettingsPanel';
import { ToastContainer } from '../common/ToastContainer';
import { DeveloperInfo } from '../common/DeveloperInfo';
import { PromptLibrary } from '../common/PromptLibrary';
import { FilesModal } from '../common/FilesModal';
import { AuthModal } from '../auth/AuthModal';
import { ResumeOptimizer } from '../resume/ResumeOptimizer';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';

export function AppShell() {
  const { view, showResumeOptimizer, setShowResumeOptimizer } = useChatStore();
  const { settings, recomputeTheme, checkOllama } = useSettingsStore();
  const { addToast } = useToastStore();
  const { showAuthModal, isAuthenticated, logout, init } = useAuthStore();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { checkOllama().catch(() => {}); }, [checkOllama]);

  useEffect(() => {
    const getChatIdFromPath = (path: string): string | null => {
      const match = path.match(/^\/chat\/(.+)--(.+)$/);
      if (match) return match[2];
      const legacyMatch = path.match(/^\/chat\/(.+)$/);
      if (legacyMatch) return legacyMatch[1];
      return null;
    };
    const handlePopState = () => {
      const chatId = getChatIdFromPath(window.location.pathname);
      if (chatId) {
        useChatStore.setState({ currentChatId: chatId, view: 'chat' });
      } else {
        useChatStore.setState({ currentChatId: null, view: 'dashboard' });
      }
    };
    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Trigger on initial load
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k') { e.preventDefault(); setShowCommands(true); }
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (settings.theme === 'system') recomputeTheme();
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme, recomputeTheme]);

  const handleSignOut = () => {
    if (isAuthenticated) {
      logout();
      addToast('success', 'Signed out', 'You have been signed out.');
    } else {
      addToast('info', 'Not signed in', 'You are using a free trial.');
    }
  };

  return (
    <div className="flex h-screen bg-surface text-text antialiased">
      <Sidebar
        onOpenSettings={() => setShowSettings(true)}
        onOpenPrompts={() => setShowPrompts(true)}
        onOpenFiles={() => setShowFiles(true)}
        onSignOut={handleSignOut}
      />
      {mobileMenu && (
        <Sidebar
          mobile
          onClose={() => setMobileMenu(false)}
          onOpenSettings={() => { setShowSettings(true); setMobileMenu(false); }}
          onOpenPrompts={() => { setShowPrompts(true); setMobileMenu(false); }}
          onOpenFiles={() => { setShowFiles(true); setMobileMenu(false); }}
          onSignOut={() => { handleSignOut(); setMobileMenu(false); }}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          onMobileMenu={() => setMobileMenu(true)}
          onOpenCommand={() => setShowCommands(true)}
          onOpenSettings={() => setShowSettings(true)}
          onSignOut={handleSignOut}
        />
        {view === 'dashboard' ? <DashboardView /> : <ChatView />}
        <DeveloperInfo />
      </div>

      <AnimatePresence>
        {showCommands && <CommandPalette onClose={() => setShowCommands(false)} />}
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        {showPrompts && <PromptLibrary onClose={() => setShowPrompts(false)} />}
        {showFiles && <FilesModal onClose={() => setShowFiles(false)} />}
        {showAuthModal && <AuthModal />}
        {showResumeOptimizer && <ResumeOptimizer onClose={() => setShowResumeOptimizer(false)} />}
      </AnimatePresence>
      <ToastContainer />
    </div>
  );
}
