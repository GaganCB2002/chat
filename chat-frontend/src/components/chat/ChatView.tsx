import { useEffect, useRef, useState, useMemo } from 'react';
import { Search, X, ArrowUp, ArrowDown, AlertCircle, Bot, Loader2, Square } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';
import { Virtuoso } from 'react-virtuoso';
import { renderMarkdown } from '../../utils/markdown';

export function ChatView() {
  const { chats, currentChatId, sendMessage, isTyping, streamingContent, setView, ollamaError, stopGeneration } = useChatStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);

  const currentChat = chats.find((c) => c.id === currentChatId);
  const messages = currentChat?.messages ?? [];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { msgIndex: number; content: string }[] = [];
    for (let idx = 0; idx < messages.length; idx++) {
      const msg = messages[idx];
      const lower = msg.content.toLowerCase();
      let pos = 0;
      while ((pos = lower.indexOf(q, pos)) !== -1) {
        results.push({ msgIndex: idx, content: msg.content.slice(Math.max(0, pos - 30), pos + q.length + 30) });
        pos += q.length;
      }
    }
    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch((s) => !s);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setView('chat');
    sendMessage(text.trim());
  };

  const handleRegenerate = () => {
    const chat = chats.find((c) => c.id === currentChatId);
    if (!chat) return;
    const lastUserMsg = [...chat.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content);
    }
  };

  const streamingMsg = isTyping && streamingContent ? { id: 'streaming', role: 'assistant' as const, content: streamingContent, timestamp: new Date(), action: 'none' as const } : null;

  if (messages.length === 0 && !streamingMsg) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <WelcomeScreen onSend={handleSend} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {ollamaError && (
        <div className="flex items-center gap-2 px-4 py-2 mx-4 mt-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-accent-rose flex-shrink-0" />
          <p className="text-xs text-accent-rose flex-1">{ollamaError}</p>
        </div>
      )}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-2 mx-4 mt-2 rounded-lg bg-surface border border-border">
          <Search className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchIndex(0); }}
            placeholder="Search in chat... (Ctrl+F)"
            className="flex-1 bg-transparent text-sm text-text placeholder-text-tertiary focus:outline-none"
          />
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-text-tertiary">
              <span>{searchIndex + 1}/{searchResults.length}</span>
              <button onClick={() => setSearchIndex((i) => Math.max(0, i - 1))} className="p-0.5 rounded hover:text-text hover:bg-black/5 dark:hover:bg-white/5"><ArrowUp className="w-3 h-3" /></button>
              <button onClick={() => setSearchIndex((i) => Math.min(searchResults.length - 1, i + 1))} className="p-0.5 rounded hover:text-text hover:bg-black/5 dark:hover:bg-white/5"><ArrowDown className="w-3 h-3" /></button>
            </div>
          )}
          <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-0.5 rounded text-text-tertiary hover:text-text"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      <div className="flex-1 overflow-hidden py-3 bg-[#e8ded1] dark:bg-[#0b141a] bg-opacity-30 relative">
        <Virtuoso
          className="h-full scrollbar-subtle"
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          itemContent={(index, msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onRegenerate={msg.role === 'assistant' && index === messages.length - 1 ? handleRegenerate : undefined}
            />
          )}
          components={{
            Footer: () => (
              <>
                {streamingMsg && (
                  <div className="flex items-end gap-2 px-4 sm:px-6 py-1 justify-start mb-16">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 ring-1 ring-inset ring-primary-200/50 dark:ring-primary-700/30 flex items-center justify-center mb-1">
                      <Bot className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex flex-col max-w-[75%] min-w-0 items-start w-full">
                      {streamingContent === 'I\'m thinking...' && (
                        <div className="relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm bg-white dark:bg-surface-secondary text-text rounded-tl-sm">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                            <span className="text-text-secondary">I'm thinking...</span>
                          </div>
                        </div>
                      )}
                      {streamingContent !== 'I\'m thinking...' && (
                        <div className="relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm bg-white dark:bg-surface-secondary text-text rounded-tl-sm w-full">
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-code:before:content-none prose-code:after:content-none">
                            {renderMarkdown(streamingContent)}
                            <span className="inline-block w-1.5 h-4 bg-primary-500 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )
          }}
        />
        {isTyping && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <button
              onClick={stopGeneration}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border shadow-md rounded-full text-sm font-medium text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <Square className="w-3.5 h-3.5" /> Stop generating
            </button>
          </div>
        )}
      </div>
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
