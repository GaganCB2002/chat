import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, Mic, Keyboard, X, FileText, Image, Film, File, AlertTriangle, FileImage, FileCode, FileArchive, MicOff, Clock, CheckCircle2, XCircle, Loader2, ListOrdered } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettingsStore } from '../../stores/settingsStore';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const MAX_CHARS = 8000;

const FILE_CATEGORIES = [
  { id: 'images', label: 'Images', icon: FileImage, accept: '.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.ico', desc: 'PNG, JPG, GIF, WebP, SVG' },
  { id: 'documents', label: 'Documents', icon: FileText, accept: '.pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.xlsx,.pptx,.odt', desc: 'PDF, DOC, TXT, MD, CSV, JSON' },
  { id: 'code', label: 'Code', icon: FileCode, accept: '.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.cs,.rb,.go,.rs,.swift,.kt,.scala,.php,.sql,.sh,.yaml,.yml,.toml,.ini,.cfg', desc: 'JS, TS, Python, Java, C++, Go, Rust' },
  { id: 'archives', label: 'Archives', icon: FileArchive, accept: '.zip,.rar,.7z,.tar,.gz,.bz2,.xz', desc: 'ZIP, RAR, 7Z, TAR, GZ' },
  { id: 'media', label: 'Media', icon: Film, accept: '.mp4,.webm,.mov,.avi,.mkv,.mp3,.wav,.ogg,.flac,.aac,.wma', desc: 'MP4, WebM, MOV, MP3, WAV, OGG' },
  { id: 'all', label: 'All Files', icon: File, accept: '*', desc: 'Any file type' },
];

const fileIcon = (type: string) => {
  if (!type) return File;
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Mic;
  if (type.includes('pdf') || type.includes('text') || type.includes('json') || type.includes('csv')) return FileText;
  if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gzip')) return FileArchive;
  if (type.includes('javascript') || type.includes('typescript') || type.includes('python') || type.includes('java') || type.includes('x-python')) return FileCode;
  return File;
};

const SpeechRecognitionCtor = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : undefined;

const hasSpeechSupport = !!SpeechRecognitionCtor;

