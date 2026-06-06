import React, { useState } from 'react';
import { Match, EventType } from '../../types';
import { useStore } from '../../store';
import { X } from 'lucide-react';

export function EditMatchModal({ match, event, onClose }: { match: Match, event: EventType, onClose: () => void }) {
  const { updateMatch, players, matches } = useStore();
  const [time, setTime] = useState(match.time || '');
  const [tableNumber, setTableNumber] = useState(match.tableNumber || 1);
  const [scoringSystem, setScoringSystem] = useState(match.scoringSystem);
  const [raceTo, setRaceTo] = useState(match.raceTo || 9);
  const [bestOfSets, setBestOfSets] = useState(match.bestOfSets || 3);
  const [bracketPosition, setBracketPosition] = useState(match.bracketPosition || '');
  const [status, setStatus] = useState(match.status);
  const [notes, setNotes] = useState(match.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMatch({
      ...match,
      time,
      tableNumber,
      scoringSystem,
      raceTo: scoringSystem === 'race' ? raceTo : undefined,
      bestOfSets: scoringSystem === 'sets' ? bestOfSets : undefined,
      bracketPosition,
      status,
      notes
    });
    window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Match details saved!' }));
  };

  const getH2H = () => {
    if (typeof match.player1 === 'string' || typeof match.player2 === 'string') return null;
    
    let p1Wins = 0;
    let p2Wins = 0;
    const p1Id = match.player1.id;
    const p2Id = match.player2.id;
    
    matches.forEach(m => {
      // only count finished valid matches that are not the current match
      if (m.status !== 'finished' || m.id === match.id) return;
      if (typeof m.player1 === 'string' || typeof m.player2 === 'string') return;
      
      const isP1_vs_P2 = m.player1.id === p1Id && m.player2.id === p2Id;
      const isP2_vs_P1 = m.player1.id === p2Id && m.player2.id === p1Id;
      
      if (isP1_vs_P2) {
        if (m.score1 > m.score2) p1Wins++;
        else if (m.score2 > m.score1) p2Wins++;
      } else if (isP2_vs_P1) {
        if (m.score1 > m.score2) p2Wins++;
        else if (m.score2 > m.score1) p1Wins++;
      }
    });

    return { p1Wins, p2Wins };
  };

  const h2h = getH2H();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Match</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {h2h && typeof match.player1 !== 'string' && typeof match.player2 !== 'string' && (
          <div className="mb-6 bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center">
            <div className="text-xs font-bold font-mono tracking-widest text-zinc-500 uppercase mb-3">Head to Head Historical</div>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-center flex-1">
                <div className="font-bold text-white text-sm text-center mb-1">{match.player1.name}</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">{h2h.p1Wins}</div>
              </div>
              <div className="px-4 text-zinc-600 font-bold italic">VS</div>
              <div className="flex flex-col items-center flex-1">
                <div className="font-bold text-white text-sm text-center mb-1">{match.player2.name}</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">{h2h.p2Wins}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Time</label>
            <input type="text" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Table Number</label>
            <input type="number" value={tableNumber} onChange={e => setTableNumber(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white">
              <option value="pending">Pending</option>
              <option value="live">Live</option>
              <option value="finished">Finished</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Scoring System</label>
            <select value={scoringSystem} onChange={e => setScoringSystem(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white">
              <option value="race">Race To</option>
              <option value="sets">Best of Sets</option>
            </select>
          </div>
          {scoringSystem === 'race' ? (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Race To</label>
              <input type="number" value={raceTo} onChange={e => setRaceTo(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white" />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Best of Sets</label>
              <input type="number" value={bestOfSets} onChange={e => setBestOfSets(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white" />
            </div>
          )}
          {match.stage === 'knockout' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Bracket Position</label>
              <input type="text" value={bracketPosition} onChange={e => setBracketPosition(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white" />
            </div>
          )}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white min-h-[80px]" placeholder="Add match notes..." />
          </div>

          <div className="flex gap-4 pt-4 mt-4 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="flex-1 bg-zinc-800 text-white font-bold py-2 rounded-2xl hover:bg-zinc-700">Close</button>
            <button type="submit" className="flex-1 bg-emerald-500 text-black font-bold py-2 rounded-2xl hover:bg-emerald-400">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
