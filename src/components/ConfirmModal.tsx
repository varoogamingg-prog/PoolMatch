import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ConfirmModal({ 
  isOpen, 
  message, 
  onConfirm, 
  onCancel 
}: { 
  isOpen: boolean, 
  message: string, 
  onConfirm: () => void, 
  onCancel: () => void 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Are you sure?</h3>
            </div>
            <p className="text-zinc-400 mb-6 leading-relaxed">{message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={onCancel} 
                className="px-5 py-2.5 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onCancel();
                }} 
                className="px-5 py-2.5 bg-red-500/20 text-red-500 border border-red-500/30 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                Yes, Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
