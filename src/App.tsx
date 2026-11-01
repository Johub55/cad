import React, { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import {
  db,
  COLLECTIONS,
  testConnection,
  seedInitialDataIfNeeded,
  handleFirestoreError,
  OperationType,
  INITIAL_VEHICLES,
  INITIAL_CITIZENS,
  INITIAL_ACTIVE_UNITS,
  INITIAL_MAP_MARKERS
} from './services/firebase';
import { cadAudio } from './services/audio';
import {
  Vehicle,
  Citizen,
  ActiveUnit,
  MapMarker,
  SystemState,
  UserSession,
  UnitStatus,
  Fine
} from './types/cad';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { PanicOverlay } from './components/PanicOverlay';
import { InteractiveMap } from './components/InteractiveMap';
import { ActiveUnitsList } from './components/ActiveUnitsList';
import { VehicleLookup } from './components/VehicleLookup';
import { CitizenLookup } from './components/CitizenLookup';
import { AdminModal } from './components/AdminModal';

export default function App() {
  // Session & Authentication State
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('emh_cad_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Current Unit Status
  const [currentStatus, setCurrentStatus] = useState<UnitStatus>('Status 1');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'map' | 'units' | 'vehicles' | 'citizens'>('map');

  // Modals
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Firestore Real-time Collections
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [units, setUnits] = useState<ActiveUnit[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [systemState, setSystemState] = useState<SystemState>({
    active_panic: false,
    panic_unit: '',
    panic_time: 0,
    alert_level: 'Normaal',
    broadcast_message: 'Emergency Hamburg CAD verbonden.',
    updated_at: new Date().toISOString(),
  });

  // 1. Initial Connection Test & Data Seeding
  useEffect(() => {
    testConnection();
    seedInitialDataIfNeeded();
  }, []);

  // 2. Real-time Listeners (Firestore v10 onSnapshot)
  useEffect(() => {
    // Vehicles
    const unsubVehicles = onSnapshot(
      collection(db, COLLECTIONS.VEHICLES),
      (snap) => {
        const list: Vehicle[] = [];
        snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Vehicle));
        setVehicles(list.length > 0 ? list : INITIAL_VEHICLES);
      },
      (err) => {
        console.warn('Firestore vehicles listener warning (falling back to initial data):', err);
        setVehicles((prev) => (prev.length > 0 ? prev : INITIAL_VEHICLES));
      }
    );

    // Citizens
    const unsubCitizens = onSnapshot(
      collection(db, COLLECTIONS.CITIZENS),
      (snap) => {
        const list: Citizen[] = [];
        snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Citizen));
        setCitizens(list.length > 0 ? list : INITIAL_CITIZENS);
      },
      (err) => {
        console.warn('Firestore citizens listener warning (falling back to initial data):', err);
        setCitizens((prev) => (prev.length > 0 ? prev : INITIAL_CITIZENS));
      }
    );

    // Active Units
    const unsubUnits = onSnapshot(
      collection(db, COLLECTIONS.ACTIVE_UNITS),
      (snap) => {
        const list: ActiveUnit[] = [];
        snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ActiveUnit));
        const finalUnits = list.length > 0 ? list : INITIAL_ACTIVE_UNITS;
        setUnits(finalUnits);

        // Keep current unit's status in sync if found
        if (session) {
          const found = finalUnits.find((u) => u.unit_name.toUpperCase() === session.callsign.toUpperCase());
          if (found && found.current_status) {
            setCurrentStatus(found.current_status);
          }
        }
      },
      (err) => {
        console.warn('Firestore active units listener warning (falling back to initial data):', err);
        setUnits((prev) => (prev.length > 0 ? prev : INITIAL_ACTIVE_UNITS));
      }
    );

    // Map Markers
    const unsubMarkers = onSnapshot(
      collection(db, COLLECTIONS.MAP_MARKERS),
      (snap) => {
        const list: MapMarker[] = [];
        snap.forEach((d) => list.push({ ...d.data(), id: d.id } as MapMarker));
        list.sort((a, b) => b.timestamp - a.timestamp);
        setMarkers(list.length > 0 ? list : INITIAL_MAP_MARKERS);
      },
      (err) => {
        console.warn('Firestore map markers listener warning (falling back to initial data):', err);
        setMarkers((prev) => (prev.length > 0 ? prev : INITIAL_MAP_MARKERS));
      }
    );

    // System State (Global)
    const unsubSys = onSnapshot(
      doc(db, COLLECTIONS.SYSTEM_STATE, 'global'),
      (snap) => {
        if (snap.exists()) {
          setSystemState(snap.data() as SystemState);
        }
      },
      (err) => {
        console.warn('Firestore system state listener warning:', err);
      }
    );

    return () => {
      unsubVehicles();
      unsubCitizens();
      unsubUnits();
      unsubMarkers();
      unsubSys();
    };
  }, [session]);

  // Sync unit to active_units when logging in
  const registerOrUpdateActiveUnit = useCallback(
    async (sess: UserSession, status: UnitStatus) => {
      const unitDocId = `unit-${sess.callsign.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
      const payload: ActiveUnit = {
        id: unitDocId,
        unit_name: sess.callsign,
        current_status: status,
        department: sess.department,
        officer_name: sess.officerName,
        is_panic: false,
        last_panic_time: null,
        updated_at: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, unitDocId), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.ACTIVE_UNITS}/${unitDocId}`);
      }
    },
    []
  );

  const handleLogin = async (newSession: UserSession) => {
    setSession(newSession);
    try {
      localStorage.setItem('emh_cad_session', JSON.stringify(newSession));
    } catch {
      // Ignored
    }
    await registerOrUpdateActiveUnit(newSession, 'Status 1');
    cadAudio.playStatusGong(1);
  };

  const handleLogout = () => {
    setSession(null);
    try {
      localStorage.removeItem('emh_cad_session');
    } catch {
      // Ignored
    }
  };

  // FEATURE 3: Portofoon Status-Gong & Real-time Update
  const handleStatusChange = async (newStatus: UnitStatus) => {
    setCurrentStatus(newStatus);

    // Play TETRA/Motorola radio chirp
    const num = newStatus === 'Status 4' ? 4 : newStatus === 'Status 3' ? 3 : newStatus === 'Status 2' ? 2 : 1;
    cadAudio.playStatusGong(num);

    if (session) {
      const unitDocId = `unit-${session.callsign.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
      try {
        await updateDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, unitDocId), {
          current_status: newStatus,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        // If doc does not exist yet, recreate
        await registerOrUpdateActiveUnit(session, newStatus);
      }
    }
  };

  // FEATURE 2: Real-time Noodknop / Panic Trigger
  const handleTriggerPanic = async () => {
    const unitName = session?.callsign || 'SURVEILLANCE';
    const now = Date.now();

    try {
      await updateDoc(doc(db, COLLECTIONS.SYSTEM_STATE, 'global'), {
        active_panic: true,
        panic_unit: unitName,
        panic_time: now,
        alert_level: 'Code Rood',
        updated_at: new Date().toISOString(),
      });

      if (session) {
        const unitDocId = `unit-${session.callsign.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
        await updateDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, unitDocId), {
          is_panic: true,
          last_panic_time: now,
          current_status: 'Status 4', // Automatically set to Ter Plaatse
          updated_at: new Date().toISOString(),
        }).catch(() => {});
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.SYSTEM_STATE}/global`);
    }
  };

  // Clear Panic
  const handleClearPanic = async () => {
    try {
      await updateDoc(doc(db, COLLECTIONS.SYSTEM_STATE, 'global'), {
        active_panic: false,
        alert_level: 'Normaal',
        updated_at: new Date().toISOString(),
      });

      // Clear is_panic flags on active units
      const unitSnaps = await getDocs(collection(db, COLLECTIONS.ACTIVE_UNITS));
      unitSnaps.forEach(async (uDoc) => {
        if (uDoc.data().is_panic) {
          await updateDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, uDoc.id), {
            is_panic: false,
          }).catch(() => {});
        }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.SYSTEM_STATE}/global`);
    }
  };

  // Map Marker handlers
  const handleAddMarker = async (marker: Omit<MapMarker, 'id' | 'timestamp'>) => {
    const markerId = `marker-${Date.now()}`;
    const payload: MapMarker = {
      ...marker,
      id: markerId,
      timestamp: Date.now(),
    };
    try {
      await setDoc(doc(db, COLLECTIONS.MAP_MARKERS, markerId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.MAP_MARKERS}/${markerId}`);
    }
  };

  const handleDeleteMarker = async (markerId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.MAP_MARKERS, markerId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.MAP_MARKERS}/${markerId}`);
    }
  };

  const handleRespondToMarker = (marker: MapMarker) => {
    handleStatusChange('Status 3');
  };

  // Vehicle handlers
  const handleToggleVehicleWanted = async (vehicleId: string, currentWanted: boolean) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.VEHICLES, vehicleId), {
        wanted_status: !currentWanted,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.VEHICLES}/${vehicleId}`);
    }
  };

  const handleAddVehicle = async (vehicle: Omit<Vehicle, 'id' | 'updated_at'>) => {
    const vehicleId = vehicle.license_plate.replace(/[^A-Z0-9-]/g, '');
    const payload: Vehicle = {
      ...vehicle,
      id: vehicleId,
      updated_at: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, COLLECTIONS.VEHICLES, vehicleId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.VEHICLES}/${vehicleId}`);
    }
  };

  const handleUpdateVehicleNotes = async (vehicleId: string, notes: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.VEHICLES, vehicleId), {
        notes,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.VEHICLES}/${vehicleId}`);
    }
  };

  // Citizen handlers
  const handleToggleCitizenWanted = async (citizenId: string, currentWanted: boolean) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.CITIZENS, citizenId), {
        wanted_status: !currentWanted,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.CITIZENS}/${citizenId}`);
    }
  };

  const handleUpdateLicense = async (citizenId: string, status: Citizen['driver_license_status']) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.CITIZENS, citizenId), {
        driver_license_status: status,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.CITIZENS}/${citizenId}`);
    }
  };

  const handleAddFine = async (citizenId: string, fine: Omit<Fine, 'id'>) => {
    const citizen = citizens.find((c) => c.id === citizenId);
    if (!citizen) return;

    const newFine: Fine = {
      ...fine,
      id: `fine-${Date.now()}`,
    };
    const updatedFines = [...(citizen.fines_list || []), newFine];

    try {
      await updateDoc(doc(db, COLLECTIONS.CITIZENS, citizenId), {
        fines_list: updatedFines,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.CITIZENS}/${citizenId}`);
    }
  };

  const handleAddCitizen = async (citizen: Omit<Citizen, 'id' | 'fines_list' | 'updated_at'>) => {
    const citizenId = `cit-${Date.now()}`;
    const payload: Citizen = {
      ...citizen,
      id: citizenId,
      fines_list: [],
      updated_at: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, COLLECTIONS.CITIZENS, citizenId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.CITIZENS}/${citizenId}`);
    }
  };

  const handleUpdateCitizenNotes = async (citizenId: string, notes: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.CITIZENS, citizenId), {
        notes,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.CITIZENS}/${citizenId}`);
    }
  };

  // Admin Actions
  const handleClearMapMarkers = async () => {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.MAP_MARKERS));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, COLLECTIONS.MAP_MARKERS, d.id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, COLLECTIONS.MAP_MARKERS);
    }
  };

  const handleClearUnitsList = async () => {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.ACTIVE_UNITS));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, d.id));
      }
      // Re-add current user if logged in
      if (session) {
        await registerOrUpdateActiveUnit(session, currentStatus);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, COLLECTIONS.ACTIVE_UNITS);
    }
  };

  const handleUpdateSystemState = async (update: Partial<SystemState>) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.SYSTEM_STATE, 'global'), update);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.SYSTEM_STATE}/global`);
    }
  };

  const handleReseedData = async () => {
    try {
      for (const v of INITIAL_VEHICLES) {
        await setDoc(doc(db, COLLECTIONS.VEHICLES, v.id), v);
      }
      for (const c of INITIAL_CITIZENS) {
        await setDoc(doc(db, COLLECTIONS.CITIZENS, c.id), c);
      }
      for (const u of INITIAL_ACTIVE_UNITS) {
        await setDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, u.id), u);
      }
      for (const m of INITIAL_MAP_MARKERS) {
        await setDoc(doc(db, COLLECTIONS.MAP_MARKERS, m.id), m);
      }
      await updateDoc(doc(db, COLLECTIONS.SYSTEM_STATE, 'global'), {
        active_panic: false,
        panic_unit: '',
        panic_time: 0,
        alert_level: 'Normaal',
        broadcast_message: 'Meldkamer Hamburg online. Portofoons en GPS gekoppeld.',
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error reseeding:', err);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    cadAudio.setMuted(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* 1. Master Password Login Modal */}
      {!session && <LoginModal onLogin={handleLogin} />}

      {/* 2. REAL-TIME NOODKNOP / PANIC OVERLAY (triggers on all connected devices) */}
      <PanicOverlay
        activePanic={systemState.active_panic}
        panicUnit={systemState.panic_unit}
        panicTime={systemState.panic_time}
        onClearPanic={handleClearPanic}
        isAdmin={session?.isAdmin}
      />

      {/* 3. Header & Portofoon Quick Controls */}
      {session && (
        <Header
          session={session}
          systemState={systemState}
          currentStatus={currentStatus}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onStatusChange={handleStatusChange}
          onTriggerPanic={handleTriggerPanic}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onLogout={handleLogout}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* 4. Main Body Content (Laptop grid / Mobile stacked) */}
      {session && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 pb-20">
          {activeTab === 'map' && (
            <InteractiveMap
              markers={markers}
              onAddMarker={handleAddMarker}
              onDeleteMarker={handleDeleteMarker}
              onRespondToMarker={handleRespondToMarker}
              currentUserCallsign={session.callsign}
            />
          )}

          {activeTab === 'units' && (
            <ActiveUnitsList
              units={units}
              currentUserCallsign={session.callsign}
              currentStatus={currentStatus}
              onStatusChange={handleStatusChange}
              onTriggerPanic={handleTriggerPanic}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehicleLookup
              vehicles={vehicles}
              onToggleWanted={handleToggleVehicleWanted}
              onAddVehicle={handleAddVehicle}
              onUpdateNotes={handleUpdateVehicleNotes}
            />
          )}

          {activeTab === 'citizens' && (
            <CitizenLookup
              citizens={citizens}
              currentUserCallsign={session.callsign}
              onToggleWanted={handleToggleCitizenWanted}
              onUpdateLicense={handleUpdateLicense}
              onAddFine={handleAddFine}
              onAddCitizen={handleAddCitizen}
              onUpdateNotes={handleUpdateCitizenNotes}
            />
          )}
        </main>
      )}

      {/* 5. Admin / Meldkamer Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        systemState={systemState}
        onClearMarkers={handleClearMapMarkers}
        onClearPanic={handleClearPanic}
        onClearUnits={handleClearUnitsList}
        onUpdateSystemState={handleUpdateSystemState}
        onReseedData={handleReseedData}
      />

    </div>
  );
}
