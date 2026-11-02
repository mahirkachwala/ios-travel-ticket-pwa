import {BRAND,COPY,INITIAL_TICKET,HISTORY,PREVIEW_SECONDS} from './config.js';
import {escapeHTML as e,icon,header,activeTicket,bookings,tabBar,expiredTicket,money} from './components.js';
import {updateTimer} from './timer.js';
import {homeHeader,homeScreen,profileScreen,mainNav,menuDrawer,HOME_SERVICES} from './screens.js';
import {journeyEntry,stationSearch,stationResults,journeyOptions,journeyHeader,STATIONS} from './journey.js';

const app=document.querySelector('#app');
const studio=document.querySelector('#studio');
const readStored=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const store=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{/* The app also works with browser storage disabled. */}};
const state={screen:'home',tab:'completed',ticket:{...INITIAL_TICKET,...readStored('travel-ticket',{})},selected:HISTORY[0],brand:{...BRAND,...readStored('travel-brand',{})},previewEnd:0,previewVisible:true,rating:0,description:'',submitted:false,reverse:false,journeyMode:'new',installPrompt:null};
state.profile={name:'Atharv Kanase',mobile:COPY.mobile,balance:0,completion:50,biometric:true,hiddenServices:[],...readStored('travel-profile',{})};
let previousScreen='home';
let toastTimeout;
const SCREENS=['home','profile','journey','station','journey-options','active','bookings','expired'];
function beginJourney(seed=state.ticket,mode='new'){state.formTicket={...seed};state.journeyMode=mode;navigate('journey');}
function returnToJourney(){navigate('journey',{push:false});history.replaceState({screen:'journey',tab:state.tab},'','#journey');}
function draft(){
  if(!state.formTicket)state.formTicket={...state.ticket,passMode:'normal',stationMode:'outside',concession:false};
  for(const field of ['source','destination'])state.formTicket[field+'Code']=STATIONS.find(s=>s.name===state.formTicket[field])?.code||state.formTicket[field+'Code']||'';
  return state.formTicket;
}
function reprice(){
  const d=draft();const names=[d.source,d.destination].sort().join('|');
  const base=names==='GHANSOLI|VASHI'?5:15;
  const unit=d.service==='AC EMU TRAIN'?70:d.class==='FIRST'?50:base;
  d.fare=unit*(Number(d.adults)+Number(d.children)*.5)*(d.type==='RETURN'?2:1);
}
function refreshJourney(){const scroll=app.querySelector('#app-scroll')?.scrollTop||0;render();app.querySelector('#app-scroll').scrollTop=scroll;}
function completeJourney(){
  const values={...draft()};
  if(!values.source?.trim()||!values.destination?.trim()||values.source===values.destination){toast('Choose different source and destination stations.');navigate('journey');return;}
  const invalid=[...app.querySelectorAll('[data-journey-field]')].find(input=>!input.checkValidity());if(invalid){invalid.closest('details')?.setAttribute('open','');invalid.reportValidity();return;}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(values.date)||!/^\d{2}:\d{2}$/.test(values.time)){toast('Choose a valid travel date and time.');return;}
  state.ticket={...state.ticket,...values,status:'active',bookedAt:`${values.date} ${values.time}:00`};state.formTicket=null;state.rating=0;state.description='';state.submitted=false;state.tab='upcoming';store('travel-ticket',state.ticket);navigate('active');
}
function journeyAction(action,button){
  const d=draft();
  if(action==='journey-close')navigate('home');
  else if(action==='journey-back')returnToJourney();
  else if(action==='journey-station'){state.stationField=button.dataset.field;state.stationQuery='';navigate('station');}
  else if(action==='journey-select-station'){const field=button.dataset.field;d[field]=button.dataset.name;d[field+'Code']=button.dataset.code||'';reprice();returnToJourney();}
  else if(action==='journey-swap'){[d.source,d.destination]=[d.destination,d.source];[d.sourceCode,d.destinationCode]=[d.destinationCode,d.sourceCode];refreshJourney();}
  else if(action==='journey-mode'){d[button.dataset.field]=button.dataset.value;refreshJourney();}
  else if(action==='journey-recent'){for(const field of ['source','destination']){d[field]=button.dataset[field];d[field+'Code']=button.dataset[field+'Code']||'';}reprice();refreshJourney();}
  else if(action==='journey-proceed'){if(!d.source?.trim()||!d.destination?.trim()||d.source===d.destination){toast('Choose different source and destination stations.');return;}reprice();navigate('journey-options');}
  else if(action==='journey-choice'){d[button.dataset.field]=button.dataset.value;if(d.service==='AC EMU TRAIN')d.class='FIRST';reprice();refreshJourney();}
  else if(action==='journey-step'){const field=button.dataset.field;d[field]=Math.min(6,Math.max(field==='adults'?1:0,Number(d[field])+Number(button.dataset.delta)));reprice();refreshJourney();}
  else if(action==='journey-concession'){d.concession=!d.concession;refreshJourney();}
  else if(action==='journey-book')completeJourney();
  else if(action==='journey-voice'){app.querySelector('#station-query')?.focus();toast('Use your keyboard microphone to dictate a station.');}
  else if(action==='journey-fare')showModal('Fare Breakup',`<dl class="receipt-list"><dt>Passenger(s)</dt><dd>${d.adults} Adult, ${d.children} Child</dd><dt>Class</dt><dd>${e(d.class)}</dd><dt>Ticket Type</dt><dd>${e(d.type)}</dd><dt>Fare</dt><dd>${money(d.fare)}</dd></dl><p>Preview fare. Your operator’s fare service can replace this calculation.</p>`);
  else if(action==='journey-terms')showModal('Terms & Conditions','<p>This is a booking preview. No payment or reservation is made. Your operator’s booking terms can be added here.</p>');
  else if(action==='journey-upcoming')showModal('Upcoming Trains',`<p>${e(d.source||'Source')} → ${e(d.destination||'Destination')}</p><p>Live timetables will appear here after your operator’s schedule service is connected.</p>`);
}

