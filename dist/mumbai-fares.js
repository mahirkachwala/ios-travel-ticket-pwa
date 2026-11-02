import {FARE_DATA} from './data/mumbai-fares.js';
export {FARE_DATA};

// Fare-table kilometres are not proven to equal the route graph's chainage.
// Consequently even a complete calculation is an estimate, never a fare quote
// suitable for issuing a real railway ticket.
const SOURCE_IDS = ['rb_2025_basic', 'mrvc_mutp', 'rb_2022_ac', 'pib_gst', 'pib_rounding', 'pib_2025_dec'];
const CIDCO_CODES = new Set([
  'VSH', 'VA', 'SNCR', 'SNPD', 'JNJ', 'NEU', 'NERUL', 'SWDV', 'SWDK', 'BEPR',
  'KHAG', 'MANR', 'KNDS', 'PNVL', 'AIRL', 'RABE', 'GNSL', 'KPHN', 'TUH',
  'TUV', 'DTVL', 'JNPT', 'URAN', 'UNCT', 'DRGI', 'BMDR', 'KARP',
  'CHLI', 'CKHS', 'SGSG', 'NESA', 'DIGH', 'NVRD',
]);
const norm = value => String(value ?? '').trim().toUpperCase().replace(/[\s_-]+/g, ' ');
const unique = values => [...new Set(values)];
const cents = amount => Math.round((amount + Number.EPSILON) * 100) / 100;

