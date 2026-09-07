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

// board temperature by solar altitude. no sky, no ground plane.
const STOPS = [
  [-18, {
    field: hex('#0b0b0a'), field2: hex('#121110'),
    line: hex('#5c6774'), lineA: 0.14,
    filament: hex('#8a9aab'), filamentA: 0.52,
    ink: hex('#d5dde6'), glow: hex('#c9d6e4'),
  }],
  [-6, {
    field: hex('#100f0d'), field2: hex('#181614'),
    line: hex('#6a6256'), lineA: 0.15,
    filament: hex('#a8906a'), filamentA: 0.55,
    ink: hex('#e4d8c2'), glow: hex('#d4a46a'),
  }],
  [2, {
    field: hex('#161310'), field2: hex('#1f1b16'),
    line: hex('#7a6c55'), lineA: 0.16,
    filament: hex('#c89550'), filamentA: 0.60,
    ink: hex('#ecdfc9'), glow: hex('#e0a065'),
  }],
  [14, {
    field: hex('#1c1914'), field2: hex('#272218'),
    line: hex('#6b5d45'), lineA: 0.16,
    filament: hex('#b3873f'), filamentA: 0.52,
    ink: hex('#e8dfc8'), glow: hex('#c89550'),
  }],
  [60, {
    field: hex('#221e16'), field2: hex('#2c271c'),
    line: hex('#6a5f46'), lineA: 0.15,
    filament: hex('#8a6c36'), filamentA: 0.44,
    ink: hex('#e4d6b4'), glow: hex('#c89550'),
  }],
];

const NUMERIC = ['lineA', 'filamentA'];

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

  // evening leans rust / apricot in the metal
  const pm = azimuth > 180;
  if (pm && altitude < 14 && altitude > -8) {
    const w = 0.28 * (1 - Math.abs(altitude - 2) / 11);
    if (w > 0) {
      out.filament = mixc(out.filament, C.apricot, w);
      out.glow = mixc(out.glow, C.rust, w * 0.7);
    }
  }

  out.night = clamp((-altitude - 4) / 10, 0, 1); // 0 day → 1 full night
  return out;
}
