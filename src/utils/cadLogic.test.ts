import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkMasterPassword,
  checkAdminPassword,
  formatLicensePlate,
  calculateTotalFines,
  filterCitizens,
  filterVehicles,
  getStatusColor,
  formatTimeAgo
} from './cadLogic';
import { Citizen, Vehicle } from '../types/cad';

test('checkMasterPassword validates accepted passwords and rejects invalid', () => {
  assert.equal(checkMasterPassword('EMH'), true);
  assert.equal(checkMasterPassword('emh'), true);
  assert.equal(checkMasterPassword('EMH112'), true);
  assert.equal(checkMasterPassword('HAMBURG'), true);
  assert.equal(checkMasterPassword('wrong'), false);
  assert.equal(checkMasterPassword(''), false);
});

test('checkAdminPassword validates admin credentials', () => {
  assert.equal(checkAdminPassword('MELD'), true);
  assert.equal(checkAdminPassword('meld112'), true);
  assert.equal(checkAdminPassword('ADMIN112'), true);
  assert.equal(checkAdminPassword('politie'), false);
});

test('formatLicensePlate formats uppercase and strips invalid characters', () => {
  assert.equal(formatLicensePlate('hh-pd-112'), 'HH-PD-112');
  assert.equal(formatLicensePlate('  hh 1234! '), 'HH1234');
});

test('calculateTotalFines sums all fine amounts correctly', () => {
  const citizen: Citizen = {
    id: 'c1',
    name: 'Jan de Vries',
    dob: '12-05-1994',
    driver_license_status: 'Geldig',
    wanted_status: false,
    notes: 'Geen bijzonderheden',
    updated_at: '2026-11-01',
    fines_list: [
      { id: 'f1', reason: 'Snelheid 15 km/u te hard', amount: 165, date: '2026-10-15', officer: '10-01' },
      { id: 'f2', reason: 'Rood verkeerslicht', amount: 300, date: '2026-10-20', officer: '10-02' }
    ]
  };
  assert.equal(calculateTotalFines(citizen), 465);
});

test('filterCitizens filters by name or notes', () => {
  const citizens: Citizen[] = [
    {
      id: '1',
      name: 'Klaas Jansen',
      dob: '01-01-1990',
      driver_license_status: 'Geldig',
      fines_list: [],
      wanted_status: true,
      notes: 'Betrokken bij overval',
      updated_at: ''
    },
    {
      id: '2',
      name: 'Sophie Bakker',
      dob: '10-08-2001',
      driver_license_status: 'Ingetrokken',
      fines_list: [],
      wanted_status: false,
      notes: 'Schone lei',
      updated_at: ''
    }
  ];

  assert.equal(filterCitizens(citizens, 'Klaas').length, 1);
  assert.equal(filterCitizens(citizens, 'Klaas')[0].name, 'Klaas Jansen');
  assert.equal(filterCitizens(citizens, 'overval').length, 1);
  assert.equal(filterCitizens(citizens, 'nonexistent').length, 0);
});

test('filterVehicles filters by license plate and owner', () => {
  const vehicles: Vehicle[] = [
    {
      id: 'v1',
      license_plate: 'HH-PD-112',
      owner: 'Meldkamer Hamburg',
      model: 'Audi RS6 Politie',
      color: 'Wit/Blauw/Geel',
      notes: 'Dienstvoertuig',
      wanted_status: false,
      apk_status: 'Goedgekeurd',
      insurance_status: 'Verzekerd',
      updated_at: ''
    },
    {
      id: 'v2',
      license_plate: 'HH-XX-999',
      owner: 'Onbekende verdachte',
      model: 'BMW M5',
      color: 'Zwart',
      notes: 'Verdacht van ramkraak',
      wanted_status: true,
      apk_status: 'Verlopen',
      insurance_status: 'Onverzekerd',
      updated_at: ''
    }
  ];

  assert.equal(filterVehicles(vehicles, 'HH-PD').length, 1);
  assert.equal(filterVehicles(vehicles, 'BMW').length, 1);
  assert.equal(filterVehicles(vehicles, 'Zwart').length, 0); // search plate, owner, model
});

test('getStatusColor returns proper styling for all 4 Dutch emergency statuses', () => {
  const s1 = getStatusColor('Status 1');
  assert.match(s1.label, /Status 1: Beschikbaar/);
  assert.match(s1.text, /emerald/);

  const s4 = getStatusColor('Status 4');
  assert.match(s4.label, /Status 4: Ter Plaatse/);
  assert.match(s4.text, /rose/);
});

test('formatTimeAgo handles recent timestamps', () => {
  const now = Date.now();
  assert.equal(formatTimeAgo(now - 1000), 'Zojuist');
  assert.equal(formatTimeAgo(now - 45000), '45s geleden');
  assert.equal(formatTimeAgo(now - 120000), '2m geleden');
});
