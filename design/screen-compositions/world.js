// Shared world renderer for the Realms screen artwork: a heightfield drawn as a tinted topographic map.
// Each composition defines window.WORLD = { height(x, y, noise), sea, palette } before loading this file.

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function createNoise(seed) {
  const random = mulberry32(seed);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
  const noise = (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const a = perm[X] + Y, b = perm[X + 1] + Y;
    return lerp(lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u), lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v);
  };
  return (x, y, octaves = 5) => {
    let sum = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) { sum += amp * noise(x * f, y * f); f *= 2.03; amp *= 0.5; }
    return sum;
  };
}
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function drawWorld(canvas) {
  const { height, sea, palette, seed = 7, step = 0.06 } = window.WORLD;
  const W = canvas.clientWidth, H = canvas.clientHeight, ratio = 2;
  canvas.width = W * ratio; canvas.height = H * ratio;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  const fbm = createNoise(seed);
  const cell = 4, cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
  const field = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) field[r * cols + c] = height(c * cell, r * cell, fbm);

  // Tinted elevation bands, upsampled smoothly.
  const img = new ImageData(cols, rows);
  const deep = hex(palette.deep), shallow = hex(palette.shallow), low = hex(palette.low), high = hex(palette.high);
  for (let i = 0; i < field.length; i++) {
    const h = field[i];
    let rgb;
    if (h < sea) rgb = mix(deep, shallow, Math.max(0, Math.min(1, 1 + (h - sea) / 0.35)));
    else { const band = Math.floor((h - sea) / step) * step; rgb = mix(low, high, Math.min(1, band / 0.7)); }
    img.data.set([...rgb, 255], i * 4);
  }
  const small = document.createElement('canvas');
  small.width = cols; small.height = rows;
  small.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(small, 0, 0, cols * cell, rows * cell);

  // Contours: land every step, the coastline brighter, the sea floor faint.
  const levels = [];
  for (let k = -4; k * step + sea < 1.2; k++) if (k !== 0) levels.push({ v: sea + k * step, k });
  levels.push({ v: sea, k: 0 });
  for (const { v, k } of levels) {
    ctx.beginPath();
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = field[r * cols + c], b = field[r * cols + c + 1], cc = field[(r + 1) * cols + c + 1], d = field[(r + 1) * cols + c];
      const pts = [];
      if ((a >= v) !== (b >= v)) pts.push([(c + (v - a) / (b - a)) * cell, r * cell]);
      if ((b >= v) !== (cc >= v)) pts.push([(c + 1) * cell, (r + (v - b) / (cc - b)) * cell]);
      if ((cc >= v) !== (d >= v)) pts.push([(c + (v - d) / (cc - d)) * cell, (r + 1) * cell]);
      if ((d >= v) !== (a >= v)) pts.push([c * cell, (r + (v - a) / (d - a)) * cell]);
      for (let i = 0; i + 1 < pts.length; i += 2) { ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); }
    }
    if (k === 0) { ctx.strokeStyle = palette.coast; ctx.lineWidth = 1.4; }
    else if (k < 0) { ctx.strokeStyle = palette.seaLine; ctx.lineWidth = 0.8; }
    else { ctx.strokeStyle = k % 4 === 0 ? palette.indexLine : palette.line; ctx.lineWidth = k % 4 === 0 ? 1 : 0.7; }
    ctx.stroke();
  }
}

// Helpers compositions use to shape their land.
window.gauss = (x, y, cx, cy, s, a) => a * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));
window.distToPath = (x, y, pts) => {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
};
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('canvas.world').forEach(drawWorld);
  document.body.dataset.ready = 'true';
});
