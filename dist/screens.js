import {icon, escapeHTML as e, money, shortDate} from './components.js';

// The supplementary reference screens are independent of ticket state/routing.
// Replace their artwork through BRAND.homeAssets without editing these views.
const ASSETS = {
  reserved: 'assets/home-reserved.svg',
  unreserved: 'assets/home-unreserved.svg',
  platform: 'assets/home-platform.svg',
  firstTrain: 'assets/home-fact-train.svg',
  chenabBridge: 'assets/home-fact-bridge.svg',
  social: 'assets/home-social.svg',
};

export const HOME_SERVICES = [
  {id:'search', label:'Search Trains', lines:['Search','Trains'], symbol:'route', tone:'pink'},
  {id:'pnr', label:'PNR Status', lines:['PNR','Status'], symbol:'pnr', tone:'green'},
  {id:'coach', label:'Coach Position', lines:['Coach','Position'], symbol:'coach', tone:'blue'},
  {id:'track', label:'Track Your Train', lines:['Track Your','Train'], symbol:'train', tone:'yellow'},
  {id:'food', label:'Order Food', lines:['Order','Food'], symbol:'food', tone:'lavender'},
  {id:'refund', label:'File Refund', lines:['File','Refund'], symbol:'refund', tone:'grey'},
  {id:'madad', label:'Rail Madad', lines:['Rail','Madad'], symbol:'handshake', tone:'coral'},
  {id:'waves', label:'Go To WAVES', lines:['Go To','WAVES'], symbol:'waves', tone:'slate'},
];

