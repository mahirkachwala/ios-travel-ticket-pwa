import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteFare} from '../dist/mumbai-fares.js';
import {routesBetween} from '../dist/mumbai-network.js';
import {updateJourney} from '../dist/mumbai-journey.js';

// Isolated distance fixtures exercise tariff boundaries without conflating
// them with physical station chainage. They must remain labelled estimates.
const routeAt = km => ({km, nodes: ['CCG', 'BVI'], lineIds: ['western'], sourceIds: []});
const quoteAt = (km, options = {}) => quoteFare({route: routeAt(km), date: '2026-11-02', ...options});
const part = (quote, label) => quote.breakdown.find(item => item.label === label)?.amount;
const totalParts = quote => Math.round(quote.breakdown.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
const journey = (overrides = {}) => ({
  sourceCode: 'CCG', destinationCode: 'BVI', date: '2026-11-02',
  service: 'ORDINARY', class: 'SECOND', type: 'JOURNEY', adults: 1, children: 0,
  ...overrides,
});

test('Second fare changes at the correct rounded-up distance boundaries', () => {
  for (const [km, expected] of [
    [0.01, 5], [10, 5], [10.01, 10], [30, 10], [30.01, 15],
    [55, 15], [55.01, 20], [95, 25], [95.01, 30],
    [120, 30], [120.01, 35], [150, 35],
  ]) {
    const result = quoteAt(km);
    assert.equal(result.amount, expected, `${km} km`);
    assert.equal(result.estimateKm, Math.ceil(km));
    assert.equal(result.status, 'estimate');
    assert.equal(result.distanceBasis, 'operational_chainage_estimate');
    assert.match(result.notes.join(' '), /chargeable tariff distance may differ/i);
    assert.equal(totalParts(result), expected);
  }
  assert.equal(quoteAt(150.01).amount, null);
});

test('Second rounds totals ending in 1 or 6 downward after MUTP, with no GST', () => {
  const endingOne = quoteAt(25); // Basic8 + MUTP3 =11 ->10.
  const endingSix = quoteAt(55); // Basic13 + MUTP3 =16 ->15.
  assert.equal(endingOne.amount, 10);
  assert.equal(endingSix.amount, 15);
  for (const result of [endingOne, endingSix]) {
    assert.equal(part(result, 'MUTP surcharge'), 3);
    assert.equal(part(result, 'Fare rounding'), -1);
    assert.ok(!result.breakdown.some(item => item.label.startsWith('GST')));
  }
  assert.equal(part(quoteAt(11), 'Fare rounding'), 2); // Basic5 +3 =8 ->10.
});

test('First and AC minimums include GST before upward rounding', () => {
  const first = quoteAt(8, {class: 'FIRST'});
  const ac = quoteAt(8, {service: 'AC EMU TRAIN', class: 'FIRST'});
  assert.equal(first.amount, 25); //23 +1.15 ->25.
  assert.equal(ac.amount, 35); //29 +1.45 ->35.
  assert.equal(part(first, 'GST (5%)'), 1.15);
  assert.equal(part(ac, 'GST (5%)'), 1.45);
  assert.equal(part(first, 'MUTP surcharge'), 0);
  assert.equal(part(ac, 'MUTP surcharge'), 0);
  assert.equal(totalParts(first), first.amount);
  assert.equal(totalParts(ac), ac.amount);
});

test('First and AC GST includes MUTP and AC is selected by service', () => {
  const first = quoteAt(25, {class: 'FIRST'});
  const ac = quoteAt(25, {service: 'AC EMU TRAIN', class: 'FIRST'});
  assert.equal(first.amount, 60); // (50 +6) *1.05 =58.8 ->60.
  assert.equal(ac.amount, 70); // (56 +6) *1.05 =65.1 ->70.
  assert.equal(part(first, 'GST (5%)'), 2.8);
  assert.equal(part(ac, 'GST (5%)'), 3.1);
  assert.equal(part(first, 'MUTP surcharge'), 6);
  assert.equal(part(ac, 'MUTP surcharge'), 6);
  assert.equal(totalParts(first), first.amount);
  assert.equal(totalParts(ac), ac.amount);
});

test('groups and returns multiply rounded single fares per passenger and direction', () => {
  const group = quoteAt(53, {class: 'FIRST', adults: 3});
  // Each adult is100; rounding the aggregate raw fare would incorrectly give290.
  assert.equal(group.adultSingleUnit, 100);
  assert.equal(group.amount, 300);
  assert.equal(totalParts(group), 300);
  const returning = quoteAt(25, {service: 'AC EMU TRAIN', class: 'FIRST', adults: 2, type: 'RETURN'});
  assert.equal(returning.adultSingleUnit, 70);
  assert.equal(returning.adultUnit, 140);
  assert.equal(returning.amount, 280);
  assert.equal(totalParts(returning), 280);
  assert.match(returning.notes.join(' '), /two single journeys/i);
});

test('CIDCO-risk routes withhold the payable amount and identify the excluded charge', () => {
  const route = routesBetween('BEPR', 'TKNG')[0];
  assert.ok(route);
  const result = quoteFare({route, adults: 2, type: 'RETURN'});
  assert.equal(result.amount, null);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.excludesCidco, true);
  assert.equal(result.indicativeBase, 40);
  assert.match(result.notes.join(' '), /indicative amount excludes/i);
  assert.ok(result.sourceIds.includes('cr_cidco'));
  for (const changed of [
    {...routeAt(20), requiresCidcoCheck: true},
    {...routeAt(20), nodes: ['AIRL', 'GNSL']},
    {...routeAt(20), lineIds: ['port-uran']},
  ]) assert.equal(quoteFare({route: changed}).amount, null);
});