function applyBrand(){document.documentElement.style.setProperty('--primary',state.brand.primary);document.documentElement.style.setProperty('--ticket-watermark',`url("${BRAND.watermark}")`);document.querySelector('meta[name="theme-color"]').content=state.brand.primary;}
function toast(message){const node=document.querySelector('#toast');node.textContent=message;node.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>node.classList.remove('visible'),3200);}

function renderStudio(){
  studio.innerHTML=`<div class="studio-brand"><img src="${e(state.brand.logo)}" alt="Company logo"><div><strong>${e(state.brand.name)}</strong><span>Mobile booking experience</span></div></div><h2>Your journey.<br>Your ticket.</h2><p class="studio-intro">A familiar booking experience, ready for your brand. Enter a journey to see it on the live ticket.</p><p class="studio-label">EXPLORE THE APP</p>${[['home','bus','Home','01'],['profile','settings','You','02'],['journey','route','Book a journey','03'],['active','ticket','Live ticket','04'],['bookings','receipt','My Bookings','05'],['expired','ticket','Expired ticket','06']].map(([screen,ico,title,num])=>`<button class="screen-link ${state.screen===screen?'selected':''}" data-screen="${screen}">${icon(ico,19)}<span>${title}</span><small>${num}</small></button>`).join('')}<hr class="studio-divider"><p class="studio-label">MAKE IT YOURS</p><div class="brand-editor"><input id="brand-name" type="text" value="${e(state.brand.name)}" maxlength="24" aria-label="Company name"><input id="brand-color" type="color" value="${e(state.brand.primary)}" aria-label="Brand color"></div><label class="upload-label">Replace company logo ${icon('plus',16)}<input id="brand-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" aria-label="Upload company logo"></label><p class="studio-foot">Brand assets, ticket data and screen components are separate, so you can change each independently.</p><button class="install-button" data-studio-action="install">${icon('plus',16)}<span>Install app</span>${icon('chevron',15)}</button><div class="studio-actions"><button class="text-action" data-studio-action="reset">Reset preview</button><button class="text-action" data-studio-action="feedback">Jump to feedback</button></div>`;
}

