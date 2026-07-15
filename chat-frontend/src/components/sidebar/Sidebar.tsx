import { useState, useMemo, useDeferredValue } from 'react';
import {
  Plus, Search, MessageSquare, LayoutDashboard, Pin, Folders, Bookmark, FileText, Settings,
  LogOut, PanelLeftClose, PanelLeft, ChevronDown, MoreVertical, Copy, Archive, Trash2, Star, Download
} from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import type { Chat } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';
import { Logo } from '../../brand/Logo';

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
  onOpenSettings?: () => void;
  onOpenPrompts?: () => void;
  onOpenFiles?: () => void;
  onSignOut?: () => void;
}

export function Sidebar({ mobile, onClose, onOpenSettings, onOpenPrompts, onOpenFiles, onSignOut }: SidebarProps) {
  const { chats, folders, currentChatId, newChat, sidebarOpen, setSidebarOpen, view, setView } = useChatStore();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => chats.filter((c) => c.title.toLowerCase().includes(deferredQuery.toLowerCase())), [chats, deferredQuery]);

  const toggleSection = (id: string) => setCollapsedSections((s) => ({ ...s, [id]: !s[id] }));

  const pinnedChats = filtered.filter((c) => c.pinned && !c.isArchived);
  const favoriteChats = filtered.filter((c) => c.isFavorite && !c.pinned && !c.isArchived);
  const folderChats = folders.map((f) => ({ ...f, chats: filtered.filter((c) => c.folderId === f.id && !c.isArchived) }));
  
  const uncategorized = filtered.filter((c) => !c.pinned && !c.isFavorite && !c.folderId && !c.isArchived);
  const archivedChats = filtered.filter((c) => c.isArchived);

  const groupedChats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    return {
      today: uncategorized.filter(c => new Date(c.lastMessageAt) >= today),
      yesterday: uncategorized.filter(c => new Date(c.lastMessageAt) >= yesterday && new Date(c.lastMessageAt) < today),
      last7Days: uncategorized.filter(c => new Date(c.lastMessageAt) >= last7Days && new Date(c.lastMessageAt) < yesterday),
      last30Days: uncategorized.filter(c => new Date(c.lastMessageAt) >= last30Days && new Date(c.lastMessageAt) < last7Days),
      older: uncategorized.filter(c => new Date(c.lastMessageAt) < last30Days),
    };
  }, [uncategorized]);

  const content = (
    <div className="flex flex-col h-full bg-surface-secondary ">
      <div className="flex items-center justify-between px-3 h-12 border-b border-border ">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-sm font-semibold text-text ">Kortex</span>
        </div>
        <button onClick={mobile ? onClose : () => setSidebarOpen(false)} className="p-1.5 rounded-md text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <button onClick={() => { newChat(); if (view !== 'chat') setView('chat'); onClose?.(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Chat
        </button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input type="text" placeholder="Search conversations..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border bg-surface text-text placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all" />
        </div>
        <div className="flex gap-1 bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
          {[
            { id: 'chat' as const, label: 'Chats', icon: MessageSquare },
            { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setView(id)} className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              view === id ? 'bg-surface shadow-sm text-text ' : 'text-text-secondary hover:text-text ')}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-subtle px-2 pb-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <MessageSquare className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-text-secondary ">No conversations</p>
          </div>
        ) : (
          <>
            {pinnedChats.length > 0 && (
              <Section title="Pinned" icon={Pin} id="pinned" collapsed={collapsedSections} onToggle={toggleSection}>
                {pinnedChats.map((c) => <ChatRow key={c.id} chat={c} active={c.id === currentChatId} onClose={onClose} />)}
              </Section>
            )}
            {favoriteChats.length > 0 && (
              <Section title="Favorites" icon={Star} id="favorites" collapsed={collapsedSections} onToggle={toggleSection}>
                {favoriteChats.map((c) => <ChatRow key={c.id} chat={c} active={c.id === currentChatId} onClose={onClose} />)}
              </Section>
            )}
            {folderChats.map((f) => f.chats.length > 0 ? (
              <Section key={f.id} title={f.name} icon={Folders} id={f.id} collapsed={collapsedSections} onToggle={toggleSection}>
                {f.chats.map((c) => <ChatRow key={c.id} chat={c} active={c.id === currentChatId} onClose={onClose} />)}
              </Section>
            ) : null)}
            
            {groupedChats.today.length > 0 && (
              <Section title="Today" icon={MessageSquare} id="today" collapsed={collapsedSections} onToggle={toggleSection}>
                {groupedChats.today.map((c) => <ChatRow key={c.id} chat={c} active={c.id === currentChatId} onClose={onClose} />)}
              </Section>
            )}
            {groupedChats.yesterday.length > 0 && (
              <Section title="Yesterday" icon={MessageSquare} id="yesterday" collapsed={collapsedSections} onToggle={toggleSection}>
                {groupedChats.yesterday.map((c) => <ChatRow key={c.id} chat={c} active={c.id === currentChatId} onClose={onClose} />)}
              </Section>
            )}
            {groupedChats.last7Days.length > 0 && (
              <Section title="Previous 7 Days" icon={MessageSquare} id="last7Days" collapsed={collapsedSections} onToggle={toggleSection}>
                {groupedChats.last7Days.map((c) => <ChatRow key={c.id} chat={c} active={c.id === currentChatId} onClose={onClose} />)}
              </Section>
            )}
            {groupedChats.last30Days.length > 0 && (
              <Section title="Previous 30 Days" icon={MessageSquare} id="last30Days" collapsed={collapsedSections} onToggle={toggleSection}>
                {groupedChats.last30Days.map((c) => <ChatRow key={c.id} chat={c} active={c.id === currentChatId} onClose={onClose} />)}
              </Section>
            )}
            {groupedChats.older.length > 0 && (
              <Section title="Older" icon={MessageSquare} id="older" collapsed={collapsedSections} onToggle={toggleSection}>
                {groupedChats.older.map((c) => <ChatRow key={c.id} chat={c} active={c.id === currentChatId} onClose={onClose} />)}
              </Section>
            )}
            {archivedChats.length > 0 && (
              <Section title="Archived" icon={Archive} id="archived" collapsed={collapsedSections} onToggle={toggleSection}>
                {archivedChats.map((c) => <ChatRow key={c.id} chat={c} active={c.id === currentChatId} onClose={onClose} />)}
              </Section>
            )}
          </>
        )}
      </div>

      <div className="border-t border-border p-2 space-y-0.5">
        <button onClick={() => { onOpenPrompts?.(); onClose?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text transition-all">
          <Bookmark className="w-4 h-4" /> Prompt Library
        </button>
        <button onClick={() => { onOpenFiles?.(); onClose?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text transition-all">
          <FileText className="w-4 h-4" /> Files
        </button>
        <button onClick={() => { onOpenSettings?.(); onClose?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text transition-all">
          <Settings className="w-4 h-4" /> Settings
        </button>
        <button onClick={() => { onSignOut?.(); onClose?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-text-tertiary hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-accent-rose transition-all">
          <LogOut className="w-4 h-4" /> Sign out
        </button>

        <ProfileBadge />
      </div>
    </div>
  );

  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-72 max-w-[85vw] h-full shadow-xl border-r border-border ">{content}</div>
      </div>
    );
  }

  if (!sidebarOpen) {
    return <button onClick={() => setSidebarOpen(true)} className="hidden md:flex fixed left-3 top-3 z-40 p-2 rounded-lg bg-surface border border-border text-text-tertiary hover:text-text transition-all shadow-sm"><PanelLeft className="w-4 h-4" /></button>;
  }

  return <aside className="hidden md:flex flex-col w-72 h-full border-r border-border flex-shrink-0">{content}</aside>;
}

function Section({ title, icon: Icon, id, collapsed, onToggle, children }: { title: string; icon: React.ComponentType<{ className?: string }>; id: string; collapsed: Record<string, boolean>; onToggle: (id: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <button onClick={() => onToggle(id)} className="flex items-center gap-1.5 px-3 py-1.5 w-full text-left">
        <Icon className="w-3 h-3 text-text-tertiary " />
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-widest flex-1">{title}</span>
        <ChevronDown className={cn('w-3 h-3 text-text-tertiary transition-transform', collapsed[id] && '-rotate-90')} />
      </button>
      {!collapsed[id] && <div className="space-y-0.5 mt-0.5">{children}</div>}
    </div>
  );
}

function ProfileBadge() {
  const { user, isAuthenticated } = useAuthStore();
  const displayName = isAuthenticated && user ? user.name : 'Guest User';
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const planLabel = isAuthenticated ? 'Free plan' : 'Free trial';

  return (
    <div className="flex items-center gap-3 mt-4 pt-2 border-t border-border px-1">
      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-sm">
        {initials}
      </div>
      <div className="flex-1 min-w-0 flex flex-col items-start justify-center">
        <p className="text-sm font-medium text-text truncate">{displayName}</p>
        <p className="text-[11px] text-text-tertiary ">{planLabel}</p>
      </div>
    </div>
  );
}

function ChatRow({ chat, active, onClose }: { chat: Chat; active: boolean; onClose?: () => void }) {
  const { selectChat, setView, deleteChat, togglePinMessage, duplicateChat, toggleFavoriteChat, toggleArchiveChat, exportChat } = useChatStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = () => {
    selectChat(chat.id);
    setView('chat');
    onClose?.();
  };

  return (
    <div className="relative group" onMouseLeave={() => setMenuOpen(false)}>
      <button onClick={handleSelect} className={cn('w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150', active ? 'bg-primary-100 dark:bg-primary-900/30' : 'hover:bg-black/5 dark:hover:bg-white/5')}>
        <MessageSquare className="w-4 h-4 flex-shrink-0 text-text-tertiary " />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm truncate leading-tight', active ? 'font-medium text-text ' : 'text-text ')}>{chat.title}</p>
          <p className="text-[11px] text-text-tertiary mt-0.5">{formatDate(chat.lastMessageAt)}</p>
        </div>
      </button>
      <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className={cn('absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all', menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {menuOpen && (
        <div className="absolute right-2 top-full mt-1 w-40 bg-white dark:bg-surface-tertiary rounded-lg shadow-xl border border-border overflow-hidden z-50">
          <MenuButton icon={Pin} label={chat.pinned ? "Unpin" : "Pin"} onClick={() => { togglePinMessage(chat.id); setMenuOpen(false); }} />
          <MenuButton icon={Star} label={chat.isFavorite ? "Unfavorite" : "Favorite"} onClick={() => { toggleFavoriteChat(chat.id); setMenuOpen(false); }} />
          <MenuButton icon={Copy} label="Duplicate" onClick={() => { duplicateChat(chat.id); setMenuOpen(false); }} />
          <MenuButton icon={Archive} label={chat.isArchived ? "Unarchive" : "Archive"} onClick={() => { toggleArchiveChat(chat.id); setMenuOpen(false); }} />
          <MenuButton icon={Download} label="Export" onClick={() => { exportChat(chat.id); setMenuOpen(false); }} />
          <div className="h-px bg-border my-1" />
          <MenuButton icon={Trash2} label="Delete" onClick={() => { deleteChat(chat.id); setMenuOpen(false); }} danger />
        </div>
      )}
    </div>
  );
}

function MenuButton({ icon: Icon, label, onClick, danger }: { icon: any, label: string, onClick: () => void, danger?: boolean }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors', danger ? 'text-accent-rose hover:bg-red-50 dark:hover:bg-red-900/10' : 'text-text-secondary hover:text-text hover:bg-black/5 dark:hover:bg-white/5')}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}
