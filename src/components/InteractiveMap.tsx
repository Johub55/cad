import React, { useState } from 'react';
import {
  MapPin,
  Camera,
  AlertOctagon,
  ShieldAlert,
  Plus,
  Trash2,
  Clock,
  User,
  Navigation,
  Compass,
  Crosshair,
  Layers,
  Info
} from 'lucide-react';
import { MapMarker, MarkerType, UnitStatus } from '../types/cad';
import { formatTimeAgo } from '../utils/cadLogic';

interface InteractiveMapProps {
  markers: MapMarker[];
  onAddMarker: (marker: Omit<MapMarker, 'id' | 'timestamp' | 'server_id'>) => Promise<void>;
  onDeleteMarker: (markerId: string) => Promise<void>;
  onRespondToMarker: (marker: MapMarker) => void;
  currentUserCallsign: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers,
  onAddMarker,
  onDeleteMarker,
  onRespondToMarker,
  currentUserCallsign,
}) => {
  const [filterType, setFilterType] = useState<'all' | MarkerType>('all');
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  
  // Placement Modal State
  const [isPlacingModalOpen, setIsPlacingModalOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MarkerType>('incident');
  const [newPriority, setNewPriority] = useState<'Prio 1' | 'Prio 2' | 'Prio 3'>('Prio 1');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick preset incidents
  const incidentPresets = [
    { title: 'Bankoverval Jungfernstieg', type: 'incident' as MarkerType, priority: 'Prio 1' as const, desc: 'Plofkraak / overval met vuurwapens. Twee verdachten voortvluchtig in zwarte BMW.' },
    { title: 'Ramkraak Juwelier Neuer Wall', type: 'incident' as MarkerType, priority: 'Prio 1' as const, desc: 'Voertuig door winkelpui gereden. Meerdere daders buit aan het inladen.' },
    { title: 'Achtervolging Richting Haven', type: 'incident' as MarkerType, priority: 'Prio 1' as const, desc: 'Voertuig weigert stopteken, rijdt met hoge snelheid richting container haven.' },
    { title: 'Mobiele Flitser 80 km/u', type: 'speed_camera' as MarkerType, priority: 'Prio 3' as const, desc: 'Snelheidscontrole met lasergun opgesteld. Max 80 km/u.' },
    { title: 'Winkeldiefstal Europa Passage', type: 'incident' as MarkerType, priority: 'Prio 2' as const, desc: 'Winkeldief op heterdaad betrapt, rent richting metrostation.' },
    { title: 'Algemene Verkeerscontrole (Fuik)', type: 'checkpoint' as MarkerType, priority: 'Prio 2' as const, desc: 'Alcohol- en papierencontrole opgesteld met verkeerskegels.' },
  ];

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking a marker directly, don't trigger map placement
    if ((e.target as HTMLElement).closest('.marker-node')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setPendingCoords({ x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) });
    setNewTitle('');
    setNewDescription('');
    setNewType('incident');
    setNewPriority('Prio 1');
    setIsPlacingModalOpen(true);
  };

  const handleCreateMarker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCoords || !newTitle.trim() || !newDescription.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddMarker({
        title: newTitle.trim(),
        type: newType,
        priority: newPriority,
        description: newDescription.trim(),
        x_pos: pendingCoords.x,
        y_pos: pendingCoords.y,
        created_by: currentUserCallsign || 'Meldkamer',
      });
      setIsPlacingModalOpen(false);
      setPendingCoords(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPreset = (preset: typeof incidentPresets[0]) => {
    setNewTitle(preset.title);
    setNewType(preset.type);
    setNewPriority(preset.priority);
    setNewDescription(preset.desc);
  };

  const filteredMarkers = markers.filter((m) => {
    if (filterType === 'all') return true;
    return m.type === filterType;
  });

  return (
    <div className="flex flex-col gap-4">
      
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
              Emergency Hamburg • Tactische Kaart
            </h2>
            <p className="text-xs text-slate-400">
              Klik op de kaart om een live melding of flitser te plaatsen • Live gesynchroniseerd
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Alle ({markers.length})
          </button>
          <button
            onClick={() => setFilterType('incident')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              filterType === 'incident' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Meldingen
          </button>
          <button
            onClick={() => setFilterType('speed_camera')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              filterType === 'speed_camera' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Flitsers
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[420px] max-h-[720px] bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-2xl overflow-hidden select-none cursor-crosshair group">
        
        {/* Tactical Map Canvas Vector Representation */}
        <div
          onClick={handleMapClick}
          className="absolute inset-0 bg-[#080d1a] overflow-hidden"
          style={{
            backgroundImage: `
              radial-gradient(#1e293b 1px, transparent 1px),
              linear-gradient(to right, rgba(30, 41, 59, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(30, 41, 59, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px, 48px 48px, 48px 48px',
          }}
        >
          {/* SVG Map Geography of Emergency Hamburg */}
          <svg className="w-full h-full pointer-events-none opacity-80" viewBox="0 0 1000 625" preserveAspectRatio="none">
            <defs>
              <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0c2540" />
                <stop offset="100%" stopColor="#071b30" />
              </linearGradient>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
              </pattern>
            </defs>

            <rect width="1000" height="625" fill="url(#grid)" />

            {/* River Elbe & Harbor Basins */}
            <path
              d="M 0,380 C 200,420 380,340 550,440 C 700,520 850,490 1000,530 L 1000,625 L 0,625 Z"
              fill="url(#riverGrad)"
              stroke="#1e3a8a"
              strokeWidth="3"
            />
            {/* Harbor dock basins */}
            <rect x="680" y="470" width="80" height="120" fill="#081b2f" stroke="#1e3a8a" strokeWidth="2" rx="4" />
            <rect x="800" y="500" width="90" height="100" fill="#081b2f" stroke="#1e3a8a" strokeWidth="2" rx="4" />
            <rect x="560" y="460" width="70" height="110" fill="#081b2f" stroke="#1e3a8a" strokeWidth="2" rx="4" />

            {/* Binnenalster Lake (Centrum) */}
            <ellipse cx="480" cy="180" rx="90" ry="60" fill="#0a2540" stroke="#1e40af" strokeWidth="2" />
            
            {/* Parks / Greenery */}
            <path d="M 280,120 Q 340,90 380,160 Q 320,200 280,120 Z" fill="#062d1a" stroke="#065f46" strokeWidth="1.5" opacity="0.6" />
            <path d="M 640,110 Q 720,80 750,150 Q 690,190 640,110 Z" fill="#062d1a" stroke="#065f46" strokeWidth="1.5" opacity="0.6" />

            {/* Major Highways & Roads */}
            {/* A7 Highway Corridor (North to South through Elbtunnel) */}
            <path d="M 200,0 L 240,360 L 260,625" stroke="#475569" strokeWidth="12" fill="none" />
            <path d="M 200,0 L 240,360 L 260,625" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8 8" fill="none" />

            {/* Ring Road 1 (Willy-Brandt-Straße / Ludwig-Erhard-Str) */}
            <path d="M 0,280 Q 500,290 1000,260" stroke="#334155" strokeWidth="9" fill="none" />
            <path d="M 0,280 Q 500,290 1000,260" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 6" fill="none" />

            {/* Bridges across Elbe */}
            <line x1="240" y1="360" x2="255" y2="440" stroke="#64748b" strokeWidth="16" />
            <line x1="240" y1="360" x2="255" y2="440" stroke="#0284c7" strokeWidth="4" />
            <line x1="580" y1="410" x2="590" y2="480" stroke="#64748b" strokeWidth="14" />

            {/* City Blocks / Buildings */}
            {/* Polizeirevier 14 (HQ) */}
            <rect x="420" y="270" width="50" height="35" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" rx="4" />
            {/* Hamburger Sparkasse Bank */}
            <rect x="470" y="235" width="45" height="30" fill="#7f1d1d" stroke="#f87171" strokeWidth="2" rx="4" />
            {/* UKE Ziekenhuis */}
            <rect x="290" y="220" width="55" height="40" fill="#14532d" stroke="#4ade80" strokeWidth="2" rx="4" />
            {/* Juwelier */}
            <rect x="525" y="240" width="35" height="25" fill="#581c87" stroke="#c084fc" strokeWidth="1.5" rx="3" />
            {/* Autodealer & Aral Tankstation */}
            <rect x="150" y="250" width="45" height="35" fill="#854d0e" stroke="#facc15" strokeWidth="1.5" rx="4" />
            {/* Haven Containers Logistics */}
            <rect x="680" y="420" width="90" height="40" fill="#312e81" stroke="#818cf8" strokeWidth="1.5" rx="3" />
            <rect x="790" y="430" width="80" height="45" fill="#312e81" stroke="#818cf8" strokeWidth="1.5" rx="3" />
          </svg>

          {/* Landmarks Dutch/German Text Labels */}
          <div className="absolute top-[37%] left-[18%] text-[10px] sm:text-xs font-mono font-bold text-amber-400/90 pointer-events-none drop-shadow">
            [A7 ELBTUNNEL]
          </div>
          <div className="absolute top-[41%] left-[42%] text-[10px] sm:text-xs font-mono font-black text-blue-300 pointer-events-none drop-shadow flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            POLITIEBUREAU REVIER 14
          </div>
          <div className="absolute top-[36%] left-[48%] text-[9px] sm:text-[11px] font-mono font-bold text-rose-300 pointer-events-none drop-shadow">
            🏦 HAMBURGER SPARKASSE
          </div>
          <div className="absolute top-[33%] left-[29%] text-[9px] sm:text-[11px] font-mono font-bold text-emerald-300 pointer-events-none drop-shadow">
            🏥 ZIEKENHUIS UKE
          </div>
          <div className="absolute top-[25%] left-[46%] text-[10px] sm:text-xs font-mono font-bold text-cyan-300/80 pointer-events-none drop-shadow">
            BINNENALSTER CENTRUM
          </div>
          <div className="absolute top-[75%] left-[68%] text-[10px] sm:text-xs font-mono font-bold text-indigo-300 pointer-events-none drop-shadow">
            🚢 CONTAINER HAVEN ELBE
          </div>
          <div className="absolute top-[40%] left-[13%] text-[9px] sm:text-[11px] font-mono font-bold text-yellow-300 pointer-events-none drop-shadow">
            ⛽ ARAL TANKSTATION
          </div>

          {/* Radar Sweep Effect */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-blue-500/5 to-transparent animate-pulse" />

          {/* Markers Render */}
          {filteredMarkers.map((marker) => {
            const isIncident = marker.type === 'incident';
            const isCamera = marker.type === 'speed_camera';
            const isPrio1 = marker.priority === 'Prio 1';

            return (
              <div
                key={marker.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMarker(marker);
                }}
                style={{ left: `${marker.x_pos}%`, top: `${marker.y_pos}%` }}
                className="marker-node absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/marker"
              >
                {/* Ping animation for Prio 1 */}
                {isPrio1 && (
                  <span className="absolute -inset-2 rounded-full bg-red-600 opacity-75 animate-ping pointer-events-none" />
                )}

                {/* Marker Pin Icon */}
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-xl border-2 transition-transform transform group-hover/marker:scale-125 ${
                    isIncident
                      ? isPrio1
                        ? 'bg-red-600 border-white text-white shadow-red-600/60 animate-bounce'
                        : 'bg-amber-600 border-amber-300 text-white shadow-amber-600/50'
                      : isCamera
                      ? 'bg-cyan-600 border-cyan-300 text-white shadow-cyan-600/50'
                      : 'bg-purple-600 border-purple-300 text-white shadow-purple-600/50'
                  }`}
                >
                  {isIncident ? (
                    <AlertOctagon className="w-5 h-5" />
                  ) : isCamera ? (
                    <Camera className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>

                {/* Marker Tooltip label */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/marker:flex flex-col items-center pointer-events-none z-30">
                  <div className="px-2.5 py-1 rounded-lg bg-slate-950/95 border border-slate-700 text-slate-100 text-[11px] font-bold whitespace-nowrap shadow-xl">
                    <span className={isPrio1 ? 'text-red-400' : 'text-cyan-400'}>
                      [{marker.priority || 'INFO'}]
                    </span>{' '}
                    {marker.title}
                  </div>
                  <div className="w-2 h-2 bg-slate-950 rotate-45 border-r border-b border-slate-700 -mt-1" />
                </div>
              </div>
            );
          })}

          {/* Crosshair indicator guide when hovering over map */}
          <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-400 flex items-center gap-2 pointer-events-none">
            <Crosshair className="w-3.5 h-3.5 text-blue-400" />
            <span>Klik op kaart om nieuwe markering te plaatsen</span>
          </div>

        </div>

      </div>

      {/* Selected Marker Details Drawer / Modal */}
      {selectedMarker && (
        <div className="bg-slate-900 border-2 border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${
                  selectedMarker.type === 'incident' ? 'bg-red-600' : 'bg-cyan-600'
                }`}
              >
                {selectedMarker.type === 'incident' ? <AlertOctagon className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white font-mono">
                    {selectedMarker.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                      selectedMarker.priority === 'Prio 1'
                        ? 'bg-red-600/40 text-red-300 border border-red-500'
                        : 'bg-amber-600/40 text-amber-300 border border-amber-500'
                    }`}
                  >
                    {selectedMarker.priority || 'STANDAARD'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Gemeld door: <strong className="text-slate-200">{selectedMarker.created_by}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatTimeAgo(selectedMarker.timestamp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onRespondToMarker(selectedMarker);
                  setSelectedMarker(null);
                }}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer transition active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                Onderweg Melden (S3)
              </button>

              <button
                onClick={async () => {
                  await onDeleteMarker(selectedMarker.id);
                  setSelectedMarker(null);
                }}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                title="Melding afhandelen en verwijderen van kaart"
              >
                <Trash2 className="w-4 h-4" />
                Verwijderen
              </button>

              <button
                onClick={() => setSelectedMarker(null)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold cursor-pointer"
              >
                Sluiten
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 text-sm text-slate-200 bg-slate-950/60 p-3 rounded-xl">
            <p className="leading-relaxed whitespace-pre-wrap">{selectedMarker.description}</p>
          </div>
        </div>
      )}

      {/* Place Marker Modal */}
      {isPlacingModalOpen && pendingCoords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Nieuwe Kaart Markering Plaatsen</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                GPS: {pendingCoords.x}%, {pendingCoords.y}%
              </span>
            </div>

            {/* Presets */}
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Snelkeuze Sjablonen (Emergency Hamburg)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {incidentPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateMarker} className="space-y-3.5">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Type Markering</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as MarkerType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none cursor-pointer"
                  >
                    <option value="incident">Melding / Incident</option>
                    <option value="speed_camera">Flitspaal / Mobiele Controle</option>
                    <option value="checkpoint">Controlepost / Fuik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prioriteit</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none cursor-pointer"
                  >
                    <option value="Prio 1">Prio 1 (Spoed / Zwaailicht)</option>
                    <option value="Prio 2">Prio 2 (Gepaste Spoed)</option>
                    <option value="Prio 3">Prio 3 (Geen Spoed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Titel / Oproep</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="bv. Bankoverval Jungfernstieg"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Omschrijving / Instructies voor eenheden</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Voer signalement dader, vluchtrichting of instructies in..."
                  rows={3}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPlacingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? 'Bezig met plaatsen...' : 'Markering Uitzenden'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
