import { ConfirmModal } from '../components/ConfirmModal';
import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { FileText, Plus, Maximize, Minimize, X, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';

export function NewsView() {
  const { news, isNewsTeam, addNews, deleteNews, updateNews } = useStore();
  const [confirmAction, setConfirmAction] = useState<{action: () => void, text: string} | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeNewsId, setActiveNewsId] = useState<string|null>(null);
  const [isEditingActive, setIsEditingActive] = useState(false);

  const activeNews = activeNewsId ? news.find(n => n.id === activeNewsId) : null;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState<'update' | 'highlight' | 'schedule'>('update');

  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editType, setEditType] = useState<'update' | 'highlight' | 'schedule'>('update');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    addNews({
      id: 'n-' + Date.now(),
      title,
      content,
      type,
      imageUrl,
      authorName: 'Staff Reporter',
      date: new Date().toISOString()
    });
    setShowForm(false);
    setTitle('');
    setContent('');
    setImageUrl('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {activeNews ? (
        <div className="fixed inset-0 z-50 bg-zinc-950 overflow-y-auto">
          {activeNews.imageUrl && (
            <div className="absolute inset-0 h-[60vh] z-0">
              <img src={activeNews.imageUrl} alt="" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950" />
            </div>
          )}
          <div className="relative z-10 px-4 py-8 md:py-16">
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <button onClick={() => { setActiveNewsId(null); setIsEditingActive(false); }} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" /> Close
                </button>
                {isNewsTeam() && !isEditingActive && (
                  <button onClick={() => {
                    setEditTitle(activeNews.title);
                    setEditContent(activeNews.content);
                    setEditImageUrl(activeNews.imageUrl || '');
                    setEditType(activeNews.type);
                    setIsEditingActive(true);
                  }} className="flex items-center gap-2 bg-zinc-800 text-white px-3 py-1.5 rounded text-sm hover:bg-zinc-700">
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>

              {isEditingActive ? (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Header Image</label>
                    <div className="flex gap-2">
                      <label className="cursor-pointer flex items-center justify-center gap-2 bg-zinc-800 rounded-2xl px-4 py-2 text-sm text-white hover:bg-zinc-700">
                         <ImageIcon className="w-4 h-4" /> Upload
                         <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={e => handleImageUpload(e, setEditImageUrl)} />
                      </label>
                      <input type="text" value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)} placeholder="Or paste URL..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
                    <select value={editType} onChange={e => setEditType(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white">
                      <option value="update">League Update</option>
                      <option value="highlight">Match Highlight</option>
                      <option value="schedule">Schedule Change</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Content</label>
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={6} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setIsEditingActive(false)} className="bg-zinc-800 text-white px-4 py-2 rounded-2xl font-semibold hover:bg-zinc-700">Cancel</button>
                    <button onClick={() => {
                      updateNews({ ...activeNews, title: editTitle, content: editContent, imageUrl: editImageUrl, type: editType });
                      setIsEditingActive(false);
                    }} className="bg-emerald-500 text-black px-6 py-2 rounded-2xl font-semibold hover:bg-emerald-400">Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6 text-sm">
                    <span className={`px-3 py-1.5 rounded-xl uppercase font-bold tracking-wider ${
                      activeNews.type === 'highlight' ? 'bg-purple-500/20 text-purple-400 backdrop-blur-md' :
                      activeNews.type === 'schedule' ? 'bg-blue-500/20 text-blue-400 backdrop-blur-md' :
                      'bg-emerald-500/20 text-emerald-400 backdrop-blur-md'
                    }`}>
                      {activeNews.type}
                    </span>
                    <span className="text-zinc-300 font-medium drop-shadow-xl">{format(new Date(activeNews.date), 'MMMM d, yyyy - h:mm a')}</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 leading-tight tracking-tight drop-shadow-2xl">
                    {activeNews.title}
                  </h1>
                  <div className="flex items-center gap-3 mb-12 border-b border-zinc-800/50 pb-8">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium drop-shadow-lg">{activeNews.authorName}</div>
                      <div className="text-zinc-400 text-sm">Staff Reporter</div>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-lg max-w-none text-zinc-300 leading-relaxed font-serif">
                    {activeNews.content.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-6">{paragraph}</p>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight">League News</h1>
              <p className="text-zinc-400 mt-1">Latest updates and highlights</p>
            </div>
            
            <div className="flex gap-4">
              {isNewsTeam() && (
                <button 
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 bg-emerald-500 text-zinc-950 px-4 py-2 rounded-2xl font-medium hover:bg-emerald-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Post News
                </button>
              )}
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Header Image</label>
                <div className="flex gap-2">
                  <label className="cursor-pointer flex items-center justify-center gap-2 bg-zinc-800 rounded-2xl px-4 py-2 text-sm text-white hover:bg-zinc-700">
                     <ImageIcon className="w-4 h-4" /> Upload
                     <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={e => handleImageUpload(e, setImageUrl)} />
                  </label>
                  <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Or paste URL..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white">
                  <option value="update">League Update</option>
                  <option value="highlight">Match Highlight</option>
                  <option value="schedule">Schedule Change</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Content</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-white" />
              </div>
              <button type="submit" className="bg-emerald-500 text-black px-6 py-2 rounded-2xl font-semibold hover:bg-emerald-400">Publish</button>
            </form>
          )}

          <div className="grid gap-4">
            {news.map(item => (
              <div key={item.id} className="relative group bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => setActiveNewsId(item.id)}>
                {isNewsTeam() && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setConfirmAction({ text: 'Are you sure you want to delete this news article?', action: () => deleteNews(item.id) });; }} 
                    className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 rounded-2xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className={`px-2.5 py-1 rounded-xl text-xs uppercase font-bold tracking-wider ${
                    item.type === 'highlight' ? 'bg-purple-500/20 text-purple-400' :
                    item.type === 'schedule' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-zinc-500 font-medium">{format(new Date(item.date), 'MMM d, h:mm a')}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{item.title}</h3>
                <p className="text-zinc-400 leading-relaxed mb-6 line-clamp-2">{item.content}</p>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <FileText className="w-4 h-4" />
                  Posted by {item.authorName}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <ConfirmModal 
        isOpen={!!confirmAction} 
        message={confirmAction?.text || ''} 
        onConfirm={confirmAction?.action || (() => {})} 
        onCancel={() => setConfirmAction(null)} 
      />
    </div>
  );
}