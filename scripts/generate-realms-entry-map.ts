// Generates the topographic map behind the Realms entry selector.
// Run: npx tsx scripts/generate-realms-entry-map.ts
// Feature positions (mirrored, x -> 960 - x) are mirrored in src/components/product/RealmsEntrySelector.tsx (MAP_FEATURES).
import { writeFileSync } from "node:fs";
import { createNoise3D, fbm } from "../src/lib/terrain-noise";

const W = 960;
const H = 460;
const CELL = 5;
const STEP = 0.068;
const noise = createNoise3D(4242);

// [x, y, height, spread]
const hills: [number, number, number, number][] = [
  // Casual: rolling country with no single summit
  [150, 190, 0.62, 70], [268, 290, 0.48, 56], [92, 336, 0.4, 58], [306, 150, 0.44, 54], [206, 96, 0.34, 46],
  // Focused: one dominant peak with a shoulder
  [480, 165, 1.08, 88], [548, 236, 0.3, 46],
  // Competitive: a contested summit with a rival peak beside it
  [712, 168, 0.9, 64], [858, 252, 0.72, 70],
];

// The map is drawn mirrored (Competitive west, Casual east); hills above are listed unmirrored.
const height = (mx: number, y: number) => {
  const x = W - mx;
  let h = 0;
  for (const [hx, hy, a, s] of hills) h += a * Math.exp(-((x - hx) ** 2 + (y - hy) ** 2) / (2 * s * s));
  h += 0.13 * fbm(noise, x / 150, y / 150, 0.37, 4);
  h += 0.06 * (1 - y / H);
  return h;
};

const cols = Math.ceil(W / CELL) + 1;
const rows = Math.ceil(H / CELL) + 1;
const field = new Float64Array(cols * rows);
let peak = 0;
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
  const h = height(c * CELL, r * CELL);
  field[r * cols + c] = h;
  peak = Math.max(peak, h);
}

type Pt = { key: string; x: number; y: number };
const paths: string[] = [];
const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

for (let k = 1; k * STEP < peak; k++) {
  const level = k * STEP;
  const segs: [Pt, Pt][] = [];
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
    const a = field[r * cols + c], b = field[r * cols + c + 1];
    const cc = field[(r + 1) * cols + c + 1], d = field[(r + 1) * cols + c];
    const sa = a >= level, sb = b >= level, sc = cc >= level, sd = d >= level;
    if (sa === sb && sb === sc && sc === sd) continue;
    const e: (Pt | null)[] = [null, null, null, null];
    if (sa !== sb) { const t = (level - a) / (b - a); e[0] = { key: `h${r},${c}`, x: (c + t) * CELL, y: r * CELL }; }
    if (sb !== sc) { const t = (level - b) / (cc - b); e[1] = { key: `v${r},${c + 1}`, x: (c + 1) * CELL, y: (r + t) * CELL }; }
    if (sc !== sd) { const t = (level - d) / (cc - d); e[2] = { key: `h${r + 1},${c}`, x: (c + t) * CELL, y: (r + 1) * CELL }; }
    if (sd !== sa) { const t = (level - a) / (d - a); e[3] = { key: `v${r},${c}`, x: c * CELL, y: (r + t) * CELL }; }
    const hits = e.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
    if (hits.length === 2) segs.push([e[hits[0]]!, e[hits[1]]!]);
    else if (hits.length === 4) {
      const centerAbove = (a + b + cc + d) / 4 >= level;
      if (centerAbove === sa) segs.push([e[0]!, e[1]!], [e[2]!, e[3]!]);
      else segs.push([e[3]!, e[0]!], [e[1]!, e[2]!]);
    }
  }

  // Chain segments that share a grid-edge crossing into polylines.
  const byKey = new Map<string, number[]>();
  segs.forEach(([p, q], i) => {
    for (const pt of [p, q]) {
      const list = byKey.get(pt.key);
      if (list) list.push(i); else byKey.set(pt.key, [i]);
    }
  });
  const used = new Uint8Array(segs.length);
  const lines: Pt[][] = [];
  const extend = (line: Pt[], forward: boolean) => {
    for (;;) {
      const end = forward ? line[line.length - 1] : line[0];
      const next = (byKey.get(end.key) ?? []).find((i) => !used[i]);
      if (next === undefined) return;
      used[next] = 1;
      const [p, q] = segs[next];
      const other = p.key === end.key ? q : p;
      if (forward) line.push(other); else line.unshift(other);
    }
  };
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const line = [...segs[i]];
    extend(line, true);
    extend(line, false);
    lines.push(line);
  }
  const d = lines
    .filter((line) => line.length > 2)
    .map((line) => {
      const closed = line[0].key === line[line.length - 1].key;
      const pts = closed ? line.slice(0, -1) : line;
      return `M${pts.map((p) => `${fmt(p.x)} ${fmt(p.y)}`).join("L")}${closed ? "Z" : ""}`;
    })
    .join("");
  const index = k % 5 === 0;
  paths.push(`<path d="${d}" stroke-width="${index ? 1.5 : 0.8}" stroke-opacity="${index ? 1 : 0.72}"/>`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke="#000" stroke-linejoin="round">${paths.join("")}</svg>\n`;
writeFileSync(new URL("../public/assets/realms/entry-map.svg", import.meta.url), svg);
console.log(`entry-map.svg: ${paths.length} contour levels, ${(svg.length / 1024).toFixed(1)} KB`);
