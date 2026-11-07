/* contourflood.js: DRAIN / FLOOD, the film's signature topographic threshold dissolve
 * (storyboard "TRANSITION VOCABULARY" device 2; used exactly twice: match -> archive at 4.0 s in
 * s03, archive -> world at 12.5 s in s04).
 *
 * The picture changes along contour lines of a scalar field N' over a screen rect:
 *   N' = wNoise * noise + wDist * (distance to the river / max), both normalised to 0..1.
 * For a threshold t, the target layer keeps the region N' < t ('below') or N' > t ('above'), and
 * a 1.5 px amber front is stroked exactly on the iso-line N' = t. Low N' (the river) goes first
 * on a flood and last on a drain.
 *
 * How: marching squares on a padded grid (the border is +inf, so every iso-line is a closed loop)
 * gives the region as closed polygons; they become ONE `clip-path: path(evenodd, ...)` on the
 * target element, so it works on any DOM layer (a scene root, a div holding a terrain canvas and
 * SVG marks, an archive window...). The same loops are the front's SVG path. Everything is a pure
 * function of a tweened progress `p.t` (read in ctx.onFrame); paths are cached per quantised t.
 *
 *   const fld = ContourFlood.field({ x, y, w, h, step: 4, river: [[sx, sy], ...], noise, seed })
 *   const fld = ContourFlood.worldField(F, { x, y, w, h }, { cam })   // N' from a Floodgate.world:
 *                     noise = the terrain's own height, so the front rides the map's contour lines
 *   const D = ContourFlood.create(ctx, {
 *     field: fld,            // from field() / worldField()
 *     target: el,            // DOM element to clip (default ctx.root)
 *     origin: [0, 0],        // target's top-left in screen px (clip-path is in its own box)
 *     keep: 'below',         // 'below' keeps N' < t (drain: tween t 1 -> 0) | 'above' keeps N' > t
 *     front: true,           // amber iso-line; frontParent (default ctx.root), frontColor, frontWidth (1.5)
 *     glow: 0.14,            // opacity of a soft 6 px under-stroke (0 = none)
 *   });
 *   D.p                      proxy { t } - tween it on ctx.tl, or:
 *   D.play(at, dur, from, to, ease)     fromTo on the proxy (default power1.inOut)
 *   D.pathAt(t)              the region path string (screen coords) for tests
 *   ContourFlood.valueAt(fld, sx, sy)   N' at a screen point: a mark on another layer (e.g. a token
 *                            kept above the drain) is "under water" once valueAt(...) >= t
 *
 * Used by s03 (drain on a wrapper around Match's world layer, keep 'below', t 1 -> 0) and s04 (flood
 * on the archive layer, keep 'above', t 0 -> 1); both build the SAME worldField under WINDOW, so
 * the era change is one shape played backwards and forwards.
 *
 * Determinism: no clock, no Math.random (default noise is seeded from `seed`).
 */
