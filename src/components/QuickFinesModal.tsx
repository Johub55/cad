import React, { useState } from 'react';
import { FileText, Plus, Euro, Shield, X, AlertTriangle } from 'lucide-react';
import { Citizen, Fine } from '../types/cad';

interface QuickFinesModalProps {
  citizen: Citizen;
  officerCallsign: string;
  onClose: () => void;
  onAddFine: (citizenId: string, fine: Omit<Fine, 'id'>) => Promise<void>;
}

export const DUTCH_FINE_CATALOGUE = [
  { reason: 'Snelheidsovertreding 1-10 km/u', amount: 95 },
  { reason: 'Snelheidsovertreding 11-20 km/u', amount: 180 },
  { reason: 'Snelheidsovertreding 21-30 km/u', amount: 295 },
  { reason: 'Snelheidsovertreding >30 km/u (Invordering rijbewijs)', amount: 480 },
  { reason: 'Rijden door rood verkeerslicht', amount: 300 },
  { reason: 'Negeren van een ambtelijk stopteken', amount: 420 },
  { reason: 'Niet-handsfree bellen achter het stuur', amount: 420 },
  { reason: 'Niet dragen van de autogordel', amount: 180 },
  { reason: 'Rijden zonder geldig rijbewijs', amount: 400 },
  { reason: 'Vervallen APK / Technisch mankement', amount: 180 },
  { reason: 'Onverzekerd rijden', amount: 450 },
  { reason: 'Vluchtmisdrijf na verkeersongeval', amount: 750 },
  { reason: 'Illegale straatrace op openbare weg', amount: 850 },
  { reason: 'Wapenbezit / illegaal slag- of steekwapen', amount: 1200 },
  { reason: 'Openbare dronkenschap & overlast', amount: 120 },
  { reason: 'Belediging van een ambtenaar in functie', amount: 320 },
];

export const QuickFinesModal: React.FC<QuickFinesModalProps> = ({
  citizen,
  officerCallsign,
  onClose,
  onAddFine,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [amount, setAmount] = useState<number>(180);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPreset = (preset: { reason: string; amount: number }) => {
    setSelectedReason(preset.reason);
    setCustomReason('');
    setAmount(preset.amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() || selectedReason;
    if (!finalReason) return;

    setIsSubmitting(true);
    try {
      await onAddFine(citizen.id, {
        reason: finalReason,
        amount: Number(amount) || 0,
        date: new Date().toLocaleDateString('nl-NL'),
        officer: officerCallsign || '10-01',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white font-mono">
              Boete Registreren • {citizen.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Catalogus Presets */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Boetecatalogus Hamburg & Politie Reglement
          </label>
          <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
            {DUTCH_FINE_CATALOGUE.map((item, idx) => {
              const isSelected = selectedReason === item.reason;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(item)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate">{item.reason}</span>
                  <span className="font-mono font-bold text-amber-400 shrink-0">
                    € {item.amount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Overtreding / Omschrijving
            </label>
            <input
              type="text"
              value={customReason || selectedReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                setSelectedReason('');
              }}
              placeholder="Selecteer hierboven of typ een eigen omschrijving..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Boetebedrag (€ EUR)
              </label>
              <div className="relative">
                <Euro className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Verbalisant / Roepnummer
              </label>
              <input
                type="text"
                value={officerCallsign}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 font-mono text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/30 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Bezig met registreren...' : 'Boete Toevoegen'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
