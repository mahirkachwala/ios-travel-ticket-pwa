import {escapeHTML as e, icon, header} from './components.js';

import {routeTitle, routePickerDistance} from './route-picker.js';
import {STATIONS, findStation} from './mumbai-network.js';
export {STATIONS};

const RECENT_ROUTES = [
  {source:'VASHI',sourceCode:'VSH',destination:'GHANSOLI',destinationCode:'GNSL'},
  {source:'BELAPUR C.B.D',sourceCode:'BEPR',destination:'VASHI',destinationCode:'VSH'},
];

function journeyIcon(name) {
  const paths={
    train:'<path d="M2 5h8c5 0 8 3 12 9-2 3-7 4-11 4H2Z"/><path d="M5 8h4v6H5Zm7 0 4 6h4M2 21h20M5 18v3m7-3v3"/>',
    search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/>',
    mic:'<rect x="8" y="2" width="8" height="14" rx="4" fill="currentColor" stroke="none"/><path d="M5 11v2a7 7 0 0 0 14 0v-2M12 20v3"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v7m0-10v.2"/>',
    clock:'<circle cx="12" cy="12" r="10"/><path d="M12 4v8l-5 5"/>',
    northEast:'<path d="M6 18 19 5M7 5h12v12"/>',
    swap:'<path d="M7 3v17m-4-13 4-4 4 4M17 21V4m-4 13 4 4 4-4"/>',
    link:'<path d="m8 16-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m6-1 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0M8 15l8-8" transform="translate(1 1) scale(.9)"/>',
    ticket:'<path d="M2 4h20v5a3 3 0 0 0 0 6v5H2v-5a3 3 0 0 0 0-6Z" fill="currentColor" stroke="none"/><path d="M7 6v12m3-10h9m-9 4h9m-9 4h9" stroke="white" stroke-width="1.2"/>',
    calendar:'<rect x="3" y="5" width="18" height="17" rx="3"/><path d="M7 2v6m10-6v6M3 11h18m-13 5h2m4 0h2"/>',
  };
  return `<svg class="journey-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.train}</svg>`;
}

export function stationCode(name, explicit='') {
  return findStation(explicit || name)?.code || '';
}

export function journeyHeader(mode='entry') {
  const titles={entry:'Unreserved E-Ticket',search:'Search Station',options:'Unreserved Journey'};
  const title=titles[mode]||titles.entry;
  const status=header('','').split('<header')[0];
  const close=`<button class="journey-header-close" data-action="${mode==='search'?'journey-back':'journey-close'}" aria-label="${mode==='search'?'Back to journey':'Close journey booking'}">${icon('close',23)}</button>`;
  const bar=mode==='options'
    ? `<header class="journey-header journey-options-header"><button class="journey-header-back" data-action="journey-back" aria-label="Back to route selection">${icon('back',23)}</button><div><h1>${title}</h1><p>E-Ticket</p></div></header>`
    : `<header class="journey-header journey-${mode}-header">${mode==='search'?close:''}<h1>${title}</h1>${mode==='entry'?close:''}</header>`;
  return status.replace('class="app-top"',`class="app-top journey-top journey-${mode}-top"`)+bar+'</div>';
}

function optionButton(field,value,label,selected,extra='') {
  return `<button type="button" class="journey-pill ${selected?'selected':''}" data-action="journey-choice" data-field="${e(field)}" data-value="${e(value)}" aria-pressed="${selected}" ${extra}>${e(label)}</button>`;
}

