import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, Edit2, Trash2, Check, X, Bot, User, Bookmark, Share2, Pin, Clock, AlertCircle, Loader2, FileText, FileImage, FileArchive, FileCode, Film, File, ExternalLink, X as XIcon } from 'lucide-react';
import type { Message, UploadedFile } from '../../types';
import { renderMarkdown } from '../../utils/markdown';
import { cn } from '../../utils/cn';
import { useSettingsStore } from '../../stores/settingsStore';
import { useChatStore } from '../../stores/chatStore';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
}

function fileIcon(type: string) {
  if (!type) return File;
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return File;
  if (type.includes('pdf') || type.includes('text') || type.includes('json') || type.includes('csv')) return FileText;
  if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) return FileArchive;
  if (type.includes('javascript') || type.includes('typescript') || type.includes('python') || type.includes('java')) return FileCode;
  return File;
}

function FileViewerModal({ file, onClose }: { file: UploadedFile; onClose: () => void }) {
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4 bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-secondary">
          <div className="flex items-center gap-2 min-w-0">
            {isImage ? (
              <FileImage className="w-4 h-4 text-primary-500 flex-shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
            )}
            <span className="text-sm font-medium text-text truncate">{file.name}</span>
            <span className="text-[10px] text-text-tertiary">
              {file.size > 1024 * 1024
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : `${(file.size / 1024).toFixed(0)} KB`}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all text-text-tertiary hover:text-text">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-white dark:bg-surface-tertiary/50 flex items-center justify-center min-h-[300px]">
          {isImage ? (
            <img src={file.dataUrl} alt={file.name} className="max-w-full max-h-[70vh] rounded-lg object-contain" />
          ) : isPDF ? (
            <iframe src={file.dataUrl} title={file.name} className="w-full h-[70vh] rounded-lg border-0" />
          ) : (
            <div className="flex flex-col items-center gap-4 text-text-secondary p-8">
              <FileText className="w-16 h-16 text-primary-500/50" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-text-tertiary">Preview not available for this file type</p>
              <a
                href={file.dataUrl}
                download={file.name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageFiles({ files }: { files: UploadedFile[] }) {
  const [viewerFile, setViewerFile] = useState<UploadedFile | null>(null);

  if (!files || files.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-2">
        {files.map((f) => {
          const isImage = f.type.startsWith('image/');
          const Icon = fileIcon(f.type);
          const sizeStr = f.size > 1024 * 1024
            ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
            : `${(f.size / 1024).toFixed(0)} KB`;

          return (
            <div key={f.id}>
              {isImage ? (
                <img
                  src={f.dataUrl}
                  alt={f.name}
                  title={f.name}
                  className="max-w-[200px] max-h-[150px] rounded-lg object-cover cursor-pointer border border-border hover:opacity-90 transition-opacity"
                  onClick={() => setViewerFile(f)}
                />
              ) : (
                <button
                  onClick={() => setViewerFile(f)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface-secondary/50 hover:bg-surface-secondary transition-all text-left max-w-[220px] group"
                >
                  <Icon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-text truncate">{f.name}</p>
                    <p className="text-[10px] text-text-tertiary">{sizeStr}</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {viewerFile && <FileViewerModal file={viewerFile} onClose={() => setViewerFile(null)} />}
    </>
  );
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const { settings } = useSettingsStore();
  const { editMessage, deleteMessage, likeMessage, dislikeMessage, togglePinMessage } = useChatStore();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const isAssistant = message.role === 'assistant';

  const copyFallback = (text: string) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch {
      // clipboard not available
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      copyFallback(message.content);
    }
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      copyFallback(message.content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = () => {
    if (editText.trim() && editText !== message.content) {
      editMessage(message.id, editText.trim());
    }
    setEditing(false);
  };

  const handleDelete = () => {
    deleteMessage(message.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group flex items-end gap-2 px-4 sm:px-6 py-1',
        isAssistant ? 'justify-start' : 'justify-end'
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 ring-1 ring-inset ring-primary-200/50 dark:ring-primary-700/30 flex items-center justify-center mb-1 relative">
          <Bot className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          {message.pinned && <Pin className="w-2.5 h-2.5 text-primary-500 absolute -top-0.5 -right-0.5" />}
        </div>
      )}

      <div className={cn('flex flex-col max-w-[75%] min-w-0', isAssistant ? 'items-start' : 'items-end')}>
        {isAssistant && message.thinkingSteps && message.thinkingSteps.length > 0 && (
          <div className="mb-2 w-full max-w-md bg-white dark:bg-surface-secondary border border-border rounded-xl p-3 shadow-sm text-sm">
            <div className="font-medium text-text-secondary mb-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              Thinking Process
            </div>
            <div className="space-y-1.5 pl-1">
              {message.thinkingSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {step.status === 'completed' ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : step.status === 'active' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-border" />
                  )}
                  <span className={cn(
                    step.status === 'active' ? 'text-text font-medium' :
                    step.status === 'completed' ? 'text-text-secondary' : 'text-text-tertiary'
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={cn(
          'relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
          isAssistant
            ? 'bg-white dark:bg-surface-secondary text-text rounded-tl-sm'
            : 'bg-primary-500 text-white rounded-tr-sm',
          message.pinned && 'ring-2 ring-primary-500/30'
        )}>
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full text-sm bg-white dark:bg-surface-tertiary rounded-xl border border-border p-3 text-text focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                autoFocus
              />
              <div className="flex gap-1.5 justify-end">
                <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-all shadow-sm">
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button onClick={() => { setEditing(false); setEditText(message.content); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.files && message.files.length > 0 && (
                <MessageFiles files={message.files} />
              )}
              {(() => {
                const cleaned = message.content
                  .replace(/\[ attached image: .+? \]\n?/g, '')
                  .replace(/\[ attached file: .+? \]\n?/g, '')
                  .trim();
                if (!cleaned) return null;
                return (
                  <div className={cn(
                    'prose prose-sm max-w-none leading-relaxed',
                    isAssistant
                      ? 'dark:prose-invert prose-code:before:content-none prose-code:after:content-none'
                      : 'prose-invert prose-code:before:content-none prose-code:after:content-none',
                    message.status === 'generating' && isAssistant ? 'after:content-[""] after:inline-block after:w-1.5 after:h-4 after:bg-primary-500 after:ml-1 after:animate-pulse after:align-middle' : ''
                  )}>
                    {renderMarkdown(cleaned)}
                  </div>
                );
              })()}
            </>
          )}

          <div className={cn(
            'flex items-center gap-1.5 mt-1.5',
            isAssistant ? 'justify-start' : 'justify-end'
          )}>
            <span className={cn(
              'text-[10px]',
              isAssistant ? 'text-text-tertiary' : 'text-white/70'
            )}>
              {(() => { const d = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp); return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); })()}
            </span>
            {!isAssistant && (
              <span className="flex items-center">
                {message.status === 'sending' && <Clock className="w-3 h-3 text-white/50" />}
                {message.status === 'sent' && <Check className="w-3.5 h-3.5 text-white/70" />}
                {message.status === 'completed' && (
                  <svg className="w-3.5 h-3.5 text-white/70" viewBox="0 0 16 11" fill="currentColor">
                    <path d="M11.071.653a.457.457 0 0 0-.304-.102H4.705a.457.457 0 0 0-.304.102.373.373 0 0 0-.113.275.373.373 0 0 0 .113.275l4.162 3.795a.553.553 0 0 0 .402.162.553.553 0 0 0 .402-.162l4.162-3.795a.373.373 0 0 0 .113-.275.373.373 0 0 0-.113-.275h-.001z" />
                    <path d="M11.071 5.653a.457.457 0 0 0-.304-.102H4.705a.457.457 0 0 0-.304.102.373.373 0 0 0-.113.275.373.373 0 0 0 .113.275l4.162 3.795a.553.553 0 0 0 .402.162.553.553 0 0 0 .402-.162l4.162-3.795a.373.373 0 0 0 .113-.275.373.373 0 0 0-.113-.275h-.001z" />
                  </svg>
                )}
                {message.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-red-300" />}
              </span>
            )}
          </div>
        </div>

        {!editing && (
          <div className={cn(
            'flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            isAssistant ? 'flex-row' : 'flex-row-reverse'
          )}>
            {isAssistant ? (
              <>
                <MiniButton icon={copied ? Check : Copy} onClick={handleCopy} active={copied} />
                <MiniButton icon={ThumbsUp} onClick={() => likeMessage(message.id)} active={message.action === 'like'} activeColor="text-primary-500" />
                <MiniButton icon={ThumbsDown} onClick={() => dislikeMessage(message.id)} active={message.action === 'dislike'} activeColor="text-accent-rose" />
                {onRegenerate && <MiniButton icon={RefreshCw} onClick={onRegenerate} />}
                <MiniButton icon={Bookmark} onClick={() => togglePinMessage(message.id)} active={!!message.pinned} />
                <MiniButton icon={shared ? Check : Share2} onClick={handleShare} active={shared} />
              </>
            ) : (
              <>
                <MiniButton icon={Edit2} onClick={() => { setEditText(message.content); setEditing(true); }} />
                <MiniButton icon={Trash2} onClick={handleDelete} hoverColor="hover:text-accent-rose" />
              </>
            )}
            {settings.showTokenCount && message.tokens && (
              <span className="text-[9px] text-text-tertiary px-1">{message.tokens}t</span>
            )}
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-1">
          <User className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
        </div>
      )}
    </motion.div>
  );
}

function MiniButton({ icon: Icon, onClick, active, activeColor, hoverColor }: {
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
  hoverColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-1 rounded-md transition-all',
        active
          ? activeColor || 'text-primary-500'
          : 'text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5',
        hoverColor
      )}
    >
      <Icon className="w-3 h-3" />
    </button>
  );
}
