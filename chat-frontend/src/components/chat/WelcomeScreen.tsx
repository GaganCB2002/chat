import { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Paperclip, Mic, MicOff, Image, Code, BookOpen, Search, PenLine, Languages, Lightbulb, FileText, Bug, Sparkles, X, File, Pin } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { cn } from '../../utils/cn';

interface WelcomeScreenProps {
  onSend: (text: string) => void;
}

const QUICK_ACTIONS = [
  { id: 'write', label: 'Write', icon: PenLine, prompt: 'Help me write a professional email. Here are the key points I want to include:' },
  { id: 'code', label: 'Code', icon: Code, prompt: 'Write code for the following task. Include comments and error handling:' },
  { id: 'research', label: 'Research', icon: Search, prompt: 'Research and provide a comprehensive overview of:' },
  { id: 'learn', label: 'Learn', icon: BookOpen, prompt: 'Teach me about the following topic. Break it down into simple concepts:' },
  { id: 'summarize', label: 'Summarize', icon: Sparkles, prompt: 'Summarize the following content. Keep it concise and highlight the key points:' },
  { id: 'translate', label: 'Translate', icon: Languages, prompt: 'Translate the following text. Preserve the tone and meaning:' },
  { id: 'explain', label: 'Explain', icon: Lightbulb, prompt: 'Explain the following concept in simple terms. Use analogies if helpful:' },
  { id: 'generate-ideas', label: 'Generate Ideas', icon: PenLine, prompt: 'Generate creative ideas and solutions for:' },
  { id: 'documentation', label: 'Documentation', icon: FileText, prompt: 'Write clear documentation for the following. Include examples:' },
  { id: 'fix-bugs', label: 'Fix Bugs', icon: Bug, prompt: 'Debug and fix the following issue. Explain what went wrong:' },
];

const fileIcon = (type: string) => {
  if (!type) return File;
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Mic;
  if (type.startsWith('audio/')) return Mic;
  if (type.includes('pdf') || type.includes('text') || type.includes('json') || type.includes('csv')) return FileText;
  if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gzip')) return File;
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeScreen({ onSend }: WelcomeScreenProps) {
  const { uploadedFiles, addFile, removeFile } = useChatStore();
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  useEffect(() => () => { recognitionRef.current?.stop(); recognitionRef.current = null; }, []);
  const greeting = useMemo(() => getGreeting(), []);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    onSend(prompt);
  };

  const handleFilePick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '*';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) addFile(files[i]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleMic = () => {
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

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center flex-1 px-6 py-8"
    >
      <input ref={fileInputRef} type="file" multiple accept="*" onChange={handleFileChange} className="hidden" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center w-full max-w-2xl mx-auto"
      >
        <div className="text-center mb-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-semibold text-text tracking-tight"
          >
            {greeting}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-2 text-base text-text-secondary "
          >
            What would you like to build today?
          </motion.p>
        </div>

        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 mb-3 w-full max-w-2xl"
          >
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
                  <button onClick={() => removeFile(f.id)} className="p-0.5 rounded text-text-tertiary hover:text-accent-rose transition-all">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="w-full"
        >
          <div className="relative flex items-end gap-2 bg-surface rounded-2xl border border-border shadow-sm focus-within:shadow-md focus-within:border-primary-500/40 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-300">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening ? 'Listening...' : 'Ask anything...'}
              rows={1}
              className="flex-1 py-4 px-5 bg-transparent text-base text-text placeholder-text-tertiary resize-none focus:outline-none leading-relaxed max-h-40 scrollbar-subtle"
              style={{ minHeight: '56px' }}
            />
            <div className="flex items-center gap-1 pr-3 pb-3 flex-shrink-0">
              <button
                onClick={handleFilePick}
                className="p-2 rounded-xl text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                tabIndex={-1}
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={toggleMic}
                className={cn(
                  'p-2 rounded-xl transition-all',
                  listening
                    ? 'text-white bg-accent-rose animate-pulse shadow-lg shadow-accent-rose/30'
                    : 'text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5'
                )}
                tabIndex={-1}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                  text.trim()
                    ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm shadow-primary-500/20'
                    : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
                )}
              >
                <ArrowUp className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="w-full mt-6"
        >
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider text-center mb-3">
            <Pin className="w-3 h-3 inline mr-1" />Pinned Tools
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => useChatStore.getState().setShowResumeOptimizer(true)}
              className="group flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-primary-500/40 bg-primary-50/50 dark:bg-primary-900/10 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:border-primary-500 hover:bg-primary-100/50 dark:hover:bg-primary-900/20 transition-all duration-200 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Optimize Resume
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="w-full mt-2"
        >
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider text-center mb-3">Quick actions</p>
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_ACTIONS.map((action, i) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.03, duration: 0.2 }}
                onClick={() => handleQuickAction(action.prompt)}
                className="group flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface text-xs font-medium text-text-secondary hover:border-primary-500/30 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all duration-200"
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-8 text-[11px] text-text-tertiary text-center"
        >
          Kortex can make mistakes. Verify important information.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
