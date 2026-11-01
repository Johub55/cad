import React, { useState } from 'react';
import {
  Car,
  Search,
  AlertTriangle,
  CheckCircle,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileText,
  User,
  Edit2
} from 'lucide-react';
import { Vehicle } from '../types/cad';
import { filterVehicles, formatLicensePlate } from '../utils/cadLogic';

interface VehicleLookupProps {
  vehicles: Vehicle[];
  onToggleWanted: (vehicleId: string, currentWanted: boolean) => Promise<void>;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'updated_at' | 'server_id'>) => Promise<void>;
  onUpdateNotes: (vehicleId: string, notes: string) => Promise<void>;
}

export const VehicleLookup: React.FC<VehicleLookupProps> = ({
  vehicles,
  onToggleWanted,
  onAddVehicle,
  onUpdateNotes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editNotesText, setEditNotesText] = useState('');

  // Form State
  const [newPlate, setNewPlate] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newWanted, setNewWanted] = useState(false);
  const [newApk, setNewApk] = useState<'Goedgekeurd' | 'Verlopen' | 'Afgekeurd'>('Goedgekeurd');
  const [newInsurance, setNewInsurance] = useState<'Verzekerd' | 'Onverzekerd'>('Verzekerd');
  const [submitting, setSubmitting] = useState(false);

  const filtered = filterVehicles(vehicles, searchQuery);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim() || !newOwner.trim()) return;

    setSubmitting(true);
    try {
      await onAddVehicle({
        license_plate: formatLicensePlate(newPlate),
        owner: newOwner.trim(),
        model: newModel.trim() || 'Personenauto',
        color: newColor.trim() || 'Zwart',
        notes: newNotes.trim() || 'Geen opmerkingen geregistreerd.',
        wanted_status: newWanted,
        apk_status: newApk,
        insurance_status: newInsurance,
      });
      setIsAddModalOpen(false);
      setNewPlate('');
      setNewOwner('');
      setNewModel('');
      setNewColor('');
      setNewNotes('');
      setNewWanted(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNotes = async (vId: string) => {
    await onUpdateNotes(vId, editNotesText);
    setEditingVehicleId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* Top search & quick register bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
              Voertuig Controleren & Kentekenregister
            </h2>
            <p className="text-xs text-slate-400">
              Controleer kenteken, tenaamstelling, diefstal- en WOK-status
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nieuw Voertuig Registreren
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Zoek op kenteken (bv. HH-BM-904), eigenaar of automerk..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder:text-slate-500 text-sm outline-none transition font-mono"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            Wissen
          </button>
        )}
      </div>

      {/* Results List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-300 text-base">Geen voertuigen gevonden</h3>
            <p className="text-xs text-slate-500 mt-1">
              Geen resultaten voor &quot;{searchQuery}&quot;. Registreer het voertuig direct via de knop rechtsboven.
            </p>
          </div>
        ) : (
          filtered.map((vehicle) => {
            const isWanted = vehicle.wanted_status;
            const isEditing = editingVehicleId === vehicle.id;

            return (
              <div
                key={vehicle.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isWanted
                    ? 'bg-red-950/40 border-red-500/80 shadow-xl shadow-red-900/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header with License Plate Badge and Wanted Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  
                  {/* Realistic Hamburg EU License Plate */}
                  <div className="inline-flex items-center rounded-md bg-white border border-slate-300 shadow-sm text-slate-900 overflow-hidden font-mono font-black text-sm tracking-widest px-2 py-0.5">
                    <span className="bg-blue-700 text-white text-[9px] px-1 py-1 mr-1.5 font-bold flex flex-col items-center leading-none">
                      <span>★</span>
                      <span>D</span>
                    </span>
                    <span>{vehicle.license_plate}</span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-1.5">
                    {isWanted ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase font-mono bg-red-600 text-white flex items-center gap-1 animate-pulse shadow-md shadow-red-600/40">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        GEZOCHT / GESTOLEN
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Geen Signalering
                      </span>
                    )}
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Eigenaar:</span>
                    <strong className="text-white flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-blue-400" />
                      {vehicle.owner}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Merk & Model:</span>
                    <strong className="text-white mt-0.5 block truncate">
                      {vehicle.model} ({vehicle.color})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">APK Keuring:</span>
                    <span
                      className={`font-semibold ${
                        vehicle.apk_status === 'Goedgekeurd'
                          ? 'text-emerald-400'
                          : vehicle.apk_status === 'Verlopen'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {vehicle.apk_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Verzekering:</span>
                    <span
                      className={`font-semibold ${
                        vehicle.insurance_status === 'Verzekerd' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {vehicle.insurance_status}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 mb-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1 font-mono">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Politie Notities:
                    </span>
                    <button
                      onClick={() => {
                        setEditingVehicleId(vehicle.id);
                        setEditNotesText(vehicle.notes);
                      }}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Bewerken
                    </button>
                  </div>
                  {isEditing ? (
                    <div className="mt-1 space-y-2">
                      <textarea
                        value={editNotesText}
                        onChange={(e) => setEditNotesText(e.target.value)}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-blue-500"
                        rows={2}
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingVehicleId(null)}
                          className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-[11px]"
                        >
                          Annuleren
                        </button>
                        <button
                          onClick={() => handleSaveNotes(vehicle.id)}
                          className="px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-bold"
                        >
                          Opslaan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{vehicle.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500">
                    Bijgewerkt: {vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleDateString('nl-NL') : 'Recent'}
                  </span>

                  <button
                    onClick={() => onToggleWanted(vehicle.id, isWanted)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
                      isWanted
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {isWanted ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Signalering Opheffen
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        Markeer als Gezocht
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
            <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-400" />
              Nieuw Voertuig Registreren in Hamburg CAD
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kenteken</label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  placeholder="bv. HH-PD-112 of HH-XY-404"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Eigenaar (Tenaamstelling)</label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="bv. Lars Schmidt of Onbekend"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Merk & Model</label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="bv. BMW M5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kleur</label>
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="bv. Zwart"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">APK Status</label>
                  <select
                    value={newApk}
                    onChange={(e) => setNewApk(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none cursor-pointer"
                  >
                    <option value="Goedgekeurd">Goedgekeurd</option>
                    <option value="Verlopen">Verlopen</option>
                    <option value="Afgekeurd">Afgekeurd</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Verzekering</label>
                  <select
                    value={newInsurance}
                    onChange={(e) => setNewInsurance(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none cursor-pointer"
                  >
                    <option value="Verzekerd">Verzekerd</option>
                    <option value="Onverzekerd">Onverzekerd</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notities / Bijzonderheden</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Voer uiterlijke kenmerken, modificaties of eerdere waarnemingen in..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wantedCheck"
                  checked={newWanted}
                  onChange={(e) => setNewWanted(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="wantedCheck" className="text-xs font-bold text-red-400 cursor-pointer">
                  Direct signaleren als GEZOCHT / GESTOLEN
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? 'Opslaan...' : 'Voertuig Registreren'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
