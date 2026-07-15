import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-3 px-4 py-2 justify-start"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-xl gradient-primary shadow-lg shadow-primary-500/20 flex items-center justify-center">
        <Bot className="w-[18px] h-[18px] text-white" />
      </div>
      <div className="flex flex-col items-start">
        <div className="relative rounded-2xl px-5 py-3.5 bg-surface-tertiary border border-border/50 rounded-bl-md">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-primary-400"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