test('Western PL and KILE station codes are not mistaken for CIDCO stations', () => {
  const route = routesBetween('PL', 'KILE')[0];
  assert.ok(route);
  assert.deepEqual(route.lineIds, ['western']);
  const result = quoteFare({route});
  assert.equal(result.status, 'estimate');
  assert.equal(result.amount, 10);
  assert.equal(result.excludesCidco, false);
  assert.equal(result.indicativeBase, undefined);
});

test('missing or invalid kilometres cannot silently become a minimum fare', () => {
  for (const km of [null, undefined, NaN, Infinity, 0, -1, '8 km', '8']) {
    const result = quoteFare({route: routeAt(km)});
    assert.equal(result.amount, null, String(km));
    assert.equal(result.status, 'unavailable');
  }
  assert.equal(quoteFare().amount, null);
  assert.equal(quoteAt(8, {route: {...routeAt(8), hasWalkingTransfer: true}}).amount, null);
});

test('unverified child or concession handling cannot produce a monetary quote', () => {
  for (const options of [{children: 1}, {children: 2, service: 'AC EMU TRAIN', class: 'FIRST'}, {concession: true}, {concession: 'STUDENT'}]) {
    const result = quoteAt(25, options);
    assert.equal(result.amount, null);
    assert.equal(result.status, 'unavailable');
    assert.equal(result.indicativeBase, undefined);
  }
  assert.ok(quoteAt(25, {children: 1}).sourceIds.includes('pib_child'));
  assert.ok(quoteAt(25, {concession: true}).sourceIds.includes('pib_2026_concessions'));
  assert.equal(quoteAt(25, {concession: false}).amount, 10);
});

test('invalid dates, passenger counts and unsupported service/class cannot keep a total', () => {
  for (const options of [
    {date: '2026-02-30'}, {date: '2025-06-30'}, {adults: 0}, {adults: 1.5},
    {children: -1}, {service: 'MAIL EXPRESS'}, {class: 'SLEEPER'},
    {service: 'AC EMU TRAIN', class: 'SECOND'}, {type: 'SEASON'},
  ]) assert.equal(quoteAt(25, options).amount, null, JSON.stringify(options));
  const future = quoteAt(25, {date: '2026-11-03'});
  assert.equal(future.status, 'estimate');
  assert.match(future.notes.join(' '), /may change before travel/i);
});

test('updateJourney recalculates edited route, distance, via, class and group fare', () => {
  const draft = updateJourney(journey({distance: '999 km', via: 'INVENTED', fare: 999}));
  assert.equal(draft.distance, '33.98 km');
  assert.equal(draft.fare, 15);
  assert.notEqual(draft.via, 'INVENTED');
  const previousRoute = draft.routeId;
  draft.destinationCode = 'MEL';
  draft.class = 'FIRST';
  draft.adults = 2;
  draft.type = 'RETURN';
  draft.fare = 1;
  updateJourney(draft);
  assert.notEqual(draft.routeId, previousRoute);
  assert.deepEqual(draft.route.nodes, ['CCG', 'MEL']);
  assert.equal(draft.destination, 'MARINE LINES');
  assert.equal(draft.distance, '1.3 km');
  assert.equal(draft.class, 'FIRST');
  assert.equal(draft.fare, 100);
  assert.equal(draft.fareStatus, 'estimate');
});

test('updateJourney date changes invalidate stale AC service and reprice the normalized class', () => {
  const draft = updateJourney(journey({service: 'AC EMU TRAIN', class: 'SECOND'}));
  assert.equal(draft.class, 'FIRST');
  assert.equal(draft.acAvailable, true);
  assert.equal(draft.fare, 95);
  draft.date = '2026-04-30'; // Before the loaded Western AC timetable takes effect.
  updateJourney(draft);
  assert.equal(draft.acAvailable, false);
  assert.deepEqual(draft.acServices, []);
  assert.equal(draft.service, 'ORDINARY');
  assert.equal(draft.class, 'FIRST');
  assert.equal(draft.fare, 85);
  draft.class = 'SLEEPER';
  updateJourney(draft);
  assert.equal(draft.class, 'SECOND');
  assert.equal(draft.fare, 15);
});

test('updateJourney route changes cannot retain an AC quote or invent custom-station pricing', () => {
  const draft = updateJourney(journey({service: 'AC EMU TRAIN'}));
  draft.sourceCode = 'VSH';
  draft.destinationCode = 'GNSL';
  updateJourney(draft);
  assert.equal(draft.acAvailable, false);
  assert.equal(draft.service, 'ORDINARY');
  assert.equal(draft.fare, null);
  assert.equal(draft.fareStatus, 'unavailable');
  draft.sourceCode = '';
  draft.source = 'UNSUPPORTED CUSTOM STOP';
  draft.fare = 12;
  updateJourney(draft);
  assert.equal(draft.sourceCode, '');
  assert.equal(draft.routeId, '');
  assert.equal(draft.route, null);
  assert.deepEqual(draft.availableRoutes, []);
  assert.deepEqual(draft.acServices, []);
  assert.equal(draft.distance, 'Not verified');
  assert.equal(draft.via, '—');
  assert.equal(draft.fare, null);
  assert.equal(draft.fareStatus, 'unavailable');
});
