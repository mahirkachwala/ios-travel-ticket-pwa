import {NETWORK_DATA} from './data/mumbai-network.js';

export {NETWORK_DATA};
const normalize = value => String(value || '').trim().toUpperCase().replace(/[.\s_-]+/g, ' ');
export const STATIONS = NETWORK_DATA.stations;
const stationByCode = new Map(STATIONS.map(station => [station.code, station]));
export function findStation(value) {
  const term = normalize(value);
  return stationByCode.get(String(value || '').toUpperCase()) || STATIONS.find(station =>
    normalize(station.name) === term || (station.aliases || []).some(alias => normalize(alias) === term));
}

const graph = new Map(STATIONS.map(station => [station.code, []]));
function addEdge(from, to, km, lineId, sourceId, transfer = false) {
  if (!graph.has(from) || !graph.has(to) || from === to) return;
  for (const [a, b] of [[from, to], [to, from]]) {
    const existing = graph.get(a).find(edge => edge.to === b && edge.transfer === transfer && edge.km === km);
    if (existing) {
      if (!existing.lines.includes(lineId)) existing.lines.push(lineId);
      if (!existing.sources.includes(sourceId)) existing.sources.push(sourceId);
    } else graph.get(a).push({from: a, to: b, km, lines: [lineId], sources: [sourceId], transfer});
  }
}
for (const chain of NETWORK_DATA.chains) {
  for (let i = 1; i < chain.stations.length; i++) {
    const a = chain.stations[i - 1], b = chain.stations[i];
    const km = Number.isFinite(a.km) && Number.isFinite(b.km) ? Math.round(Math.abs(b.km - a.km) * 1000) / 1000 : null;
    addEdge(a.code, b.code, km, chain.id, chain.sourceId);
    for (const sourceId of [a.sourceId, b.sourceId].filter(Boolean)) addEdge(a.code, b.code, km, chain.id, sourceId);
  }
}
for (const link of NETWORK_DATA.links || []) addEdge(link.from, link.to, link.km, link.lineId, link.sourceId, Boolean(link.transfer));

// Unknown distances affect ranking only; they are never emitted as measured km.
const family = line => line.startsWith('central-') ? 'central' : line.startsWith('port-') ? 'port' : line.startsWith('trans-harbour-') ? 'trans-harbour' : line.startsWith('harbour') || line === 'western_harbour_shared' ? 'harbour' : line;
function shortestPath(from, to, banned = new Set()) {
  const queue = [{code: from, line: '', cost: 0, nodes: [from], edges: []}], best = new Map([[`${from}|`, 0]]);
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const item = queue.shift();
    if (item.code === to) return item;
    if (item.cost > best.get(`${item.code}|${item.line}`)) continue;
    for (const edge of graph.get(item.code) || []) {
      if (banned.has(`${edge.from}|${edge.to}`) || item.nodes.includes(edge.to)) continue;
      for (const lineId of edge.lines) {
        const line = family(lineId);
        // Prefer a through corridor to a tiny distance saving that requires a
        // platform change. This ranking penalty is never added to the distance.
        const change = item.line && item.line !== line ? 12 : 0;
        const cost = item.cost + (edge.km ?? 25) + change + (edge.transfer ? 12 : 0);
        const key = `${edge.to}|${line}`;
        if (cost >= (best.get(key) ?? Infinity)) continue;
        best.set(key, cost);
        queue.push({code: edge.to, line, cost, nodes: [...item.nodes, edge.to], edges: [...item.edges, {...edge, selectedLine: lineId}]});
      }
    }
  }
  return null;
}

