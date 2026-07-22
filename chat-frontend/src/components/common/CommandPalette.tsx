import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Sun, Moon, Monitor, FolderOpen, MessageSquare, ArrowRight } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { cn } from '../../utils/cn';
import { THEME_CYCLE } from '../../constants';

interface CommandPaletteProps {
  onClose: () => void;
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const { chats, newChat, selectChat, setView, createFolder } = useChatStore();
  const { settings, updateSettings } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextTheme = THEME_CYCLE[settings.theme] ?? 'dark';

  const actions = useMemo(() => {
    const themeIcons: Record<string, React.ComponentType<{ className?: string }>> = { light: Sun, dark: Moon, system: Monitor };
    const ThemeIcon = themeIcons[settings.theme] ?? Sun;
    return [
      { id: 'new-chat', label: 'New chat', icon: Plus, onSelect: () => { newChat(); onClose(); } },
      { id: 'toggle-theme', label: `Switch to ${nextTheme} mode`, icon: ThemeIcon, onSelect: () => { updateSettings({ theme: nextTheme }); onClose(); } },
      { id: 'new-folder', label: 'New folder', icon: FolderOpen, onSelect: () => { createFolder('New Folder'); onClose(); } },
    ];
  }, [nextTheme, newChat, onClose, updateSettings, createFolder, settings.theme]);

  const filteredChats = useMemo(() =>
    chats.filter((c) => c.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5),
    [chats, query]
  );

  const all = useMemo(() => {
    const filtered = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));
    return [...filtered, ...filteredChats.map((c) => ({ id: c.id, label: c.title, icon: MessageSquare, onSelect: () => { selectChat(c.id); setView('chat'); onClose(); } }))];
  }, [actions, filteredChats, query, selectChat, setView, onClose]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, Math.max(all.length - 1, 0))); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { if (all.length > 0 && all[selectedIndex]) { all[selectedIndex].onSelect(); } }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 border-b border-border ">
          <Search className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search actions and conversations..."
            className="flex-1 h-11 bg-transparent text-sm text-text placeholder-text-tertiary focus:outline-none"
          />
        </div>
        {all.length > 0 ? (
          <div className="p-1.5 max-h-72 overflow-y-auto">
            {all.map((item, i) => (
              <button
                key={item.id}
                onClick={item.onSelect}
                className={cn('group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all', i === selectedIndex ? 'bg-black/5 dark:bg-white/5 text-text ' : 'text-text-secondary ')}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                <ArrowRight className="w-3 h-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-text-tertiary">No results found</div>
        )}
      </motion.div>
    </motion.div>
  );
}