(function () {
  'use strict';
  const W = 1920, H = 1080;
  const BIG = 1e3;

  function distToPath(x, y, pts) {
    let best = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], ay = pts[i][1], bx = pts[i + 1][0], by = pts[i + 1][1];
      const dx = bx - ax, dy = by - ay;
      const L = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L));
      const d = Math.hypot(x - ax - u * dx, y - ay - u * dy);
      if (d < best) best = d;
    }
    return best;
  }

  /**
   * Scalar field over a screen rect, sampled every `step` px on a padded grid.
   * o: x, y, w, h, step (4), river (screen polyline), noise (fn(sx, sy) -> number) or seed + scale,
   *    wNoise (0.55), wDist (0.45)
   */
  function field(o) {
    o = Object.assign({ step: 4, wNoise: 0.55, wDist: 0.45, seed: 'contourflood', scale: 1 / 260 }, o);
    const step = o.step;
    const cols = Math.ceil(o.w / step) + 1, rows = Math.ceil(o.h / step) + 1;
    const PC = cols + 2, PR = rows + 2;
    const nz = o.noise || (() => { const n = Film.utils.noise2D(o.seed); return (x, y) => n.fbm(x * o.scale, y * o.scale, 4); })();
    const a = new Float32Array(cols * rows), b = new Float32Array(cols * rows);
    let aLo = Infinity, aHi = -Infinity, bLo = Infinity, bHi = -Infinity;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const sx = o.x + i * step, sy = o.y + j * step, k = j * cols + i;
      const va = nz(sx, sy); a[k] = va; if (va < aLo) aLo = va; if (va > aHi) aHi = va;
      const vb = o.river ? distToPath(sx, sy, o.river) : 0; b[k] = vb; if (vb < bLo) bLo = vb; if (vb > bHi) bHi = vb;
    }
    const ia = aHi > aLo ? 1 / (aHi - aLo) : 0, ib = bHi > bLo ? 1 / (bHi - bLo) : 0;
    const wsum = o.wNoise + (o.river ? o.wDist : 0);
    const raw = new Float32Array(cols * rows);
    let lo = Infinity, hi = -Infinity;
    for (let k = 0; k < raw.length; k++) {
      const v = (o.wNoise * (a[k] - aLo) * ia + (o.river ? o.wDist * (b[k] - bLo) * ib : 0)) / wsum;
      raw[k] = v; if (v < lo) lo = v; if (v > hi) hi = v;
    }
    const v = new Float32Array(PC * PR).fill(BIG);
    const inv = hi > lo ? 1 / (hi - lo) : 0;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) v[(j + 1) * PC + (i + 1)] = (raw[j * cols + i] - lo) * inv;
    return { x: o.x, y: o.y, w: o.w, h: o.h, step, cols, rows, PC, PR, v };
  }

  /**
   * Field from a Floodgate.world (or any Brand.terrain handle with .height): N' follows the
   * terrain's own height (so the front rides the visible contour lines), plus distance to the river.
   * o.cam { cx, cy, zoom } (world units; default the terrain's current state), o.rough (0.12: share
   * of seeded fbm mixed into the height so the line breathes), step, wNoise, wDist.
   */
  function worldField(F, rect, o) {
    o = Object.assign({ rough: 0.12, step: 4, wNoise: 0.55, wDist: 0.45 }, o || {});
    const T = F.T || F;
    const cam = Object.assign({ cx: T.state.cx, cy: T.state.cy, zoom: T.state.zoom }, o.cam || {});
    const toW = (sx, sy) => [cam.cx + (sx - W / 2) / cam.zoom, cam.cy + (sy - H / 2) / cam.zoom];
    const toS = (wx, wy) => [W / 2 + (wx - cam.cx) * cam.zoom, H / 2 + (wy - cam.cy) * cam.zoom];
    const river = (F.P && F.P.river ? F.P.river : o.river || []).map((p) => toS(p[0], p[1]));
    const n = Film.utils.noise2D('contourflood:' + (o.seed || 'world'));
    // heights are ~0..1.1 for the Floodgate valley; the fbm term is scaled to a comparable range
    const noise = (sx, sy) => { const w = toW(sx, sy); return (1 - o.rough) * T.height(w[0], w[1]) + o.rough * 0.5 * n.fbm(sx / 180, sy / 180, 3); };
    return field({ x: rect.x, y: rect.y, w: rect.w, h: rect.h, step: o.step, wNoise: o.wNoise, wDist: o.wDist, river: river.length > 1 ? river : null, noise });
  }

  // marching squares -> closed loops (arrays of x, y) for level t
  function loops(F, t) {
    const { PC, PR, v, step } = F;
    const x0 = F.x - step, y0 = F.y - step; // padded sample (0,0) position
    const nE = PC * PR * 2;
    const eA = new Int32Array(nE).fill(-1), eB = new Int32Array(nE).fill(-1);
    const s1 = [], s2 = [];
    const H_ = (i, j) => (j * PC + i) * 2, V_ = (i, j) => (j * PC + i) * 2 + 1;
    const add = (e1, e2) => {
      const s = s1.length; s1.push(e1); s2.push(e2);
      if (eA[e1] < 0) eA[e1] = s; else eB[e1] = s;
      if (eA[e2] < 0) eA[e2] = s; else eB[e2] = s;
    };
    for (let j = 0; j < PR - 1; j++) {
      const r0 = j * PC, r1 = r0 + PC;
      for (let i = 0; i < PC - 1; i++) {
        const a = v[r0 + i], b = v[r0 + i + 1], c = v[r1 + i + 1], d = v[r1 + i];
        const cs = (a < t ? 8 : 0) | (b < t ? 4 : 0) | (c < t ? 2 : 0) | (d < t ? 1 : 0);
        if (cs === 0 || cs === 15) continue;
        const T_ = H_(i, j), B_ = H_(i, j + 1), L_ = V_(i, j), R_ = V_(i + 1, j);
        switch (cs) {
          case 8: case 7: add(T_, L_); break;
          case 4: case 11: add(T_, R_); break;
          case 2: case 13: add(R_, B_); break;
          case 1: case 14: add(B_, L_); break;
          case 12: case 3: add(L_, R_); break;
          case 6: case 9: add(T_, B_); break;
          case 10: { const ci = (a + b + c + d) / 4 < t; if (ci) { add(T_, R_); add(B_, L_); } else { add(T_, L_); add(R_, B_); } break; }
          case 5: { const ci = (a + b + c + d) / 4 < t; if (ci) { add(T_, L_); add(R_, B_); } else { add(T_, R_); add(B_, L_); } break; }
          default: break;
        }
      }
    }
    function pt(e) {
      const k = e >> 1, i = k % PC, j = (k - i) / PC;
      const va = v[k];
      if (e & 1) { const vb = v[k + PC]; const u = (t - va) / (vb - va); return [x0 + i * step, y0 + (j + u) * step]; }
      const vb = v[k + 1]; const u = (t - va) / (vb - va); return [x0 + (i + u) * step, y0 + j * step];
    }
    const seen = new Uint8Array(s1.length);
    const out = [];
    for (let s0 = 0; s0 < s1.length; s0++) {
      if (seen[s0]) continue;
      const poly = [];
      let s = s0, e = s1[s0];
      for (let guard = 0; guard < 400000; guard++) {
        seen[s] = 1;
        const p = pt(e); poly.push(p[0], p[1]);
        const ne = s1[s] === e ? s2[s] : s1[s];
        const ns = eA[ne] === s ? eB[ne] : eA[ne];
        e = ne;
        if (ns < 0 || ns === s0 || seen[ns]) break;
        s = ns;
      }
      if (poly.length >= 6) out.push(poly);
    }
    return out;
  }

  function toPath(ls, ox, oy) {
    let d = '';
    for (const p of ls) {
      d += 'M' + (p[0] - ox).toFixed(1) + ' ' + (p[1] - oy).toFixed(1);
      for (let k = 2; k < p.length; k += 2) d += 'L' + (p[k] - ox).toFixed(1) + ' ' + (p[k + 1] - oy).toFixed(1);
      d += 'Z';
    }
    return d;
  }

  function create(ctx, o) {
    o = Object.assign({ target: ctx.root, origin: [0, 0], keep: 'below', front: true, frontColor: Brand.C.amber, frontWidth: 1.5, glow: 0.14, quant: 2048, t: null }, o || {});
    const F = o.field;
    if (!F) throw new Error('ContourFlood.create: { field } is required');
    const p = { t: o.t != null ? o.t : (o.keep === 'below' ? 1 : 0) };
    const cache = new Map();
    function get(t) {
      const q = Math.round(t * o.quant) / o.quant;
      let e = cache.get(q);
      if (!e) {
        const ls = loops(F, q);
        e = { clip: toPath(ls, o.origin[0], o.origin[1]), front: toPath(ls, 0, 0) };
        cache.set(q, e);
        if (cache.size > 96) cache.delete(cache.keys().next().value);
      }
      return e;
    }
    let sv = null, line = null, glow = null;
    if (o.front) {
      sv = ctx.svg('svg', { class: 'brand-svg contourflood-front', style: 'pointer-events:none' }, o.frontParent);
      const r = o.frontClip || F;
      sv.style.clipPath = `inset(${r.y}px ${W - r.x - r.w}px ${H - r.y - r.h}px ${r.x}px)`;
      if (o.glow > 0) glow = ctx.svg('path', { fill: 'none', stroke: o.frontColor, 'stroke-width': 6, 'stroke-opacity': o.glow, 'stroke-linejoin': 'round' }, sv);
      line = ctx.svg('path', { fill: 'none', stroke: o.frontColor, 'stroke-width': o.frontWidth, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, sv);
    }
    const OUTER = `M${-4000 - o.origin[0]} ${-4000 - o.origin[1]}H${6000 - o.origin[0]}V${6000 - o.origin[1]}H${-4000 - o.origin[0]}Z`;
    let lastClip = null;
    function apply(t) {
      const below = o.keep === 'below';
      let clip, fd = '';
      if (t >= 1) clip = below ? 'none' : 'inset(100% 0px 0px 0px)';
      else if (t <= 0) clip = below ? 'inset(100% 0px 0px 0px)' : 'none';
      else {
        const e = get(t);
        clip = `path(evenodd, "${below ? e.clip : OUTER + e.clip}")`;
        fd = e.front;
      }
      if (clip !== lastClip) { o.target.style.clipPath = clip === 'none' ? '' : clip; lastClip = clip; }
      if (sv) {
        // the front fades in/out over the first/last 4% so it never pops
        const a = Math.min(1, Math.max(0, t / 0.04), Math.max(0, (1 - t) / 0.04));
        sv.style.display = fd && a > 0.001 ? '' : 'none';
        if (fd) { line.setAttribute('d', fd); if (glow) glow.setAttribute('d', fd); sv.style.opacity = a.toFixed(3); }
      }
    }
    ctx.onFrame(() => apply(p.t));
    return {
      p, svg: sv, apply, field: F,
      pathAt: (t) => get(t).front,
      play(at, dur, from, to, ease) {
        ctx.tl.fromTo(p, { t: from }, { t: to, duration: dur, ease: ease || 'power1.inOut', immediateRender: false }, at);
        return this;
      },
    };
  }

  /** N' at a screen point (bilinear; outside the rect = 1). Use it to make a mark that lives on
   *  another layer vanish exactly when the front passes it: visible while valueAt(...) < t. */
  function valueAt(F, sx, sy) {
    const gx = (sx - F.x) / F.step + 1, gy = (sy - F.y) / F.step + 1;
    if (gx < 1 || gy < 1 || gx > F.cols || gy > F.rows) return 1;
    const i = Math.min(F.PC - 2, Math.floor(gx)), j = Math.min(F.PR - 2, Math.floor(gy)), u = gx - i, w = gy - j;
    const v = F.v, k = j * F.PC + i;
    const a = Math.min(1, v[k]), b = Math.min(1, v[k + 1]), c = Math.min(1, v[k + F.PC]), d = Math.min(1, v[k + F.PC + 1]);
    return (a * (1 - u) + b * u) * (1 - w) + (c * (1 - u) + d * u) * w;
  }

  window.ContourFlood = { field, worldField, create, loops, distToPath, valueAt };
})();
