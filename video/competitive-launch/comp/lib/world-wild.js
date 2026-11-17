/* world-wild.js (v4): two canvas worlds for the MAKE YOUR MOVE drop (c07a / c07b). Exposes window.WorldWild.
 *
 * Both worlds are deterministic (seeded PRNG + seeded noise), bake their static ground once into offscreen
 * canvases the first time they are drawn (lazy: no cost at film boot), and per frame only draw the cached ground
 * through the camera plus a few hundred live shapes. The camera is a PURE FUNCTION the scene passes in
 * (camAt(t) -> state), so the renderer can also sample it a fraction of a frame earlier: fast camera moves get a
 * real accumulation motion blur (several renders averaged, sample count from the on-screen speed).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * ICE STATION   const I = WorldWild.ice(ctx, { camAt, parent, shutter, maxSamples })
 *   A light world (bright ice under a low polar sun): an ice shelf of cracked low-poly plates (bevelled slabs,
 *   dark crevasses, open leads), pressure ridges of shaded ice blocks, the shelf edge as a cliff into a black
 *   sea with floes, a research base (modules on stilts with lit windows, a geodesic radome, fuel tanks,
 *   containers, guyed masts with amber beacons that blink on the beat), three outlying sites (relay, drill,
 *   cache) on ringed pads, and packed-snow tracks from the base to each site. Long crisp shadows are baked.
 *   Driving snow (screen streaks in three depth layers, dragged by the camera motion) and ground drift (a
 *   moving spindrift pattern on the ice) are live.
 *   Orthographic 3D camera (isometric family), world units ~ metres: X east, Z south, Y up. Base at (0, 0).
 *     camAt(t) -> { tx, tz (target on the ground), yaw (deg), pitch (deg, 90 = top-down), zoom (px per unit),
 *                   sx, sy (screen offset of the target from the frame centre, px), roll (deg) }
 *   I.look   proxy: snow (0..1+ intensity), drift (0..1), flash (0..1 white overexposure), beacons (0..1),
 *            snowBoost (extra near-layer burst), dim (0..1 darken the world, e.g. under a big word)
 *   I.SITES  [{ id, name, x, z }] relay / drill / cache;  I.PATHS [{ pl, cum, len }] base -> site (world xz)
 *   I.HUB    the base hub point [x, z];  I.at(path, s) -> [x, z, angle] at arc length s
 *   I.P      the current projection (valid inside hooks / onFrame after the world drew):
 *            I.P.pt(x, y, z) -> [sx, sy] (a shared array: copy it), I.P.zoom, I.P.cosP (cos pitch)
 *   I.ground(fn)  hook drawn after the ground, before the 3D objects: fn(g, lt, I)  (trails, ground discs)
 *   I.top(fn)     hook drawn after the 3D objects, before the snow: fn(g, lt, I)  (markers, beams)
 *   I.look.lit    0..1 (all sites): the site structures gain lit amber lamps
 *   Helpers for hooks: I.groundLine(g, pts2d, from, to) builds a screen path along ground points;
 *   I.groundCircle(g, x, z, r, seg) builds a projected ellipse path.
 *
 * DESERT CANYON  const D = WorldWild.desert(ctx, { camAt, parent, shutter, maxSamples })
 *   A dark engraving (scratchboard) world, top-down: a dune sea drawn as evenly spaced flow-field
 *   streamlines whose weight follows the light on each dune (lit windward slopes in bone, slip faces dark,
 *   crisp crests), a mesa plateau cut by a winding canyon and side canyons whose walls are tiers of hachures
 *   (weight by light), stippled plateau tops with strata, isolated buttes, a dry wash on the canyon floor and
 *   faint old tracks. Live: blown sand streaks drifting along the dunes.
 *   2D camera: camAt(t) -> { cx, cy (world point at the frame centre), zoom, rot (deg), sx, sy }
 *   D.ROUTES { inbound, a, b, c } polylines (world): the road in, and the three options from the fork D.FORK
 *            (a: up onto the ridge, b: down the canyon = the committed route, c: across the dunes).
 *   D.at(route, s) -> [x, y, angle];  D.P.pt(x, y) -> [sx, sy];  D.P.zoom;  D.P.rot (radians)
 *   D.ground(fn) / D.top(fn) hooks as in the ice world (both get the motion blur); D.over(fn) draws after the blur
 *            (things the camera tracks, which stay sharp);  D.look: sand (0..1), flash, dim
 * ---------------------------------------------------------------------------------------------------------------
 * Performance (measured, this machine, software raster): ice ~6-10 ms of script per frame, desert ~3-5 ms,
 * plus one large drawImage per ground layer at paint. Blur frames cost one full render per sample.
 */
