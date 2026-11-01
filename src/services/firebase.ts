import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  DocumentData
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import rawFirebaseConfig from '../../firebase-applet-config.json';
import { Vehicle, Citizen, ActiveUnit, MapMarker, SystemState } from '../types/cad';

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

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system_state', 'global'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
}

// Collections references
export const COLLECTIONS = {
  VEHICLES: 'vehicles',
  CITIZENS: 'citizens',
  ACTIVE_UNITS: 'active_units',
  MAP_MARKERS: 'map_markers',
  SYSTEM_STATE: 'system_state',
};

// Initial Seed Data for Emergency Hamburg (Roblox)
export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'HH-PD-112',
    license_plate: 'HH-PD-112',
    owner: 'Politie Hamburg (Dienstwagen)',
    model: 'Mercedes-Benz E-Klasse Estate Noodhulp',
    color: 'Zilver/Blauw/Fluogeel',
    notes: 'Dienstvoertuig Noodhulp Hamburg Revier 14. Voorzien van zwaailichten en C2000.',
    wanted_status: false,
    apk_status: 'Goedgekeurd',
    insurance_status: 'Verzekerd',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'HH-BM-904',
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
    id: 'HH-VK-802',
    license_plate: 'HH-VK-802',
    owner: 'Lars Schmidt',
    model: 'Volkswagen Golf 8 GTI',
    color: 'Tornado Rood',
    notes: 'Regelmatig gezien bij straatraces aan de Elbe haven. APK is 2 maanden verlopen.',
    wanted_status: false,
    apk_status: 'Verlopen',
    insurance_status: 'Verzekerd',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'HH-AU-451',
    license_plate: 'HH-AU-451',
    owner: 'Maxim van Dijk',
    model: 'Audi RS4 Avant',
    color: 'Nardo Grijs',
    notes: 'Geen signaleringen. Zakelijke leaserijder.',
    wanted_status: false,
    apk_status: 'Goedgekeurd',
    insurance_status: 'Verzekerd',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'HH-TX-101',
    license_plate: 'HH-TX-101',
    owner: 'Ahmet Yilmaz',
    model: 'Mercedes-Benz Vito Tourer',
    color: 'Helder Wit',
    notes: 'Vergunde Hamburg taxibus. Alles in orde.',
    wanted_status: false,
    apk_status: 'Goedgekeurd',
    insurance_status: 'Verzekerd',
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_CITIZENS: Citizen[] = [
  {
    id: 'cit-1',
    name: 'Dennis "De Schim" Meyer',
    dob: '17-03-1992',
    driver_license_status: 'Ingetrokken',
    wanted_status: true,
    notes: 'SIGNALERING: Gezocht ter aanhouding voor gewapende bankoverval & ramkraak. Niet zelf benaderen, altijd met Prio 1 en twee eenheden!',
    updated_at: new Date().toISOString(),
    fines_list: [
      { id: 'f-101', reason: 'Snelheidsovertreding 45 km/u binnen bebouwde kom', amount: 480, date: '2026-10-12', officer: '10-01' },
      { id: 'f-102', reason: 'Negeren stopteken politie', amount: 550, date: '2026-10-18', officer: 'Motor-01' },
      { id: 'f-103', reason: 'Rijden met ingevorderd rijbewijs', amount: 800, date: '2026-10-25', officer: '10-02' }
    ]
  },
  {
    id: 'cit-2',
    name: 'Lars Schmidt',
    dob: '14-04-1996',
    driver_license_status: 'Geldig',
    wanted_status: false,
    notes: 'Bekend bij verkeershandhaving ivm overmatige uitlaatgeluiden en slippen bij havengebied.',
    updated_at: new Date().toISOString(),
    fines_list: [
      { id: 'f-201', reason: 'Veroorzaken geluidshinder met uitlaat', amount: 280, date: '2026-10-04', officer: '10-01' },
      { id: 'f-202', reason: 'Vervallen APK keuring', amount: 180, date: '2026-10-28', officer: '10-03' }
    ]
  },
  {
    id: 'cit-3',
    name: 'Maxim van Dijk',
    dob: '29-11-1988',
    driver_license_status: 'Geldig',
    wanted_status: false,
    notes: 'Schone lei. Eigenaar van logistiek bedrijf in Hamburg haven.',
    updated_at: new Date().toISOString(),
    fines_list: []
  },
  {
    id: 'cit-4',
    name: 'Emma Becker',
    dob: '08-07-2002',
    driver_license_status: 'Geschorst',
    wanted_status: false,
    notes: 'Rijbewijs geschorst na herhaaldelijk gebruik van mobiele telefoon achter het stuur.',
    updated_at: new Date().toISOString(),
    fines_list: [
      { id: 'f-401', reason: 'Vasthouden mobiele telefoon tijdens besturen motorvoertuig', amount: 420, date: '2026-10-19', officer: 'Motor-01' }
    ]
  },
  {
    id: 'cit-5',
    name: 'Robin de Boer',
    dob: '21-02-2004',
    driver_license_status: 'Geen',
    wanted_status: false,
    notes: 'Heeft nog nooit een rijbewijs behaald.',
    updated_at: new Date().toISOString(),
    fines_list: [
      { id: 'f-501', reason: 'Besturen van personenauto zonder rijbewijs', amount: 400, date: '2026-10-22', officer: '10-02' }
    ]
  }
];

