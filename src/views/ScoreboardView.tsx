import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Disc, Maximize, X, Minus, Plus, History, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

export function ScoreboardView({ matchId, onClose }: { matchId?: string, onClose?: () => void }) {
  const { id } = useParams();
  const { matches, updateMatch, events, isAdminForEvent } = useStore();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{action: () => void, text: string} | null>(null);

  const finalId = matchId || id;
  const match = matches.find(m => m.id === finalId);
  const event = events.find(e => e.id === match?.eventId);
  const isAdmin = isAdminForEvent(match?.eventId || '');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleScore = (playerIndex: 1 | 2, delta: number) => {
    if (!match) return;
    if (match.status === 'finished') return;
    
    const key = playerIndex === 1 ? 'score1' : 'score2';
    const newScore = Math.max(0, match[key] + delta);
    const max = match.scoringSystem === 'race' ? match.raceTo! : match.bestOfSets!;
    
    if (newScore > max) return;
    
    if (newScore === max) {
      setConfirmAction({
        text: `Is this the winner? Score will be ${playerIndex === 1 ? newScore : match.score1} - ${playerIndex === 2 ? newScore : match.score2} and the match will be marked as finished.`,
        action: () => {
          const newHistory = [...(match.history || [])];
          newHistory.unshift({ timestamp: Date.now(), action: `${delta > 0 ? '+' : ''}${delta} pt`, playerIndex });
          updateMatch({ 
            ...match, 
            [key]: newScore,
            history: newHistory,
            status: 'finished',
            endTime: Date.now()
          });
        }
      });
    } else {
      const newHistory = [...(match.history || [])];
      if (newScore !== match[key]) {
        newHistory.unshift({ timestamp: Date.now(), action: `${delta > 0 ? '+' : ''}${delta} pt`, playerIndex });
      }
      updateMatch({ 
        ...match, 
        [key]: newScore,
        history: newHistory,
        status: match.status === 'pending' && newScore > 0 ? 'live' : match.status 
      });
    }
  };

  const handleExtension = (playerIndex: 1 | 2, delta: number) => {
    if (!match) return;
    const key = playerIndex === 1 ? 'extensions1' : 'extensions2';
    const current = match[key] || 0;
    const next = Math.max(0, current + delta);
    
    const newHistory = [...(match.history || [])];
    if (next !== current) {
      newHistory.unshift({
        timestamp: Date.now(),
        action: `${delta > 0 ? '+' : ''}${delta} ext`,
        playerIndex
      });
    }

    updateMatch({ ...match, [key]: next, history: newHistory });
  };

  if (!match) return <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">Scoreboard connecting...</div>;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Fullscreen may be blocked in preview. Please open the app in a new tab.' }));
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const p1Name = typeof match.player1 === 'string' ? match.player1 : match.player1.name;
  const p2Name = typeof match.player2 === 'string' ? match.player2 : match.player2.name;

  const getH2H = () => {
    if (!match || typeof match.player1 === 'string' || typeof match.player2 === 'string') return null;
    let p1Wins = 0;
    let p2Wins = 0;
    const p1Id = match.player1.id;
    const p2Id = match.player2.id;
    
    matches.forEach(x => {
      if (x.status !== 'finished' || x.id === match.id) return;
      if (typeof x.player1 === 'string' || typeof x.player2 === 'string') return;
      const isP1_vs_P2 = x.player1.id === p1Id && x.player2.id === p2Id;
      const isP2_vs_P1 = x.player1.id === p2Id && x.player2.id === p1Id;
      if (isP1_vs_P2) {
        if (x.score1 > x.score2) p1Wins++;
        else if (x.score2 > x.score1) p2Wins++;
      } else if (isP2_vs_P1) {
        if (x.score1 > x.score2) p2Wins++;
        else if (x.score2 > x.score1) p1Wins++;
      }
    });
    return { p1Wins, p2Wins, total: p1Wins + p2Wins };
  };

  const h2h = getH2H();

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen bg-zinc-950 z-[100] flex flex-col font-display select-none overflow-hidden overscroll-none">
      {confirmAction && (
        <ConfirmModal 
          isOpen={true}
          message={confirmAction.text} 
          onConfirm={() => { confirmAction.action(); setConfirmAction(null); }} 
          onCancel={() => setConfirmAction(null)} 
        />
      )}
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-zinc-950/90 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />
      
      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-6">
          <button onClick={toggleFullscreen} className="w-12 h-12 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-zinc-800 backdrop-blur-md">
            <Maximize className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <div className="text-zinc-500 font-bold tracking-[0.2em] text-xs uppercase mb-1">
              {match.stage.replace('-', ' ')}
            </div>
            <div className="text-white font-black tracking-widest text-lg uppercase">
              TABLE {match.tableNumber || 1}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors border border-zinc-800 backdrop-blur-md">
             <History className="w-5 h-5" />
             <span className="font-bold tracking-widest text-sm uppercase hidden sm:inline">History</span>
           </button>
           {match.status === 'live' && (
             <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl">
               <Disc className="w-4 h-4 text-red-500 animate-pulse" />
               <span className="text-red-500 font-bold tracking-widest text-sm uppercase">Live</span>
             </div>
           )}
           <button onClick={() => onClose ? onClose() : navigate(-1)} className="w-12 h-12 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-zinc-800 backdrop-blur-md">
             <X className="w-6 h-6" />
           </button>
        </div>
      </div>

      {/* Main Score Area */}
      <div className="flex flex-1 w-full relative z-10 items-center justify-center px-12 min-h-0">
        
        {/* Player 1 Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
           <div className="text-center mb-12">
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">{p1Name}</h1>
              <div className="text-emerald-500 font-bold text-xl tracking-[0.2em] uppercase">
                {match.scoringSystem === 'sets' ? 'Sets Won' : 'Race to'} {match.scoringSystem === 'sets' ? (match.setsWon1 || 0) : match.raceTo}
              </div>
           </div>
           
           <div className="flex items-center gap-4 sm:gap-8">
             {isAdmin && (
               <button onClick={() => handleScore(1, -1)} className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 rounded-2xl flex items-center justify-center text-white hover:bg-red-400 transition-colors shadow-lg active:scale-95 shrink-0">
                 <Minus className="w-8 h-8 sm:w-10 sm:h-10" />
               </button>
             )}
             <div className="flex flex-col items-center">
               <div className="text-8xl md:text-[14rem] lg:text-[18rem] leading-none font-black text-zinc-100 tabular-nums drop-shadow-[0_0_50px_rgba(255,255,255,0.15)] px-2 sm:px-4">
                 {match.score1}
               </div>
               {match.extensions1 !== undefined && match.extensions1 > 0 && (
                 <div className="mt-4 flex gap-2">
                   {Array.from({ length: match.extensions1 }).map((_, i) => (
                     <div key={i} className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                   ))}
                 </div>
               )}
               {isAdmin && (
                  <div className="mt-4 flex gap-2">
                     <button onClick={() => handleExtension(1, -1)} className="px-3 py-1 bg-zinc-800 text-xs text-white rounded hover:bg-zinc-700">EXT -</button>
                     <button onClick={() => handleExtension(1, 1)} className="px-3 py-1 bg-zinc-800 text-xs text-white rounded hover:bg-zinc-700">EXT +</button>
                  </div>
               )}
             </div>
             {isAdmin && (
               <button onClick={() => handleScore(1, 1)} className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500 rounded-2xl flex items-center justify-center text-black hover:bg-emerald-400 transition-colors shadow-lg active:scale-95 shrink-0">
                 <Plus className="w-8 h-8 sm:w-10 sm:h-10" />
               </button>
             )}
           </div>
        </div>

        {/* Center Divider/VS */}
        <div className="px-16 flex flex-col items-center justify-center">
           <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-zinc-700 to-transparent mb-8" />
           <div className="text-2xl font-black text-zinc-700 tracking-widest italic uppercase">VS</div>
           <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-zinc-700 to-transparent mt-8" />
        </div>

        {/* Player 2 Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
           <div className="text-center mb-12">
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">{p2Name}</h1>
              <div className="text-emerald-500 font-bold text-xl tracking-[0.2em] uppercase">
                {match.scoringSystem === 'sets' ? 'Sets Won' : 'Race to'} {match.scoringSystem === 'sets' ? (match.setsWon2 || 0) : match.raceTo}
              </div>
           </div>
           
           <div className="flex items-center gap-4 sm:gap-8">
             {isAdmin && (
               <button onClick={() => handleScore(2, -1)} className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 rounded-2xl flex items-center justify-center text-white hover:bg-red-400 transition-colors shadow-lg active:scale-95 shrink-0">
                 <Minus className="w-8 h-8 sm:w-10 sm:h-10" />
               </button>
             )}
             <div className="flex flex-col items-center">
               <div className="text-8xl md:text-[14rem] lg:text-[18rem] leading-none font-black text-zinc-100 tabular-nums drop-shadow-[0_0_50px_rgba(255,255,255,0.15)] px-2 sm:px-4">
                 {match.score2}
               </div>
               {match.extensions2 !== undefined && match.extensions2 > 0 && (
                 <div className="mt-4 flex gap-2">
                   {Array.from({ length: match.extensions2 }).map((_, i) => (
                     <div key={i} className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                   ))}
                 </div>
               )}
               {isAdmin && (
                  <div className="mt-4 flex gap-2">
                     <button onClick={() => handleExtension(2, -1)} className="px-3 py-1 bg-zinc-800 text-xs text-white rounded hover:bg-zinc-700">EXT -</button>
                     <button onClick={() => handleExtension(2, 1)} className="px-3 py-1 bg-zinc-800 text-xs text-white rounded hover:bg-zinc-700">EXT +</button>
                  </div>
               )}
             </div>
             {isAdmin && (
               <button onClick={() => handleScore(2, 1)} className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500 rounded-2xl flex items-center justify-center text-black hover:bg-emerald-400 transition-colors shadow-lg active:scale-95 shrink-0">
                 <Plus className="w-8 h-8 sm:w-10 sm:h-10" />
               </button>
             )}
           </div>
        </div>

      </div>

      {/* Head to Head (Scroll Down) */}
      {h2h && h2h.total > 0 && (
        <div className="relative z-10 flex flex-col items-center justify-center py-12 px-8 w-full max-w-2xl mx-auto border-t border-zinc-900 mt-auto">
          <div className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mb-8">Head to Head</div>
          <div className="flex items-center w-full gap-8">
            <div className="flex-1 flex flex-col items-end">
              <span className="text-zinc-400 text-sm uppercase tracking-wider mb-2">{p1Name}</span>
              <span className={`text-5xl font-black ${h2h.p1Wins > h2h.p2Wins ? 'text-emerald-400' : 'text-zinc-500'}`}>{h2h.p1Wins}</span>
            </div>
            <div className="text-zinc-800 text-xl font-bold italic">VS</div>
            <div className="flex-1 flex flex-col items-start">
              <span className="text-zinc-400 text-sm uppercase tracking-wider mb-2">{p2Name}</span>
              <span className={`text-5xl font-black ${h2h.p2Wins > h2h.p1Wins ? 'text-emerald-400' : 'text-zinc-500'}`}>{h2h.p2Wins}</span>
            </div>
          </div>
          <div className="text-zinc-600 text-sm mt-6">{h2h.total} previous meetings</div>
        </div>
      )}

      {/* Match History Panel */}
      {showHistory && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-zinc-950/95 border-l border-zinc-800 backdrop-blur-xl z-[110] flex flex-col transform transition-transform shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-500" />
              History
            </h2>
            <button onClick={() => setShowHistory(false)} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(!match.history || match.history.length === 0) ? (
              <div className="text-center text-zinc-500 italic mt-8">No scoring events yet.</div>
            ) : (
              match.history.map((entry, idx) => (
                <div key={idx} className="flex flex-col bg-zinc-900/50 rounded-2xl p-3 border border-zinc-800/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">
                      {entry.playerIndex === 1 ? p1Name : p2Name}
                    </span>
                    <span className={`text-sm font-bold ${entry.action.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {entry.action}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
