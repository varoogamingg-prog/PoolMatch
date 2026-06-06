import React, { useState } from 'react';
import { Match, StandingsEntry, Player, EventType } from '../../types';
import { useStore } from '../../store';
import { Scissors } from 'lucide-react';
import { generateBracketLayout } from '../../utils/bracketLogic';

export function StandingsTab({ matches, event, isAdmin }: { matches: Match[], event: EventType, isAdmin: boolean }) {
  const { addMatch, addMatches, players, updateEvent } = useStore();
  const [cutSize, setCutSize] = useState(4);
  const standingsMap = new Map<string, StandingsEntry>();

  const initPlayer = (player: Player) => {
    if (!standingsMap.has(player.id)) {
      standingsMap.set(player.id, {
        playerId: player.id,
        player,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        racksWon: 0,
        racksLost: 0,
        rackDifference: 0,
        points: 0
      });
    }
  };

  if (event.enrolledPlayers) {
    event.enrolledPlayers.forEach(id => {
      const p = players.find(x => x.id === id);
      if (p) initPlayer(p);
    });
  }

  matches.forEach(m => {
    if (m.status === 'pending') return;
    if (typeof m.player1 === 'string' || typeof m.player2 === 'string') return;

    initPlayer(m.player1);
    initPlayer(m.player2);

    const s1 = standingsMap.get(m.player1.id)!;
    const s2 = standingsMap.get(m.player2.id)!;

    s1.matchesPlayed++;
    s2.matchesPlayed++;

    s1.racksWon += m.score1;
    s1.racksLost += m.score2;
    s2.racksWon += m.score2;
    s2.racksLost += m.score1;

    s1.rackDifference = s1.racksWon - s1.racksLost;
    s2.rackDifference = s2.racksWon - s2.racksLost;

    if (m.score1 > m.score2) {
      s1.wins++;
      s1.points += 1;
      s2.losses++;
    } else {
      s2.wins++;
      s2.points += 1;
      s1.losses++;
    }
  });

  const standings = Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.rackDifference - a.rackDifference;
  });

  const handleCut = () => {
    if (standings.length < cutSize) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Not enough players to cut' }));
      return;
    }
    if (![2, 4, 8, 16, 32, 64, 128].includes(cutSize)) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Cut size must be a power of 2' }));
      return;
    }

    const existingKnockout = matches.filter(m => m.eventId === event.id && m.stage === 'knockout');
    if (existingKnockout.length > 0) {
      if (confirm('Knockout matches already exist. Do you want to overwrite them with a new bracket?')) {
        const idsToDelete = existingKnockout.map(m => m.id);
        useStore.getState().deleteMatches(idsToDelete);
      } else {
        return;
      }
    }

    const topPlayers = standings.slice(0, cutSize).map(s => s.player);
    const matchesToAdd: Match[] = [];
    
    // Get proper bracket positions using bracketLogic
    const allPosRoutes = generateBracketLayout(cutSize, false, undefined);
    const firstRound = allPosRoutes.length > 0 ? allPosRoutes[0].roundName : '';
    const firstRoundRoutes = allPosRoutes.filter(r => r.roundName === firstRound);

    // Simple top vs bottom pairing for the first round of knockout
    for (let i = 0; i < cutSize / 2; i++) {
       const p1 = topPlayers[i];
       const p2 = topPlayers[cutSize - 1 - i];
       
       const route = firstRoundRoutes[i];
       const bracketPosition = route ? route.bp : `R${cutSize} - M${i+1}`;

       matchesToAdd.push({
         id: 'm-' + Math.random().toString(36).substr(2, 6),
         eventId: event.id,
         player1: p1,
         player2: p2,
         score1: 0,
         score2: 0,
         status: 'pending',
         stage: 'knockout',
         tableNumber: i + 1,
         scoringSystem: event.defaultScoringSystem || 'race',
         raceTo: event.defaultRaceTo ?? 9,
         bracketPosition,
         time: 'TBD'
       });
    }
    if (matchesToAdd.length > 0) {
      addMatches(matchesToAdd);
      if (event.format === 'hybrid') {
        updateEvent({ ...event, bracketSize: cutSize });
      }
    }
    window.dispatchEvent(new CustomEvent('app-toast', { detail: `Generated knockout matches for Top ${cutSize}` }));
  };

  const handleCutToNextRR = () => {
    if (standings.length < cutSize) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Not enough players to cut' }));
      return;
    }

    const existingStages = Array.from(new Set(matches.filter(m => m.eventId === event.id && m.stage === 'round-robin').map(m => m.bracketPosition || 'Stage 1')));
    const stageName = `Stage ${existingStages.length + 1}`;

    const topPlayers = standings.slice(0, cutSize).map(s => s.player);
    
    // Auto-generate RR matches for the next stage
    const matchesToAdd: Match[] = [];
    for (let i=0; i<topPlayers.length; i++) {
      for (let j=i+1; j<topPlayers.length; j++) {
        matchesToAdd.push({
          id: 'm-' + Math.random().toString(36).substr(2, 6),
          eventId: event.id,
          player1: topPlayers[i],
          player2: topPlayers[j],
          score1: 0,
          score2: 0,
          status: 'pending',
          stage: 'round-robin',
          bracketPosition: stageName,
          tableNumber: 1,
          scoringSystem: event.defaultScoringSystem || 'race',
          raceTo: event.defaultRaceTo ?? 9,
          time: 'TBD'
        });
      }
    }
    
    if (matchesToAdd.length > 0) {
      addMatches(matchesToAdd);
    }
    
    window.dispatchEvent(new CustomEvent('app-toast', { detail: `Roster updated to Top ${cutSize} and new Round Robin matches generated!` }));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {isAdmin && (event.format === 'round-robin' || event.format === 'hybrid') && (
        <div className="flex flex-col gap-2 p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="text-zinc-400 text-sm">Advance top players to next stage</div>
            <div className="flex gap-2 items-center flex-wrap">
              <label className="text-zinc-500 text-sm">Top:</label>
              <input type="number" min="2" max={standings.length || 100} value={cutSize} onChange={e => setCutSize(Number(e.target.value))} className="bg-zinc-900 border border-zinc-700 text-white rounded px-2 py-1 text-sm w-20" />
              
              <button onClick={handleCut} className="bg-emerald-500 text-black px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-emerald-400">
                 <Scissors className="w-4 h-4"/> Cut & Automate KO
              </button>

              <button onClick={handleCutToNextRR} className="bg-blue-500 text-black px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-blue-400">
                 <Scissors className="w-4 h-4"/> Cut to Next RR
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider font-bold">
              <th className="p-4 py-3 font-medium">Rank</th>
              <th className="p-4 py-3 font-medium">Player</th>
              <th className="p-4 py-3 font-medium">MP</th>
              <th className="p-4 py-3 font-medium text-emerald-400">W</th>
              <th className="p-4 py-3 font-medium text-red-500">L</th>
              <th className="p-4 py-3 font-medium text-blue-400">Points</th>
              <th className="p-4 py-3 font-medium">Racks W-L</th>
              <th className="p-4 py-3 font-medium">Rack Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {standings.map((entry, idx) => {
              const isQualified = idx < cutSize;
              return (
              <tr key={entry.playerId} className={`hover:bg-zinc-800/50 transition-colors ${!isQualified ? 'opacity-60' : ''}`}>
                <td className="p-4">
                  <div className={`w-8 h-6 rounded flex items-center justify-center font-bold font-mono text-sm ${isQualified ? 'bg-red-600 text-white shadow-sm' : 'bg-[#1e293b] text-white'}`}>
                    {idx + 1}
                  </div>
                </td>
                <td className="p-4 flex items-center gap-3">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-xs text-zinc-400 border border-zinc-700">
                     {entry.player.country?.substring(0, 2) || '--'}
                  </div>
                  <div>
                    <div className="font-bold text-white">{entry.player.name}</div>
                    <div className="text-xs text-zinc-500 uppercase font-medium">{entry.player.country}</div>
                  </div>
                </td>
                <td className="p-4 text-zinc-300 font-mono">{entry.matchesPlayed}</td>
                <td className="p-4 font-bold text-emerald-400 font-mono">{entry.wins}</td>
                <td className="p-4 font-bold text-red-500 font-mono">{entry.losses}</td>
                <td className="p-4 font-bold text-blue-400 font-mono">{entry.points}</td>
                <td className="p-4 text-zinc-400 font-mono">{entry.racksWon} - {entry.racksLost}</td>
                <td className="p-4 font-bold font-mono text-white">
                  <span className={entry.rackDifference > 0 ? 'text-emerald-400' : entry.rackDifference < 0 ? 'text-red-400' : ''}>
                    {entry.rackDifference > 0 ? '+' : ''}{entry.rackDifference}
                  </span>
                </td>
              </tr>
              );
            })}
            {standings.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-zinc-500 italic">
                  Standings will update automatically as matches are finished.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
