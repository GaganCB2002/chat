import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useSettingsStore } from '../../stores/settingsStore';
import { MODELS } from '../../constants';

export function DeveloperInfo() {
  const { devMode, settings, ollamaStatus } = useSettingsStore();

  if (!devMode) return null;

  const currentModel = MODELS.find((m) => m.id === settings.model);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-3 px-4 py-1.5 bg-black/5 dark:bg-white/5 border-t border-border text-[10px]"
    >
      <div className="flex items-center gap-1">
        <span className={cn('w-1.5 h-1.5 rounded-full', ollamaStatus.connected ? 'bg-emerald-500' : 'bg-accent-rose')} />
        <span className="text-text-tertiary">Ollama</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={cn('w-1.5 h-1.5 rounded-full', ollamaStatus.connected ? 'bg-emerald-500' : 'bg-amber-500')} />
        <span className="text-text-tertiary">Streaming</span>
      </div>
      <div className="w-px h-3 bg-border mx-1" />
      <span className="text-text-tertiary font-mono">{currentModel?.icon || '🧠'} {currentModel?.name || settings.model}</span>
      {ollamaStatus.connected && ollamaStatus.availableModels.length > 0 && (
        <span className="text-text-tertiary font-mono">{ollamaStatus.availableModels.length} models</span>
      )}
      <span className="text-text-tertiary font-mono">v2.1.0</span>
      <span className="text-text-tertiary font-mono">dev</span>
    </motion.div>
  );
}
