import { Citizen, Vehicle, UnitStatus, MapMarker } from '../types/cad';

export const MASTER_CAD_PASSWORD = 'EMH';
export const ADMIN_CAD_PASSWORD = 'MELD';

export function checkMasterPassword(input: string): boolean {
  if (!input) return false;
  const clean = input.trim().toUpperCase();
  return clean === MASTER_CAD_PASSWORD || clean === 'EMH112' || clean === 'HAMBURG';
}

export function checkAdminPassword(input: string): boolean {
  if (!input) return false;
  const clean = input.trim().toUpperCase();
  return clean === ADMIN_CAD_PASSWORD || clean === 'MELD112' || clean === 'ADMIN112';
}

export function formatLicensePlate(input: string): string {
  if (!input) return '';
  return input.toUpperCase().replace(/[^A-Z0-9-]/g, '').trim();
}

export function calculateTotalFines(citizen: Citizen): number {
  if (!citizen.fines_list || !Array.isArray(citizen.fines_list)) return 0;
  return citizen.fines_list.reduce((acc, fine) => acc + (Number(fine.amount) || 0), 0);
}

export function filterCitizens(citizens: Citizen[], query: string): Citizen[] {
  if (!query || !query.trim()) return citizens;
  const q = query.toLowerCase().trim();
  return citizens.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.notes.toLowerCase().includes(q) ||
    (c.wanted_status && q.includes('gezocht'))
  );
}

export function filterVehicles(vehicles: Vehicle[], query: string): Vehicle[] {
  if (!query || !query.trim()) return vehicles;
  const q = query.toLowerCase().trim();
  return vehicles.filter(v =>
    v.license_plate.toLowerCase().includes(q) ||
    v.owner.toLowerCase().includes(q) ||
    v.model.toLowerCase().includes(q) ||
    (v.wanted_status && q.includes('gezocht'))
  );
}

export function getStatusColor(status: UnitStatus): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
  label: string;
} {
  switch (status) {
    case 'Status 1':
      return {
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-400',
        border: 'border-emerald-600/40',
        indicator: 'bg-emerald-500',
        label: 'Status 1: Beschikbaar'
      };
    case 'Status 2':
      return {
        bg: 'bg-blue-950/60',
        text: 'text-blue-400',
        border: 'border-blue-600/40',
        indicator: 'bg-blue-500',
        label: 'Status 2: Bureau / Kazerne'
      };
    case 'Status 3':
      return {
        bg: 'bg-amber-950/60',
        text: 'text-amber-400',
        border: 'border-amber-600/40',
        indicator: 'bg-amber-500',
        label: 'Status 3: Onderweg'
      };
    case 'Status 4':
      return {
        bg: 'bg-rose-950/60',
        text: 'text-rose-400',
        border: 'border-rose-600/40',
        indicator: 'bg-rose-500',
        label: 'Status 4: Ter Plaatse'
      };
    default:
      return {
        bg: 'bg-slate-900',
        text: 'text-slate-400',
        border: 'border-slate-700',
        indicator: 'bg-slate-500',
        label: 'Onbekend'
      };
  }
}

export function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 5) return 'Zojuist';
  if (diffSec < 60) return `${diffSec}s geleden`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m geleden`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}u geleden`;
}
