/* c01-imagined: film 0.0-8.0 (local 0 = film 0). 'Worlds imagined' (docs/storyboard-v4.md). The hook.
 *
 *   0.00  black; the amber SEED POINT at frame centre fires on frame one (core flash, a horizontal flare,
 *         a ring) and again on 0.25 (ba-dum).
 *   0.50-6.50  on EVERY beat the point imagines a different world. Hard cut on each beat: the new world is
 *         already blooming out of the point on its first frame and fills the frame in ~10 frames, each in
 *         its own generative technique, each composed around the point (which stays at frame centre):
 *           01 0.5 COASTLINE     glyph field scrambling, settling into a shaded relief (push out)
 *           02 1.0 MOUNTAINS     3D ridgelines rising from the point, a band of amber light rides the rows
 *           03 1.5 ORBITAL       rotating wireframe station (rings, spokes, spine) drawing on, spinning
 *           04 2.0 ARCHIPELAGO   isometric voxel islands extruding around a lagoon (the point)
 *           05 2.5 DUNE SEA      flow-field streamlines growing out of the point (warm map ground)
 *           06 3.0 FLOODGATE     the river valley contour map (Floodgate.productHeight), sonar reveal, the
 *                                point on the gate inside the objective ring (the film's one contour world)
 *           07 3.5 FOREST        a ground plane of thousands of growing pine strokes, the point in a clearing
 *           08 4.0 CANYON        engraving hatches on the brand slant, amber river on the floor
 *           09 4.5 CITY          dot-matrix night city, towers growing, red beacons
 *           10 5.0 WEATHER       isobars rippling out of a low (the point), cold / warm fronts drawing
 *           11 5.5 ICE SHELF     voronoi floes cracking open from the point
 *           12 6.0 VOLCANIC      concentric terraces extruding, the point in the glowing crater
 *         World tag bottom-left ('WORLD 07 · FOREST') scrambles on each cut; 12 ticks bottom-right count.
 *   1.30-2.00  IMAGINED (VO 'imagined' 1.34): ink letters burst out of the point into a word above it.
 *   5.13-6.00  DECISIONS (VO 'decisions' 5.20): amber letters roll like a slot and lock left to right.
 *   6.50  SNAP: world 12 shrinks into its tile while the other eleven burst out of the point into a
 *         4x3 catalogue (the point sits in the centre gutter); labels scramble in; 7.0 a scan lights the tiles.
 *   7.25-7.70  the tiles are sucked back into the point (power4.in, smear); 7.70 the point flares.
 *   7.75-8.0   black + the point charging (an implosion ring); the last frames lean along the slant
 *              (anticipating the 8.0 split in c02). Last frame: the point at frame centre.
 * Performance: one world per frame (4-30 ms canvas); the grid uses tile caches baked at build.
 */
