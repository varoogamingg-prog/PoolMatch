import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { PageTransition } from './components/PageTransition';
import { useStore } from './store';
import { Bell, Menu, X, Trophy, Globe, User, ShieldCheck, Users, Sun, Moon, Settings, FileText } from 'lucide-react';
import { EventsList } from './views/EventsList';
import { EventDetails } from './views/EventDetails';
import { LoginView } from './views/LoginView';
import { NewsView } from './views/NewsView';
import { PlayersView } from './views/PlayersView';
import { ScoreboardView } from './views/ScoreboardView';
import { SettingsView } from './views/SettingsView';
import { ScheduleView } from './views/ScheduleView';
import { OtpView } from './views/OtpView';
import { LogoutConfirmView } from './views/LogoutConfirmView';

function ToastItem({ toast, onRemove }: { toast: { id: string; message: string }; onRemove: () => void; key?: any }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 shadow-2xl px-4 py-3 rounded-xl text-sm font-medium animate-in slide-in-from-right-4 fade-in flex items-center justify-between gap-4 max-w-[92vw] sm:max-w-md w-full pointer-events-auto backdrop-blur-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="bg-emerald-500/10 p-1 rounded-2xl">
          <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>
        <span className="text-zinc-200 text-xs sm:text-sm break-words leading-relaxed">{toast.message}</span>
      </div>
      <button 
        onClick={onRemove} 
        className="text-zinc-500 hover:text-zinc-300 p-1 rounded-2xl hover:bg-zinc-800/80 transition-all shrink-0" 
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function Navigation() {
  const { user, setUser, setModal, settings } = useStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { name: 'Events', path: '/', icon: Trophy },
    { name: 'Schedule', path: '/schedule', icon: Globe },
    { name: 'Players', path: '/players', icon: Users },
    { name: 'News', path: '/news', icon: FileText },
  ];

  const renderLogo = () => {
    if (settings?.systemLogo?.startsWith('http') || settings?.systemLogo?.startsWith('data:')) {
      return <img src={settings.systemLogo} alt="Logo" className="w-8 h-8 rounded object-cover" />;
    }
    
    switch (settings?.systemLogo) {
      case 'Shield': return <ShieldCheck className="w-6 h-6 text-emerald-500" />;
      case 'Users': return <Users className="w-6 h-6 text-emerald-500" />;
      case 'Globe': return <Globe className="w-6 h-6 text-emerald-500" />;
      case 'PDF': return <FileText className="w-6 h-6 text-emerald-500" />;
      default: return <Trophy className="w-6 h-6 text-emerald-500" />;
    }
  };

  return (
    <>
    <header className={`fixed top-0 left-0 right-0 h-16 ${mobileOpen ? 'bg-zinc-950' : 'bg-zinc-950/80 backdrop-blur-md'} border-b border-zinc-800 z-50 px-4 print:hidden transition-colors`}>
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl" onClick={() => setMobileOpen(false)}>
          {renderLogo()}
          <span>{settings?.systemName || 'PRO SCORE'}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className={`flex items-center gap-2 text-sm font-medium transition-colors ${location.pathname === link.path ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <link.icon className="w-4 h-4" />
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4">
          {user?.role === 'owner' && (
            <button onClick={() => setModal('settings')} className="text-zinc-400 hover:text-white transition-colors"><Settings className="w-5 h-5" /></button>
          )}
          {user?.role === 'viewer' ? (
            <button onClick={() => setModal('otp')} className="px-4 py-2 bg-white text-black rounded-full font-bold text-sm">Login</button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400 flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-400" /> {user?.username}</span>
              <button onClick={() => setModal('logoutConfirm')} className="text-sm text-zinc-500 hover:text-red-400">Logout</button>
            </div>
          )}
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white p-2">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </header>
    
    <AnimatePresence>
      {mobileOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 top-16 bg-zinc-950 z-40 p-4 flex flex-col md:hidden overflow-y-auto"
        >
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 p-4 rounded-xl mb-2 ${location.pathname === link.path ? 'bg-zinc-900 text-white' : 'text-zinc-400'}`}>
              <link.icon className="w-5 h-5" />
              <span className="font-medium text-lg">{link.name}</span>
            </Link>
          ))}
          <div className="mt-auto pt-4 flex flex-col gap-2">
            {user?.role === 'owner' && (
              <button onClick={() => { setModal('settings'); setMobileOpen(false); }} className="p-4 bg-zinc-900 rounded-xl text-white flex items-center justify-center gap-2"><Settings className="w-5 h-5" /> Settings</button>
            )}
            {user?.role === 'viewer' ? (
              <button onClick={() => { setModal('otp'); setMobileOpen(false); }} className="p-4 bg-emerald-500 text-black rounded-xl font-bold flex items-center justify-center gap-2"><User className="w-5 h-5" /> Login</button>
            ) : (
              <button onClick={() => { setModal('logoutConfirm'); setMobileOpen(false); }} className="p-4 bg-red-500/10 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2">Logout ({user?.username})</button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

function MainContent() {
  const { initSocket, modal, setModal, theme, setTheme } = useStore();
  const location = useLocation();

  useEffect(() => {
    initSocket();
    setTheme(theme); // Apply the initial theme classes
  }, [initSocket, theme, setTheme]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col print:bg-white print:text-black">
      <Navigation />
      <main className="flex-1 pt-16 print:pt-4">
        <AnimatePresence mode="wait">
          {/* @ts-ignore */}
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><EventsList /></PageTransition>} />
            <Route path="/event/:id" element={<PageTransition><EventDetails /></PageTransition>} />
            <Route path="/schedule" element={<PageTransition><ScheduleView /></PageTransition>} />
            <Route path="/scoreboard/:id" element={<PageTransition><ScoreboardView /></PageTransition>} />
            <Route path="/players" element={<PageTransition><PlayersView /></PageTransition>} />
            <Route path="/news" element={<PageTransition><NewsView /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      
      {modal === 'login' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in">
            <LoginView />
          </div>
        </div>
      )}

      {modal === 'otp' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in">
            <OtpView />
          </div>
        </div>
      )}

      {modal === 'logoutConfirm' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in">
            <LogoutConfirmView />
          </div>
        </div>
      )}

      {modal === 'settings' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in max-h-[90vh] overflow-y-auto">
            <SettingsView />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainContent />
    </BrowserRouter>
  );
}