export function journeyEntry(draft={}) {
  const mode=draft.passMode||'normal';
  const location=draft.stationMode||'outside';
  const recent=Array.isArray(draft.recentRoutes)&&draft.recentRoutes.length?draft.recentRoutes:RECENT_ROUTES;
  const station=(field,label)=>`<div class="journey-station-field"><span class="journey-station-caption">${label}</span><button type="button" class="journey-station-select ${draft[field]?'has-value':''}" data-action="journey-station" data-field="${field}" aria-label="Select ${field}">${journeyIcon('train')}<span>${e(draft[field]?`${stationCode(draft[field],draft[field+'Code'])} - ${draft[field]}`:(field==='source'?'Source':'Destination'))}</span></button></div>`;
  return `<div class="journey-entry"><section class="journey-entry-card" aria-label="Unreserved ticket route"><div class="journey-pass-tabs" aria-label="Pass type">${[['normal','Normal'],['season','Season']].map(([value,label])=>`<button type="button" class="${mode===value?'selected':''}" data-action="journey-mode" data-field="passMode" data-value="${value}" aria-pressed="${mode===value}">${label}</button>`).join('')}</div><div class="journey-location-tabs" aria-label="Booking location">${[['outside','Outside Station'],['station','At Station']].map(([value,label])=>`<button type="button" class="${location===value?'selected':''}" data-action="journey-mode" data-field="stationMode" data-value="${value}" aria-pressed="${location===value}"><span>${label}</span>${journeyIcon('info')}</button>`).join('')}</div><div class="journey-route-fields">${station('source','From')}<div class="journey-route-rule"></div><button type="button" class="journey-swap" data-action="journey-swap" aria-label="Swap source and destination">${journeyIcon('swap')}</button>${station('destination','To')}</div><p class="journey-error" id="journey-error" role="alert">${e(draft.error||'')}</p><button type="button" class="journey-main-button" data-action="journey-proceed">Proceed To Book</button><button type="button" class="journey-outline-button" data-action="journey-upcoming">Check Upcoming Trains</button></section><section class="journey-recent"><h2>Recent Searches</h2><div class="journey-recent-routes">${recent.map(route=>`<button type="button" data-action="journey-recent" data-source="${e(route.source)}" data-source-code="${e(stationCode(route.source,route.sourceCode))}" data-destination="${e(route.destination)}" data-destination-code="${e(stationCode(route.destination,route.destinationCode))}"><span>${e(route.source)}${stationCode(route.source,route.sourceCode)?`, ${e(stationCode(route.source,route.sourceCode))}`:''}</span>${journeyIcon('link')}<span>${e(route.destination)}${stationCode(route.destination,route.destinationCode)?`, ${e(stationCode(route.destination,route.destinationCode))}`:''}</span></button>`).join('')}</div></section></div>`;
}

export function stationResults(field='source',query='') {
  const safeField=field==='destination'?'destination':'source';
  const term=String(query).trim().toUpperCase().replace(/[.\s_-]+/g,' ');
  const found=STATIONS.filter(station=>`${station.name} ${station.code} ${(station.aliases||[]).join(' ')}`.toUpperCase().replace(/[.\s_-]+/g,' ').includes(term));
  const stations=term?found:STATIONS;
  return stations.length?stations.map(station=>`<button type="button" class="station-result" data-action="journey-select-station" data-field="${safeField}" data-name="${e(station.name)}" data-code="${e(station.code)}"><span><strong>${e(station.name)} - ${e(station.code)}</strong><small>${e(station.region||'MUMBAI SUBURBAN')}</small></span>${journeyIcon('northEast')}</button>`).join(''):'<p class="network-note">No Mumbai local station found. Search by station name or code.</p>';
}

export function stationSearch(draft={},field='source',query='') {
  const safeField=field==='destination'?'destination':'source';
  return `<div class="station-search"><h2>${safeField==='source'?'Source':'Destination'}</h2><div class="station-search-input">${journeyIcon('search')}<input id="station-query" name="station-query" type="search" inputmode="search" autocomplete="off" autocapitalize="characters" maxlength="45" placeholder="Select Station" aria-label="Search ${safeField} station" value="${e(query)}"><button type="button" data-action="journey-voice" aria-label="Voice station search">${journeyIcon('mic')}</button></div><h3>${journeyIcon('clock')}<span id="station-results-label">${String(query).trim()?'Search Results':'Mumbai Local Stations'}</span></h3><div class="station-results" id="station-results" aria-live="polite">${stationResults(safeField,query)}</div></div>`;
}

function countStepper(field,label,count,min,max) {
  const value=Number.isFinite(Number(count))?Number(count):min;
  return `<div class="journey-stepper"><span>${label}</span><div><button type="button" data-action="journey-step" data-field="${field}" data-delta="-1" aria-label="Remove one ${label.toLowerCase()}" ${value<=min?'disabled':''}>−</button><output aria-label="${label} count">${value}</output><button type="button" data-action="journey-step" data-field="${field}" data-delta="1" aria-label="Add one ${label.toLowerCase()}" ${value>=max?'disabled':''}>+</button></div></div>`;
}

