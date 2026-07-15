import { motion } from 'framer-motion';
import { X, FileText, Upload } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';

interface FilesModalProps {
  onClose: () => void;
}

export function FilesModal({ onClose }: FilesModalProps) {
  const { uploadedFiles } = useChatStore();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.15 }} className="w-full max-w-xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border ">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-primary-500" />
            <h2 className="text-base font-semibold text-text ">Files</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-text-tertiary hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 pb-4 max-h-96 overflow-y-auto">
          {uploadedFiles.length === 0 ? (
            <div className="py-16 text-center">
              <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No files uploaded yet</p>
              <p className="text-xs text-text-tertiary mt-1">Use the paperclip icon in the chat input to upload files</p>
            </div>
          ) : (
            <div className="space-y-1">
              {uploadedFiles.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                  {f.dataUrl && f.type.startsWith('image/') ? (
                    <img src={f.dataUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-surface-tertiary flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{f.name}</p>
                    <p className="text-xs text-text-tertiary">{f.type || 'Unknown type'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
