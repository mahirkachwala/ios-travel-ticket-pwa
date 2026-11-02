// All replaceable brand graphics, reference copy, and initial ticket data live here.
// No transport operator, payment service, or ticket-validation API is connected.
export const BRAND = {
  name: 'YOUR TRAVELS',
  ticketName: 'INDIAN RAILWAYS',
  ticketNameLocal: 'भारतीय रेल',
  nameLocal: 'आपकी यात्रा',
  shortName: 'TR',
  primary: '#005cf5',
  logo: 'assets/brand-logo.svg',
  homeWordmark: 'assets/home-wordmark-railone.jpg',
  homeWordmarkAlt: 'RailOne',
  watermark: 'assets/ticket-watermark.svg',
  qr: 'assets/qr-ticket.svg',
};

export const COPY = {
  greeting: 'Thank You Atharv Kanase, Happy Journey !',
  mobile: '9867690677',
  bookingsSubtitle: 'Tickets from last 45 days are displayed',
  validity: '*Valid for start of journey within 1 hour or until departure of the first train.',
  note: 'Note: This ticket is non refundable. Ticket is stored locally on the device. Please do not change your handset or perform factory reset.',
  facts: [
    'IR recovers only 57% of cost of travel on an average.',
    'This ticket is booked on a personal user ID. It’s sale/purchase is an offence u/s 143 of the Railways Act, 1989',
    'For enquiry and integrated railway helpline, please dial 139.',
  ],
  feedbackTitle: 'How was your ticket booking experience ?',
};

export const INITIAL_TICKET = {
  id: 'X02VEHP1EC', status: 'active', source: 'VASHI', destination: 'GHANSOLI',
  distance: '8 km', adults: 1, children: 0, type: 'JOURNEY', service: 'ORDINARY',
  class: 'SECOND', fare: 5, via: 'SNCR', date: '2026-11-02', time: '21:00',
  bookedAt: '2026-11-02 21:00:00', reference: 'R18028', registration: '27AAAGM0289C2ZI',
};

// The captured history contains old dates even though its subtitle says 45 days.
// Dates are preserved as reference/demo content; these are not live records.
// Some compressed ticket IDs have ambiguous O/0 characters; these are visual transcriptions.
// For records 6–12, the video does not open the detail screen. Their via route,
// adult count and fare use demo placeholders below; bookedAt shows only the observed date.
export const HISTORY = [
  {id:'X07DED6086',source:'PANVEL',destination:'VASAI ROAD',distance:'68 km',date:'2026-05-23',via:'KLMC-DIVA',adults:2,fare:40,bookedAt:'2026-05-23 08:50:37'},
  {id:'X0KTEEM01C',source:'MANSAROVAR',destination:'THANE',distance:'41 km',date:'2026-07-14',via:'PNVL-DIVA',adults:2,fare:30,bookedAt:'2026-07-14 07:38'},
  {id:'X00GEEM41H',source:'THANE',destination:'MANSAROVAR',distance:'30 km',date:'2026-07-14',via:'TUH-JNJ',adults:2,fare:30,bookedAt:'2026-07-14 11:48'},
  {id:'X0CYEEP075',source:'CHEMBUR',destination:'MANSAROVAR',distance:'27 km',date:'2026-07-17',via:'------',adults:1,fare:15,bookedAt:'2026-07-17 13:58'},
  {id:'X02DEFM56F',source:'THANE',destination:'VASHI',distance:'19 km',date:'2026-08-19',via:'SNCR',adults:2,fare:30,bookedAt:'2026-08-19 15:38'},
  {id:'X0GVEFZ06G',source:'CHEMBUR',destination:'MANSAROVAR',distance:'27 km',date:'2026-09-01'},
  {id:'X0KXEGL03D',source:'MANSAROVAR',destination:'VASHI',distance:'15 km',date:'2026-09-23'},
  {id:'X074EGZ05S',source:'BELAPUR C.B.D',destination:'VASHI',distance:'10 km',date:'2026-10-07'},
  {id:'X030EGZ11C',source:'VASHI',destination:'BELAPUR C.B.D',distance:'10 km',date:'2026-10-07'},
  {id:'X072EH605S',source:'BELAPUR C.B.D',destination:'VASHI',distance:'10 km',date:'2026-10-14'},
  {id:'X075EH709C',source:'BELAPUR C.B.D',destination:'DADAR',distance:'30 km',date:'2026-10-15'},
  {id:'X075EHD076',source:'BELAPUR C.B.D',destination:'VASHI',distance:'10 km',date:'2026-10-21'},
].map(ticket => ({...INITIAL_TICKET, adults:2, fare:30, via:'------', bookedAt:ticket.date, ...ticket, status:'completed'}));

export const PREVIEW_SECONDS = 5 * 60;
