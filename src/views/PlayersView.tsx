import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { getFlagUrl } from '../iocToAlpha2';
import { ConfirmModal } from '../components/ConfirmModal';
import { Plus, User, Info, Trophy, Search, Filter, Edit2, Check, Upload, Trash2, Image as ImageIcon, Download, Camera, X } from 'lucide-react';

// ... Imports and Setup
export function PlayersView() {
  const { players, isOwner, addPlayer, updatePlayer, deletePlayer } = useStore();
  const [confirmAction, setConfirmAction] = useState<{action: () => void, text: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editBio, setEditBio] = useState('');
  const [editCue, setEditCue] = useState('');
  const [editBreak, setEditBreak] = useState('');
  const [editJump, setEditJump] = useState('');

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [pictureUrl, setPictureUrl] = useState('');
  const [bio, setBio] = useState('');
  const [points, setPoints] = useState('');
  const [cue, setCue] = useState('');
  const [breakCue, setBreakCue] = useState('');
  const [jumpCue, setJumpCue] = useState('');

  const [editPoints, setEditPoints] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !country) return;

    addPlayer({
      id: 'p-' + Math.random().toString(36).substr(2, 6),
      name,
      country,
      pictureUrl,
      bio,
      points: Number(points) || 0,
      equipment: {
        cue,
        breakCue,
        jumpCue
      }
    });

    setShowAdd(false);
    setName('');
    setCountry('');
    setPictureUrl('');
    setBio('');
    setPoints('');
    setCue('');
    setBreakCue('');
    setJumpCue('');
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.bio?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCountry = filterCountry ? p.country === filterCountry : true;
      return matchSearch && matchCountry;
    });
  }, [players, searchQuery, filterCountry]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePlayerImageUpdate = (e: React.ChangeEvent<HTMLInputElement>, player: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePlayer({ ...player, pictureUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSave = (player: any) => {
    updatePlayer({
      ...player,
      bio: editBio,
      equipment: {
        ...player.equipment,
        cue: editCue,
        breakCue: editBreak,
        jumpCue: editJump
      }
    });
    setEditingId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      let count = 0;
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          addPlayer({
            id: 'p-' + Math.random().toString(36).substr(2, 6),
            name: parts[0].trim(),
            country: parts[1].trim().substring(0, 3).toUpperCase(),
            bio: parts[2]?.trim() || ''
          });
          count++;
        }
      });
      alert(`Imported ${count} players from CSV`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const header = "Name,Country,Bio,Picture URL,Play Cue,Break Cue,Jump Cue\n";
    const rows = players.map(p => {
      // Escape quotes by replacing " with "" and wrap in quotes
      const escape = (str?: string) => str ? `"${str.replace(/"/g, '""')}"` : '""';
      return `${escape(p.name)},${escape(p.country)},${escape(p.bio)},${escape(p.pictureUrl)},${escape(p.equipment?.cue)},${escape(p.equipment?.breakCue)},${escape(p.equipment?.jumpCue)}`;
    }).join('\n');
    const csvContent = header + rows;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "players_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Competitors</h1>
          <p className="text-zinc-400 mt-1">Player database and profiles</p>
        </div>
        {isOwner() && (
          <div className="flex gap-4">
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button 
              onClick={handleExportCSV}
              className="hidden sm:flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-2xl font-medium hover:bg-zinc-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-2xl font-medium hover:bg-zinc-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button 
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 bg-emerald-500 text-zinc-950 px-4 py-2 rounded-2xl font-medium hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Player
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search players..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2 text-white focus:border-emerald-500 outline-none"
          />
        </div>
        <div className="relative w-full md:w-48">
          <Filter className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <select 
            value={filterCountry}
            onChange={e => setFilterCountry(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2 text-white focus:border-emerald-500 outline-none appearance-none"
          >
            <option value="">All Countries</option>
            {Array.from(new Set(players.map(p => p.country))).sort().map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {showAdd && isOwner() && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-zinc-900 border border-emerald-500/30 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Register Player</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Full Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Country (3 letters)</label>
              <input required type="text" maxLength={3} value={country} onChange={e => setCountry(e.target.value.toUpperCase())} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white uppercase font-mono" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Profile Image</label>
              <div className="flex gap-2">
                <label className="cursor-pointer flex items-center justify-center gap-2 bg-zinc-800 rounded-2xl px-4 py-2 text-sm text-white hover:bg-zinc-700">
                   <ImageIcon className="w-4 h-4" /> Upload
                   <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={e => handleImageUpload(e, setPictureUrl)} />
                </label>
                <input type="text" value={pictureUrl} onChange={e => setPictureUrl(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" placeholder="Or paste URL..." />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Bio / Nickname</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
            </div>
             <div>
               <label className="block text-sm font-medium text-zinc-400 mb-1">Playing Cue</label>
               <input type="text" value={cue} onChange={e => setCue(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
            </div>
             <div>
               <label className="block text-sm font-medium text-zinc-400 mb-1">Break Cue</label>
               <input type="text" value={breakCue} onChange={e => setBreakCue(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
            </div>
             <div>
               <label className="block text-sm font-medium text-zinc-400 mb-1">Jump Cue</label>
               <input type="text" value={jumpCue} onChange={e => setJumpCue(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
            </div>
          </div>
          
          <button type="submit" className="bg-emerald-500 text-black px-6 py-2.5 font-bold rounded-2xl hover:bg-emerald-400 mt-4">
            Save Player
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPlayers.map(player => (
          <div key={player.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col group hover:border-zinc-700 transition-colors">
            <div className="h-48 bg-zinc-950 relative border-b border-zinc-800 flex items-center justify-center overflow-hidden">
              {player.pictureUrl ? (
                <img src={player.pictureUrl} alt={player.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : getFlagUrl(player.country) ? (
                <img src={getFlagUrl(player.country)!} alt={player.country} className="w-16 h-auto opacity-50" />
              ) : (
                <User className="w-16 h-16 text-zinc-800" />
              )}
              <div className="absolute top-4 right-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 px-3 py-1 flex items-center gap-2 rounded text-center text-xs font-mono font-bold text-white shadow-xl">
                 {getFlagUrl(player.country) && (
                   <img src={getFlagUrl(player.country)!} alt={player.country} className="w-5 h-auto rounded" />
                 )}
                 <span>{player.country}</span>
              </div>
              {isOwner() && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">
                  <label 
                    className="p-2 cursor-pointer bg-zinc-800 text-zinc-400 hover:text-emerald-400 rounded-2xl shadow-lg flex items-center justify-center"
                    title="Upload Photo"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handlePlayerImageUpdate(e, player)} />
                  </label>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setConfirmAction({ text: 'Are you sure you want to delete this player?', action: () => deletePlayer(player.id) });; }} 
                    className="p-2 bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-2xl shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingId(player.id);
                      setEditBio(player.bio || '');
                      setEditCue(player.equipment?.cue || '');
                      setEditBreak(player.equipment?.breakCue || '');
                      setEditJump(player.equipment?.jumpCue || '');
                    }} 
                    className="p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl shadow-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-display font-bold text-white leading-tight mb-1">{player.name}</h3>
              
              {editingId === player.id ? (
                <div className="mt-4 space-y-3 flex-1">
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Bio/Nickname" className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white" rows={2} />
                  <input type="text" value={editCue} onChange={e => setEditCue(e.target.value)} placeholder="Play Cue" className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white" />
                  <input type="text" value={editBreak} onChange={e => setEditBreak(e.target.value)} placeholder="Break Cue" className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white" />
                  <input type="text" value={editJump} onChange={e => setEditJump(e.target.value)} placeholder="Jump Cue" className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white" />
                  <div className="flex gap-2">
                     <button onClick={() => handleEditSave(player)} className="flex-1 bg-emerald-500 text-black py-1 rounded text-sm font-bold flex items-center justify-center gap-1"><Check className="w-4 h-4"/> Save</button>
                     <button onClick={() => setEditingId(null)} className="flex-1 bg-zinc-800 text-white py-1 rounded text-sm font-bold">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {player.bio && <p className="text-zinc-500 text-sm italic mb-4">"{player.bio}"</p>}
                  
                  {(player.equipment?.cue || player.equipment?.breakCue || player.equipment?.jumpCue) && (
                    <div className="border-t border-zinc-800/50 pt-4 mt-auto">
                       <div className="text-xs uppercase font-bold tracking-widest text-zinc-600 mb-2">Equipment</div>
                       <div className="text-sm text-zinc-400 grid gap-1">
                          {player.equipment.cue && <div><span className="text-zinc-500">Play:</span> {player.equipment.cue}</div>}
                          {player.equipment.breakCue && <div><span className="text-zinc-500">Break:</span> {player.equipment.breakCue}</div>}
                          {player.equipment.jumpCue && <div><span className="text-zinc-500">Jump:</span> {player.equipment.jumpCue}</div>}
                       </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {players.length === 0 && (
          <div className="col-span-full py-20 text-center bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
            <User className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">No players registered yet.</p>
          </div>
        )}
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