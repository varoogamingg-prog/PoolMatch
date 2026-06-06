import { ConfirmModal } from '../components/ConfirmModal';
import { formatCurrency } from '../utils/currency';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Calendar, MapPin, Trophy, Plus, ArrowRight, Image as ImageIcon, Trash2 } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import React, { useState, useEffect } from 'react';
import { ImageUpload } from '../components/ImageUpload';

export function EventsList() {
  const { events, isOwner, createEvent, deleteEvent } = useStore();
  const navigate = useNavigate();
  const [confirmAction, setConfirmAction] = useState<{action: () => void, text: string} | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [prizepool, setPrizepool] = useState<number>(0);
  const [currency, setCurrency] = useState('USD');
  const [prizepoolDetails, setPrizepoolDetails] = useState<{ rank: string; amount: number; count?: number }[]>([]);
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [format, setFormat] = useState<'round-robin'|'knockout'|'hybrid'>('hybrid');
  const [isQualifier, setIsQualifier] = useState(false);
  const [eliminationType, setEliminationType] = useState<'single'|'double'>('single');
  const [bracketSize, setBracketSize] = useState<number>(32);
  const [totalPlayers, setTotalPlayers] = useState<number>(32);
  const [qualifierSpots, setQualifierSpots] = useState<number>(8);
  const [qualifierStage2Draw, setQualifierStage2Draw] = useState<'random' | 'manual' | 'seeded'>('seeded');
  const [defaultScoringSystem, setDefaultScoringSystem] = useState<'race'|'sets'>('race');
  const [defaultRaceTo, setDefaultRaceTo] = useState<number>(9);
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  const handleAddPrizepoolDetail = () => {
    setPrizepoolDetails([...prizepoolDetails, { rank: '', amount: 0 }]);
  };

  const handleAutoFillTiers = () => {
    let size = format === 'round-robin' ? totalPlayers : bracketSize;
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
    
    setPrizepoolDetails(tiers);
  };
  
  const updatePrizepoolDetail = (index: number, key: keyof typeof prizepoolDetails[0], value: any) => {
    const fresh = [...prizepoolDetails];
    fresh[index] = { ...fresh[index], [key]: value };
    setPrizepoolDetails(fresh);
  };
  
  const removePrizepoolDetail = (index: number) => {
    setPrizepoolDetails(prizepoolDetails.filter((_, i) => i !== index));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = 'evt-' + Math.random().toString(36).substr(2, 5);
    createEvent({
      id: newId,
      name,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      venue,
      prizepool,
      currency,
      prizepoolDetails,
      description,
      rules,
      format,
      isQualifier,
      eliminationType: format !== 'round-robin' ? eliminationType : undefined,
      bracketSize: isQualifier ? undefined : bracketSize,
      totalPlayers: isQualifier ? totalPlayers : undefined,
      qualifierSpots: isQualifier ? qualifierSpots : undefined,
      qualifierStage2Draw: isQualifier ? qualifierStage2Draw : undefined,
      defaultScoringSystem,
      defaultRaceTo,
      logoUrl,
      bannerUrl,
      adminCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
      status: 'upcoming'
    });
    
    // reset form (optional since we navigate, but good for cleanliness)
    setShowCreate(false);
    setName('');
    
    // Navigate to the newly created event and open players tab
    navigate(`/event/${newId}?tab=players`);
  };

  const createDemoDe64 = () => {
    const demoId = 'demo-' + Math.random().toString(36).substr(2, 5);
    createEvent({
      id: demoId,
      name: 'UK Open (Matchroom) - DE 64 (32 out)',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      venue: 'Telford International Centre',
      prizepool: '$200,000',
      format: 'knockout',
      isQualifier: true,
      eliminationType: 'double',
      bracketSize: 64,
      totalPlayers: 64,
      qualifierSpots: 32,
      qualifierStage2Draw: 'random',
      defaultScoringSystem: 'race',
      defaultRaceTo: 9,
      logoUrl: '',
      bannerUrl: '',
      adminCode: 'DEMO',
      status: 'upcoming'
    });
    navigate(`/event/${demoId}?tab=brackets`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Tournaments</h1>
          <p className="text-zinc-400 mt-1">Live coverage of professional billiard events</p>
        </div>
        <div className="flex gap-2">
          {isOwner() && (
            <button 
              onClick={createDemoDe64}
              className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-2xl font-medium hover:bg-indigo-500/20 transition-colors"
            >
              Demo DE64
            </button>
          )}
          {isOwner() && (
            <button 
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 bg-emerald-500 text-zinc-950 px-4 py-2 rounded-2xl font-medium hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Event
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-8 p-6 bg-zinc-900 border border-emerald-500/30 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Create New Event</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Event Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Venue</label>
              <input required type="text" value={venue} onChange={e => setVenue(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Start Date</label>
              <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
            </div>
             <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">End Date</label>
              <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Description (Optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" placeholder="Add some details about the event..." />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Rules (Optional)</label>
              <textarea value={rules} onChange={e => setRules(e.target.value)} rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" placeholder="Specific rules for the event..." />
            </div>

            <div className="md:col-span-2 border border-zinc-800 rounded-2xl p-4 bg-zinc-950 space-y-4">
               <div className="flex justify-between items-center">
                 <h4 className="text-white font-bold">Prize Pool Settings</h4>
                 <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium text-zinc-400">Currency</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-sm">
                      <option value="USD">USD ($)</option>
                      <option value="IDR">IDR (Rp)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-zinc-400 mb-1">Total Prize Pool</label>
                 <input type="number" required value={prizepool || ''} onChange={e => setPrizepool(parseInt(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white" placeholder="e.g. 50000" />
               </div>
               
               <div className="space-y-2 pt-2">
                 <label className="block text-sm font-medium text-zinc-400 mb-1">Prize Breakdown (Optional)</label>
                 {prizepoolDetails.map((detail, idx) => (
                    <div key={idx} className="flex gap-2">
                       <input type="text" placeholder="Rank (e.g. 1st, 2nd, 33rd-64th)" value={detail.rank} onChange={e => updatePrizepoolDetail(idx, 'rank', e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-white text-sm" />
                       <input type="number" placeholder="Amount (e.g. 10000)" value={detail.amount || ''} onChange={e => updatePrizepoolDetail(idx, 'amount', parseInt(e.target.value) || 0)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-white text-sm" />
                       <button type="button" onClick={() => removePrizepoolDetail(idx)} className="p-1.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 ))}
                 
                 <div className="flex justify-between items-center mt-2">
                   <button type="button" onClick={handleAddPrizepoolDetail} className="text-sm text-emerald-400 hover:text-emerald-300 font-medium">+ Add Custom</button>
                   <button type="button" onClick={handleAutoFillTiers} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1 bg-indigo-500/10 rounded-lg">Auto-fill via Bracket Size</button>
                 </div>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Format System</label>
              <select value={format as any} onChange={e => setFormat(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white">
                <option value="round-robin">Round Robin</option>
                <option value="knockout">Bracket</option>
                <option value="hybrid">Hybrid (Groups to Bracket)</option>
              </select>
            </div>
            {format !== 'round-robin' && (
              <>
                <div className="flex items-center gap-3 bg-zinc-950 p-4 border border-zinc-800 rounded-2xl">
                  <input
                    type="checkbox"
                    id="isQualifier"
                    checked={isQualifier}
                    onChange={(e) => setIsQualifier(e.target.checked)}
                    className="w-5 h-5 bg-zinc-900 border-zinc-700 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-950"
                  />
                  <div className="flex flex-col">
                    <label htmlFor="isQualifier" className="text-sm font-medium text-white cursor-pointer">Is Qualifier?</label>
                    <span className="text-xs text-zinc-500">Enable if this event is a qualifying tournament (like WNT Qualifiers).</span>
                  </div>
                </div>

                {isQualifier && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Elimination Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEliminationType('single')}
                        className={`py-2 px-4 rounded-2xl border text-sm font-bold transition-colors ${
                          eliminationType === 'single'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        Single Elimination
                      </button>
                      <button
                        type="button"
                        onClick={() => setEliminationType('double')}
                        className={`py-2 px-4 rounded-2xl border text-sm font-bold transition-colors ${
                          eliminationType === 'double'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        Double Elimination
                      </button>
                    </div>
                  </div>
                )}

                {isQualifier ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Total Players</label>
                        <input type="number" min="4" max="512" value={totalPlayers} onChange={e => setTotalPlayers(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Qualifier Spots</label>
                        <input type="number" min="1" max="128" value={qualifierSpots} onChange={e => setQualifierSpots(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Stage 2 Draw Generation</label>
                      <select value={qualifierStage2Draw} onChange={e => setQualifierStage2Draw(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white focus:border-emerald-500 outline-none">
                        <option value="seeded">Seeded (1st vs Last, auto-assigned)</option>
                        <option value="random">Randomize</option>
                        <option value="manual">Manual (TBA)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Total Players (Bracket Size)</label>
                    <select value={bracketSize} onChange={e => setBracketSize(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white">
                      <option value={8}>8 Players</option>
                      <option value={16}>16 Players</option>
                      <option value={32}>32 Players</option>
                      <option value={64}>64 Players</option>
                      <option value={128}>128 Players</option>
                    </select>
                  </div>
                )}
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Default Match Rules (Scoring)</label>
              <select value={defaultScoringSystem} onChange={e => setDefaultScoringSystem(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white">
                <option value="race">Race to X</option>
                <option value="sets">Best of Sets</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Default Points To Win</label>
              <input required type="number" min={1} value={defaultRaceTo} onChange={e => setDefaultRaceTo(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUpload
                label="Logo"
                aspect={1}
                currentImage={logoUrl}
                onImageCropped={(b64) => setLogoUrl(b64)}
                onRemove={() => setLogoUrl('')}
              />
              <ImageUpload
                label="Banner"
                aspect={16 / 9}
                currentImage={bannerUrl}
                onImageCropped={(b64) => setBannerUrl(b64)}
                onRemove={() => setBannerUrl('')}
              />
            </div>
          </div>
          <button type="submit" className="bg-emerald-500 text-black px-4 py-2 font-medium rounded hover:bg-emerald-400 mt-4">
            Create Event
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Link to={`/event/${event.id}`} key={event.id} className="block group relative bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 hover:border-emerald-500/50 transition-all overflow-hidden flex flex-col items-center text-center">
            {event.bannerUrl && (
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
                <img src={event.bannerUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent"></div>
              </div>
            )}
            <div className="absolute top-0 right-0 p-4 z-10 pointer-events-none flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                event.status === 'live' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                event.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                'bg-zinc-800 text-zinc-400'
              }`}>
                {event.status}
              </span>
              {event.isQualifier && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-500 text-zinc-950 shadow-sm">
                  QUALIFIER
                </span>
              )}
            </div>
            
            <div className="w-20 h-20 bg-zinc-950 rounded-full border border-zinc-800 flex items-center justify-center mb-6 mt-2 group-hover:scale-105 transition-transform flex-shrink-0 z-10 overflow-hidden relative">
               {event.logoUrl ? <img src={event.logoUrl} className="w-full h-full object-cover" /> : <Trophy className="w-10 h-10 text-emerald-500" />}
            </div>
            
            <h2 className="text-xl font-display font-bold text-white mb-3 line-clamp-2 z-10 relative">{event.name}</h2>
            
            <div className="flex flex-col gap-2 text-sm text-zinc-400 mb-8 z-10 relative">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                {event.startDate ? formatDate(new Date(event.startDate), 'MMM d') : ''} - {event.endDate ? formatDate(new Date(event.endDate), 'MMM d, yyyy') : ''}
              </div>
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />
                {event.venue}
              </div>
            </div>
            
            <div className="mt-auto flex items-center justify-between w-full z-20 relative">
              <span className="flex items-center gap-2 text-emerald-400 text-sm font-semibold hover:text-emerald-300 transition-colors">
                View Event <ArrowRight className="w-4 h-4" />
              </span>
              {isOwner() && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmAction({ text: 'Are you sure you want to delete this event?', action: () => { deleteEvent(event.id); window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Event deleted' })); } });
                  }} 
                  className="text-red-500 hover:text-red-400 text-sm font-medium z-30 relative"
                >
                  Delete
                </button>
              )}
            </div>
          </Link>
        ))}
      </div>
      <ConfirmModal 
        isOpen={!!confirmAction} 
        message={confirmAction?.text || ''} 
        onConfirm={confirmAction?.action || (() => {})} 
        onCancel={() => setConfirmAction(null)} 
      />
    </div>
  );
}