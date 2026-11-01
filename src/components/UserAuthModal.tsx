import React, { useState } from 'react';
import { Shield, KeyRound, User, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { UserAccount } from '../types/cad';
import { cleanUsername } from '../utils/cadLogic';

interface UserAuthModalProps {
  onLoginSuccess: (user: UserAccount) => void;
  onGetUserAccount: (username: string) => Promise<UserAccount | null>;
  onRegisterAccount: (account: UserAccount) => Promise<void>;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  onLoginSuccess,
  onGetUserAccount,
  onRegisterAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const clean = cleanUsername(loginUsername);
    if (!clean || !loginPassword.trim()) {
      setError('Vul alstublieft je gebruikersnaam en wachtwoord in.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await onGetUserAccount(clean);
      if (!user) {
        setError('Geen account gevonden met deze gebruikersnaam. Maak eerst een account aan.');
        return;
      }

      if (user.password !== loginPassword.trim()) {
        setError('Onjuist wachtwoord. Probeer het opnieuw.');
        return;
      }

      onLoginSuccess(user);
    } catch (err) {
      setError('Fout bij het inloggen. Controleer uw verbinding.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const clean = cleanUsername(regUsername);
    if (!clean) {
      setError('Voer een geldige gebruikersnaam in (minimaal 3 letters/cijfers).');
      return;
    }

    if (clean.length < 3) {
      setError('Gebruikersnaam moet minimaal 3 tekens lang zijn.');
      return;
    }

    if (!regPassword.trim() || regPassword.trim().length < 4) {
      setError('Wachtwoord moet minimaal 4 tekens lang zijn.');
      return;
    }

    if (regPassword.trim() !== regConfirmPassword.trim()) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }

    setSubmitting(true);
    try {
      const existing = await onGetUserAccount(clean);
      if (existing) {
        setError('Deze gebruikersnaam is al in gebruik. Kies een andere naam of log in.');
        return;
      }

      const newAccount: UserAccount = {
        username: clean,
        display_name: regDisplayName.trim() || clean,
        password: regPassword.trim(),
        joined_server_ids: [],
        created_server_ids: [],
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      await onRegisterAccount(newAccount);
      onLoginSuccess(newAccount);
    } catch (err) {
      setError('Fout bij het registreren van uw account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8">
        
        {/* Emblem */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-600/30 mb-3 border border-blue-400/30">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-blue-400 font-mono">
            POLITIE HAMBURG • OPERATIONEEL CAD
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Agent Authenticatie
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Meld je aan om je persoonlijke servers en eenheden te beheren
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Inloggen
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Account Maken
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-600/40 text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form: LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Gebruikersnaam
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Voer gebruikersnaam in"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-500 text-white text-sm outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Wachtwoord
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Voer wachtwoord in"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-500 text-white text-sm outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {submitting ? 'Aanmelden...' : 'Aanmelden bij CAD'}
            </button>
          </form>
        )}

        {/* Form: REGISTER */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Kies Gebruikersnaam
              </label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="bv. jansen112 of agent_robin"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white text-sm outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Volledige Naam / Rang
              </label>
              <input
                type="text"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                placeholder="bv. Hoofdagent Jansen"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Kies een Wachtwoord
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Minimaal 4 tekens"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white text-sm outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Bevestig Wachtwoord
              </label>
              <input
                type="password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Herhaal wachtwoord"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white text-sm outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {submitting ? 'Account aanmaken...' : 'Account Registreren'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
