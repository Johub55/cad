import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import rawFirebaseConfig from '../../firebase-applet-config.json';
import {
  Vehicle,
  Citizen,
  ActiveUnit,
  MapMarker,
  SystemState,
  CadServer,
  UserAccount,
  ServerMember
} from '../types/cad';
import { DEFAULT_DEPARTMENTS } from '../utils/cadLogic';

// Resilient configuration with fallback values for standalone / GitHub Pages hosting
const firebaseConfig = {
  projectId: rawFirebaseConfig?.projectId || "gen-lang-client-0031413083",
  appId: rawFirebaseConfig?.appId || "1:289739546372:web:9bed8253a8d3f22b85ba51",
  apiKey: rawFirebaseConfig?.apiKey || "AIzaSyD9k7jmxRN-Xs2vX598yaUKhUAijPPA9fg",
  authDomain: rawFirebaseConfig?.authDomain || "gen-lang-client-0031413083.firebaseapp.com",
  firestoreDatabaseId: rawFirebaseConfig?.firestoreDatabaseId || "ai-studio-ec70ad7e-4914-4824-bd37-77c785b71731",
  storageBucket: rawFirebaseConfig?.storageBucket || "gen-lang-client-0031413083.firebasestorage.app",
  messagingSenderId: rawFirebaseConfig?.messagingSenderId || "289739546372",
  measurementId: rawFirebaseConfig?.measurementId || "",
  oAuthClientId: rawFirebaseConfig?.oAuthClientId || "289739546372-6l2t1hdpb6pe6lufc1pg3533v37v9lam.apps.googleusercontent.com",
  recaptchaSiteKey: rawFirebaseConfig?.recaptchaSiteKey || "",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Collections references
export const COLLECTIONS = {
  USERS: 'users',
  SERVERS: 'servers',
  VEHICLES: 'vehicles',
  CITIZENS: 'citizens',
  ACTIVE_UNITS: 'active_units',
  MAP_MARKERS: 'map_markers',
  SYSTEM_STATE: 'system_state',
};

// No default public servers or example credentials - all servers are created and owned by users
export const INITIAL_SERVERS: CadServer[] = [];

// User Account Firestore Operations
export async function getUserAccount(username: string): Promise<UserAccount | null> {
  const clean = username.trim().toLowerCase();
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, clean));
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
    return null;
  } catch (err) {
    console.error('Fout bij ophalen gebruikersaccount:', err);
    return null;
  }
}

export async function registerUserAccount(account: UserAccount): Promise<void> {
  const clean = account.username.trim().toLowerCase();
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, clean), {
      ...account,
      username: clean,
    });
  } catch (err) {
    console.error('Fout bij opslaan gebruikersaccount:', err);
    throw err;
  }
}