export function journeyOptions(draft={}) {
  const service=draft.service||'ORDINARY';
  const isAC=service==='AC EMU TRAIN';
  const ticketType=draft.type||'JOURNEY';
  const ticketClass=isAC?'FIRST':draft.class||'SECOND';
  const fareLabel=draft.fare===null||draft.fare===undefined?'Check fare':`₹ ${Number(draft.fare).toFixed(0)}*`;
  const route=draft.route;
  const routePicker=route?`<div class="network-route"><span class="network-route-label">Via route</span><button type="button" class="selected-route-button" data-action="journey-route-picker" aria-label="Change route"><span><strong>${e(routeTitle(route))}</strong><small>${e(routePickerDistance(route))}</small></span>${icon('chevron',20)}</button><button type="button" class="route-source-button" data-action="journey-route-info">Route &amp; data sources</button></div>`:'';
  const dateSummary=draft.date?new Date(draft.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'Select date';
  return `<div class="journey-options"><div class="journey-route-summary"><div><strong>${e(draft.source||'Source')}</strong><span>${e(stationCode(draft.source,draft.sourceCode))}</span></div><span class="journey-route-arrow" aria-hidden="true">→</span><div><strong>${e(draft.destination||'Destination')}</strong><span>${e(stationCode(draft.destination,draft.destinationCode))}</span></div></div><section class="journey-options-body" aria-label="Journey options">${routePicker}<fieldset class="journey-option-group"><legend>Train Type</legend><div class="journey-choice-row train-choices">${optionButton('service','ORDINARY','ORDINARY',!isAC)}${optionButton('service','AC EMU TRAIN','AC EMU TRAIN',isAC,draft.acAvailable?'':'disabled aria-describedby="ac-availability"')}</div><p class="network-note" id="ac-availability">${draft.acAvailable?'Published AC stopping pattern found. Check the current timetable and operating days.':'No direct AC pattern verified for this route in the available timetable snapshot.'}</p></fieldset><fieldset class="journey-option-group ticket-type-group"><legend>Ticket Type</legend><div class="journey-choice-row ticket-choices">${optionButton('type','JOURNEY','JOURNEY',ticketType==='JOURNEY')}${optionButton('type','RETURN','RETURN',ticketType==='RETURN')}</div></fieldset><div class="journey-passengers">${countStepper('adults','Adult',draft.adults??1,1,6)}${countStepper('children','Child',draft.children??0,0,6)}<p>Aged between 5 and 12 years on the day of Travel</p></div><fieldset class="journey-option-group class-group"><legend>Class</legend><div class="journey-choice-row class-choices">${isAC?'':optionButton('class','SECOND','SECOND',ticketClass==='SECOND')}${optionButton('class','FIRST','FIRST',ticketClass==='FIRST')}</div></fieldset><label class="journey-concession"><input type="checkbox" data-action="journey-concession" name="concession" ${draft.concession?'checked':''}><span>Avail Concession</span></label><details class="journey-schedule" ${draft.scheduleOpen?'open':''}><summary>${journeyIcon('calendar')}<span>Travel details<small>${e(dateSummary)}${draft.time?` · ${e(draft.time)}`:''}</small></span>${icon('chevron',16)}</summary><div class="journey-schedule-fields"><label>Journey date<input type="date" name="date" data-journey-field="date" value="${e(draft.date||'')}" required></label><label>Time<input type="time" name="time" data-journey-field="time" value="${e(draft.time||'')}" required></label><label>Route distance<output>${e(draft.distance||'Not verified')}</output></label><label>Via<output>${e(draft.via||'—')}</output></label></div></details><p class="journey-error" id="journey-error" role="alert">${e(draft.error||'')}</p></section><div class="journey-fare"><span class="journey-fare-icon">${journeyIcon('ticket')}</span><strong>Fare</strong><div><b id="journey-fare-value">${e(fareLabel)}</b><button type="button" data-action="journey-fare">Fare Breakup</button><small>${draft.fare===null?'Final fare not verified':'*Estimated fare'}</small></div></div><div class="journey-booking-footer"><p>By proceeding further you agree to our <button type="button" data-action="journey-terms">Terms &amp; Conditions</button></p><button type="button" class="journey-main-button" data-action="journey-book">Book Now</button></div></div>`;
}