function describePath(path) {
  const known = path.edges.every(edge => edge.km !== null);
  const km = known ? Math.round(path.edges.reduce((sum, edge) => sum + edge.km, 0) * 100) / 100 : null;
  const lineIds = [...new Set(path.edges.map(edge => edge.selectedLine).filter(id => id !== 'walk'))];
  const junctions = [];
  for (let i = 1; i < path.nodes.length - 1; i++) {
    const previous = path.edges[i - 1], next = path.edges[i];
    const changesLine = !previous.lines.some(line => next.lines.includes(line));
    if (changesLine || (NETWORK_DATA.viaJunctions || []).includes(path.nodes[i])) junctions.push(path.nodes[i]);
  }
  const viaCodes = [...new Set(junctions)];
  const lineNames = lineIds.map(id => NETWORK_DATA.chains.find(chain => chain.id === id)?.name || id);
  return {
    id: path.nodes.join('>'), nodes: path.nodes, edges: path.edges, km,
    distanceLabel: km === null ? 'Not verified' : `${Number(km.toFixed(2))} km`,
    via: viaCodes.join('-') || 'DIRECT',
    viaLabel: viaCodes.length ? viaCodes.map(code => stationByCode.get(code)?.name || code).join(' → ') : lineNames[0] || 'Direct route',
    lineIds, lineNames,
    sourceIds: [...new Set(path.edges.flatMap(edge => edge.sources))],
    hasWalkingTransfer: path.edges.some(edge => edge.transfer),
    requiresCidcoCheck: path.nodes.some(code => ['VSH','SNCR','JNJ','NEU','SWDV','BEPR','KHAG','MANR','KNDS','PNVL','GNSL','KPHN','TUH','AIRL','RABE','RABALE','DGHA'].includes(code)) || lineIds.some(id => id.startsWith('port-')),
  };
}

const routeCache = new Map();
export function routesBetween(fromValue, toValue) {
  const from = findStation(fromValue)?.code, to = findStation(toValue)?.code;
  if (!from || !to || from === to) return [];
  const key = `${from}|${to}`;
  if (routeCache.has(key)) return routeCache.get(key);
  const first = shortestPath(from, to);
  if (!first) return [];
  const candidates = [first];
  // Edge exclusions reveal genuine alternate corridors without arbitrary loops.
  for (const edge of first.edges) {
    const candidate = shortestPath(from, to, new Set([`${edge.from}|${edge.to}`, `${edge.to}|${edge.from}`]));
    if (candidate && candidate.cost <= first.cost * 1.6 + 15 && !candidates.some(item => item.nodes.join('>') === candidate.nodes.join('>'))) candidates.push(candidate);
  }
  const routes = candidates.sort((a, b) => a.cost - b.cost).slice(0, 4).map(describePath);
  routeCache.set(key, routes);
  return routes;
}

function serviceFits(service, route) {
  const stops = service.stops;
  const start = stops.indexOf(route.nodes[0]), end = stops.indexOf(route.nodes.at(-1));
  if (start < 0 || end < 0 || start === end) return false;
  if (service.directional && start > end) return false;
  const allowed = service.lineIds || [service.lineId];
  if (route.edges.some(edge => edge.transfer || !edge.lines.some(line => allowed.includes(line)))) return false;
  // A fast train can skip intermediate stations, but both requested ends must be stops.
  const relevantStops = stops.slice(Math.min(start, end), Math.max(start, end) + 1);
  const positions = relevantStops.map(code => route.nodes.indexOf(code));
  if (positions.some(position => position < 0)) return false;
  return positions.every((position, index) => index === 0 || (start < end ? position > positions[index - 1] : position < positions[index - 1]));
}
export function acServicesForRoute(route, date) {
  if (!route) return [];
  const day = date ? new Date(`${date}T12:00:00`).getDay() : null;
  return (NETWORK_DATA.acServices || []).filter(service => {
    const documentedFrom = service.effectiveFrom || service.snapshotDate;
    if (date && documentedFrom && date < documentedFrom) return false;
    if (date && service.effectiveTo && date > service.effectiveTo) return false;
    if (day !== null && service.days && !service.days.includes(day)) return false;
    return serviceFits(service, route);
  });
}

export function sourceRecords(ids) {
  return [...new Set(ids)].map(id => NETWORK_DATA.sources.find(source => source.id === id)).filter(Boolean);
}