export async function updateUserJoinedServers(
  username: string,
  serverId: string,
  isCreated: boolean = false
): Promise<void> {
  const clean = username.trim().toLowerCase();
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, clean));
    if (snap.exists()) {
      const data = snap.data() as UserAccount;
      const joinedSet = new Set(data.joined_server_ids || []);
      joinedSet.add(serverId);

      const createdSet = new Set(data.created_server_ids || []);
      if (isCreated) {
        createdSet.add(serverId);
      }

      await updateDoc(doc(db, COLLECTIONS.USERS, clean), {
        joined_server_ids: Array.from(joinedSet),
        created_server_ids: Array.from(createdSet),
        last_login: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Fout bij bijwerken servers van gebruiker:', err);
  }
}

export async function addOrUpdateServerMember(
  serverId: string,
  member: ServerMember
): Promise<void> {
  try {
    const serverRef = doc(db, COLLECTIONS.SERVERS, serverId);
    const snap = await getDoc(serverRef);
    if (!snap.exists()) return;

    const data = snap.data() as CadServer;
    const existingMembers = data.members || [];
    
    // Check if member already exists
    const idx = existingMembers.findIndex(
      (m) => m.username.toLowerCase() === member.username.toLowerCase()
    );

    let updatedMembers: ServerMember[];
    if (idx >= 0) {
      updatedMembers = [...existingMembers];
      updatedMembers[idx] = {
        ...updatedMembers[idx],
        ...member,
        is_online: true,
        last_active: new Date().toISOString(),
      };
    } else {
      updatedMembers = [...existingMembers, member];
    }

    await updateDoc(serverRef, {
      members: updatedMembers,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Fout bij bijwerken van server lid:', err);
  }
}

// Sample roleplay data generators for manual import in Admin Panel if requested
export const SAMPLE_VEHICLES = (serverId: string): Vehicle[] => [
  {
    id: `${serverId}-HH-PD-112`,
    server_id: serverId,
    license_plate: 'HH-PD-112',
    owner: 'Politie Hamburg (Dienstwagen)',
    model: 'Mercedes-Benz E-Klasse Estate Noodhulp',
    color: 'Zilver/Blauw/Fluogeel',
    notes: 'Dienstvoertuig Noodhulp Hamburg. Voorzien van optische- en geluidssignalen.',
    wanted_status: false,
    apk_status: 'Goedgekeurd',
    insurance_status: 'Verzekerd',
    updated_at: new Date().toISOString(),
  },
  {
    id: `${serverId}-HH-BM-904`,
    server_id: serverId,
    license_plate: 'HH-BM-904',
    owner: 'Onbekende Verdachte',
    model: 'BMW M5 Competition F90',
    color: 'Mat Zwart',
    notes: 'GEZOCHT: Vluchtvoertuig gebruikt bij plofkraak Hamburger Sparkasse Jungfernstieg. Schietgevaarlijk!',
    wanted_status: true,
    apk_status: 'Afgekeurd',
    insurance_status: 'Onverzekerd',
    updated_at: new Date().toISOString(),
  },
  {
    id: `${serverId}-HH-VK-802`,
    server_id: serverId,
    license_plate: 'HH-VK-802',
    owner: 'Lars Schmidt',
    model: 'Volkswagen Golf 8 GTI',
    color: 'Tornado Rood',
    notes: 'Regelmatig gezien bij straatraces aan de Elbe haven. APK verlopen.',
    wanted_status: false,
    apk_status: 'Verlopen',
    insurance_status: 'Verzekerd',
    updated_at: new Date().toISOString(),
  },
];

export const SAMPLE_CITIZENS = (serverId: string): Citizen[] => [
  {
    id: `${serverId}-cit-1`,
    server_id: serverId,
    name: 'Dennis Meyer',
    dob: '17-03-1992',
    driver_license_status: 'Ingetrokken',
    wanted_status: true,
    notes: 'SIGNALERING: Gezocht ter aanhouding voor gewapende bankoverval & ramkraak. Niet zelf benaderen, altijd met Prio 1 en twee eenheden!',
    updated_at: new Date().toISOString(),
    fines_list: [
      { id: 'f-101', reason: 'Snelheidsovertreding 45 km/u binnen bebouwde kom', amount: 480, date: '2026-10-12', officer: '10-01' },
      { id: 'f-102', reason: 'Negeren stopteken politie', amount: 550, date: '2026-10-18', officer: 'Motor-01' },
    ]
  },
  {
    id: `${serverId}-cit-2`,
    server_id: serverId,
    name: 'Lars Schmidt',
    dob: '14-04-1996',
    driver_license_status: 'Geldig',
    wanted_status: false,
    notes: 'Bekend bij verkeershandhaving ivm overmatige uitlaatgeluiden en slippen bij havengebied.',
    updated_at: new Date().toISOString(),
    fines_list: [
      { id: 'f-201', reason: 'Veroorzaken geluidshinder met uitlaat', amount: 280, date: '2026-10-04', officer: '10-01' },
    ]
  },
  {
    id: `${serverId}-cit-3`,
    server_id: serverId,
    name: 'Maxim van Dijk',
    dob: '29-11-1988',
    driver_license_status: 'Geldig',
    wanted_status: false,
    notes: 'Schone lei. Eigenaar van transportbedrijf in Hamburg haven.',
    updated_at: new Date().toISOString(),
    fines_list: []
  }
];

export const SAMPLE_MAP_MARKERS = (serverId: string): MapMarker[] => [
  {
    id: `${serverId}-m-1`,
    server_id: serverId,
    type: 'incident',
    title: 'Melding Bankoverval Jungfernstieg',
    description: 'Prio 1: Overvalalarm bij bankfiliaal. Twee verdachten met automatische wapens gesignaleerd.',
    x_pos: 48,
    y_pos: 38,
    priority: 'Prio 1',
    created_by: 'Meldkamer',
    timestamp: Date.now() - 360000,
  },
  {
    id: `${serverId}-m-2`,
    server_id: serverId,
    type: 'speed_camera',
    title: 'Mobiele Flitser A7 Elbtunnel',
    description: 'Snelheidscontrole 80 km/u trajectcontrole richting haven. Laserunit opgesteld.',
    x_pos: 24,
    y_pos: 62,
    priority: 'Prio 3',
    created_by: 'Verkeerspolitie',
    timestamp: Date.now() - 1200000,
  }
];

// Helper to seed sample data into an active server when requested
export async function seedServerDemoData(serverId: string) {
  try {
    for (const v of SAMPLE_VEHICLES(serverId)) {
      await setDoc(doc(db, COLLECTIONS.VEHICLES, v.id), v);
    }
    for (const c of SAMPLE_CITIZENS(serverId)) {
      await setDoc(doc(db, COLLECTIONS.CITIZENS, c.id), c);
    }
    for (const m of SAMPLE_MAP_MARKERS(serverId)) {
      await setDoc(doc(db, COLLECTIONS.MAP_MARKERS, m.id), m);
    }
  } catch (err) {
    console.error('Fout bij toevoegen van voorbeeld data:', err);
  }
}

// Test connection on boot (non-destructive)
export async function testConnection() {
  try {
    await getDocs(collection(db, COLLECTIONS.SERVERS));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
}
