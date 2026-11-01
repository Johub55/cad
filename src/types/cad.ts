export type UnitStatus = 'Status 1' | 'Status 2' | 'Status 3' | 'Status 4';

export interface ActiveUnit {
  id: string;
  unit_name: string;
  current_status: UnitStatus;
  department: 'Politie' | 'KMar' | 'Handhaving' | 'Meldkamer' | 'Ambulance';
  officer_name: string;
  is_panic?: boolean;
  last_panic_time?: number | null;
  updated_at: string;
}

export interface Fine {
  id: string;
  reason: string;
  amount: number;
  date: string;
  officer: string;
}

export interface Citizen {
  id: string;
  name: string;
  dob: string;
  driver_license_status: 'Geldig' | 'Ingetrokken' | 'Geen' | 'Geschorst';
  fines_list: Fine[];
  wanted_status: boolean;
  notes: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  owner: string;
  model: string;
  color: string;
  notes: string;
  wanted_status: boolean;
  apk_status: 'Goedgekeurd' | 'Verlopen' | 'Afgekeurd';
  insurance_status: 'Verzekerd' | 'Onverzekerd';
  updated_at: string;
}

export type MarkerType = 'incident' | 'speed_camera' | 'checkpoint';

export interface MapMarker {
  id: string;
  type: MarkerType;
  title: string;
  description: string;
  x_pos: number; // percentage 0-100
  y_pos: number; // percentage 0-100
  priority?: 'Prio 1' | 'Prio 2' | 'Prio 3';
  created_by: string;
  timestamp: number;
}

export interface SystemState {
  active_panic: boolean;
  panic_unit?: string;
  panic_time?: number;
  alert_level: 'Normaal' | 'Prio 1 Verhoogd' | 'Code Rood';
  broadcast_message: string;
  updated_at: string;
}

export interface UserSession {
  callsign: string;
  officerName: string;
  department: 'Politie' | 'KMar' | 'Handhaving' | 'Meldkamer' | 'Ambulance';
  isAdmin: boolean;
  isLoggedIn: boolean;
}