(function () {
  'use strict';
  const ID = 'c01-imagined';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, CX = 960, CY = 540, FPS = 30;
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const MONO = '"JetBrains Mono Variable", monospace';
  const DISPLAY = '"Manrope Variable", sans-serif';

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sat = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => sat((t - a) / (b - a));
  const sm = (a, b, x) => { const t = seg(x, a, b); return t * t * (3 - 2 * t); };
  const eo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const p2o = (x) => 1 - (1 - x) * (1 - x);
  const p3o = (x) => 1 - (1 - x) * (1 - x) * (1 - x);
  const p4i = (x) => x * x * x * x;
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const rgba = (c, a) => { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; };
  const mixRgb = (c1, c2, t) => { const a = hexRgb(c1), b = hexRgb(c2); return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)); };
  const mixHex = (c1, c2, t, al) => { const m = mixRgb(c1, c2, t); return al == null ? `rgb(${m[0]},${m[1]},${m[2]})` : `rgba(${m[0]},${m[1]},${m[2]},${al})`; };
  function ih(a, b, c) {
    let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul((c | 0) + 1, 1274126177)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
  }

  // ---- timing ------------------------------------------------------------------------------------
  const T0 = 0.5, BEAT = 0.5, NW = 12;
  const T_GRID = 6.5, T_LAND = 6.7, T_SCAN = 7.0, T_COL = 7.25, T_COL_END = 7.7, T_DARK = 7.75;
  const IMG_PX = 276, DEC_PX = 236;
  const T_IMG = 1.3, T_IMG_END = 2.0, T_DEC = 5.08, T_DEC_END = 6.0;
  const RMAX = 1180;
  /** reveal front radius (screen px) u seconds into a world: starts at r0 of the frame (crisp cut), power3.out */
  const front = (u, d, r0) => RMAX * (r0 + (1 - r0) * p3o(sat(u / d)));

  // ---- shared drawing helpers ----------------------------------------------------------------------
  function ground(g, col) { g.fillStyle = col; g.fillRect(-20, -20, W + 40, H + 40); }
  /** clear everything outside the reveal front (soft edge). Screen space; skipped once the frame is full. */
  function maskFront(g, f, soft) {
    if (f >= RMAX - 1) return;
    const gr = g.createRadialGradient(CX, CY, Math.max(0, f - soft), CX, CY, f);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(-20, -20, W + 40, H + 40); g.restore();
  }
  /** thin bright ring riding the reveal front */
  function edgeRing(g, f, col, a, lw) {
    if (f >= RMAX - 1 || a <= 0.01) return;
    g.save(); g.strokeStyle = col; g.globalAlpha = a * (1 - f / RMAX); g.lineWidth = lw || 2;
    g.beginPath(); g.arc(CX, CY, Math.max(1, f - 6), 0, TAU); g.stroke(); g.restore();
  }
  /** orbit camera: target (tx,ty,tz), yaw/pitch (deg, pitch = looking down), dist, focal f; y is up.
   *  returns proj(x,y,z) -> writes [sx, sy, depth, scale] into out */
  function camera(o) {
    const cy = Math.cos(o.yaw * DEG), sy = Math.sin(o.yaw * DEG), cp = Math.cos(o.pitch * DEG), sp = Math.sin(o.pitch * DEG);
    const sx0 = o.sx == null ? CX : o.sx, sy0 = o.sy == null ? CY : o.sy;
    return (x, y, z, out) => {
      const X = x - o.tx, Y = y - o.ty, Z = z - o.tz;
      const x1 = X * cy - Z * sy, z1 = X * sy + Z * cy;
      const yv = Y * cp + z1 * sp, zv = -Y * sp + z1 * cp + o.dist;
      const s = o.f / Math.max(1, zv);
      out[0] = sx0 + x1 * s; out[1] = sy0 - yv * s; out[2] = zv; out[3] = s;
      return out;
    };
  }
  /** marching squares: segments of level v over a field (cols x rows nodes, spacing cell, origin ox/oy) */
  function contour(field, cols, rows, cell, v, ox, oy, out) {
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = field[r * cols + c], b = field[r * cols + c + 1], cc = field[(r + 1) * cols + c + 1], d = field[(r + 1) * cols + c];
      let n = 0; const px = [0, 0, 0, 0], py = [0, 0, 0, 0];
      if ((a >= v) !== (b >= v)) { px[n] = (c + (v - a) / (b - a)) * cell; py[n++] = r * cell; }
      if ((b >= v) !== (cc >= v)) { px[n] = (c + 1) * cell; py[n++] = (r + (v - b) / (cc - b)) * cell; }
      if ((cc >= v) !== (d >= v)) { px[n] = (c + (v - d) / (cc - d)) * cell; py[n++] = (r + 1) * cell; }
      if ((d >= v) !== (a >= v)) { px[n] = c * cell; py[n++] = (r + (v - a) / (d - a)) * cell; }
      for (let i = 0; i + 1 < n; i += 2) out.push(ox + px[i], oy + py[i], ox + px[i + 1], oy + py[i + 1]);
    }
    return out;
  }
  function strokeSegs(g, s) { g.beginPath(); for (let i = 0; i < s.length; i += 4) { g.moveTo(s[i], s[i + 1]); g.lineTo(s[i + 2], s[i + 3]); } g.stroke(); }
  function clipHalf(poly, mx, my, dx, dy) {
    const out = [], n = poly.length;
    for (let k = 0; k < n; k++) {
      const a = poly[k], b = poly[(k + 1) % n];
      const da = (a[0] - mx) * dx + (a[1] - my) * dy, db = (b[0] - mx) * dx + (b[1] - my) * dy;
      if (da <= 0) out.push(a);
      if ((da <= 0) !== (db <= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  }
  /** ramp through colour stops [[t, '#hex'], ...] -> [r,g,b] */
  function ramp(stops, t) {
    t = sat(t);
    for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const a = stops[i - 1], b = stops[i]; return mixRgb(a[1], b[1], (t - a[0]) / (b[0] - a[0])); }
    return hexRgb(stops[stops.length - 1][1]);
  }

  // =====================================================================================================
  // THE WORLDS. Each: { name, draw(g, u, k) }: draws the whole 1920x1080 frame (ground included) for
  // u seconds into its beat (0..0.5); k scales line widths (1 live, 2 for the catalogue tiles).
  // =====================================================================================================

  // ---- 01 COASTLINE: glyph field settling into shaded terrain ----------------------------------------
  function wCoast(ctx) {
    const n = ctx.noise2D('c01-coast');
    const hr = (x, y) => n.fbm(x / 640, y / 640, { octaves: 5 }) * 0.95 + 0.00042 * ((CX - x) * 0.95 + (CY - y) * 0.5);
    const h0 = hr(CX, CY) - 0.01;
    const hf = (x, y) => hr(x, y) - h0;
    // shaded relief, 640x360 -> full frame
    const rw = 960, rh = 540, sc = 2;
    const hs = new Float32Array((rw + 1) * (rh + 1));
    for (let y = 0; y <= rh; y++) for (let x = 0; x <= rw; x++) hs[y * (rw + 1) + x] = hf(x * sc - 0, y * sc - 0);
    const img = new ImageData(rw, rh);
    const L = [-0.62, -0.7, 0.36]; const ln = Math.hypot(...L); L[0] /= ln; L[1] /= ln; L[2] /= ln;
    const LAND = [[0, '#141110'], [0.35, '#3a3127'], [0.6, '#5a472f'], [0.82, '#a37a42'], [1, '#efbd70']];
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
      const h = hs[y * (rw + 1) + x], dx = hs[y * (rw + 1) + x + 1] - h, dy = hs[(y + 1) * (rw + 1) + x] - h;
      const nx = -dx * 70, ny = -dy * 70, nz = 1, nl = Math.hypot(nx, ny, nz);
      const lam = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / nl);
      let rgb;
      if (h < 0) { const dp = sat(-h / 0.22); rgb = mixRgb('#18211f', '#0b0c0e', Math.sqrt(dp)); }
      else rgb = ramp(LAND, lam * 0.78 + sat(h / 0.5) * 0.3);
      const i = (y * rw + x) * 4; img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2]; img.data[i + 3] = 255;
    }
    const small = document.createElement('canvas'); small.width = rw; small.height = rh; small.getContext('2d').putImageData(img, 0, 0);
    const relief = document.createElement('canvas'); relief.width = W; relief.height = H;
    const rg = relief.getContext('2d'); rg.imageSmoothingEnabled = true; rg.imageSmoothingQuality = 'high'; rg.drawImage(small, 0, 0, W, H);
    // glyph cells, sorted by distance from the point
    const CWd = 16, CHt = 24;
    const cells = [];
    for (let y = CHt / 2 - 6; y < H + CHt; y += CHt) for (let x = CWd / 2 - 4; x < W + CWd; x += CWd) {
      const h = hf(x, y), d = Math.hypot(x - CX, y - CY);
      let ch, b;
      if (Math.abs(h) < 0.014) { ch = '#'; b = 9; }
      else if (h < 0) { const w = n(x / 150, y / 46); ch = w > 0.25 ? '~' : w > -0.35 ? '·' : ' '; b = 8; }
      else { const band = Math.min(7, Math.floor(h / 0.05)); ch = '.:-=+*%@'[band]; b = band; }
      if (ch !== ' ') cells.push({ x, y, d, ch, b });
    }
    cells.sort((a, b) => a.d - b.d);
    const NB = 10;
    const BCOL = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => mixHex(C.amberDeep, C.amberLight, i / 7)).concat([C.bone, C.ink]);
    const BAL = [0.55, 0.6, 0.68, 0.75, 0.82, 0.9, 0.95, 1, 0.32, 1];
    const buckets = Array.from({ length: NB }, () => []);
    cells.forEach((c) => buckets[c.b].push(c));
    const SCR = '#%@*+=-:ABCDEFGHKMNRSTXZ';
    // the coastline itself: a crisp contour at sea level (and a fainter shelf line offshore)
    const cc = 6, ccol = Math.ceil(W / cc) + 1, crow = Math.ceil(H / cc) + 1, cf = new Float32Array(ccol * crow);
    for (let j = 0; j < crow; j++) for (let i = 0; i < ccol; i++) cf[j * ccol + i] = hf(i * cc, j * cc);
    const coastSeg = contour(cf, ccol, crow, cc, 0, 0, 0, []);
    const shelfSeg = contour(cf, ccol, crow, cc, -0.07, 0, 0, []);
    return {
      name: 'COASTLINE',
      draw(g, u, k) {
        ground(g, C.bg);
        const z = lerp(1.1, 1.0, p2o(sat(u / 0.5)));
        const f = front(u, 0.4, 0.3) / z;
        g.save(); g.translate(CX, CY); g.scale(z, z); g.translate(-CX, -CY);
        const shA = sm(0.1, 0.36, u);
        if (shA > 0.002) { g.globalAlpha = shA * 0.92; g.drawImage(relief, 0, 0); g.globalAlpha = 1; }
        g.lineCap = 'round';
        g.strokeStyle = rgba(C.bone, 0.3 * sm(0.06, 0.3, u)); g.lineWidth = 1.5 * k; strokeSegs(g, shelfSeg);
        g.strokeStyle = rgba(C.ink, 0.35 + 0.55 * sm(0.04, 0.26, u)); g.lineWidth = 2 * k; strokeSegs(g, coastSeg);
        const glA = 1 - 0.6 * shA, band = 190;
        g.font = `600 ${k > 1 ? 19 : 17}px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (let b = 0; b < NB; b++) {
          g.fillStyle = BCOL[b]; g.globalAlpha = glA * BAL[b];
          const arr = buckets[b];
          for (let i = 0; i < arr.length; i++) { const c = arr[i]; if (c.d > f - band) break; g.fillText(c.ch, c.x, c.y); }
        }
        // the settling band: scrambled glyphs, hot
        const fr = Math.floor(u * FPS);
        g.fillStyle = C.amberLight; g.globalAlpha = 0.95;
        let lo = 0, hi = cells.length;
        while (lo < hi) { const m = (lo + hi) >> 1; if (cells[m].d < f - band) lo = m + 1; else hi = m; }
        for (let i = lo; i < cells.length && cells[i].d <= f; i++) { const c = cells[i]; g.fillText(SCR[Math.floor(ih(i, fr, 3) * SCR.length)], c.x, c.y); }
        g.globalAlpha = 1; g.restore();
        maskFront(g, f * z, 40);
      },
    };
  }

  // ---- 02 MOUNTAINS: 3D ridgelines (unknown-pleasures rows, filled for occlusion) --------------------
  function wRidge(ctx) {
    const n = ctx.noise2D('c01-ridge');
    const NR = 66, NP = 230, XW = 3600, ZN = -1500, ZF = 3600;
    function ridged(x, z) { let s = 0, a = 0.5, fr = 1 / 950, nm = 0; for (let o = 0; o < 5; o++) { const v = 1 - Math.abs(n(x * fr, z * fr)); s += a * v * v; nm += a; a *= 0.5; fr *= 2.07; } return s / nm; }
    const hgt = (x, z) => {
      const pk = Math.exp(-(x * x + z * z) / (2 * 640 * 640));
      const range = Math.exp(-Math.pow((z - 900 - 0.25 * x) / 900, 2));       // a range running behind the peak
      return 230 * ridged(x, z) + 420 * range * ridged(x * 0.8 + 300, z * 0.8) + 1050 * pk * (0.72 + 0.28 * ridged(x * 1.7, z * 1.7));
    };
    const rows = [];
    for (let j = 0; j < NR; j++) {
      const z = ZF + (ZN - ZF) * Math.pow(j / (NR - 1), 1.0);
      const xs = new Float32Array(NP), hs = new Float32Array(NP), ds = new Float32Array(NP);
      for (let i = 0; i < NP; i++) { const x = -XW + 2 * XW * i / (NP - 1); xs[i] = x; hs[i] = hgt(x, z); ds[i] = Math.hypot(x, z); }
      // the row's end fades (in x) so no row ends in a hard stub
      const xw = 1500 + Math.max(0, z + 1500) * 0.55;
      rows.push({ z, xs, hs, ds, xw });
    }
    const HP = hgt(0, 0);
    const P = [0, 0, 0, 0];
    const px = new Float32Array(NP), py = new Float32Array(NP);
    return {
      name: 'MOUNTAINS',
      draw(g, u, k) {
        ground(g, C.bg);
        const fw = 4800 * (0.26 + 0.74 * p3o(sat(u / 0.42)));
        const gr0 = p3o(sat(fw / 900));
        const cam = camera({ tx: 0, ty: HP * gr0, tz: 0, yaw: lerp(-10, 3, p2o(sat(u / 0.5))), pitch: 19, dist: lerp(3150, 2850, p2o(sat(u / 0.5))), f: 1500 });
        g.lineJoin = 'round';
        for (let j = 0; j < NR; j++) {
          const R = rows[j];
          let any = false;
          for (let i = 0; i < NP; i++) {
            const grw = p3o(sat((fw - R.ds[i]) / 900));
            if (grw > 0) any = true;
            cam(R.xs[i], R.hs[i] * grw, R.z, P); px[i] = P[0]; py[i] = P[1];
          }
          g.beginPath(); g.moveTo(px[0], py[0]);
          for (let i = 1; i < NP; i++) g.lineTo(px[i], py[i]);
          g.lineTo(px[NP - 1], H + 40); g.lineTo(px[0], H + 40); g.closePath();
          g.fillStyle = C.bg; g.fill();
          const depthT = j / (NR - 1);
          const glow = Math.exp(-Math.pow((fw - Math.abs(R.z)) / 420, 2)) * (1 - sat(u / 0.5) * 0.6);
          g.beginPath(); g.moveTo(px[0], py[0]);
          for (let i = 1; i < NP; i++) g.lineTo(px[i], py[i]);
          const live = any ? 1 : 0.22;
          const lg = g.createLinearGradient(cam(-R.xw, 0, R.z, P)[0], 0, cam(R.xw, 0, R.z, P)[0], 0);
          const col = mixRgb(C.bone, C.amberLight, sat(glow * 1.3)), al = Math.min(1, (0.3 + 0.7 * depthT) * (1 + glow) * live);
          const cs = (a) => `rgba(${col[0]},${col[1]},${col[2]},${a})`;
          lg.addColorStop(0, cs(0)); lg.addColorStop(0.18, cs(al)); lg.addColorStop(0.82, cs(al)); lg.addColorStop(1, cs(0));
          g.strokeStyle = lg;
          g.lineWidth = (1.5 + 0.8 * depthT) * k;
          g.stroke();
        }
      },
    };
  }

  // ---- 03 ORBITAL STATION: rotating wireframe ----------------------------------------------------------
  function wStation(ctx) {
    const r = ctx.rng('c01-stars');
    const stars = Array.from({ length: 260 }, () => [r() * W, r() * H, r.range(0.8, 2.2), r.range(0.1, 0.55)]);
    const R = 440, TR = 40;
    const lines = []; // { pts: Float32Array xyz..., kind }
    const add = (kind, fn, nPts) => { const a = new Float32Array(nPts * 3); for (let i = 0; i < nPts; i++) { const p = fn(i / (nPts - 1)); a[i * 3] = p[0]; a[i * 3 + 1] = p[1]; a[i * 3 + 2] = p[2]; } lines.push({ pts: a, kind }); };
    for (const ph of [0, 60, 120, 180, 240, 300]) { const c = Math.cos(ph * DEG), s = Math.sin(ph * DEG); add(ph === 0 || ph === 180 ? 'ring' : 'ring2', (t) => [Math.cos(t * TAU) * (R + TR * c), TR * s, Math.sin(t * TAU) * (R + TR * c)], 140); }
    for (let i = 0; i < 36; i++) { const th = i * 10 * DEG; add('sec', (t) => { const ph = t * TAU; return [Math.cos(th) * (R + TR * Math.cos(ph)), TR * Math.sin(ph), Math.sin(th) * (R + TR * Math.cos(ph))]; }, 18); }
    for (let i = 0; i < 6; i++) { const th = (i * 60 + 15) * DEG; for (const yy of [-7, 7]) add('spoke', (t) => [Math.cos(th) * lerp(74, R - TR, t), yy, Math.sin(th) * lerp(74, R - TR, t)], 2); }
    for (const yy of [-46, 46]) add('hub', (t) => [Math.cos(t * TAU) * 74, yy, Math.sin(t * TAU) * 74], 40);
    for (let i = 0; i < 10; i++) { const th = i * 36 * DEG; add('hub', (t) => [Math.cos(th) * 74, lerp(-46, 46, t), Math.sin(th) * 74], 2); }
    add('spine', (t) => [0, lerp(-470, 330, t), 0], 2);
    for (const [yy, rr] of [[300, 170], [250, 170], [-430, 70], [-380, 90]]) add('dock', (t) => [Math.cos(t * TAU) * rr, yy, Math.sin(t * TAU) * rr], 56);
    add('outer', (t) => [Math.cos(t * TAU) * 640, 0, Math.sin(t * TAU) * 640], 180);
    const beacons = [0, 1, 2, 3, 4, 5].map((i) => (i * 60 + 15) * DEG);
    const COL = { ring: C.amberLight, ring2: C.amber, sec: C.bone, spoke: C.ink, hub: C.bone, spine: C.amber, dock: C.bone, outer: C.bone };
    const LW = { ring: 2.8, ring2: 1.8, sec: 1.6, spoke: 2.0, hub: 1.8, spine: 2.0, dock: 1.8, outer: 1.6 };
    const kinds = Object.keys(COL);
    return {
      name: 'ORBITAL STATION',
      draw(g, u, k) {
        ground(g, '#0b0c0e');
        g.fillStyle = C.bone;
        for (const s of stars) { g.globalAlpha = s[3]; g.fillRect(s[0], s[1], s[2], s[2]); }
        g.globalAlpha = 1;
        const grow = p3o(sat(u / 0.36)), sc = lerp(0.6, 1, grow) * lerp(0.98, 1.04, sat(u / 0.5));
        const frac = lerp(0.4, 1, p3o(sat(u / 0.4)));
        const spin = 0.25 + 0.9 * p3o(sat(u / 0.5)) + u * 0.5, tilt = lerp(70, 62, p2o(sat(u / 0.5))) * DEG, roll = -16 * DEG;
        const cs = Math.cos(spin), ss = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt), cr = Math.cos(roll), sr = Math.sin(roll);
        const Fz = 1500, Dz = 1750;
        const proj = (x, y, z, o) => {
          const x1 = x * cs - z * ss, z1 = x * ss + z * cs;            // spin about the axis
          const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;          // tilt toward the camera
          const x3 = x1 * cr - y2 * sr, y3 = x1 * sr + y2 * cr;        // roll
          const s = Fz / (Dz + z2 * sc);
          o[0] = CX + x3 * sc * s; o[1] = CY - y3 * sc * s; o[2] = z2; return o;
        };
        const P = [0, 0, 0], Q = [0, 0, 0];
        g.lineCap = 'round';
        for (const kind of kinds) for (let pass = 0; pass < 2; pass++) {
          // pass 0: far half (dim), pass 1: near half (bright)
          g.beginPath();
          for (const L of lines) {
            if (L.kind !== kind) continue;
            const np = L.pts.length / 3, m = Math.max(2, Math.round(np * frac));
            proj(L.pts[0], L.pts[1], L.pts[2], P);
            for (let i = 1; i < m; i++) {
              proj(L.pts[i * 3], L.pts[i * 3 + 1], L.pts[i * 3 + 2], Q);
              const near = (P[2] + Q[2]) < 0;
              if (near === (pass === 1)) { g.moveTo(P[0], P[1]); g.lineTo(Q[0], Q[1]); }
              P[0] = Q[0]; P[1] = Q[1]; P[2] = Q[2];
            }
          }
          g.strokeStyle = COL[kind]; g.globalAlpha = pass ? 1 : 0.42; g.lineWidth = LW[kind] * k * (pass ? 1.1 : 0.85);
          g.stroke();
        }
        g.globalAlpha = 1;
        // red beacons at the spoke roots on the ring, blinking
        const fr = Math.floor(u * FPS);
        beacons.forEach((th, i) => {
          if (((fr + i * 2) >> 1) % 3 === 0 || frac < 0.5) return;
          proj(Math.cos(th) * (R + TR + 6), 0, Math.sin(th) * (R + TR + 6), P);
          g.fillStyle = C.rival; g.beginPath(); g.arc(P[0], P[1], 4.5 * Math.sqrt(k), 0, TAU); g.fill();
        });
      },
    };
  }

  // ---- 04 ARCHIPELAGO: isometric voxel islands ----------------------------------------------------------
  function wVoxel(ctx) {
    const n = ctx.noise2D('c01-arch');
    const N = 32, TW = 36, TH = 18, LH = 13;
    const cols = [], sea = [];
    for (let s = -2 * N; s <= 2 * N; s++) for (let i = -N; i < N; i++) {
      const j = s - i; if (j < -N || j >= N) continue;
      const v = n.fbm((i + 0.5) / 11, (j + 0.5) / 11, { octaves: 4 }) * 1.05 + 0.18 * n(i / 3.3 + 40, j / 3.3) - 0.03
        - 0.5 * Math.exp(-((i + 0.5) ** 2 + (j + 0.5) ** 2) / (2 * 2.6 * 2.6));
      const sx = CX + (i - j) * TW / 2, sy = CY + (i + j + 1) * TH / 2;
      const d = Math.hypot(sx - CX, (sy - CY) * 1.5);
      const edge = 1 - sm(0.78, 1.0, Math.max(Math.abs(i + 0.5), Math.abs(j + 0.5)) / N);
      if (v > 0.05) cols.push({ sx, sy, d, L: Math.min(9, 1 + Math.floor((v - 0.05) / 0.05)), e: edge });
      else if ((i + j) % 2 === 0) sea.push({ sx, sy, d, e: edge, w: n(i / 5, j / 5 + 9) });
    }
    const TOP = [], LEFT = [], RIGHT = [];
    for (let L = 0; L <= 9; L++) {
      const t = L / 9;
      TOP.push(L <= 1 ? mixHex(C.bone, C.amberLight, 0.3) : `rgb(${ramp([[0, '#5a472f'], [0.45, '#a37a42'], [0.8, '#efbd70'], [1, '#f6d39f']], (L - 1) / 8).join(',')})`);
      LEFT.push(mixHex('#3a3127', C.amberDeep, t * 0.8));
      RIGHT.push(mixHex('#1a1611', '#3a3127', t));
    }
    return {
      name: 'ARCHIPELAGO',
      draw(g, u, k) {
        ground(g, C.bg);
        const f = front(u, 0.4, 0.3);
        const z = lerp(0.93, 1.0, p2o(sat(u / 0.5)));
        g.save(); g.translate(CX, CY); g.scale(z, z); g.translate(-CX, -CY + lerp(16, 0, p2o(sat(u / 0.5))));
        g.fillStyle = C.bone;
        for (const s of sea) { if (s.d > f) continue; g.globalAlpha = (0.1 + 0.12 * (s.w > 0.3)) * s.e; g.fillRect(s.sx - 6, s.sy, 12, 1.6 * k); }
        g.globalAlpha = 1;
        for (const c of cols) {
          const gr = p3o(sat((f - c.d) / 260));
          if (gr <= 0) continue;
          const h = c.L * LH * gr, x = c.sx, y = c.sy, hw = TW / 2, hh = TH / 2;
          g.globalAlpha = c.e;
          g.fillStyle = LEFT[c.L]; g.beginPath(); g.moveTo(x - hw, y - h); g.lineTo(x, y - h + hh); g.lineTo(x, y + hh); g.lineTo(x - hw, y); g.closePath(); g.fill();
          g.fillStyle = RIGHT[c.L]; g.beginPath(); g.moveTo(x, y - h + hh); g.lineTo(x + hw, y - h); g.lineTo(x + hw, y); g.lineTo(x, y + hh); g.closePath(); g.fill();
          g.fillStyle = TOP[c.L]; g.beginPath(); g.moveTo(x, y - h - hh); g.lineTo(x + hw, y - h); g.lineTo(x, y - h + hh); g.lineTo(x - hw, y - h); g.closePath(); g.fill();
        }
        g.globalAlpha = 1; g.restore();
      },
    };
  }

  // ---- 05 DUNE SEA: flow-field streamlines -------------------------------------------------------------
  function wDunes(ctx) {
    const n = ctx.noise2D('c01-dune');
    const r = ctx.rng('c01-dune');
    const ang = (x, y) => -0.22 + 0.8 * n(x / 820, y / 820) + 0.28 * n(x / 260 + 9, y / 260 - 4);
    const crest = (x, y) => Math.sin((y * 0.92 + x * 0.3 + 150 * n(x / 420 + 3, y / 420)) / 44);
    const NS = 18, STEP = 7.5; // points each way from the seed
    const lines = [[], [], [], []];
    const SP = 30;
    for (let y = -160; y < H + 160; y += SP) for (let x = -160; x < W + 160; x += SP) {
      const sx = x + r.range(-SP / 2, SP / 2), sy = y + r.range(-SP / 2, SP / 2);
      const pts = new Float32Array((2 * NS + 1) * 2);
      pts[NS * 2] = sx; pts[NS * 2 + 1] = sy;
      for (const dir of [1, -1]) {
        let px = sx, py = sy;
        for (let i = 1; i <= NS; i++) { const a = ang(px, py); px += Math.cos(a) * STEP * dir; py += Math.sin(a) * STEP * dir; const idx = NS + dir * i; pts[idx * 2] = px; pts[idx * 2 + 1] = py; }
      }
      const c = crest(sx, sy), b = c > 0.55 ? 3 : c > 0.05 ? 2 : c > -0.5 ? 1 : 0;
      lines[b].push({ pts, d: Math.hypot(sx - CX, sy - CY) });
    }
    const COL = [rgba(C.amberLine, 0.9), rgba(C.amberDeep, 0.85), rgba(C.amber, 0.85), rgba(C.amberLight, 0.95)];
    return {
      name: 'DUNE SEA',
      draw(g, u, k) {
        ground(g, C.map);
        const f = front(u, 0.42, 0.26);
        const q = p2o(sat(u / 0.5));
        g.save(); g.translate(CX, CY); g.rotate(lerp(4, 0, q) * DEG); g.scale(lerp(1.06, 1.0, q), lerp(1.06, 1.0, q)); g.translate(-CX, -CY);
        g.lineCap = 'round'; g.lineJoin = 'round';
        for (let b = 0; b < 4; b++) {
          g.beginPath();
          for (const L of lines[b]) {
            const vis = sat((f - L.d) / 280); if (vis <= 0) continue;
            const m = Math.max(1, Math.round(vis * NS));
            const a = NS - m, z = NS + m;
            g.moveTo(L.pts[a * 2], L.pts[a * 2 + 1]);
            for (let i = a + 1; i <= z; i++) g.lineTo(L.pts[i * 2], L.pts[i * 2 + 1]);
          }
          g.strokeStyle = COL[b]; g.lineWidth = (b === 3 ? 1.9 : 1.55) * k; g.stroke();
        }
        g.restore();
      },
    };
  }

  // ---- 06 FLOODGATE: the river valley contour map (the film's one contour world) ------------------------
  function wValley(ctx) {
    const ph = Floodgate.productHeight(58);
    const PAL = Floodgate.PAL;
    const PX = 1.75;                          // canvas px per product unit (= screen px at zoom 1)
    const X0 = 140, Y0 = -100, UW = 1320, UH = 1320; // product region baked
    const cw = Math.round(UW * PX), chh = Math.round(UH * PX);
    const CELL = 6, cols = Math.ceil(cw / CELL) + 1, rows = Math.ceil(chh / CELL) + 1;
    const field = new Float32Array(cols * rows);
    let lo = Infinity, hi = -Infinity;
    for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) { const v = ph(X0 + c * CELL / PX, Y0 + rr * CELL / PX); field[rr * cols + c] = v; lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const SEA = 0.18, STEP = 0.06;
    const mk = () => { const c = document.createElement('canvas'); c.width = cw; c.height = chh; return c; };
    const base = mk(), bg = base.getContext('2d');
    bg.fillStyle = C.map; bg.fillRect(0, 0, cw, chh);
    { // tint
      const img = new ImageData(cols, rows), Lc = hexRgb(PAL.low), Hc = hexRgb(PAL.high), Wt = hexRgb(PAL.water), S2 = hexRgb(PAL.waterShallow);
      for (let i = 0; i < field.length; i++) {
        const v = field[i]; let rgb;
        if (v < SEA) { const tt = sat(1 + (v - SEA) / 0.35); rgb = [0, 1, 2].map((j) => Wt[j] + (S2[j] - Wt[j]) * tt); }
        else { const tt = sat((Math.floor((v - SEA) / STEP) * STEP) / 0.7); rgb = [0, 1, 2].map((j) => Lc[j] + (Hc[j] - Lc[j]) * tt); }
        img.data[i * 4] = rgb[0] * 0.62; img.data[i * 4 + 1] = rgb[1] * 0.62; img.data[i * 4 + 2] = rgb[2] * 0.62; img.data[i * 4 + 3] = 255;
      }
      const s = document.createElement('canvas'); s.width = cols; s.height = rows; s.getContext('2d').putImageData(img, 0, 0);
      bg.imageSmoothingEnabled = true; bg.drawImage(s, 0, 0, cols * CELL, rows * CELL);
    }
    const bright = mk(), brg = bright.getContext('2d');
    bg.lineCap = brg.lineCap = 'round';
    for (let v = SEA - Math.floor((SEA - lo) / STEP) * STEP, kk = -Math.floor((SEA - lo) / STEP); v < hi; v += STEP, kk++) {
      const segs = contour(field, cols, rows, CELL, v, 0, 0, []);
      const coast = kk === 0, under = v < SEA - 1e-6, idx = kk % 4 === 0;
      if (coast) { bg.strokeStyle = PAL.coast; bg.lineWidth = 2.2; }
      else if (under) { bg.strokeStyle = PAL.seaLine; bg.lineWidth = 1.2; }
      else { bg.strokeStyle = rgba(C.amber, idx ? 0.42 : 0.24); bg.lineWidth = idx ? 2.0 : 1.4; }
      strokeSegs(bg, segs);
      if (!under) { brg.strokeStyle = rgba(C.amberLight, idx || coast ? 1 : 0.75); brg.lineWidth = idx || coast ? 2.6 : 1.8; strokeSegs(brg, segs); }
    }
    const scratch = document.createElement('canvas'); scratch.width = W; scratch.height = H; const sg = scratch.getContext('2d');
    const GATE = [800, 560];
    const tri = (g, x, y, s) => { g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 1.15, y + s); g.lineTo(x - s * 1.15, y + s); g.closePath(); g.fill(); };
    function place(g, u) {
      const q = p2o(sat(u / 0.5));
      g.translate(CX, CY); g.rotate(lerp(-10, -3, q) * DEG); const z = lerp(0.9, 1.0, q); g.scale(z, z);
    }
    return {
      name: 'FLOODGATE',
      draw(g, u, k) {
        ground(g, C.map);
        const f = front(u, 0.44, 0.28);
        g.save(); place(g, u);
        g.drawImage(base, -(GATE[0] - X0) * PX, -(GATE[1] - Y0) * PX);
        // product marks (product units -> px)
        g.scale(PX, PX); g.translate(-GATE[0], -GATE[1]);
        g.lineCap = 'round';
        g.strokeStyle = rgba(C.amber, 0.75); g.lineWidth = 2.4 * k / PX; g.setLineDash([3 / PX * 2, 7 / PX * 2]);
        g.beginPath(); g.moveTo(594, 399); g.bezierCurveTo(640, 420, 690, 470, 760, 540); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#2a2219'; g.strokeStyle = C.amber; g.lineWidth = 2 * k / PX;
        g.beginPath(); g.rect(530, 376, 64, 46); g.fill(); g.stroke();
        g.save(); g.translate(800, 560); g.rotate(-32 * DEG); g.beginPath(); g.rect(-58, -12, 116, 24); g.fill(); g.stroke(); g.restore();
        g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 5 / PX * 1.6; g.beginPath(); g.arc(800, 560, 64, 0, TAU); g.stroke();
        const prog = lerp(0.1, 0.62, p3o(sat((u - 0.05) / 0.4)));
        g.strokeStyle = C.amber; g.lineWidth = 6 / PX * 1.6; g.beginPath(); g.arc(800, 560, 64, -Math.PI / 2, -Math.PI / 2 + prog * TAU); g.stroke();
        g.fillStyle = C.rival; tri(g, 1118, 342, 12); tri(g, 1140, 524, 12);
        g.strokeStyle = '#e6d6b8'; g.lineWidth = 2.2 / PX * 1.6; g.beginPath(); g.moveTo(948, 340); g.lineTo(1060, 440); g.moveTo(936, 352); g.lineTo(1048, 452); g.stroke();
        g.restore();
        // sonar: bright contours through a ring riding the front
        if (f < RMAX - 1) {
          sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, W, H);
          sg.save(); place(sg, u); sg.drawImage(bright, -(GATE[0] - X0) * PX, -(GATE[1] - Y0) * PX); sg.restore();
          const gr = sg.createRadialGradient(CX, CY, Math.max(0, f - 240), CX, CY, f);
          gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.8, 'rgba(0,0,0,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          sg.globalCompositeOperation = 'destination-in'; sg.fillStyle = gr; sg.fillRect(0, 0, W, H);
          sg.globalCompositeOperation = 'source-over';
          g.drawImage(scratch, 0, 0);
        }
        maskFront(g, f, 30);
      },
    };
  }

  // ---- 07 FOREST: a ground plane of growing pine strokes ---------------------------------------------
  function wForest(ctx) {
    const n = ctx.noise2D('c01-forest');
    const r = ctx.rng('c01-forest');
    const trees = [];
    for (let i = 0; i < 12000 && trees.length < 5200; i++) {
      const z = r.range(-950, 4600), x = r.range(-1, 1) * (1200 + Math.max(0, z + 950) * 0.95);
      const dens = n(x / 760, z / 760) + 0.35 * n(x / 210, z / 210);
      const d = Math.hypot(x, z);
      if (dens < -0.42 || d < 190 + 70 * n(x / 90, z / 90)) continue;
      trees.push({ x, z, h: r.range(70, 150) * (0.85 + 0.3 * dens), lean: r.range(-0.07, 0.07), d });
    }
    trees.sort((a, b) => b.z - a.z);
    const NB = 6;
    const COLS = [0, 1, 2, 3, 4, 5].map((i) => mixHex(C.amberLine, i < 3 ? C.amberDeep : C.bone, i / 5));
    const P = [0, 0, 0, 0];
    const paths = Array.from({ length: NB }, () => null);
    return {
      name: 'FOREST',
      draw(g, u, k) {
        ground(g, C.bg);
        const q = p2o(sat(u / 0.5));
        const cam = camera({ tx: 0, ty: 0, tz: 0, yaw: lerp(-7, 3, q), pitch: 15, dist: 1550, f: 1500 });
        // horizon haze
        cam(0, 0, 9000, P);
        const hz = P[1];
        const hg = g.createLinearGradient(0, hz - 120, 0, hz + 160);
        hg.addColorStop(0, rgba(C.amber, 0)); hg.addColorStop(0.45, rgba(C.amber, 0.07)); hg.addColorStop(1, rgba(C.amber, 0));
        g.fillStyle = hg; g.fillRect(0, hz - 120, W, 280);
        const fw = 5200 * (0.16 + 0.84 * p3o(sat(u / 0.42)));
        for (let b = 0; b < NB; b++) paths[b] = new Path2D();
        for (const t of trees) {
          const grw = p3o(sat((fw - t.d) / 520)); if (grw <= 0) continue;
          cam(t.x, 0, t.z, P);
          if (P[2] < 60) continue;
          const bx = P[0], by = P[1], s = P[3];
          if (bx < -60 || bx > W + 60 || by < -10 || by > H + 400) continue;
          const hp = t.h * s * grw;
          const b = Math.min(NB - 1, Math.floor(clamp(s, 0, 2.2) / 2.2 * NB * 1.4));
          const p = paths[b];
          const tx = bx + t.lean * hp, ty = by - hp;
          p.moveTo(bx, by); p.lineTo(tx, ty);
          for (const fr of [0.38, 0.58, 0.78]) {
            const cxp = bx + t.lean * hp * fr, cyp = by - hp * fr, wv = hp * 0.2 * (1.05 - fr);
            p.moveTo(cxp - wv, cyp + wv * 0.75); p.lineTo(cxp, cyp - wv * 0.15); p.lineTo(cxp + wv, cyp + wv * 0.75);
          }
        }
        g.lineCap = 'round'; g.lineJoin = 'round';
        for (let b = 0; b < NB; b++) { g.strokeStyle = COLS[b]; g.globalAlpha = 0.45 + 0.55 * b / (NB - 1); g.lineWidth = (1.4 + 0.25 * b) * k; g.stroke(paths[b]); }
        g.globalAlpha = 1;
        // the clearing ring around the point
        g.strokeStyle = rgba(C.amber, 0.55 * sm(0.05, 0.25, u)); g.lineWidth = 1.8 * k; g.beginPath();
        for (let i = 0; i <= 64; i++) { cam(Math.cos(i / 64 * TAU) * 150, 0, Math.sin(i / 64 * TAU) * 150, P); if (i) g.lineTo(P[0], P[1]); else g.moveTo(P[0], P[1]); }
        g.stroke();
      },
    };
  }

  // ---- 08 CANYON: engraving hatches on the brand slant ---------------------------------------------------
  function wCanyon(ctx) {
    const n = ctx.noise2D('c01-canyon');
    const OX = 150, OY = 120, CW = W + 2 * OX, CH = H + 2 * OY;
    const yc0 = (x) => 170 * Math.sin((x - CX) / 340) + 70 * Math.sin((x - CX) / 128 + 0.7);
    const off = yc0(CX);
    const ycen = (x) => CY + yc0(x) - off;
    const hgt = (x, y) => {
      const d = Math.abs(y - ycen(x)) * Math.cos(Math.atan(Math.cos((x - CX) / 340) * 0.5));
      const w = 64 + 26 * n(x / 260, 3.3);
      let t = sat((d - w * 0.35) / (w * 3.6));
      const steps = 4; const tt = t * steps, fl = Math.floor(tt), fr = tt - fl;
      t = (fl + sm(0.55, 1, fr)) / steps;
      return t * 1.0 + 0.07 * n.fbm(x / 170, y / 170, { octaves: 3 });
    };
    // darkness on a 4 px grid (canvas coords = screen + OX/OY)
    const GS = 4, gc = Math.ceil(CW / GS) + 2, gr = Math.ceil(CH / GS) + 2;
    const hh = new Float32Array(gc * gr);
    for (let j = 0; j < gr; j++) for (let i = 0; i < gc; i++) hh[j * gc + i] = hgt(i * GS - OX, j * GS - OY);
    const dark = new Float32Array(gc * gr);
    for (let j = 1; j < gr - 1; j++) for (let i = 1; i < gc - 1; i++) {
      const gx = (hh[j * gc + i + 1] - hh[j * gc + i - 1]) / (2 * GS), gy = (hh[(j + 1) * gc + i] - hh[(j - 1) * gc + i]) / (2 * GS);
      const lit = -(gx * -0.75 + gy * -0.66) * 160;           // light from the upper left
      const slope = Math.hypot(gx, gy) * 120;
      const floor = hh[j * gc + i] < 0.05 ? 0.25 : 0;
      dark[j * gc + i] = clamp(0.32 + slope * 0.55 - lit * 0.9 + floor, 0, 1.2);
    }
    const dAt = (x, y) => { const i = clamp(Math.round(x / GS), 0, gc - 1), j = clamp(Math.round(y / GS), 0, gr - 1); return dark[j * gc + i]; };
    const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
    const cg = cv.getContext('2d'); cg.lineCap = 'butt';
    function hatch(angDeg, spacing, thr, col, lw) {
      const a = angDeg * DEG, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
      const diag = Math.hypot(CW, CH), cxm = CW / 2, cym = CH / 2;
      cg.strokeStyle = col; cg.lineWidth = lw; cg.beginPath();
      for (let o = -diag / 2; o <= diag / 2; o += spacing) {
        let on = false, sx = 0, sy = 0;
        for (let s = -diag / 2; s <= diag / 2; s += 3) {
          const x = cxm + nx * o + dx * s, y = cym + ny * o + dy * s;
          const inside = x >= 0 && y >= 0 && x < CW && y < CH;
          const v = inside && dAt(x, y) > thr + 0.08 * n(x / 30, y / 30);
          if (v && !on) { on = true; sx = x; sy = y; } else if (!v && on) { on = false; cg.moveTo(sx, sy); cg.lineTo(x, y); }
        }
      }
      cg.stroke();
    }
    hatch(-34, 7, 0.42, rgba(C.bone, 0.85), 1.6);
    hatch(56, 7, 0.66, rgba(C.bone, 0.75), 1.5);
    hatch(0, 9, 0.86, rgba(C.amberDeep, 0.9), 1.5);
    // rim lines (plateau edges) + the river
    const rim = [];
    { const cs = 8, c2 = Math.ceil(CW / cs) + 1, r2 = Math.ceil(CH / cs) + 1, f2 = new Float32Array(c2 * r2);
      for (let j = 0; j < r2; j++) for (let i = 0; i < c2; i++) f2[j * c2 + i] = hgt(i * cs - OX, j * cs - OY);
      for (const v of [0.22, 0.47, 0.72, 0.96]) contour(f2, c2, r2, cs, v, 0, 0, rim); }
    cg.strokeStyle = rgba(C.bone, 0.9); cg.lineWidth = 1.6; cg.lineCap = 'round'; strokeSegs(cg, rim);
    cg.strokeStyle = C.amber; cg.lineWidth = 3; cg.beginPath();
    for (let x = -OX; x <= W + OX; x += 6) { const y = ycen(x) + 10 * n(x / 90, 1.7); if (x === -OX) cg.moveTo(x + OX, y + OY); else cg.lineTo(x + OX, y + OY); }
    cg.stroke();
    return {
      name: 'CANYON',
      draw(g, u, k) {
        ground(g, C.bg);
        const q = p2o(sat(u / 0.5));
        g.save(); g.translate(CX, CY); g.rotate(lerp(5, 0.5, q) * DEG); const z = lerp(1.14, 1.02, q); g.scale(z, z); g.translate(-CX, -CY);
        g.drawImage(cv, -OX, -OY); g.restore();
        const hw = front(u, 0.4, 0.14) * 0.75;
        if (hw < RMAX * 0.75 - 1) {
          const a = -B.SLANT * DEG, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, L = 2400;
          g.save(); g.globalCompositeOperation = 'destination-in'; g.fillStyle = '#000'; g.beginPath();
          g.moveTo(CX - dx * L + nx * hw, CY - dy * L + ny * hw); g.lineTo(CX + dx * L + nx * hw, CY + dy * L + ny * hw);
          g.lineTo(CX + dx * L - nx * hw, CY + dy * L - ny * hw); g.lineTo(CX - dx * L - nx * hw, CY - dy * L - ny * hw); g.closePath(); g.fill(); g.restore();
          g.strokeStyle = rgba(C.amberLight, 0.9 * (1 - hw / (RMAX * 0.75))); g.lineWidth = 2.4 * k; g.beginPath();
          for (const sgn of [1, -1]) { g.moveTo(CX - dx * L + sgn * nx * hw, CY - dy * L + sgn * ny * hw); g.lineTo(CX + dx * L + sgn * nx * hw, CY + dy * L + sgn * ny * hw); }
          g.stroke();
        }
      },
    };
  }

  // ---- 09 CITY: dot-matrix night grid ---------------------------------------------------------------
  function wCity(ctx) {
    const r = ctx.rng('c01-city'), n = ctx.noise2D('c01-city');
    const U = 26, BL = 6, NB = 7;                              // lattice unit (px), block pitch (units), blocks per side
    const pts = { street: [], edge: [], win: [], winA: [], beacon: [] };
    const push = (arr, x, y, z, d) => arr.push(x, y, z, d);
    const LIM = NB * BL;
    for (let a = -LIM; a <= LIM; a += 0.5) for (let b = -LIM; b <= LIM; b += 0.5) {
      if (Math.abs(a % BL) < 1e-6 || Math.abs(b % BL) < 1e-6) push(pts.street, a * U, 0, b * U, Math.hypot(a, b) * U);
    }
    for (let bi = -NB; bi < NB; bi++) for (let bj = -NB; bj < NB; bj++) {
      const x0 = bi * BL + 1, z0 = bj * BL + 1;                  // block interior: 4 x 4 units
      const lots = r() < 0.45 ? [[0, 0, 4, 4]] : r() < 0.5 ? [[0, 0, 1.5, 4], [2.5, 0, 1.5, 4]] : [[0, 0, 4, 1.5], [0, 2.5, 1.5, 1.5], [2.5, 2.5, 1.5, 1.5]];
      const dc = Math.hypot(bi + 0.5, bj + 0.5);
      for (const [lx, lz, lw, ld] of lots) {
        const hb = Math.max(1, Math.round((1.5 + 17 * Math.exp(-dc * dc / (2 * 2.4 * 2.4)) * (0.4 + 0.6 * r())) * (0.85 + 0.3 * n(bi * 0.7, bj * 0.7))));
        const X0 = x0 + lx, Z0 = z0 + lz, X1 = X0 + lw, Z1 = Z0 + ld;
        const dd = Math.hypot((X0 + X1) / 2, (Z0 + Z1) / 2) * U;
        const lit = 0.3 + 0.35 * r();
        for (let y = 0; y <= hb; y += 0.5) {
          const roof = y === hb;
          for (let x = X0; x <= X1 + 1e-6; x += 0.5) for (const z of [Z0, Z1]) {
            const corner = Math.abs(x - X0) < 1e-6 || Math.abs(x - X1) < 1e-6;
            if (corner || roof) push(pts.edge, x * U, y * U, z * U, dd);
            else if (z === Z0 && y > 0 && r() < lit) push(r() < 0.22 ? pts.winA : pts.win, x * U, y * U, z * U, dd);
          }
          for (let z = Z0 + 0.5; z < Z1 - 1e-6; z += 0.5) for (const x of [X0, X1]) {
            if (roof) push(pts.edge, x * U, y * U, z * U, dd);
            else if (x === X0 && y > 0 && r() < lit) push(r() < 0.22 ? pts.winA : pts.win, x * U, y * U, z * U, dd);
          }
        }
        if (hb >= 11) push(pts.beacon, (X0 + X1) / 2 * U, (hb + 1) * U, (Z0 + Z1) / 2 * U, dd);
      }
    }
    const F = {}; for (const kk in pts) F[kk] = new Float32Array(pts[kk]);
    // traffic: light dots running along the avenues (a pure function of u)
    const cars = Array.from({ length: 90 }, () => ({ ax: r() < 0.5, lane: (r.int(-NB, NB)) * BL, off: r() * 2 * LIM, sp: r.range(6, 14) * r.sign(), side: r.sign() * 0.18 }));
    const STYLE = { street: [C.amber, 0.95, 3.0], edge: [C.bone, 0.42, 2.2], win: [C.bone, 0.9, 2.6], winA: [C.amberLight, 1, 2.8], beacon: [C.rival, 1, 6] };
    const P = [0, 0, 0, 0];
    return {
      name: 'CITY',
      draw(g, u, k) {
        ground(g, C.bg);
        const q = p2o(sat(u / 0.5));
        const cam = camera({ tx: 0, ty: 40, tz: 0, yaw: lerp(28, 40, q), pitch: lerp(36, 31, q), dist: lerp(1500, 1300, q), f: 1500 });
        const fw = 2400 * (0.22 + 0.78 * p3o(sat(u / 0.4)));
        const fr = Math.floor(u * FPS);
        // street glow: the avenues as soft amber lines under the dots
        g.strokeStyle = rgba(C.amber, 0.22); g.lineWidth = 3 * k; g.beginPath();
        const fu = fw / U;
        for (let l = -NB; l <= NB; l++) {
          const c = l * BL, e = Math.sqrt(Math.max(0, fu * fu - c * c)); if (e <= 0) continue;
          const e2 = Math.min(e, LIM);
          cam(c * U, 0, -e2 * U, P); g.moveTo(P[0], P[1]); cam(c * U, 0, e2 * U, P); g.lineTo(P[0], P[1]);
          cam(-e2 * U, 0, c * U, P); g.moveTo(P[0], P[1]); cam(e2 * U, 0, c * U, P); g.lineTo(P[0], P[1]);
        }
        g.stroke();
        for (const kk of ['street', 'edge', 'win', 'winA', 'beacon']) {
          const a = F[kk], st = STYLE[kk];
          g.fillStyle = st[0]; g.globalAlpha = st[1];
          for (let i = 0; i < a.length; i += 4) {
            const d = a[i + 3]; if (d > fw) continue;
            const gr = p3o(sat((fw - d) / 420));
            if (kk === 'beacon' && ((fr + (i >> 2)) >> 2) % 2) continue;
            cam(a[i], a[i + 1] * gr, a[i + 2], P);
            if (P[0] < -10 || P[0] > W + 10 || P[1] < -10 || P[1] > H + 10 || P[2] < 50) continue;
            const s = clamp(st[2] * P[3] * k, 1.5, 7 * k);
            g.fillRect(P[0] - s / 2, P[1] - s / 2, s, s);
          }
        }
        g.fillStyle = C.amberLight; g.globalAlpha = 1;
        for (const c of cars) {
          const t = ((c.off + c.sp * u * 6) % (2 * LIM) + 2 * LIM) % (2 * LIM) - LIM;
          const x = c.ax ? t : c.lane + c.side, z = c.ax ? c.lane + c.side : t;
          if (Math.hypot(x, z) * U > fw) continue;
          cam(x * U, 0, z * U, P); if (P[2] < 50) continue;
          const s = clamp(3.4 * P[3] * k, 2, 7 * k); g.fillRect(P[0] - s / 2, P[1] - s / 2, s, s);
        }
        g.globalAlpha = 1;
      },
    };
  }

  // ---- 10 WEATHER: isobars around a low, fronts ------------------------------------------------------
  function wWeather(ctx) {
    const n = ctx.noise2D('c01-wx');
    const M = 420, cell = 8, cols = Math.ceil((W + 2 * M) / cell) + 1, rows = Math.ceil((H + 2 * M) / cell) + 1;
    const pr = (x, y) => 1012 - 30 * Math.exp(-((x - CX) ** 2 + (y - CY) ** 2) / (2 * 300 * 300))
      + 20 * Math.exp(-((x - 1720) ** 2 + (y - 120) ** 2) / (2 * 420 * 420)) + 14 * Math.exp(-((x - 120) ** 2 + (y - 1000) ** 2) / (2 * 380 * 380))
      + 5 * n.fbm(x / 520, y / 520, { octaves: 3 });
    const field = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) field[j * cols + i] = pr(i * cell - M, j * cell - M);
    const levels = [];
    for (let v = 984; v <= 1032; v += 4) levels.push({ v, segs: new Float32Array(contour(field, cols, rows, cell, v, -M, -M, [])), bold: v % 16 === 0 });
    // fronts (screen polylines from the low outward)
    const poly = (fn, m) => Array.from({ length: m }, (_, i) => fn(i / (m - 1)));
    const cold = poly((t) => [CX + 30 - t * 820 + 140 * Math.sin(t * 2.4), CY + 40 + t * 520 + 40 * Math.sin(t * 5)], 80);
    const warm = poly((t) => [CX + 40 + t * 860, CY + 60 + t * 240 - 120 * Math.sin(t * 2.6)], 80);
    const len = (pl) => { const L = [0]; for (let i = 1; i < pl.length; i++) L.push(L[i - 1] + Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1])); return L; };
    const coldL = len(cold), warmL = len(warm);
    function frontLine(g, pl, Ls, upto, col, kind, k) {
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 3.2 * k; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(pl[0][0], pl[0][1]);
      let i = 1; for (; i < pl.length && Ls[i] <= upto; i++) g.lineTo(pl[i][0], pl[i][1]);
      g.stroke();
      for (let s = 50; s < upto - 20; s += 78) {
        let j = 1; while (j < pl.length - 1 && Ls[j] < s) j++;
        const a = pl[j - 1], b = pl[j], t = (s - Ls[j - 1]) / (Ls[j] - Ls[j - 1]);
        const x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = uy, ny = -ux;
        g.beginPath();
        if (kind === 'cold') { const sz = 17 * Math.sqrt(k); g.moveTo(x - ux * sz, y - uy * sz); g.lineTo(x + nx * sz * 1.35, y + ny * sz * 1.35); g.lineTo(x + ux * sz, y + uy * sz); g.closePath(); }
        else { const sz = 14 * Math.sqrt(k); g.arc(x, y, sz, Math.atan2(uy, ux) + Math.PI, Math.atan2(uy, ux) + TAU, false); g.closePath(); }
        g.fill();
      }
    }
    return {
      name: 'WEATHER',
      draw(g, u, k) {
        ground(g, C.bg);
        const q = p2o(sat(u / 0.5));
        const f = front(u, 0.42, 0.28);
        g.save(); g.translate(CX, CY); g.rotate(lerp(14, 0, p3o(sat(u / 0.5))) * DEG); const z = lerp(0.9, 1.0, q); g.scale(z, z); g.translate(-CX, -CY);
        g.lineCap = 'round';
        for (const L of levels) {
          const dv = Math.abs(L.v - 984);
          g.strokeStyle = L.bold ? C.ink : C.bone; g.globalAlpha = L.bold ? 0.85 : 0.5 + 0.2 * sat(1 - dv / 30);
          g.lineWidth = (L.bold ? 2.6 : 1.6) * k;
          strokeSegs(g, L.segs);
        }
        g.globalAlpha = 1;
        const fl = Math.max(0, f - 120);
        frontLine(g, cold, coldL, fl, C.rival, 'cold', k);
        frontLine(g, warm, warmL, fl, C.amber, 'warm', k);
        g.font = `800 ${110}px ${DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = C.rival; g.fillText('L', CX - 112, CY - 92);
        g.fillStyle = C.bone; g.globalAlpha = 0.85; g.fillText('H', 1650, 190); g.fillText('H', 230, 930); g.globalAlpha = 1;
        g.restore();
        maskFront(g, f, 40);
        edgeRing(g, f, C.bone, 0.8, 2 * k);
      },
    };
  }

  // ---- 11 ICE SHELF: voronoi floes cracking open from the point ---------------------------------------
  function wIce(ctx) {
    const r = ctx.rng('c01-ice');
    const sites = [];
    for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU + 0.4; sites.push([CX + Math.cos(a) * 64, CY + Math.sin(a) * 64]); }
    const SP = 118;
    for (let y = -260; y < H + 260; y += SP) for (let x = -260; x < W + 260; x += SP) {
      const px = x + r.range(-0.42, 0.42) * SP, py = y + r.range(-0.42, 0.42) * SP;
      if (Math.hypot(px - CX, py - CY) < 120) continue;
      sites.push([px, py]);
    }
    const cells = sites.map(([sx, sy], i) => {
      let poly = [[sx - 420, sy - 420], [sx + 420, sy - 420], [sx + 420, sy + 420], [sx - 420, sy + 420]];
      for (let j = 0; j < sites.length && poly.length; j++) {
        if (j === i) continue; const [ox, oy] = sites[j]; const dx = ox - sx, dy = oy - sy;
        if (dx * dx + dy * dy > 520 * 520) continue;
        poly = clipHalf(poly, (sx + ox) / 2, (sy + oy) / 2, dx, dy);
      }
      let cx = 0, cy = 0; poly.forEach((p) => { cx += p[0]; cy += p[1]; }); cx /= poly.length || 1; cy /= poly.length || 1;
      const d = Math.min(...poly.map((p) => Math.hypot(p[0] - CX, p[1] - CY)));
      return { poly, cx, cy, d, dc: Math.hypot(cx - CX, cy - CY), tone: r.range(0.07, 0.2), rot: r.range(-1, 1) };
    }).filter((c) => c.poly.length > 2);
    const stria = cells.map((c) => { const a = r.range(0, Math.PI); return [Math.cos(a), Math.sin(a)]; });
    return {
      name: 'ICE SHELF',
      draw(g, u, k) {
        ground(g, C.bg);
        const f = front(u, 0.42, 0.24);
        const q = p2o(sat(u / 0.5));
        g.save(); g.translate(CX, CY); g.rotate(lerp(-4, 0, q) * DEG); g.translate(-CX, -CY);
        g.lineJoin = 'round';
        cells.forEach((c, i) => {
          if (c.d > f) return;
          const open = p3o(sat((f - c.dc) / 420));           // separation
          const fresh = 1 - sat((f - c.d) / 260);             // just cracked: hot edges
          const gap = lerp(1.5, 11, open) * (k > 1 ? 1.4 : 1);
          const ux = (c.cx - CX) / (c.dc || 1), uy = (c.cy - CY) / (c.dc || 1);
          const drift = open * (6 + c.dc * 0.025);
          const ang = c.rot * open * 2.2 * DEG, ca = Math.cos(ang), sa = Math.sin(ang);
          g.beginPath();
          c.poly.forEach((p, j) => {
            let x = p[0] - c.cx, y = p[1] - c.cy; const l = Math.hypot(x, y) || 1; const s = Math.max(0, (l - gap) / l);
            x *= s; y *= s; const xr = x * ca - y * sa, yr = x * sa + y * ca;
            const X = c.cx + xr + ux * drift, Y = c.cy + yr + uy * drift;
            if (j) g.lineTo(X, Y); else g.moveTo(X, Y);
          });
          g.closePath();
          g.fillStyle = rgba(C.bone, c.tone + 0.12 * fresh); g.fill();
          g.strokeStyle = fresh > 0.05 ? mixHex(C.bone, C.amberLight, fresh, 0.95) : rgba(C.ink, 0.62); g.lineWidth = (1.6 + 1.2 * fresh) * k; g.stroke();
          // faint stria inside the floe
          const [sx, sy] = stria[i];
          g.save(); g.clip();
          g.strokeStyle = rgba(C.bone, 0.12); g.lineWidth = 1.2 * k; g.beginPath();
          for (let o = -90; o <= 90; o += 22) { g.moveTo(c.cx + ux * drift - sx * 140 - sy * o, c.cy + uy * drift - sy * 140 + sx * o); g.lineTo(c.cx + ux * drift + sx * 140 - sy * o, c.cy + uy * drift + sy * 140 + sx * o); }
          g.stroke(); g.restore();
        });
        g.restore();
      },
    };
  }

  // ---- 12 VOLCANIC ISLAND: concentric ring extrusion ------------------------------------------------
  function wVolcano(ctx) {
    const n = ctx.noise2D('c01-volc');
    const K = 15, NPT = 120;
    const rings = [];
    for (let kk = 0; kk < K; kk++) {
      const t = kk / (K - 1);
      const base = 820 * Math.pow(1 - t * 0.93, 1.25);
      const xs = new Float32Array(NPT), zs = new Float32Array(NPT);
      for (let i = 0; i < NPT; i++) {
        const a = i / NPT * TAU, rr = base * (1 + 0.17 * n(Math.cos(a) * 1.4 + kk * 0.05, Math.sin(a) * 1.4) + 0.05 * n(Math.cos(a) * 4, Math.sin(a) * 4 + kk * 0.2));
        xs[i] = Math.cos(a) * rr; zs[i] = Math.sin(a) * rr;
      }
      const top = kk === K - 1 ? 0.92 : Math.pow(t, 1.35);
      rings.push({ xs, zs, y: 360 * top, base, t });
    }
    const YT = rings[K - 2].y;
    const lava = [0.6, 2.3, 4.1].map((a) => a);
    const P = [0, 0, 0, 0];
    const px = new Float32Array(NPT), py = new Float32Array(NPT);
    return {
      name: 'VOLCANIC ISLAND',
      draw(g, u, k) {
        ground(g, C.bg);
        const q = p2o(sat(u / 0.5));
        const fw = 1000 * (0.3 + 0.7 * p3o(sat(u / 0.4)));
        const ext = lerp(0.3, 1, p3o(sat(u / 0.4)));
        const cam = camera({ tx: 0, ty: YT * ext, tz: 0, yaw: lerp(-20, 6, q), pitch: lerp(36, 30, q), dist: lerp(1900, 1650, q), f: 1500 });
        // sea ripples
        g.strokeStyle = rgba(C.bone, 0.18); g.lineWidth = 1.5 * k;
        for (let s = 0; s < 5; s++) {
          const rr = 900 + s * 120 + ((u * 60) % 120);
          g.beginPath();
          for (let i = 0; i <= 90; i++) { cam(Math.cos(i / 90 * TAU) * rr, 0, Math.sin(i / 90 * TAU) * rr, P); if (i) g.lineTo(P[0], P[1]); else g.moveTo(P[0], P[1]); }
          g.stroke();
        }
        for (let kk = 0; kk < K; kk++) {
          const R = rings[kk];
          const sc = p3o(sat((fw - R.base * 0.8) / 300 + 0.3)); if (sc <= 0.01) continue;
          const y = R.y * ext;
          const dy = kk ? (R.y - rings[kk - 1].y) * ext : y;
          const crater = kk >= K - 2;
          // wall (ring at y - dy), then the terrace top at y
          for (const [yy, fill] of [[y - dy, '#14110d'], [y, crater ? '#2a1410' : mixHex('#1a1611', '#3a3127', R.t * 0.7)]]) {
            for (let i = 0; i < NPT; i++) { cam(R.xs[i] * sc, yy, R.zs[i] * sc, P); px[i] = P[0]; py[i] = P[1]; }
            g.beginPath(); g.moveTo(px[0], py[0]); for (let i = 1; i < NPT; i++) g.lineTo(px[i], py[i]); g.closePath();
            g.fillStyle = fill; g.fill();
          }
          g.strokeStyle = crater ? C.rival : mixHex(C.amberDeep, C.amberLight, R.t, 0.55 + 0.45 * R.t); g.lineWidth = (crater ? 2.6 : 1.7) * k; g.stroke();
        }
        // lava rivulets down the slope + crater glow
        const top = rings[K - 2];
        const glowA = sm(0.08, 0.3, u);
        g.strokeStyle = C.rival; g.lineWidth = 2.4 * k; g.globalAlpha = 0.9 * glowA; g.lineJoin = 'round';
        for (const a0 of lava) {
          g.beginPath();
          for (let kk = K - 2; kk >= 2; kk--) {
            const R = rings[kk], sc = p3o(sat((fw - R.base * 0.8) / 300 + 0.3));
            const i = Math.round(((a0 + 0.1 * Math.sin(kk * 1.3)) / TAU) * NPT) % NPT;
            cam(R.xs[i] * sc, R.y * ext + 2, R.zs[i] * sc, P);
            if (kk === K - 2) g.moveTo(P[0], P[1]); else g.lineTo(P[0], P[1]);
          }
          g.stroke();
        }
        g.globalAlpha = 1;
        cam(0, top.y * ext, 0, P);
        const gg = g.createRadialGradient(P[0], P[1], 0, P[0], P[1], 180);
        gg.addColorStop(0, rgba(C.rival, 0.55 * glowA)); gg.addColorStop(1, rgba(C.rival, 0));
        g.fillStyle = gg; g.fillRect(P[0] - 180, P[1] - 180, 360, 360);
      },
    };
  }

  // =====================================================================================================
  Film.scene({
    id: ID,
    duration: 8,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`[data-scene="${ID}"] .c1-bg { position:absolute; inset:0; background:${C.bg}; }
        [data-scene="${ID}"] .c1-word { position:absolute; left:0; top:0; width:${W}px; height:${H}px; visibility:hidden; }
        [data-scene="${ID}"] .c1-word .lt { position:absolute; top:0; font: 780 ${IMG_PX}px/1 var(--display); letter-spacing:0; white-space:pre; }
        [data-scene="${ID}"] .c1-dec .slot { position:absolute; overflow:hidden; }
        [data-scene="${ID}"] .c1-dec .col { position:absolute; left:0; top:0; display:flex; flex-direction:column; }
        [data-scene="${ID}"] .c1-dec .col span { display:block; font: 780 ${DEC_PX}px/1 var(--display); color:${C.amber}; height:${DEC_PX}px; line-height:${DEC_PX}px; }
        [data-scene="${ID}"] .c1-tag { position:absolute; left:120px; top:976px; font: 500 20px/20px var(--mono); letter-spacing:.14em; color:${C.bone}; white-space:pre; text-transform:uppercase; }
        [data-scene="${ID}"] .c1-ticks { position:absolute; right:120px; top:984px; display:flex; gap:7px; }
        [data-scene="${ID}"] .c1-ticks i { display:block; width:16px; height:4px; background:${C.bone}; }`);
      ctx.el('div', 'c1-bg', root);
      const { g } = ctx.canvas({ className: 'c1-main' });

      const WORLDS = [wCoast, wRidge, wStation, wVoxel, wDunes, wValley, wForest, wCanyon, wCity, wWeather, wIce, wVolcano].map((fn) => fn(ctx));

      // ---- catalogue tiles: each world's settled frame (centre 960x540 crop at 1:1, lines x2) ----
      const TILE_K = 2;
      const tiles = WORLDS.map((w) => {
        const c = document.createElement('canvas'); c.width = 960; c.height = 540;
        const cg = c.getContext('2d'); cg.setTransform(1, 0, 0, 1, -480, -270); w.draw(cg, 0.5, TILE_K); return c;
      });
      const last = document.createElement('canvas'); last.width = W; last.height = H;
      WORLDS[NW - 1].draw(last.getContext('2d'), 0.5, 1);
      // grid geometry: 4 x 3, the point in the centre gutter
      const GW = 412, GH = 232, GAP = 22, GX0 = CX - (4 * GW + 3 * GAP) / 2, GY0 = CY - (3 * GH + 2 * GAP) / 2;
      const SLOT = WORLDS.map((w, i) => { const c = i % 4, rr = Math.floor(i / 4); return { x: GX0 + c * (GW + GAP), y: GY0 + rr * (GH + GAP), w: GW, h: GH }; });
      const LABEL = WORLDS.map((w, i) => String(i + 1).padStart(2, '0') + ' · ' + w.name);
      const TAGS = WORLDS.map((w, i) => 'WORLD ' + String(i + 1).padStart(2, '0') + ' · ' + w.name);

      // ---- kinetic words ----
      // IMAGINED: ink letters burst out of the point into a word above it
      const img = ctx.el('div', 'c1-word c1-img', root);
      const IMG_BASE = 448;
      const imgL = [];
      {
        const probe = ctx.el('span', 'lt', img, 'IMAGINED'); probe.style.letterSpacing = '-0.045em';
        const total = probe.getBoundingClientRect().width; img.removeChild(probe);
        let x = CX - total / 2;
        for (const ch of 'IMAGINED') {
          const s = ctx.el('span', 'lt', img, ch); s.style.color = C.ink; s.style.letterSpacing = '-0.045em';
          const w = s.getBoundingClientRect().width;
          s.style.left = x.toFixed(1) + 'px'; s.style.top = (IMG_BASE - IMG_PX * 0.86).toFixed(1) + 'px';
          imgL.push({ s, cx: x + w / 2 }); x += w;
        }
      }
      imgL.forEach((L, i) => {
        tl.fromTo(L.s, { x: CX - L.cx, y: CY - (IMG_BASE - IMG_PX * 0.36), scale: 0.12, opacity: 0 },
          { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.42, ease: 'expo.out' }, T_IMG + Math.abs(i - 3.5) * 0.008);
        tl.to(L.s, { x: (L.cx - CX) * 0.035, duration: T_IMG_END - T_IMG - 0.42, ease: 'none' }, T_IMG + 0.42);
      });
      // DECISIONS: amber letters roll like a slot reel and lock left to right, below the point
      const dec = ctx.el('div', 'c1-word c1-dec', root);
      const DEC_TOP = 618, DH = DEC_PX;
      {
        const probe = ctx.el('span', '', dec, 'DECISIONS'); Object.assign(probe.style, { font: `780 ${DEC_PX}px/1 var(--display)`, letterSpacing: '-0.045em', position: 'absolute', whiteSpace: 'pre' });
        const total = probe.getBoundingClientRect().width; dec.removeChild(probe);
        let x = CX - total / 2;
        [...'DECISIONS'].forEach((ch, i) => {
          const m = ctx.el('span', '', dec, ch); Object.assign(m.style, { font: `780 ${DEC_PX}px/1 var(--display)`, letterSpacing: '-0.045em', position: 'absolute', whiteSpace: 'pre' });
          const w = m.getBoundingClientRect().width; dec.removeChild(m);
          const slot = ctx.el('div', 'slot', dec); Object.assign(slot.style, { left: x.toFixed(1) + 'px', top: (DEC_TOP - 30) + 'px', width: (w + 8).toFixed(1) + 'px', height: (DH + 60) + 'px' });
          const col = ctx.el('div', 'col', slot); col.style.top = '30px';
          const sp = ctx.el('span', '', col, ch);
          // interlocking zip: odd letters drop from above, even letters rise from below, each flashes light as it locks
          const dir = i % 2 ? -1 : 1, t0 = T_DEC + i * 0.022;
          tl.fromTo(col, { y: dir * (DH + 40) }, { y: 0, duration: 0.24, ease: 'expo.out' }, t0);
          tl.fromTo(sp, { color: C.amberLight }, { color: C.amber, duration: 0.3, ease: 'power2.out' }, t0 + 0.08);
          x += w;
        });
      }

      // ---- world tag + ticks ----
      const tag = ctx.el('div', 'c1-tag', root);
      const ticks = ctx.el('div', 'c1-ticks', root);
      const tickEls = WORLDS.map(() => ctx.el('i', '', ticks));

      // ---- the seed point (top canvas) ----
      const { g: pg } = ctx.canvas({ className: 'c1-point' });
      const PULSES = [0, 0.25].concat(WORLDS.map((w, i) => T0 + i * BEAT), [T_GRID]);
      function drawPoint(lt) {
        pg.setTransform(1, 0, 0, 1, 0, 0); pg.clearRect(0, 0, W, H);
        let core = 6.5, glowR = 72, glowA = 0.34, halo = lt >= T0 && lt < T_DARK ? 0.6 : 0;
        // the opening double pulse: core flash + flare
        for (const p of [0, 0.25]) { const e = lt - p; if (e >= 0 && e < 0.25) { const v = 1 - p3o(e / 0.25); core *= 1 + 1.1 * v; glowA += 0.4 * v; glowR += 60 * v; } }
        if (lt < 0.45) {
          const v = 1 - p3o(sat(lt / 0.42)), v2 = lt >= 0.25 ? 1 - p3o(sat((lt - 0.25) / 0.25)) : 0, vv = Math.max(v, v2 * 0.7);
          const fl = 1500 * vv;
          const lg = pg.createLinearGradient(CX - fl, 0, CX + fl, 0);
          lg.addColorStop(0, rgba(C.amber, 0)); lg.addColorStop(0.5, rgba(C.amberLight, 0.9 * vv)); lg.addColorStop(1, rgba(C.amber, 0));
          pg.fillStyle = lg; pg.fillRect(CX - fl, CY - 1.5, fl * 2, 3);
        }
        // grid phase: the point charges as the tiles fall in
        if (lt >= T_COL) { const v = sm(T_COL, T_COL_END, lt); glowA += 0.25 * v; glowR += 40 * v; core += 1.5 * v; }
        if (lt >= T_COL_END - 0.02 && lt < T_COL_END + 0.2) { const v = 1 - seg(lt, T_COL_END, T_COL_END + 0.2); glowA += 0.5 * v; glowR += 140 * v; core += 4 * v; }
        if (lt >= T_DARK) { const v = seg(lt, T_DARK, 8.0); glowA += 0.2 + 0.25 * v; glowR += 30 + 60 * v; core += 1.5 + 1.5 * v; }
        // rings
        for (const p of PULSES) {
          const e = lt - p; if (e < 0 || e >= 0.45) continue;
          const v = e / 0.45, rr = 10 + (p < T0 ? 200 : 130) * p3o(v);
          pg.strokeStyle = rgba(p < T0 ? C.amberLight : C.amber, (1 - v) * (1 - v) * (p < T0 ? 1 : 0.75)); pg.lineWidth = lerp(3, 1.5, v);
          pg.beginPath(); pg.arc(CX, CY, rr, 0, TAU); pg.stroke();
        }
        // implosion ring before the split
        if (lt >= T_DARK) {
          const v = seg(lt, T_DARK, 7.97), rr = lerp(260, 14, v * v);
          pg.strokeStyle = rgba(C.amberLight, 0.15 + 0.7 * v); pg.lineWidth = lerp(1.5, 3, v);
          pg.beginPath(); pg.arc(CX, CY, rr, 0, TAU); pg.stroke();
        }
        const gr = pg.createRadialGradient(CX, CY, 0, CX, CY, glowR);
        gr.addColorStop(0, rgba(C.amber, Math.min(1, glowA))); gr.addColorStop(0.35, rgba(C.amber, Math.min(1, glowA) * 0.35)); gr.addColorStop(1, rgba(C.amber, 0));
        pg.fillStyle = gr; pg.fillRect(CX - glowR, CY - glowR, glowR * 2, glowR * 2);
        if (halo) { pg.strokeStyle = rgba(C.bg, halo); pg.lineWidth = 6; pg.beginPath(); pg.arc(CX, CY, core + 5, 0, TAU); pg.stroke(); }
        // core (leans along the slant on the last frames: the split is coming)
        const lean = seg(lt, 7.86, 8.0);
        pg.save(); pg.translate(CX, CY); pg.rotate(-B.SLANT * DEG);
        pg.fillStyle = C.amber; pg.beginPath(); pg.ellipse(0, 0, core * (1 + 1.3 * lean), core * (1 - 0.2 * lean), 0, 0, TAU); pg.fill();
        pg.fillStyle = C.amberLight; pg.beginPath(); pg.ellipse(0, 0, core * 0.55 * (1 + 1.3 * lean), core * 0.55, 0, 0, TAU); pg.fill();
        pg.restore();
      }

      // ---- the catalogue grid ----
      function drawTile(i, x, y, w, h, a, lt, labelA) {
        if (w < 1 || h < 1) return;
        g.globalAlpha = a; g.drawImage(tiles[i], x, y, w, h);
        g.strokeStyle = rgba(C.bone, 0.32); g.lineWidth = 1.5; g.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
        g.globalAlpha = 1;
        if (labelA > 0) {
          const s = B.scrambleFrame('', LABEL[i], seg(lt, T_LAND + i * 0.012, T_LAND + i * 0.012 + 0.2), { seed: 77 + i, time: lt });
          g.font = `600 20px ${MONO}`; g.textAlign = 'left'; g.textBaseline = 'top';
          const tw = g.measureText(s).width;
          g.fillStyle = rgba(C.bg, 0.78 * labelA); g.fillRect(x + 10, y + 10, tw + 16, 30);
          g.fillStyle = rgba(C.ink, labelA); g.fillText(s, x + 18, y + 16);
        }
      }
      function drawGrid(lt) {
        ground(g, C.bg);
        const scan = (i) => { const t0 = T_SCAN + i * 0.04; return lt >= t0 && lt < t0 + 0.12 ? 1 - seg(lt, t0, t0 + 0.12) : 0; };
        const collapse = lt >= T_COL;
        for (let i = 0; i < NW; i++) {
          const S = SLOT[i];
          let x = S.x, y = S.y, w = S.w, h = S.h, a = 1, lab = sm(T_LAND, T_LAND + 0.1, lt);
          if (!collapse) {
            const breathe = 1 + 0.015 * seg(lt, T_LAND, T_COL);
            if (i === NW - 1) {
              // world 12 shrinks from full frame into its slot (crop window closes onto the tile)
              const v = eo(seg(lt, T_GRID, T_GRID + 0.34));
              const tcx = lerp(CX, S.x + S.w / 2, v), tcy = lerp(CY, S.y + S.h / 2, v);
              const cw = lerp(W, S.w, v), chh = lerp(H, S.h, v), csc = lerp(1, S.w / 960, v);
              g.save(); g.beginPath(); g.rect(tcx - cw / 2, tcy - chh / 2, cw, chh); g.clip();
              if (v < 0.999) { g.drawImage(last, tcx - W / 2 * csc, tcy - H / 2 * csc, W * csc, H * csc); }
              else g.drawImage(tiles[i], S.x, S.y, S.w, S.h);
              g.restore();
              g.strokeStyle = rgba(C.bone, 0.32 * v); g.lineWidth = 1.5; g.strokeRect(tcx - cw / 2 + 0.75, tcy - chh / 2 + 0.75, cw - 1.5, chh - 1.5);
              if (lab > 0) { // label only
                const s = B.scrambleFrame('', LABEL[i], seg(lt, T_LAND + i * 0.012, T_LAND + i * 0.012 + 0.2), { seed: 77 + i, time: lt });
                g.font = `600 20px ${MONO}`; g.textAlign = 'left'; g.textBaseline = 'top'; const tw = g.measureText(s).width;
                g.fillStyle = rgba(C.bg, 0.78 * lab); g.fillRect(S.x + 10, S.y + 10, tw + 16, 30); g.fillStyle = rgba(C.ink, lab); g.fillText(s, S.x + 18, S.y + 16);
              }
            } else {
              const v = eo(seg(lt, T_GRID + 0.012 * i, T_GRID + 0.012 * i + 0.36));
              const tcx = lerp(CX, S.x + S.w / 2, v), tcy = lerp(CY, S.y + S.h / 2, v);
              w = S.w * v * breathe; h = S.h * v * breathe; x = tcx - w / 2; y = tcy - h / 2;
              drawTile(i, x, y, w, h, Math.min(1, v * 3), lt, lab);
            }
            const sc = scan(i);
            if (sc > 0) { g.strokeStyle = rgba(C.amberLight, sc); g.lineWidth = 3; g.strokeRect(S.x - 1, S.y - 1, S.w + 2, S.h + 2); }
          } else {
            // collapse into the point (outer tiles first; power4.in) with a short smear
            const dd = Math.hypot(S.x + S.w / 2 - CX, S.y + S.h / 2 - CY) / 760;
            const t0 = T_COL + (1 - dd) * 0.06, t1 = T_COL_END - (1 - dd) * 0.02;
            for (const [lag, al] of [[0.05, 0.18], [0.025, 0.35], [0, 1]]) {
              const v = p4i(seg(lt - lag, t0, t1));
              if (v >= 1) continue;
              const tcx = lerp(S.x + S.w / 2, CX, v), tcy = lerp(S.y + S.h / 2, CY, v), s = 1.015 * (1 - v);
              drawTile(i, tcx - S.w * s / 2, tcy - S.h * s / 2, S.w * s, S.h * s, al * (1 - v * 0.3), lt, al === 1 ? 1 - sat(v * 4) : 0);
            }
          }
        }
      }

      // ---- the seed field: streaks falling into the point (0.0-0.5 and the charge before the split) ----
      const fr0 = ctx.rng('c01-field');
      const streaks = Array.from({ length: 640 }, () => ({ a: fr0() * TAU, r0: 180 + Math.pow(fr0(), 0.7) * 1100, ph: fr0(), sp: fr0.range(0.8, 1.35), w: fr0.range(1.5, 2.6), c: fr0() < 0.72 ? 0 : fr0() < 0.6 ? 1 : 2 }));
      const SCOL = [C.amber, C.bone, C.amberLight];
      function drawField(lt, t0, t1, amt) {
        // each streak falls inward on a loop; over the last 40% of [t0,t1] the whole field is pulled into the point
        const pull = sm(t0 + (t1 - t0) * 0.55, t1, lt), dens = amt * (1 - pull * 0.25);
        g.lineCap = 'round';
        for (let c = 0; c < 3; c++) {
          g.beginPath();
          for (let i = c; i < streaks.length; i += 1) {
            const S = streaks[i]; if (S.c !== c) continue;
            if (i / streaks.length > dens) continue;
            const q = (S.ph + (lt - t0) * S.sp * 1.5) % 1;
            const rr = (rad) => S.r0 * Math.pow(1 - rad, 1.7) * (1 - pull) + 9;
            const r1 = rr(q), r2 = rr(Math.max(0, q - 0.06 - 0.12 * pull));
            const ca = Math.cos(S.a + 0.35 * q), sa = Math.sin(S.a + 0.35 * q), cb = Math.cos(S.a + 0.35 * (q - 0.06)), sb = Math.sin(S.a + 0.35 * (q - 0.06));
            g.moveTo(CX + ca * r1, CY + sa * r1); g.lineTo(CX + cb * r2, CY + sb * r2);
          }
          g.strokeStyle = SCOL[c]; g.globalAlpha = c === 1 ? 0.45 : 0.8; g.lineWidth = c === 2 ? 2.2 : 1.7; g.stroke();
        }
        g.globalAlpha = 1;
      }

      // ---- per frame ----
      const dimFor = (lt) => {
        if (lt >= T_IMG && lt < T_IMG_END) return 0.4 * sm(T_IMG, T_IMG + 0.08, lt);
        if (lt >= T_DEC && lt < T_DEC_END) return 0.4 * sm(T_DEC, T_DEC + 0.08, lt);
        return 0;
      };
      ctx.onFrame((lt) => {
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        g.clearRect(0, 0, W, H);
        let k = -1;
        if (lt >= T0 && lt < T_GRID) {
          k = Math.min(NW - 1, Math.floor((lt - T0) / BEAT + 1e-6));
          const u = lt - (T0 + k * BEAT);
          WORLDS[k].draw(g, u, 1);
          g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
          const dm = dimFor(lt);
          if (dm > 0) { g.fillStyle = rgba(C.bg, dm); g.fillRect(0, 0, W, H); }
        } else if (lt >= T_GRID && lt < T_DARK) {
          drawGrid(lt);
        }
        if (lt < T0) drawField(lt, 0, T0, 0.55 + 0.45 * seg(lt, 0, 0.3));
        if (lt >= T_DARK) drawField(lt, T_DARK, 8.0, 0.8);
        // words: hard cuts on the beat
        img.style.visibility = lt >= T_IMG && lt < T_IMG_END ? 'visible' : 'hidden';
        dec.style.visibility = lt >= T_DEC && lt < T_DEC_END ? 'visible' : 'hidden';
        // tag + ticks
        if (k >= 0) {
          const u = lt - (T0 + k * BEAT);
          const s = B.scrambleFrame(k ? TAGS[k - 1] : '', TAGS[k], sat(u / 0.28), { seed: 31 + k, time: u });
          if (tag.textContent !== s) tag.textContent = s;
          tag.style.visibility = 'visible'; ticks.style.visibility = 'visible';
          tickEls.forEach((el, i) => { const c = i === k ? C.amber : i < k ? rgba(C.bone, 0.55) : rgba(C.bone, 0.16); if (el.style.background !== c) el.style.background = c; });
        } else { tag.style.visibility = 'hidden'; ticks.style.visibility = 'hidden'; }
        drawPoint(lt);
      });
    },
  });
})();
