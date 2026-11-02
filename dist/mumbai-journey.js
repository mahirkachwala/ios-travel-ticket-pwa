import {findStation, routesBetween, acServicesForRoute} from './mumbai-network.js';
import {quoteFare} from './mumbai-fares.js';

// All route-dependent fields are recalculated together. They cannot be edited
// independently into a station pair, distance, class and fare that disagree.
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
  draft.distance = route?.distanceLabel || 'Not verified';
  draft.via = route?.via || '—';
  draft.acServices = acServicesForRoute(route, draft.date);
  draft.acAvailable = draft.acServices.length > 0;
  if (!draft.acAvailable && draft.service === 'AC EMU TRAIN') draft.service = 'ORDINARY';
  if (!['ORDINARY', 'AC EMU TRAIN'].includes(draft.service)) draft.service = 'ORDINARY';
  if (draft.service === 'AC EMU TRAIN') draft.class = 'FIRST';
  else if (!['SECOND', 'FIRST'].includes(draft.class)) draft.class = 'SECOND';
  draft.fareQuote = quoteFare({...draft, route});
  draft.fare = draft.fareQuote.amount;
  draft.fareStatus = draft.fareQuote.status;
  return draft;
}
