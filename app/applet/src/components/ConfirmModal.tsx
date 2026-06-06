import { AlertTriangle } from 'lucide-react';

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
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">Are you sure?</h3>
        </div>
        <p className="text-zinc-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-5 py-2.5 bg-red-500/20 text-red-500 border border-red-500/30 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]">Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}
