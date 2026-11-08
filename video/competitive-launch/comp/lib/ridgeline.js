/* Ridgeline 3D: the Floodgate valley as a floating island of stacked ridgelines (revision v3).
 *
 * The SAME heightfield as the map (Floodgate.productHeight(): product units x 0..1600, y 0..1000,
 * sea level 0.18) is sampled once into rows of polylines (about 110 rows x 270 points, a module cache
 * shared by every scene), displaced upward by height and projected with an orbit camera. Rows are
 * drawn back to front (painter's order from the camera), each filled down to its base so nearer ridges
 * occlude farther ones ("unknown pleasures"). The river rows dip and hold a flat teal-black water surface.
 * The island is a solid body: its top is the ground colour, its rim band (where it drops to the footprint)
 * is a cliff face lit from above (#1a1611 at the lip ramping to #110e0b at the foot, lighter than the void),
 * so the cliffs read down to the foot; every ridgeline runs on over the cliff top and dissolves down the face
 * (alpha ramp); a footprint edge traces the foot of the faces turned toward the camera, over the body; an
 * amber rim light sits behind the silhouette. Plans are 3D polylines on the terrain drawn as light ribbons.
 * The cliff top is one run per row: near the north / south coasts (where the cliff-top line runs along the
 * rows) the bays inside a row's outermost cliff-top columns are filled at bake, so no row dips down the face
 * and climbs back out; the rim stroke joins row ends only where they move <= 2 columns (east / west coasts).
 *
 *   const R = Ridgeline.create(ctx, { parent, cam: {...}, look: {...} })
 *   R.canvas, R.g        the full-frame canvas the island draws into (every frame, from the proxies)
 *   R.cam                proxy (tween it on ctx.tl):
 *                          tx, ty   orbit target, PRODUCT coordinates (default the valley centre 820,520)
 *                          th       target height above sea (world units)
 *                          yaw      degrees; 0 = looking north (map top is far), + turns the view east
 *                          pitch    degrees above the horizon (90 = top-down, map top at screen top)
 *                          dist     camera distance to the target (world units; 1 world unit = 1 product unit)
 *                          fov      vertical field of view (degrees)
 *                          sx, sy   screen offset of the target from the frame centre (px)
 *                          roll     degrees (screen rotation around the target)
 *   R.look               proxy: hs (height multiplier, 0 = flat map), lines (line brightness), alpha
 *                          (whole island), glow (rim light), water, edge (footprint edge at the foot of the
 *                          camera-facing cliffs, 0..1), sweep / sweepA
 *                          (a band of light travelling over the rows, 0 = far edge .. 1 = near edge),
 *                          rim (cliff-top rim stroke joining the row ends, default 1), banks (0..1: traces
 *                          the river banks at sea level in amber and darkens the water to the map's river
 *                          core #0b0f10, for a match cut onto the flat map)
 *   R.route(o)           a plan as light. o: { pts: [[x,y]...] (product polyline, already smooth),
 *                          color, light (bright core colour), lift (units above the ground, default 7),
 *                          width (1) }. Returns a handle with a proxy you tween:
 *                          draw 0..1 (drawn length), tail 0..1 (start), alpha, head (bright head 0..1),
 *                          run (-1 off, else 0..1 position of a travelling comet), runA, glow (1)
 *                          and handle.at(u) -> { x, y, Y } the 3D point at fraction u of the length.
 *   R.project(px, py, Y) -> [sx, sy, depth, pxPerUnit]   (Y in world units above sea; null if behind)
 *   R.groundY(px, py)    display height of the surface at a product point (world units, current hs)
 *   R.surfaceY(px, py)   max(groundY, sea) : where water counts as a floor (bridges, rings)
 *   R.draw(fn)           extra drawing after the island and the ribbons: fn(g, lt, R) (markers, flashes)
 *   R.ring(g, o)         ground ring: { x, y, r (units), color, a, lw, glow, lift, seg, drape, halo }. Flat (default):
 *                          an ellipse at the centre's surface height. drape: true puts every point on the
 *                          terrain (+ lift) and occludes it by the ridges in front (rolls up slopes, drops
 *                          behind ridges); drawn as seamless additive light. halo (draped only): [[width px,
 *                          alpha, colour?], ...] glow passes in place of the default one (lw x 7 at .12).
 *   R.pillar(g, o)       light pillar: { x, y, h (units), color, kind: 'diamond'|'ring', a, s (size), grow,
 *                          emb: [sx, sy] screen point the emblem (and the beam top) is pulled toward by
 *                          embT 0..1, embE: emblem half-size (px) reached at embT 1 }
 *   R.gate(g, o)         the Floodgate as a small box lying in the river at (800,560), -32 deg: { a, lit, h }
 *   R.visibleAt(px, py, Y) -> 0..1  terrain occlusion of a world point (the ray-march the ribbons use)
 *   Ridgeline.bezier(segs, step) -> polyline: segs = [[p0, c1, c2, p1], ...] cubic segments (product)
 *   Ridgeline.PLANS      { ours, theirs } the two plans (the s05 / s13 route geometry, ending at the gate)
 *   Ridgeline.POINTS     { atlas, vega, gate, pump, crossing } product coordinates
 *
 * Light passes (ribbon glows, head trails, comets, draped rings, banks) are chunked additive strokes with
 * butt caps: chunks abut at shared samples, so the joints never double up ("string of pearls"). Rows: the water surface is a continuous sheet between neighbouring rows'
 * chords (no teeth at the banks); inside the cliff top (mask >= TOPM) every segment is stroked, and across the rim
 * band each row's stroke fades to 0 (a gradient run down to mask FADEM), so no row ends in mid-air. Each row slab is
 * filled CLIFF, then GROUND over the cliff top: down to the base where the next nearer row is on the plateau too,
 * only a thin lip where that row has dropped into the rim band (the band below it is cliff face).
 *
 * Performance: the grid of heights, brightness buckets, water runs and island mask are computed once
 * per film (Ridgeline.field cache). Per frame: ~30k projections, ~110 fills + ~450 strokes, a short
 * ray-march per ribbon sample for occlusion. Measured 4-12 ms of onFrame script per frame on this machine
 * (canvas raster adds ~60-100 ms of paint per frame in software Chromium).
 * Everything is a pure function of the proxies (and lt), so any seek order gives the same frame.
 */
