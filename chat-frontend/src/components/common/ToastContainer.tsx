import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';
import { cn } from '../../utils/cn';

const VARIANTS = {
  success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  error: { icon: AlertCircle, color: 'text-accent-rose', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  info: { icon: Info, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const variant = VARIANTS[toast.variant] ?? VARIANTS.info;
          const Icon = variant.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={cn('pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm', variant.bg)}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', variant.color)} />
              <div className="flex-1 min-w-0">
                {toast.title && <p className="text-sm font-medium text-text ">{toast.title}</p>}
                <p className="text-xs text-text-secondary ">{toast.description}</p>
              </div>
              <button onClick={() => removeToast(toast.id)} className="p-0.5 rounded text-text-tertiary hover:text-text transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