function getTickets(){let items=state.tab==='completed'?[...HISTORY]:state.tab==='upcoming'?[state.ticket]:state.tab==='all'?[state.ticket,...HISTORY]:[];items.sort((a,b)=>a.bookedAt.localeCompare(b.bookedAt));return state.reverse?items.reverse():items;}

function render(){
  applyBrand();renderStudio();let content='',top='',bottom='';app.className=`mobile-app screen-${state.screen}`;
  const lightStatus='<div class="status-bar light-status"><span>9:57</span><div class="dynamic-island"></div><span class="status-icons">▴ 5G <span class="battery">30</span></span></div>';
  if(state.screen==='home'){
    top=lightStatus+homeHeader(state.brand);content=homeScreen(state.ticket,state.brand,state.profile);bottom=mainNav('home');
  }else if(state.screen==='profile'){
    top=lightStatus;content=profileScreen(state.profile);bottom=mainNav('profile');
  }else if(state.screen==='journey'){
    top=journeyHeader('entry');content=journeyEntry(draft());
  }else if(state.screen==='station'){
    top=journeyHeader('search');content=stationSearch(draft(),state.stationField||'source',state.stationQuery||'');
  }else if(state.screen==='journey-options'){
    top=journeyHeader('options');content=journeyOptions(draft());
  }else if(state.screen==='active'){
    top=header('Booking Details',`Mobile: ${state.profile.mobile}`);content=activeTicket(state.ticket,state.brand,{...COPY,greeting:`Thank You ${state.profile.name}, Happy Journey !`},state.previewVisible);
  }else if(state.screen==='bookings'){
    top=header('My Bookings',state.tab==='upcoming'?'':COPY.bookingsSubtitle,`<button class="header-action" data-action="sort" aria-label="Reverse booking order">${icon('sort',20)}</button>`);content=bookings(getTickets(),state.tab);bottom=tabBar(state.tab);
  }else{
    top=header('Booking Details','',`<button class="header-action" data-action="receipt" aria-label="View ticket receipt">${icon('receipt',18)}</button>`);content=expiredTicket(state.selected);
  }
  app.innerHTML=`${top}<div class="app-scroll" id="app-scroll">${content}</div>${bottom}<div class="app-homebar"></div>`;
  if(state.screen==='active'){updateCountdown();restoreFeedback();}
}

function navigate(screen,{push=true}={}){previousScreen=state.screen;if(screen==='active'){restartTimer();state.tab='upcoming';if(push)history.replaceState({screen:'bookings',tab:'upcoming'},'','#bookings');}state.screen=screen;render();if(push)history.pushState({screen,tab:state.tab},'',`#${screen}`);}
function restartTimer(){state.previewEnd=Date.now()+PREVIEW_SECONDS*1000;state.previewVisible=true;}
function updateCountdown(){if(state.screen!=='active'||!state.previewVisible)return;const seconds=Math.max(0,Math.ceil((state.previewEnd-Date.now())/1000));updateTimer(document.querySelector('#countdown'),seconds);if(seconds===0){state.previewVisible=false;const scroll=document.querySelector('#app-scroll').scrollTop;render();document.querySelector('#app-scroll').scrollTop=scroll;}}
setInterval(updateCountdown,1000);