function needsCidcoCheck(route) {
  if (route.requiresCidcoCheck) return true;
  const codes = route.nodes || route.stationCodes || [];
  if (codes.some(value => CIDCO_CODES.has(norm(typeof value === 'object' ? value.code : value)))) return true;
  return (route.lineIds || []).some(value => /TRANS[\s_-]?HARBOUR|URAN|PORT|NAVI|BELAPUR|PANVEL/i.test(value));
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function unavailable(notes, sourceIds = [], extra = {}) {
  return {amount: null, breakdown: [], notes, status: 'unavailable', sourceIds: unique(sourceIds), ...extra};
}

function hasConcession(value) {
  return ![undefined, null, false, 0].includes(value) && !['', 'NONE', 'NO', 'FALSE', '0'].includes(norm(value));
}

/**
 * Estimate an adult suburban fare from a selected route.
 *
 * `amount` is intentionally null if a route may carry CIDCO charges. In that
 * case `indicativeBase` is the group total excluding those unknown charges,
 * not a payable amount. `adultUnit` is per adult for the selected ticket type;
 * `adultSingleUnit` is per adult for one direction. All amounts are INR.
 *
 * AC service uses AC-EMU pricing even when the UI labels its class FIRST.
 * Child minima and concession eligibility have not been fully verified and
 * therefore produce no monetary total. The caller checks train availability.
 */
export function quoteFare({route, service = 'ORDINARY', class: ticketClass = 'SECOND', adults = 1, children = 0, type = 'JOURNEY', concession = false, date} = {}) {
  if (!route || typeof route !== 'object') return unavailable(['Choose a route to estimate the fare.']);
  const adultCount = Number(adults), childCount = Number(children);
  if (!Number.isSafeInteger(adultCount) || adultCount < 1 || !Number.isSafeInteger(childCount) || childCount < 0) {
    return unavailable(['Enter a positive whole number of adults and a non-negative whole number of children.']);
  }
  if (hasConcession(concession)) {
    return unavailable(['The selected concession needs verified eligibility and class-specific rates; a discounted total is unavailable.'], ['pib_2026_concessions']);
  }
  if (childCount) {
    return unavailable(['Children aged 5 to under 12 have a half-fare rule, but the current class minimum and supplementary-charge calculation are not fully verified. Confirm this fare through official booking.'], ['pib_child', 'rb_fare_notes']);
  }

  const serviceName = norm(typeof service === 'object' ? service.type || service.name : service);
  const className = norm(ticketClass);
  const isAC = ['AC', 'AC EMU', 'AC EMU TRAIN', 'AC LOCAL'].includes(serviceName);
  if (!isAC && !['ORDINARY', 'NON AC', 'LOCAL', 'EMU'].includes(serviceName)) {
    return unavailable(['Only ordinary suburban and AC EMU fares are supported.']);
  }
  if (isAC && !['FIRST', 'AC', 'AC EMU', 'AC FIRST'].includes(className)) {
    return unavailable(['Select the AC EMU class for an AC service.']);
  }
  if (!isAC && !['FIRST', 'SECOND'].includes(className)) {
    return unavailable(['Only First and Second class are supported for ordinary suburban services.']);
  }
  if (route.serviceAvailable === false || (isAC && route.acServiceVerified === false)) {
    return unavailable(['A service of the selected type has not been verified for this route and travel date.'], route.sourceIds || []);
  }

  const journeyType = norm(type);
  if (!['JOURNEY', 'SINGLE', 'RETURN'].includes(journeyType)) return unavailable(['Only single and return journey estimates are supported.']);
  const legs = journeyType === 'RETURN' ? 2 : 1;
  const travelDate = date == null || date === '' ? FARE_DATA.researched_as_of : String(date);
  if (!validDate(travelDate)) return unavailable(['Enter a valid travel date.']);
  if (travelDate < FARE_DATA.basic_table_metadata.effective) {
    return unavailable(['The loaded fare table does not cover this earlier travel date.'], ['rb_2025_basic']);
  }

  if (route.hasWalkingTransfer || route.edges?.some(edge => edge.transfer)) {
    return unavailable(['This route includes a walking interchange. A continuous ticket and its fare need official verification.'], ['rb_via']);
  }
  // Never coerce null to zero or parse a display string into tariff distance.
  if (typeof route.km !== 'number' || !Number.isFinite(route.km) || route.km <= 0) {
    return unavailable(['The selected route distance is not verified, so a fare estimate is unavailable.'], route.sourceIds || []);
  }
  if (!(route.nodes?.length || route.stationCodes?.length || route.lineIds?.length)) {
    return unavailable(['Route stations or line identifiers are required to check supplementary-charge coverage.'], ['rb_via']);
  }
  const estimateKm = Math.ceil(route.km);
  const supportedMax = FARE_DATA.conditional_adult_payable_without_cidco.maximum_supported_distance_km;
  if (estimateKm > supportedMax) {
    return unavailable([`The verified supplementary-charge data only covers distances through ${supportedMax} km. A total for this route is unavailable.`], ['mrvc_mutp']);
  }
  const slab = FARE_DATA.adult_single_basic_slabs.find(row => estimateKm >= row.min_km && estimateKm <= row.max_km);
  const mutp = FARE_DATA.rules.mutp.adult_single_slabs.find(row => estimateKm >= row.min_km && estimateKm <= row.max_km);
  if (!slab || !mutp) return unavailable(['No supported fare slab was found for this route.'], SOURCE_IDS);

  const key = isAC ? 'ac_emu' : className.toLowerCase();
  const basic = slab[`${key}_basic_inr`];
  const surcharge = mutp[`${key}_inr`];
  const gstRate = FARE_DATA.rules.gst[`${key}_percent`] / 100;
  if (![basic, surcharge, gstRate].every(Number.isFinite)) return unavailable(['Required tariff values are missing.'], SOURCE_IDS);
  const gst = (basic + surcharge) * gstRate;
  const beforeRounding = cents(basic + surcharge + gst);
  const adultSingleUnit = key === 'second' && beforeRounding % 5 === 1
    ? Math.max(5, beforeRounding - 1)
    : Math.max(5, Math.ceil(beforeRounding / 5) * 5);
  const adultUnit = adultSingleUnit * legs;
  const passengerLegs = adultCount * legs;
  const amount = cents(adultUnit * adultCount);
  if (!Number.isSafeInteger(amount)) return unavailable(['Passenger total is outside the supported range.']);

  const breakdown = [
    {label: `Basic fare (${adultCount} adult${adultCount === 1 ? '' : 's'}${legs === 2 ? ', 2 directions' : ''})`, amount: cents(basic * passengerLegs)},
    {label: 'MUTP surcharge', amount: cents(surcharge * passengerLegs)},
    ...(gstRate ? [{label: 'GST (5%)', amount: cents(gst * passengerLegs)}] : []),
    {label: 'Fare rounding', amount: cents((adultSingleUnit - beforeRounding) * passengerLegs)},
  ];
  const notes = [
    `Estimate uses ${estimateKm} km, rounded up from the route's ${route.km} km operational distance. Official chargeable tariff distance may differ.`,
    'Based on published basic fares and documented MUTP charges. Confirm the payable fare through official booking.',
  ];
  const sourceIds = [...SOURCE_IDS, 'rb_via', ...(route.sourceIds || [])];
  if (legs === 2) {
    notes.push('Return estimate is two single journeys. Current return validity and route-specific charges must be confirmed.');
    sourceIds.push('cr_return', 'cr_return_refund');
  }
  if (isAC) notes.push('This calculation does not confirm an AC train operates over the selected route and date.');
  if (travelDate > FARE_DATA.researched_as_of) notes.push(`Rates were checked on ${FARE_DATA.researched_as_of}; they may change before travel.`);

  const details = {adultUnit, adultSingleUnit, childUnit: null, estimateKm, distanceBasis: 'operational_chainage_estimate', breakdown, notes, sourceIds: unique(sourceIds)};
  if (needsCidcoCheck(route)) {
    return {
      ...details, amount: null, indicativeBase: amount, excludesCidco: true, status: 'unavailable',
      notes: [...notes, 'This route may carry a CIDCO surcharge whose current amount is not verified. The indicative amount excludes it; no final fare is available.'],
      sourceIds: unique([...sourceIds, 'cr_cidco']),
    };
  }
  return {...details, amount, excludesCidco: false, status: 'estimate'};
}
