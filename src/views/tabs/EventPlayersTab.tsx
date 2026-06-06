import React, { useState, useMemo } from 'react';
import { EventType, Player } from '../../types';
import { useStore } from '../../store';
import { getFlagUrl } from '../../iocToAlpha2';
import { Check, Search, Save } from 'lucide-react';

export function EventPlayersTab({ event, isAdmin }: { event: EventType, isAdmin: boolean }) {
  const { players, updateEvent } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track selected player IDs
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set(event.enrolledPlayers || []));

  const filteredPlayers = useMemo(() => {
    let result = isAdmin ? players : players.filter(p => enrolledIds.has(p.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q));
    }
    return result;
  }, [players, searchQuery, isAdmin, enrolledIds]);

  const handleTogglePlayer = (id: string) => {
    if (!isAdmin) return;
    const newSet = new Set(enrolledIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setEnrolledIds(newSet);
  };

  const handleSave = () => {
    updateEvent({
      ...event,
      enrolledPlayers: Array.from(enrolledIds)
    });
    alert('Roster saved successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-white">Event Roster ({enrolledIds.size} Enrolled)</h2>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                if (enrolledIds.size === players.length) {
                  setEnrolledIds(new Set());
                } else {
                  setEnrolledIds(new Set(players.map(p => p.id)));
                }
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-2xl font-bold text-sm transition-colors"
            >
              {enrolledIds.size === players.length ? 'Deselect All' : 'Select All'}
            </button>
            <button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 transition-colors">
              <Save className="w-4 h-4" />
              Save Roster
            </button>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6">
        <div className="mb-6 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search players to add or remove..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {filteredPlayers.map(player => {
            const isEnrolled = enrolledIds.has(player.id);
            return (
              <div 
                key={player.id} 
                onClick={() => handleTogglePlayer(player.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isAdmin ? 'cursor-pointer' : ''} ${isAdmin && isEnrolled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
              >
                {isAdmin && (
                  <div className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 border ${isEnrolled ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-700 bg-zinc-900'}`}>
                    {isEnrolled && <Check className="w-4 h-4" />}
                  </div>
                )}
                <div className="flex items-center gap-3 min-w-0">
                  {player.pictureUrl ? (
                    <img src={player.pictureUrl} alt={player.name} className="w-10 h-10 rounded-full object-cover bg-zinc-800 shrink-0" />
                  ) : getFlagUrl(player.country) ? (
                    <img src={getFlagUrl(player.country)!} alt={player.country} className="w-10 h-10 object-cover opacity-50 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-500 font-bold">
                      {player.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-white font-bold truncate">{player.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {getFlagUrl(player.country) && <img src={getFlagUrl(player.country)!} className="w-3.5 h-auto rounded" />}
                      <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider truncate">{player.country}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredPlayers.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 bg-zinc-950 rounded-xl border border-zinc-800">
              No players found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
