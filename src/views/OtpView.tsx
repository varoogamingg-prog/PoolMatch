import React, { useState } from 'react';
import { useStore } from '../store';
import { X, KeyRound } from 'lucide-react';

export function OtpView() {
  const { setModal, settings } = useStore();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentOtp = settings.otpCode || 'A1B2';
    if (otp.toUpperCase() === currentOtp) {
      setModal('login'); // redirect to staff login
    } else {
      setError(true);
    }
  };

  return (
    <div className="w-full relative p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
      <button onClick={() => setModal(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors bg-zinc-800 p-1.5 rounded-2xl">
        <X className="w-5 h-5" />
      </button>
      <div className="flex justify-center mb-6 mt-4">
        <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700 shadow-inner">
           <KeyRound className="w-10 h-10 text-emerald-400" />
        </div>
      </div>
      <h2 className="text-3xl font-display font-black text-center text-white mb-2">Verification Required</h2>
      <p className="text-zinc-500 text-center text-sm mb-8">Enter the 4-character OTP sent to the authorized email.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-zinc-400 mb-1.5 text-center">4-Digit OTP Code</label>
          <input 
            type="text" 
            maxLength={4}
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.toUpperCase());
              setError(false);
            }}
            className={`w-full bg-zinc-950/50 border ${error ? 'border-red-500' : 'border-zinc-800'} rounded-xl px-4 py-3 font-mono text-white text-2xl tracking-[0.5em] text-center focus:outline-none focus:border-emerald-500 transition-colors`} 
            placeholder="XXXX"
          />
          {error && <p className="text-red-500 text-xs mt-2 text-center">Invalid OTP Code</p>}
        </div>

        <button type="submit" className="w-full bg-emerald-500 text-zinc-950 font-black text-lg py-3 rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
          Verify
        </button>
      </form>
    </div>
  );
}
