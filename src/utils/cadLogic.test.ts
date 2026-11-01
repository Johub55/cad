import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkServerJoinPassword,
  checkServerAdminPassword,
  cleanUsername,
  cleanEmail,
  isValidEmail,
  generateServerCode,
  DEFAULT_DEPARTMENTS,
  formatLicensePlate,
  calculateTotalFines,
  filterCitizens,
  filterVehicles,
  getStatusColor
} from './cadLogic';
import { Citizen, Vehicle } from '../types/cad';

test('cleanUsername normalizes username to lowercase alphanumeric without spaces', () => {
  assert.equal(cleanUsername('Agent_Jansen 112!'), 'agent_jansen112');
  assert.equal(cleanUsername(''), '');
});

test('checkServerJoinPassword enforces strict matching without hardcoded fallback', () => {
  assert.equal(checkServerJoinPassword('SecretPass', 'SecretPass'), true);
  assert.equal(checkServerJoinPassword('secretpass', 'SecretPass'), false);
  assert.equal(checkServerJoinPassword('EMH', 'SecretPass'), false);
  assert.equal(checkServerJoinPassword('', 'SecretPass'), false);
});

test('checkServerAdminPassword enforces strict matching for admin panel', () => {
  assert.equal(checkServerAdminPassword('Admin999!', 'Admin999!'), true);
  assert.equal(checkServerAdminPassword('wrong', 'Admin999!'), false);
});

test('generateServerCode produces clean EMH prefix codes', () => {
  const code = generateServerCode();
  assert.match(code, /^EMH-\d{4}$/);
});

test('calculateTotalFines sums all fine amounts correctly', () => {
  const citizen: Citizen = {
    id: 'c1',
    server_id: 'srv1',
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

test('cleanEmail normalizes and trims email addresses', () => {
  assert.equal(cleanEmail('  Joas@Thorig.EU  '), 'joas@thorig.eu');
  assert.equal(cleanEmail('AGENT@POLITIE.NL'), 'agent@politie.nl');
  assert.equal(cleanEmail(''), '');
});

test('isValidEmail validates standard email formats strictly', () => {
  assert.equal(isValidEmail('joas@thorig.eu'), true);
  assert.equal(isValidEmail('agent.robin@politie.hamburg.de'), true);
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isValidEmail('missing@domain'), false);
  assert.equal(isValidEmail('@nodomain.com'), false);
  assert.equal(isValidEmail(''), false);
});
