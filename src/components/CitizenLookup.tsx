import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  AlertTriangle,
  FileText,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Euro,
  User,
  Clock,
  BadgeAlert,
  FileWarning
} from 'lucide-react';
import { Citizen, Fine } from '../types/cad';
import { filterCitizens, calculateTotalFines } from '../utils/cadLogic';
import { QuickFinesModal } from './QuickFinesModal';

interface CitizenLookupProps {
  citizens: Citizen[];
  currentUserCallsign: string;
  onToggleWanted: (citizenId: string, currentWanted: boolean) => Promise<void>;
  onUpdateLicense: (citizenId: string, status: Citizen['driver_license_status']) => Promise<void>;
  onAddFine: (citizenId: string, fine: Omit<Fine, 'id'>) => Promise<void>;
  onAddCitizen: (citizen: Omit<Citizen, 'id' | 'fines_list' | 'updated_at'>) => Promise<void>;
  onUpdateNotes: (citizenId: string, notes: string) => Promise<void>;
}

export const CitizenLookup: React.FC<CitizenLookupProps> = ({
  citizens,
  currentUserCallsign,
  onToggleWanted,
  onUpdateLicense,
  onAddFine,
  onAddCitizen,
  onUpdateNotes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCitizenForFine, setSelectedCitizenForFine] = useState<Citizen | null>(null);
  const [isAddCitizenModalOpen, setIsAddCitizenModalOpen] = useState(false);

  // Add Citizen form state
  const [newName, setNewName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newLicense, setNewLicense] = useState<Citizen['driver_license_status']>('Geldig');
  const [newWanted, setNewWanted] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = filterCitizens(citizens, searchQuery);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    try {
      await onAddCitizen({
        name: newName.trim(),
        dob: newDob.trim() || 'Onbekend',
        driver_license_status: newLicense,
        wanted_status: newWanted,
        notes: newNotes.trim() || 'Schone lei.',
      });
      setIsAddCitizenModalOpen(false);
      setNewName('');
      setNewDob('');
      setNewNotes('');
      setNewWanted(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* Top search & register header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
              Persoon Controleren & Strafblad Register
            </h2>
            <p className="text-xs text-slate-400">
              Controleer antecedenten, openstaande boetes, rijbewijs status en signaleringen
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddCitizenModalOpen(true)}
          className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Burger Registreren
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Zoek burger op voor- of achternaam (bv. Dennis Meyer, Lars Schmidt)..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder:text-slate-500 text-sm outline-none transition"
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

      {/* Citizens Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="lg:col-span-2 p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-300 text-base">Geen burger gevonden</h3>
            <p className="text-xs text-slate-500 mt-1">
              Geen resultaten voor &quot;{searchQuery}&quot;. Registreer deze persoon direct via de knop hierboven.
            </p>
          </div>
        ) : (
          filtered.map((citizen) => {
            const isWanted = citizen.wanted_status;
            const totalFines = calculateTotalFines(citizen);

            return (
              <div
                key={citizen.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isWanted
                    ? 'bg-red-950/40 border-red-500/80 shadow-xl shadow-red-900/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header with Name, DOB, Wanted Badge */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white font-mono flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      {citizen.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Geboren: {citizen.dob || 'Onbekend'}</span>
                    </div>
                  </div>

                  {isWanted ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase font-mono bg-red-600 text-white flex items-center gap-1.5 animate-pulse shadow-md shadow-red-600/40">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      GEZOCHT / SIGNALERING
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Geen Signalering
                    </span>
                  )}
                </div>

                {/* Status Bar: Driver License & Outstanding Fines */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">Rijbewijs Status:</span>
                    <select
                      value={citizen.driver_license_status}
                      onChange={(e) => onUpdateLicense(citizen.id, e.target.value as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono outline-none cursor-pointer border ${
                        citizen.driver_license_status === 'Geldig'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : citizen.driver_license_status === 'Ingetrokken'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : citizen.driver_license_status === 'Geschorst'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <option value="Geldig">Geldig</option>
                      <option value="Ingetrokken">Ingetrokken</option>
                      <option value="Geschorst">Geschorst</option>
                      <option value="Geen">Geen Rijbewijs</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">Openstaand Boetebedrag:</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-sm text-amber-400">
                      <Euro className="w-4 h-4" />
                      <span>{totalFines.toLocaleString('nl-NL')}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({citizen.fines_list?.length || 0} boetes)</span>
                    </div>
                  </div>
                </div>

                {/* Police Record & Notes */}
                <div className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 mb-3">
                  <span className="text-slate-400 text-[11px] block font-mono mb-1">
                    Antecedenten & Politie Notities:
                  </span>
                  <p className="leading-relaxed">{citizen.notes || 'Geen bijzondere antecedenten.'}</p>
                </div>

                {/* Fines List Table */}
                {citizen.fines_list && citizen.fines_list.length > 0 && (
                  <div className="mb-3">
                    <span className="text-slate-400 text-[11px] font-mono block mb-1.5 flex items-center gap-1">
                      <FileWarning className="w-3.5 h-3.5 text-amber-400" />
                      Geregistreerde Overtredingen & Beschikkingen:
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {citizen.fines_list.map((fine) => (
                        <div
                          key={fine.id}
                          className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-semibold text-slate-200 block truncate">{fine.reason}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {fine.date} • Verbalisant: {fine.officer}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-amber-400 shrink-0">
                            € {fine.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Bottom Bar */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedCitizenForFine(citizen)}
                    className="py-1.5 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Boete Registreren
                  </button>

                  <button
                    onClick={() => onToggleWanted(citizen.id, isWanted)}
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
                        Signaleren als Gezocht
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Fine Registration Modal */}
      {selectedCitizenForFine && (
        <QuickFinesModal
          citizen={selectedCitizenForFine}
          officerCallsign={currentUserCallsign}
          onClose={() => setSelectedCitizenForFine(null)}
          onAddFine={onAddFine}
        />
      )}

      {/* Add Citizen Modal */}
      {isAddCitizenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
            <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-400" />
              Nieuwe Burger Invoeren in Hamburg Systeem
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Volledige Naam</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="bv. Tim Schneider"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Geboortedatum</label>
                  <input
                    type="text"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    placeholder="DD-MM-JJJJ"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rijbewijs</label>
                  <select
                    value={newLicense}
                    onChange={(e) => setNewLicense(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none cursor-pointer"
                  >
                    <option value="Geldig">Geldig</option>
                    <option value="Ingetrokken">Ingetrokken</option>
                    <option value="Geschorst">Geschorst</option>
                    <option value="Geen">Geen Rijbewijs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Antecedenten / Notities</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Voer gedragingen, antecedenten of bijzonderheden in..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wantedCitizenCheck"
                  checked={newWanted}
                  onChange={(e) => setNewWanted(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="wantedCitizenCheck" className="text-xs font-bold text-red-400 cursor-pointer">
                  Persoon direct signaleren als GEZOCHT
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCitizenModalOpen(false)}
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
                  {submitting ? 'Opslaan...' : 'Burger Registreren'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
