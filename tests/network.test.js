import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {NETWORK_DATA, STATIONS, findStation, routesBetween, acServicesForRoute} from '../dist/mumbai-network.js';
import {updateJourney} from '../dist/mumbai-journey.js';

const route = (from, to) => {
  const result = routesBetween(from, to)[0];
  assert.ok(result, `Expected a route from ${from} to ${to}`);
  return result;
};
const hasService = (from, to, id, date = '2026-05-01') =>
  acServicesForRoute(route(from, to), date).some(service => service.id === id);

test('station identities retain local aliases and exclude MEMU-only stations', () => {
  assert.equal(new Set(STATIONS.map(station => station.code)).size, STATIONS.length);
  assert.equal(findStation('MMCT')?.code, 'BCL');
  assert.equal(findStation('DADAR WESTERN')?.code, 'DDR');
  assert.equal(findStation('DADAR CENTRAL')?.code, 'DR');
  assert.equal(findStation('MATUNGA ROAD')?.code, 'MRU');
  assert.ok(!NETWORK_DATA.chains.some(chain => chain.id.startsWith('memu-')));
  for (const code of ['BIRD', 'KHBV', 'ROHA', 'SMTN']) assert.equal(findStation(code), undefined);
  assert.deepEqual(routesBetween('CCG', 'ROHA'), []);
  assert.deepEqual(routesBetween('CCG', 'CCG'), []);
});

test('Western distances follow the official 2026 Churchgate chainage', () => {
  const full = route('CCG', 'DRD');
  assert.equal(full.km, 123.78);
  assert.equal(full.nodes.length, 37);
  assert.deepEqual(full.lineIds, ['western']);
  assert.equal(full.hasWalkingTransfer, false);
  assert.equal(route('VR', 'DRD').km, 63.8);
  assert.equal(route('CCG', 'VR').km, 59.98);
  assert.equal(route('VR', 'CCG').km, 59.98);
  assert.equal(route('ADH', 'RMAR').km, 3.54);
});

test('shared Sandhurst Road uses each corridor chainage without mixing origins', () => {
  // Sandhurst Road is 2.08 km on Main and 1.80 km on Harbour.
  // A single global station kilometre would corrupt at least one of these.
  assert.equal(route('CSMT', 'BY').km, 4.04);
  assert.deepEqual(route('CSMT', 'BY').lineIds, ['central-main']);
  assert.equal(route('CSMT', 'DKRD').km, 2.99);
  assert.deepEqual(route('CSMT', 'DKRD').lineIds, ['harbour-panvel']);
  assert.equal(route('SNRD', 'BY').km, 1.96);
  assert.equal(route('SNRD', 'DKRD').km, 1.19);
});

test('Trans-Harbour branches use their verified connector distances', () => {
  const vashi = route('TNA', 'VSH');
  assert.equal(vashi.km, 18.5);
  assert.deepEqual(vashi.nodes.slice(-3), ['TUH', 'SNCR', 'VSH']);
  assert.equal(route('TNA', 'NEU').km, 19.97);
  assert.equal(route('VSH', 'GNSL').km, 7.88);
  assert.equal(route('BEPR', 'TKNG').km, 21.81);
});

test('Harbour through-route reaches Goregaon via Mahim without a Dadar walk', () => {
  const through = route('CSMT', 'GMN');
  assert.ok(through.nodes.includes('KCE'));
  assert.ok(through.nodes.includes('MM'));
  assert.ok(through.lineIds.includes('western_harbour_shared'));
  assert.ok(!through.nodes.includes('DR'));
  assert.equal(through.hasWalkingTransfer, false);
  assert.equal(through.km, 26.32);
});

test('unknown Port connector distances stay unknown across the complete journey', () => {
  const portRoutes = routesBetween('NEU', 'URAN');
  assert.ok(portRoutes.length);
  for (const item of portRoutes) {
    assert.equal(item.km, null);
    assert.equal(item.distanceLabel, 'Not verified');
    assert.ok(item.edges.some(edge => edge.km === null));
  }
  assert.equal(route('TRGR', 'URAN').km, 17.96);
});

test('Dadar interchange stays an explicit pedestrian transfer, never AC rail service', () => {
  const interchange = route('DR', 'DDR');
  assert.deepEqual(interchange.nodes, ['DR', 'DDR']);
  assert.equal(interchange.hasWalkingTransfer, true);
  assert.equal(interchange.edges[0].transfer, true);
  assert.deepEqual(interchange.lineIds, []);
  assert.deepEqual(acServicesForRoute(interchange, '2026-05-01'), []);
  assert.ok(routesBetween('CCG', 'CSMT').some(item => item.hasWalkingTransfer));
});

test('AC stop patterns are directional and require both requested stations to be stops', () => {
  assert.equal(hasService('BVI', 'VR', 'WR-94001'), true);
  assert.equal(hasService('VR', 'BVI', 'WR-94001'), false);
  assert.equal(hasService('CCG', 'VR', 'WR-94135'), true);
  assert.equal(hasService('CCG', 'MRU', 'WR-94135'), false);
  assert.equal(hasService('DIC', 'VR', 'WR-94135'), false);
  assert.equal(hasService('PNVL', 'CSMT', 'cr-98242'), true);
  assert.equal(hasService('CSMT', 'PNVL', 'cr-98242'), false);
  assert.deepEqual(acServicesForRoute(route('VR', 'DRD'), '2026-05-01'), []);
});