function artIcon(name) {
  const paths = {
    home:'<path d="m3 11 9-8 9 8h-3v10h-5v-7h-2v7H6V11Z" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    person:'<circle cx="12" cy="7" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 21v-3c0-5 14-5 14 0v3Z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    menu:'<path d="M3 5h18M3 12h18M3 19h18" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    bookings:'<path d="M4 3h6v7H7a2 2 0 0 0 0 4h3v7H4a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6V5a2 2 0 0 1 2-2Zm10 0h6a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2h-6v-7h3a2 2 0 0 0 0-4h-3Z"/>',
    bell:'<path d="M5 17h14l-2-4V8a5 5 0 0 0-10 0v5Zm5 3c1 1 3 1 4 0" fill="none" stroke="currentColor" stroke-width="1.4"/>',
    language:'<path d="m3 11 3-8 3 8M4 8h4m6 5h7m-5-3v3m-2 0c0 4 3 7 6 8m1-8c0 4-3 7-6 8M3 16v3h3m15-11V5h-3" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    route:'<path d="M6 20a3 3 0 0 1 0-6h11a3 3 0 0 0 0-6h-3" fill="none" stroke="currentColor" stroke-width="3"/><path d="M3 8a3 3 0 1 1 6 0c0 2-3 5-3 5S3 10 3 8Zm11-5a3 3 0 1 1 6 0c0 2-3 5-3 5s-3-3-3-5Z"/><circle cx="6" cy="8" r="1" fill="white"/><circle cx="17" cy="3" r="1" fill="white"/>',
    pnr:'<path d="M3 4h18v5a3 3 0 0 0 0 6v5H3v-5a3 3 0 0 0 0-6Z"/><path d="M8 6v12m3-10h7m-7 4h7m-7 4h7" stroke="white" stroke-width="1.3" fill="none"/>',
    coach:'<path d="M4 3h6l3 5 8 5v6H3Z"/><rect x="6" y="6" width="4" height="3" rx="1" fill="white"/><rect x="6" y="12" width="4" height="3" rx="1" fill="white"/><path d="m13 11 2 1v3h-2m4-2 2 1v2h-2" fill="white"/><path d="M2 21h20" stroke="currentColor" stroke-width="2"/>',
    train:'<path d="M6 2h12c2 0 3 2 3 4v11c0 2-2 3-4 3H7c-2 0-4-1-4-3V6c0-2 1-4 3-4Z"/><rect x="6" y="6" width="12" height="8" rx="1.5" fill="white"/><circle cx="7" cy="17" r="1" fill="white"/><circle cx="17" cy="17" r="1" fill="white"/><path d="m7 20-3 3m13-3 3 3" stroke="currentColor" stroke-width="1.6"/>',
    food:'<path d="M2 13a7 7 0 0 1 14 0Zm0 3h14v2H2Zm0 5h14v2H2ZM17 6h6l-2 17h-3Z"/><path d="M20 1v8" stroke="currentColor" stroke-width="2"/>',
    refund:'<path d="M3 4h18v5a3 3 0 0 0 0 6v5H3v-5a3 3 0 0 0 0-6Z"/><path d="M7 6v12m8-12v5m-3-2 3 3 3-3" stroke="white" stroke-width="1.5" fill="none"/>',
    handshake:'<path d="m2 8 6-5 4 2 4-2 6 6-4 4-7 7-3-1-6-7Z"/><path d="m7 8 4-3 5 4-3 3-3-2-4 4m4-4 6 6M8 13l5 5M6 16l4 4" fill="none" stroke="white" stroke-width="1.2"/>',
    waves:'<path d="m2 8 4 13h4l2-8 2 8h4l4-13-5 7L12 1 8 15Z"/>',
    wallet:'<rect x="2" y="4" width="20" height="17" rx="4"/><path d="M3 7h14m5 5h-7a3 3 0 0 0 0 6h7" fill="none" stroke="white" stroke-width="1.4"/><circle cx="16" cy="15" r="1" fill="white"/>',
    eye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    edit:'<path d="m4 16 12-12 4 4L8 20l-5 1Z"/><path d="m14 6 4 4" stroke="white" stroke-width="1.4"/>',
    password:'<path d="M3 4h8v17H3Zm11-2h3v20h-3Zm6 4h3v12h-3Z"/><circle cx="7" cy="12" r="1" fill="white"/>',
    account:'<rect x="2" y="4" width="19" height="16" rx="4"/><path d="M2 10h19M6 15h4" fill="none" stroke="white" stroke-width="1.5"/><circle cx="18" cy="18" r="5" fill="currentColor" stroke="white" stroke-width="1.3"/><path d="m15.5 18 1.7 1.7 3-3.5" fill="none" stroke="white" stroke-width="1.4"/>',
    receipt:'<path d="M5 2h14v20l-4-3-3 3-3-3-4 3Z"/><path d="M8 7h8M8 11h8" stroke="white" stroke-width="1.4"/>',
    aadhaar:'<rect x="2" y="5" width="17" height="16" rx="4"/><path d="M3 11h15M6 16h4" fill="none" stroke="white" stroke-width="1.5"/><rect x="20" y="1" width="3" height="9" rx="1.5"/>',
    chat:'<path d="M3 3h18v15H8l-5 4Z"/><path d="M7 7h10M7 11h10" stroke="white" stroke-width="1.5"/>',
    headset:'<path d="M4 13V9a8 8 0 0 1 16 0v8c0 3-3 4-6 4" fill="none" stroke="currentColor" stroke-width="2"/><rect x="2" y="11" width="5" height="8" rx="2"/><rect x="17" y="11" width="5" height="8" rx="2"/><circle cx="12" cy="21" r="2"/>',
    starTicket:'<path d="M3 4h18v5a3 3 0 0 0 0 6v5H3v-5a3 3 0 0 0 0-6Z"/><path d="m12 6 2 4 4 .5-3 3 .7 4-3.7-2-3.7 2 .7-4-3-3 4-.5Z" fill="white"/>',
    info:'<circle cx="12" cy="12" r="10"/><path d="M12 10v7" stroke="white" stroke-width="2"/><circle cx="12" cy="7" r="1.3" fill="white"/>',
    like:'<path d="M3 10h4v12H3Zm6 0 5-8c2 0 3 2 2 4l-1 4h6c1 0 2 1 1 3l-2 8H9Z"/>',
    share:'<circle cx="5" cy="12" r="3"/><circle cx="19" cy="4" r="3"/><circle cx="19" cy="20" r="3"/><path d="m7 11 10-6M7 13l10 6" stroke="currentColor" stroke-width="2"/>',
    logout:'<path d="M10 2a10 10 0 1 0 0 20V2Zm6 5 6 5-6 5v-3h-5v-4h5Z"/>',
  };
  return `<svg class="screen-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${paths[name]||paths.info}</svg>`;
}

