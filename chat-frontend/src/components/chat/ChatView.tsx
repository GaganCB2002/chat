import { useEffect, useRef, useState, useMemo } from 'react';
import { Search, X, ArrowUp, ArrowDown, AlertCircle, Bot, Square, ChevronsDown, Clock, Loader2, CheckCircle2, XCircle, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from '../../stores/chatStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';
import { TypingIndicator } from './TypingIndicator';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import { renderMarkdown } from '../../utils/markdown';

export function ChatView() {
  const { chats, currentChatId, sendMessage, isTyping, streamingContent, setView, ollamaError, stopGeneration, messageQueue } = useChatStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [atBottom, setAtBottom] = useState(true);
  const [queueExpanded, setQueueExpanded] = useState(true);

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

  const streamingMsg = isTyping ? { id: 'streaming', role: 'assistant' as const, content: streamingContent, timestamp: new Date(), action: 'none' as const } : null;

  const processingCount = messageQueue.filter((q) => q.status === 'processing').length;
  const queuedCount = messageQueue.filter((q) => q.status === 'queued').length;

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
          ref={virtuosoRef}
          className="h-full scrollbar-subtle"
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          followOutput="smooth"
          atBottomStateChange={setAtBottom}
          atBottomThreshold={80}
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
                      {!streamingContent ? (
                        <TypingIndicator />
                      ) : (
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

        {/* Scroll to bottom button */}
        {!atBottom && (
          <button
            onClick={() => virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth', align: 'end' })}
            className="absolute left-4 bottom-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-surface border border-border shadow-lg text-text-secondary hover:text-text hover:bg-surface-secondary hover:shadow-xl transition-all duration-200 group"
            title="Scroll to latest"
          >
            <ChevronsDown className="w-[18px] h-[18px] group-hover:translate-y-0.5 transition-transform" />
          </button>
        )}

        {/* Queue Panel — Top Right Corner */}
        <AnimatePresence>
          {messageQueue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-3 right-3 z-20 w-72"
            >
              <div className="rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden">
                {/* Header — always visible, clickable to collapse/expand */}
                <button
                  onClick={() => setQueueExpanded(!queueExpanded)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-primary-500" />
                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-primary-500 text-[8px] font-bold text-white flex items-center justify-center">
                        {messageQueue.length}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-text">Queue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {processingCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-primary-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {processingCount} active
                      </span>
                    )}
                    {queuedCount > 0 && (
                      <span className="text-[10px] font-medium text-text-tertiary">
                        {queuedCount} waiting
                      </span>
                    )}
                    {queueExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-text-tertiary" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
                    )}
                  </div>
                </button>

                {/* Expandable Items */}
                <AnimatePresence>
                  {queueExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border" />
                      <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto scrollbar-subtle">
                        {messageQueue.map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-2.5 px-3 py-2 rounded-xl bg-surface-secondary/50 border border-border/30"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {item.status === 'queued' && (
                                <div className="w-5 h-5 rounded-full bg-surface-tertiary flex items-center justify-center">
                                  <Clock className="w-3 h-3 text-text-tertiary" />
                                </div>
                              )}
                              {item.status === 'processing' && (
                                <div className="w-5 h-5 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                  <Loader2 className="w-3 h-3 text-primary-500 animate-spin" />
                                </div>
                              )}
                              {item.status === 'completed' && (
                                <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                </div>
                              )}
                              {item.status === 'failed' && (
                                <div className="w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                  <XCircle className="w-3 h-3 text-accent-rose" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-medium text-text-tertiary">#{idx + 1}</span>
                                <span className={`text-[10px] font-medium px-1.5 py-px rounded-full ${
                                  item.status === 'processing' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' :
                                  item.status === 'queued' ? 'bg-surface-tertiary text-text-tertiary' :
                                  item.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                                  'bg-rose-50 dark:bg-rose-900/20 text-accent-rose'
                                }`}>
                                  {item.status === 'processing' ? 'Processing' : item.status === 'queued' ? 'Queued' : item.status === 'completed' ? 'Done' : 'Failed'}
                                </span>
                              </div>
                              <p className="text-xs text-text leading-relaxed line-clamp-2 break-words">{item.content}</p>
                              {item.status === 'processing' && (
                                <div className="mt-1.5 flex items-center gap-2">
                                  <div className="flex-1 h-1 rounded-full bg-surface-tertiary overflow-hidden">
                                    <motion.div
                                      className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${item.progress || 0}%` }}
                                      transition={{ duration: 0.3, ease: 'easeOut' }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-medium text-text-tertiary tabular-nums">{item.progress || 0}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
