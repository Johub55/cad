export type UnitStatus = 'Status 1' | 'Status 2' | 'Status 3' | 'Status 4';

export interface ServerDepartment {
  id: string;
  name: string;
  badge: string;
  color: string;
  enabled: boolean;
}

export interface ServerMember {
  username: string;
  display_name: string;
  callsign: string;
  department: string;
  role: 'Eigenaar' | 'Beheerder' | 'Agent';
  joined_at: string;
  last_active?: string;
  is_online?: boolean;
}

export interface CadServer {
  id: string;
  name: string;
  description: string;
  creator_username: string;
  join_password: string;
  admin_password: string;
  departments: ServerDepartment[];
  members: ServerMember[];
  alert_level: 'Normaal' | 'Prio 1 Verhoogd' | 'Code Rood';
  broadcast_message: string;
  active_panic: boolean;
  panic_unit?: string;
  panic_time?: number;
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  username: string;
  email: string; // Geregistreerd e-mailadres
  display_name: string;
  password: string; // Beveiligd wachtwoord
  joined_server_ids: string[];
  created_server_ids: string[];
  created_at: string;
  last_login: string;
}

export interface ActiveUnit {
  id: string;
  server_id: string;
  username: string;
  unit_name: string;
  current_status: UnitStatus;
  department: string;
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
  server_id: string;
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
  server_id: string;
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
  server_id: string;
  type: MarkerType;
  title: string;
  description: string;
  x_pos: number;
  y_pos: number;
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
  username: string;
  displayName: string;
  serverId: string;
  serverName: string;
  callsign: string;
  officerName: string;
  department: string;
  isOwner: boolean;
  isAdmin: boolean;
  isLoggedIn: boolean;
}
