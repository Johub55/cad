import React, { useEffect, useState } from 'react';
import { AlertOctagon, VolumeX, Volume2, ShieldAlert, CheckCircle2, Radio } from 'lucide-react';
import { cadAudio } from '../services/audio';
import { formatTimeAgo } from '../utils/cadLogic';

interface PanicOverlayProps {
  activePanic: boolean;
  panicUnit?: string;
  panicTime?: number;
  onClearPanic: () => Promise<void>;
  isAdmin?: boolean;
}

export const PanicOverlay: React.FC<PanicOverlayProps> = ({
  activePanic,
  panicUnit,
  panicTime,
  onClearPanic,
  isAdmin,
}) => {
  const [isLocallyMuted, setIsLocallyMuted] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (activePanic) {
      if (!isLocallyMuted) {
        cadAudio.startPanicSiren();
      }
    } else {
      cadAudio.stopPanicSiren();
    }

    return () => {
      cadAudio.stopPanicSiren();
    };
  }, [activePanic, isLocallyMuted]);

  const toggleLocalMute = () => {
    if (isLocallyMuted) {
      setIsLocallyMuted(false);
      cadAudio.startPanicSiren();
    } else {
      setIsLocallyMuted(true);
      cadAudio.stopPanicSiren();
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await onClearPanic();
    } finally {
      setClearing(false);
    }
  };

  if (!activePanic) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto flex flex-col items-center justify-center p-4 sm:p-6 bg-red-950/80 backdrop-blur-md animate-pulse">
      
      {/* Flashing screen strobe frame */}
      <div className="absolute inset-0 border-8 border-red-600/80 pointer-events-none animate-ping opacity-30" />
      <div className="absolute inset-0 border-4 border-red-500 pointer-events-none" />

      {/* Main Alert Card */}
      <div className="relative w-full max-w-lg bg-slate-950/95 border-2 border-red-500 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-600/60 text-center flex flex-col items-center">
        
        {/* Pulsing Siren Beacon */}
        <div className="relative mb-4">
          <div className="absolute -inset-2 bg-red-600 rounded-full blur-md opacity-75 animate-ping" />
          <div className="relative w-20 h-20 bg-gradient-to-tr from-red-600 to-rose-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white/40">
            <AlertOctagon className="w-12 h-12 text-white animate-bounce" />
          </div>
        </div>

        <span className="inline-block px-4 py-1 rounded-full bg-red-600/30 border border-red-500/60 text-red-300 font-mono text-xs uppercase tracking-widest font-black mb-2">
          PRIO 1 • NOODOPROEP PORTOFOON
        </span>

        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none uppercase">
          🚨 NOODKNOP ALARM 🚨
        </h2>

        <div className="my-5 p-4 w-full rounded-2xl bg-red-900/30 border border-red-500/40 text-left">
          <div className="flex items-center justify-between text-sm text-red-200">
            <span className="flex items-center gap-1.5 font-bold">
              <Radio className="w-4 h-4 text-red-400" />
              Eenheid in nood:
            </span>
            <span className="font-mono text-lg font-black text-white px-3 py-0.5 rounded-lg bg-red-600/40 border border-red-400">
              {panicUnit || 'SURVEILLANCE EENHEID'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 mt-2.5 pt-2 border-t border-red-500/20 font-mono">
            <span>Tijdstip noodknop:</span>
            <span className="font-semibold text-red-300">
              {panicTime ? formatTimeAgo(panicTime) : 'Zojuist'}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-red-200/90 mb-6 font-medium">
          Alle beschikbare eenheden direct met zwaailamp en sirene (Prio 1) assisteren. Meldkamer en OvD-P nemen de leiding.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          
          <button
            onClick={toggleLocalMute}
            className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer transition"
          >
            {isLocallyMuted ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                Sirene Inschakelen
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-amber-400" />
                Sirene Lokaal Dempen
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            disabled={clearing}
            className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-emerald-700/40 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {clearing ? 'Alarm Opheffen...' : 'Alarm Opheffen / Veilig'}
          </button>

        </div>

      </div>
    </div>
  );
};
