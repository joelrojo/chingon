// Venice, California solar engine.
// The environment is anchored to this place, not to the visitor.
// Low-precision NOAA-style solar position — plenty for light and palette.

import { clamp, lerp, hex, mixc } from './util.js';

export const VENICE = { lat: 33.99, lon: -118.46 };

const RAD = Math.PI / 180;
const norm360 = (d) => ((d % 360) + 360) % 360;

// altitude (deg above horizon) and azimuth (deg from north, clockwise)
export function sunPosition(date, lat = VENICE.lat, lon = VENICE.lon) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;

  const L = norm360(280.460 + 0.9856474 * n);
  const g = (357.528 + 0.9856003 * n) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;

  const sinDec = Math.sin(eps) * Math.sin(lambda);
  const dec = Math.asin(sinDec);
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));

  const gmst = norm360(280.46061837 + 360.98564736629 * n);
  const lst = (gmst + lon) * RAD;
  let H = lst - ra;
  H = Math.atan2(Math.sin(H), Math.cos(H));

  const phi = lat * RAD;
  const alt = Math.asin(Math.sin(phi) * sinDec + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const azFromSouth = Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)
  );
  return {
    altitude: alt / RAD,
    azimuth: norm360(azFromSouth / RAD + 180),
  };
}

// Venice calendar date (for the daily seed) and hour override support
export function veniceNow(overrideHour = null) {
  const now = new Date();
  if (overrideHour === null) return now;
  // rebuild "today at H.des in Los Angeles" regardless of visitor timezone
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const laAsUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day,
    +(parts.hour % 24), +parts.minute, +parts.second);
  const offsetMs = laAsUTC - now.getTime(); // LA = UTC + offset
  const h = Math.floor(overrideHour);
  const m = Math.round((overrideHour - h) * 60);
  const targetLA = Date.UTC(+parts.year, +parts.month - 1, +parts.day, h, m, 0);
  return new Date(targetLA - offsetMs);
}

export function veniceDaySeed() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return parseInt(fmt.format(new Date()).replace(/-/g, ''), 10);
}

// ---- palette bands ----
// anchor states keyed by solar altitude; blended continuously. never step.

const C = {
  obsidian: hex('#1C1C1A'),
  bone: hex('#E8E0D2'),
  dust: hex('#A49582'),
  agave: hex('#59604A'),
  gold: hex('#C89550'),
  apricot: hex('#D58C5B'),
  moon: hex('#34485A'),
  rust: hex('#873F2D'),
};
export const COLORS = C;

