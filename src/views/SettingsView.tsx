import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Settings, Bell, Palette, X, Code, Save } from 'lucide-react';
import { GlobalSettings } from '../types';
import { ImageUpload } from '../components/ImageUpload';

export function SettingsView() {
  const { settings: globalSettings, setSettings, setModal, isOwner } = useStore();
  
  // Local state initialized carefully from global
  const [localSettings, setLocalSettings] = useState<GlobalSettings>(globalSettings);

  const handleSaveClick = (e: React.MouseEvent) => {
    setSettings(localSettings);
    setModal(null);
    window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Settings applied successfully' }));
  };

  const handleLogoCropped = (base64Str: string) => {
    setLocalSettings({ ...localSettings, systemLogo: base64Str });
  };

  const generateOTP = () => {
    const newOtp = Math.random().toString(36).substring(2, 6).toUpperCase();
    setLocalSettings({ ...localSettings, otpCode: newOtp, otpTimestamp: Date.now() });
    window.dispatchEvent(new CustomEvent('app-toast', { detail: `Generated and sent new OTP: ${newOtp} to authorized email` }));
  };

  // Only render for owner just in case
  if (!isOwner()) return null;

  return (
    <div className="w-full flex flex-col max-h-[85vh]">
      <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0 sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10 hidden-scrollbar">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-emerald-500" />
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Owner Settings</h1>
        </div>
        <button onClick={() => setModal(null)} className="p-2 text-zinc-500 hover:text-white rounded-2xl hover:bg-zinc-800 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto">
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold text-white">Security & Access</h2>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-white text-lg">Staff Login OTP</div>
                  <div className="text-sm text-zinc-500">OTP required to access the login terminal. Sends to email.</div>
                </div>
                <button onClick={generateOTP} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/30 transition-colors scale-95 md:scale-100">
                  Regenerate OTP
                </button>
              </div>
              <div className="p-4 bg-zinc-900 rounded-lg text-center border border-zinc-800">
                <span className="font-mono text-3xl font-black text-white tracking-[0.4em]">{localSettings.otpCode}</span>
                <p className="text-xs text-zinc-500 mt-2">Last Generated: {new Date(localSettings.otpTimestamp || Date.now()).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-400 mb-1.5">News Reporter Password</label>
              <input 
                type="text" 
                value={localSettings.newsPassword || 'news'} 
                onChange={e => setLocalSettings({...localSettings, newsPassword: e.target.value})} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" 
                placeholder="Password for News team"
              />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold text-white">General Setup</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
              <div>
                <div className="font-bold text-white text-lg">Push Notifications</div>
                <div className="text-sm text-zinc-500">Enable or disable match updates and live alerts</div>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={localSettings.notifications} onChange={e => setLocalSettings({ ...localSettings, notifications: e.target.checked })} />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
              <div>
                <div className="font-bold text-white text-lg">Show Name Abbreviations</div>
                <div className="text-sm text-zinc-500">Use short names on scoreboards when possible</div>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={localSettings.showAbbreviations} onChange={e => setLocalSettings({ ...localSettings, showAbbreviations: e.target.checked })} />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Code className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-blue-400">Developer Options</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={localSettings.devMode || false} onChange={e => setLocalSettings({ ...localSettings, devMode: e.target.checked })} />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          
          <div className={`space-y-4 ${!localSettings.devMode ? 'opacity-50 pointer-events-none' : ''}`}>
             <div>
                <label className="block text-sm font-bold text-zinc-300 mb-1">System Name</label>
                <input type="text" value={localSettings.systemName || 'PRO SCORE'} onChange={e => setLocalSettings({...localSettings, systemName: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-2 text-white focus:border-blue-500 outline-none" />
             </div>
             <div>
                <label className="block text-sm font-bold text-zinc-300 mb-1">System Logo Icon</label>
                <select value={localSettings.systemLogo || 'Trophy'} onChange={e => setLocalSettings({...localSettings, systemLogo: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-2 text-white focus:border-blue-500 outline-none mb-4">
                  <option value="Trophy">Trophy</option>
                  <option value="Shield">Shield</option>
                  <option value="Users">Users</option>
                  <option value="Globe">Globe</option>
                  <option value="PDF">PDF Icon</option>
                </select>
                
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <ImageUpload 
                    label="Upload Custom Logo" 
                    aspect={1} 
                    currentImage={localSettings.systemLogo?.startsWith('data:image') || localSettings.systemLogo?.startsWith('http') ? localSettings.systemLogo : undefined}
                    onImageCropped={handleLogoCropped}
                    onRemove={() => setLocalSettings({...localSettings, systemLogo: 'Trophy'})}
                  />
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-zinc-800 bg-zinc-900/95 sticky bottom-0 shrink-0 flex justify-end gap-3 z-10 backdrop-blur-sm">
        <button onClick={() => setModal(null)} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-colors">
          Cancel
        </button>
        <button onClick={handleSaveClick} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>
    </div>
  );
}
