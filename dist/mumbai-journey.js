import {findStation, routesBetween, acServicesForRoute} from './mumbai-network.js';
import {quoteFare} from './mumbai-fares.js';

const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

// Manual preview values belong to a particular route and fare selection. A new
// route resets them; passenger, class, service or date changes reset only fare.
export function updateJourney(draft) {
  for (const field of ['source', 'destination']) {
    const station = findStation(draft[field + 'Code'] || draft[field]);
    if (station) {
      draft[field] = station.name;
      draft[field + 'Code'] = station.code;
    } else draft[field + 'Code'] = '';
  }
  draft.availableRoutes = routesBetween(draft.sourceCode, draft.destinationCode);
  const route = draft.availableRoutes.find(item => item.id === draft.routeId) || draft.availableRoutes[0];
  draft.routeId = route?.id || '';
  draft.route = route || null;
  const routeKey = `${draft.sourceCode}|${draft.destinationCode}|${draft.routeId}`;
  const overrides = draft.manualValues?.routeKey === routeKey ? {...draft.manualValues} : {routeKey};
  draft.distance = owns(overrides, 'distance') ? overrides.distance : route?.distanceLabel || 'Not verified';
  draft.via = owns(overrides, 'via') ? overrides.via : route?.via || '—';
  draft.acServices = acServicesForRoute(route, draft.date);
  draft.acAvailable = draft.acServices.length > 0;
  if (!draft.acAvailable && draft.service === 'AC EMU TRAIN') draft.service = 'ORDINARY';
  if (!['ORDINARY', 'AC EMU TRAIN'].includes(draft.service)) draft.service = 'ORDINARY';
  if (draft.service === 'AC EMU TRAIN') draft.class = 'FIRST';
  else if (!['SECOND', 'FIRST'].includes(draft.class)) draft.class = 'SECOND';
  draft.fareQuote = quoteFare({...draft, route});
  draft.fare = draft.fareQuote.amount;
  draft.fareStatus = draft.fareQuote.status;
  const fareKey = JSON.stringify([routeKey, draft.date, draft.service, draft.class, draft.type, Number(draft.adults), Number(draft.children), Boolean(draft.concession), draft.distance, draft.via]);
  if (overrides.fareKey !== fareKey) delete overrides.fare;
  overrides.fareKey = fareKey;
  if (owns(overrides, 'fare')) {
    const amount = Number(overrides.fare);
    draft.fare = overrides.fare !== '' && Number.isFinite(amount) && amount >= 0 ? amount : null;
    draft.fareStatus = 'manual';
  }
  draft.manualValues = overrides;
  return draft;
}

export function setJourneyField(draft, field, value) {
  if (['date', 'time'].includes(field)) draft[field] = value;
  else if (['via', 'distance', 'fare'].includes(field)) {
    updateJourney(draft);
    draft.manualValues[field] = String(value);
  } else return draft;
  return updateJourney(draft);
}