// each stop: [altitude, state]
const STOPS = [
  [-18, { // deep night
    skyTop: hex('#0d0e12'), skyMid: hex('#12141a'), skyHor: hex('#1e2530'),
    groundFar: hex('#181917'), groundNear: hex('#121210'),
    line: hex('#6d7988'), lineA: 0.16,
    filament: hex('#a8b8ca'), filamentA: 0.5,
    ink: hex('#d3dce6'),
    star: 1.0, sunA: 0,
    halo: hex('#c9d6e4'),
    stone: hex('#0e0e0d'),
    grass: hex('#232620'),
  }],
  [-10, {
    skyTop: hex('#0f1117'), skyMid: hex('#161a22'), skyHor: hex('#26303d'),
    groundFar: hex('#1a1b19'), groundNear: hex('#131311'),
    line: hex('#717c8a'), lineA: 0.15,
    filament: hex('#aab8c8'), filamentA: 0.48,
    ink: hex('#d5dde6'),
    star: 0.85, sunA: 0,
    halo: hex('#c9d6e4'),
    stone: hex('#0f0f0e'),
    grass: hex('#242721'),
  }],
  [-4, { // civil twilight
    skyTop: hex('#171b24'), skyMid: hex('#2a2f3c'), skyHor: hex('#6e4e3a'),
    groundFar: hex('#242320'), groundNear: hex('#181816'),
    line: hex('#7d7466'), lineA: 0.17,
    filament: hex('#bda37c'), filamentA: 0.5,
    ink: hex('#e4d8c2'),
    star: 0.35, sunA: 0.15,
    halo: hex('#d58c5b'),
    stone: hex('#131311'),
    grass: hex('#2a2b22'),
  }],
  [1, { // rise / set
    skyTop: hex('#2b3140'), skyMid: hex('#5d5450'), skyHor: hex('#ca8757'),
    groundFar: hex('#37332b'), groundNear: hex('#262420'),
    line: hex('#8b8070'), lineA: 0.20,
    filament: hex('#c89550'), filamentA: 0.55,
    ink: hex('#ecdfc9'),
    star: 0.1, sunA: 0.9,
    halo: hex('#e0a065'),
    stone: hex('#191813'),
    grass: hex('#33342a'),
  }],
  [7, { // golden hour
    skyTop: hex('#5f6b7c'), skyMid: hex('#9d8a75'), skyHor: hex('#d8a76e'),
    groundFar: hex('#7f7159'), groundNear: hex('#584f3f'),
    line: hex('#48412f'), lineA: 0.34,
    filament: hex('#b3873f'), filamentA: 0.5,
    ink: hex('#2e2b25'),
    star: 0, sunA: 1,
    halo: hex('#e2ad6c'),
    stone: hex('#28241b'),
    grass: hex('#42422f'),
  }],
  [16, { // morning / afternoon
    skyTop: hex('#8b98a4'), skyMid: hex('#bab094'), skyHor: hex('#e0cead'),
    groundFar: hex('#af9f82'), groundNear: hex('#87775c'),
    line: hex('#584e3a'), lineA: 0.36,
    filament: hex('#8f6f38'), filamentA: 0.44,
    ink: hex('#2b2823'),
    star: 0, sunA: 1,
    halo: hex('#e6c690'),
    stone: hex('#332d20'),
    grass: hex('#4c4e3a'),
  }],
  [32, {
    skyTop: hex('#9caab4'), skyMid: hex('#c7bda2'), skyHor: hex('#e4d6b8'),
    groundFar: hex('#bcac8e'), groundNear: hex('#948364'),
    line: hex('#5f553f'), lineA: 0.36,
    filament: hex('#8a6c36'), filamentA: 0.40,
    ink: hex('#282521'),
    star: 0, sunA: 1,
    halo: hex('#ecd3a2'),
    stone: hex('#382f21'),
    grass: hex('#505239'),
  }],
  [60, { // midday: brightest, flattest, most exposed
    skyTop: hex('#a9b4bd'), skyMid: hex('#d2c8b0'), skyHor: hex('#e8dabf'),
    groundFar: hex('#c6b795'), groundNear: hex('#a08d6b'),
    line: hex('#6a5f46'), lineA: 0.33,
    filament: hex('#85682f'), filamentA: 0.35,
    ink: hex('#282521'),
    star: 0, sunA: 1,
    halo: hex('#f0daae'),
    stone: hex('#3d3425'),
    grass: hex('#54563d'),
  }],
];

const NUMERIC = ['lineA', 'filamentA', 'star', 'sunA'];

export function palette(altitude, azimuth) {
  const alt = clamp(altitude, STOPS[0][0], STOPS[STOPS.length - 1][0]);
  let i = 0;
  while (i < STOPS.length - 2 && alt > STOPS[i + 1][0]) i++;
  const [a0, s0] = STOPS[i];
  const [a1, s1] = STOPS[i + 1];
  const t = clamp((alt - a0) / (a1 - a0), 0, 1);

  const out = {};
  for (const k of Object.keys(s0)) {
    out[k] = NUMERIC.includes(k) ? lerp(s0[k], s1[k], t) : mixc(s0[k], s1[k], t);
  }

  // evening leans apricot; morning stays cooler gold
  const pm = azimuth > 180;
  if (pm && altitude < 14 && altitude > -8) {
    const w = 0.30 * (1 - Math.abs(altitude - 2) / 11);
    if (w > 0) {
      out.skyHor = mixc(out.skyHor, C.apricot, w);
      out.halo = mixc(out.halo, C.apricot, w * 1.2);
    }
  }

  out.night = clamp((-altitude - 4) / 10, 0, 1); // 0 day → 1 full night
  return out;
}
