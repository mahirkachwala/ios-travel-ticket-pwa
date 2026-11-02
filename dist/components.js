// Small, independent view components. Each accepts data; state lives in app.js.
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const e = escapeHTML;
export const money = value => `₹${Number(value).toFixed(2)}`;
export const dateLabel = value => new Date(value + 'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
export const shortDate = value => new Date(value + 'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'2-digit'}).replace('Sept','Sep');

export function icon(name, size=20) {
  const paths = {
    back:'<path d="m12 6-6 6 6 6M6 12h12"/>',
    ticket:'<path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z"/><path d="M9 8v8m6-8v8"/>',
    receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 7h6M9 11h6M9 15h6"/>',
    refresh:'<path d="M20 9a8 8 0 1 0 0 6M20 3v6h-6"/>',
    sort:'<path d="M8 4v16m-4-4 4 4 4-4M15 5h2m-2 5h4m-4 5h6"/>',
    route:'<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h8a4 4 0 0 1 0 8H9a4 4 0 0 0-4 4h12"/>',
    via:'<path d="M2 12h5c4 0 5-7 10-7M7 12c4 0 5 7 10 7"/><path d="m15 2 3 3-3 3m0 8 3 3-3 3"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    swap:'<path d="M5 7h14l-4-4M19 17H5l4 4"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
    bus:'<rect x="5" y="3" width="14" height="16" rx="3"/><path d="M5 11h14M8 6h8M8 19v2m8-2v2M8 15h1m6 0h1"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.ticket}</svg>`;
}

export function header(title,subtitle,action='') {
  return `<div class="app-top"><div class="status-bar"><span id="status-time">9:00</span><div class="dynamic-island"></div><span class="status-icons"><svg viewBox="0 0 18 12" width="15" height="11" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx=".6"/><rect x="5" y="6" width="3" height="6" rx=".6"/><rect x="10" y="3" width="3" height="9" rx=".6"/><rect x="15" y="0" width="3" height="12" rx=".6"/></svg> 5G <span class="battery">41</span></span></div><header class="app-header ${subtitle?'has-subtitle':'no-subtitle'}"><button class="back-button" data-action="back" aria-label="Go back">${icon('back',17)}</button><div class="header-titles"><h1>${e(title)}</h1>${subtitle?`<p>${e(subtitle)}</p>`:''}</div>${action}</header></div>`;
}

export function dynamicTicket(ticket,brand,visible) {
  if(!visible) return `<button class="open-preview" data-action="restart">${icon('refresh',16)} Show Dynamic Preview</button>`;
  return `<section class="dynamic-ticket" aria-label="Dynamic ticket preview"><span class="banner-brand brand-left">${e(brand.name)}</span><div class="dynamic-content"><strong>Dynamic preview will close in</strong><div id="countdown" class="countdown" role="timer" aria-label="Dynamic preview time remaining"><span class="timer-minutes" aria-hidden="true">05:</span><span class="timer-seconds" aria-hidden="true"><span class="seconds-still">00</span></span></div><span class="booking-time-label">Ticket Booking Date &amp; Time</span><div class="booking-time">${dateLabel(ticket.date)}, ${e(ticket.time)}</div><span class="reference-number">${e(ticket.reference)}</span><span class="non-transferable">Ticket is Non-Transferable</span></div><span class="banner-brand brand-right">${e(brand.nameLocal)}</span></section>`;
}

function field(label,value,right=false) {return `<div class="ticket-field${right?' align-right':''}"><span>${e(label)}</span><strong>${e(value)}</strong></div>`;}

export function activeTicket(ticket,brand,copy,previewVisible) {
  return `<p class="greeting">${e(copy.greeting)}</p><section class="ticket-paper"><div class="scan-strip"></div>${dynamicTicket(ticket,brand,previewVisible)}<div class="ticket-info"><div class="ticket-identity">${field('Journey Ticket',ticket.id)}<span class="active-badge"><i></i> ACTIVE</span></div><div class="ticket-grid">${field('Source',ticket.source)}${field('Destination',ticket.destination,true)}${field('Distance',ticket.distance)}${field('Passenger',`${ticket.adults} Adult, ${ticket.children} Child`,true)}${field('Ticket Type',ticket.type)}${field('Train Types',ticket.service,true)}${field('Class',ticket.class)}${field('Fare',money(ticket.fare),true)}</div><div class="via-line">${icon('via',14)} Via: ${e(ticket.via)}</div><div class="registration">${e(brand.shortName)}:${e(ticket.registration)}</div><div class="ticket-validity"><span>${e(copy.validity)}</span></div></div><div class="scan-strip bottom-strip"></div></section><p class="ticket-note">${e(copy.note)}</p><div class="connecting-wrap"><button class="connecting-button" data-action="connect">Book Connecting Journey</button></div><section class="qr-section"><button class="qr-button" data-action="qr" aria-label="Enlarge ticket QR code"><img src="${e(brand.qr)}" alt="Demo ticket QR code" width="224" height="224"></button></section><section class="facts"><h2>Do you know?</h2>${copy.facts.map(x=>`<p>${e(x)}</p>`).join('')}</section>${feedback(copy)}`;
}

export function feedback(copy) {
  return `<section class="feedback" id="feedback"><h2>${e(copy.feedbackTitle)}</h2><form id="feedback-form"><label class="rating-label" id="rating-label">Your Rating</label><div class="stars" role="radiogroup" aria-labelledby="rating-label">${[1,2,3,4,5].map(n=>`<button type="button" class="star" data-rating="${n}" role="radio" aria-checked="false" aria-label="${n} star${n===1?'':'s'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6 1-4.8 4.6 1.2 6.6-5.9-3.1-5.9 3.1 1.2-6.6L2.5 9.5l6.6-1Z"/></svg></button>`).join('')}</div><div class="description-wrap"><textarea name="description" maxlength="200" rows="4" placeholder="Description" aria-label="Feedback description"></textarea><span id="character-count">0/200</span></div><button type="submit" class="submit-feedback" disabled>Submit</button><p class="feedback-success" hidden>Thank you for your feedback!</p></form></section>`;
}

export function bookingCard(ticket) {
  return `<article class="history-ticket"><div class="history-inner"><div class="history-top"><span class="unreserved">Unreserved</span><span>UTS: ${e(ticket.id)}</span></div><div class="history-row"><div><span class="tiny-label">Ticket Type</span><strong>${e(ticket.type)}</strong></div><div class="align-right"><span class="tiny-label">Booking Date</span><strong>${shortDate(ticket.date)}</strong></div></div><div class="history-route"><span>${e(ticket.source)}</span><span class="route-distance">— ${e(ticket.distance)} —</span><span>${e(ticket.destination)}</span></div></div><div class="history-actions"><button data-action="book-again" data-id="${e(ticket.id)}">Book Again</button><span></span><button data-action="view-ticket" data-id="${e(ticket.id)}">View Details</button></div></article>`;
}

export function bookings(tickets,tab) {
  const label=tab[0].toUpperCase()+tab.slice(1);
  return `<div class="bookings-summary ${e(tab)}"><span>${label} (${tickets.length})</span><button data-action="refresh" aria-label="Refresh bookings">${icon('refresh',14)}</button></div>${tickets.length?`<div class="booking-list ${e(tab)}">${tickets.map(bookingCard).join('')}</div>`:`<div class="empty-state">${icon('ticket',58)}<p>No Tickets Found. Swipe down to refresh.</p></div>`}`;
}

export function tabBar(tab) {
  return `<nav class="bottom-nav" aria-label="Booking status">${['upcoming','completed','cancelled','all'].map(t=>`<button class="${t===tab?'selected':''} ${t}" data-action="tab" data-tab="${t}" ${t===tab?'aria-current="page"':''}>${icon('ticket',20)}<span>${t[0].toUpperCase()+t.slice(1)}</span></button>`).join('')}</nav>`;
}

export function expiredTicket(ticket) {
  return `<div class="expired-ticket"><div class="expired-summary"><div class="expired-row"><span>${e(ticket.type)}</span><span>${e(ticket.id)}</span></div><div class="expired-row route-row"><span>${e(ticket.source)}</span><span>${e(ticket.destination)}</span></div><div class="expired-row"><span>Via<br>${e(ticket.via)}</span><span>Booked on<br>${e(ticket.bookedAt)}</span></div></div><div class="expired-info"><p class="expired-status">Ticket Expired</p><p>Passenger(s) : ${ticket.adults} Adult , ${ticket.children} Child</p><p>${e(ticket.class)} | ${e(ticket.service)} | ${e(ticket.type)} | ${money(ticket.fare)}</p></div></div>`;
}

export function bookingForm(ticket,title='Book a Journey') {
  return `<section class="journey-form"><h2>${e(title)}</h2><p class="form-intro">Choose your journey details</p><form id="journey-form"><label>Source<input name="source" required maxlength="35" value="${e(ticket.source)}" autocomplete="off"></label><button class="swap-button" type="button" data-action="swap" aria-label="Swap source and destination">${icon('swap')}</button><label>Destination<input name="destination" required maxlength="35" value="${e(ticket.destination)}" autocomplete="off"></label><div class="form-grid"><label>Class<select name="class">${['SECOND','FIRST','AC','SLEEPER','AC SLEEPER'].map(x=>`<option${x===ticket.class?' selected':''}>${x}</option>`).join('')}</select></label><label>Train Types<select name="service">${['ORDINARY','EXPRESS','SUPERFAST','AC BUS','NON AC BUS'].map(x=>`<option${x===ticket.service?' selected':''}>${x}</option>`).join('')}</select></label><label>Adult<input name="adults" type="number" min="1" max="6" value="${ticket.adults}" required></label><label>Child<input name="children" type="number" min="0" max="6" value="${ticket.children}" required></label><label>Journey date<input name="date" type="date" value="${e(ticket.date)}" required></label><label>Time<input name="time" type="time" value="${e(ticket.time)}" required></label><label>Fare (₹)<input name="fare" type="number" step=".01" min="0" max="100000" value="${ticket.fare}" required></label><label>Distance<input name="distance" maxlength="16" value="${e(ticket.distance)}" required></label></div><label>Via<input name="via" maxlength="45" value="${e(ticket.via)}" required></label><p id="form-error" class="form-error" role="alert"></p><button class="primary-button" type="submit">Preview Ticket ${icon('chevron',17)}</button><p class="demo-helper">Demo preview · No payment or reservation</p></form></section>`;
}
