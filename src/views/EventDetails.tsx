import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/currency';
import { useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { Calendar, MapPin, DollarSign, LayoutList, Trophy, Users, AlertCircle, Users2 } from 'lucide-react';
import { MatchesTab } from './tabs/MatchesTab';
import { BracketsTab } from './tabs/BracketsTab';
import { StandingsTab } from './tabs/StandingsTab';
import { InfoTab } from './tabs/InfoTab';
import { AdminTab } from './tabs/AdminTab';
import { EventPlayersTab } from './tabs/EventPlayersTab';
import { motion, AnimatePresence } from 'motion/react';

export function EventDetails() {
  const { id } = useParams();
  const { events, isAdminForEvent, matches } = useStore();
  const event = events.find(e => e.id === id);
  const eventMatches = matches.filter(m => m.eventId === id);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'matches';
  
  const [activeTab, setActiveTab] = useState<'matches' | 'brackets' | 'standings' | 'players' | 'info'>(initialTab);
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab') as any);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  if (!event) return <div className="text-white p-8 text-center text-xl">Event not found</div>;

  const isAdmin = isAdminForEvent(event.id);

  const tabs = [
    { id: 'matches', label: 'Matches', icon: LayoutList },
    ...(event.format !== 'round-robin' ? [{ id: 'brackets', label: 'Bracket', icon: Trophy }] as const : []),
    ...(event.format !== 'knockout' ? [{ id: 'standings', label: 'Standings', icon: Users }] as const : []),
    { id: 'players', label: 'Players', icon: Users2 },
    { id: 'info', label: 'Event Info', icon: AlertCircle },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Calendar }] as const : []),
  ] as const;

  const handleBracketMatchClick = (matchId: string) => {
    setActiveTab('matches');
    setHighlightedMatchId(matchId);
    setTimeout(() => {
      const matchEl = document.getElementById(`match-${matchId}`);
      if (matchEl) {
        matchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
    setTimeout(() => setHighlightedMatchId(null), 3000);
  };

  const handleMatchListClick = (matchId: string) => {
    setActiveTab('brackets');
    setHighlightedMatchId(matchId);
    setTimeout(() => {
      const bracketEl = document.getElementById(`bracket-match-${matchId}`);
      if (bracketEl) {
        bracketEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        // Also ensure scroll-x of the parent if horizontal overflow
        const parent = bracketEl.closest('.overflow-x-auto');
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const elRect = bracketEl.getBoundingClientRect();
          const scrollLeft = elRect.left - parentRect.left - parentRect.width / 2 + elRect.width / 2;
          parent.scrollBy({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    }, 200);
    setTimeout(() => setHighlightedMatchId(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Event Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-10 mb-8 relative overflow-hidden">
        {/* Banner image */}
        {event.bannerUrl && (
          <div className="absolute inset-0 opacity-20 z-0">
             <img src={event.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-transparent"></div>
          </div>
        )}
        {/* Abstract background flair */}
        <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              {isAdmin && (
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-sm font-mono uppercase font-bold tracking-wider">
                  Event Admin Access
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">{event.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-zinc-500" /> {new Date(event.startDate).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-zinc-500" /> {event.venue}</span>
                <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-zinc-500" /> {typeof event.prizepool === 'number' ? formatCurrency(event.prizepool, event.currency || 'USD') : event.prizepool}</span>
              </div>
            </div>
          </div>
          {event.logoUrl && (
            <div className="flex-shrink-0 hidden md:block">
              <img src={event.logoUrl} alt="Logo" className="w-32 h-32 rounded-2xl object-cover bg-zinc-950 border border-zinc-800 p-2 shadow-2xl" />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 md:gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-6 md:py-3 rounded-t-xl font-bold transition-all whitespace-nowrap text-sm md:text-base ${
              activeTab === tab.id 
                ? 'bg-zinc-800 text-white border-b-2 border-emerald-500' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
            }`}
          >
            <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[50vh] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'matches' && <MatchesTab event={event} matches={eventMatches} isAdmin={isAdmin} onMatchClick={handleMatchListClick} onGoToBracket={() => setActiveTab('brackets')} highlightedMatchId={highlightedMatchId} />}
            {activeTab === 'brackets' && <BracketsTab event={event} matches={eventMatches} onMatchClick={handleBracketMatchClick} highlightedMatchId={highlightedMatchId} />}
            {activeTab === 'standings' && <StandingsTab matches={eventMatches} event={event} isAdmin={isAdmin} />}
            {activeTab === 'players' && <EventPlayersTab event={event} isAdmin={isAdmin} />}
            {activeTab === 'info' && <InfoTab event={event} isAdmin={isAdmin} />}
            {activeTab === 'admin' && isAdmin && <AdminTab event={event} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
