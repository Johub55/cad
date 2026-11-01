import React, { useState } from 'react';
import {
  Settings,
  X,
  KeyRound,
  Trash2,
  AlertTriangle,
  Users,
  Radio,
  RefreshCw,
  Megaphone,
  ShieldAlert,
  CheckCircle2,
  Flame
} from 'lucide-react';
import { checkAdminPassword } from '../utils/cadLogic';
import { SystemState } from '../types/cad';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemState: SystemState;
  onClearMarkers: () => Promise<void>;
  onClearPanic: () => Promise<void>;
  onClearUnits: () => Promise<void>;
  onUpdateSystemState: (update: Partial<SystemState>) => Promise<void>;
  onReseedData: () => Promise<void>;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  systemState,
  onClearMarkers,
  onClearPanic,
  onClearUnits,
  onUpdateSystemState,
  onReseedData,
}) => {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [broadcastText, setBroadcastText] = useState(systemState.broadcast_message || '');
  const [selectedAlertLevel, setSelectedAlertLevel] = useState(systemState.alert_level || 'Normaal');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAdminPassword(adminKey)) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Onjuist beheerderswachtwoord. Tip: Gebruik MELD of MELD112');
    }
  };

  const handleClearMap = async () => {
    setLoadingAction('map');
    try {
      await onClearMarkers();
      setActionSuccess('Alle actieve kaartmarkeringen zijn succesvol gewist.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClearPanic = async () => {
    setLoadingAction('panic');
    try {
      await onClearPanic();
      setActionSuccess('Actief paniekalarm / noodknop is gereset naar veilig.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClearUnits = async () => {
    setLoadingAction('units');
    try {
      await onClearUnits();
      setActionSuccess('De eenhedenlijst is opgeschoond.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction('broadcast');
    try {
      await onUpdateSystemState({
        broadcast_message: broadcastText.trim(),
        alert_level: selectedAlertLevel,
        updated_at: new Date().toISOString(),
      });
      setActionSuccess('Meldkamer broadcast en dreigingsniveau live bijgewerkt.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReseed = async () => {
    if (!window.confirm('Weet je zeker dat je alle data wilt herstellen naar standaard Emergency Hamburg demo records?')) return;
    setLoadingAction('reseed');
    try {
      await onReseedData();
      setActionSuccess('Hamburg standaard database succesvol hersteld.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white uppercase tracking-wider font-mono">
                Admin & Meldkamer Beheerderspaneel
              </h3>
              <p className="text-xs text-slate-400">
                Centraal beheer voor Emergency Hamburg meldkamer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not Authenticated: Secondary Password Screen */}
        {!isAuthenticated ? (
          <form onSubmit={handleUnlock} className="space-y-4 py-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <KeyRound className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h4 className="font-bold text-white text-sm">Secundair Beheerderswachtwoord Vereist</h4>
              <p className="text-xs text-slate-400 mt-1">
                Dit paneel is alleen toegankelijk voor centralisten, meldkamer en admins.
              </p>
            </div>

            {authError && (
              <p className="text-xs text-rose-400 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800">
                {authError}
              </p>
            )}

            <div>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Voer admin wachtwoord in (bv. MELD of MELD112)"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Standaard admin code: <strong className="text-amber-400">MELD</strong>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-amber-600/30 cursor-pointer"
            >
              Paneel Ontgrendelen
            </button>
          </form>
        ) : (
          /* Authenticated Controls */
          <div className="space-y-5">
            
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-600/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Global Broadcast & Alert Level Form */}
            <form onSubmit={handleSaveBroadcast} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
                <Megaphone className="w-4 h-4" />
                Meldkamer Mededeling (Live Ticker)
              </div>

              <div>
                <input
                  type="text"
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="bv. Let op: Bankoverval gaande, alle eenheden Prio 1..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Dreigingsniveau</label>
                  <select
                    value={selectedAlertLevel}
                    onChange={(e) => setSelectedAlertLevel(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs outline-none cursor-pointer"
                  >
                    <option value="Normaal">Normaal (Groen)</option>
                    <option value="Prio 1 Verhoogd">Prio 1 Verhoogd (Oranje)</option>
                    <option value="Code Rood">Code Rood (Rood Alarm)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loadingAction === 'broadcast'}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    {loadingAction === 'broadcast' ? 'Uitzenden...' : 'Uitzenden naar Alle Schermen'}
                  </button>
                </div>
              </div>
            </form>

            {/* Quick System Action Buttons */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                Systeem Resets & Noodacties
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Clear Panic */}
                <button
                  type="button"
                  onClick={handleClearPanic}
                  disabled={loadingAction === 'panic'}
                  className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-red-500/50 text-left transition flex items-center gap-3 cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-red-600/20 text-red-400 group-hover:bg-red-600 group-hover:text-white transition">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Noodknop / Alarm Resetten</div>
                    <div className="text-[10px] text-slate-400">Schakel sirene en overlay direct uit</div>
                  </div>
                </button>

                {/* Clear Markers */}
                <button
                  type="button"
                  onClick={handleClearMap}
                  disabled={loadingAction === 'map'}
                  className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-amber-500/50 text-left transition flex items-center gap-3 cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Alle Kaart Markeringen Wissen</div>
                    <div className="text-[10px] text-slate-400">Verwijder alle incidenten & flitsers</div>
                  </div>
                </button>

                {/* Clear Units */}
                <button
                  type="button"
                  onClick={handleClearUnits}
                  disabled={loadingAction === 'units'}
                  className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-blue-500/50 text-left transition flex items-center gap-3 cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Eenhedenlijst Opschonen</div>
                    <div className="text-[10px] text-slate-400">Reset de lijst van actieve eenheden</div>
                  </div>
                </button>

                {/* Reseed Data */}
                <button
                  type="button"
                  onClick={handleReseed}
                  disabled={loadingAction === 'reseed'}
                  className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/50 text-left transition flex items-center gap-3 cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Herstel Hamburg Demo Data</div>
                    <div className="text-[10px] text-slate-400">Zet originele roleplay records terug</div>
                  </div>
                </button>

              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Sluiten
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
