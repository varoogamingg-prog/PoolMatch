import React from 'react';
import { useStore } from '../store';
import { LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LogoutConfirmView() {
  const { setModal, setUser } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser({ id: 'viewer', username: 'Guest', role: 'viewer' });
    setModal(null);
    navigate('/');
  };

  return (
    <div className="w-full relative p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-center">
      <button onClick={() => setModal(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors bg-zinc-800 p-1.5 rounded-2xl">
        <X className="w-5 h-5" />
      </button>
      <div className="flex justify-center mb-6 mt-4">
        <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/30 shadow-inner">
           <LogOut className="w-10 h-10 text-red-500" />
        </div>
      </div>
      <h2 className="text-2xl font-display font-black text-white mb-2">Confirm Logout</h2>
      <p className="text-zinc-400 text-sm mb-8">Are you sure you want to end your current session? You will need to log back in to manage events.</p>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setModal(null)} 
          className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleLogout} 
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-500/20"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