function createRecognition(): any {
  const Ctor = SpeechRecognitionCtor;
  if (!Ctor) return null;
  const recog = new Ctor();
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = 'en-US';
  return recog;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const { settings } = useSettingsStore();
  const { uploadedFiles, addFile, removeFile, stopGeneration, messageQueue } = useChatStore();
  const { isAuthenticated, trialUsed, trialLimit } = useAuthStore();
  const [text, setText] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [listening, setListening] = useState(false);
  const [showQueuePopover, setShowQueuePopover] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileAcceptRef = useRef('*');
  const recognitionRef = useRef<any>(null);

  const adjustSize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => { adjustSize(); }, [text, adjustSize]);
  useEffect(() => () => { recognitionRef.current?.stop(); recognitionRef.current = null; }, []);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !showShortcuts) { setText(''); textareaRef.current?.blur(); }
    if (e.key === 'Enter' && (settings.sendOnEnter ? !e.shiftKey : e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCategoryPick = (accept: string) => {
    fileAcceptRef.current = accept;
    setShowFileMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) addFile(files[i]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleMic = useCallback(() => {
    if (!hasSpeechSupport) return;

    if (listening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    const recognition = createRecognition();
    if (!recognition) return;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alt = result[0];
        if (!alt) continue;
        if (result.isFinal) {
          finalTranscript += alt.transcript;
        } else {
          interim += alt.transcript;
        }
      }
      setText(finalTranscript + interim);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  const remaining = MAX_CHARS - text.length;

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((f) => addFile(f));
  };

  return (
    <div
      className={cn('border-t border-border bg-surface px-4 py-3 transition-all relative', isDragging && 'bg-primary-50 dark:bg-primary-900/10')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center z-50 rounded-xl border-2 border-dashed border-primary-500 bg-primary-50/80 dark:bg-primary-900/40 backdrop-blur-sm">
          <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Drop files here</p>
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {uploadedFiles.map((f) => {
              const Icon = fileIcon(f.type);
              const sizeStr = f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`;
              return (
                <div key={f.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs max-w-[200px]">
                  {f.type.startsWith('image/') ? (
                    <img src={f.dataUrl} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                  ) : (
                    <Icon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  )}
                  <span className="truncate text-text flex-1 min-w-0">{f.name}</span>
                  <span className="text-text-tertiary flex-shrink-0 text-[10px]">{sizeStr}</span>
                  <button onClick={() => removeFile(f.id)} className="p-0.5 rounded text-text-tertiary hover:text-accent-rose transition-all flex-shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div className="relative flex items-end gap-1.5 bg-surface-secondary rounded-xl border border-border focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/30 transition-all">
          <div className="flex-shrink-0 relative">
            <Button variant="ghost" size="icon" onClick={() => setShowFileMenu(!showFileMenu)} className="text-text-tertiary hover:text-text-dark mt-2 ml-1" tabIndex={-1}>
              <Paperclip className="w-4 h-4" />
            </Button>
            <input ref={fileInputRef} type="file" multiple accept="*" onChange={handleFileChange} className="hidden" />
            <AnimatePresence>
              {showFileMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowFileMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.1 }}
                    className="absolute bottom-full left-0 mb-2 z-40 w-52 p-1.5 rounded-xl bg-surface border border-border shadow-lg"
                  >
                    <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider px-2.5 py-1.5">Upload file</p>
                    {FILE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryPick(cat.accept)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      >
                        <cat.icon className="w-4 h-4 text-text-tertiary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{cat.label}</p>
                          <p className="text-[10px] text-text-tertiary truncate">{cat.desc}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setText(e.target.value); }}
            onKeyDown={handleKeyDown}
            placeholder={listening ? 'Listening...' : 'Ask anything...'}
            rows={1}
            className="flex-1 py-3 px-1 bg-transparent text-sm text-text placeholder-text-tertiary resize-none focus:outline-none leading-relaxed max-h-40 scrollbar-subtle"
          />

          <div className="flex items-center gap-0.5 pr-1.5 pb-1.5 flex-shrink-0">
            <div className="relative">
              <Button variant="ghost" size="icon-xs" onClick={() => setShowShortcuts(!showShortcuts)} className="text-text-tertiary hover:text-text" tabIndex={-1}>
                <Keyboard className="w-3.5 h-3.5" />
              </Button>
              {showShortcuts && (
                <div className="absolute bottom-full right-0 mb-2 z-50 w-56 p-3 rounded-xl bg-surface border border-border shadow-lg" onClick={() => setShowShortcuts(false)}>
                  <p className="text-xs font-semibold text-text mb-2">Keyboard Shortcuts</p>
                  <div className="space-y-1.5">
                    {[
                      { keys: settings.sendOnEnter ? 'Enter' : 'Ctrl + Enter', label: 'Send message' },
                      { keys: settings.sendOnEnter ? 'Shift + Enter' : 'Enter', label: 'New line' },
                      { keys: 'Esc', label: 'Clear input' },
                    ].map(({ keys, label }) => (
                      <div key={label} className="flex justify-between items-center text-xs">
                        <span className="text-text-secondary ">{label}</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-text-tertiary text-[10px] font-mono">{keys}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={toggleMic}
              className={cn('flex items-center justify-center w-7 h-7 rounded-lg transition-all', listening ? 'bg-accent-rose text-white animate-pulse shadow-lg shadow-accent-rose/30'                     : 'text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5')}
              tabIndex={-1}
            >
              {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <div className="w-px h-5 bg-border mx-0.5" />
            {disabled ? (
              <div className="flex gap-0.5">
                <button onClick={handleSend} disabled={!text.trim()} className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={stopGeneration} className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-rose text-white hover:bg-rose-600 transition-all" title="Stop generating">
                  <Square className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={handleSend} disabled={!text.trim()} className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-1.5 px-1">
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <span className={cn('flex items-center gap-1 text-[10px]', trialUsed >= trialLimit ? 'text-accent-rose font-medium' : 'text-text-tertiary')}>
                <AlertTriangle className="w-3 h-3" /> Trial: {trialUsed}/{trialLimit}
              </span>
            )}
            <p className="text-[10px] text-text-tertiary">Kortex can make mistakes. Verify important information.</p>
          </div>
          <div className="flex items-center gap-2">
            {messageQueue.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowQueuePopover(!showQueuePopover)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-tertiary border border-border text-[10px] font-medium text-text-secondary hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  <Loader2 className="w-3 h-3 animate-spin text-primary-500" />
                  <span>{messageQueue.filter(q => q.status === 'processing' || q.status === 'queued').length} pending</span>
                </button>
                <AnimatePresence>
                  {showQueuePopover && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowQueuePopover(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.1 }}
                        className="absolute bottom-full right-0 mb-2 z-40 w-72 rounded-xl bg-surface border border-border shadow-lg overflow-hidden"
                      >
                        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface-secondary/50">
                          <ListOrdered className="w-3.5 h-3.5 text-primary-500" />
                          <span className="text-[11px] font-semibold text-text uppercase tracking-wider">Queue</span>
                          <span className="ml-auto text-[10px] font-medium text-text-tertiary bg-surface-tertiary px-1.5 py-0.5 rounded-full">
                            {messageQueue.length} item{messageQueue.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="p-1.5 max-h-52 overflow-y-auto scrollbar-subtle">
                          {messageQueue.map((item) => (
                            <div key={item.id} className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                              <div className="flex-shrink-0 mt-0.5">
                                {item.status === 'queued' && <Clock className="w-3.5 h-3.5 text-text-tertiary" />}
                                {item.status === 'processing' && <Loader2 className="w-3.5 h-3.5 text-primary-500 animate-spin" />}
                                {item.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                {item.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-accent-rose" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-text leading-relaxed line-clamp-1 break-words">{item.content}</p>
                                {item.status === 'processing' && item.progress > 0 && (
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <div className="flex-1 h-1 rounded-full bg-surface-tertiary overflow-hidden">
                                      <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.progress}%` }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-medium text-text-tertiary tabular-nums">{item.progress}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            {text.length > 7000 && (
              <span className={cn('text-[10px] font-medium', remaining < 100 ? 'text-accent-rose' : 'text-text-tertiary')}>{remaining}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