function restoreFeedback(){const form=document.querySelector('#feedback-form');if(!form)return;form.elements.description.value=state.description;document.querySelector('#character-count').textContent=`${state.description.length}/200`;document.querySelectorAll('.star').forEach(button=>{button.classList.toggle('chosen',Number(button.dataset.rating)<=state.rating);button.setAttribute('aria-checked',String(Number(button.dataset.rating)===state.rating));});form.querySelector('.submit-feedback').disabled=!state.rating||state.submitted;form.querySelector('.feedback-success').hidden=!state.submitted;}
function showModal(title,body){app.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" data-action="backdrop"><section class="modal-sheet" role="dialog" aria-modal="true" aria-label="${e(title)}"><button class="modal-close" data-action="close-modal" aria-label="Close">${icon('close')}</button><h2>${e(title)}</h2>${body}</section></div>`);const modal=app.querySelector('.modal-backdrop');modal._returnFocus=document.activeElement;modal.querySelector('button').focus();}
function closeModal(){const modal=app.querySelector('.modal-backdrop');const focus=modal?._returnFocus;modal?.remove();focus?.focus?.();}
function saveProfile(){store('travel-profile',state.profile);}
function closeMenu(){const menu=app.querySelector('.menu-overlay');const focus=menu?._returnFocus;menu?.remove();focus?.focus?.();}
function openMenu(){closeMenu();app.insertAdjacentHTML('beforeend',menuDrawer(state.profile));const menu=app.querySelector('.menu-overlay');menu._returnFocus=document.activeElement;menu.querySelector('.menu-drawer button').focus();}
function serviceInfo(title,message){closeMenu();showModal(title,`<p>${e(message)}</p>`);}
function editProfile(){closeMenu();showModal('Edit Details',`<form id="profile-form" class="settings-form"><label>Name<input name="name" required maxlength="50" value="${e(state.profile.name)}"></label><label>Mobile<input name="mobile" type="tel" required maxlength="15" value="${e(state.profile.mobile)}"></label><button class="primary-button" type="submit">Save Details</button><p>Changes are saved on this device.</p></form>`);}
async function screenAction(action,button){
  if(action==='home-nav'){if(button.dataset.screen==='bookings')state.tab='upcoming';navigate(button.dataset.screen);}
  else if(action==='home-journey')beginJourney();
  else if(action==='home-view-ticket')navigate('active');
  else if(action==='home-book-again')beginJourney();
  else if(action==='home-language')serviceInfo('Select language','English is selected for this preview. The visible labels are kept as in your references.');
  else if(action==='home-notifications')showModal('Notifications',`<div class="notification-item"><strong>Journey Ticket</strong><p>${e(state.ticket.source)} → ${e(state.ticket.destination)}</p><button class="primary-button" data-action="home-view-ticket">View Details</button></div><div class="notification-item"><strong>Welcome, ${e(state.profile.name)}</strong><p>Your travel profile is ready.</p></div>`);
  else if(action==='home-service'){
    const id=button.dataset.service;const title=HOME_SERVICES.find(s=>s.id===id)?.label||'Service';
    if(id==='search')beginJourney();
    else if(id==='pnr')showModal(title,`<form id="ticket-lookup" class="settings-form"><label>Ticket number<input name="id" required value="${e(state.ticket.id)}"></label><button class="primary-button" type="submit">View Details</button><p id="lookup-error" role="alert"></p></form>`);
    else serviceInfo(title,`${title} is shown in the reference layout. Live service information will appear here after your company's service is connected.`);
  }else if(action==='home-social'){const target=state.brand.socialLinks?.[button.dataset.platform];if(target&&/^https:\/\//.test(target))window.open(target,'_blank','noopener');else serviceInfo(button.dataset.platform,`Add your company's ${button.dataset.platform} link in the brand settings to connect this button.`);}
  else if(action==='profile-back')navigate('home');
  else if(action==='profile-view')showModal('View Details',`<dl class="receipt-list"><dt>Name</dt><dd>${e(state.profile.name)}</dd><dt>Mobile</dt><dd>${e(state.profile.mobile)}</dd><dt>Profile</dt><dd>${state.profile.completion}% complete</dd></dl>`);
  else if(action==='profile-edit')editProfile();
  else if(action==='profile-wallet-refresh')toast('Wallet balance is up to date');
  else if(action==='profile-wallet-add'){closeMenu();showModal('Add Money',`<form id="wallet-form" class="settings-form"><label>Amount (₹)<input name="amount" type="number" required min="1" max="100000" step=".01" placeholder="Enter amount"></label><button class="primary-button" type="submit">Add</button><p>Demo wallet only. No payment will be taken.</p></form>`);}
  else if(action==='profile-biometric'){state.profile.biometric=!state.profile.biometric;saveProfile();render();toast('Preview preference saved. Device authentication is not connected.');}
  else if(action==='profile-service'){
    const names={password:'Change Password',account:'My Account',transfer:'Transfer Ticket',transactions:'My Transaction',aadhaar:'Link Your Aadhar'};
    if(button.dataset.service==='account')editProfile();
    else if(button.dataset.service==='transactions'){const list=readStored('travel-wallet-log',[]);showModal('My Transaction',list.length?list.map(t=>`<div class="notification-item"><strong>${money(t.amount)}</strong><p>${e(new Date(t.date).toLocaleString())} · Demo credit</p></div>`).join(''):'<p>No transactions found.</p>');}
    else serviceInfo(names[button.dataset.service], 'This screen is a UI preview. Account security, identity verification and ticket transfer services are not connected.');
  }else if(action==='menu-open')openMenu();
  else if(action==='menu-close')closeMenu();
  else if(action==='menu-services'){closeMenu();showModal('Show/Hide Services',`<form id="services-form" class="settings-form">${HOME_SERVICES.map(s=>`<label class="service-checkbox"><input type="checkbox" name="service" value="${s.id}" ${state.profile.hiddenServices.includes(s.id)?'':'checked'}>${e(s.label)}</label>`).join('')}<button class="primary-button" type="submit">Save</button></form>`);}
  else if(action==='menu-service'){
    const details={faq:['FAQs','Enter your journey details to preview a ticket. Back opens My Bookings. View Details starts a fresh five-minute timer. The app works offline after its first load.'],support:['Help & Support','Company support details can be added here. This preview does not submit support requests.'],reserved:['Reserved Services - Counter','Reserved booking services are shown as in the reference. Connect the bus operator’s reservation system to enable this service.'],about:['About',`${state.brand.name} · Ticket booking PWA preview. Version 2.1.78-1.`]};const d=details[button.dataset.service];serviceInfo(d[0],d[1]);
  }else if(action==='menu-rate'){closeMenu();navigate('active');document.querySelector('#feedback').scrollIntoView({behavior:'smooth'});}
  else if(action==='menu-share'){closeMenu();try{await navigator.clipboard.writeText(location.origin+location.pathname);toast('App link copied');}catch{serviceInfo('Share',location.origin+location.pathname);}}
  else if(action==='menu-logout')serviceInfo('Log Out','This preview has no signed-in travel account. Your ticket and profile are stored locally on this device.');
}

async function installApp(){if(state.installPrompt){const prompt=state.installPrompt;await prompt.prompt();await prompt.userChoice;state.installPrompt=null;}else if(matchMedia('(display-mode: standalone)').matches){toast('The app is already installed.');}else{showModal('Install Your Travels',`<p>On iPhone or iPad, open this page in Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</p><p>On Android or desktop, open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p><p>Once loaded, the booking screens are also available offline.</p>`);}}

app.addEventListener('click',async event=>{
  const ratingButton=event.target.closest('[data-rating]');if(ratingButton){state.rating=Number(ratingButton.dataset.rating);state.submitted=false;restoreFeedback();return;}
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action.startsWith('journey-')){journeyAction(action,button);return;}
  if(/^(home|profile|menu)-/.test(action)){await screenAction(action,button);return;}
  if(action==='back') {if(state.screen==='active'){state.formTicket=null;state.journeyMode='new';state.tab='upcoming';navigate('bookings',{push:false});history.replaceState({screen:'bookings',tab:'upcoming'},'','#bookings');}else if(state.screen==='expired')navigate('bookings');else if(state.screen==='journey-options')navigate('journey');else navigate('home');}
  else if(action==='tab'){state.tab=button.dataset.tab;render();}
  else if(action==='sort'){state.reverse=!state.reverse;render();toast(state.reverse?'Newest bookings first':'Oldest bookings first');}
  else if(action==='refresh'){render();toast('Bookings are up to date');}
  else if(action==='view-ticket'){const selected=[state.ticket,...HISTORY].find(t=>t.id===button.dataset.id);if(selected?.status==='active')navigate('active');else if(selected){state.selected=selected;navigate('expired');}}
  else if(action==='book-again')beginJourney([state.ticket,...HISTORY].find(t=>t.id===button.dataset.id)||state.ticket);
  else if(action==='connect')beginJourney({...state.ticket,source:state.ticket.destination,sourceCode:state.ticket.destinationCode||'',destination:'',destinationCode:''},'connect');
  else if(action==='restart'){restartTimer();render();}
  else if(action==='qr')showModal('Journey Ticket',`<img class="modal-qr" src="${e(state.brand.qr)}" alt="Demo ticket QR code"><p style="text-align:center">${e(state.ticket.source)} → ${e(state.ticket.destination)}<br>${e(state.ticket.id)}</p>`);
  else if(action==='receipt'){const t=state.selected;showModal('Ticket Details',`<dl class="receipt-list"><dt>Journey Ticket</dt><dd>${e(t.id)}</dd><dt>Source</dt><dd>${e(t.source)}</dd><dt>Destination</dt><dd>${e(t.destination)}</dd><dt>Class</dt><dd>${e(t.class)}</dd><dt>Fare</dt><dd>${money(t.fare)}</dd><dt>Status</dt><dd>Ticket Expired</dd></dl>`);}
  else if(action==='close-modal'||(action==='backdrop'&&event.target===button))closeModal();
  else if(action==='install')await installApp();
});

app.addEventListener('input',event=>{if(event.target.id==='station-query'){state.stationQuery=event.target.value;document.querySelector('#station-results-label').textContent=state.stationQuery.trim()?'Search Results':'Recent Station Searches';document.querySelector('#station-results').innerHTML=stationResults(state.stationField||'source',state.stationQuery);return;}const field=event.target.dataset.journeyField;if(field){draft()[field]=field==='fare'?Number(event.target.value):event.target.value;const label=app.querySelector('#journey-fare-value');if(label&&field==='fare')label.textContent=`₹ ${Number(event.target.value)}`;return;}if(event.target.name==='description'){state.description=event.target.value;state.submitted=false;document.querySelector('#character-count').textContent=`${state.description.length}/200`;document.querySelector('.feedback-success').hidden=true;document.querySelector('.submit-feedback').disabled=!state.rating;}});
app.addEventListener('submit',event=>{
  event.preventDefault();const form=event.target;
  if(form.id==='journey-form'){
    const values=Object.fromEntries(new FormData(form));values.source=values.source.trim().toUpperCase();values.destination=values.destination.trim().toUpperCase();
    if(!values.source||!values.destination){document.querySelector('#form-error').textContent='Please enter both source and destination.';return;}
    if(values.source===values.destination){document.querySelector('#form-error').textContent='Source and destination must be different.';return;}
    for(const key of ['fare','adults','children'])values[key]=Number(values[key]);
    state.ticket={...state.ticket,...values,status:'active',bookedAt:`${values.date} ${values.time}:00`};state.formTicket=null;state.rating=0;state.description='';state.submitted=false;state.tab='upcoming';store('travel-ticket',state.ticket);restartTimer();history.replaceState({screen:'bookings',tab:'upcoming'},'','#bookings');navigate('active');
  }else if(form.id==='feedback-form'&&state.rating){const feedback=readStored('travel-feedback',[]);feedback.push({ticketId:state.ticket.id,rating:state.rating,description:state.description,submittedAt:new Date().toISOString()});store('travel-feedback',feedback);state.submitted=true;restoreFeedback();toast('Thank you! Your feedback is saved on this device.');}
  else if(form.id==='profile-form'){const values=Object.fromEntries(new FormData(form));if(!values.name.trim())return;state.profile.name=values.name.trim();state.profile.mobile=values.mobile.trim();state.profile.completion=100;saveProfile();closeModal();render();toast('Details saved');}
  else if(form.id==='wallet-form'){const amount=Number(new FormData(form).get('amount'));if(!Number.isFinite(amount)||amount<=0)return;state.profile.balance=Math.round((state.profile.balance+amount)*100)/100;saveProfile();store('travel-wallet-log',[...readStored('travel-wallet-log',[]),{amount,date:new Date().toISOString()}]);closeModal();render();toast('Demo wallet updated');}
  else if(form.id==='services-form'){const shown=new FormData(form).getAll('service');state.profile.hiddenServices=HOME_SERVICES.filter(s=>!shown.includes(s.id)).map(s=>s.id);saveProfile();closeModal();render();toast('Services updated');}
  else if(form.id==='ticket-lookup'){const id=new FormData(form).get('id').trim();if(id===state.ticket.id){closeModal();navigate('active');}else document.querySelector('#lookup-error').textContent='No matching ticket on this device.';}
});

app.addEventListener('keydown',event=>{const modal=app.querySelector('.modal-backdrop')||app.querySelector('.menu-overlay');if(event.key==='Escape'){closeModal();closeMenu();}if(modal&&event.key==='Tab'){const focusable=[...modal.querySelectorAll('button,a,input,select,textarea,[tabindex="0"]')];const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}const star=event.target.closest('[data-rating]');if(star&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();state.rating=Math.min(5,Math.max(1,Number(star.dataset.rating)+(['ArrowRight','ArrowUp'].includes(event.key)?1:-1)));state.submitted=false;restoreFeedback();document.querySelector(`[data-rating="${state.rating}"]`).focus();}});

studio.addEventListener('click',event=>{const screen=event.target.closest('[data-screen]')?.dataset.screen;if(screen){state.formTicket=null;state.journeyMode='new';navigate(screen);return;}const action=event.target.closest('[data-studio-action]')?.dataset.studioAction;if(action==='install')installApp();if(action==='feedback'){navigate('active');document.querySelector('#feedback').scrollIntoView({behavior:'smooth'});}if(action==='reset'){state.ticket={...INITIAL_TICKET};state.brand={...BRAND};state.formTicket=null;state.journeyMode='new';state.rating=0;state.description='';state.submitted=false;state.tab='completed';store('travel-ticket',state.ticket);store('travel-brand',{});restartTimer();navigate('journey');toast('Preview reset');}});
studio.addEventListener('change',event=>{if(event.target.id==='brand-name'){state.brand.name=event.target.value.trim()||BRAND.name;store('travel-brand',state.brand);render();}else if(event.target.id==='brand-color'){state.brand.primary=event.target.value;store('travel-brand',state.brand);applyBrand();}else if(event.target.id==='brand-logo'){const file=event.target.files?.[0];if(!file)return;if(file.size>2*1024*1024){toast('Choose a logo smaller than 2 MB.');return;}const reader=new FileReader();reader.onload=()=>{state.brand.logo=reader.result;store('travel-brand',state.brand);renderStudio();};reader.readAsDataURL(file);}});

window.addEventListener('popstate',event=>{const screen=event.state?.screen||'home';if(event.state?.tab)state.tab=event.state.tab;if(SCREENS.includes(screen))navigate(screen,{push:false});});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();state.installPrompt=event;});
window.addEventListener('appinstalled',()=>toast('Your Travels is installed.'));
let resume=null;try{resume=JSON.parse(sessionStorage.getItem('travel-update-state'));sessionStorage.removeItem('travel-update-state');}catch{}
if(resume&&SCREENS.includes(resume.screen)){state.screen=resume.screen;state.tab=resume.tab||state.tab;state.formTicket=resume.draft||null;state.stationField=resume.stationField||'source';state.stationQuery=resume.stationQuery||'';}else{const hash=location.hash.slice(1);if(SCREENS.includes(hash))state.screen=hash;}if(state.screen==='active')restartTimer();
history.replaceState({screen:state.screen,tab:state.tab},'',`#${state.screen}`);render();
if('serviceWorker' in navigator){
  const wasControlled=Boolean(navigator.serviceWorker.controller);let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!wasControlled||reloading)return;reloading=true;try{sessionStorage.setItem('travel-update-state',JSON.stringify({screen:state.screen,tab:state.tab,draft:state.formTicket,stationField:state.stationField,stationQuery:state.stationQuery}));}catch{}location.reload();});
  window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(error=>console.warn('Offline support unavailable:',error.message));});
}
