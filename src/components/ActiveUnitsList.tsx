import React from 'react';
import {
  Users,
  Radio,
  AlertTriangle,
  Clock,
  Shield,
  Activity,
  CheckCircle2,
  Navigation,
  Building2,
  MapPin
} from 'lucide-react';
import { ActiveUnit, UnitStatus } from '../types/cad';
import { getStatusColor, formatTimeAgo } from '../utils/cadLogic';

interface ActiveUnitsListProps {
  units: ActiveUnit[];
  currentUserCallsign: string;
  currentStatus: UnitStatus;
  onStatusChange: (status: UnitStatus) => Promise<void>;
  onTriggerPanic: () => Promise<void>;
}

export const ActiveUnitsList: React.FC<ActiveUnitsListProps> = ({
  units,
  currentUserCallsign,
  currentStatus,
  onStatusChange,
  onTriggerPanic,
}) => {
  const statusOptions: { status: UnitStatus; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      status: 'Status 1',
      label: 'Status 1: Beschikbaar',
      desc: 'Vrij voor oproepen / surveillance op straat',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white'
    },
    {
      status: 'Status 2',
      label: 'Status 2: Bureau / Kazerne',
      desc: 'Op het bureau voor aangifte, verhoor of pauze',
      icon: <Building2 className="w-5 h-5 text-blue-400" />,
      color: 'bg-blue-600 hover:bg-blue-500 text-white'
    },
    {
      status: 'Status 3',
      label: 'Status 3: Onderweg',
      desc: 'Onderweg naar incident of melding',
      icon: <Navigation className="w-5 h-5 text-amber-400" />,
      color: 'bg-amber-600 hover:bg-amber-500 text-white'
    },
    {
      status: 'Status 4',
      label: 'Status 4: Ter Plaatse',
      desc: 'Aangekomen op locatie van incident',
      icon: <MapPin className="w-5 h-5 text-rose-400" />,
      color: 'bg-rose-600 hover:bg-rose-500 text-white'
    },
  ];

  const currentUnitRecord = units.find(u => u.unit_name.toUpperCase() === currentUserCallsign.toUpperCase());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      
      {/* Left 2 Cols: Live Portofoon & Eenheden Overzicht */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        
        {/* Header Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                Portofoon Status Overzicht • Live Eenheden ({units.length})
              </h2>
              <p className="text-xs text-slate-400">
                Surveillance eenheden in Hamburg met actuele C2000 status
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-400 uppercase">
              Live Verbinding
            </span>
          </div>
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {units.map((unit) => {
            const isMe = unit.unit_name.toUpperCase() === currentUserCallsign.toUpperCase();
            const meta = getStatusColor(unit.current_status);
            const isPanic = unit.is_panic;

            return (
              <div
                key={unit.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isPanic
                    ? 'bg-red-950/70 border-red-500 shadow-xl shadow-red-600/30 animate-pulse'
                    : isMe
                    ? 'bg-slate-900/90 border-blue-500/60 shadow-lg shadow-blue-900/20 ring-1 ring-blue-500/30'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-black text-xs text-slate-200">
                      {unit.unit_name}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">
                          {unit.officer_name}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase font-mono bg-blue-600 text-white">
                            Jij
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {unit.department || 'Politie'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${meta.bg} ${meta.text} ${meta.border}`}>
                    <span className={`w-2 h-2 rounded-full ${meta.indicator} animate-pulse`} />
                    <span>{unit.current_status}</span>
                  </div>
                </div>

                {isPanic ? (
                  <div className="mt-2 py-1.5 px-3 rounded-lg bg-red-600/30 border border-red-500/50 text-red-200 text-xs font-black flex items-center gap-1.5 animate-bounce">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    NOODKNOP ACTIEF OP DEZE EENHEID!
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800/80">
                    <span>C2000 Status: {meta.label}</span>
                    <span>{unit.updated_at ? formatTimeAgo(new Date(unit.updated_at).getTime()) : 'Actief'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Right Col: Current Unit Controller & Large Panic Button (Touch friendly for mobile/tablet) */}
      <div className="flex flex-col gap-4">
        
        {/* Current Unit Control Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="font-black text-sm text-white uppercase tracking-wider font-mono">
                Mijn Eenheid Status
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
              {currentUserCallsign}
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Tik op een statusknop om je positie door te geven. Dit activeert automatisch de portofoon status-gong en werkt de meldkamer live bij.
          </p>

          {/* Large Touch Friendly Status Buttons */}
          <div className="space-y-2.5">
            {statusOptions.map((opt) => {
              const isCurrent = currentStatus === opt.status;
              return (
                <button
                  key={opt.status}
                  onClick={() => onStatusChange(opt.status)}
                  className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      {opt.icon}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white font-mono">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {opt.desc}
                      </div>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-xs font-black font-mono text-blue-400 uppercase tracking-widest shrink-0">
                      ACTIEF
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Big Touch-Friendly Noodknop Card */}
        <div className="bg-gradient-to-b from-red-950/60 to-slate-900 border-2 border-red-600/60 rounded-2xl p-5 shadow-2xl shadow-red-950/40 text-center">
          <div className="flex items-center justify-center gap-2 mb-2 text-red-400 font-mono font-black text-xs uppercase tracking-widest">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            Noodprotocol Artikel 112
          </div>
          <h4 className="text-lg font-black text-white mb-2">
            Levensbedreigende Situatie?
          </h4>
          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Druk op de onderstaande noodknop bij acuut gevaar, vuurwapencontact of zware fysieke dreiging. Dit activeert het realtime alarmsignaal en zwaailichten op elk verbonden toestel.
          </p>

          <button
            onClick={onTriggerPanic}
            className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-base sm:text-lg tracking-wider uppercase font-mono shadow-xl shadow-red-600/50 flex items-center justify-center gap-3 cursor-pointer transition transform active:scale-95 border-2 border-white/30 animate-pulse"
          >
            <AlertTriangle className="w-6 h-6 text-white" />
            NOODKNOP ACTIVEREN
          </button>
        </div>

      </div>

    </div>
  );
};
