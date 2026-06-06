import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

export function LoginView() {
  const { setUser, events, setModal, settings } = useStore();
  const navigate = useNavigate();
  const [role, setRole] = useState<'owner' | 'admin' | 'news'>('admin');
  const [adminCode, setAdminCode] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'owner') {
      if (password === '102126') {
        setUser({ id: 'owner-1', role: 'owner', username: 'Super Admin' });
        navigate('/');
        setModal(null);
      } else {
        alert('Invalid Owner Password');
      }
    } else if (role === 'news') {
      if (password === settings.newsPassword) {
        setUser({ id: 'news-1', role: 'news', username: 'News Reporter' });
        navigate('/news');
        setModal(null);
      } else {
        alert('Invalid News Password');
      }
    } else if (role === 'admin') {
      const event = events.find(ev => ev.adminCode === adminCode || (ev.adminCodes && ev.adminCodes.includes(adminCode)));
      if (event) {
        setUser({ id: `admin-${event.id}`, role: 'admin', username: 'Event Admin', eventId: event.id });
        navigate(`/event/${event.id}`);
        setModal(null);
      } else {
        alert('Invalid Admin Code');
      }
    }
  };

  return (
    <div className="w-full relative p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
      <button onClick={() => setModal(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors bg-zinc-800 p-1.5 rounded-2xl">
        <X className="w-5 h-5" />
      </button>
      <div className="flex justify-center mb-6 mt-4">
        <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700 shadow-inner">
           <ShieldCheck className="w-10 h-10 text-emerald-400" />
        </div>
      </div>
      <h2 className="text-3xl font-display font-black text-center text-white mb-2">Staff Portal</h2>
      <p className="text-zinc-500 text-center text-sm mb-8">Authenticate with your assigned role to access controls.</p>
      
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-zinc-950 rounded-xl border border-zinc-800/50">
          {(['admin', 'news', 'owner'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-3 py-2.5 text-sm font-bold rounded-2xl capitalize transition-all ${role === r ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {r}
            </button>
          ))}
        </div>

        {role === 'admin' ? (
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-1.5">Event Admin Code (6-chars)</label>
            <input 
              type="text" 
              maxLength={6}
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 font-mono text-white text-lg tracking-widest text-center focus:outline-none focus:border-emerald-500 transition-colors" 
              placeholder="e.g. WPM2A1"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-1.5 capitalize">{role} Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 font-mono text-white text-lg tracking-widest text-center focus:outline-none focus:border-emerald-500 transition-colors" 
              placeholder={`Enter ${role} password`}
            />
          </div>
        )}

        <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black text-lg py-3 rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
          Authenticate
        </button>
      </form>
    </div>
  );
}