function personName(profile={}) { return profile.name || 'Atharv Kanase'; }
function avatar(profile={}) {
  return profile.avatar
    ? `<img class="user-avatar" src="${e(profile.avatar)}" alt="Profile photo">`
    : '<span class="user-avatar" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="29" r="9" fill="#b6d5e4"/><ellipse cx="40" cy="48" rx="15" ry="8" fill="#70cfde"/></svg></span>';
}

export function homeHeader(brand={}) {
  const displayName=brand.wordmark||brand.name||'YOUR TRAVELS';
  return `<header class="home-header"><button class="home-header-tool language-tool" data-action="home-language" aria-label="Select language">${artIcon('language')}</button><div class="home-wordmark" aria-label="${e(displayName)}">${e(displayName)}</div><button class="home-header-tool notification-tool" data-action="home-notifications" aria-label="Notifications, 2 unread">${artIcon('bell')}<span class="notification-badge">2</span></button></header>`;
}

export function homeScreen(ticket,brand={},profile={}) {
  const assets={...ASSETS,...brand.homeAssets};
  const hidden=new Set(profile.hiddenServices||[]);
  const upcoming=ticket ? `<article class="home-upcoming-ticket"><div class="home-upcoming-date">${shortDate(ticket.date)}</div><div class="home-upcoming-route"><span>${e(ticket.source)}</span><span>${e(ticket.destination)}</span></div><div class="home-upcoming-actions"><strong>Unreserved</strong><button data-action="home-book-again" data-id="${e(ticket.id)}">Book Again</button><button data-action="home-view-ticket" data-id="${e(ticket.id)}">View Details</button></div></article>` : `<button class="home-empty-journey" data-action="home-journey" data-kind="unreserved">Book a Journey ${icon('chevron',18)}</button>`;
  return `<div class="home-screen"><p class="home-greeting">Hi, ${e(personName(profile))}!</p><section class="home-planner"><h2>Journey Planner</h2><div class="planner-grid">${[['reserved','Reserved'],['unreserved','Unreserved'],['platform','Platform']].map(([id,label])=>`<button class="planner-option" data-action="home-journey" data-kind="${id}"><img src="${e(assets[id])}" alt=""><span>${label}</span></button>`).join('')}</div></section><section class="home-offerings"><h2>More Offerings</h2><div class="offerings-grid">${HOME_SERVICES.filter(item=>!hidden.has(item.id)).map(item=>`<button class="offering-button" data-action="home-service" data-service="${item.id}" aria-label="${item.label}"><span class="offering-art tone-${item.tone}">${artIcon(item.symbol)}</span><span class="offering-label">${item.lines.map(e).join('<br>')}</span></button>`).join('')}</div></section><section class="home-upcoming"><h2>Upcoming Journey</h2>${upcoming}</section><section class="home-facts"><h2>Do You know?</h2><div class="home-fact-carousel" aria-label="Journey facts"><article class="home-fact-card"><img src="${e(assets.firstTrain)}" alt="Historic steam train crossing an arched bridge"><p>First ever passenger train was run between Bori Bandar to Thane on April 16, 1853.</p></article><article class="home-fact-card"><img src="${e(assets.chenabBridge)}" alt="Chenab Railway Bridge above the clouds"><p>Chenab Railway Bridge in Dharot, Jammu &amp; Kashmir is the World’s highest Railway Bridge.</p></article></div></section><section class="home-social"><h2>Follow Us On Social Media Platforms</h2><div class="home-social-art"><img src="${e(assets.social)}" alt="Railway at sunset"><div class="social-hit-areas">${['X','Facebook','Instagram','YouTube'].map(platform=>`<button data-action="home-social" data-platform="${platform}" aria-label="${platform}"></button>`).join('')}</div></div></section></div>`;
}

function wallet(profile={},drawer=false) {
  return `<div class="${drawer?'drawer-wallet':'profile-wallet'}"><span class="wallet-icon">${artIcon('wallet')}</span><div class="wallet-copy"><span>R-Wallet</span><strong>${money(profile.balance??profile.walletBalance??0).replace('₹','₹ ')}</strong></div>${drawer?'':`<button class="wallet-refresh" data-action="profile-wallet-refresh" aria-label="Refresh wallet balance">${icon('refresh',21)}</button>`}<button class="wallet-add" data-action="profile-wallet-add">${drawer?'Add Money':'Add'}</button></div>`;
}

