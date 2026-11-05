// Generates the topographic contour artwork used across /realms.
// Deterministic: the same seed always produces the same file.
// Usage: node scripts/generate-realms-contours.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed) {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h, x, y) => { const a = (h / 256) * Math.PI * 2; return Math.cos(a) * x + Math.sin(a) * y; };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[perm[xi] + yi], ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi], bb = perm[perm[xi + 1] + yi + 1];
    const x1 = grad(aa, xf, yf) + u * (grad(ba, xf - 1, yf) - grad(aa, xf, yf));
    const x2 = grad(ab, xf, yf - 1) + u * (grad(bb, xf - 1, yf - 1) - grad(ab, xf, yf - 1));
    return x1 + v * (x2 - x1);
  };
}

function field({ seed, cols, rows, scale, ridge = 0 }) {
  const noise = makeNoise(seed);
  const values = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let amp = 1, freq = scale, sum = 0, norm = 0;
    for (let o = 0; o < 5; o++) { sum += noise(x * freq + seed * 0.13, y * freq) * amp; norm += amp; amp *= 0.5; freq *= 2.03; }
    let v = sum / norm;
    if (ridge) v = v * (1 - ridge) + (0.5 - Math.abs(v)) * ridge;
    values[y * cols + x] = v;
  }
  return values;
}

// Marching squares, then joins segments into polylines to keep the SVG compact.
function contours(values, cols, rows, level, cell) {
  const segs = [];
  const at = (x, y) => values[y * cols + x];
  const lerp = (a, b) => (level - a) / (b - a);
  for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols - 1; x++) {
    const a = at(x, y), b = at(x + 1, y), c = at(x + 1, y + 1), d = at(x, y + 1);
    const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
    if (idx === 0 || idx === 15) continue;
    const top = [x + lerp(a, b), y], right = [x + 1, y + lerp(b, c)], bottom = [x + lerp(d, c), y + 1], left = [x, y + lerp(a, d)];
    const table = { 1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]], 5: [[left, top], [bottom, right]], 6: [[top, bottom]], 7: [[left, top]], 8: [[left, top]], 9: [[top, bottom]], 10: [[left, bottom], [top, right]], 11: [[top, right]], 12: [[left, right]], 13: [[bottom, right]], 14: [[left, bottom]] };
    for (const [p, q] of table[idx]) segs.push([p.map((n) => n * cell), q.map((n) => n * cell)]);
  }
  const key = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  const ends = new Map();
  segs.forEach((s, i) => { for (const p of s) { const k = key(p); (ends.get(k) ?? ends.set(k, []).get(k)).push(i); } });
  const used = new Uint8Array(segs.length);
  const lines = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const line = [segs[i][0], segs[i][1]];
    for (const dir of [1, -1]) {
      for (;;) {
        const tip = dir === 1 ? line[line.length - 1] : line[0];
        const next = (ends.get(key(tip)) ?? []).find((j) => !used[j]);
        if (next === undefined) break;
        used[next] = 1;
        const [p, q] = segs[next];
        const other = key(p) === key(tip) ? q : p;
        dir === 1 ? line.push(other) : line.unshift(other);
      }
    }
    if (line.length > 9) lines.push(line);
  }
  return lines;
}

function simplify(line, every) {
  return line.filter((_, i) => i === 0 || i === line.length - 1 || i % every === 0);
}

// Quadratic smoothing through segment midpoints removes the marching-squares stair steps.
function toPath(lines) {
  const n = (v) => Math.round(v * 2) / 2;
  return lines.map((l) => {
    let d = `M${n(l[0][0])} ${n(l[0][1])}`;
    for (let i = 1; i < l.length - 1; i++) {
      const mx = (l[i][0] + l[i + 1][0]) / 2, my = (l[i][1] + l[i + 1][1]) / 2;
      d += `Q${n(l[i][0])} ${n(l[i][1])} ${n(mx)} ${n(my)}`;
    }
    const last = l[l.length - 1];
    return d + `L${n(last[0])} ${n(last[1])}`;
  }).join("");
}

function render({ file, seed, width, height, cell, scale, levels, ridge, every = 2, strokeWidth = 1.1, majorEvery = 5 }) {
  const cols = Math.ceil(width / cell) + 1, rows = Math.ceil(height / cell) + 1;
  const values = field({ seed, cols, rows, scale, ridge });
  let min = Infinity, max = -Infinity;
  for (const v of values) { min = Math.min(min, v); max = Math.max(max, v); }
  const minor = [], major = [];
  for (let i = 1; i < levels; i++) {
    const level = min + ((max - min) * i) / levels;
    const lines = contours(values, cols, rows, level, cell).map((l) => simplify(l, every));
    (i % majorEvery === 0 ? major : minor).push(...lines);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="${strokeWidth}" opacity=".55" d="${toPath(minor)}"/><path stroke-width="${strokeWidth * 1.7}" d="${toPath(major)}"/></svg>`;
  const out = resolve(root, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, svg);
  console.log(file, (svg.length / 1024).toFixed(1) + " KB", minor.length + major.length, "lines");
}

// Wide field for the hero and the market band.
render({ file: "public/assets/realms/contours-field.svg", seed: 1672, width: 1600, height: 1000, cell: 10, scale: 0.012, levels: 30, ridge: 0.25 });
// Tighter, denser relief that fills the endmark logo.
render({ file: "public/assets/realms/contours-relief.svg", seed: 941, width: 1200, height: 900, cell: 8, scale: 0.016, levels: 26, ridge: 0.15, strokeWidth: 1.6, every: 3 });
