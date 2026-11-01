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
  getUserAccount,
  registerUserAccount,
  updateUserJoinedServers,
  addOrUpdateServerMember,
  seedServerDemoData,
  handleFirestoreError,
  OperationType,
  INITIAL_SERVERS
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
  Fine,
  CadServer,
  UserAccount,
  ServerMember
} from './types/cad';
import { Header } from './components/Header';
import { UserAuthModal } from './components/UserAuthModal';
import { ServerHubModal } from './components/ServerHubModal';
import { PanicOverlay } from './components/PanicOverlay';
import { InteractiveMap } from './components/InteractiveMap';
import { ActiveUnitsList } from './components/ActiveUnitsList';
import { VehicleLookup } from './components/VehicleLookup';
import { CitizenLookup } from './components/CitizenLookup';
import { AdminModal } from './components/AdminModal';

export default function App() {
  // 1. Current Authenticated User Account (Stored locally & verified in Firestore)
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('emh_user_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Active Session in a specific server
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('emh_cad_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isSwitchingServer, setIsSwitchingServer] = useState(false);

  // 3. Real-time Servers List
  const [servers, setServers] = useState<CadServer[]>([]);

  // 4. Current Unit Status
  const [currentStatus, setCurrentStatus] = useState<UnitStatus>('Status 1');

  // 5. Active Tab
  const [activeTab, setActiveTab] = useState<'map' | 'units' | 'vehicles' | 'citizens'>('map');

  // 6. Modals & Settings
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // 7. Scoped Collections (Per active server)
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [units, setUnits] = useState<ActiveUnit[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  // Current Server Document
  const currentServer = servers.find((s) => s.id === session?.serverId) || null;

  const currentSystemState: SystemState = {
    active_panic: currentServer?.active_panic || false,
    panic_unit: currentServer?.panic_unit || '',
    panic_time: currentServer?.panic_time || 0,
    alert_level: currentServer?.alert_level || 'Normaal',
    broadcast_message: currentServer?.broadcast_message || 'Emergency Hamburg CAD verbonden.',
    updated_at: currentServer?.updated_at || new Date().toISOString(),
  };

  // 1. Connection check on boot
  useEffect(() => {
    testConnection();
  }, []);

  // 2. Real-time Servers Listener
  useEffect(() => {
    const unsubServers = onSnapshot(
      collection(db, COLLECTIONS.SERVERS),
      (snap) => {
        const list: CadServer[] = [];
        snap.forEach((d) => list.push({ ...d.data(), id: d.id } as CadServer));
        setServers(list);
      },
      (err) => {
        console.warn('Firestore servers listener warning:', err);
      }
    );

    return () => unsubServers();
  }, []);

  // 3. Real-time Collections Listeners (Scoped to active server)
  useEffect(() => {
    if (!session?.serverId) {
      setVehicles([]);
      setCitizens([]);
      setUnits([]);
      setMarkers([]);
      return;
    }

    const serverId = session.serverId;

    // Vehicles
    const unsubVehicles = onSnapshot(
      collection(db, COLLECTIONS.VEHICLES),
      (snap) => {
        const list: Vehicle[] = [];
        snap.forEach((d) => {
          const data = d.data() as Vehicle;
          if (data.server_id === serverId) {
            list.push({ ...data, id: d.id, server_id: serverId });
          }
        });
        setVehicles(list);
      },
      (err) => {
        console.warn('Firestore vehicles listener warning:', err);
      }
    );

    // Citizens
    const unsubCitizens = onSnapshot(
      collection(db, COLLECTIONS.CITIZENS),
      (snap) => {
        const list: Citizen[] = [];
        snap.forEach((d) => {
          const data = d.data() as Citizen;
          if (data.server_id === serverId) {
            list.push({ ...data, id: d.id, server_id: serverId });
          }
        });
        setCitizens(list);
      },
      (err) => {
        console.warn('Firestore citizens listener warning:', err);
      }
    );

    // Active Units
    const unsubUnits = onSnapshot(
      collection(db, COLLECTIONS.ACTIVE_UNITS),
      (snap) => {
        const list: ActiveUnit[] = [];
        snap.forEach((d) => {
          const data = d.data() as ActiveUnit;
          if (data.server_id === serverId) {
            list.push({ ...data, id: d.id, server_id: serverId });
          }
        });
        setUnits(list);

        if (session) {
          const found = list.find((u) => u.unit_name.toUpperCase() === session.callsign.toUpperCase());
          if (found && found.current_status) {
            setCurrentStatus(found.current_status);
          }
        }
      },
      (err) => {
        console.warn('Firestore active units listener warning:', err);
      }
    );

    // Map Markers
    const unsubMarkers = onSnapshot(
      collection(db, COLLECTIONS.MAP_MARKERS),
      (snap) => {
        const list: MapMarker[] = [];
        snap.forEach((d) => {
          const data = d.data() as MapMarker;
          if (data.server_id === serverId) {
            list.push({ ...data, id: d.id, server_id: serverId });
          }
        });
        list.sort((a, b) => b.timestamp - a.timestamp);
        setMarkers(list);
      },
      (err) => {
        console.warn('Firestore map markers listener warning:', err);
      }
    );

    return () => {
      unsubVehicles();
      unsubCitizens();
      unsubUnits();
      unsubMarkers();
    };
  }, [session?.serverId, session?.callsign]);

  // Sync unit to active_units
  const registerOrUpdateActiveUnit = useCallback(
    async (sess: UserSession, status: UnitStatus) => {
      const unitDocId = `unit-${sess.serverId.toLowerCase()}-${sess.callsign.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
      const payload: ActiveUnit = {
        id: unitDocId,
        server_id: sess.serverId,
        username: sess.username,
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
        console.error('Fout bij registreren actieve eenheid:', err);
      }
    },
    []
  );

  // Authentication Handlers
  const handleUserLoginSuccess = (account: UserAccount) => {
    setCurrentUserAccount(account);
    try {
      localStorage.setItem('emh_user_account', JSON.stringify(account));
    } catch {
      // Ignored
    }
  };

  const handleLogoutAccount = () => {
    // If unit was active in a session, clean it up
    if (session) {
      const unitDocId = `unit-${session.serverId.toLowerCase()}-${session.callsign.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
      deleteDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, unitDocId)).catch(() => {});
    }

    setCurrentUserAccount(null);
    setSession(null);
    setIsSwitchingServer(false);
    try {
      localStorage.removeItem('emh_user_account');
      localStorage.removeItem('emh_cad_session');
    } catch {
      // Ignored
    }
  };

  // Leave active server and return to "Mijn Servers"
  const handleLeaveServer = () => {
    if (session) {
      const unitDocId = `unit-${session.serverId.toLowerCase()}-${session.callsign.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
      deleteDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, unitDocId)).catch(() => {});
    }
    setSession(null);
    setIsSwitchingServer(false);
    try {
      localStorage.removeItem('emh_cad_session');
    } catch {
      // Ignored
    }
  };

  // Join Server Handler
  const handleJoinServer = async (targetServer: CadServer, newSession: UserSession) => {
    if (!currentUserAccount) return;

    // 1. Add / Update server member
    const memberRole: ServerMember['role'] = newSession.isOwner
      ? 'Eigenaar'
      : newSession.isAdmin
      ? 'Beheerder'
      : 'Agent';

    const memberPayload: ServerMember = {
      username: currentUserAccount.username,
      display_name: currentUserAccount.display_name,
      callsign: newSession.callsign,
      department: newSession.department,
      role: memberRole,
      joined_at: new Date().toISOString(),
      is_online: true,
      last_active: new Date().toISOString(),
    };

    await addOrUpdateServerMember(targetServer.id, memberPayload);

    // 2. Update user account joined servers list
    await updateUserJoinedServers(currentUserAccount.username, targetServer.id, false);

    // Update local user state
    const joinedSet = new Set(currentUserAccount.joined_server_ids || []);
    joinedSet.add(targetServer.id);
    const updatedAccount: UserAccount = {
      ...currentUserAccount,
      joined_server_ids: Array.from(joinedSet),
    };
    setCurrentUserAccount(updatedAccount);
    try {
      localStorage.setItem('emh_user_account', JSON.stringify(updatedAccount));
      localStorage.setItem('emh_cad_session', JSON.stringify(newSession));
    } catch {
      // Ignored
    }

    setSession(newSession);
    setIsSwitchingServer(false);

    await registerOrUpdateActiveUnit(newSession, 'Status 1');
    cadAudio.playStatusGong(1);
  };

  // Create Server Handler
  const handleCreateServer = async (
    serverData: Omit<CadServer, 'created_at' | 'updated_at'>,
    newSession: UserSession
  ) => {
    if (!currentUserAccount) return;

    const fullServer: CadServer = {
      ...serverData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, COLLECTIONS.SERVERS, serverData.id), fullServer);
    } catch (err) {
      console.error('Fout bij opslaan nieuwe server in Firestore:', err);
    }

    // Update user account created & joined servers
    await updateUserJoinedServers(currentUserAccount.username, serverData.id, true);

    const joinedSet = new Set(currentUserAccount.joined_server_ids || []);
    joinedSet.add(serverData.id);
    const createdSet = new Set(currentUserAccount.created_server_ids || []);
    createdSet.add(serverData.id);

    const updatedAccount: UserAccount = {
      ...currentUserAccount,
      joined_server_ids: Array.from(joinedSet),
      created_server_ids: Array.from(createdSet),
    };
    setCurrentUserAccount(updatedAccount);

    try {
      localStorage.setItem('emh_user_account', JSON.stringify(updatedAccount));
      localStorage.setItem('emh_cad_session', JSON.stringify(newSession));
    } catch {
      // Ignored
    }

    setSession(newSession);
    setIsSwitchingServer(false);

    await registerOrUpdateActiveUnit(newSession, 'Status 1');
    cadAudio.playStatusGong(1);
  };

  // FEATURE 3: Portofoon Status-Gong & Real-time Update
  const handleStatusChange = async (newStatus: UnitStatus) => {
    setCurrentStatus(newStatus);

    const num = newStatus === 'Status 4' ? 4 : newStatus === 'Status 3' ? 3 : newStatus === 'Status 2' ? 2 : 1;
    cadAudio.playStatusGong(num);

    if (session) {
      const unitDocId = `unit-${session.serverId.toLowerCase()}-${session.callsign.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
      try {
        await updateDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, unitDocId), {
          current_status: newStatus,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        await registerOrUpdateActiveUnit(session, newStatus);
      }
    }
  };

  // FEATURE 2: Real-time Noodknop / Panic Trigger
  const handleTriggerPanic = async () => {
    if (!session) return;
    const unitName = session.callsign;
    const serverId = session.serverId;
    const now = Date.now();

    try {
      await updateDoc(doc(db, COLLECTIONS.SERVERS, serverId), {
        active_panic: true,
        panic_unit: unitName,
        panic_time: now,
        alert_level: 'Code Rood',
        updated_at: new Date().toISOString(),
      });

      const unitDocId = `unit-${session.serverId.toLowerCase()}-${session.callsign.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
      await updateDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, unitDocId), {
        is_panic: true,
        last_panic_time: now,
        current_status: 'Status 4',
        updated_at: new Date().toISOString(),
      }).catch(() => {});
    } catch (err) {
      console.error('Fout bij activeren noodknop:', err);
    }
  };

  // Clear Panic
  const handleClearPanic = async () => {
    if (!session) return;
    const serverId = session.serverId;
    try {
      await updateDoc(doc(db, COLLECTIONS.SERVERS, serverId), {
        active_panic: false,
        alert_level: 'Normaal',
        updated_at: new Date().toISOString(),
      });

      const unitSnaps = await getDocs(collection(db, COLLECTIONS.ACTIVE_UNITS));
      unitSnaps.forEach(async (uDoc) => {
        const data = uDoc.data();
        if (data.server_id === serverId && data.is_panic) {
          await updateDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, uDoc.id), {
            is_panic: false,
          }).catch(() => {});
        }
      });
    } catch (err) {
      console.error('Fout bij resetten noodknop:', err);
    }
  };

  // Map Marker handlers
  const handleAddMarker = async (marker: Omit<MapMarker, 'id' | 'timestamp' | 'server_id'>) => {
    if (!session) return;
    const serverId = session.serverId;
    const markerId = `marker-${Date.now()}`;
    const payload: MapMarker = {
      ...marker,
      id: markerId,
      server_id: serverId,
      timestamp: Date.now(),
    };
    try {
      await setDoc(doc(db, COLLECTIONS.MAP_MARKERS, markerId), payload);
    } catch (err) {
      console.error('Fout bij toevoegen kaartmarkering:', err);
    }
  };

  const handleDeleteMarker = async (markerId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.MAP_MARKERS, markerId));
    } catch (err) {
      console.error('Fout bij wissen kaartmarkering:', err);
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
      console.error('Fout bij bijwerken signalering voertuig:', err);
    }
  };

  const handleAddVehicle = async (vehicle: Omit<Vehicle, 'id' | 'updated_at' | 'server_id'>) => {
    if (!session) return;
    const serverId = session.serverId;
    const vehicleId = `${serverId}-${vehicle.license_plate.replace(/[^A-Z0-9-]/g, '')}`;
    const payload: Vehicle = {
      ...vehicle,
      id: vehicleId,
      server_id: serverId,
      updated_at: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, COLLECTIONS.VEHICLES, vehicleId), payload);
    } catch (err) {
      console.error('Fout bij opslaan voertuig:', err);
    }
  };

  const handleUpdateVehicleNotes = async (vehicleId: string, notes: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.VEHICLES, vehicleId), {
        notes,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Fout bij opslaan voertuignotitie:', err);
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
      console.error('Fout bij wijzigen signalering burger:', err);
    }
  };

  const handleUpdateLicense = async (citizenId: string, status: Citizen['driver_license_status']) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.CITIZENS, citizenId), {
        driver_license_status: status,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Fout bij wijzigen rijbewijsstatus:', err);
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
      console.error('Fout bij toevoegen boete:', err);
    }
  };

  const handleAddCitizen = async (citizen: Omit<Citizen, 'id' | 'fines_list' | 'updated_at' | 'server_id'>) => {
    if (!session) return;
    const serverId = session.serverId;
    const citizenId = `${serverId}-cit-${Date.now()}`;
    const payload: Citizen = {
      ...citizen,
      id: citizenId,
      server_id: serverId,
      fines_list: [],
      updated_at: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, COLLECTIONS.CITIZENS, citizenId), payload);
    } catch (err) {
      console.error('Fout bij toevoegen burger:', err);
    }
  };

  const handleUpdateCitizenNotes = async (citizenId: string, notes: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.CITIZENS, citizenId), {
        notes,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Fout bij opslaan burgernotitie:', err);
    }
  };

  // Admin Actions
  const handleClearMapMarkers = async () => {
    if (!session) return;
    const serverId = session.serverId;
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.MAP_MARKERS));
      for (const d of snap.docs) {
        if (d.data().server_id === serverId) {
          await deleteDoc(doc(db, COLLECTIONS.MAP_MARKERS, d.id));
        }
      }
    } catch (err) {
      console.error('Fout bij wissen markeringen:', err);
    }
  };

  const handleClearUnitsList = async () => {
    if (!session) return;
    const serverId = session.serverId;
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.ACTIVE_UNITS));
      for (const d of snap.docs) {
        if (d.data().server_id === serverId) {
          await deleteDoc(doc(db, COLLECTIONS.ACTIVE_UNITS, d.id));
        }
      }
      if (session) {
        await registerOrUpdateActiveUnit(session, currentStatus);
      }
    } catch (err) {
      console.error('Fout bij opschonen eenheden:', err);
    }
  };

  const handleUpdateSystemState = async (update: Partial<SystemState>) => {
    if (!session) return;
    const serverId = session.serverId;
    try {
      await updateDoc(doc(db, COLLECTIONS.SERVERS, serverId), update);
    } catch (err) {
      console.error('Fout bij bijwerken status:', err);
    }
  };

  const handleUpdateServerSettings = async (update: Partial<CadServer>) => {
    if (!session) return;
    const serverId = session.serverId;
    try {
      await updateDoc(doc(db, COLLECTIONS.SERVERS, serverId), update);
      if (update.name && session) {
        const updatedSession = { ...session, serverName: update.name };
        setSession(updatedSession);
        try {
          localStorage.setItem('emh_cad_session', JSON.stringify(updatedSession));
        } catch {
          // Ignored
        }
      }
    } catch (err) {
      console.error('Fout bij opslaan server instellingen:', err);
    }
  };

  const handleReseedData = async () => {
    if (!session) return;
    await seedServerDemoData(session.serverId);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    cadAudio.setMuted(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* 1. AGENT AUTHENTICATIE: Iedereen moet eerst inloggen / registreren */}
      {!currentUserAccount && (
        <UserAuthModal
          onLoginSuccess={handleUserLoginSuccess}
          onGetUserAccount={getUserAccount}
          onRegisterAccount={registerUserAccount}
        />
      )}

      {/* 2. SERVER HUB: Mijn Servers, Server Deelnemen (met code + ww) of Server Maken */}
      {currentUserAccount && (!session || isSwitchingServer) && (
        <ServerHubModal
          currentUser={currentUserAccount}
          allServers={servers}
          onJoinServer={handleJoinServer}
          onCreateServer={handleCreateServer}
          onLogoutAccount={handleLogoutAccount}
        />
      )}

      {/* 3. REAL-TIME NOODKNOP / PANIC OVERLAY */}
      {session && !isSwitchingServer && (
        <PanicOverlay
          activePanic={currentSystemState.active_panic}
          panicUnit={currentSystemState.panic_unit}
          panicTime={currentSystemState.panic_time}
          onClearPanic={handleClearPanic}
          isAdmin={session?.isAdmin}
        />
      )}

      {/* 4. Header & Portofoon Quick Controls */}
      {session && !isSwitchingServer && (
        <Header
          session={session}
          systemState={currentSystemState}
          currentStatus={currentStatus}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onStatusChange={handleStatusChange}
          onTriggerPanic={handleTriggerPanic}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onSwitchServer={() => setIsSwitchingServer(true)}
          onLogout={handleLeaveServer}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* 5. Main Body Content */}
      {session && !isSwitchingServer && (
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

      {/* 6. Admin & Server Management Modal */}
      {session && (
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          server={currentServer}
          isOwner={session?.isOwner || false}
          systemState={currentSystemState}
          onClearMarkers={handleClearMapMarkers}
          onClearPanic={handleClearPanic}
          onClearUnits={handleClearUnitsList}
          onUpdateSystemState={handleUpdateSystemState}
          onUpdateServerSettings={handleUpdateServerSettings}
          onReseedData={handleReseedData}
        />
      )}

    </div>
  );
}
