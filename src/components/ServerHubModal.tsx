import React, { useState } from 'react';
import {
  Server,
  Plus,
  Radio,
  Lock,
  KeyRound,
  Shield,
  UserCheck,
  CheckCircle2,
  Users,
  Layers,
  ArrowRight,
  Sparkles,
  AlertCircle,
  LogOut,
  FolderLock
} from 'lucide-react';
import { CadServer, ServerDepartment, UserAccount, UserSession } from '../types/cad';
import { DEFAULT_DEPARTMENTS, generateServerCode, checkServerJoinPassword } from '../utils/cadLogic';

interface ServerHubModalProps {
  currentUser: UserAccount;
  allServers: CadServer[];
  onJoinServer: (server: CadServer, session: UserSession) => Promise<void>;
  onCreateServer: (serverData: Omit<CadServer, 'created_at' | 'updated_at'>, session: UserSession) => Promise<void>;
  onLogoutAccount: () => void;
}

export const ServerHubModal: React.FC<ServerHubModalProps> = ({
  currentUser,
  allServers,
  onJoinServer,
  onCreateServer,
  onLogoutAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'my_servers' | 'join_by_code' | 'create'>('my_servers');

  // Join by Code State
  const [targetServerCode, setTargetServerCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinCallsign, setJoinCallsign] = useState('');
  const [joinDepartment, setJoinDepartment] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Create Server State
  const [newServerName, setNewServerName] = useState('');
  const [newServerCode, setNewServerCode] = useState(() => generateServerCode());
  const [newDescription, setNewDescription] = useState('');
  const [newJoinPassword, setNewJoinPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newCreatorCallsign, setNewCreatorCallsign] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<ServerDepartment[]>(DEFAULT_DEPARTMENTS);
  const [customDeptName, setCustomDeptName] = useState('');
  const [customDeptBadge, setCustomDeptBadge] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Filter servers that this user belongs to
  const myServerIds = new Set([
    ...(currentUser.joined_server_ids || []),
    ...(currentUser.created_server_ids || []),
  ]);

  const myServers = allServers.filter(
    (s) => myServerIds.has(s.id) || s.creator_username === currentUser.username
  );

  const handleToggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleAddCustomDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDeptName.trim()) return;

    const newDept: ServerDepartment = {
      id: `custom_${Date.now()}`,
      name: customDeptName.trim(),
      badge: customDeptBadge.trim() || customDeptName.trim().substring(0, 4).toUpperCase(),
      color: 'bg-indigo-600',
      enabled: true,
    };

    setSelectedDepartments((prev) => [...prev, newDept]);
    setCustomDeptName('');
    setCustomDeptBadge('');
  };

  // Join server with Code + Password
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');

    const cleanCode = targetServerCode.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Voer een geldige servercode in.');
      return;
    }

    const targetServer = allServers.find((s) => s.id.toUpperCase() === cleanCode);
    if (!targetServer) {
      setJoinError(`Geen server gevonden met code "${cleanCode}". Vraag de servercode op bij de beheerder.`);
      return;
    }

    if (!checkServerJoinPassword(joinPassword, targetServer.join_password)) {
      setJoinError('Onjuist server wachtwoord. Toegang geweigerd.');
      return;
    }

    if (!joinCallsign.trim()) {
      setJoinError('Voer een roepnummer in (bv. 10-01).');
      return;
    }

    const isOwner = targetServer.creator_username === currentUser.username;
    const enabledDepts = targetServer.departments?.filter((d) => d.enabled) || [];
    const dept = joinDepartment || enabledDepts[0]?.name || 'Politie Noodhulp';

    setIsJoining(true);
    try {
      await onJoinServer(targetServer, {
        username: currentUser.username,
        displayName: currentUser.display_name,
        serverId: targetServer.id,
        serverName: targetServer.name,
        callsign: joinCallsign.trim().toUpperCase(),
        officerName: currentUser.display_name,
        department: dept,
        isOwner,
        isAdmin: isOwner || dept.toLowerCase().includes('meldkamer'),
        isLoggedIn: true,
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Fast-enter a server that the user is already a member of
  const handleEnterMyServer = async (server: CadServer) => {
    const isOwner = server.creator_username === currentUser.username;
    const enabledDepts = server.departments?.filter((d) => d.enabled) || [];
    const dept = enabledDepts[0]?.name || 'Politie Noodhulp';

    // Find previous callsign if recorded
    const existingMember = server.members?.find((m) => m.username === currentUser.username);
    const callsign = existingMember?.callsign || (isOwner ? 'OvD-P' : '10-01');

    await onJoinServer(server, {
      username: currentUser.username,
      displayName: currentUser.display_name,
      serverId: server.id,
      serverName: server.name,
      callsign,
      officerName: currentUser.display_name,
      department: existingMember?.department || dept,
      isOwner,
      isAdmin: isOwner,
      isLoggedIn: true,
    });
  };

  // Create Server
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!newServerName.trim() || !newJoinPassword.trim() || !newAdminPassword.trim()) {
      setCreateError('Vul alle verplichte velden in (Servernaam, wachtwoorden).');
      return;
    }

    if (!newCreatorCallsign.trim()) {
      setCreateError('Voer jouw gewenste roepnummer in.');
      return;
    }

    const enabledDepts = selectedDepartments.filter((d) => d.enabled);
    if (enabledDepts.length === 0) {
      setCreateError('Selecteer minimaal één beschikbare dienst voor deze server.');
      return;
    }

    const serverCode = (newServerCode.trim() || generateServerCode()).toUpperCase();

    // Check if code exists
    if (allServers.some((s) => s.id === serverCode)) {
      setCreateError('Deze servercode bestaat al. Klik op "Gen" voor een nieuwe code.');
      return;
    }

    setIsCreating(true);
    try {
      const serverPayload: Omit<CadServer, 'created_at' | 'updated_at'> = {
        id: serverCode,
        name: newServerName.trim(),
        description: newDescription.trim() || 'Emergency Hamburg Roleplay Server',
        creator_username: currentUser.username,
        join_password: newJoinPassword.trim(),
        admin_password: newAdminPassword.trim(),
        departments: selectedDepartments,
        members: [
          {
            username: currentUser.username,
            display_name: currentUser.display_name,
            callsign: newCreatorCallsign.trim().toUpperCase(),
            department: enabledDepts[0]?.name || 'Politie Noodhulp',
            role: 'Eigenaar',
            joined_at: new Date().toISOString(),
            is_online: true,
          },
        ],
        alert_level: 'Normaal',
        broadcast_message: `Welkom bij ${newServerName.trim()}. Portofoons en meldkamer online.`,
        active_panic: false,
        panic_unit: '',
        panic_time: 0,
      };

      const userSession: UserSession = {
        username: currentUser.username,
        displayName: currentUser.display_name,
        serverId: serverCode,
        serverName: newServerName.trim(),
        callsign: newCreatorCallsign.trim().toUpperCase(),
        officerName: currentUser.display_name,
        department: enabledDepts[0]?.name || 'Politie Noodhulp',
        isOwner: true,
        isAdmin: true,
        isLoggedIn: true,
      };

      await onCreateServer(serverPayload, userSession);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8">
        
        {/* User Status Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold font-mono text-xs">
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>{currentUser.display_name}</span>
                <span className="text-[11px] font-mono text-slate-400">(@{currentUser.username})</span>
              </div>
              <span className="text-[11px] text-slate-400">Ingelogd op Emergency Hamburg CAD</span>
            </div>
          </div>

          <button
            onClick={onLogoutAccount}
            className="py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Uitloggen
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 mb-6 text-xs sm:text-sm font-bold font-mono">
          <button
            type="button"
            onClick={() => {
              setActiveTab('my_servers');
              setJoinError('');
              setCreateError('');
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'my_servers'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Mijn Servers ({myServers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('join_by_code');
              setJoinError('');
              setCreateError('');
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'join_by_code'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Server Deelnemen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setJoinError('');
              setCreateError('');
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Server Maken</span>
          </button>
        </div>

        {/* TAB 1: MIJN SERVERS */}
        {activeTab === 'my_servers' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono mb-1">
                Jouw Servers
              </h3>
              <p className="text-xs text-slate-400">
                Servers die jij hebt aangemaakt of waar je lid van bent. Klik op een server om direct te openen.
              </p>
            </div>

            {myServers.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center">
                <FolderLock className="w-10 h-10 text-slate-600 mx-auto mb-2.5" />
                <h4 className="font-bold text-slate-300 text-sm">Je zit nog niet in een server</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Maak een eigen server aan via &quot;Server Maken&quot; of vraag een servercode en wachtwoord aan je leidinggevende om deel te nemen.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md"
                  >
                    + Nieuwe Server Maken
                  </button>
                  <button
                    onClick={() => setActiveTab('join_by_code')}
                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Code Invoeren
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {myServers.map((srv) => {
                  const isOwner = srv.creator_username === currentUser.username;
                  const memberCount = srv.members?.length || 1;

                  return (
                    <div
                      key={srv.id}
                      onClick={() => handleEnterMyServer(srv)}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500 transition cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-black text-xs text-blue-400 group-hover:scale-105 transition">
                          {srv.id}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-white group-hover:text-blue-400 transition">
                              {srv.name}
                            </span>
                            {isOwner && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase font-mono bg-purple-950 text-purple-300 border border-purple-800">
                                Eigenaar / Admin
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            Maker: {srv.creator_username} • {memberCount} {memberCount === 1 ? 'lid' : 'leden'} • {srv.departments?.filter((d) => d.enabled).length || 0} diensten
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                          {srv.alert_level || 'Normaal'}
                        </span>
                        <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SERVER DEELNEMEN (CODE + WACHTWOORD) */}
        {activeTab === 'join_by_code' && (
          <form onSubmit={handleJoinByCode} className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono mb-1">
                Deelnemen aan een Server
              </h3>
              <p className="text-xs text-slate-400">
                Voer de unieke servercode en het join-wachtwoord in die je van de server maker hebt ontvangen.
              </p>
            </div>

            {joinError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Servercode
              </label>
              <input
                type="text"
                value={targetServerCode}
                onChange={(e) => setTargetServerCode(e.target.value.toUpperCase())}
                placeholder="bv. EMH-4821"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-500 text-white font-mono uppercase text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                Server Wachtwoord
              </label>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Voer server wachtwoord in"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-500 text-white font-mono text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Jouw Roepnummer
                </label>
                <input
                  type="text"
                  value={joinCallsign}
                  onChange={(e) => setJoinCallsign(e.target.value)}
                  placeholder="bv. 10-01 of Motor-01"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Agent Naam
                </label>
                <input
                  type="text"
                  value={currentUser.display_name}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-sm outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Radio className="w-4 h-4" />
              {isJoining ? 'Verifiëren en Verbinden...' : 'Deelnemen aan Server'}
            </button>
          </form>
        )}

        {/* TAB 3: SERVER MAKEN */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono mb-1">
                Nieuwe Rolplay Server Maken
              </h3>
              <p className="text-xs text-slate-400">
                Jij wordt de beheerder/eigenaar van deze server en bepaalt wie kan joinen en welke diensten actief zijn.
              </p>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Servernaam</label>
                <input
                  type="text"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="Kies een herkenbare servernaam"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Servercode</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newServerCode}
                    onChange={(e) => setNewServerCode(e.target.value.toUpperCase())}
                    placeholder="EMH-XXXX"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm uppercase outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewServerCode(generateServerCode())}
                    className="px-2.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono hover:text-white cursor-pointer"
                  >
                    Gen
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Omschrijving</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Korte omschrijving voor de leden..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none"
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  Join Wachtwoord (voor agenten)
                </label>
                <input
                  type="password"
                  value={newJoinPassword}
                  onChange={(e) => setNewJoinPassword(e.target.value)}
                  placeholder="Kies een join wachtwoord"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Admin Wachtwoord (voor beheer)
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Kies een beheer wachtwoord"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm outline-none"
                />
              </div>
            </div>

            {/* Department Configuration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Beschikbare Diensten op deze Server
                </label>
                <span className="text-[11px] font-mono text-indigo-400">
                  {selectedDepartments.filter((d) => d.enabled).length} geactiveerd
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950/80 rounded-2xl border border-slate-800 scrollbar-thin">
                {selectedDepartments.map((dept) => (
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
                  value={customDeptName}
                  onChange={(e) => setCustomDeptName(e.target.value)}
                  placeholder="Eigen dienst toevoegen (bv. Waterpolitie)..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={customDeptBadge}
                  onChange={(e) => setCustomDeptBadge(e.target.value.toUpperCase())}
                  placeholder="Badge"
                  className="w-20 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono uppercase outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDepartment}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                >
                  + Dienst
                </button>
              </div>
            </div>

            {/* Creator Roepnummer */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Jouw Roepnummer als Server Maker
              </label>
              <input
                type="text"
                value={newCreatorCallsign}
                onChange={(e) => setNewCreatorCallsign(e.target.value)}
                placeholder="bv. OvD-P of 10-01"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full mt-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCreating ? 'Server aanmaken...' : 'Server Aanmaken & Openen'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
