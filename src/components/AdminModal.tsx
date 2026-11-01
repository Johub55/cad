import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Lock,
  Plus,
  Shield,
  Layers,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { checkServerAdminPassword, DEFAULT_DEPARTMENTS } from '../utils/cadLogic';
import { CadServer, ServerDepartment, SystemState, ServerMember } from '../types/cad';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: CadServer | null;
  isOwner: boolean;
  systemState: SystemState;
  onClearMarkers: () => Promise<void>;
  onClearPanic: () => Promise<void>;
  onClearUnits: () => Promise<void>;
  onUpdateSystemState: (update: Partial<SystemState>) => Promise<void>;
  onUpdateServerSettings: (update: Partial<CadServer>) => Promise<void>;
  onReseedData: () => Promise<void>;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  server,
  isOwner,
  systemState,
  onClearMarkers,
  onClearPanic,
  onClearUnits,
  onUpdateSystemState,
  onUpdateServerSettings,
  onReseedData,
}) => {
  const [adminTab, setAdminTab] = useState<'meldkamer' | 'server_config' | 'members'>('meldkamer');
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(isOwner);
  const [authError, setAuthError] = useState('');

  // Meldkamer State
  const [broadcastText, setBroadcastText] = useState(systemState.broadcast_message || '');
  const [selectedAlertLevel, setSelectedAlertLevel] = useState(systemState.alert_level || 'Normaal');

  // Server Settings State (Owner/Admin)
  const [editServerName, setEditServerName] = useState(server?.name || '');
  const [editDescription, setEditDescription] = useState(server?.description || '');
  const [editJoinPassword, setEditJoinPassword] = useState(server?.join_password || '');
  const [editAdminPassword, setEditAdminPassword] = useState(server?.admin_password || '');
  const [departments, setDepartments] = useState<ServerDepartment[]>(server?.departments || DEFAULT_DEPARTMENTS);
  const [newCustomDept, setNewCustomDept] = useState('');
  const [newCustomBadge, setNewCustomBadge] = useState('');

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (isOwner) {
      setIsAuthenticated(true);
    }
  }, [isOwner]);

  useEffect(() => {
    if (server) {
      setEditServerName(server.name || '');
      setEditDescription(server.description || '');
      setEditJoinPassword(server.join_password || '');
      setEditAdminPassword(server.admin_password || '');
      if (server.departments && server.departments.length > 0) {
        setDepartments(server.departments);
      }
    }
  }, [server]);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkServerAdminPassword(adminKey, server?.admin_password || '')) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Onjuist beheerderswachtwoord voor deze server.');
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
      setActionSuccess('De eenhedenlijst van deze server is opgeschoond.');
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

  const handleToggleDepartment = (deptId: string) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleAddCustomDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomDept.trim()) return;

    const newDept: ServerDepartment = {
      id: `custom_${Date.now()}`,
      name: newCustomDept.trim(),
      badge: newCustomBadge.trim() || newCustomDept.trim().substring(0, 4).toUpperCase(),
      color: 'bg-indigo-600',
      enabled: true,
    };

    setDepartments((prev) => [...prev, newDept]);
    setNewCustomDept('');
    setNewCustomBadge('');
  };

  const handleSaveServerSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction('server_save');
    try {
      await onUpdateServerSettings({
        name: editServerName.trim(),
        description: editDescription.trim(),
        join_password: editJoinPassword.trim(),
        admin_password: editAdminPassword.trim(),
        departments,
        updated_at: new Date().toISOString(),
      });
      setActionSuccess('Server instellingen, wachtwoorden en diensten succesvol opgeslagen.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReseed = async () => {
    setLoadingAction('reseed');
    try {
      await onReseedData();
      setActionSuccess('Hamburg voorbeeld data (voertuigen & signaleringen) succesvol geladen.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white uppercase tracking-wider font-mono">
                  Meldkamer & Server Beheer
                </h3>
                {server && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    {server.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {server ? server.name : 'Centraal beheer voor Emergency Hamburg'}
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
              <h4 className="font-bold text-white text-sm">Beheerderswachtwoord Vereist</h4>
              <p className="text-xs text-slate-400 mt-1">
                Dit paneel is alleen toegankelijk voor de server maker en centralisten met het admin wachtwoord.
              </p>
            </div>

            {authError && (
              <p className="text-xs text-rose-400 bg-rose-950/50 p-2.5 rounded-lg border border-rose-800">
                {authError}
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Wachtwoord
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Voer het ingestelde beheerderswachtwoord in"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm outline-none focus:border-amber-500"
              />
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
            
            {/* Tabs: Meldkamer Acties VS Server Instellingen VS Leden */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setAdminTab('meldkamer')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  adminTab === 'meldkamer' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Meldkamer</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('server_config')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  adminTab === 'server_config' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Server & Diensten</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminTab('members')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  adminTab === 'members' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Leden ({server?.members?.length || 0})</span>
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-600/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* TAB 1: MELDKAMER ACTIES */}
            {adminTab === 'meldkamer' && (
              <div className="space-y-4">
                {/* Global Broadcast & Alert Level Form */}
                <form onSubmit={handleSaveBroadcast} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
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
                        {loadingAction === 'broadcast' ? 'Uitzenden...' : 'Uitzenden naar Schermen'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* System Action Buttons */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    Systeem Resets & Noodacties
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        <div className="font-bold text-xs text-white">Kaart Markeringen Wissen</div>
                        <div className="text-[10px] text-slate-400">Verwijder incidenten & flitsers</div>
                      </div>
                    </button>

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
                        <div className="text-[10px] text-slate-400">Reset actieve surveillance lijst</div>
                      </div>
                    </button>

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
                        <div className="font-bold text-xs text-white">Importeer Voorbeeld Data</div>
                        <div className="text-[10px] text-slate-400">Hamburg voertuigen & signaleringen</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SERVER & DIENSTEN AANPASSEN */}
            {adminTab === 'server_config' && (
              <form onSubmit={handleSaveServerSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Servernaam</label>
                    <input
                      type="text"
                      value={editServerName}
                      onChange={(e) => setEditServerName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Omschrijving</label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Password modification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-400" />
                      Join Wachtwoord Aanpassen
                    </label>
                    <input
                      type="text"
                      value={editJoinPassword}
                      onChange={(e) => setEditJoinPassword(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      Admin Wachtwoord Aanpassen
                    </label>
                    <input
                      type="text"
                      value={editAdminPassword}
                      onChange={(e) => setEditAdminPassword(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Department Management (Diensten aanpassen) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Diensten & Hulpverleningsafdelingen Configureren
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950/80 rounded-2xl border border-slate-800 scrollbar-thin">
                    {departments.map((dept) => (
                      <label
                        key={dept.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                          dept.enabled
                            ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={dept.enabled}
                            onChange={() => handleToggleDepartment(dept.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700"
                          />
                          <span className="text-xs font-medium truncate">{dept.name}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                          {dept.badge}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Add Custom Department */}
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newCustomDept}
                      onChange={(e) => setNewCustomDept(e.target.value)}
                      placeholder="Extra dienst toevoegen (bv. Spoorwegpolitie)..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={newCustomBadge}
                      onChange={(e) => setNewCustomBadge(e.target.value.toUpperCase())}
                      placeholder="Badge"
                      className="w-20 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono uppercase outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomDepartment}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      + Toevoegen
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingAction === 'server_save'}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase font-mono tracking-wider shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    {loadingAction === 'server_save' ? 'Opslaan...' : 'Server Instellingen Opslaan'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: SERVER LEDEN LIJST */}
            {adminTab === 'members' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Geregistreerde Leden van Deze Server
                  </h4>
                  <span className="text-xs font-mono text-purple-400">
                    {server?.members?.length || 0} leden
                  </span>
                </div>

                {(!server?.members || server.members.length === 0) ? (
                  <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center">
                    <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Er zijn nog geen geregistreerde leden.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                    {server.members.map((member: ServerMember) => (
                      <div
                        key={member.username}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-950/70 text-purple-300 border border-purple-800/60 flex items-center justify-center font-bold text-xs font-mono">
                            {member.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">
                                {member.display_name}
                              </span>
                              <span className="text-xs font-mono text-slate-400">
                                (@{member.username})
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                member.role === 'Eigenaar'
                                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700'
                                  : 'bg-blue-900/40 text-blue-300 border border-blue-800'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Roepnummer: <strong className="text-slate-200">{member.callsign}</strong> • Dienst: {member.department}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            member.is_online
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${member.is_online ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            {member.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
