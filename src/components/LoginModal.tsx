import React, { useState } from 'react';
import { Shield, KeyRound, Radio, UserCheck, AlertCircle } from 'lucide-react';
import { checkMasterPassword } from '../utils/cadLogic';
import { UserSession } from '../types/cad';

interface LoginModalProps {
  onLogin: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [callsign, setCallsign] = useState('10-01');
  const [officerName, setOfficerName] = useState('Agent');
  const [department, setDepartment] = useState<'Politie' | 'KMar' | 'Handhaving' | 'Meldkamer' | 'Ambulance'>('Politie');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkMasterPassword(password)) {
      setError('Onjuist Hoofdwachtwoord. Toegang geweigerd. Tip: Gebruik EMH of HAMBURG');
      return;
    }

    if (!callsign.trim() || !officerName.trim()) {
      setError('Vul alstublieft een geldig roepnummer en naam in.');
      return;
    }

    onLogin({
      callsign: callsign.trim().toUpperCase(),
      officerName: officerName.trim(),
      department,
      isAdmin: department === 'Meldkamer',
      isLoggedIn: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-blue-950/40 p-6 md:p-8 text-slate-100">
        
        {/* Police Badge Emblem */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-600/30 mb-3 border border-blue-400/30">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-blue-400 font-mono">
            POLITIE HAMBURG • MEHRZWECK CAD
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Meldkamer & MDT Systeem
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Emergency Hamburg Roblox Operationeel Netwerk
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/70 border border-rose-600/40 text-rose-200 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              CAD Hoofdwachtwoord (Master Password)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Voer wachtwoord in (bv. EMH)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white font-mono placeholder:text-slate-500 text-sm outline-none transition"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Standaard groepswachtwoord: <span className="text-blue-400 font-bold">EMH</span> of <span className="text-blue-400 font-bold">HAMBURG</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                Roepnummer
              </label>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                placeholder="bv. 10-01"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-blue-500 text-white font-mono text-sm uppercase outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Naam / Rang
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="bv. Jansen"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-blue-500 text-white text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Dienst / Afdeling
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-blue-500 text-white text-sm outline-none cursor-pointer"
            >
              <option value="Politie">Politie Noodhulp / Surveillance</option>
              <option value="KMar">Koninklijke Marechaussee (KMar)</option>
              <option value="Handhaving">Handhaving / Verkeer</option>
              <option value="Meldkamer">Meldkamer / Centralist (Dispatch)</option>
              <option value="Ambulance">Ambulance / Medische Dienst</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            Inloggen op Portofoon & MDT
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            Geautoriseerd systeem voor Emergency Hamburg hulpdiensten. Alle acties worden realtime gesynchroniseerd.
          </p>
        </div>

      </div>
    </div>
  );
};