export function profileScreen(profile={}) {
  const complete=Number.isFinite(Number(profile.completion))?Math.min(100,Math.max(0,Number(profile.completion))):50;
  const biometric=profile.biometric!==false;
  const tiles=[
    {id:'password',label:'Change Password',lines:['Change','Password'],symbol:'password',tone:'aqua'},
    {id:'account',label:'My Account',lines:['My','Account'],symbol:'account',tone:'green'},
    {id:'transfer',label:'Transfer Ticket',lines:['Transfer','Ticket'],symbol:'bookings',tone:'aqua'},
    {id:'transactions',label:'My Transaction',lines:['My','Transaction'],symbol:'receipt',tone:'yellow'},
    {id:'aadhaar',label:'Link Your Aadhar',lines:['Link Your','Aadhar'],symbol:'aadhaar',tone:'gold'},
  ];
  const tile=t=>`<button class="profile-tile tone-${t.tone}" data-action="profile-service" data-service="${t.id}">${artIcon(t.symbol)}<span>${t.lines.map(e).join('<br>')}</span></button>`;
  return `<div class="profile-screen"><section class="profile-hero"><button class="profile-back" data-action="profile-back" aria-label="Back to Home">${icon('back',22)}</button>${avatar(profile)}<h1>${e(personName(profile))}</h1><div class="profile-detail-actions"><button data-action="profile-view">${artIcon('eye')}<span>View Details</span></button><span class="profile-action-divider">|</span><button data-action="profile-edit">${artIcon('edit')}<span>Edit Details</span></button></div>${wallet(profile)}</section><section class="profile-completion"><h2>${complete===100?'Profile Complete':'Profile Incomplete'}</h2><div class="profile-progress-row"><div class="profile-progress" role="progressbar" aria-label="Profile completion" aria-valuenow="${complete}" aria-valuemin="0" aria-valuemax="100"><span style="width:${complete}%"></span></div><span>${complete}%</span></div></section><div class="profile-tile-grid">${tile(tiles[0])}${tile(tiles[1])}<button class="profile-tile tone-peach" data-action="profile-biometric" role="switch" aria-checked="${biometric}" aria-label="Biometric"><span class="biometric-toggle ${biometric?'on':''}"><span>${biometric?'On':'Off'}</span><i></i></span><span>Biometric</span></button>${tiles.slice(2).map(tile).join('')}</div></div>`;
}

export function mainNav(selected='home') {
  const buttons=[['home','home','Home'],['bookings','bookings','My Bookings'],['profile','person','You'],['menu','menu','Menu']];
  return `<nav class="main-nav" aria-label="Main navigation">${buttons.map(([id,symbol,label])=>`<button class="${selected===id?'selected':''}" data-action="${id==='menu'?'menu-open':'home-nav'}" data-screen="${id}" ${selected===id?'aria-current="page"':''}>${artIcon(symbol)}<span>${label}</span></button>`).join('')}</nav>`;
}

export function menuDrawer(profile={}) {
  const items=[
    ['services','receipt','Show/Hide Services','menu-services'],
    ['faq','chat','FAQs','menu-service'],
    ['support','headset','Help & Support','menu-service'],
    ['reserved','starTicket','Reserved Services - Counter','menu-service'],
    ['about','info','About','menu-service'],
    ['rate','like','Rate Us','menu-rate'],
    ['share','share','Share','menu-share'],
  ];
  return `<div class="menu-overlay"><button class="menu-shade" data-action="menu-close" aria-label="Close menu"></button><aside class="menu-drawer" role="dialog" aria-modal="true" aria-label="Main menu"><button class="menu-close-button" data-action="menu-close" aria-label="Close menu">${icon('close',18)}</button><div class="drawer-profile">${avatar(profile)}<h2>${e(personName(profile))}</h2></div>${wallet(profile,true)}<div class="drawer-items">${items.map(([id,symbol,label,action])=>`<button data-action="${action}" data-service="${id}">${artIcon(symbol)}<span>${e(label)}</span></button>`).join('')}</div><div class="drawer-bottom"><button class="drawer-logout" data-action="menu-logout">${artIcon('logout')}<span>Log Out</span></button><p>V-2.1.78-1</p></div></aside></div>`;
}
