import { motion } from 'framer-motion';
import { X, Bookmark } from 'lucide-react';

interface PromptLibraryProps {
  onClose: () => void;
}

export function PromptLibrary({ onClose }: PromptLibraryProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.15 }} className="w-full max-w-xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border ">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-primary-500" />
            <h2 className="text-base font-semibold text-text ">Prompt Library</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 pb-4">
          <div className="py-16 text-center">
            <Bookmark className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No prompts yet</p>
            <p className="text-xs text-text-tertiary mt-1">Prompt library coming soon</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
