import React from 'react';
import {
  Shield,
  Radio,
  AlertTriangle,
  Volume2,
  VolumeX,
  Settings,
  MapPin,
  Car,
  UserCheck,
  Users,
  LogOut,
  Server,
  Sparkles
} from 'lucide-react';
import { UserSession, UnitStatus, SystemState } from '../types/cad';
import { getStatusColor } from '../utils/cadLogic';

interface HeaderProps {
  session: UserSession;
  systemState: SystemState;
  currentStatus: UnitStatus;
  activeTab: 'map' | 'units' | 'vehicles' | 'citizens';
  onTabChange: (tab: 'map' | 'units' | 'vehicles' | 'citizens') => void;
  onStatusChange: (status: UnitStatus) => Promise<void>;
  onTriggerPanic: () => Promise<void>;
  onOpenAdmin: () => void;
  onSwitchServer: () => void;
  onLogout: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  systemState,
  currentStatus,
  activeTab,
  onTabChange,
  onStatusChange,
  onTriggerPanic,
  onOpenAdmin,
  onSwitchServer,
  onLogout,
  isMuted,
  onToggleMute,
}) => {
  const statusMeta = getStatusColor(currentStatus);

  const statuses: { code: UnitStatus; num: number; shortLabel: string; bgClass: string }[] = [
    { code: 'Status 1', num: 1, shortLabel: 'S1: Beschikbaar', bgClass: 'hover:bg-emerald-600/30' },
    { code: 'Status 2', num: 2, shortLabel: 'S2: Bureau', bgClass: 'hover:bg-blue-600/30' },
    { code: 'Status 3', num: 3, shortLabel: 'S3: Onderweg', bgClass: 'hover:bg-amber-600/30' },
    { code: 'Status 4', num: 4, shortLabel: 'S4: Ter Plaatse', bgClass: 'hover:bg-rose-600/30' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md">
      {/* Global Broadcast Ticker */}
      {systemState.broadcast_message && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border-b border-blue-500/30 px-3 py-1 text-xs flex items-center justify-between text-blue-200">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="font-bold uppercase tracking-wider text-[11px] text-blue-400 font-mono">
              [MELDKAMER]:
            </span>
            <span className="text-slate-200 truncate">{systemState.broadcast_message}</span>
          </div>
          {systemState.alert_level !== 'Normaal' && (
            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-rose-600/40 text-rose-300 border border-rose-500/50">
              {systemState.alert_level}
            </span>
          )}
        </div>
      )}

      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Branding & Callsign & Server Identifier */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/20 border border-blue-400/30 shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm sm:text-base tracking-tight text-white font-mono">
                {session.serverName || 'EMERGENCY HAMBURG'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-blue-950 text-blue-400 border border-blue-800">
                {session.serverId}
              </span>
              {session.isOwner && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-purple-950 text-purple-300 border border-purple-700 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Maker / Eigenaar
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="font-bold text-slate-200">
                [{session.callsign}] {session.officerName}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-400 truncate max-w-[140px] sm:max-w-none">{session.department}</span>
            </div>
          </div>
        </div>

        {/* Center / Right: Quick Status 1-4 Switcher & Server Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            {statuses.map((s) => {
              const isSelected = currentStatus === s.code;
              return (
                <button
                  key={s.code}
                  onClick={() => onStatusChange(s.code)}
                  title={`Status wijzigen naar ${s.code}`}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : `text-slate-400 hover:text-white ${s.bgClass}`
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-600'}`} />
                  <span className="hidden md:inline">{s.shortLabel}</span>
                  <span className="md:hidden">S{s.num}</span>
                </button>
              );
            })}
          </div>

          {/* NOODKNOP */}
          <button
            onClick={onTriggerPanic}
            title="Activeer Noodknop - zendt direct noodoproep naar alle eenheden op deze server"
            className="py-1.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm font-mono tracking-wider uppercase shadow-lg shadow-red-700/40 flex items-center gap-1.5 cursor-pointer active:scale-95 transition border border-red-400/30 animate-pulse"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span className="hidden xs:inline">NOODKNOP</span>
            <span className="xs:hidden">PANIEK</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Geluid aanzetten' : 'Geluid dempen'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Admin / Server Settings Trigger */}
          <button
            onClick={onOpenAdmin}
            title="Open Meldkamer / Admin & Server Instellingen"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden lg:inline">Beheer</span>
          </button>

          {/* Switch Server */}
          <button
            onClick={onSwitchServer}
            title="Wissel van Server of Maak een Nieuwe Server"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-blue-400 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <Server className="w-4 h-4" />
            <span className="hidden lg:inline">Servers</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Afmelden uit CAD"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/60 border-t border-slate-800/80 px-2 sm:px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          
          <button
            onClick={() => onTabChange('map')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'map'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Incident Kaart & Dispatch
          </button>

          <button
            onClick={() => onTabChange('units')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'units'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Surveillance Eenheden
          </button>

          <button
            onClick={() => onTabChange('vehicles')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Car className="w-4 h-4" />
            Voertuig Controleren
          </button>

          <button
            onClick={() => onTabChange('citizens')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'citizens'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Persoon Controleren & Boetes
          </button>

        </div>
      </div>
    </header>
  );
};
