import React, { useState } from 'react';
import { EventType } from '../../types';
import { useStore } from '../../store';
import { CheckCircle } from 'lucide-react';

export function AdminTab({ event }: { event: EventType }) {
  const { updateEvent, isOwner } = useStore();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-10 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-display font-bold text-white">Event Administration</h2>
      </div>
      
      <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 relative overflow-hidden h-fit">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
        <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-2 relative z-10">Admin Control Panel</h3>
        <p className="text-zinc-400 text-sm mb-4 relative z-10">Use this code to grant event-specific access to line judges and match admins.</p>
        <div className="relative z-10 p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl flex items-center justify-between mb-2">
           <span className="font-mono text-3xl tracking-widest font-black text-emerald-400">{event.adminCode}</span>
        </div>
        {event.adminCodes && event.adminCodes.length > 0 && (
          <div className="relative z-10 mb-6 border border-zinc-800 rounded-2xl p-2 bg-zinc-900">
            <span className="text-xs text-zinc-500 uppercase font-bold">Extra Codes:</span>
            <div className="font-mono text-zinc-300 mt-1">{event.adminCodes.join(', ')}</div>
          </div>
        )}

        <div className="space-y-2 relative z-10 mb-8 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <span className="text-xs text-zinc-500 uppercase font-bold">Default Match Rules:</span>
          <div className="text-white text-sm font-medium">System: <span className="text-emerald-400 capitalize">{event.defaultScoringSystem || 'Race'}</span></div>
          <div className="text-white text-sm font-medium">To Win: <span className="text-emerald-400">{event.defaultRaceTo || 9}</span></div>
        </div>
        
        <div className="space-y-4 border-t border-zinc-800 pt-6 relative z-10">
          <h4 className="text-white font-bold mb-2">Automated Rulesets</h4>
          
          <label className="flex items-start gap-3 text-sm text-zinc-300">
            <input type="checkbox" className="mt-1 w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500" defaultChecked />
            <div>
              <div className="font-bold text-white">Auto-sync brackets</div>
              <div className="text-zinc-500">Automatically advance winners in knockout stage.</div>
            </div>
          </label>

          <label className="flex items-start gap-3 text-sm text-zinc-300">
            <input type="checkbox" className="mt-1 w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500" defaultChecked />
            <div>
              <div className="font-bold text-white">Push Notifications</div>
              <div className="text-zinc-500">Broadcast match completions to connected apps globally.</div>
            </div>
          </label>
        </div>

        {isOwner() && event.format === 'round-robin' && event.status !== 'finished' && (
          <div className="pt-6 border-t border-zinc-800 relative z-10 mt-6">
            <button type="button" onClick={() => {
                updateEvent({ ...event, status: 'finished' });
            }} className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-colors border border-emerald-500/50 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4"/> Finish Event (Owner Only)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
