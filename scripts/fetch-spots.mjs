// Stáhne cvičební prvky z OpenStreetMap (Overpass API), seskupí je do hřišť
// a uloží do src/data/spots.json.
//
// Použití:  node scripts/fetch-spots.mjs [lat] [lon] [polomer_m]
// Výchozí oblast je Nymburk a 12 km okolo.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const lat = Number(process.argv[2] ?? 50.186);
const lon = Number(process.argv[3] ?? 15.0416);
const radius = Number(process.argv[4] ?? 12000);

// Prvky blíž než tolik metrů od sebe tvoří jedno hřiště.
const CLUSTER_M = 250;

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const around = `(around:${radius},${lat},${lon})`;
const stationQuery = `[out:json][timeout:60];
(
  nwr["leisure"="fitness_station"]${around};
  nwr["sport"~"calisthenics|street_workout"]${around};
);
out center tags;`;
const placeQuery = `[out:json][timeout:25];
node["place"~"^(town|village|suburb)$"](around:${radius + 3000},${lat},${lon});
out tags;`;

// Použije se, když se názvy obcí nepodaří stáhnout. Souřadnice jsou přibližné.
const FALLBACK_PLACES = [
  { name: 'Nymburk', lat: 50.186, lon: 15.0416 },
  { name: 'Poděbrady', lat: 50.1424, lon: 15.1189 },
  { name: 'Sadská', lat: 50.136, lon: 14.986 },
  { name: 'Třebestovice', lat: 50.127, lon: 14.957 },
  { name: 'Kostomlaty nad Labem', lat: 50.183, lon: 14.955 },
  { name: 'Ostrá', lat: 50.18, lon: 14.893 },
  { name: 'Lysá nad Labem', lat: 50.2014, lon: 14.8328 },
];

async function overpass(query) {
  let lastError;
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'workout-game-dev/0.1',
        },
        body: 'data=' + encodeURIComponent(query),
      });
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastError = e;
      console.warn('Nepovedlo se:', url, e.message ?? e);
    }
  }
  throw lastError;
}

function distanceM(a, b) {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// OVERPASS_FILE=soubor.json načte dříve staženou odpověď místo dotazu na server.
const data = process.env.OVERPASS_FILE
  ? JSON.parse(readFileSync(process.env.OVERPASS_FILE, 'utf8'))
  : await overpass(stationQuery);

const stations = [];
for (const el of data.elements) {
  const point = el.center ?? el;
  const tags = el.tags ?? {};
  if (point.lat == null || tags.place) continue;
  stations.push({
    osm: `${el.type}/${el.id}`,
    lat: point.lat,
    lon: point.lon,
    name: tags.name ?? null,
    equipment: tags.fitness_station && tags.fitness_station !== 'yes' ? tags.fitness_station : null,
    description: tags.description ?? null,
  });
}

let places = FALLBACK_PLACES;
try {
  const found = (await overpass(placeQuery)).elements
    .filter((el) => el.tags?.name)
    .map((el) => ({ name: el.tags.name, lat: el.lat, lon: el.lon }));
  if (found.length > 0) places = found;
} catch {
  console.warn('Názvy obcí se nepodařilo stáhnout, používám vestavěný seznam.');
}

// Seskupení: prvek patří do skupiny, pokud je blízko kteréhokoli jejího člena.
const groups = [];
for (const s of stations) {
  const near = groups.filter((g) => g.some((m) => distanceM(m, s) <= CLUSTER_M));
  const merged = [s, ...near.flat()];
  for (const g of near) groups.splice(groups.indexOf(g), 1);
  groups.push(merged);
}

const usedNames = new Map();
const spots = groups
  .map((members) => {
    const cLat = members.reduce((sum, m) => sum + m.lat, 0) / members.length;
    const cLon = members.reduce((sum, m) => sum + m.lon, 0) / members.length;
    const center = { lat: cLat, lon: cLon };
    const place = places
      .map((p) => ({ name: p.name, d: distanceM(p, center) }))
      .sort((a, b) => a.d - b.d)[0];
    return {
      // Stabilní ID podle nejmenšího OSM prvku ve skupině.
      id: members.map((m) => m.osm).sort()[0].replace('/', '-'),
      osmName: members.find((m) => m.name)?.name ?? null,
      place: place?.name ?? null,
      lat: Number(cLat.toFixed(6)),
      lon: Number(cLon.toFixed(6)),
      // Vzdálenost nejvzdálenějšího prvku od středu (pro check-in).
      radiusM: Math.round(Math.max(...members.map((m) => distanceM(m, center)))),
      stationCount: members.length,
      equipment: [...new Set(members.map((m) => m.equipment).filter(Boolean))].sort(),
      notes: [...new Set(members.map((m) => m.description).filter(Boolean))],
      osmIds: members.map((m) => m.osm).sort(),
    };
  })
  .sort((a, b) => distanceM(a, { lat, lon }) - distanceM(b, { lat, lon }))
  .map(({ osmName, place, ...spot }) => {
    const base = osmName ?? (place ? `Workout ${place}` : 'Workout hřiště');
    const n = (usedNames.get(base) ?? 0) + 1;
    usedNames.set(base, n);
    return { ...spot, name: n === 1 ? base : `${base} ${n}`, place };
  });

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/spots.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(spots, null, 2) + '\n');
console.log(`Uloženo ${spots.length} hřišť (${stations.length} prvků) do ${out}`);
for (const s of spots) console.log(` - ${s.name}: ${s.stationCount} prvků, ${s.equipment.join(', ') || 'bez popisu'}`);
