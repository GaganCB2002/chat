import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 px-1 py-2 justify-start"
    >
      <div className="flex flex-col items-start">
        <div className="relative rounded-2xl px-5 py-3.5 bg-surface-tertiary border border-border/50 rounded-tl-sm flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-4 h-4 text-primary-500" />
          </motion.div>
          <div className="flex items-center gap-1 font-medium text-sm text-text-secondary">
            Thinking
            <span className="flex">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                >
                  .
                </motion.span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