(function () {
  'use strict';
  const W = 1920, H = 1080, DEG = Math.PI / 180;
  const C = Brand.C;
  const U = Film.utils;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mixA = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const css = (c, a) => (a == null || a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${(+a).toFixed(3)})`);
  const INK = hexRgb(C.ink), BONE = hexRgb(C.bone), BG = hexRgb(C.bg), MAP = hexRgb(C.map);
  const AMBER = hexRgb(C.amber), AMBER_L = hexRgb(C.amberLight), AMBER_D = hexRgb(C.amberDeep), RIVAL = hexRgb(C.rival);
  const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  // ---------------------------------------------------------------------------------------------------------
  // shared geometry
  // ---------------------------------------------------------------------------------------------------------
  /** uniform Catmull-Rom through pts ([[x,y],...]) sampled every ~step units */
  function spline(pts, step) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / (step || 6)));
      for (let k = i ? 1 : 0; k <= n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const f = (j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
        out.push([f(0), f(1)]);
      }
    }
    return out;
  }
  function measure(pl) {
    const cum = new Float64Array(pl.length);
    for (let i = 1; i < pl.length; i++) cum[i] = cum[i - 1] + Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]);
    return { pl, cum, len: cum[pl.length - 1] };
  }
  /** point at arc length s on a measured polyline: [x, y, angle (rad)] */
  function at(P, s) {
    const { pl, cum } = P, n = pl.length;
    if (s <= 0) { const a = Math.atan2(pl[1][1] - pl[0][1], pl[1][0] - pl[0][0]); return [pl[0][0] + Math.cos(a) * s, pl[0][1] + Math.sin(a) * s, a]; }
    if (s >= cum[n - 1]) { const a = Math.atan2(pl[n - 1][1] - pl[n - 2][1], pl[n - 1][0] - pl[n - 2][0]); const e = s - cum[n - 1]; return [pl[n - 1][0] + Math.cos(a) * e, pl[n - 1][1] + Math.sin(a) * e, a]; }
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
    const u = (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
    return [lerp(pl[lo][0], pl[hi][0], u), lerp(pl[lo][1], pl[hi][1], u), Math.atan2(pl[hi][1] - pl[lo][1], pl[hi][0] - pl[lo][0])];
  }
  /** index range helper: the polyline between arc lengths s0..s1 as points (with exact end points) */
  function slice(P, s0, s1) {
    const out = [];
    if (s1 <= s0) return out;
    const a = at(P, s0); out.push([a[0], a[1]]);
    const { pl, cum } = P;
    for (let i = 0; i < pl.length; i++) if (cum[i] > s0 && cum[i] < s1) out.push(pl[i]);
    const b = at(P, s1); out.push([b[0], b[1]]);
    return out;
  }
  function distToPl(x, y, pl) {
    let best = Infinity;
    for (let i = 0; i < pl.length - 1; i++) {
      const ax = pl[i][0], ay = pl[i][1], dx = pl[i + 1][0] - ax, dy = pl[i + 1][1] - ay;
      const L2 = dx * dx + dy * dy || 1;
      const t = clamp(((x - ax) * dx + (y - ay) * dy) / L2, 0, 1);
      const d = Math.hypot(x - ax - t * dx, y - ay - t * dy);
      if (d < best) best = d;
    }
    return best;
  }
  function clipHalf(poly, ax, ay, nx, ny) { // keep (p - a) . n <= 0
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const dp = (p[0] - ax) * nx + (p[1] - ay) * ny, dq = (q[0] - ax) * nx + (q[1] - ay) * ny;
      if (dp <= 0) out.push(p);
      if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  }
  /** Voronoi cells of a jittered grid over [x0, x0+w] x [y0, y0+h], cell size s. returns [{ c:[x,y], poly }] */
  function voronoiGrid(r, x0, y0, w, h, s, jit) {
    const nx = Math.ceil(w / s), ny = Math.ceil(h / s);
    const P = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) P.push([x0 + (i + 0.5 + (r() - 0.5) * 2 * jit) * s, y0 + (j + 0.5 + (r() - 0.5) * 2 * jit) * s]);
    const cells = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const p = P[j * nx + i];
      let poly = [[p[0] - 2 * s, p[1] - 2 * s], [p[0] + 2 * s, p[1] - 2 * s], [p[0] + 2 * s, p[1] + 2 * s], [p[0] - 2 * s, p[1] + 2 * s]];
      for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
        if (!di && !dj) continue;
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
        const q = P[jj * nx + ii];
        poly = clipHalf(poly, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, q[0] - p[0], q[1] - p[1]);
        if (poly.length < 3) break;
      }
      if (poly.length >= 3) cells.push({ c: p, poly });
    }
    return cells;
  }
  function centroid(poly) { let x = 0, y = 0; for (const p of poly) { x += p[0]; y += p[1]; } return [x / poly.length, y / poly.length]; }
  function inset(poly, c, d) { return poly.map((p) => { const dx = p[0] - c[0], dy = p[1] - c[1], l = Math.hypot(dx, dy) || 1; const k = Math.max(0.05, 1 - d / l); return [c[0] + dx * k, c[1] + dy * k]; }); }
  function hull(pts) {
    const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (P.length < 3) return P;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], P[i]) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  /** affine helpers: [a b c d e f] maps (x, y) -> (a x + c y + e, b x + d y + f) */
  const affMul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
  const affInv = (A) => { const det = A[0] * A[3] - A[1] * A[2]; return [A[3] / det, -A[1] / det, -A[2] / det, A[0] / det, (A[2] * A[5] - A[3] * A[4]) / det, (A[1] * A[4] - A[0] * A[5]) / det]; };
  /** max displacement (px) of a few screen points under the screen-space transform T */
  function affMotion(T) {
    let m = 0;
    for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H], [W / 2, H / 2]]) m = Math.max(m, Math.hypot(T[0] * x + T[2] * y + T[4] - x, T[1] * x + T[3] * y + T[5] - y));
    return m;
  }
  /**
   * Motion blur in image space: T maps a pixel of this frame to where its content was one shutter earlier.
   * Each pass blends the canvas with a copy moved a power-of-two fraction of T (1/2, 1/4, ...), so after k passes
   * every pixel is the average of 2^k evenly spaced samples along its own motion path (pan, push and roll).
   */
  function smear(g, cv, bctx, buf, T, mot) {
    const passes = clamp(Math.ceil(Math.log2(Math.max(2, mot / 1.2))), 1, 7);
    for (let k = 1; k <= passes; k++) {
      const f = 1 / Math.pow(2, k);
      bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.globalAlpha = 1; bctx.globalCompositeOperation = 'copy'; bctx.drawImage(cv, 0, 0); bctx.globalCompositeOperation = 'source-over';
      g.setTransform(lerp(1, T[0], f), lerp(0, T[1], f), lerp(0, T[2], f), lerp(1, T[3], f), T[4] * f, T[5] * f);
      g.globalAlpha = 0.5; g.drawImage(buf, 0, 0);
    }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  }
  function fillPoly(g, poly) { g.beginPath(); g.moveTo(poly[0][0], poly[0][1]); for (let i = 1; i < poly.length; i++) g.lineTo(poly[i][0], poly[i][1]); g.closePath(); g.fill(); }

  // =========================================================================================================
  // ICE STATION
  // =========================================================================================================
  const ICE = {
    L: norm3([-0.56, 0.52, -0.64]),          // toward the sun: low, from the north-west
    WIND: Math.atan2(0.62, 0.78),             // drift heading (world xz): toward the south-east
    LO: { x0: -2500, size: 5000, res: 0.56 },
    HI: { x0: -1050, size: 2100, res: 1.45 },
  };
  const ICOL = {
    crack: mixA(BG, BONE, 0.26), lead: mixA(BG, BONE, 0.07), sea: mixA(BG, BONE, 0.025),
    wall: mixA(BG, BONE, 0.17), wallDark: mixA(BG, BONE, 0.06),
  };
  let ICE_MODEL = null;
  function iceModel() {
    if (ICE_MODEL) return ICE_MODEL;
    const r = U.rng('ww-ice-v1'), n = U.noise2D('ww-ice-v1'), n2 = U.noise2D('ww-ice-v1b');
    const L = ICE.L;
    const SITES = [
      { id: 'relay', name: 'RELAY', x: -500, z: -190 },
      { id: 'drill', name: 'DRILL', x: 470, z: -300 },
      { id: 'cache', name: 'CACHE', x: 60, z: 450 },
    ];
    const HUB = [0, 6];
    const PATHS = [
      [[-34, 4], [-90, 34], [-210, 40], [-330, -40], [-430, -120], [-500, -190]],
      [[34, -10], [96, -40], [210, -120], [330, -170], [420, -250], [470, -300]],
      [[6, 26], [30, 90], [-30, 200], [-10, 320], [50, 400], [60, 450]],
    ].map((p) => measure(spline(p, 5)));
    // shelf edge: a jagged line across the south-east; the sea beyond it
    const edgeOff = (x, z) => (x + z) * 0.7071 - (1240 + 120 * n(x * 0.0011, z * 0.0011) + 34 * n2(x * 0.006, z * 0.006));
    const EDGE = [];
    for (let k = -3200; k <= 3200; k += 34 + 30 * Math.abs(n2(k * 0.01, 4.4))) {
      // walk along the diagonal (direction (1,-1)/sqrt2) and solve for the offset along (1,1)/sqrt2
      const ux = k * 0.7071, uz = -k * 0.7071;
      let d = 1240;
      for (let it = 0; it < 6; it++) { const x = ux + d * 0.7071, z = uz + d * 0.7071; d -= edgeOff(x, z) * 0.8; }
      d += r.range(-14, 14) + (r() < 0.12 ? -r.range(20, 60) : 0);
      EDGE.push([ux + d * 0.7071, uz + d * 0.7071]);
    }
    const inSea = (x, z) => edgeOff(x, z) > 0;
    // leads (open water cracks): long jagged dark bands, away from the base
    const LEADS = [];
    const leadDefs = [[[-2600, -900], [-1400, -760], [-900, -1100], [-200, -1240], [500, -1500], [1300, -1380], [2600, -1800]],
      [[-2500, 1100], [-1700, 900], [-1240, 1200], [-700, 1500], [-300, 2000], [200, 2600]],
      [[1150, -2600], [1060, -1900], [1300, -1300], [1560, -760], [1800, -400]]];
    for (const d of leadDefs) {
      const jag = d.map((p, i) => [p[0] + (i ? r.range(-40, 40) : 0), p[1] + (i ? r.range(-40, 40) : 0)]);
      const pl = spline(jag, 24);
      const left = [], right = [];
      for (let i = 0; i < pl.length; i++) {
        const a = pl[Math.max(0, i - 1)], b = pl[Math.min(pl.length - 1, i + 1)];
        let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const w = 6 + 16 * (0.5 + 0.5 * n(pl[i][0] * 0.003, pl[i][1] * 0.003)) * Math.sin(Math.PI * clamp(i / (pl.length - 1), 0, 1)) + r.range(0, 4);
        const jx = r.range(-4, 4), jz = r.range(-4, 4);
        left.push([pl[i][0] - tz * w + jx, pl[i][1] + tx * w + jz]); right.push([pl[i][0] + tz * w - jx, pl[i][1] - tx * w - jz]);
      }
      LEADS.push({ pl, poly: left.concat(right.reverse()) });
    }
    // ---- 3D objects ------------------------------------------------------------------------------------
    const OBJ = [];
    const shadeC = (base, dark, nrm, amb) => { const s = clamp(dot3(nrm, L), 0, 1); return css(mixA(dark, base, (amb == null ? 0.42 : amb) + (1 - (amb == null ? 0.42 : amb)) * s)); };
    function addObj(faces, lines, opt) {
      // faces: [{ p: [[x,y,z]..] (CCW seen from outside), base, dark, amb, n? }], lines: [{ a, b, w, col }]
      let cx = 0, cy = 0, cz = 0, k = 0, R = 0;
      const all = [];
      for (const f of faces) for (const p of f.p) all.push(p);
      for (const l of lines) { all.push(l.a, l.b); }
      for (const p of all) { cx += p[0]; cy += p[1]; cz += p[2]; k++; }
      cx /= k; cy /= k; cz /= k;
      for (const p of all) R = Math.max(R, Math.hypot(p[0] - cx, p[1] - cy, p[2] - cz));
      const F = faces.map((f) => {
        const nn = f.n || norm3(cross3(sub3(f.p[1], f.p[0]), sub3(f.p[2], f.p[0])));
        return { p: f.p, n: nn, fill: f.fill || shadeC(f.base, f.dark, nn, f.amb), lit: f.lit || null, tag: f.tag || null };
      });
      const o = Object.assign({ c: [cx, cy, cz], R, faces: F, lines, shadow: true }, opt || {});
      OBJ.push(o);
      return o;
    }
    // box: centre (x, z), base height y0, size w (along a), d (across), h; yaw a (rad); colours
    function boxFaces(x, z, y0, w, d, h, a, top, side, sideDark, amb) {
      const ca = Math.cos(a), sa = Math.sin(a);
      const P = (u, v, y) => [x + u * ca - v * sa, y, z + u * sa + v * ca];
      const hw = w / 2, hd = d / 2, y1 = y0 + h;
      const b = [P(-hw, -hd, y0), P(hw, -hd, y0), P(hw, hd, y0), P(-hw, hd, y0)];
      const t = [P(-hw, -hd, y1), P(hw, -hd, y1), P(hw, hd, y1), P(-hw, hd, y1)];
      return [
        { p: [t[0], t[3], t[2], t[1]], base: top, dark: mixA(top, BG, 0.35), amb: 0.62 },
        { p: [b[0], b[1], t[1], t[0]], base: side, dark: sideDark, amb },
        { p: [b[1], b[2], t[2], t[1]], base: side, dark: sideDark, amb },
        { p: [b[2], b[3], t[3], t[2]], base: side, dark: sideDark, amb },
        { p: [b[3], b[0], t[0], t[3]], base: side, dark: sideDark, amb },
      ];
    }
    function prismFaces(poly, y0, y1, top, side, sideDark, amb) { // poly CCW in xz seen from above (x right, z down)
      const f = [];
      f.push({ p: poly.slice().reverse().map((q) => [q[0], y1, q[1]]), base: top, dark: mixA(top, BG, 0.3), amb: 0.6 });
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        f.push({ p: [[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], base: side, dark: sideDark, amb });
      }
      return f;
    }
    const ngon = (x, z, rad, k, rot) => Array.from({ length: k }, (_, i) => { const a = (rot || 0) + (i / k) * Math.PI * 2; return [x + Math.cos(a) * rad, z + Math.sin(a) * rad]; });
    // orient a face list so every normal points away from the object centre (robust for hand-built solids)
    function orient(faces, c) {
      for (const f of faces) {
        const nn = norm3(cross3(sub3(f.p[1], f.p[0]), sub3(f.p[2], f.p[0])));
        const m = f.p.reduce((s, p) => [s[0] + p[0] / f.p.length, s[1] + p[1] / f.p.length, s[2] + p[2] / f.p.length], [0, 0, 0]);
        if (dot3(nn, sub3(m, c)) < 0) f.p = f.p.slice().reverse();
      }
      return faces;
    }
    // ---- base: a chain of modules on stilts (hub in the middle), lit windows ---------------------------
    const A0 = -0.30;                          // chain heading (rad)
    const ca0 = Math.cos(A0), sa0 = Math.sin(A0);
    const BP = (u, v) => [HUB[0] + u * ca0 - v * sa0, HUB[1] + u * sa0 + v * ca0];
    const ROOF = INK, WALL = ICOL.wall, WALLD = ICOL.wallDark;
    const MODS = [-132, -66, 0, 66, 132];
    MODS.forEach((u, i) => {
      const hub = i === 2;
      const [x, z] = BP(u, 0);
      const w = 54, d = hub ? 34 : 26, h = hub ? 27 : 19, legH = 13;
      const faces = orient(boxFaces(x, z, legH, w, d, h, A0, ROOF, WALL, WALLD, 0.55), [x, legH + h / 2, z]);
      // window strips on both long walls (lit, amber light) as faces slightly proud of the wall
      for (const sgn of [-1, 1]) {
        const v = sgn * (d / 2 + 0.35);
        const wy0 = legH + h * 0.4, wy1 = legH + h * 0.62;
        for (let k = -2; k <= 2; k++) {
          const u0 = u + k * 9.6 - 3, u1 = u0 + 6;
          const p0 = BP(u0, v), p1 = BP(u1, v);
          const quad = [[p0[0], wy0, p0[1]], [p1[0], wy0, p1[1]], [p1[0], wy1, p1[1]], [p0[0], wy1, p0[1]]];
          const nrm = [-sa0 * sgn, 0, ca0 * sgn];
          const fn = norm3(cross3(sub3(quad[1], quad[0]), sub3(quad[2], quad[0])));
          faces.push({ p: dot3(fn, nrm) < 0 ? quad.slice().reverse() : quad, n: nrm, fill: css(mixA(AMBER_L, AMBER, (k + i) % 3 === 0 ? 0.6 : 0.15)), win: true });
        }
      }
      // stilts
      const lines = [];
      for (const [uu, vv] of [[-w / 2 + 5, -d / 2 + 4], [w / 2 - 5, -d / 2 + 4], [w / 2 - 5, d / 2 - 4], [-w / 2 + 5, d / 2 - 4]]) {
        const p = BP(u + uu, vv);
        lines.push({ a: [p[0], 0, p[1]], b: [p[0], legH, p[1]], w: 2.6, col: css(WALLD) });
      }
      addObj(faces, lines, { kind: 'module' });
      if (i < MODS.length - 1) { // connector
        const [cx2, cz2] = BP(u + 33, 0);
        addObj(orient(boxFaces(cx2, cz2, legH + 4, 12, 10, 11, A0, ROOF, WALL, WALLD, 0.55), [cx2, legH + 9, cz2]), [], { kind: 'module' });
      }
    });
    // garage / hangar: a long low shed with a pitched roof
    {
      const [x, z] = BP(40, 92);
      const a = A0 + 0.04, ca = Math.cos(a), sa = Math.sin(a);
      const P = (u, v, y) => [x + u * ca - v * sa, y, z + u * sa + v * ca];
      const L2 = 46, D2 = 22, H1 = 12, H2 = 19;
      const f = [
        { p: [P(-L2, -D2, 0), P(L2, -D2, 0), P(L2, -D2, H1), P(-L2, -D2, H1)], base: BONE, dark: mixA(BONE, BG, 0.5), amb: 0.5 },
        { p: [P(L2, D2, 0), P(-L2, D2, 0), P(-L2, D2, H1), P(L2, D2, H1)], base: BONE, dark: mixA(BONE, BG, 0.5), amb: 0.5 },
        { p: [P(-L2, -D2, H1), P(L2, -D2, H1), P(L2, 0, H2), P(-L2, 0, H2)], base: INK, dark: mixA(BONE, BG, 0.3), amb: 0.5 },
        { p: [P(L2, D2, H1), P(-L2, D2, H1), P(-L2, 0, H2), P(L2, 0, H2)], base: INK, dark: mixA(BONE, BG, 0.3), amb: 0.5 },
        { p: [P(L2, -D2, 0), P(L2, D2, 0), P(L2, D2, H1), P(L2, 0, H2), P(L2, -D2, H1)], base: ICOL.wall, dark: ICOL.wallDark, amb: 0.5 },
        { p: [P(-L2, D2, 0), P(-L2, -D2, 0), P(-L2, -D2, H1), P(-L2, 0, H2), P(-L2, D2, H1)], base: ICOL.wall, dark: ICOL.wallDark, amb: 0.5 },
      ];
      addObj(orient(f, [x, 8, z]), [], { kind: 'shed' });
    }
    // snowcats parked by the shed
    [[-30, 130, 0.2], [-6, 136, 0.15]].forEach(([u, v, aa]) => {
      const [x, z] = BP(u, v);
      addObj(orient(boxFaces(x, z, 0, 15, 9, 5, A0 + aa, ICOL.wall, ICOL.wall, ICOL.wallDark, 0.5), [x, 2.5, z]), [], { kind: 'cat' });
      const [x2, z2] = BP(u - 2, v);
      addObj(orient(boxFaces(x2, z2, 5, 8, 8, 6, A0 + aa, INK, mixA(AMBER, AMBER_D, 0.3), AMBER_D, 0.5), [x2, 8, z2]), [], { kind: 'cat' });
    });
    // radome on a plinth
    {
      const [x, z] = BP(-215, 78);
      const plinth = orient(prismFaces(ngon(x, z, 25, 12, 0.1), 0, 11, BONE, WALL, WALLD, 0.5), [x, 4.5, z]);
      addObj(plinth, [], { kind: 'plinth' });
      // geodesic hemisphere: icosahedron subdivided once, upper half
      const t = (1 + Math.sqrt(5)) / 2;
      let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm3);
      let Fc = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
      const mid = {}; const mp = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (mid[k] == null) { mid[k] = V.length; V.push(norm3([(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2])); } return mid[k]; };
      const F2 = [];
      for (const [a, b, c] of Fc) { const ab = mp(a, b), bc = mp(b, c), ca = mp(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
      const R = 28, y0 = 11;
      const faces = [];
      for (const f of F2) {
        const P = f.map((i) => V[i]);
        if (Math.min(P[0][1], P[1][1], P[2][1]) < -0.05) continue;
        const pts = P.map((v) => [x + v[0] * R, y0 + Math.max(0, v[1]) * R, z + v[2] * R]);
        faces.push({ p: pts, base: INK, dark: mixA(BONE, BG, 0.38), amb: 0.38 });
      }
      orient(faces, [x, y0, z]);
      addObj(faces, [], { kind: 'dome', edges: true });
    }
    // fuel tanks (bone cylinders), containers
    [[190, 70], [210, 56], [230, 70], [210, 84], [250, 56]].forEach(([u, v]) => {
      const [x, z] = BP(u, v);
      addObj(orient(prismFaces(ngon(x, z, 9, 10, 0.2), 0, 14, INK, BONE, mixA(BONE, BG, 0.45), 0.45), [x, 5.5, z]), [], { kind: 'tank' });
    });
    [[-150, -66, 0.05], [-126, -68, 0.05], [-90, -72, 0.12], [100, -74, -0.1], [128, -70, -0.06], [270, -26, 0.5], [-290, -14, 0.3], [-260, 150, 0.9]].forEach(([u, v, aa], k) => {
      const [x, z] = BP(u, v);
      const dark = k % 3 === 2;
      addObj(orient(boxFaces(x, z, 0, 18, 7, 7, A0 + aa, dark ? mixA(BONE, BG, 0.5) : INK, dark ? ICOL.wall : BONE, dark ? WALLD : mixA(BONE, BG, 0.45), 0.5), [x, 3.5, z]), [], { kind: 'crate' });
    });
    // masts with guy wires and amber beacons
    const MASTS = [];
    [[34, -100, 168], [-196, -84, 128], [262, 112, 112], [-96, 118, 92]].forEach(([u, v, h], k) => {
      const [x, z] = BP(u, v);
      const lines = [{ a: [x, 0, z], b: [x, h, z], w: 2.6, col: css(mixA(BG, BONE, 0.12)) }];
      for (let j = 0; j < 3; j++) {
        const a = k * 0.7 + j * 2.094, rr = h * 0.42;
        lines.push({ a: [x, h * 0.82, z], b: [x + Math.cos(a) * rr, 0, z + Math.sin(a) * rr], w: 0.9, col: css(mixA(BG, BONE, 0.3), 0.85), guy: true });
      }
      lines.push({ a: [x - 6, h * 0.7, z], b: [x + 6, h * 0.7, z], w: 1.6, col: css(mixA(BG, BONE, 0.12)) });
      addObj([], lines, { kind: 'mast' });
      MASTS.push({ x, z, h, ph: k * 0.25 });
    });
    // wind turbines: a pole, a nacelle and three blades that turn (drawn live, facing the wind)
    [[-70, -150, 126, 0.0], [130, -158, 112, 1.1], [330, -40, 100, 2.3]].forEach(([u, v, h, ph]) => {
      const [x, z] = BP(u, v);
      addObj([], [{ a: [x, 0, z], b: [x, h, z], w: 3, col: css(mixA(BG, BONE, 0.62)) }], { kind: 'turbine', spin: { x, z, h, ph, len: 44 } });
    });
    // small flags around the base perimeter (marker canes)
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2, rr = 300 + 30 * Math.sin(k * 1.7);
      const x = HUB[0] + Math.cos(a) * rr * 1.1, z = HUB[1] + Math.sin(a) * rr * 0.72;
      addObj([], [{ a: [x, 0, z], b: [x, 12, z], w: 1.2, col: css(mixA(BG, BONE, 0.2)) }], { kind: 'cane', flag: [x, 12, z] });
    }
    // ---- sites -----------------------------------------------------------------------------------------
    const SITE_OBJ = [];
    SITES.forEach((S, i) => {
      const parts = [];
      const hutX = S.x + 22, hutZ = S.z - 16;
      const hut = addObj(orient(boxFaces(hutX, hutZ, 0, 20, 13, 11, 0.4 + i, INK, ICOL.wall, ICOL.wallDark, 0.55), [hutX, 5.5, hutZ]), [], { kind: 'hut', site: i });
      parts.push(hut);
      if (S.id === 'relay') {
        // lattice relay mast: two rails + braces, a dish
        const lines = [], h = 96;
        for (const dx of [-3, 3]) lines.push({ a: [S.x + dx, 0, S.z], b: [S.x + dx * 0.4, h, S.z], w: 1.8, col: css(mixA(BG, BONE, 0.14)) });
        for (let y = 8; y < h - 6; y += 11) lines.push({ a: [S.x - 3 * (1 - 0.6 * y / h), y, S.z], b: [S.x + 3 * (1 - 0.6 * (y + 11) / h), y + 11, S.z], w: 0.9, col: css(mixA(BG, BONE, 0.24)) });
        for (let j = 0; j < 3; j++) { const a = j * 2.094 + 0.4; lines.push({ a: [S.x, h * 0.8, S.z], b: [S.x + Math.cos(a) * 42, 0, S.z + Math.sin(a) * 42], w: 0.9, col: css(mixA(BG, BONE, 0.3), 0.85), guy: true }); }
        parts.push(addObj([], lines, { kind: 'mast', site: i, top: [S.x, h, S.z] }));
        const dish = ngon(0, 0, 9, 8, 0).map(([a, b]) => [S.x - 12 + a * 0.35, 58 + b, S.z + 2 + a]);
        parts.push(addObj(orient([{ p: dish, base: INK, dark: mixA(BONE, BG, 0.4), amb: 0.5 }], [S.x - 30, 58, S.z]), [{ a: [S.x - 12, 58, S.z + 2], b: [S.x, 58, S.z], w: 1.4, col: css(mixA(BG, BONE, 0.14)) }], { kind: 'dish', site: i }));
      } else if (S.id === 'drill') {
        // derrick: four legs to an apex, cross bracing, a crown block
        const lines = [], h = 78, b = 14, top = [S.x, h, S.z];
        const feet = [[-b, -b], [b, -b], [b, b], [-b, b]].map(([dx, dz]) => [S.x + dx, 0, S.z + dz]);
        for (const f of feet) lines.push({ a: f, b: [S.x + (f[0] - S.x) * 0.15, h, S.z + (f[2] - S.z) * 0.15], w: 2, col: css(mixA(BG, BONE, 0.12)) });
        for (let y = 14; y < h - 10; y += 16) {
          const k1 = 1 - 0.85 * y / h;
          const ring = [[-b, -b], [b, -b], [b, b], [-b, b]].map(([dx, dz]) => [S.x + dx * k1, y, S.z + dz * k1]);
          for (let j = 0; j < 4; j++) lines.push({ a: ring[j], b: ring[(j + 1) % 4], w: 1, col: css(mixA(BG, BONE, 0.24)) });
        }
        parts.push(addObj(orient(boxFaces(S.x, S.z, h - 2, 7, 7, 6, 0.2, INK, ICOL.wall, ICOL.wallDark, 0.5), [S.x, h + 1, S.z]), lines, { kind: 'derrick', site: i, top }));
        parts.push(addObj(orient(prismFaces(ngon(S.x - 26, S.z + 14, 6, 8, 0), 0, 9, INK, BONE, mixA(BONE, BG, 0.45), 0.45), [S.x - 26, 4.5, S.z + 14]), [], { kind: 'tank', site: i }));
      } else {
        // cache: a stack of crates under a tripod beacon
        const lines = [], h = 46;
        for (let j = 0; j < 3; j++) { const a = j * 2.094 + 0.3; lines.push({ a: [S.x + Math.cos(a) * 13, 0, S.z + Math.sin(a) * 13], b: [S.x, h, S.z], w: 1.8, col: css(mixA(BG, BONE, 0.12)) }); }
        parts.push(addObj([], lines, { kind: 'tripod', site: i, top: [S.x, h, S.z] }));
        [[-22, 10, 0], [-22, 10, 7], [-8, 18, 0], [-30, -6, 0]].forEach(([dx, dz, y], k) => {
          parts.push(addObj(orient(boxFaces(S.x + dx, S.z + dz, y, 12, 8, 7, 0.3 + k * 0.2, INK, k % 2 ? BONE : ICOL.wall, k % 2 ? mixA(BONE, BG, 0.45) : ICOL.wallDark, 0.5), [S.x + dx, y + 3.5, S.z + dz]), [], { kind: 'crate', site: i }));
        });
      }
      SITE_OBJ.push(parts);
    });
    // ---- pressure ridges: lines of shaded ice blocks (skip the base, the sites, the tracks, the sea) --------
    const RIDGES = [
      [[-2500, -560], [-1700, -420], [-1100, -520], [-560, -620], [-100, -560], [380, -700], [900, -620], [1500, -760], [2500, -640]],
      [[-2400, 360], [-1600, 300], [-1050, 420], [-560, 330], [-200, 420], [260, 300], [700, 380], [1000, 260]],
      [[-1500, -2400], [-1350, -1700], [-1180, -1200], [-1240, -800], [-1100, -300], [-1250, 300], [-1180, 900], [-1350, 1500], [-1200, 2300]],
      [[1200, -2400], [1080, -1700], [1240, -1100], [1100, -560], [1180, -100], [1000, 160]],
      [[-2400, 1500], [-1700, 1350], [-1000, 1480], [-500, 1250], [0, 1300], [300, 1000]],
    ];
    const BLOCKS = [];
    const avoid = (x, z) => {
      if (inSea(x, z)) return true;
      if (Math.hypot((x - HUB[0]) * 0.85, z - HUB[1]) < 310) return true;
      for (const S of SITES) if (Math.hypot(x - S.x, z - S.z) < 110) return true;
      for (const P of PATHS) if (distToPl(x, z, P.pl) < 42) return true;
      return false;
    };
    for (const def of RIDGES) {
      const pl = spline(def.map((p, i) => [p[0] + (i ? r.range(-30, 30) : 0), p[1] + (i ? r.range(-30, 30) : 0)]), 10);
      const M = measure(pl);
      for (let s = 0; s < M.len; s += r.range(10, 17)) {
        const p = at(M, s);
        const side = r.range(-1, 1) * 9;
        const x = p[0] - Math.sin(p[2]) * side, z = p[1] + Math.cos(p[2]) * side;
        if (avoid(x, z)) continue;
        const amp = 0.55 + 0.45 * n(x * 0.004, z * 0.004);
        if (amp < 0.25) continue;
        const h = r.range(6, 15) + 24 * amp * r();
        const k = r() < 0.5 ? 3 : 4, rad = r.range(8, 15) * (0.85 + amp * 0.55);
        const rot = r() * Math.PI;
        const base = ngon(x, z, rad, k, rot).map((q) => [q[0] + r.range(-2.5, 2.5), q[1] + r.range(-2.5, 2.5)]);
        const ax = x + r.range(-rad * 0.35, rad * 0.35), az = z + r.range(-rad * 0.35, rad * 0.35);
        const apex = [ax, h, az];
        const faces = [];
        for (let i = 0; i < k; i++) {
          const a = base[i], b = base[(i + 1) % k];
          faces.push({ p: [[a[0], 0, a[1]], [b[0], 0, b[1]], apex], base: [252, 249, 243], dark: mixA(BONE, BG, 0.42 + 0.14 * r()), amb: 0.18 });
        }
        orient(faces, [x, h * 0.25, z]);
        BLOCKS.push(addObj(faces, [], { kind: 'block' }));
      }
    }
    // ---- shelf edge cliff faces (y 0 .. -26) ----------------------------------------------------------------
    const CLIFF = [];
    for (let i = 0; i < EDGE.length - 1; i++) {
      const a = EDGE[i], b = EDGE[i + 1];
      const nrm = norm3([(b[1] - a[1]), 0, -(b[0] - a[0])]);
      const outward = nrm[0] + nrm[2] > 0 ? nrm : [-nrm[0], 0, -nrm[2]];
      const s = clamp(dot3(outward, L) * 0.5 + 0.5, 0, 1);
      CLIFF.push({ a, b, n: outward, fill: css(mixA(mixA(BONE, BG, 0.55), INK, 0.15 + 0.5 * s)) });
    }
    // floes in the sea near the edge
    const FLOES = [];
    for (let k = 0; k < 420; k++) {
      const x = r.range(-1000, 3200), z = r.range(-1000, 3200);
      const off = edgeOff(x, z);
      if (off < 30 || off > 1500) continue;
      if (r() > Math.exp(-off / 420)) continue;
      const rad = r.range(8, 46) * Math.exp(-off / 1600);
      const poly = ngon(x, z, rad, r.int(5, 7), r() * 6).map((q) => [q[0] + r.range(-rad * 0.3, rad * 0.3), q[1] + r.range(-rad * 0.3, rad * 0.3)]);
      FLOES.push({ x, z, poly, tone: r() });
    }
    ICE_MODEL = { SITES, HUB, PATHS, EDGE, LEADS, OBJ, BLOCKS, CLIFF, FLOES, MASTS, SITE_OBJ, inSea, edgeOff, n, n2, r };
    return ICE_MODEL;
  }

  /** ground geometry shared by both texture resolutions: shaded facet triangles and crack polylines */
  function iceGround(M) {
    if (M.ground) return M.ground;
    const rv = U.rng('ww-ice-vor'), n = M.n, n2 = M.n2, L = ICE.L;
    const EXT = 2700;
    // floes: big cells, each a slab with its own small tilt
    const floes = voronoiGrid(rv, -EXT, -EXT, 2 * EXT, 2 * EXT, 270, 0.45);
    const FS = 270, fnx = Math.ceil(2 * EXT / FS);
    floes.forEach((f) => { const tl = rv.range(0.01, 0.15), ta = rv() * Math.PI * 2; f.nrm = norm3([Math.cos(ta) * tl, 1, Math.sin(ta) * tl]); });
    const floeAt = (x, z) => {
      let best = null, bd = Infinity;
      for (const f of floes) { const d = (f.c[0] - x) ** 2 + (f.c[1] - z) ** 2; if (d < bd) { bd = d; best = f; } }
      return best;
    };
    // grid index for the floe lookup
    const fidx = new Map();
    floes.forEach((f) => { const k = Math.floor((f.c[0] + EXT) / FS) + ',' + Math.floor((f.c[1] + EXT) / FS); (fidx.get(k) || fidx.set(k, []).get(k)).push(f); });
    const floeNear = (x, z) => {
      const gi = Math.floor((x + EXT) / FS), gj = Math.floor((z + EXT) / FS);
      let best = null, bd = Infinity;
      for (let j = gj - 2; j <= gj + 2; j++) for (let i = gi - 2; i <= gi + 2; i++) for (const f of fidx.get(i + ',' + j) || []) { const d = (f.c[0] - x) ** 2 + (f.c[1] - z) ** 2; if (d < bd) { bd = d; best = f; } }
      return best || floeAt(x, z);
    };
    void fnx;
    const DARK = mixA(BONE, BG, 0.14), WHITE = [251, 248, 242];
    const shade = (nn) => clamp(dot3(nn, L), 0, 1);
    const s0 = L[1];
    const facets = [];
    const cells = voronoiGrid(rv, -EXT, -EXT, 2 * EXT, 2 * EXT, 66, 0.42);
    for (const cell of cells) {
      const [cx, cz] = cell.c;
      if (M.edgeOff(cx, cz) > 40) continue;
      const f = floeNear(cx, cz);
      const c = centroid(cell.poly);
      const apexH = rv.range(1.2, 5) * (0.6 + 0.4 * n2(cx * 0.004, cz * 0.004));
      // the facet's plane follows its floe; the apex lifts the centre
      const fy = (x, z) => -(f.nrm[0] * (x - f.c[0]) + f.nrm[2] * (z - f.c[1])) / f.nrm[1];
      const apex = [c[0], fy(c[0], c[1]) + apexH, c[1]];
      const tris = [];
      for (let i = 0; i < cell.poly.length; i++) {
        const a = cell.poly[i], b = cell.poly[(i + 1) % cell.poly.length];
        const A3 = [a[0], fy(a[0], a[1]), a[1]], B3 = [b[0], fy(b[0], b[1]), b[1]];
        let nn = norm3(cross3(sub3(B3, A3), sub3(apex, A3)));
        if (nn[1] < 0) nn = [-nn[0], -nn[1], -nn[2]];
        const tone = clamp(0.9 + (shade(nn) - s0) * 1.45 + 0.05 * n(cx * 0.0012, cz * 0.0012), 0, 1.15);
        const col = tone > 1 ? mixA(INK, WHITE, (tone - 1) / 0.15) : mixA(DARK, INK, tone);
        tris.push({ p: [a, b, c], col: css(col) });
      }
      facets.push({ c: cell.c, tris });
    }
    // cracks: floe edges where the fracture field is open (none on the base apron, the pads or the tracks)
    const fracture = (x, z) => n(x * 0.0008 + 11, z * 0.0008 - 5) + 0.5 * n2(x * 0.0021, z * 0.0021);
    const quiet = (x, z) => Math.hypot((x - M.HUB[0]) * 0.8, z - M.HUB[1]) < 330 || M.SITES.some((S) => Math.hypot(x - S.x, z - S.z) < 90) || M.edgeOff(x, z) > -10;
    const seen = new Set();
    const cracks = [];
    const addEdges = (cellsL, thr, wmul) => {
      for (const cell of cellsL) {
        for (let i = 0; i < cell.poly.length; i++) {
          let a = cell.poly[i], b = cell.poly[(i + 1) % cell.poly.length];
          if (a[0] > b[0] || (a[0] === b[0] && a[1] > b[1])) { const tt = a; a = b; b = tt; }
          const key = Math.round(a[0] + b[0]) + ',' + Math.round(a[1] + b[1]);
          if (seen.has(key)) continue; seen.add(key);
          const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
          if (Math.abs(mx) > EXT - 40 || Math.abs(mz) > EXT - 40) continue;
          const fr = fracture(mx, mz);
          if (fr < thr || quiet(mx, mz)) continue;
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const k = Math.max(2, Math.round(len / 22));
          const hr = U.rng(key);
          const pts = [a];
          const tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
          for (let j = 1; j < k; j++) { const u = j / k, off = hr.range(-6, 6); pts.push([a[0] + (b[0] - a[0]) * u - tz * off, a[1] + (b[1] - a[1]) * u + tx * off]); }
          pts.push(b);
          const w = clamp((1.2 + 4.2 * (fr - thr)) * wmul, 1, 6.5);
          const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
          cracks.push({ pts, w, bb: [Math.min(...xs) - 12, Math.min(...zs) - 12, Math.max(...xs) + 12, Math.max(...zs) + 12] });
        }
      }
    };
    addEdges(floes, -0.18, 1);
    const mids = voronoiGrid(rv, -EXT, -EXT, 2 * EXT, 2 * EXT, 120, 0.45);
    addEdges(mids, 0.55, 0.6);
    const sl = Math.hypot(L[0], L[2]);
    M.ground = { facets, cracks, sh: [-L[0] / sl, -L[2] / sl] };
    return M.ground;
  }

  /** paint the static ground (world region x0..x0+size, both axes) into a canvas at res px per unit */
  function paintIce(M, R) {
    const N = Math.round(R.size * R.res);
    const cv = document.createElement('canvas'); cv.width = N; cv.height = N;
    const t = cv.getContext('2d');
    const r = U.rng('ww-ice-paint'), n = M.n, n2 = M.n2;
    const x0 = R.x0, x1 = R.x0 + R.size;
    t.setTransform(R.res, 0, 0, R.res, -x0 * R.res, -x0 * R.res);
    t.fillStyle = css(INK); t.fillRect(x0, x0, R.size, R.size);
    // low-poly snow: every facet is a shallow pyramid (fan of triangles), each shaded by its own normal on
    // top of its floe's tilt, so the surface glints facet by facet; no outlines (tone only)
    const G = iceGround(M);
    const Lv = ICE.L;
    t.lineJoin = 'round';
    for (const F of G.facets) {
      const [cx, cz] = F.c;
      if (cx < x0 - 120 || cx > x1 + 120 || cz < x0 - 120 || cz > x1 + 120) continue;
      for (const tri of F.tris) {
        t.fillStyle = tri.col; t.strokeStyle = tri.col; t.lineWidth = 0.9;
        t.beginPath(); t.moveTo(tri.p[0][0], tri.p[0][1]); t.lineTo(tri.p[1][0], tri.p[1][1]); t.lineTo(tri.p[2][0], tri.p[2][1]); t.closePath(); t.fill(); t.stroke();
      }
    }
    void Lv;
    // fractures: jagged dark cracks with a lit lip and a soft shadow band
    t.lineCap = 'round';
    for (const K of G.cracks) {
      if (K.bb[2] < x0 || K.bb[0] > x1 || K.bb[3] < x0 || K.bb[1] > x1) continue;
      const path = new Path2D(); K.pts.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
      t.save(); t.translate(G.sh[0] * (K.w + 2), G.sh[1] * (K.w + 2)); t.strokeStyle = css(mixA(BONE, BG, 0.25), 0.12); t.lineWidth = K.w + 6; t.stroke(path); t.restore();
      t.strokeStyle = css(ICOL.crack); t.lineWidth = K.w; t.stroke(path);
      if (K.w > 2.2) { t.strokeStyle = css(mixA(BG, BONE, 0.1)); t.lineWidth = K.w * 0.45; t.stroke(path); }
      t.save(); t.translate(-G.sh[0] * (K.w * 0.5 + 1.1), -G.sh[1] * (K.w * 0.5 + 1.1)); t.strokeStyle = 'rgba(255,253,248,0.9)'; t.lineWidth = 1.3; t.stroke(path); t.restore();
    }
    // sastrugi: wind-combed snow streaks (fine detail, clustered)
    const nSt = Math.round(R.size * R.size * 0.0011 * (R.res > 1 ? 1 : 0.45));
    t.lineCap = 'round';
    for (let k = 0; k < nSt; k++) {
      const x = r.range(x0, x1), z = r.range(x0, x1);
      const cl = n2(x * 0.0035, z * 0.0035);
      if (cl < -0.1 || M.edgeOff(x, z) > 0) continue;
      const a = ICE.WIND + 0.25 * n(x * 0.002, z * 0.002), len = r.range(8, 34);
      t.strokeStyle = r() < 0.6 ? 'rgba(255,253,248,0.55)' : css(mixA(BONE, BG, 0.25), 0.16);
      t.lineWidth = r.range(0.8, 1.8);
      t.beginPath(); t.moveTo(x, z); t.lineTo(x + Math.cos(a) * len, z + Math.sin(a) * len); t.stroke();
    }
    // leads: dark open water with a bright refrozen rim
    for (const Ld of M.LEADS) {
      t.fillStyle = css(ICOL.lead); fillPoly(t, Ld.poly);
      t.strokeStyle = css(mixA(BG, BONE, 0.42)); t.lineWidth = 2; t.lineJoin = 'round';
      t.beginPath(); Ld.poly.forEach((p, i) => (i ? t.lineTo(p[0], p[1]) : t.moveTo(p[0], p[1]))); t.closePath(); t.stroke();
      t.strokeStyle = css(mixA(BG, BONE, 0.18)); t.lineWidth = 1.2;
      t.beginPath(); Ld.pl.forEach((p, i) => (i ? t.lineTo(p[0], p[1]) : t.moveTo(p[0], p[1]))); t.stroke();
    }
    // packed-snow tracks base -> sites (a smoothed band and twin tread lines)
    for (const P of M.PATHS) {
      const pl = P.pl;
      t.lineJoin = 'round'; t.lineCap = 'round';
      t.strokeStyle = css(mixA(INK, BONE, 0.55), 0.75); t.lineWidth = 15;
      t.beginPath(); pl.forEach((p, i) => (i ? t.lineTo(p[0], p[1]) : t.moveTo(p[0], p[1]))); t.stroke();
      for (const off of [-4.2, 4.2]) {
        t.strokeStyle = css(mixA(BONE, BG, 0.38), 0.7); t.lineWidth = 1.4;
        t.setLineDash([5, 3]);
        t.beginPath();
        for (let i = 0; i < pl.length; i++) {
          const a = pl[Math.max(0, i - 1)], b = pl[Math.min(pl.length - 1, i + 1)];
          let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
          const x = pl[i][0] - tz * off, z = pl[i][1] + tx * off;
          if (i) t.lineTo(x, z); else t.moveTo(x, z);
        }
        t.stroke(); t.setLineDash([]);
      }
    }
    // the base apron: a large smoothed area under the base, bulldozed (lighter) with tread scars
    t.fillStyle = css(mixA(INK, BONE, 0.3), 0.85);
    t.beginPath(); t.ellipse(M.HUB[0], M.HUB[1], 300, 150, -0.3, 0, Math.PI * 2); t.fill();
    for (let k = 0; k < 40; k++) {
      const a = r.range(0, Math.PI * 2), rr = r.range(40, 260);
      const x = M.HUB[0] + Math.cos(a) * rr, z = M.HUB[1] + Math.sin(a) * rr * 0.55;
      t.strokeStyle = css(mixA(BONE, BG, 0.3), 0.35); t.lineWidth = 1.2;
      t.beginPath(); t.arc(x, z, r.range(30, 90), r.range(0, 6), r.range(0, 6) + r.range(0.4, 1.4)); t.stroke();
    }
    // site pads: a dashed ring + ticks
    for (const S of M.SITES) {
      t.fillStyle = css(mixA(INK, BONE, 0.25)); t.beginPath(); t.arc(S.x, S.z, 52, 0, Math.PI * 2); t.fill();
      t.strokeStyle = css(mixA(BG, BONE, 0.15)); t.lineWidth = 2.4; t.setLineDash([7, 6]);
      t.beginPath(); t.arc(S.x, S.z, 52, 0, Math.PI * 2); t.stroke(); t.setLineDash([]);
      t.lineWidth = 2.4;
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.785; t.beginPath(); t.moveTo(S.x + Math.cos(a) * 58, S.z + Math.sin(a) * 58); t.lineTo(S.x + Math.cos(a) * 70, S.z + Math.sin(a) * 70); t.stroke(); }
    }
    // the sea + floes
    t.fillStyle = css(ICOL.sea);
    t.beginPath();
    const E = M.EDGE;
    t.moveTo(E[0][0], E[0][1]);
    for (const p of E) t.lineTo(p[0], p[1]);
    t.lineTo(E[E.length - 1][0] + 4000, E[E.length - 1][1] + 4000); t.lineTo(E[0][0] + 4000, E[0][1] + 4000); t.closePath(); t.fill();
    for (const F of M.FLOES) {
      t.fillStyle = 'rgba(0,0,0,0.35)'; fillPoly(t, F.poly.map((q) => [q[0] + 5, q[1] + 6]));
      t.fillStyle = css(mixA(INK, BONE, 0.2 + 0.6 * F.tone)); fillPoly(t, F.poly);
    }
    // shadows (one solid layer, composited once so overlaps never double up)
    const sh = document.createElement('canvas'); sh.width = N; sh.height = N;
    const s = sh.getContext('2d');
    s.setTransform(R.res, 0, 0, R.res, -x0 * R.res, -x0 * R.res);
    s.fillStyle = '#000'; s.strokeStyle = '#000'; s.lineCap = 'round';
    const Lx = -ICE.L[0] / ICE.L[1], Lz = -ICE.L[2] / ICE.L[1];
    const sp = (p) => [p[0] + Lx * p[1], p[2] + Lz * p[1]];
    for (const o of M.OBJ) {
      if (o.c[0] + o.R < x0 - 300 || o.c[0] - o.R > x1 + 300 || o.c[2] + o.R < x0 - 300 || o.c[2] - o.R > x1 + 300) continue;
      if (o.faces.length) { const pts = []; for (const f of o.faces) for (const p of f.p) pts.push(sp(p)); const hh = hull(pts); if (hh.length > 2) fillPoly(s, hh); }
      for (const l of o.lines) { s.lineWidth = Math.max(l.w, 1.2); const a = sp(l.a), b = sp(l.b); s.beginPath(); s.moveTo(a[0], a[1]); s.lineTo(b[0], b[1]); s.stroke(); }
    }
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalAlpha = 0.3; t.drawImage(sh, 0, 0); t.globalAlpha = 1;
    return cv;
  }

  function iceDriftTile() {
    const S = 512, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const t = cv.getContext('2d'), r = U.rng('ww-ice-drift'), n = U.noise2D('ww-ice-drift');
    t.lineCap = 'round';
    for (let k = 0; k < 900; k++) {
      const x = r() * S, y = r() * S;
      const d = 0.5 + 0.5 * n(x / S * 4, y / S * 4);
      if (r() > d * d) continue;
      const len = r.range(30, 140);
      t.strokeStyle = `rgba(255,253,248,${(0.10 + 0.35 * d * r()).toFixed(3)})`;
      t.lineWidth = r.range(1, 4);
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { t.beginPath(); t.moveTo(x + ox, y + oy); t.lineTo(x + ox + len, y + oy); t.stroke(); }
    }
    return cv;
  }

  // ---- orthographic camera (shared by ice) -------------------------------------------------------------
  function iceProj(cs) {
    const th = cs.yaw * DEG, ph = cs.pitch * DEG, ro = (cs.roll || 0) * DEG;
    const ct = Math.cos(th), st = Math.sin(th), sp = Math.sin(ph), cp = Math.cos(ph), cr = Math.cos(ro), sr = Math.sin(ro);
    const z = cs.zoom, cx = W / 2 + (cs.sx || 0), cy = H / 2 + (cs.sy || 0), tx = cs.tx, tz = cs.tz;
    const out = [0, 0, 0];
    const V = [st * cp, sp, ct * cp];
    const P = {
      zoom: z, cosP: cp, sinP: sp, V, cs,
      pt(x, y, zz) {
        const dx = x - tx, dz = zz - tz;
        const X = (ct * dx - st * dz) * z, Zp = st * dx + ct * dz;
        const Y = (Zp * sp - y * cp) * z;
        out[0] = cx + cr * X - sr * Y; out[1] = cy + sr * X + cr * Y; out[2] = Zp * cp + y * sp;
        return out;
      },
      // ground affine: screen = A . [x, z, 1]
      affine() {
        const a = (ct * cr - sr * st * sp) * z, b = (sr * ct + cr * st * sp) * z;
        const c = (-st * cr - sr * ct * sp) * z, d = (-sr * st + cr * ct * sp) * z;
        const e = cx - (a * tx + c * tz), f = cy - (b * tx + d * tz);
        return [a, b, c, d, e, f];
      },
    };
    return P;
  }
  function invAffine(A, sx, sy) {
    const [a, b, c, d, e, f] = A, det = a * d - b * c;
    const x = sx - e, y = sy - f;
    return [(d * x - c * y) / det, (-b * x + a * y) / det];
  }

  function ice(ctx, o) {
    o = Object.assign({ parent: undefined, shutter: 0.5, maxSamples: 6, snowCount: 760 }, o || {});
    const M = iceModel();
    const { canvas, g } = ctx.canvas({ parent: o.parent, className: 'wild-ice' });
    const look = Object.assign({ snow: 1, drift: 1, flash: 0, beacons: 1, snowBoost: 0, dim: 0, haze: 1, lit: 0 }, o.look || {});
    const camAt = o.camAt;
    const siteLit = M.SITES.map(() => 0);
    const grounds = [], tops = [];
    let TEX = null;
    const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
    const bg2 = buf.getContext('2d');
    // snow particles (screen space, three depth layers)
    const rs = U.rng('ww-ice-snow');
    const SNOW = Array.from({ length: o.snowCount }, (_, i) => {
      const layer = i % 10 < 5 ? 0 : i % 10 < 8 ? 1 : 2;
      return { u: rs(), v: rs(), layer, sz: [0.9, 1.5, 2.6][layer] * rs.range(0.8, 1.3), sp: [240, 560, 1150][layer] * rs.range(0.8, 1.25), a: rs.range(0.45, 1), ph: rs() * 6.28, grey: rs() < 0.5 };
    });
    const tmp = [0, 0];
    const I = {
      canvas, g, look, siteLit, SITES: M.SITES, PATHS: M.PATHS, HUB: M.HUB, MASTS: M.MASTS, model: M, P: null,
      at, slice, ground(fn) { grounds.push(fn); return I; }, top(fn) { tops.push(fn); return I; },
      groundLine(gg, pts) { gg.beginPath(); pts.forEach((p, i) => { const q = I.P.pt(p[0], 0, p[1]); if (i) gg.lineTo(q[0], q[1]); else gg.moveTo(q[0], q[1]); }); },
      groundCircle(gg, x, z, rad, seg) { seg = seg || 48; gg.beginPath(); for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; const q = I.P.pt(x + Math.cos(a) * rad, 0, z + Math.sin(a) * rad); if (i) gg.lineTo(q[0], q[1]); else gg.moveTo(q[0], q[1]); } gg.closePath(); },
      camAt,
    };

    function drawWorld(G, cs, lt) {
      const P = iceProj(cs); I.P = P;
      G.setTransform(1, 0, 0, 1, 0, 0);
      G.globalAlpha = 1; G.globalCompositeOperation = 'source-over';
      G.fillStyle = css(ICOL.sea); G.fillRect(0, 0, W, H);
      const A = P.affine();
      // which world region is on screen
      let wx0 = Infinity, wx1 = -Infinity, wz0 = Infinity, wz1 = -Infinity;
      for (const [sx, sy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const q = invAffine(A, sx, sy); wx0 = Math.min(wx0, q[0]); wx1 = Math.max(wx1, q[0]); wz0 = Math.min(wz0, q[1]); wz1 = Math.max(wz1, q[1]); }
      const hiR = ICE.HI, inHi = wx0 > hiR.x0 + 60 && wz0 > hiR.x0 + 60 && wx1 < hiR.x0 + hiR.size - 60 && wz1 < hiR.x0 + hiR.size - 60;
      G.imageSmoothingEnabled = true; G.imageSmoothingQuality = 'low';
      const drawTex = (cv, R) => {
        const k = 1 / R.res;
        G.setTransform(A[0] * k, A[1] * k, A[2] * k, A[3] * k, A[4] + A[0] * R.x0 + A[2] * R.x0, A[5] + A[1] * R.x0 + A[3] * R.x0);
        G.drawImage(cv, 0, 0);
      };
      if (!inHi || P.zoom < 0.62) drawTex(TEX.lo, ICE.LO);
      if (P.zoom >= 0.62) drawTex(TEX.hi, ICE.HI);
      // spindrift: a moving pattern of streaks over the ice
      if (look.drift > 0.01) {
        G.setTransform(A[0], A[1], A[2], A[3], A[4], A[5]);
        const k = 700 / 512, off = lt * 150;
        const m = new DOMMatrix().rotate(ICE.WIND / DEG).translate(off / k * 0 + off, 0).scale(k);
        TEX.driftPat.setTransform(m);
        G.fillStyle = TEX.driftPat; G.globalAlpha = clamp(look.drift, 0, 1) * 0.75;
        G.fillRect(wx0 - 50, wz0 - 50, wx1 - wx0 + 100, wz1 - wz0 + 100);
        const m2 = new DOMMatrix().rotate(ICE.WIND / DEG + 6).translate(lt * 260 + 170, 90).scale(k * 0.55);
        TEX.driftPat.setTransform(m2);
        G.globalAlpha = clamp(look.drift, 0, 1) * 0.45;
        G.fillRect(wx0 - 50, wz0 - 50, wx1 - wx0 + 100, wz1 - wz0 + 100);
        G.globalAlpha = 1;
      }
      G.setTransform(1, 0, 0, 1, 0, 0);
      for (const fn of grounds) { G.save(); fn(G, lt, I); G.restore(); }
      // cliff faces of the shelf edge (front-facing only)
      const V = P.V;
      for (const cf of M.CLIFF) {
        if (cf.n[0] * V[0] + cf.n[2] * V[2] <= 0) continue;
        const a = P.pt(cf.a[0], 0, cf.a[1]); const ax = a[0], ay = a[1];
        if ((ax < -200 || ax > W + 200) && (ay < -200 || ay > H + 200)) continue;
        const b = P.pt(cf.b[0], 0, cf.b[1]); const bx = b[0], by = b[1];
        const c = P.pt(cf.b[0], -26, cf.b[1]); const cx2 = c[0], cy2 = c[1];
        const d = P.pt(cf.a[0], -26, cf.a[1]);
        G.fillStyle = cf.fill; G.beginPath(); G.moveTo(ax, ay); G.lineTo(bx, by); G.lineTo(cx2, cy2); G.lineTo(d[0], d[1]); G.closePath(); G.fill();
      }
      // 3D objects, painter's order
      const vis = [];
      const margin = 80;
      for (const ob of M.OBJ) {
        const q = P.pt(ob.c[0], ob.c[1], ob.c[2]);
        const rr = ob.R * P.zoom + margin;
        if (q[0] < -rr || q[0] > W + rr || q[1] < -rr || q[1] > H + rr) continue;
        vis.push([q[2], ob]);
      }
      vis.sort((a, b) => a[0] - b[0]);
      G.lineJoin = 'round'; G.lineCap = 'round';
      const thin = P.zoom < 0.5;
      for (const [, ob] of vis) {
        for (const f of ob.faces) {
          if (f.n[0] * V[0] + f.n[1] * V[1] + f.n[2] * V[2] <= 0.001) continue;
          G.beginPath();
          for (let i = 0; i < f.p.length; i++) { const q = P.pt(f.p[i][0], f.p[i][1], f.p[i][2]); if (i) G.lineTo(q[0], q[1]); else G.moveTo(q[0], q[1]); }
          G.closePath();
          if (f.win && ob.site == null) { G.fillStyle = f.fill; G.fill(); continue; }
          G.fillStyle = f.fill; G.fill();
          if (ob.edges && !thin) { G.strokeStyle = 'rgba(11,12,14,0.18)'; G.lineWidth = 0.8; G.stroke(); }
        }
        for (const l of ob.lines) {
          const a = P.pt(l.a[0], l.a[1], l.a[2]); const ax = a[0], ay = a[1];
          const b = P.pt(l.b[0], l.b[1], l.b[2]);
          G.strokeStyle = l.col; G.lineWidth = Math.max(l.guy ? 0.7 : 1.3, l.w * P.zoom);
          G.beginPath(); G.moveTo(ax, ay); G.lineTo(b[0], b[1]); G.stroke();
        }
        if (ob.flag) {
          const q = P.pt(ob.flag[0], ob.flag[1], ob.flag[2]);
          const s = Math.max(2.5, 5 * P.zoom);
          G.fillStyle = css(mixA(BG, BONE, 0.15));
          G.beginPath(); G.moveTo(q[0], q[1]); G.lineTo(q[0] + s * 1.6, q[1] + s * 0.45); G.lineTo(q[0], q[1] + s * 0.9); G.closePath(); G.fill();
        }
        if (ob.spin) {
          const sp = ob.spin, wa = ICE.WIND;
          const side = [-Math.sin(wa), 0, Math.cos(wa)];
          const hub = P.pt(sp.x, sp.h, sp.z); const hx = hub[0], hy = hub[1];
          const nose = P.pt(sp.x - Math.cos(wa) * 6, sp.h, sp.z - Math.sin(wa) * 6); const nx2 = nose[0], ny2 = nose[1];
          const tail = P.pt(sp.x + Math.cos(wa) * 9, sp.h, sp.z + Math.sin(wa) * 9);
          G.strokeStyle = css(INK); G.lineWidth = Math.max(2.5, 6 * P.zoom);
          G.beginPath(); G.moveTo(nx2, ny2); G.lineTo(tail[0], tail[1]); G.stroke();
          const ang0 = sp.ph + lt * 5.2;
          G.fillStyle = css(mixA(BG, BONE, 0.08));
          for (let b = 0; b < 3; b++) {
            const a = ang0 + b * 2.0944;
            const dx = Math.sin(a), dy = Math.cos(a);
            const tip = P.pt(sp.x - Math.cos(wa) * 6 + side[0] * dx * sp.len, sp.h + dy * sp.len, sp.z - Math.sin(wa) * 6 + side[2] * dx * sp.len);
            const tx2 = tip[0], ty2 = tip[1];
            const ex = tx2 - nx2, ey = ty2 - ny2, el = Math.hypot(ex, ey) || 1;
            const wdt = Math.max(1.2, 3.2 * P.zoom);
            G.beginPath(); G.moveTo(nx2 - ey / el * wdt, ny2 + ex / el * wdt); G.lineTo(tx2, ty2); G.lineTo(nx2 + ey / el * wdt * 0.4, ny2 - ex / el * wdt * 0.4); G.closePath(); G.fill();
          }
          void hx; void hy;
        }
      }
      // beacons: amber lamps on the mast tops blink on the beat
      if (look.beacons > 0.01) {
        for (const m of M.MASTS) {
          const q = P.pt(m.x, m.h + 2, m.z);
          const ph = ((lt + m.ph) % 0.5 + 0.5) % 0.5;
          const on = ph < 0.12 ? 1 : 0.25;
          const rr = Math.max(2.2, 4 * P.zoom) * (on > 0.5 ? 1.25 : 1);
          G.globalAlpha = look.beacons;
          G.fillStyle = css(AMBER, on > 0.5 ? 0.35 : 0.0); G.beginPath(); G.arc(q[0], q[1], rr * 3, 0, Math.PI * 2); G.fill();
          G.fillStyle = on > 0.5 ? C.amberLight : C.amberDeep; G.beginPath(); G.arc(q[0], q[1], rr, 0, Math.PI * 2); G.fill();
          G.globalAlpha = 1;
        }
      }
      // lit sites: amber lamps at the structure tops
      M.SITES.forEach((S, i) => {
        const v = Array.isArray(look.lit) ? look.lit[i] : look.lit; if (!(v > 0.001)) return;
        for (const ob of M.SITE_OBJ[i]) {
          if (!ob.top) continue;
          const q = P.pt(ob.top[0], ob.top[1] + 3, ob.top[2]);
          const rr = Math.max(3, 6 * P.zoom);
          G.fillStyle = css(AMBER, 0.32 * v); G.beginPath(); G.arc(q[0], q[1], rr * 3.2, 0, Math.PI * 2); G.fill();
          G.fillStyle = C.amberLight; G.globalAlpha = v; G.beginPath(); G.arc(q[0], q[1], rr, 0, Math.PI * 2); G.fill(); G.globalAlpha = 1;
        }
      });
      // depth haze: the far side of the shelf (screen top in an oblique view) whitens into the weather
      if (look.haze > 0.001 && P.cosP > 0.05) {
        const k = look.haze * clamp(P.cosP * 1.3, 0, 1);
        const gr = G.createLinearGradient(0, 0, 0, H * 0.62);
        gr.addColorStop(0, css([250, 247, 241], 0.62 * k)); gr.addColorStop(0.55, css([250, 247, 241], 0.2 * k)); gr.addColorStop(1, css([250, 247, 241], 0));
        G.fillStyle = gr; G.fillRect(0, 0, W, H * 0.62);
      }
      for (const fn of tops) { G.save(); fn(G, lt, I); G.restore(); }
      G.setTransform(1, 0, 0, 1, 0, 0);
    }

    function drawSnow(G, lt, P, Pp) {
      const amt = look.snow; if (amt <= 0.01) return;
      const dir = [0.56, 0.83];
      // camera flow at a screen point: where the world point under it was a moment ago
      const A = P.affine(), Ap = Pp ? Pp.affine() : null;
      const flow = (sx, sy) => {
        if (!Ap) return [0, 0];
        const q = invAffine(A, sx, sy);
        return [sx - (Ap[0] * q[0] + Ap[2] * q[1] + Ap[4]), sy - (Ap[1] * q[0] + Ap[3] * q[1] + Ap[5])];
      };
      // parallax drift with the camera: reference point under the frame centre at lt = 0
      const P0 = iceProj(camAt(0));
      const ref = invAffine(P0.affine(), W / 2, H / 2);
      const nowRef = P.pt(ref[0], 0, ref[1]);
      const pdx = nowRef[0] - W / 2, pdy = nowRef[1] - H / 2;
      const WM = W + 240, HM = H + 240;
      G.lineCap = 'round';
      for (const s of SNOW) {
        const par = [0.35, 0.7, 1.25][s.layer];
        const sway = Math.sin(lt * 2.1 + s.ph) * 14 * (s.layer + 1);
        let x = s.u * WM + dir[0] * s.sp * lt + pdx * par + sway;
        let y = s.v * HM + dir[1] * s.sp * lt + pdy * par;
        x = ((x % WM) + WM) % WM - 120; y = ((y % HM) + HM) % HM - 120;
        const fl = flow(x, y);
        const k = 1 / 60; // shutter
        let vx = dir[0] * s.sp * k + fl[0] * par * 0.9, vy = dir[1] * s.sp * k + fl[1] * par * 0.9;
        const boost = s.layer === 2 ? 1 + look.snowBoost * 1.5 : 1;
        vx *= boost; vy *= boost;
        const a = s.a * amt * (s.layer === 2 ? 0.75 : s.layer === 1 ? 0.7 : 0.55);
        G.strokeStyle = s.grey ? css(mixA(BONE, BG, 0.42), a * 0.62) : css([255, 253, 249], a);
        G.lineWidth = s.sz;
        G.beginPath(); G.moveTo(x, y); G.lineTo(x - vx, y - vy); G.stroke();
      }
    }

    ctx.onFrame((lt) => {
      if (!TEX) {
        TEX = { lo: paintIce(M, ICE.LO), hi: paintIce(M, ICE.HI) };
        // soften the HI layer's border so it melts into the LO layer
        const hi = TEX.hi, hg = hi.getContext('2d'), N = hi.width, F = Math.round(90 * ICE.HI.res);
        hg.globalCompositeOperation = 'destination-out';
        for (const [x, y, w, h, gx0, gy0, gx1, gy1] of [[0, 0, N, F, 0, 0, 0, F], [0, N - F, N, F, 0, N, 0, N - F], [0, 0, F, N, 0, 0, F, 0], [N - F, 0, F, N, N, 0, N - F, 0]]) {
          const gr = hg.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          hg.fillStyle = gr; hg.fillRect(x, y, w, h);
        }
        hg.globalCompositeOperation = 'source-over';
        TEX.driftPat = g.createPattern(iceDriftTile(), 'repeat');
      }
      const cs = camAt(lt);
      const dt = o.shutter / 30;
      const csp = camAt(Math.max(0, lt - dt));
      const P = iceProj(cs), Pp = iceProj(csp);
      // camera motion over the shutter, as a screen-space transform (this frame -> one shutter earlier)
      // (on the first frame there is no past: mirror the motion of the next shutter so a cut can land moving)
      const Tm = lt > dt ? affMul(Pp.affine(), affInv(P.affine())) : affMul(P.affine(), affInv(iceProj(camAt(lt + dt)).affine()));
      const mot = Tm ? affMotion(Tm) : 0;
      drawWorld(g, cs, lt);
      if (mot > 2.5) smear(g, canvas, bg2, buf, Tm, mot);
      I.P = P;
      g.setTransform(1, 0, 0, 1, 0, 0);
      if (look.dim > 0.001) { g.fillStyle = css(BG, look.dim); g.fillRect(0, 0, W, H); }
      drawSnow(g, lt, P, lt > dt ? Pp : null);
      if (look.flash > 0.001) { g.fillStyle = css([255, 253, 249], clamp(look.flash, 0, 1)); g.fillRect(0, 0, W, H); }
    });
    return I;
  }

  // =========================================================================================================
  // DESERT CANYON
  // =========================================================================================================
  const DES = {
    X0: -300, Y0: 450, WW: 7200, HH: 2300,               // world region with ground (units = px at zoom 1)
    TILES: [{ x0: -300, x1: 3500, res: 1 }, { x0: 3400, x1: 6900, res: 0.62 }],
    LIGHT: (() => { const a = -2.35; return [Math.cos(a), Math.sin(a)]; })(),   // toward the light: upper-left
  };
  /** segment buckets for fast distance-to-polyline queries within maxR */
  function segIndex(pls, cell, maxR) {
    const map = new Map();
    for (const pl of pls) for (let i = 0; i < pl.length - 1; i++) {
      const a = pl[i], b = pl[i + 1];
      const i0 = Math.floor((Math.min(a[0], b[0]) - maxR) / cell), i1 = Math.floor((Math.max(a[0], b[0]) + maxR) / cell);
      const j0 = Math.floor((Math.min(a[1], b[1]) - maxR) / cell), j1 = Math.floor((Math.max(a[1], b[1]) + maxR) / cell);
      for (let j = j0; j <= j1; j++) for (let k = i0; k <= i1; k++) { const key = k * 65536 + j; let L = map.get(key); if (!L) map.set(key, (L = [])); L.push(a[0], a[1], b[0], b[1]); }
    }
    return (x, y) => {
      const L = map.get(Math.floor(x / cell) * 65536 + Math.floor(y / cell));
      if (!L) return Infinity;
      let best = Infinity;
      for (let i = 0; i < L.length; i += 4) {
        const ax = L[i], ay = L[i + 1], dx = L[i + 2] - ax, dy = L[i + 3] - ay;
        const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
        const d = (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2;
        if (d < best) best = d;
      }
      return Math.sqrt(best);
    };
  }
  let DES_MODEL = null;
  function desertModel() {
    if (DES_MODEL) return DES_MODEL;
    const r = U.rng('ww-des-v1'), n = U.noise2D('ww-des-v1'), n2 = U.noise2D('ww-des-v1b');
    const FORK = [1700, 1600];
    const inbound = measure(spline([[-900, 1900], [-200, 1840], [500, 1700], [1100, 1650], [1450, 1620], FORK], 6));
    // the committed route runs down the canyon floor
    const canyon = [[1700, 1600], [2150, 1560], [2550, 1660], [2950, 1560], [3350, 1420], [3800, 1520], [4250, 1700], [4700, 1620], [5200, 1440], [5700, 1480], [6300, 1640], [7100, 1600]];
    const b = measure(spline(canyon, 6));
    const a = measure(spline([[1700, 1600], [1880, 1430], [2120, 1240], [2480, 1080], [2900, 960], [3400, 840]], 6));
    const c = measure(spline([[1700, 1600], [1900, 1800], [2220, 2010], [2620, 2160], [3100, 2330], [3600, 2440]], 6));
    // side canyons (branches off the main one)
    const sides = [
      [[2550, 1660], [2620, 1900], [2780, 2080], [2850, 2300]],
      [[3350, 1420], [3300, 1220], [3420, 1040]],
      [[4250, 1700], [4300, 1950], [4480, 2120], [4500, 2320]],
      [[4700, 1620], [4800, 1380], [4760, 1180], [4900, 980]],
      [[5700, 1480], [5650, 1240], [5800, 1040]],
      [[3800, 1520], [3900, 1760], [3850, 1920]],
      [[2950, 1560], [3020, 1380], [2960, 1260]],
    ].map((p) => spline(p, 8));
    const dCanyon = segIndex([b.pl], 128, 240), dSide = segIndex(sides, 128, 120);
    const BUTTES = [[1150, 1000, 120], [700, 2380, 150], [2300, 2620, 110], [1300, 2650, 80], [2700, 560, 120], [4000, 560, 150], [5200, 2640, 170], [450, 780, 90], [6200, 700, 160]];
    const plateau = (x, y) => {
      // a mesa east of the fork (y ~ 700 .. 2350) with a ragged escarpment; buttes out in the erg
      const nn = n2(x * 0.004, y * 0.004);
      const e = n(x * 0.0012, y * 0.0012) * 160 + nn * 45;
      const west = smooth(1950, 2150, x + e);
      const north = smooth(640, 820, y + e * 0.8), south = 1 - smooth(2180, 2360, y - e * 0.8);
      let m = west * north * south;
      for (const [bx, by, br] of BUTTES) {
        const dx = x - bx, dy = (y - by) * 1.2;
        if (Math.abs(dx) > br + 80 || Math.abs(dy) > br + 80) continue;
        const d = Math.hypot(dx, dy) + nn * 26;
        m = Math.max(m, 1 - smooth(br - 40, br + 20, d));
      }
      return m;
    };
    const DM = { r, n, n2, FORK, ROUTES: { inbound, a, b, c }, sides, canyonPl: b.pl, plateau };
    DM.height = (x, y) => {
      const h = plateau(x, y);
      if (h < 0.001) return 0;
      const nz = n2(x * 0.008, y * 0.008);
      const dc = dCanyon(x, y) + nz * 16;
      const floorW = 64 + 18 * n(x * 0.003, 3.3), rimW = floorW + 92 + 30 * n(x * 0.002, 7.1);
      let carve = 1 - smooth(floorW, rimW, dc);
      const ds = dSide(x, y);
      if (ds < 140) carve = Math.max(carve, 1 - smooth(24, 88, ds + nz * 10));
      return h * (1 - carve);
    };
    DES_MODEL = DM;
    return DM;
  }

  /** evenly spaced streamlines (Jobard-Lefer, simplified) of a direction field dirAt(x,y) -> angle | null */
  function streamlines(x0, y0, w, h, dirAt, sep, step, maxLen, seeds) {
    const cell = sep / 2, gw = Math.ceil(w / cell) + 1, gh = Math.ceil(h / cell) + 1;
    const grid = new Array(gw * gh);
    const lines = [];
    const ok = (x, y, own, test) => {
      const gx = Math.floor((x - x0) / cell), gy = Math.floor((y - y0) / cell);
      if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) return false;
      for (let j = gy - 2; j <= gy + 2; j++) for (let i = gx - 2; i <= gx + 2; i++) {
        if (i < 0 || j < 0 || i >= gw || j >= gh) continue;
        const L = grid[j * gw + i]; if (!L) continue;
        for (const p of L) { if (p[2] === own) continue; if ((p[0] - x) ** 2 + (p[1] - y) ** 2 < test * test) return false; }
      }
      return true;
    };
    const add = (x, y, id) => { const gx = Math.floor((x - x0) / cell), gy = Math.floor((y - y0) / cell); const k = gy * gw + gx; (grid[k] || (grid[k] = [])).push([x, y, id]); };
    const trace = (sx, sy, id) => {
      const out = [];
      for (const sgn of [1, -1]) {
        let x = sx, y = sy, prevA = null;
        const part = [];
        for (let k = 0; k < maxLen / step; k++) {
          let a = dirAt(x, y); if (a == null) break;
          if (prevA != null) { let d = a - prevA; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; if (Math.abs(d) > Math.PI / 2) a += Math.PI; }
          const nx = x + Math.cos(a) * step * sgn, ny = y + Math.sin(a) * step * sgn;
          if (!ok(nx, ny, id, sep * 0.5)) break;
          prevA = a; x = nx; y = ny; part.push([x, y]);
        }
        if (sgn === 1) out.push(...part.reverse()); else { out.push([sx, sy]); out.push(...part); }
      }
      return out;
    };
    let id = 0;
    const queue = [];
    const tryLine = (sx, sy) => {
      if (dirAt(sx, sy) == null || !ok(sx, sy, -1, sep)) return;
      const pl = trace(sx, sy, ++id);
      if (pl.length < 4) return;
      for (const p of pl) add(p[0], p[1], id);
      lines.push(pl); queue.push(pl);
    };
    for (const s of seeds) {
      tryLine(s[0], s[1]);
      while (queue.length) {
        const pl = queue.shift();
        for (let i = 0; i < pl.length; i += 2) {
          const p = pl[i], q = pl[Math.min(pl.length - 1, i + 1)];
          let tx = q[0] - p[0], ty = q[1] - p[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
          tryLine(p[0] - ty * sep, p[1] + tx * sep); tryLine(p[0] + ty * sep, p[1] - tx * sep);
        }
      }
    }
    return lines;
  }

  /** build the engraving once (Path2D ops in world units), then paint it into the texture tiles */
  function paintDesert(DM) {
    const R = DES;
    const { n, n2 } = DM, r = U.rng('ww-des-paint');
    // height grid + plateau mask grid
    const CELL = 6, gw = Math.ceil(R.WW / CELL) + 2, gh = Math.ceil(R.HH / CELL) + 2;
    const HG = new Float32Array(gw * gh), PG = new Float32Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const x = R.X0 + i * CELL, y = R.Y0 + j * CELL;
      const pm = DM.plateau(x, y); PG[j * gw + i] = pm;
      HG[j * gw + i] = pm < 0.001 ? 0 : DM.height(x, y);
    }
    const bil = (G2, x, y) => {
      const fx = (x - R.X0) / CELL, fy = (y - R.Y0) / CELL;
      const i = clamp(Math.floor(fx), 0, gw - 2), j = clamp(Math.floor(fy), 0, gh - 2), u = clamp(fx - i, 0, 1), v = clamp(fy - j, 0, 1);
      const k = j * gw + i;
      return lerp(lerp(G2[k], G2[k + 1], u), lerp(G2[k + gw], G2[k + gw + 1], u), v);
    };
    const hAt = (x, y) => bil(HG, x, y), pAt = (x, y) => bil(PG, x, y);
    const grad = (x, y) => [(hAt(x + CELL, y) - hAt(x - CELL, y)) / (2 * CELL), (hAt(x, y + CELL) - hAt(x, y - CELL)) / (2 * CELL)];
    const LG = DES.LIGHT;
    const inR = (x, y) => x > R.X0 + 4 && y > R.Y0 + 4 && x < R.X0 + R.WW - 4 && y < R.Y0 + R.HH - 4;
    const OPS = [];   // { path, kind: 'stroke'|'fill', style, lw }
    // ---- dunes: a warped asymmetric ridge field; streamlines run along the crests ----------------------------
    const dune = (x, y) => {
      const wx = x + 260 * n(x * 0.0007, y * 0.0007) + 60 * n2(x * 0.003, y * 0.003);
      const wy = y + 220 * n(x * 0.0007 + 9, y * 0.0007 - 4);
      const ph = (wx * 0.62 + wy * 0.78) / 150;
      const f = ph - Math.floor(ph);
      const prof = f < 0.78 ? f / 0.78 : (1 - f) / 0.22;   // gentle windward ramp, steep slip face
      return prof * (0.7 + 0.3 * n(x * 0.0016, y * 0.0016));
    };
    const dg = (x, y) => { const d0 = dune(x, y); return [(dune(x + 2, y) - d0) / 2, (dune(x, y + 2) - d0) / 2]; };
    const dirDune = (x, y) => {
      if (!inR(x, y) || pAt(x, y) > 0.04) return null;
      const gd = dg(x, y);
      if (Math.abs(gd[0]) + Math.abs(gd[1]) < 1e-7) return 0.9;
      return Math.atan2(gd[0], -gd[1]);
    };
    const seeds = [];
    for (let k = 0; k < 500; k++) seeds.push([r.range(R.X0, R.X0 + R.WW), r.range(R.Y0, R.Y0 + R.HH)]);
    const dl = streamlines(R.X0, R.Y0, R.WW, R.HH, dirDune, 7.5, 2, 1400, seeds);
    const NB = 6, paths = Array.from({ length: NB }, () => new Path2D());
    for (const pl of dl) {
      for (let i = 0; i < pl.length - 1; i++) {
        const p = pl[i], q = pl[i + 1];
        const gd = dg((p[0] + q[0]) / 2, (p[1] + q[1]) / 2), gl = Math.hypot(gd[0], gd[1]) || 1;
        const lit = clamp(0.5 + 0.5 * (-(gd[0] * LG[0] + gd[1] * LG[1]) / gl) * clamp(gl * 160, 0, 1), 0, 1);
        const tap = Math.min(i, pl.length - 1 - i) / 10;
        const v = lit * clamp(tap, 0.25, 1);
        const b2 = clamp(Math.floor(v * NB), 0, NB - 1);
        paths[b2].moveTo(p[0], p[1]); paths[b2].lineTo(q[0], q[1]);
      }
    }
    for (let k = 0; k < NB; k++) {
      const v = (k + 0.5) / NB;
      OPS.push({ path: paths[k], kind: 'stroke', style: css(mixA(AMBER_D, BONE, v), 0.12 + 0.62 * v * v), lw: 0.55 + 1.55 * v });
    }
    // ---- mesa tops: a lighter rock tint, stipple + thin strata lines in bands ------------------------------
    const tint = new Path2D();
    for (let j = 0; j < gh - 1; j++) {
      let run = -1;
      for (let i = 0; i <= gw - 1; i++) {
        const on = i < gw - 1 && HG[j * gw + i] > 0.9;
        if (on && run < 0) run = i;
        if (!on && run >= 0) { tint.rect(R.X0 + run * CELL - CELL / 2, R.Y0 + j * CELL - CELL / 2, (i - run) * CELL, CELL + 0.6); run = -1; }
      }
    }
    OPS.push({ path: tint, kind: 'fill', style: css(mixA(MAP, BONE, 0.07)), blur: 4 });
    const stip = [new Path2D(), new Path2D()];
    for (let k = 0; k < 160000; k++) {
      const x = r.range(R.X0, R.X0 + R.WW), y = r.range(R.Y0, R.Y0 + R.HH);
      if (hAt(x, y) < 0.95) continue;
      const v = 0.5 + 0.5 * n2(x * 0.006, y * 0.006);
      if (r() > 0.3 + 0.7 * v) continue;
      stip[v > 0.55 ? 1 : 0].rect(x, y, 1.5, 1.5);
    }
    OPS.push({ path: stip[0], kind: 'fill', style: css(BONE, 0.22) });
    OPS.push({ path: stip[1], kind: 'fill', style: css(BONE, 0.42) });
    const dirStrata = (x, y) => (inR(x, y) && hAt(x, y) > 0.955 ? -0.3 + 0.9 * n(x * 0.0006 + 2, y * 0.0006) + 0.2 * n2(x * 0.002, y * 0.002) : null);
    const sseeds = []; for (let k = 0; k < 600; k++) sseeds.push([r.range(1900, R.X0 + R.WW), r.range(R.Y0, R.Y0 + R.HH)]);
    const strata = streamlines(R.X0, R.Y0, R.WW, R.HH, dirStrata, 11, 2.5, 900, sseeds);
    const sp2 = [new Path2D(), new Path2D()];
    for (const pl of strata) for (let i = 0; i < pl.length - 1; i++) {
      const p = pl[i], q = pl[i + 1];
      const band = Math.sin((p[0] * 0.3 + p[1]) * 0.021 + 3 * n(p[0] * 0.001, p[1] * 0.001));
      if (band < -0.35) continue;
      sp2[band > 0.55 ? 1 : 0].moveTo(p[0], p[1]); sp2[band > 0.55 ? 1 : 0].lineTo(q[0], q[1]);
    }
    OPS.push({ path: sp2[0], kind: 'stroke', style: css(mixA(AMBER_D, BONE, 0.45), 0.26), lw: 0.85 });
    OPS.push({ path: sp2[1], kind: 'stroke', style: css(mixA(AMBER_D, BONE, 0.7), 0.42), lw: 1.05 });
    // ---- walls: hachures from the rim straight down the slope (stepped by strata ledges) -------------------
    const dirRim = (x, y) => {
      const h = hAt(x, y); if (h < 0.86 || h > 0.95 || !inR(x, y)) return null;
      const gg = grad(x, y); if (Math.hypot(gg[0], gg[1]) < 0.001) return null;
      return Math.atan2(gg[0], -gg[1]);
    };
    const wseeds = [];
    for (let k = 0; k < 4000; k++) { const x = r.range(R.X0, R.X0 + R.WW), y = r.range(R.Y0, R.Y0 + R.HH); const h = hAt(x, y); if (h > 0.88 && h < 0.93) wseeds.push([x, y]); }
    const rims = streamlines(R.X0, R.Y0, R.WW, R.HH, dirRim, 26, 2, 4000, wseeds);
    const HB = 6, hp = Array.from({ length: HB }, () => new Path2D());
    const ledges = [[0.62, 0.67], [0.34, 0.38]];
    const rimPath = new Path2D();
    for (const row of rims) {
      let acc = 99;
      rimPath.moveTo(row[0][0], row[0][1]);
      for (let i = 1; i < row.length; i++) {
        rimPath.lineTo(row[i][0], row[i][1]);
        acc += Math.hypot(row[i][0] - row[i - 1][0], row[i][1] - row[i - 1][1]);
        if (acc < 3.3) continue;
        acc = 0;
        let x = row[i][0], y = row[i][1];
        let gg = grad(x, y), gl = Math.hypot(gg[0], gg[1]) || 1;
        const dx0 = -gg[0] / gl, dy0 = -gg[1] / gl;
        const lit = clamp(0.5 + 0.5 * (dx0 * LG[0] + dy0 * LG[1]), 0, 1);
        const b2 = clamp(Math.floor(lit * HB), 0, HB - 1);
        const P2 = hp[b2];
        let pen = false;
        const jit = r.range(-0.15, 0.15);
        for (let k = 0; k < 70; k++) {
          gg = grad(x, y); gl = Math.hypot(gg[0], gg[1]);
          if (gl < 1e-5) break;
          const dx = -gg[0] / gl, dy = -gg[1] / gl;
          const nx = x + (dx + dy * jit) * 2.2, ny = y + (dy - dx * jit) * 2.2;
          const h = hAt(nx, ny);
          if (h < 0.07) break;
          const gap = ledges.some(([l0, l1]) => h > l0 && h < l1);
          if (!gap) { if (!pen) P2.moveTo(x, y); P2.lineTo(nx, ny); pen = true; } else pen = false;
          x = nx; y = ny;
        }
      }
    }
    for (let k = 0; k < HB; k++) {
      const v = (k + 0.5) / HB;
      OPS.push({ path: hp[k], kind: 'stroke', style: css(mixA(AMBER_D, INK, 0.15 + v * 0.75), 0.14 + 0.8 * v * v), lw: 0.5 + 1.35 * v });
    }
    OPS.push({ path: rimPath, kind: 'stroke', style: css(INK, 0.62), lw: 1.4 });
    // ---- canyon floor: dark, a braided dry wash + pebbles --------------------------------------------------
    const floorP = new Path2D();
    for (let j = 0; j < gh - 1; j++) {
      let run = -1;
      for (let i = 0; i <= gw - 1; i++) {
        const k = j * gw + i;
        const on = i < gw - 1 && HG[k] < 0.08 && PG[k] > 0.25;
        if (on && run < 0) run = i;
        if (!on && run >= 0) { floorP.rect(R.X0 + run * CELL - CELL / 2, R.Y0 + j * CELL - CELL / 2, (i - run) * CELL, CELL + 0.6); run = -1; }
      }
    }
    OPS.unshift({ path: floorP, kind: 'fill', style: css(mixA(BG, MAP, 0.3)), blur: 5 });
    const wash = new Path2D(), peb = new Path2D();
    const pl = DM.ROUTES.b.pl;
    for (let k = -2; k <= 2; k++) {
      let pen = false;
      for (let i = 0; i < pl.length; i += 2) {
        const p = pl[i], q = pl[Math.min(pl.length - 1, i + 1)];
        let tx = q[0] - p[0], ty = q[1] - p[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const off = k * 13 + 16 * n(p[0] * 0.004 + k, p[1] * 0.004);
        const x = p[0] - ty * off, y = p[1] + tx * off;
        const ok = hAt(x, y) < 0.12 && pAt(x, y) > 0.3 && (Math.abs(k) < 2 || n2(p[0] * 0.003, k) > 0);
        if (ok) { if (pen) wash.lineTo(x, y); else wash.moveTo(x, y); pen = true; } else pen = false;
      }
    }
    for (let k = 0; k < 30000; k++) {
      const x = r.range(1900, R.X0 + R.WW), y = r.range(R.Y0, R.Y0 + R.HH);
      if (hAt(x, y) > 0.1 || pAt(x, y) < 0.3) continue;
      peb.rect(x, y, 1.2, 1.2);
    }
    OPS.push({ path: wash, kind: 'stroke', style: css(BONE, 0.16), lw: 1.1 });
    OPS.push({ path: peb, kind: 'fill', style: css(BONE, 0.14) });
    // old tracks across the erg (faint, dotted)
    const trk = new Path2D();
    for (const tr of [[[-400, 900], [300, 1100], [900, 1300], [1400, 1500]], [[-300, 2600], [400, 2300], [1000, 2000], [1500, 1750]], [[600, 450], [900, 800], [1200, 1300], [1600, 1550]]]) {
      const tp = spline(tr, 10); tp.forEach((p, i) => (i ? trk.lineTo(p[0], p[1]) : trk.moveTo(p[0], p[1])));
    }
    OPS.push({ path: trk, kind: 'stroke', style: css(BONE, 0.22), lw: 1.4, dash: [2, 7] });
    DM.hAt = hAt; DM.pAt = pAt;
    // ---- paint the tiles ---------------------------------------------------------------------------------------
    return R.TILES.map((T) => {
      const w = Math.round((T.x1 - T.x0) * T.res), h = Math.round(R.HH * T.res);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const t = cv.getContext('2d');
      t.setTransform(T.res, 0, 0, T.res, -T.x0 * T.res, -R.Y0 * T.res);
      t.fillStyle = C.map; t.fillRect(T.x0, R.Y0, T.x1 - T.x0, R.HH);
      t.lineCap = 'round'; t.lineJoin = 'round';
      const sc = T.res < 1 ? 1 / Math.sqrt(T.res) : 1;   // keep fine lines visible on the low-res tile
      for (const op of OPS) {
        if (op.kind === 'fill') { t.fillStyle = op.style; t.filter = op.blur ? `blur(${(op.blur * T.res).toFixed(1)}px)` : 'none'; t.fill(op.path); t.filter = 'none'; continue; }
        t.strokeStyle = op.style; t.lineWidth = op.lw * sc; t.setLineDash(op.dash || []); t.stroke(op.path);
      }
      t.setLineDash([]);
      return { cv, T };
    });
  }

  function desProj(cs) {
    const ro = (cs.rot || 0) * DEG, z = cs.zoom, cr = Math.cos(ro) * z, sr = Math.sin(ro) * z;
    const ox = W / 2 + (cs.sx || 0), oy = H / 2 + (cs.sy || 0);
    const out = [0, 0];
    const A = [cr, sr, -sr, cr, ox - (cr * cs.cx - sr * cs.cy), oy - (sr * cs.cx + cr * cs.cy)];
    return { zoom: z, rot: ro, cs, A, pt(x, y) { out[0] = A[0] * x + A[2] * y + A[4]; out[1] = A[1] * x + A[3] * y + A[5]; return out; } };
  }

  function desert(ctx, o) {
    o = Object.assign({ parent: undefined, shutter: 0.5, maxSamples: 6 }, o || {});
    const DM = desertModel();
    const { canvas, g } = ctx.canvas({ parent: o.parent, className: 'wild-desert' });
    const look = Object.assign({ sand: 1, flash: 0, dim: 0 }, o.look || {});
    const camAt = o.camAt;
    const grounds = [], tops = [], overs = [];
    let TEX = null;
    const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
    const bg2 = buf.getContext('2d');
    const rs = U.rng('ww-des-sand');
    const SAND = Array.from({ length: 520 }, () => ({ x: rs.range(DES.X0, DES.X0 + DES.WW), y: rs.range(DES.Y0, DES.Y0 + DES.HH), ph: rs(), sp: rs.range(60, 160), len: rs.range(6, 22), a: rs.range(0.25, 0.7) }));
    const D = {
      canvas, g, look, FORK: DM.FORK, ROUTES: DM.ROUTES, model: DM, P: null, at, slice,
      ground(fn) { grounds.push(fn); return D; }, top(fn) { tops.push(fn); return D; }, over(fn) { overs.push(fn); return D; },
      line(gg, pts) { gg.beginPath(); pts.forEach((p, i) => { const q = D.P.pt(p[0], p[1]); if (i) gg.lineTo(q[0], q[1]); else gg.moveTo(q[0], q[1]); }); },
      camAt,
    };
    function drawWorld(G, cs, lt) {
      const P = desProj(cs); D.P = P;
      G.setTransform(1, 0, 0, 1, 0, 0); G.globalAlpha = 1; G.globalCompositeOperation = 'source-over';
      G.fillStyle = C.map; G.fillRect(0, 0, W, H);
      const A = P.A;
      G.imageSmoothingEnabled = true; G.imageSmoothingQuality = 'low';
      // world x range on screen (to skip a tile that is off screen)
      const det = A[0] * A[3] - A[1] * A[2];
      let xmin = Infinity, xmax = -Infinity;
      for (const [sx, sy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const x = sx - A[4], y = sy - A[5]; const wx = (A[3] * x - A[2] * y) / det; xmin = Math.min(xmin, wx); xmax = Math.max(xmax, wx); }
      for (let i = TEX.length - 1; i >= 0; i--) {
        const { cv, T } = TEX[i];
        if (T.x1 < xmin || T.x0 > xmax) continue;
        const k = 1 / T.res;
        G.setTransform(A[0] * k, A[1] * k, A[2] * k, A[3] * k, A[4] + A[0] * T.x0 + A[2] * DES.Y0, A[5] + A[1] * T.x0 + A[3] * DES.Y0);
        G.drawImage(cv, 0, 0);
      }
      G.setTransform(1, 0, 0, 1, 0, 0);
      // blown sand: short bright streaks drifting along the dunes (wind toward the lower-right)
      if (look.sand > 0.01) {
        G.lineCap = 'round';
        const wx = 0.78, wy = 0.62;
        for (const s of SAND) {
          const u = (lt * s.sp / 900 + s.ph) % 1;
          const x = s.x + wx * u * 900, y = s.y + wy * u * 900;
          const q = P.pt(x, y); const qx = q[0], qy = q[1];
          if (qx < -40 || qx > W + 40 || qy < -40 || qy > H + 40) continue;
          if (DM.hAt && DM.hAt(x, y) > 0.05) continue;
          const e = P.pt(x - wx * s.len, y - wy * s.len);
          G.strokeStyle = css(BONE, s.a * Math.sin(Math.PI * u) * look.sand); G.lineWidth = 1.3;
          G.beginPath(); G.moveTo(qx, qy); G.lineTo(e[0], e[1]); G.stroke();
        }
      }
      for (const fn of grounds) { G.save(); fn(G, lt, D); G.restore(); }
      for (const fn of tops) { G.save(); fn(G, lt, D); G.restore(); }
      G.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.onFrame((lt) => {
      if (!TEX) TEX = paintDesert(DM);
      const cs = camAt(lt);
      const dt = o.shutter / 30;
      const P = desProj(cs);
      const Tm = lt > dt ? affMul(desProj(camAt(lt - dt)).A, affInv(P.A)) : affMul(P.A, affInv(desProj(camAt(lt + dt)).A));
      const mot = Tm ? affMotion(Tm) : 0;
      drawWorld(g, cs, lt);
      if (mot > 2.5) smear(g, canvas, bg2, buf, Tm, mot);
      D.P = P;
      g.setTransform(1, 0, 0, 1, 0, 0);
      for (const fn of overs) { g.save(); fn(g, lt, D); g.restore(); }
      if (look.dim > 0.001) { g.fillStyle = css(BG, look.dim); g.fillRect(0, 0, W, H); }
      if (look.flash > 0.001) { g.fillStyle = css([255, 250, 240], clamp(look.flash, 0, 1)); g.fillRect(0, 0, W, H); }
    });
    return D;
  }

  window.WorldWild = { ice, desert, spline, measure, at, slice, ICE, DES, iceModel, desertModel, css, mixA, rgb: hexRgb };
})();