export const INITIAL_MAP_MARKERS: MapMarker[] = [
  {
    id: 'm-1',
    type: 'incident',
    title: 'Bankoverval Jungfernstieg',
    description: 'Prio 1: Melding van overvalalarm bij Hamburger Sparkasse. Twee gemaskerde personen met automatische wapens gesignaleerd.',
    x_pos: 48,
    y_pos: 38,
    priority: 'Prio 1',
    created_by: 'Meldkamer 01',
    timestamp: Date.now() - 360000,
  },
  {
    id: 'm-2',
    type: 'speed_camera',
    title: 'Mobiele Flitser A7 Elbtunnel',
    description: 'Snelheidscontrole 80 km/u trajectcontrole richting haven. Laserunit opgesteld.',
    x_pos: 24,
    y_pos: 62,
    priority: 'Prio 3',
    created_by: 'Motor-01',
    timestamp: Date.now() - 1200000,
  },
  {
    id: 'm-3',
    type: 'incident',
    title: 'Aanrijding met letsel Havenkade',
    description: 'Prio 2: Kop-staart botsing tussen vrachtwagen en bestelbus. Verkeersstremming richting terminal.',
    x_pos: 70,
    y_pos: 74,
    priority: 'Prio 2',
    created_by: '10-02',
    timestamp: Date.now() - 900000,
  }
];

export const INITIAL_ACTIVE_UNITS: ActiveUnit[] = [
  {
    id: 'unit-10-01',
    unit_name: '10-01',
    current_status: 'Status 1',
    department: 'Politie',
    officer_name: 'Hoofdagent Jansen',
    is_panic: false,
    last_panic_time: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'unit-10-02',
    unit_name: '10-02',
    current_status: 'Status 3',
    department: 'Politie',
    officer_name: 'Agent De Vries',
    is_panic: false,
    last_panic_time: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'unit-motor-01',
    unit_name: 'Motor-01',
    current_status: 'Status 1',
    department: 'Politie',
    officer_name: 'Brigadier Bakker',
    is_panic: false,
    last_panic_time: null,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'unit-mk-01',
    unit_name: 'Meldkamer 01',
    current_status: 'Status 2',
    department: 'Meldkamer',
    officer_name: 'Centralist Visser',
    is_panic: false,
    last_panic_time: null,
    updated_at: new Date().toISOString(),
  }
];

// Helper to check if collections are empty, and seed if so
export async function seedInitialDataIfNeeded() {
  try {
    const sysDocRef = doc(db, COLLECTIONS.SYSTEM_STATE, 'global');
    const sysSnap = await getDocs(collection(db, COLLECTIONS.SYSTEM_STATE));
    if (sysSnap.empty) {
      await setDoc(sysDocRef, {
        active_panic: false,
        panic_unit: '',
        panic_time: 0,
        alert_level: 'Normaal',
        broadcast_message: 'Meldkamer Hamburg online. Portofoons en GPS gekoppeld.',
        updated_at: new Date().toISOString()
      });
    }

    const vehSnap = await getDocs(collection(db, COLLECTIONS.VEHICLES));
    if (vehSnap.empty) {
      for (const v of INITIAL_VEHICLES) {
        await setDoc(doc(db, COLLECTIONS.VEHICLES, v.id), v);
      }
    }

    const citSnap = await getDocs(collection(db, COLLECTIONS.CITIZENS));
    if (citSnap.empty) {
      for (const c of INITIAL_CITIZENS) {
        await setDoc(doc(db, COLLECTIONS.CITIZENS, c.id), c);
      }
    }

    const unitSnap = await getDocs(collection(db, COLLECTIONS.ACTIVE_UNITS));
    if (unitSnap.empty) {
      for (const u of INITIAL_ACTIVE_UNITS) {
        await setDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, u.id), u);
      }
    }

    const markSnap = await getDocs(collection(db, COLLECTIONS.MAP_MARKERS));
    if (markSnap.empty) {
      for (const m of INITIAL_MAP_MARKERS) {
        await setDoc(doc(db, COLLECTIONS.MAP_MARKERS, m.id), m);
      }
    }
  } catch (err) {
    console.error('Error seeding initial CAD data:', err);
  }
}