test('published weekday restrictions and effective dates are respected', () => {
  assert.equal(hasService('CCG', 'BVI', 'WR-94005', '2026-05-01'), true); // Friday
  assert.equal(hasService('CCG', 'BVI', 'WR-94005', '2026-05-02'), false); // Saturday
  assert.equal(hasService('CCG', 'BVI', 'WR-94005', '2026-05-03'), false); // Sunday
  assert.equal(hasService('CCG', 'BVI', 'WR-94005', '2026-04-30'), false);
  assert.equal(hasService('PNVL', 'CSMT', 'cr-98242', '2026-05-02'), true);
  assert.equal(hasService('PNVL', 'CSMT', 'cr-98242', '2026-05-03'), false);
});

test('unknown AC days and historical validity remain explicit metadata', () => {
  const candidate = acServicesForRoute(route('BVI', 'VR'), '2026-11-02')
    .find(service => service.id === 'WR-94001');
  assert.ok(candidate);
  assert.equal(candidate.days, null);
  assert.match(candidate.daysNote, /daily operation not independently asserted/i);
  assert.equal(candidate.currentValidity, 'unverified_after_2026-05-01');
  assert.equal(candidate.effectiveFrom, '2026-05-01');
});

test('compilation preserves every verified Western stop/time and restriction', async () => {
  const source = JSON.parse(await readFile(new URL('../sources/mumbai/western.json', import.meta.url), 'utf8'));
  const compiled = new Map(NETWORK_DATA.acServices.map(service => [service.id, service]));
  const dayNumber = value => ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].indexOf(value.slice(0, 3).toUpperCase());
  for (const original of source.acServices) {
    const service = compiled.get(original.id);
    assert.ok(service, `Missing service ${original.id}`);
    assert.deepEqual(service.stops, original.stops, original.id);
    assert.deepEqual(service.times, original.times, original.id);
    assert.deepEqual(service.days, original.days?.map(dayNumber) || null, original.id);
    assert.equal(service.directional, true, original.id);
    assert.equal(service.sourceId, original.sourceId, original.id);
    assert.equal(service.currentValidity, original.currentValidity, original.id);
  }
  assert.equal(source.acServices.reduce((sum, service) => sum + service.times.length, 0), source.acValidation.printedStopTimeCount);
});

test('changing the journey recalculates dependent fields and removes unsupported AC selection', () => {
  const draft = updateJourney({
    sourceCode: 'CCG', destinationCode: 'BVI', date: '2026-05-01',
    service: 'AC EMU TRAIN', class: 'SECOND', type: 'JOURNEY', adults: 1, children: 0,
    distance: '999 km', via: 'invented', fare: 1,
  });
  assert.equal(draft.source, 'CHURCHGATE');
  assert.equal(draft.destination, 'BORIVALI');
  assert.equal(draft.distance, '33.98 km');
  assert.equal(draft.class, 'FIRST');
  assert.equal(draft.acAvailable, true);
  assert.notEqual(draft.via, 'invented');
  assert.notEqual(draft.fare, 1);

  draft.destinationCode = 'DRD';
  updateJourney(draft);
  assert.equal(draft.destination, 'DAHANU ROAD');
  assert.equal(draft.distance, '123.78 km');
  assert.equal(draft.acAvailable, false);
  assert.equal(draft.service, 'ORDINARY');
  assert.equal(draft.route.nodes.at(-1), 'DRD');
});

test('an unresolved station clears the derived route and monetary total', () => {
  const draft = updateJourney({source: 'UNKNOWN STATION', destinationCode: 'BVI',
    date: '2026-05-01', service: 'ORDINARY', class: 'SECOND', adults: 1, children: 0, fare: 50});
  assert.equal(draft.sourceCode, '');
  assert.deepEqual(draft.availableRoutes, []);
  assert.equal(draft.route, null);
  assert.equal(draft.distance, 'Not verified');
  assert.equal(draft.fare, null);
  assert.equal(draft.fareStatus, 'unavailable');
});


test('documented Central AC patterns continue onto their actual Kalyan branches', () => {
  const titwala = acServicesForRoute(routesBetween('CSMT','TLA')[0], '2026-11-02');
  assert.ok(titwala.some(service => service.id === 'cr-96611-2022'));
  assert.ok(acServicesForRoute(routesBetween('CSMT','ABH')[0], '2026-11-02').some(service => service.id === 'cr-96317-2022'));
  assert.equal(acServicesForRoute(routesBetween('CSMT','KJT')[0], '2026-11-02').length, 0);
  assert.equal(acServicesForRoute(routesBetween('CSMT','TLA')[0], '2020-01-06').length, 0);
  assert.equal(titwala[0].currentCoverageVerified, false);
});