(function () {
  'use strict';
  const W = 1920, H = 1080, DEG = Math.PI / 180;
  const C = Brand.C;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  // CLIFF: the rim band's fill, one step lighter than the ground (and the void), so the island reads as a
  // solid body down to its footprint instead of ending where the ridgelines stop
  const CLIFF = hexRgb('#16130e');
  // the face is lit from above: #1a1611 at the lip down to #110e0b at the foot (derived darks, like the gate body)
  const CLIFF_LIP = hexRgb('#1a1611'), CLIFF_FOOT = hexRgb('#110e0b');
  const LIP = 5;   // world units of ground under a row's line where the face below it is cliff
  const GROUND = hexRgb('#0f0d0a'), AMBER = hexRgb(C.amber), AMBER_L = hexRgb(C.amberLight), BONE = hexRgb(C.bone), INK = hexRgb(C.ink);
  const WATER = hexRgb('#111817');   // teal-black, between the map's water #0b0f10 and its shallows #18211f
  const WATER_CORE = hexRgb('#0b0f10');   // the map's river core (look.banks lerps the water toward it)
  const SEA = 0.18;

  const POINTS = { atlas: [380, 320], vega: [1260, 690], gate: [800, 560], pump: [562, 399], crossing: [1004, 396] };

  function bezier(segs, step) {
    step = step || 4;
    const out = [];
    segs.forEach((s, k) => {
      const [p0, c1, c2, p1] = s;
      // arc length estimate for the sample count
      let len = 0, px = p0[0], py = p0[1];
      for (let i = 1; i <= 40; i++) {
        const t = i / 40, u = 1 - t;
        const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0];
        const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1];
        len += Math.hypot(x - px, y - py); px = x; py = y;
      }
      const n = Math.max(2, Math.ceil(len / step));
      for (let i = k === 0 ? 0 : 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        out.push([u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
          u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1]]);
      }
    });
    return out;
  }
  const line = (a, b) => [a, [lerp(a[0], b[0], 1 / 3), lerp(a[1], b[1], 1 / 3)], [lerp(a[0], b[0], 2 / 3), lerp(a[1], b[1], 2 / 3)], b];
  // the s05 / s13 plans (M380 320 C450 330 510 360 562 399 S720 500 784 548 / M1260 690 C1240 560 1100 440 1004 396 S870 470 818 548),
  // carried on to the gate centre so both heads meet on the objective
  const PLANS = {
    ours: bezier([[[380, 320], [450, 330], [510, 360], [562, 399]], [[562, 399], [614, 438], [720, 500], [784, 548]], line([784, 548], [800, 560])], 4),
    theirs: bezier([[[1260, 690], [1240, 560], [1100, 440], [1004, 396]], [[1004, 396], [908, 352], [870, 470], [818, 548]], line([818, 548], [800, 560])], 4),
  };

  // ---------------------------------------------------------------------------------------
  // Field: one bake per option set for the whole film
  // ---------------------------------------------------------------------------------------
  const FIELDS = new Map();
  function field(o) {
    o = Object.assign({ rows: 120, dx: 6, x0: -132, x1: 1734, y0: -102, y1: 1102, cx: 800, cy: 500, ax: 922, ay: 592, n: 5, edge: 0.06,
      river: 0.55, base: -0.3, smooth: 8, seed: 58 }, o || {});
    const key = JSON.stringify(o);
    if (FIELDS.has(key)) return FIELDS.get(key);
    const hf = Floodgate.productHeight(o.seed, true);
    const coast = Film.utils.noise2D('ridgeline-coast');
    const NR = o.rows, NC = Math.round((o.x1 - o.x0) / o.dx) + 1;
    const dy = (o.y1 - o.y0) / (NR - 1), dx = o.dx;
    const xs = new Float32Array(NC), ys = new Float32Array(NR);
    for (let c = 0; c < NC; c++) xs[c] = o.x0 + c * dx;
    for (let r = 0; r < NR; r++) ys[r] = o.y0 + r * dy;
    const N = NR * NC;
    const raw = new Float32Array(N), disp = new Float32Array(N), mask = new Float32Array(N);
    // heights, lightly smoothed (separable gaussian, sigma o.smooth units): the same geography as the
    // map, without the finest fbm octave that would make the lines scribble
    for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) raw[r * NC + c] = hf(xs[c], ys[r]);
    if (o.smooth > 0) {
      const blur = (src, n, stride, count, cstride, sig) => {
        const R = Math.ceil(sig * 2.5), wts = [];
        let ws = 0; for (let k = -R; k <= R; k++) { const w = Math.exp(-(k * k) / (2 * sig * sig)); wts.push(w); ws += w; }
        const out = new Float32Array(src.length), line = new Float32Array(n);
        for (let j = 0; j < count; j++) {
          for (let i = 0; i < n; i++) line[i] = src[j * cstride + i * stride];
          for (let i = 0; i < n; i++) { let s = 0; for (let k = -R; k <= R; k++) s += line[clamp(i + k, 0, n - 1)] * wts[k + R]; out[j * cstride + i * stride] = s / ws; }
        }
        return out;
      };
      const t1 = blur(raw, NC, 1, NR, NC, o.smooth / dx);
      raw.set(blur(t1, NR, NC, NC, 1, o.smooth / dy));
    }
    let maxD = 0;
    for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
      const x = xs[c], y = ys[r], i = r * NC + c;
      const h = raw[i];
      const u = Math.abs(x - o.cx) / o.ax, v = Math.abs(y - o.cy) / o.ay;
      let rr = Math.pow(Math.pow(u, o.n) + Math.pow(v, o.n), 1 / o.n);
      rr *= 1 + 0.028 * coast(x / 170, y / 170) + 0.005 * coast(x / 60 + 9, y / 60 - 4);
      // cliff: 0 outside, rising steeply inside the rim band, rounded at the top edge
      const q = clamp((1 - rr) / o.edge, 0, 1);
      const m = q <= 0 ? 0 : Math.sqrt(q * q * (3 - 2 * q));
      mask[i] = m;
      const e = h >= SEA ? h - SEA : -(SEA - h) * o.river;      // relative to sea, river depth compressed
      const d = o.base + (e - o.base) * m;
      disp[i] = d; if (d > maxD) maxD = d;
    }
    // static brightness: height + ridge sharpness (height minus its local mean), dimmed on the cliff
    const bright = new Float32Array(N);
    const K = 3;
    for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
      const i = r * NC + c;
      let s = 0, n = 0;
      for (let k = -K; k <= K; k++) {
        const rr = clamp(r + k, 0, NR - 1), cc = clamp(c + k * 2, 0, NC - 1);
        s += raw[rr * NC + c] + raw[r * NC + cc]; n += 2;
      }
      const ridge = raw[i] - s / n;
      const ht = clamp((raw[i] - SEA) / 0.78, 0, 1);
      bright[i] = clamp(0.3 + 0.62 * Math.pow(ht, 0.85) + 2.6 * ridge, 0, 1);
    }
    // per row: island interval, segment buckets (runs), water runs
    const LV = [0, 0.34, 0.5, 0.66, 0.84];   // bucket thresholds (1..4); bucket 0 = river bed
    const TOPM = 0.9, FADEM = 0.5;            // cliff top (mask) / where the row strokes have faded out
    // fill the bays: near the north and south coasts the cliff-top line (mask = TOPM) runs almost parallel to the
    // rows and the coast noise splits a row's cliff top into pieces; every gap between them would be stroked as
    // ridgeline down the face and back up (bright U / W notches) and its ends would jump the rim. Inside each row's
    // outermost cliff-top columns the mask is raised to TOPM (and the height recomputed), so the cliff top is one
    // run per row: the coast is quantised to the rows, which is what a row renderer can draw cleanly.
    for (let r = 0; r < NR; r++) {
      let cl = -1, cr = -1;
      for (let c = 0; c < NC; c++) if (mask[r * NC + c] >= TOPM) { if (cl < 0) cl = c; cr = c; }
      for (let c = cl + 1; cl >= 0 && c < cr; c++) {
        const i = r * NC + c;
        if (mask[i] >= TOPM) continue;
        mask[i] = TOPM;
        const h = raw[i], e = h >= SEA ? h - SEA : -(SEA - h) * o.river;
        disp[i] = o.base + (e - o.base) * TOPM;
      }
    }
    maxD = 0; for (let i = 0; i < N; i++) if (disp[i] > maxD) maxD = disp[i];
    const rowsInfo = [];
    for (let r = 0; r < NR; r++) {
      let ca = -1, cb = -1;
      for (let c = 0; c < NC; c++) if (mask[r * NC + c] > 0) { if (ca < 0) ca = c; cb = c; }
      if (ca < 0) { rowsInfo.push(null); continue; }
      ca = Math.max(0, ca - 1); cb = Math.min(NC - 1, cb + 1);
      const seg = [];   // per segment c (ca..cb-1): bucket
      const wet = (c) => raw[r * NC + c] < SEA && mask[r * NC + c] > 0.97;
      // cliff-top columns (first / last point with mask >= TOPM): inside them the row is ridgeline; outside
      // them (the rim band, where the island drops to its footprint) the row is CLIFF
      let cl = -1, cr = -1;
      for (let c = ca; c <= cb; c++) if (mask[r * NC + c] >= TOPM) { if (cl < 0) cl = c; cr = c; }
      for (let c = ca; c < cb; c++) {
        const i = r * NC + c;
        if (cl < 0 || c < cl || c >= cr) { seg.push(-1); continue; }   // rim band: stroked by the fade runs
        if (wet(c) || wet(c + 1)) { seg.push(0); continue; }
        // inside the cliff top nothing is dropped: the dimmest segments still read as bucket 1, so every
        // row runs on to the rim
        const b = Math.max(bright[i], bright[i + 1]);
        seg.push(b >= LV[4] ? 4 : b >= LV[3] ? 3 : b >= LV[2] ? 2 : 1);
      }
      // fade runs: from the cliff top down the rim band to the column where the mask falls under FADEM; the
      // stroke's alpha ramps from the inner bucket's level to 0, so every row DISSOLVES down the cliff
      // instead of ending in mid-air. [from (outer, alpha 0), to (cliff top), bucket]
      const fades = [];
      if (cl >= 0) {
        let fa = cl; while (fa > ca && mask[r * NC + fa - 1] >= FADEM) fa--;
        let fb = cr; while (fb < cb && mask[r * NC + fb + 1] >= FADEM) fb++;
        const bk = (c) => { const i = r * NC + c, b = Math.max(bright[i], bright[i + 1]); return b >= LV[4] ? 4 : b >= LV[3] ? 3 : b >= LV[2] ? 2 : 1; };
        if (cl - fa >= 1) fades.push([fa, cl, cr > cl ? bk(cl) : 1]);
        if (fb - cr >= 1) fades.push([fb, cr, cr > cl ? bk(cr - 1) : 1]);
      }
      const runs = [[], [], [], [], []];
      let k0 = 0;
      for (let k = 1; k <= seg.length; k++) {
        if (k === seg.length || seg[k] !== seg[k0]) { if (seg[k0] >= 0) runs[seg[k0]].push(ca + k0, ca + k); k0 = k; }
      }
      // water runs: consecutive wet points; chord at sea level between interpolated crossings
      const water = [];
      let c = ca;
      while (c <= cb) {
        if (!wet(c)) { c++; continue; }
        const a = c; while (c + 1 <= cb && wet(c + 1)) c++;
        const b = c; c++;
        const ea = r * NC + a, eb = r * NC + b;
        let xa = xs[a], xb = xs[b];
        if (a > ca) { const d0 = disp[ea - 1], d1 = disp[ea]; if (d0 > 0 && d1 < 0) xa = xs[a - 1] + dx * d0 / (d0 - d1); }
        if (b < cb) { const d0 = disp[eb], d1 = disp[eb + 1]; if (d1 > 0 && d0 < 0) xb = xs[b] + dx * (-d0) / (d1 - d0); }
        water.push({ a, b, xa, xb });
      }
      rowsInfo.push({ ca, cb, runs, water, cl, cr, fades });
    }
    // link each water run to the overlapping run of the row above (up) and below (dn): the water surface
    // is filled as a strip between neighbouring chords, and the banks are traced along the links
    const overlap = (p, q) => p.xa < q.xb && q.xa < p.xb;
    for (let r = 0; r < NR; r++) {
      const ri = rowsInfo[r]; if (!ri) continue;
      for (const w of ri.water) {
        w.up = null; w.dn = null;
        const ru = r > 0 && rowsInfo[r - 1], rd = r < NR - 1 && rowsInfo[r + 1];
        if (ru) for (const q of ru.water) if (overlap(w, q)) { if (!w.up || Math.abs((q.xa + q.xb) - (w.xa + w.xb)) < Math.abs((w.up.xa + w.up.xb) - (w.xa + w.xb))) w.up = q; }
        if (rd) for (const q of rd.water) if (overlap(w, q)) { if (!w.dn || Math.abs((q.xa + q.xb) - (w.xa + w.xb)) < Math.abs((w.dn.xa + w.dn.xb) - (w.xa + w.xb))) w.dn = q; }
      }
    }
    // banks: chains of linked runs (top to bottom), each giving a left and a right polyline [x, y, ...]
    const banks = [];
    const used = new Set();
    for (let r = 0; r < NR; r++) {
      const ri = rowsInfo[r]; if (!ri) continue;
      for (const w of ri.water) {
        if (used.has(w)) continue;
        const L = [], Rr = [];
        let q = w, rr = r;
        while (q && !used.has(q)) { used.add(q); L.push(q.xa, ys[rr]); Rr.push(q.xb, ys[rr]); q = q.dn; rr++; }
        if (L.length >= 8) banks.push(L, Rr);
      }
    }
    // footprint outline (superellipse at the base), 160 points
    const outline = [];
    for (let k = 0; k < 160; k++) {
      const t = k / 160 * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t);
      const sx = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / o.n), sy = Math.sign(st) * Math.pow(Math.abs(st), 2 / o.n);
      let x = o.cx + o.ax * sx, y = o.cy + o.ay * sy;
      const f = 1 + 0.028 * coast(x / 170, y / 170) + 0.005 * coast(x / 60 + 9, y / 60 - 4);
      x = o.cx + (x - o.cx) / f; y = o.cy + (y - o.cy) / f;
      outline.push([x, y]);
    }
    const F = { o, NR, NC, xs, ys, dx, dy, raw, disp, mask, bright, rowsInfo, outline, banks, maxD, base: o.base, TOPM };
    // bilinear display height (normalised units) at a product point
    F.dispAt = (x, y) => {
      const fc = clamp((x - o.x0) / dx, 0, NC - 1.001), fr = clamp((y - o.y0) / dy, 0, NR - 1.001);
      const c = fc | 0, r = fr | 0, u = fc - c, v = fr - r, i = r * NC + c;
      return (disp[i] * (1 - u) + disp[i + 1] * u) * (1 - v) + (disp[i + NC] * (1 - u) + disp[i + NC + 1] * u) * v;
    };
    FIELDS.set(key, F);
    return F;
  }

  // ---------------------------------------------------------------------------------------
  // Renderer
  // ---------------------------------------------------------------------------------------
  function create(ctx, o) {
    o = Object.assign({ hs: 270, field: null }, o || {});
    const F = field(o.field);
    const HS = o.hs;
    const { canvas, g } = ctx.canvas({ parent: o.parent, className: 'ridgeline' });
    const cam = Object.assign({ tx: 820, ty: 520, th: 0, yaw: 0, pitch: 32, dist: 2200, fov: 30, sx: 0, sy: 0, roll: 0 }, o.cam || {});
    const look = Object.assign({ hs: 1, lines: 1, alpha: 1, glow: 1, water: 1, edge: 1, sweep: -1, sweepA: 0, banks: 0, rim: 1 }, o.look || {});
    const routes = [], draws = [];
    const NR = F.NR, NC = F.NC, xs = F.xs, ys = F.ys;
    const SX = new Float32Array(NC), SY = new Float32Array(NC);
    const RIM = new Float32Array(NR * 4), RIMOK = new Uint8Array(NR);   // per row: cliff-top screen points (this frame)
    // footprint edge: projected samples (closed loop) and the outward normal of the outline at each vertex
    const EM = F.outline.length;
    const EDGE = { sx: new Float32Array(EM + 1), sy: new Float32Array(EM + 1), sc: new Float32Array(EM + 1), vis: new Float32Array(EM + 1), ok: new Uint8Array(EM + 1) };
    const EN = new Float32Array(2 * EM);
    for (let k = 0; k < EM; k++) {
      const a = F.outline[(k + EM - 1) % EM], b = F.outline[(k + 1) % EM], p = F.outline[k];
      let nx = b[1] - a[1], ny = -(b[0] - a[0]);
      if (nx * (p[0] - F.o.cx) + ny * (p[1] - F.o.cy) < 0) { nx = -nx; ny = -ny; }
      const nl = Math.hypot(nx, ny) || 1; EN[2 * k] = nx / nl; EN[2 * k + 1] = ny / nl;
    }
    const BK = F.banks.map((pl) => { const m = pl.length / 2; return { pl, sx: new Float32Array(m), sy: new Float32Array(m), sc: new Float32Array(m), vis: new Float32Array(m), ok: new Uint8Array(m) }; });
    // camera basis (recomputed in prep())
    const B = { r0: 1, r2: 0, u0: 0, u1: 1, u2: 0, f0: 0, f1: 0, f2: 1, ex: 0, ey: 0, ez: 0, foc: 1000, cx: W / 2, cy: H / 2, cr: 1, sr: 0, k: HS };
    function prep() {
      const yaw = cam.yaw * DEG, pit = cam.pitch * DEG;
      const cp = Math.cos(pit), sp = Math.sin(pit), cy = Math.cos(yaw), sy = Math.sin(yaw);
      B.f0 = sy * cp; B.f1 = -sp; B.f2 = cy * cp;
      B.r0 = cy; B.r2 = -sy;
      B.u0 = sp * sy; B.u1 = cp; B.u2 = sp * cy;
      const TX = cam.tx - 800, TY = cam.th, TZ = 500 - cam.ty;
      B.ex = TX - cam.dist * B.f0; B.ey = TY - cam.dist * B.f1; B.ez = TZ - cam.dist * B.f2;
      B.foc = (H / 2) / Math.tan(cam.fov * DEG / 2);
      B.cx = W / 2 + cam.sx; B.cy = H / 2 + cam.sy;
      B.cr = Math.cos(cam.roll * DEG); B.sr = Math.sin(cam.roll * DEG);
      B.k = HS * look.hs;
    }
    // world (X = px - 800, Y up, Z = 500 - py) -> screen
    function projW(X, Y, Z, out) {
      const dx = X - B.ex, dy = Y - B.ey, dz = Z - B.ez;
      const zc = dx * B.f0 + dy * B.f1 + dz * B.f2;
      if (zc < 1) return false;
      const xc = dx * B.r0 + dz * B.r2, yc = dx * B.u0 + dy * B.u1 + dz * B.u2;
      const s = B.foc / zc;
      const ax = xc * s, ay = -yc * s;
      out[0] = B.cx + ax * B.cr - ay * B.sr; out[1] = B.cy + ax * B.sr + ay * B.cr; out[2] = zc; out[3] = s;
      return true;
    }
    const tmp = [0, 0, 0, 0];
    function project(px, py, Y) { prep(); return projW(px - 800, Y || 0, 500 - py, tmp) ? tmp.slice() : null; }
    const groundY = (px, py) => F.dispAt(px, py) * B.k;
    const surfaceY = (px, py) => Math.max(0, F.dispAt(px, py)) * B.k;

    const rgb = (a, b, t) => `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 1).toFixed(4)})`;
    const LEV = [0.13, 0.36, 0.5, 0.66, 0.9];

    // ray-march visibility of a world point toward the eye (1 visible, 0 hidden; soft over a few units)
    const maxY = () => F.maxD * B.k + 2;
    function visible(X, Y, Z) {
      const vx = B.ex - X, vy = B.ey - Y, vz = B.ez - Z;
      const hor = Math.hypot(vx, vz);
      if (hor < 1e-3) return 1;
      const top = maxY();
      if (Y >= top) return 1;
      // parameter where the ray clears the highest terrain
      const sEnd = vy > 1e-6 ? Math.min(1, (top - Y) / vy) : 1;
      const step = 7 / hor;
      let s = 10 / hor, worst = 99;
      for (let n = 0; s < sEnd && n < 160; n++, s += step) {
        const x = X + vx * s, y = Y + vy * s, z = Z + vz * s;
        const d = y - F.dispAt(x + 800, 500 - z) * B.k;
        if (d < worst) { worst = d; if (worst < -6) return 0; }
      }
      return clamp((worst + 6) / 9, 0, 1);
    }

    function route(ro) {
      ro = Object.assign({ color: C.amber, light: C.amberLight, lift: 7, width: 1 }, ro);
      const pts = ro.pts, n = pts.length;
      const cum = new Float32Array(n);
      for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const L = cum[n - 1];
      const P = { draw: 0, tail: 0, alpha: 1, head: 1, run: -1, runA: 0, glow: 1 };
      const h = { o: ro, pts, cum, L, p: P, col: hexRgb(ro.color), lig: hexRgb(ro.light),
        sx: new Float32Array(n), sy: new Float32Array(n), sc: new Float32Array(n), vis: new Float32Array(n), ok: new Uint8Array(n) };
      h.idx = (u) => { const d = clamp(u, 0, 1) * L; let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= d) lo = m; else hi = m; } return lo + (cum[hi] > cum[lo] ? (d - cum[lo]) / (cum[hi] - cum[lo]) : 0); };
      h.at = (u) => { const f = h.idx(u), i = Math.min(n - 2, f | 0), t = f - i; const x = lerp(pts[i][0], pts[i + 1][0], t), y = lerp(pts[i][1], pts[i + 1][1], t); return { x, y, Y: surfaceY(x, y) + ro.lift }; };
      routes.push(h);
      return h;
    }

    // ---- seamless additive light ----
    // Chunked strokes with per-chunk width and intensity, added with 'lighter' and BUTT caps: consecutive
    // chunks share their end sample, so they abut instead of overlapping (round caps overlapped at every
    // joint and doubled the light there: a "string of pearls"). Additive blending is linear, so the
    // antialiased coverage of the two chunks at a joint sums back to one: no seam, no bead.
    // L: { sx, sy, sc, vis, ok } sample arrays; samples i0 .. f1 (fractional end), chunk samples per stroke;
    // widthPx(s) -> px; fFn(v, mid, s) -> 0..1 intensity (<= 0 skips); col [r,g,b]; A pass alpha
    function lightPass(L, i0, f1, chunk, widthPx, fFn, col, A) {
      if (A <= 0.001) return;
      const n = L.sx.length, iEnd = Math.min(n - 1, Math.ceil(f1));
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'butt'; g.lineJoin = 'round';
      for (let a = i0; a < iEnd; a += chunk) {
        const b = Math.min(iEnd, a + chunk);
        let vs = 0, ss = 0, cnt = 0, okAll = true;
        for (let i = a; i <= b; i++) { if (!L.ok[i]) { okAll = false; break; } vs += L.vis[i]; ss += L.sc[i]; cnt++; }
        if (!okAll) continue;
        const v = vs / cnt, s = ss / cnt;
        const f = fFn(v, (a + b) / 2, s);
        if (!(f > 0.004)) continue;
        g.strokeStyle = rgba(col, A * Math.min(1, f)); g.lineWidth = widthPx(s);
        g.beginPath(); g.moveTo(L.sx[a], L.sy[a]);
        for (let i = a + 1; i <= b; i++) {
          if (i === b && b === iEnd && f1 < iEnd) { const t = f1 - (iEnd - 1); g.lineTo(lerp(L.sx[i - 1], L.sx[i], t), lerp(L.sy[i - 1], L.sy[i], t)); }
          else g.lineTo(L.sx[i], L.sy[i]);
        }
        g.stroke();
      }
      g.globalCompositeOperation = 'source-over'; g.lineCap = 'round';
    }

    function strokeChunks(h, i0, f1, widthPx, colorFn, comp) {
      // stroke samples i0 .. f1 (fractional end) in chunks of 6 with per-chunk width and alpha
      const n = h.pts.length;
      const iEnd = Math.min(n - 1, Math.ceil(f1));
      g.globalCompositeOperation = comp || 'source-over';
      for (let a = i0; a < iEnd; a += 6) {
        const b = Math.min(iEnd, a + 6);
        let vs = 0, ss = 0, cnt = 0, okAll = true;
        for (let i = a; i <= b; i++) { if (!h.ok[i]) okAll = false; vs += h.vis[i]; ss += h.sc[i]; cnt++; }
        if (!okAll) continue;
        const v = vs / cnt, s = ss / cnt;
        const st = colorFn(v, (a + b) / 2, s);
        if (!st) continue;
        g.strokeStyle = st; g.lineWidth = widthPx(s);
        g.beginPath(); g.moveTo(h.sx[a], h.sy[a]);
        for (let i = a + 1; i <= b; i++) {
          if (i === b && b === iEnd && f1 < iEnd) {
            const t = f1 - (iEnd - 1);
            g.lineTo(lerp(h.sx[i - 1], h.sx[i], t), lerp(h.sy[i - 1], h.sy[i], t));
          } else g.lineTo(h.sx[i], h.sy[i]);
        }
        g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
    }

    function drawRoute(h, lt) {
      const P = h.p; if (P.alpha <= 0.001 || (P.draw <= 0.0005 && P.run < 0)) return;
      const n = h.pts.length, out = [0, 0, 0, 0];
      for (let i = 0; i < n; i++) {
        const x = h.pts[i][0], y = h.pts[i][1];
        const Y = surfaceY(x, y) + h.o.lift;
        const ok = projW(x - 800, Y, 500 - y, out);
        h.ok[i] = ok ? 1 : 0;
        if (!ok) continue;
        h.sx[i] = out[0]; h.sy[i] = out[1]; h.sc[i] = out[3];
        h.vis[i] = visible(x - 800, Y, 500 - y);
      }
      const sref = B.foc / cam.dist;
      const wk = (s) => clamp(s / sref, 0.55, 2.2) * h.o.width;
      const A = P.alpha;
      const f0 = h.idx(P.tail), f1 = h.idx(P.draw);
      if (P.draw > P.tail + 0.0005) {
        const i0 = Math.floor(f0);
        // glow passes (additive light), then the core
        // a graded falloff (four nested tubes) so the halo reads soft, not as two flat bands
        const gv = (v) => (v > 0.02 ? v : 0);
        lightPass(h, i0, f1, 6, (s) => 36 * wk(s), gv, h.col, 0.03 * A * P.glow);
        lightPass(h, i0, f1, 6, (s) => 23 * wk(s), gv, h.col, 0.045 * A * P.glow);
        lightPass(h, i0, f1, 6, (s) => 13 * wk(s), gv, h.col, 0.09 * A * P.glow);
        lightPass(h, i0, f1, 6, (s) => 7 * wk(s), gv, h.col, 0.14 * A * P.glow);
        strokeChunks(h, i0, f1, (s) => 3.4 * wk(s), (v) => v > 0.02 ? rgba(h.col, 0.95 * v * A) : null);
        strokeChunks(h, i0, f1, (s) => 1.4 * wk(s), (v) => v > 0.02 ? rgba(h.lig, 0.9 * v * A) : null);
        // bright head + hot trail (the last ~70 units)
        if (P.head > 0.001) {
          const tl = Math.max(P.tail, P.draw - 70 / h.L);
          const ft = h.idx(tl);
          lightPass(h, Math.floor(ft), f1, 3, (s) => 4.2 * wk(s), (v, mid) => (v > 0.02 ? v * P.head * clamp((mid - ft) / Math.max(1, f1 - ft), 0, 1) : 0), h.lig, A);
          headGlow(h, f1, 1.0 * P.head * A, wk);
        }
      }
      if (P.run >= 0 && P.runA > 0.001) {
        const fr = h.idx(P.run), fb = h.idx(Math.max(0, P.run - 170 / h.L));
        lightPass(h, Math.floor(fb), fr, 3, (s) => 16 * wk(s), (v, mid) => (v > 0.02 ? v * Math.pow(clamp((mid - fb) / Math.max(1, fr - fb), 0, 1), 1.5) : 0), h.col, 0.28 * A * P.runA);
        lightPass(h, Math.floor(fb), fr, 3, (s) => 5.5 * wk(s), (v, mid) => (v > 0.02 ? v * Math.pow(clamp((mid - fb) / Math.max(1, fr - fb), 0, 1), 1.2) : 0), h.lig, A * P.runA);
        headGlow(h, fr, 1.3 * P.runA * A, wk);
      }
    }
    function headGlow(h, f, a, wk) {
      const n = h.pts.length, i = Math.min(n - 2, Math.floor(f)), t = f - i;
      if (!h.ok[i] || !h.ok[i + 1]) return;
      const x = lerp(h.sx[i], h.sx[i + 1], t), y = lerp(h.sy[i], h.sy[i + 1], t), v = lerp(h.vis[i], h.vis[i + 1], t) * a;
      if (v <= 0.01) return;
      const s = wk(lerp(h.sc[i], h.sc[i + 1], t)), R = 46 * s;
      g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, rgba(h.lig, 0.75 * v)); gr.addColorStop(0.18, rgba(h.col, 0.32 * v)); gr.addColorStop(1, rgba(h.col, 0));
      g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R);
      g.fillStyle = rgba(INK, 0.95 * v);
      g.beginPath(); g.arc(x, y, 3.2 * s, 0, Math.PI * 2); g.fill();
      g.globalCompositeOperation = 'source-over';
    }

    // ---- helpers for scenes (inside R.draw callbacks) ----
    const RG = { sx: new Float32Array(257), sy: new Float32Array(257), sc: new Float32Array(257), vis: new Float32Array(257), ok: new Uint8Array(257) };
    function ring(gg, ro) {
      ro = Object.assign({ r: 64, color: C.amber, a: 1, lw: 2, glow: 1, lift: 2, seg: 72, drape: false, halo: null }, ro);
      if (ro.a <= 0.001) return;
      if (ro.drape) {
        // draped: every point sits on the terrain (+ lift) and is occluded by the ridges in front of it
        const n = Math.min(256, Math.max(24, Math.round(ro.seg))), col = hexRgb(ro.color), out = [0, 0, 0, 0];
        const L = { sx: RG.sx.subarray(0, n + 1), sy: RG.sy.subarray(0, n + 1), sc: RG.sc.subarray(0, n + 1), vis: RG.vis.subarray(0, n + 1), ok: RG.ok.subarray(0, n + 1) };
        for (let k = 0; k <= n; k++) {
          const t = k / n * Math.PI * 2, x = ro.x + ro.r * Math.cos(t), y = ro.y + ro.r * Math.sin(t);
          const Y = surfaceY(x, y) + ro.lift;
          const ok = projW(x - 800, Y, 500 - y, out);
          L.ok[k] = ok ? 1 : 0; if (!ok) continue;
          L.sx[k] = out[0]; L.sy[k] = out[1]; L.sc[k] = out[3];
          L.vis[k] = visible(x - 800, Y, 500 - y);
        }
        if (ro.halo) for (const [hw, ha, hc] of ro.halo) lightPass(L, 0, n, 2, () => hw, (v) => v, hc ? hexRgb(hc) : col, ha * ro.a);
        else if (ro.glow > 0) lightPass(L, 0, n, 2, () => ro.lw * 7, (v) => v, col, 0.12 * ro.a * ro.glow);
        lightPass(L, 0, n, 2, () => ro.lw, (v) => v, col, ro.a);
        return;
      }
      const Y = surfaceY(ro.x, ro.y) + ro.lift, out = [0, 0, 0, 0], col = hexRgb(ro.color);
      const pts = [];
      for (let k = 0; k <= ro.seg; k++) {
        const t = k / ro.seg * Math.PI * 2;
        if (!projW(ro.x + ro.r * Math.cos(t) - 800, Y, 500 - (ro.y + ro.r * Math.sin(t)), out)) return;
        pts.push(out[0], out[1]);
      }
      const path = () => { gg.beginPath(); gg.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) gg.lineTo(pts[k], pts[k + 1]); };
      if (ro.glow > 0) {
        gg.globalCompositeOperation = 'lighter';
        path(); gg.strokeStyle = rgba(col, 0.12 * ro.a * ro.glow); gg.lineWidth = ro.lw * 7; gg.stroke();
        gg.globalCompositeOperation = 'source-over';
      }
      path(); gg.strokeStyle = rgba(col, ro.a); gg.lineWidth = ro.lw; gg.stroke();
    }
    function pillar(gg, po) {
      po = Object.assign({ h: 150, color: C.amber, kind: 'diamond', a: 1, s: 1, grow: 1, emb: null, embT: 0, embE: 0 }, po);
      if (po.a <= 0.001 || po.grow <= 0.001) return;
      const Y0 = surfaceY(po.x, po.y) + 3, Y1 = Y0 + po.h * po.grow;
      const p0 = [0, 0, 0, 0], p1 = [0, 0, 0, 0];
      if (!projW(po.x - 800, Y0, 500 - po.y, p0) || !projW(po.x - 800, Y1, 500 - po.y, p1)) return;
      const col = hexRgb(po.color);
      const sk = clamp(p1[3] / (B.foc / cam.dist), 0.6, 2.2) * po.s;
      // emb: [sx, sy] screen point the emblem (and the beam top) is pulled toward by embT (a match cut)
      if (po.emb && po.embT > 0) { const t = clamp(po.embT, 0, 1); p1[0] = lerp(p1[0], po.emb[0], t); p1[1] = lerp(p1[1], po.emb[1], t); }
      // beam: additive glow + a thin bright line, fading to the top
      gg.globalCompositeOperation = 'lighter';
      let gr = gg.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
      gr.addColorStop(0, rgba(col, 0.32 * po.a)); gr.addColorStop(1, rgba(col, 0.04 * po.a));
      gg.strokeStyle = gr; gg.lineWidth = 12 * sk; gg.lineCap = 'butt';
      gg.beginPath(); gg.moveTo(p0[0], p0[1]); gg.lineTo(p1[0], p1[1]); gg.stroke();
      gr = gg.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
      gr.addColorStop(0, rgba(col, 1 * po.a)); gr.addColorStop(1, rgba(col, 0.5 * po.a));
      gg.strokeStyle = gr; gg.lineWidth = 1.8 * sk;
      gg.beginPath(); gg.moveTo(p0[0], p0[1]); gg.lineTo(p1[0], p1[1]); gg.stroke();
      // base glow
      const R = 34 * sk;
      gr = gg.createRadialGradient(p0[0], p0[1], 0, p0[0], p0[1], R);
      gr.addColorStop(0, rgba(col, 0.55 * po.a)); gr.addColorStop(1, rgba(col, 0));
      gg.fillStyle = gr; gg.fillRect(p0[0] - R, p0[1] - R, 2 * R, 2 * R);
      gg.globalCompositeOperation = 'source-over';
      // emblem at the top
      const ex = p1[0], ey = p1[1], e = (po.embE > 0 && po.embT > 0 ? lerp(11 * sk, po.embE, clamp(po.embT, 0, 1)) : 11 * sk);
      gg.save(); gg.translate(ex, ey);
      if (po.kind === 'diamond') {
        gg.globalCompositeOperation = 'lighter';
        const gl = gg.createRadialGradient(0, 0, 0, 0, 0, e * 3.4);
        gl.addColorStop(0, rgba(col, 0.42 * po.a)); gl.addColorStop(1, rgba(col, 0));
        gg.fillStyle = gl; gg.fillRect(-e * 3.4, -e * 3.4, e * 6.8, e * 6.8);
        gg.globalCompositeOperation = 'source-over';
        gg.fillStyle = rgba(col, po.a);
        gg.beginPath(); gg.moveTo(0, -e * 1.25); gg.lineTo(e, 0); gg.lineTo(0, e * 1.25); gg.lineTo(-e, 0); gg.closePath(); gg.fill();
      } else {
        gg.globalCompositeOperation = 'lighter';
        const gl = gg.createRadialGradient(0, 0, 0, 0, 0, e * 3.4);
        gl.addColorStop(0, rgba(col, 0.4 * po.a)); gl.addColorStop(1, rgba(col, 0));
        gg.fillStyle = gl; gg.fillRect(-e * 3.4, -e * 3.4, e * 6.8, e * 6.8);
        gg.globalCompositeOperation = 'source-over';
        gg.strokeStyle = rgba(col, po.a); gg.lineWidth = 2.6 * sk;
        gg.beginPath(); gg.arc(0, 0, e * 0.95, 0, Math.PI * 2); gg.stroke();
        gg.fillStyle = rgba(GROUND, po.a);
        gg.beginPath(); gg.arc(0, 0, e * 0.95 - 1.3 * sk, 0, Math.PI * 2); gg.fill();
      }
      gg.restore();
    }
    // the Floodgate: a low box lying in the river at (800,560), rotated -32 deg (as on the map)
    const GATE = (() => {
      const a = -32 * DEG, ca = Math.cos(a), sa = Math.sin(a);
      const loc = (u, v) => [800 + u * ca - v * sa, 560 + u * sa + v * ca];
      return { box: [loc(-58, -12), loc(58, -12), loc(58, 12), loc(-58, 12)], bars: [-40, -22, -4, 14, 32].map((u) => [loc(u, -12), loc(u, 12)]) };
    })();
    function gate(gg, go) {
      go = Object.assign({ a: 1, lit: 0, h: 12 }, go);
      if (go.a <= 0.001) return;
      const top = [], bot = [], out = [0, 0, 0, 0];
      for (const [x, y] of GATE.box) {
        if (!projW(x - 800, go.h, 500 - y, out)) return; top.push([out[0], out[1]]);
        if (!projW(x - 800, -4, 500 - y, out)) return; bot.push([out[0], out[1]]);
      }
      const col = AMBER;
      gg.lineJoin = 'round';
      // body
      gg.fillStyle = rgba([26, 22, 17], go.a);
      gg.beginPath(); bot.forEach((p, i) => (i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]))); gg.closePath(); gg.fill();
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        gg.beginPath(); gg.moveTo(bot[i][0], bot[i][1]); gg.lineTo(bot[j][0], bot[j][1]); gg.lineTo(top[j][0], top[j][1]); gg.lineTo(top[i][0], top[i][1]); gg.closePath(); gg.fill();
      }
      gg.fillStyle = rgba([42, 34, 25], go.a);
      gg.beginPath(); top.forEach((p, i) => (i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]))); gg.closePath(); gg.fill();
      gg.strokeStyle = rgba(col, go.a * (0.85 + 0.15 * go.lit)); gg.lineWidth = 1.6;
      gg.stroke();
      for (let i = 0; i < 4; i++) { gg.beginPath(); gg.moveTo(bot[i][0], bot[i][1]); gg.lineTo(top[i][0], top[i][1]); gg.strokeStyle = rgba(col, 0.45 * go.a); gg.lineWidth = 1.1; gg.stroke(); }
      gg.strokeStyle = rgba(col, (0.45 + 0.55 * go.lit) * go.a); gg.lineWidth = 1.3;
      for (const [p, q] of GATE.bars) {
        if (!projW(p[0] - 800, go.h, 500 - p[1], out)) continue; const ax = out[0], ay = out[1];
        if (!projW(q[0] - 800, go.h, 500 - q[1], out)) continue;
        gg.beginPath(); gg.moveTo(ax, ay); gg.lineTo(out[0], out[1]); gg.stroke();
      }
    }

    // ---- the frame ----
    function frame(lt) {
      prep();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.clearRect(0, 0, W, H);
      if (look.alpha <= 0.001) return;
      g.globalAlpha = clamp(look.alpha, 0, 1);
      g.lineJoin = 'round'; g.lineCap = 'round';
      const out = [0, 0, 0, 0];
      const baseY = F.base * B.k;

      // depth range of the rows (for the distance falloff of brightness and line weight)
      let zN = Infinity, zF = -Infinity;
      const rowZ = new Float32Array(NR);
      for (let r = 0; r < NR; r++) {
        const ri = F.rowsInfo[r]; if (!ri) continue;
        const cm = (ri.ca + ri.cb) >> 1;
        const dx = xs[cm] - 800 - B.ex, dy = -B.ey, dz = 500 - ys[r] - B.ez;
        const zc = dx * B.f0 + dy * B.f1 + dz * B.f2; rowZ[r] = zc;
        if (zc < zN) zN = zc; if (zc > zF) zF = zc;
      }

      // rim light: soft amber haze behind the island (the island's fills cut it to a halo)
      if (look.glow > 0.001 && projW(0, F.maxD * B.k * 0.35, 0, out)) {
        const cx0 = out[0], cy0 = out[1], s0 = out[3];
        const R0 = 980 * s0;
        let gr = g.createRadialGradient(cx0, cy0, R0 * 0.15, cx0, cy0, R0);
        gr.addColorStop(0, `rgba(239,189,112,${(0.13 * look.glow).toFixed(4)})`);
        gr.addColorStop(0.55, `rgba(163,122,66,${(0.06 * look.glow).toFixed(4)})`);
        gr.addColorStop(1, 'rgba(163,122,66,0)');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        // tighter backlight on the far edge
        if (projW(0, F.maxD * B.k * 0.2, 500 - (F.o.cy - F.o.ay * 0.92), out)) {
          const R1 = 700 * out[3];
          gr = g.createRadialGradient(out[0], out[1], 0, out[0], out[1], R1);
          gr.addColorStop(0, `rgba(246,211,159,${(0.12 * look.glow).toFixed(4)})`);
          gr.addColorStop(1, 'rgba(246,211,159,0)');
          g.save(); g.translate(out[0], out[1]); g.scale(1.9, 0.6); g.translate(-out[0], -out[1]);
          g.fillStyle = gr; g.fillRect(out[0] - R1, out[1] - R1, 2 * R1, 2 * R1);
          g.restore();
        }
      }
      // painter's order: rows farthest from the eye (in map depth) first
      const ezr = 500 - B.ez;   // eye position in product y
      let lo = 0, hi = NR - 1;
      const order = [];
      while (lo <= hi) { if (Math.abs(ys[lo] - ezr) >= Math.abs(ys[hi] - ezr)) order.push(lo++); else order.push(hi--); }

      const sweepOn = look.sweepA > 0.001;
      const relief = clamp((look.hs - 0.3) / 0.6, 0, 1);   // ridge highlights grow with the relief
      const lev = LEV.map((v, b) => (b >= 2 ? lerp(LEV[1] + 0.04 * (b - 1), v, relief) : v));
      const top = AMBER.map((v, i) => v + (AMBER_L[i] - v) * relief);
      let rimLeft = look.glow > 0.001 ? 7 : 0;
      const groundCss = `rgb(${GROUND[0]},${GROUND[1]},${GROUND[2]})`, cliffCss = `rgb(${CLIFF[0]},${CLIFF[1]},${CLIFF[2]})`;
      const cliffLipCss = `rgb(${CLIFF_LIP[0]},${CLIFF_LIP[1]},${CLIFF_LIP[2]})`, cliffFootCss = `rgb(${CLIFF_FOOT[0]},${CLIFF_FOOT[1]},${CLIFF_FOOT[2]})`;
      const lipY = 0.11 * B.k;   // the cliff-top level near the coast (normalised height ~0.11)
      const waterCss = rgb(WATER, WATER_CORE, clamp(look.banks, 0, 1));
      const wA = clamp(look.alpha, 0, 1) * clamp(look.water, 0, 1);
      RIMOK.fill(0);
      for (const r of order) {
        const ri = F.rowsInfo[r]; if (!ri) continue;
        const Z = 500 - ys[r];
        let ok = true;
        for (let c = ri.ca; c <= ri.cb; c++) {
          if (!projW(xs[c] - 800, F.disp[r * NC + c] * B.k, Z, out)) { ok = false; break; }
          SX[c] = out[0]; SY[c] = out[1];
        }
        if (!ok) continue;
        // the neighbour row drawn just before this one (farther from the eye)
        const up = ys[r] < ezr, nb = up ? r - 1 : r + 1;
        // distance falloff
        const near = zF > zN ? clamp((zF - rowZ[r]) / (zF - zN), 0, 1) : 1;
        let df = (0.6 + 0.4 * Math.pow(near, 0.9)) * look.lines;
        if (sweepOn) { const rz = r / (NR - 1), d = (rz - look.sweep) / 0.05; df += look.sweepA * 0.9 * Math.exp(-d * d); }
        const lw = 0.85 + 1.25 * near;
        // water surface between the neighbour's chord and this row's chord (a continuous sheet at sea level,
        // so the banks do not show ground-coloured teeth between the rows); the neighbour's surface line is
        // re-stroked on top of it
        if (ri.water.length && wA > 0.001 && nb >= 0 && nb < NR) {
          const Zn = 500 - ys[nb];
          for (const w of ri.water) {
            const q = up ? w.up : w.dn; if (!q) continue;
            if (!projW(w.xa - 800, 0, Z, out)) continue; const ax = out[0], ay = out[1];
            if (!projW(w.xb - 800, 0, Z, out)) continue; const bx = out[0], by = out[1];
            if (!projW(q.xb - 800, 0, Zn, out)) continue; const cx = out[0], cy = out[1];
            if (!projW(q.xa - 800, 0, Zn, out)) continue; const dx2 = out[0], dy2 = out[1];
            g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(cx, cy); g.lineTo(dx2, dy2); g.closePath();
            g.fillStyle = waterCss; g.globalAlpha = wA; g.fill();
            g.globalAlpha = clamp(look.alpha, 0, 1);
            g.beginPath(); g.moveTo(dx2, dy2); g.lineTo(cx, cy);
            g.strokeStyle = rgb(GROUND, BONE, 0.11 * df * look.water); g.lineWidth = 0.8 + 0.5 * near; g.stroke();
          }
        }
        // body: line closed along its base (the end points sit on the base), filled with the ground
        g.beginPath(); g.moveTo(SX[ri.ca], SY[ri.ca]);
        for (let c = ri.ca + 1; c <= ri.cb; c++) g.lineTo(SX[c], SY[c]);
        g.closePath();
        if (rimLeft > 0) {
          // rim light: the farthest rows carry a soft backlit bloom; nearer fills keep only its top edge
          g.globalCompositeOperation = 'lighter';
          g.strokeStyle = `rgba(239,189,112,${(0.05 * look.glow * (rimLeft / 7)).toFixed(4)})`; g.lineWidth = 16; g.stroke();
          g.strokeStyle = `rgba(246,211,159,${(0.08 * look.glow * (rimLeft / 7)).toFixed(4)})`; g.lineWidth = 5; g.stroke();
          g.globalCompositeOperation = 'source-over';
          rimLeft--;
        }
        // the slab is CLIFF, overlaid with GROUND where it is surface: over the cliff top (cl..cr), from the line
        // down to the base wherever the next nearer row is on the plateau too (so the band between the two lines
        // is terrain), and only a thin lip (LIP units) where the nearer row has dropped into the rim band (the band
        // below is cliff face). Rows that never reach the cliff top are cliff throughout (the near / far faces).
        // the cliff face is lit from above: a vertical ramp from CLIFF_LIP at the cliff-top level to CLIFF_FOOT at the
        // footprint (world heights, so every row's slab carries the same ramp and the face reads as one surface)
        {
          const cm = (ri.ca + ri.cb) >> 1;
          let fs = cliffCss;
          if (projW(xs[cm] - 800, lipY, Z, out)) {
            const ax = out[0], ay = out[1];
            if (projW(xs[cm] - 800, baseY, Z, out) && Math.hypot(out[0] - ax, out[1] - ay) > 1) {
              fs = g.createLinearGradient(ax, ay, out[0], out[1]);
              fs.addColorStop(0, cliffLipCss); fs.addColorStop(1, cliffFootCss);
            }
          }
          g.fillStyle = fs; g.fill();
        }
        if (ri.cl >= 0) {
          const nn = up ? r + 1 : r - 1, nOK = nn >= 0 && nn < NR && F.rowsInfo[nn], mrow = nn * NC;
          const plat = (c) => nOK && F.mask[mrow + c] >= F.TOPM;
          g.beginPath(); g.moveTo(SX[ri.cl], SY[ri.cl]);
          for (let c = ri.cl + 1; c <= ri.cr; c++) g.lineTo(SX[c], SY[c]);
          let c = ri.cr;
          while (c >= ri.cl) {
            if (plat(c)) {
              let c2 = c; while (c2 - 1 >= ri.cl && plat(c2 - 1)) c2--;
              if (projW(xs[c] - 800, baseY, Z, out)) g.lineTo(out[0], out[1]);
              if (projW(xs[c2] - 800, baseY, Z, out)) g.lineTo(out[0], out[1]);
              c = c2 - 1;
            } else {
              if (projW(xs[c] - 800, F.disp[r * NC + c] * B.k - LIP, Z, out)) g.lineTo(out[0], out[1]);
              c--;
            }
          }
          g.closePath(); g.fillStyle = groundCss; g.fill();
        }
        // water: flat surface between the sea crossings, over the dipping bed
        if (ri.water.length && look.water > 0.001) {
          for (const w of ri.water) {
            const pa = [0, 0], pb = [0, 0];
            if (!projW(w.xa - 800, 0, Z, out)) continue; pa[0] = out[0]; pa[1] = out[1];
            if (!projW(w.xb - 800, 0, Z, out)) continue; pb[0] = out[0]; pb[1] = out[1];
            g.beginPath(); g.moveTo(pa[0], pa[1]);
            for (let c = w.a; c <= w.b; c++) g.lineTo(SX[c], SY[c]);
            g.lineTo(pb[0], pb[1]); g.closePath();
            g.fillStyle = waterCss; g.globalAlpha = wA; g.fill();
            g.globalAlpha = clamp(look.alpha, 0, 1);
            g.beginPath(); g.moveTo(pa[0], pa[1]); g.lineTo(pb[0], pb[1]);
            g.strokeStyle = rgb(GROUND, BONE, 0.11 * df * look.water); g.lineWidth = 0.8 + 0.5 * near; g.stroke();
          }
        }
        // ridgelines by brightness bucket (0 = river bed, very dim)
        for (let b = 0; b < 5; b++) {
          const rr = ri.runs[b]; if (!rr.length) continue;
          g.beginPath();
          for (let k = 0; k < rr.length; k += 2) {
            g.moveTo(SX[rr[k]], SY[rr[k]]);
            for (let c = rr[k] + 1; c <= rr[k + 1]; c++) g.lineTo(SX[c], SY[c]);
          }
          const lv = clamp(lev[b] * df, 0, 1);
          g.strokeStyle = b === 4 ? rgb(GROUND, top, Math.min(1, lv * 1.02)) : rgb(GROUND, AMBER, lv);
          g.lineWidth = b === 0 ? lw * 0.75 : b === 4 ? lw * (1 + 0.3 * relief) : lw;
          g.stroke();
        }
        // rim band: each row runs on over the cliff top and dissolves down the face (alpha ramps to 0)
        for (const [fa, fc, b] of ri.fades) {
          const lv = clamp(lev[b] * df, 0, 1);
          const gr = g.createLinearGradient(SX[fa], SY[fa], SX[fc], SY[fc]);
          gr.addColorStop(0, rgba(AMBER, 0)); gr.addColorStop(0.6, rgba(AMBER, 0.3 * lv)); gr.addColorStop(1, rgba(AMBER, lv));
          g.strokeStyle = gr; g.lineWidth = lw;
          g.beginPath();
          const c0 = Math.min(fa, fc), c1 = Math.max(fa, fc);
          g.moveTo(SX[c0], SY[c0]); for (let c = c0 + 1; c <= c1; c++) g.lineTo(SX[c], SY[c]);
          g.stroke();
        }
        // cliff-top rim: joins this row's first / last cliff-top points to the neighbour's, both sides, only where the
        // cliff top runs ACROSS the rows (east / west coasts: the end column moves <= 2 columns row to row). Where it
        // runs along them (north / south) the ends jump, and the row itself is the cliff-top line there: no chord.
        if (ri.cl >= 0) {
          const j = r * 4;
          RIM[j] = SX[ri.cl]; RIM[j + 1] = SY[ri.cl]; RIM[j + 2] = SX[ri.cr]; RIM[j + 3] = SY[ri.cr]; RIMOK[r] = 1;
          const rn = nb >= 0 && nb < NR && F.rowsInfo[nb];
          if (look.rim > 0.001 && rn && RIMOK[nb]) {
            const n4 = nb * 4, okL = Math.abs(rn.cl - ri.cl) <= 2, okR = Math.abs(rn.cr - ri.cr) <= 2;
            if (okL || okR) {
              g.beginPath();
              if (okL) { g.moveTo(RIM[n4], RIM[n4 + 1]); g.lineTo(RIM[j], RIM[j + 1]); }
              if (okR) { g.moveTo(RIM[n4 + 2], RIM[n4 + 3]); g.lineTo(RIM[j + 2], RIM[j + 3]); }
              g.strokeStyle = rgb(GROUND, AMBER, clamp(0.45 * df * look.rim, 0, 1)); g.lineWidth = lw; g.stroke();
            }
          }
        }
      }
      g.globalAlpha = 1;
      // footprint edge: the foot of every cliff face that turns toward the camera, drawn OVER the body (seamless
      // additive light) and faded out as a face turns edge-on; faces turned away are hidden by the island anyway
      if (look.edge > 0.001) {
        const exP = B.ex + 800, eyP = 500 - B.ez, m = F.outline.length;
        for (let k = 0; k <= m; k++) {
          const [x, y] = F.outline[k % m];
          const ok2 = projW(x - 800, baseY, 500 - y, out);
          EDGE.ok[k] = ok2 ? 1 : 0; if (!ok2) continue;
          EDGE.sx[k] = out[0]; EDGE.sy[k] = out[1]; EDGE.sc[k] = out[3];
          const ex2 = exP - x, ey2 = eyP - y, el = Math.hypot(ex2, ey2) || 1;
          const f = (EN[2 * (k % m)] * ex2 + EN[2 * (k % m) + 1] * ey2) / el;
          EDGE.vis[k] = clamp(f / 0.3, 0, 1) * clamp(f / 0.3, 0, 1) * (3 - 2 * clamp(f / 0.3, 0, 1));
        }
        const A = clamp(look.alpha, 0, 1) * look.edge;
        lightPass(EDGE, 0, m, 4, () => 7, (v) => v, AMBER, 0.1 * A);
        lightPass(EDGE, 0, m, 4, () => 1.3, (v) => v, AMBER, 0.55 * A);
      }
      // river banks (the map's bright river edges): the sea crossings row to row, traced at sea level
      if (look.banks > 0.001) {
        for (const L of BK) {
          const pl = L.pl, m = L.sx.length;
          for (let k = 0; k < m; k++) {
            const X = pl[2 * k] - 800, Z = 500 - pl[2 * k + 1];
            const ok2 = projW(X, 1, Z, out);
            L.ok[k] = ok2 ? 1 : 0; if (!ok2) continue;
            L.sx[k] = out[0]; L.sy[k] = out[1]; L.sc[k] = out[3];
            L.vis[k] = visible(X, 1, Z);
          }
          lightPass(L, 0, m - 1, 2, () => 1.2, (v) => v, AMBER, 0.4 * clamp(look.banks, 0, 1) * clamp(look.alpha, 0, 1));
        }
      }
      for (const h of routes) drawRoute(h, lt);
      for (const fn of draws) { g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; fn(g, lt, R); }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
    ctx.onFrame(frame);

    const R = {
      canvas, g, cam, look, field: F, HS,
      route, project, groundY, surfaceY,
      draw(fn) { draws.push(fn); return R; },
      ring(gg, ro) { ring(gg, ro); }, pillar(gg, po) { pillar(gg, po); }, gate(gg, go) { gate(gg, go); },
      visibleAt(px, py, Y) { prep(); return visible(px - 800, Y, 500 - py); },
    };
    return R;
  }

  window.Ridgeline = { create, field, bezier, PLANS, POINTS, SEA };
})();
