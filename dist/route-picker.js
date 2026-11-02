import {escapeHTML as e} from './components.js';
import {findStation} from './mumbai-network.js';

export function routeTitle(route) {
  const via = route.nodes.slice(1, -1);
  if (route.hasWalkingTransfer) return 'DADAR CENTRAL–WESTERN';
  if (via.includes('TNA') && via.includes('CLA') && route.lineIds.some(id => id.startsWith('trans-harbour'))) {
    return via.filter(code => code === 'TNA' || code === 'CLA').map(code => code === 'CLA' ? 'KURLA JN.' : 'THANE').join('-');
  }
  if (via.includes('SNCR')) return 'SANPADA';
  if (via.includes('VDLR') && via.includes('MM')) return 'WADALA ROAD-MAHIM JN.';
  if (route.via === 'DIRECT') return 'DIRECT';
  return route.via.split('-').map(code => code === 'CLA' ? 'KURLA JN.' : findStation(code)?.name || code).join('-');
}

// The reference picker displays whole kilometres. Detailed route information
// retains the original engineering distance; this is not a tariff-distance claim.
export const routePickerDistance = route => route.km == null ? 'Distance not verified' : `${Math.ceil(route.km)} km`;

export function routeChoices(routes = []) {
  // Omit a detour that visits every stop of a shorter alternative in the same
  // order and merely adds intermediate stops. Keep distinct corridors.
  const choices = routes.filter(candidate => !routes.some(other => {
    if (candidate === other || candidate.km == null || other.km == null || other.km >= candidate.km) return false;
    let next = 0;
    for (const code of candidate.nodes) if (code === other.nodes[next]) next++;
    return next === other.nodes.length;
  }));
  return choices.sort((a, b) => {
    const main = route => route.lineIds.includes('central-main') ? 0 : 1;
    return main(a) - main(b) || (a.km ?? Infinity) - (b.km ?? Infinity);
  });
}

export function routePickerContent(routes) {
  return `<div class="route-choice-list">${routeChoices(routes).map(route => `<button type="button" class="route-choice-card" data-action="journey-route-select" data-route-id="${e(route.id)}"><span><strong>${e(routeTitle(route))}</strong><small>${e(routePickerDistance(route))}</small></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M3 12h17M13 5l7 7-7 7"/></svg></button>`).join('')}</div>`;
}
