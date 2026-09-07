// small shared helpers: seeded randomness, value noise, color math

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, t) => {
  const x = clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
export const map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// value noise, 2D, tileable enough for slow ambient fields
const PERM_SIZE = 256;
export function makeNoise(rand) {
  const perm = new Uint8Array(PERM_SIZE * 2);
  const grad = new Float32Array(PERM_SIZE);
  const p = [...Array(PERM_SIZE).keys()];
  for (let i = PERM_SIZE - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < PERM_SIZE * 2; i++) perm[i] = p[i & (PERM_SIZE - 1)];
  for (let i = 0; i < PERM_SIZE; i++) grad[i] = rand() * 2 - 1;

  const val = (ix, iy) => grad[perm[(perm[ix & 255] + iy) & 255]];
  const fade = (t) => t * t * (3 - 2 * t);

  function noise2(x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const u = fade(fx), v = fade(fy);
    const a = lerp(val(x0, y0), val(x0 + 1, y0), u);
    const b = lerp(val(x0, y0 + 1), val(x0 + 1, y0 + 1), u);
    return lerp(a, b, v); // -1..1
  }
  return noise2;
}

// ---- color ----

export function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgb = ([r, g, b], a = 1) =>
  a >= 1 ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`;
export const mixc = (c1, c2, t) => [
  lerp(c1[0], c2[0], t),
  lerp(c1[1], c2[1], t),
  lerp(c1[2], c2[2], t),
];
