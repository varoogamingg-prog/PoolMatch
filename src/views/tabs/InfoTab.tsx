import React, { useState } from 'react';
import { formatCurrency } from '../../utils/currency';
import { EventType } from '../../types';
import { useStore } from '../../store';
import { Save, Image as ImageIcon, CheckCircle, Trash2, MapPin, Calendar, Trophy, DollarSign, LayoutList } from 'lucide-react';
import { ImageUpload } from '../../components/ImageUpload';

export function InfoTab({ event, isAdmin }: { event: EventType, isAdmin: boolean }) {
  const { updateEvent, isOwner } = useStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<EventType>(event);

  const handleSave = () => {
    updateEvent(formData);
    setIsEditMode(false);
  };

  const handleAdminCodesChange = (val: string) => {
    const codes = val.split(',').map(c => c.trim()).filter(Boolean);
    setFormData({ ...formData, adminCodes: codes });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-10 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-display font-bold text-white">Event Information</h2>
        {isAdmin && !isEditMode && (
          <button onClick={() => setIsEditMode(true)} className="bg-zinc-800 text-white px-4 py-2 rounded-2xl text-sm font-bold hover:bg-zinc-700">
            Edit Event
          </button>
        )}
      </div>
      
      {isEditMode ? (
        <div className="space-y-6 bg-zinc-950 p-6 rounded-xl border border-zinc-800">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-zinc-400 text-sm mb-1">Event Name</label>
               <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white" />
             </div>
             <div>
               <label className="block text-zinc-400 text-sm mb-1">Venue</label>
               <input type="text" value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white" />
             </div>
             <div className="md:col-span-2">
               <label className="block text-zinc-400 text-sm mb-1">Description (Optional)</label>
               <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white leading-relaxed" />
             </div>
             <div className="md:col-span-2">
               <label className="block text-zinc-400 text-sm mb-1">Rules (Optional)</label>
               <textarea value={formData.rules || ''} onChange={e => setFormData({...formData, rules: e.target.value})} rows={4} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-white leading-relaxed" />
             </div>
             
             <div className="md:col-span-2 border border-zinc-800 rounded-2xl p-4 bg-zinc-950 space-y-4">
               <div className="flex justify-between items-center">
                 <h4 className="text-white font-bold">Prize Pool Settings</h4>
                 <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium text-zinc-400">Currency</label>
                    <select value={formData.currency || 'USD'} onChange={e => setFormData({...formData, currency: e.target.value})} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-sm">
                      <option value="USD">USD ($)</option>
                      <option value="IDR">IDR (Rp)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                 </div>
               </div>

               <div>
                 <label className="block text-zinc-400 text-sm mb-1">Total Prize Pool</label>
                 <input type="number" required value={(formData.prizepool as number) || ''} onChange={e => setFormData({...formData, prizepool: parseInt(e.target.value) || 0})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white" placeholder="e.g. 50000" />
               </div>
               
               <div className="space-y-2 pt-2">
                 <label className="block text-zinc-400 text-sm mb-1">Prize Breakdown (Optional)</label>
                 {(formData.prizepoolDetails || []).map((detail, idx) => (
                    <div key={idx} className="flex gap-2">
                       <input type="text" placeholder="Rank (e.g. 1st)" value={detail.rank} onChange={e => {
                          const fresh = [...(formData.prizepoolDetails || [])];
                          fresh[idx] = { ...fresh[idx], rank: e.target.value };
                          setFormData({ ...formData, prizepoolDetails: fresh });
                       }} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-white text-sm" />
                       <input type="number" placeholder="Amount (e.g. 10000)" value={detail.amount || ''} onChange={e => {
                          const fresh = [...(formData.prizepoolDetails || [])];
                          fresh[idx] = { ...fresh[idx], amount: parseInt(e.target.value) || 0 };
                          setFormData({ ...formData, prizepoolDetails: fresh });
                       }} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-white text-sm" />
                       <button type="button" onClick={() => {
                          const fresh = (formData.prizepoolDetails || []).filter((_, i) => i !== idx);
                          setFormData({ ...formData, prizepoolDetails: fresh });
                       }} className="p-1.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 ))}
                 
                 <div className="flex justify-between items-center mt-2">
                   <button type="button" onClick={() => {
                     setFormData({ ...formData, prizepoolDetails: [...(formData.prizepoolDetails || []), { rank: '', amount: 0 }] });
                   }} className="text-sm text-emerald-400 hover:text-emerald-300 font-medium">+ Add Custom</button>
                   <button type="button" onClick={() => {
                      let size = event.format === 'round-robin' ? event.totalPlayers : event.bracketSize;
                      if (!size || size < 2) size = 32;

                      const tiers = [];
                      if (size >= 1) tiers.push({ rank: '1st', amount: 0 });
                      if (size >= 2) tiers.push({ rank: '2nd', amount: 0 });
                      
                      let currentPower = 4;
                      while (currentPower <= size) {
                        const lower = currentPower / 2 + 1;
                        const upper = currentPower;
                        const rank = lower === upper ? `${lower}th` : `${lower}th-${upper}th`;
                        tiers.push({ rank, amount: 0 });
                        currentPower *= 2;
                      }
                      
                      setFormData({ ...formData, prizepoolDetails: tiers });
                   }} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1 bg-indigo-500/10 rounded-lg">Auto-fill via Bracket Size</button>
                 </div>
               </div>
             </div>
             <div>
               <label className="block text-zinc-400 text-sm mb-1">Main Admin Code</label>
               <input type="text" value={formData.adminCode} onChange={e => setFormData({...formData, adminCode: e.target.value.toUpperCase()})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white" />
             </div>
             <div className="md:col-span-2">
               <label className="block text-zinc-400 text-sm mb-1">Additional Admin Codes (comma separated)</label>
               <input type="text" value={(formData.adminCodes || []).join(', ')} onChange={e => handleAdminCodesChange(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white" placeholder="CODE1, CODE2" />
             </div>
             <div>
               <label className="block text-zinc-400 text-sm mb-1">Status</label>
               <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white">
                 <option value="upcoming">Upcoming</option>
                 <option value="live">Live</option>
                 <option value="finished">Finished</option>
               </select>
             </div>
             <div>
               <label className="block text-zinc-400 text-sm mb-1">Format</label>
               <select value={formData.format} onChange={e => setFormData({...formData, format: e.target.value as any})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white">
                 <option value="knockout">Knockout</option>
                 <option value="round-robin">Round Robin</option>
               </select>
             </div>
             <div>
               <label className="block text-zinc-400 text-sm mb-1">Elimination Type</label>
               <select value={formData.eliminationType} onChange={e => setFormData({...formData, eliminationType: e.target.value as any})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white">
                 <option value="single">Single Elimination</option>
                 <option value="double">Double Elimination</option>
               </select>
             </div>
             <div>
               <label className="block text-zinc-400 text-sm mb-1">Qualifier Event?</label>
               <select value={formData.isQualifier ? 'true' : 'false'} onChange={e => setFormData({...formData, isQualifier: e.target.value === 'true'})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white">
                 <option value="false">No (Standard Event)</option>
                 <option value="true">Yes (Multi-Stage Qualifier)</option>
               </select>
             </div>
             
             {formData.isQualifier && (
               <>
                 <div>
                   <label className="block text-zinc-400 text-sm mb-1">Total Starting Players</label>
                   <input type="number" min="2" value={formData.totalPlayers || 32} onChange={e => setFormData({...formData, totalPlayers: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white" />
                 </div>
                 <div>
                   <label className="block text-zinc-400 text-sm mb-1">Qualification Spots</label>
                   <input type="number" min="1" value={formData.qualifierSpots || 8} onChange={e => setFormData({...formData, qualifierSpots: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white" />
                 </div>
               </>
             )}
             
             {!formData.isQualifier && formData.format === 'knockout' && (
               <div>
                 <label className="block text-zinc-400 text-sm mb-1">Bracket Size (Players)</label>
                 <input type="number" min="2" value={formData.bracketSize || 32} onChange={e => setFormData({...formData, bracketSize: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white" />
               </div>
             )}

             <div>
               <label className="block text-zinc-400 text-sm mb-1">Default Scoring System</label>
               <select value={formData.defaultScoringSystem || 'race'} onChange={e => setFormData({...formData, defaultScoringSystem: e.target.value as 'race'|'sets'})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white">
                 <option value="race">Race to X</option>
                 <option value="sets">Best of Sets</option>
               </select>
             </div>
             <div>
               <label className="block text-zinc-400 text-sm mb-1">Default Points to Win (Race To/Sets)</label>
               <input type="number" min="1" value={formData.defaultRaceTo || 9} onChange={e => setFormData({...formData, defaultRaceTo: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-white" />
             </div>
             <div className="lg:col-span-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800 mt-2">
               <label className="block text-zinc-400 text-sm font-bold mb-3 uppercase tracking-wider">Per-Round Points Override</label>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                 {(() => {
                   const size = formData.isQualifier ? (formData.totalPlayers || 32) : (formData.bracketSize || 32);
                   const rounds = [];
                   if (size >= 512) rounds.push('R512');
                   if (size >= 256) rounds.push('R256');
                   if (size >= 128) rounds.push('R128');
                   if (size >= 64) rounds.push('R64');
                   if (size >= 32) rounds.push('R32');
                   if (size >= 16) rounds.push('R16');
                   if (size >= 8) rounds.push('QF');
                   if (size >= 4) rounds.push('SF');
                   if (size >= 2) rounds.push('Final');
                   
                   return rounds.map(r => (
                     <div key={r}>
                       <label className="block text-xs text-zinc-500 mb-1">{r}</label>
                       <input 
                         type="number" 
                         min="1" 
                         placeholder={String(formData.defaultRaceTo || 9)} 
                         value={formData.roundRaceTo?.[r] || ''} 
                         onChange={e => {
                             const val = e.target.value;
                             const newOverride = { ...(formData.roundRaceTo || {}) };
                             if (val) newOverride[r] = parseInt(val);
                             else delete newOverride[r];
                             setFormData({ ...formData, roundRaceTo: newOverride });
                         }} 
                         className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white" 
                       />
                     </div>
                   ));
                 })()}
               </div>
               <p className="text-xs text-zinc-500 mt-3">Leave empty for a round to inherit the default {formData.defaultScoringSystem === 'sets' ? 'sets' : 'race to'}. (Applied on auto-generation)</p>
             </div>
             <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUpload
                  label="Logo"
                  aspect={1}
                  currentImage={formData.logoUrl}
                  onImageCropped={(b64) => setFormData({ ...formData, logoUrl: b64 })}
                  onRemove={() => setFormData({ ...formData, logoUrl: '' })}
                />
                <ImageUpload
                  label="Banner"
                  aspect={16 / 9}
                  currentImage={formData.bannerUrl}
                  onImageCropped={(b64) => setFormData({ ...formData, bannerUrl: b64 })}
                  onRemove={() => setFormData({ ...formData, bannerUrl: '' })}
                />
             </div>
           </div>
           <div className="flex justify-end gap-2 mt-4">
             <button onClick={() => setIsEditMode(false)} className="bg-zinc-800 text-white px-4 py-2 rounded-2xl text-sm font-bold hover:bg-zinc-700">Cancel</button>
             <button onClick={handleSave} className="bg-emerald-500 flex items-center gap-2 text-black px-4 py-2 rounded-2xl text-sm font-bold hover:bg-emerald-400"><Save className="w-4 h-4"/> Save Event</button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="grid grid-cols-2 gap-4 h-fit">
            <div className="col-span-2 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Venue</h3>
              <p className="text-xl text-white font-medium">{event.venue}</p>
            </div>
            <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 overflow-hidden">
              <h3 className="text-xs font-bold text-emerald-600/80 uppercase tracking-widest mb-1.5 flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 flex-shrink-0" /> Prize Pool</h3>
              <p className="text-2xl lg:text-3xl text-emerald-400 font-black truncate" title={typeof event.prizepool === 'number' ? formatCurrency(event.prizepool, event.currency || 'USD') : String(event.prizepool)}>{typeof event.prizepool === 'number' ? formatCurrency(event.prizepool, event.currency || 'USD') : event.prizepool}</p>
            </div>
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Dates</h3>
              <p className="text-white text-md lg:text-lg font-medium">{new Date(event.startDate).toLocaleDateString()} <span className="text-zinc-600 block sm:inline sm:mx-1">→</span> {new Date(event.endDate).toLocaleDateString()}</p>
            </div>
            <div className="col-span-2 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Trophy className="w-3.5 h-3.5" /> Format</h3>
              <p className="text-white text-lg capitalize font-medium">
                {event.format || 'Hybrid'} {!event.isQualifier && event.bracketSize ? `(Bracket of ${event.bracketSize})` : ''}
              </p>
              {event.isQualifier && (
                <div className="mt-3 bg-zinc-900 border border-zinc-700/50 rounded-xl p-3">
                  <p className="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-1">
                    Qualifier Event {event.eliminationType ? `• ${event.eliminationType} Elimination` : ''}
                  </p>
                  <p className="text-zinc-400 text-sm">
                    {event.qualifierSpots} spots for {event.totalPlayers} players
                  </p>
                </div>
              )}
            </div>
            {event.rules && (
              <div className="col-span-2 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><LayoutList className="w-3.5 h-3.5" /> Rules</h3>
                <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {event.rules}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
             <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 flex flex-col max-h-[500px]">
               <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</h3>
               <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 pr-2">
                 {event.description ? (
                   <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">{event.description}</p>
                 ) : (
                   <div className="text-zinc-500 italic text-sm py-4">No description provided for this event.</div>
                 )}
               </div>
             </div>

             {event.prizepoolDetails && event.prizepoolDetails.length > 0 && (
               <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                 <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Prize Pool Details</h3>
                 <div className="space-y-3">
                   {event.prizepoolDetails.map((detail, idx) => (
                     <div key={idx} className="flex justify-between items-center border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                        <span className="text-zinc-300 font-medium">{detail.rank}</span>
                       <div className="text-right">
                         <div className="text-emerald-400 font-bold">
                           {formatCurrency(detail.amount, event.currency || 'USD')}
                         </div>
                       </div>
                     </div>
                  ))}
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
