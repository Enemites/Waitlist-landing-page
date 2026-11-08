/* s07-find-your-opposition: film 28.0-34.0 s (6 s, bars 15.1-18.1). Local 0 = film 28.0.
 * Starts on s06's last frame (LOBBY_A2) and whips along the planned-matchmaking line across the river
 * to Vega's identical lobby (LOBBY_V, 28.75): the same ring, the same framing, the same type positions
 * (02 —— FIND YOUR OPPOSITION / 'The same challenge.' / 'Another approach.'), three Vega triangles
 * at other angles, VEGA. 32.5-33.0 pull back to OVERVIEW_WIDE; 33.0 the river becomes the versus line;
 * 33.5-34.0 the bank labels fly into the score pill and topbar, the lobbies fold into the match's
 * opening positions, and the pill lands on 34.0 (s08's first frame, landing note F5).
 * Mirror build: the lobby is the same side-agnostic kit as s06.
 */
(function () {
  'use strict';
  const ID = 's07-find-your-opposition';
  // ============================================================================================
  // ONE-WORLD KIT: identical in s05-one-world, s06-form-your-team and s07-find-your-opposition
  // (keep the three copies in sync). It guarantees the joins: s05 -> s06 (INTO A RING, the dive
  // lands on LOBBY_A) and s06 -> s07 (ALONG A ROUTE, the rise lands on LOBBY_A2) rebuild the
  // identical frame from the same world, camera, node, banner, lobby and HUD code.
  // Screen-space marks (node, banners, markers, routes, rings, labels) are re-projected every
  // frame from F.toScreen, so they keep a constant size; the terrain is the shared Floodgate
  // world (margin 240, res 2 for the close-ups, world camera only, never CSS-scaled).
  // ============================================================================================
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, FPS = 30, S = 1.5, MARGIN = 240;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const EZ = {};
  const ez = (n) => EZ[n] || (EZ[n] = gsap.parseEase(n));
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const CAM = Match.CAM;
  const APEX = { atlas: [380, 320], vega: [1260, 690] };          // hill A / hill V (product units)
  const LOBBY_SCREEN = [1340, 560];                                  // apex on screen in both lobbies
  const RING_R = 60;                                                 // lobby ring radius (198 px at zoom 2.2)
  const SLOT_DEG = { atlas: [150, -90, 30], vega: [0, -120, 120] };  // atlas: JK lower-left, NC top, EK lower-right
  const LOBBY_A2 = { x: 560, y: 350, zoom: 1.4 };                    // s06 end = s07 start (risen, heading east)
  const MM_PTS = [[440, 318], [560, 334], [690, 378], [800, 424], [905, 452], [1010, 486], [1110, 530], [1190, 580], [1240, 620], [1260, 630]];
  const MM_HEAD_S06 = 0.27;                                          // planned-matchmaking head at the s06/s07 cut
  const CONTOUR_LEVEL = 0.78;                                        // the summit contour that becomes the lobby ring
  const SLUG = 'REALMS · COMPETITIVE · INTERFACE CONCEPT';
  const BANNER = { L: 152, w: 64, h: 128 };                          // pole length, cloth size (screen px)
  const NODE_PULSE_EVERY = 1.5;                                      // THE NODE pulses once every 3 beats (film time)

  // ---- camera (product units {x, y, zoom}; zoom interpolated in log space) ----
  const camLerp = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), u)) });
  const scr = (px, py, c) => [(px - c.x) * c.zoom * S + W / 2, (py - c.y) * c.zoom * S + H / 2];
  const camAt = (P, s, z) => ({ x: P[0] - (s[0] - W / 2) / (z * S), y: P[1] - (s[1] - H / 2) / (z * S), zoom: z });
  // anchored move: product point P travels on screen in a straight line while the zoom moves in log space
  function camAnchor(a, b, P, u) {
    const sa = scr(P[0], P[1], a), sb = scr(P[0], P[1], b);
    return camAt(P, [lerp(sa[0], sb[0], u), lerp(sa[1], sb[1], u)], Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), u)));
  }
  const LOBBY = { atlas: CAM.LOBBY_A, vega: CAM.LOBBY_V };
  const markerScale = (z) => clamp(Math.pow(z / 2.2, 0.8), 0.3, 1);
  // banners keep their s05 size up to the lobby close-up and shrink with the lobby ring when the camera
  // rises or pulls back (s06/s07), so the pole always stays inside the ring
  const bannerScale = (z) => clamp(Math.pow(z / 2.2, 1.1), 0.25, 1);

  // ---- geometry ----
  function smoothPath(pts) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }
  // arc-length sampler with cumulative lengths (product units)
  function samplerC(d, per) {
    const R = Match.sampler(d, per || 48);
    const cum = [0];
    for (let k = 1; k < R.pts.length; k++) cum.push(cum[k - 1] + Math.hypot(R.pts[k][0] - R.pts[k - 1][0], R.pts[k][1] - R.pts[k - 1][1]));
    R.cum = cum;
    return R;
  }
  // screen polyline of the first fraction f of a sampled path
  function partialD(F, R, f) {
    const L = f * R.len; let d = '';
    for (let k = 0; k < R.pts.length; k++) {
      if (R.cum[k] > L) break;
      const q = F.toScreen(R.pts[k][0], R.pts[k][1]);
      d += (d ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
    }
    const t = R.at(f), q = F.toScreen(t.x, t.y);
    d += (d ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
    return { d, tip: q, a: t.a };
  }

  // ---- base: pre hook (camera, conduit flow) registered BEFORE the world, then the world.
  //      o: T0 (film start), cam(lt) -> {x, y, zoom}, flow(lt) -> conduit flow time (default: s04's
  //      phase, T0 - 12 + lt), labels (film map labels, created hidden: fade K.labels in yourself) ----
  function kBase(ctx, o) {
    ctx.css(`[data-scene="${ctx.id}"] .k-full { position:absolute; left:0; top:0; width:${W}px; height:${H}px; }
      [data-scene="${ctx.id}"] .k-bg { position:absolute; inset:0; background:${C.bg}; }
      [data-scene="${ctx.id}"] .k-mono { position:absolute; font: 500 20px/20px var(--mono); letter-spacing:.12em; text-transform:uppercase; white-space:pre; }
      [data-scene="${ctx.id}"] .k-slug { position:absolute; left:120px; top:990px; font: 500 20px/20px var(--mono); letter-spacing:.12em; color:${C.muted3}; text-transform:uppercase; white-space:pre; }`);
    const pre = [];
    const K = { F: null, pre, cam: null };
    ctx.onFrame((lt) => {
      if (!K.F) return;
      const c = o.cam(lt); K.cam = c;
      const st = K.F.T.state; st.cx = (c.x + MARGIN) * S; st.cy = (c.y + MARGIN) * S; st.zoom = c.zoom;
      K.F.flow.time = flowAt(lt);                // conduit flow continues s04's phase (s04 starts at film 12.0)
      for (const f of pre) f(lt, c);
    });
    const flowAt = o.flow || ((lt) => o.T0 - 12 + lt);
    ctx.el('div', 'k-bg', ctx.root);
    K.wrap = ctx.el('div', 'k-full', ctx.root);
    const c0 = o.cam(0); K.cam = c0;
    const F = Floodgate.world(ctx, { scale: S, margin: MARGIN, film: true, labels: !!o.labels, parent: K.wrap, terrain: { res: 2 },
      state: { cx: (c0.x + MARGIN) * S, cy: (c0.y + MARGIN) * S, zoom: c0.zoom } });
    F.progress.v = 0;                            // the round has not started: no objective progress
    [...F.el.vega, F.el.ghost, F.el.cone, ...Object.values(F.el.tokens)].forEach((e) => e.setAttribute('opacity', '0'));
    K.labels = Object.values(F.el.labels || {});
    K.labels.forEach((e) => e.setAttribute('opacity', '0'));
    F.flow.time = flowAt(0);
    K.F = F;
    K.wpt = (p) => [(p[0] + MARGIN) * S, (p[1] + MARGIN) * S];
    return K;
  }

  // ---- focus falloff: the terrain darkens away from the lobby so the ring and markers read
  //      (one radial gradient, redrawn only when its centre or strength changes) ----
  function kFocus(ctx) {
    const { canvas, g } = ctx.canvas({ className: 'k-focus' });
    let last = '';
    function draw(x, y, a) {
      const key = a <= 0.002 ? '0' : `${x.toFixed(1)},${y.toFixed(1)},${a.toFixed(3)}`;
      if (key === last) return;
      last = key;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      if (key === '0') return;
      const gr = g.createRadialGradient(x, y, 250, x, y, 1050);
      gr.addColorStop(0, 'rgba(11,12,14,0)');
      gr.addColorStop(0.42, `rgba(11,12,14,${(a * 0.6).toFixed(3)})`);
      gr.addColorStop(1, `rgba(11,12,14,${a.toFixed(3)})`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    return { canvas, draw };
  }
  const FOCUS_A = 0.55;                                              // focus strength in the lobbies
  const POOL = { r: 300, dive: 0.85, lobby: 0.55 };                  // light pool on the summit (world radius, strengths)

  // ---- HUD: register corners + edge ticks (Brand.hud inset 72) and the slug inside title-safe ----
  function kHud(ctx) {
    const h = B.hud(ctx, { inset: 72, tc: false, drawIn: false, slug: '', ticks: true });
    const slug = ctx.el('div', 'k-slug', ctx.root, SLUG);
    return { hud: h, slug, ticks: h.ticks };
  }

  // ---- THE NODE (replica of comp/lib/node.js, plus a variable ring radius and JK's initials disc).
  //      o.pulses: film times, or [time, duration] to end a pulse before a cut that does not carry it ----
  function kNode(ctx, parent, o) {
    o = Object.assign({ pulses: [], label: 'JK' }, o);
    const id = ctx.id + '-knode';
    const defs = ctx.svg('defs', {}, parent);
    const rg = ctx.svg('radialGradient', { id: id + '-glow' }, defs);
    ctx.svg('stop', { offset: '0%', 'stop-color': C.amberLight, 'stop-opacity': 1 }, rg);
    ctx.svg('stop', { offset: '45%', 'stop-color': C.amber, 'stop-opacity': 0.35 }, rg);
    ctx.svg('stop', { offset: '100%', 'stop-color': C.amber, 'stop-opacity': 0 }, rg);
    const g = ctx.svg('g', { class: 'node-mark' }, parent);
    const glow = ctx.svg('circle', { r: 60, fill: `url(#${id}-glow)`, opacity: 0.35 }, g);
    const pulse = ctx.svg('circle', { r: 12, fill: 'none', stroke: C.amberLight, 'stroke-width': 1.5, opacity: 0 }, g);
    const ring = ctx.svg('circle', { r: 12, fill: 'rgba(11,12,14,.55)', stroke: C.amber, 'stroke-width': 1.5 }, g);
    const dg = ctx.svg('g', { style: 'display:none' }, g);
    ctx.svg('circle', { r: 22, fill: C.amber }, dg);
    const dtx = ctx.svg('text', { y: 7, 'text-anchor': 'middle', fill: '#1b140a', style: 'font: 600 20px var(--mono); letter-spacing: .04em', text: o.label }, dg);
    const core = ctx.svg('circle', { r: 6, fill: C.amberLight }, g);
    // p.rr ring radius; p.gr glow radius (0 = follows the ring); p.ts initials scale (match tokens: 0.75)
    const p = { x: 0, y: 0, s: 1, a: 1, glow: 0.35, rr: 12, gr: 0, disc: 0, core: 1, txt: 1, ts: 1 };
    const steps = [];
    function draw(lt) {
      let st = 0;
      for (const t0 of steps) { const u = (lt - t0) / 0.5; if (u >= 0 && u <= 1) st = Math.max(st, u < 0.3 ? u / 0.3 : 1 - (u - 0.3) / 0.7); }
      const sc = p.s * (1 + 0.25 * st);
      g.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${sc.toFixed(4)})`);
      g.setAttribute('opacity', String(clamp(p.a, 0, 1)));
      glow.setAttribute('opacity', String(Math.max(0, p.glow)));
      glow.setAttribute('r', (p.gr > 0 ? p.gr : 60 + 2 * (p.rr - 12)).toFixed(2));
      ring.setAttribute('r', p.rr.toFixed(2));
      core.setAttribute('opacity', String(clamp(p.core, 0, 1)));
      if (p.disc > 0.001) {
        dg.style.display = ''; dg.setAttribute('transform', `scale(${p.disc.toFixed(4)})`); dtx.setAttribute('opacity', String(clamp(p.txt, 0, 1)));
        dtx.setAttribute('transform', p.ts === 1 ? '' : `scale(${p.ts.toFixed(4)})`);
      }
      else dg.style.display = 'none';
      // pulse ring: film-time cadence (every 3 beats) so the rhythm is continuous across cuts
      const ft = o.T0 + lt;
      let u = -1;
      for (const q of o.pulses) { const t0 = Array.isArray(q) ? q[0] : q, v = (ft - t0) / (Array.isArray(q) ? q[1] : 1.5); if (v >= 0 && v <= 1) u = v; }
      if (u < 0) { pulse.setAttribute('opacity', '0'); return; }
      const e = 1 - Math.pow(1 - u, 2);
      pulse.setAttribute('r', (p.rr * (1 + 1.2 * e)).toFixed(2));
      pulse.setAttribute('opacity', (0.6 * (1 - u)).toFixed(3));
    }
    return { g, p, draw, step(at) { steps.push(at); } };
  }
  // film-time pulse list for a scene window [t0, t1]: every 1.5 s from phase 0, plus one before t0
  const nodePulses = (t0, t1) => { const out = []; for (let t = Math.floor(t0 / NODE_PULSE_EVERY) * NODE_PULSE_EVERY; t <= t1 + 1e-6; t += NODE_PULSE_EVERY) out.push(+t.toFixed(3)); return out; };

  // ---- banners: Atlas (amber, diamond) / Vega (red-orange, ring). Rise up from the summit, sway on twos ----
  function kBanner(ctx, parent, side, T0) {
    const { L, w, h } = BANNER;
    const col = side === 'vega' ? C.rival : C.amber, deep = side === 'vega' ? C.rivalDeep : C.amberDeep;
    const g = ctx.svg('g', { style: 'display:none' }, parent);
    const cid = `${ctx.id}-kbn-${side}`;
    const defs = ctx.svg('defs', {}, g);
    const cp = ctx.svg('clipPath', { id: cid }, defs);
    const cr = ctx.svg('rect', { x: -14, y: 0, width: w + 40, height: 0 }, cp);
    const inner = ctx.svg('g', { 'clip-path': `url(#${cid})` }, g);
    ctx.svg('circle', { cx: 0, cy: 0, r: 3, fill: C.bone, opacity: 0.8 }, inner);
    ctx.svg('line', { x1: 0, y1: 0, x2: 0, y2: -L, stroke: C.bone, 'stroke-width': 2.5, 'stroke-linecap': 'round' }, inner);
    ctx.svg('circle', { cx: 0, cy: -L - 4, r: 4, fill: C.bone }, inner);
    const cloth = ctx.svg('path', { fill: col }, inner);
    const shade = ctx.svg('path', { fill: deep, 'fill-opacity': 0.42 }, inner);
    const em = ctx.svg('g', {}, inner);
    if (side === 'vega') ctx.svg('circle', { r: w * 0.2, fill: 'none', stroke: C.bg, 'stroke-width': w * 0.08 }, em);
    else ctx.svg('rect', { x: -w * 0.14, y: -w * 0.14, width: w * 0.28, height: w * 0.28, fill: C.bg, transform: 'rotate(45)' }, em);
    const p = { rise: 0, cloth: 0, a: 1, s: 1 };
    const ph = side === 'vega' ? 1.9 : 0;
    function draw(x, y, lt) {
      if (p.rise <= 0.001 || p.a <= 0.001) { g.style.display = 'none'; return; }
      g.style.display = '';
      const tq = Math.floor((T0 + lt) * FPS / 2 + 1e-6) * 2 / FPS;      // on twos, film time (continuous across cuts)
      const ang = 1.5 * Math.sin(2 * Math.PI * tq / 2.6 + ph);
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(3)}) scale(${p.s.toFixed(4)})`);
      g.setAttribute('opacity', String(clamp(p.a, 0, 1)));
      const top = (L + 12) * p.rise;
      cr.setAttribute('y', (-top).toFixed(1)); cr.setAttribute('height', (top + 6).toFixed(1));
      const ch = h * p.cloth, x0 = 1.5, y0 = -L + 3;
      if (ch < 1) { cloth.setAttribute('d', ''); shade.setAttribute('d', ''); em.setAttribute('opacity', '0'); return; }
      const wv = (k) => 2.2 * Math.sin(2 * Math.PI * tq / 1.7 + k * 1.3 + ph);
      const notch = 0.2 * ch;
      cloth.setAttribute('d', `M${x0} ${y0} L${(x0 + w).toFixed(1)} ${(y0 + wv(0) * 0.3).toFixed(1)} L${(x0 + w + wv(1) * 0.4).toFixed(1)} ${(y0 + ch + wv(1)).toFixed(1)} L${(x0 + w / 2).toFixed(1)} ${(y0 + ch - notch + wv(2) * 0.6).toFixed(1)} L${x0} ${(y0 + ch).toFixed(1)}Z`);
      const fx = x0 + w * (0.58 + 0.05 * Math.sin(2 * Math.PI * tq / 1.7 + ph));
      shade.setAttribute('d', `M${fx.toFixed(1)} ${y0} L${(fx + w * 0.16).toFixed(1)} ${y0} L${(fx + w * 0.12).toFixed(1)} ${(y0 + ch - notch * 0.5).toFixed(1)} L${fx.toFixed(1)} ${(y0 + ch - notch * 0.3).toFixed(1)}Z`);
      em.setAttribute('transform', `translate(${(x0 + w / 2).toFixed(1)} ${(y0 + h * 0.36 + wv(1) * 0.3).toFixed(1)})`);
      em.setAttribute('opacity', String(clamp((p.cloth - 0.55) / 0.3, 0, 1)));
    }
    // rise: the pole climbs out of the summit, the cloth unrolls from the pole top 3 f later (14 f expo.out)
    function rise(at) {
      ctx.tl.fromTo(p, { rise: 0 }, { rise: 1, duration: 14 / FPS, ease: 'expo.out', immediateRender: false }, at);
      ctx.tl.fromTo(p, { cloth: 0 }, { cloth: 1, duration: 14 / FPS, ease: 'expo.out', immediateRender: false }, at + 3 / FPS);
    }
    return { g, p, draw, rise };
  }

  // ---- dashed route in screen space (3 px, 10/8 dash anchored to the ground), runner + chevron ----
  function kRoute(ctx, parent, d, col) {
    const R = samplerC(d, 48);
    const g = ctx.svg('g', { style: 'display:none' }, parent);
    const line = ctx.svg('path', { fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    const runner = ctx.svg('circle', { r: 4.5, fill: col }, g);
    const arrow = ctx.svg('path', { d: 'M-11 -7.5 L0 0 L-11 7.5', fill: 'none', stroke: col, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    const p = { f: 0, op: 1, arrow: 0 };
    function draw(F, zoom) {
      if (p.f <= 0.001 || p.op <= 0.001) { g.style.display = 'none'; return; }
      g.style.display = '';
      g.setAttribute('opacity', String(clamp(p.op, 0, 1)));
      const k = zoom / 0.8;
      const pd = partialD(F, R, Math.min(1, p.f));
      line.setAttribute('d', pd.d);
      line.setAttribute('stroke-dasharray', `${(10 * k).toFixed(2)} ${(8 * k).toFixed(2)}`);
      const showRunner = p.arrow <= 0.001;
      runner.style.display = showRunner ? '' : 'none';
      runner.setAttribute('cx', pd.tip[0].toFixed(1)); runner.setAttribute('cy', pd.tip[1].toFixed(1));
      arrow.style.display = showRunner ? 'none' : '';
      arrow.setAttribute('transform', `translate(${pd.tip[0].toFixed(1)} ${pd.tip[1].toFixed(1)}) rotate(${pd.a.toFixed(2)}) scale(${p.arrow.toFixed(3)})`);
    }
    return { g, p, draw, R };
  }

  // ---- the summit contour (marching squares on the shared height function) ----
  function kLoop(F, apex, level) {
    const hW = (x, y) => F.T.height((x + MARGIN) * S, (y + MARGIN) * S);
    const half = 170, cell = 2, n = Math.round(2 * half / cell) + 1, x0 = apex[0] - half, y0 = apex[1] - half;
    const f = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) f[j * n + i] = hW(x0 + i * cell, y0 + j * cell);
    const v = level, segs = [];
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
      const a = f[j * n + i], b = f[j * n + i + 1], c = f[(j + 1) * n + i + 1], d = f[(j + 1) * n + i];
      const pp = [];
      if ((a >= v) !== (b >= v)) pp.push([x0 + (i + (v - a) / (b - a)) * cell, y0 + j * cell]);
      if ((b >= v) !== (c >= v)) pp.push([x0 + (i + 1) * cell, y0 + (j + (v - b) / (c - b)) * cell]);
      if ((d >= v) !== (c >= v)) pp.push([x0 + (i + (v - d) / (c - d)) * cell, y0 + (j + 1) * cell]);
      if ((a >= v) !== (d >= v)) pp.push([x0 + i * cell, y0 + (j + (v - a) / (d - a)) * cell]);
      if (pp.length === 2) segs.push(pp);
      else if (pp.length === 4) { segs.push([pp[0], pp[1]]); segs.push([pp[2], pp[3]]); }
    }
    const key = (q) => q[0].toFixed(3) + ',' + q[1].toFixed(3);
    const adj = new Map();
    segs.forEach((s, k) => [0, 1].forEach((e) => { const kk = key(s[e]); if (!adj.has(kk)) adj.set(kk, []); adj.get(kk).push([k, e]); }));
    const used = new Uint8Array(segs.length);
    const inside = (pts, x, y) => { let cc = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) cc = !cc; } return cc; };
    let best = null;
    for (let k = 0; k < segs.length; k++) {
      if (used[k]) continue; used[k] = 1;
      const pts = [segs[k][0], segs[k][1]]; let closed = false;
      for (let guard = 0; guard < 200000; guard++) {
        const nb = (adj.get(key(pts[pts.length - 1])) || []).find(([kk]) => !used[kk]);
        if (!nb) break; used[nb[0]] = 1; const nx = segs[nb[0]][1 - nb[1]];
        if (key(nx) === key(pts[0])) { closed = true; break; }
        pts.push(nx);
      }
      if (closed && inside(pts, apex[0], apex[1]) && (!best || pts.length > best.length)) best = pts;
    }
    if (!best) best = Array.from({ length: 180 }, (_, i) => [apex[0] + RING_R * Math.cos(i / 180 * 2 * Math.PI), apex[1] + RING_R * Math.sin(i / 180 * 2 * Math.PI)]);
    // resample to 240 points by arc length
    const cum = [0]; for (let i = 1; i <= best.length; i++) { const a = best[i - 1], b = best[i % best.length]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const tot = cum[cum.length - 1], N = 240, out = [];
    let j = 0;
    for (let i = 0; i < N; i++) {
      const L = i / N * tot; while (cum[j + 1] < L) j++;
      const a = best[j], b = best[(j + 1) % best.length], u = (L - cum[j]) / ((cum[j + 1] - cum[j]) || 1);
      out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]);
    }
    return out;
  }

  // ---- lobby: contour -> ring morph, dashed slots, ring pulses (side-agnostic: the mirror build) ----
  function kLobby(ctx, F, parent, side) {
    const apex = APEX[side], col = side === 'vega' ? C.rival : C.amber;
    let loop = kLoop(F, apex, CONTOUR_LEVEL);
    // target angle per contour point: its polar angle around the apex, made monotonic (running max of the
    // unwrapped angle) and lightly smoothed, so folds of the terrain line shrink into the ring instead of
    // crossing themselves (pure radial projection zigzags where the contour is not star-shaped)
    const ang = (q) => Math.atan2(q[1] - apex[1], q[0] - apex[0]);
    const unwrap = (pts) => { const a = [ang(pts[0])]; for (let i = 1; i < pts.length; i++) { let d = ang(pts[i]) - ang(pts[i - 1]); while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; a.push(a[i - 1] + d); } return a; };
    let ua = unwrap(loop);
    if (ua[ua.length - 1] < ua[0]) { loop = loop.slice().reverse(); ua = unwrap(loop); }
    const env = []; let mx = -Infinity;
    for (let i = 0; i < ua.length; i++) { mx = Math.max(mx, ua[i]); env.push(Math.min(mx, ua[0] + 2 * Math.PI * (i + 1) / ua.length + 1.0)); }
    const span = (env[env.length - 1] - env[0]) || 1, nrm = env.map((v, i) => env[0] + (v - env[0]) * (2 * Math.PI * (env.length - 1) / env.length) / span);
    const NL = nrm.length, sm = nrm.map((v, i) => { let s = 0; for (let k = -4; k <= 4; k++) { const j = i + k; s += j < 0 ? nrm[j + NL] - 2 * Math.PI : j >= NL ? nrm[j - NL] + 2 * Math.PI : nrm[j]; } return s / 9; });
    const tgt = sm.map((a) => [apex[0] + Math.cos(a) * RING_R, apex[1] + Math.sin(a) * RING_R]);
    const g = ctx.svg('g', {}, parent);
    const pulseG = ctx.svg('g', {}, g);
    const ringP = ctx.svg('path', { fill: 'none', stroke: col, 'stroke-linejoin': 'round', style: 'display:none' }, g);
    const ringC = ctx.svg('circle', { fill: 'none', stroke: col, style: 'display:none' }, g);
    const slots = SLOT_DEG[side].map((deg) => {
      const r = deg * Math.PI / 180;
      const P = [apex[0] + RING_R * Math.cos(r), apex[1] + RING_R * Math.sin(r)];
      const el = ctx.svg('circle', { r: 22, fill: 'none', stroke: col, 'stroke-opacity': 0.5, 'stroke-width': 1.5, 'stroke-dasharray': '3 4', style: 'display:none' }, g);
      return { deg, P, el, p: { a: 0, s: 0.6 } };
    });
    const pulses = [];
    const p = { m: 0, a: 0, w: 1.5 };
    function addPulse(at) {
      const el = ctx.svg('circle', { fill: 'none', stroke: col, 'stroke-width': 1.5, opacity: 0 }, pulseG);
      pulses.push({ at, el });
    }
    let geo = null;
    function draw(lt, zoom) {
      const c = F.toScreen(apex[0], apex[1]), Rpx = RING_R * S * zoom;
      geo = { c, Rpx };
      const ms = markerScale(zoom);
      if (p.a <= 0.001) { ringP.style.display = 'none'; ringC.style.display = 'none'; }
      else if (p.m >= 0.999) {
        ringP.style.display = 'none'; ringC.style.display = '';
        ringC.setAttribute('cx', c[0].toFixed(1)); ringC.setAttribute('cy', c[1].toFixed(1)); ringC.setAttribute('r', Rpx.toFixed(2));
        ringC.setAttribute('stroke-width', p.w.toFixed(2)); ringC.setAttribute('opacity', p.a.toFixed(3));
      } else {
        ringC.style.display = 'none'; ringP.style.display = '';
        const m = p.m; let d = '';
        for (let i = 0; i < loop.length; i++) {
          const q = F.toScreen(lerp(loop[i][0], tgt[i][0], m), lerp(loop[i][1], tgt[i][1], m));
          d += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
        }
        ringP.setAttribute('d', d + 'Z'); ringP.setAttribute('stroke-width', p.w.toFixed(2)); ringP.setAttribute('opacity', p.a.toFixed(3));
      }
      for (const s of slots) {
        if (s.p.a <= 0.001) { s.el.style.display = 'none'; continue; }
        const q = F.toScreen(s.P[0], s.P[1]);
        s.el.style.display = '';
        s.el.setAttribute('transform', `translate(${q[0].toFixed(1)} ${q[1].toFixed(1)}) scale(${(s.p.s * ms).toFixed(4)})`);
        s.el.setAttribute('opacity', s.p.a.toFixed(3));
      }
      for (const pu of pulses) {
        const u = (lt - pu.at) / 1.5;
        if (u < 0 || u > 1) { pu.el.setAttribute('opacity', '0'); continue; }
        const e = 1 - Math.pow(1 - u, 2.2);
        pu.el.setAttribute('cx', c[0].toFixed(1)); pu.el.setAttribute('cy', c[1].toFixed(1));
        pu.el.setAttribute('r', (Rpx * (1 + 0.32 * e)).toFixed(2));
        pu.el.setAttribute('opacity', (0.6 * (1 - u) * p.a).toFixed(3));
      }
    }
    return { g, p, slots, draw, addPulse, apex, geo: () => geo, slotScreen: (i) => F.toScreen(slots[i].P[0], slots[i].P[1]) };
  }

  // ---- team markers: amber initials discs (Atlas) / red-orange triangles (Vega), with a snap pulse ----
  function kMarker(ctx, parent, side, label) {
    const col = side === 'vega' ? C.rival : C.amber;
    const g = ctx.svg('g', { style: 'display:none' }, parent);
    const pr = ctx.svg('circle', { r: 22, fill: 'none', stroke: side === 'vega' ? C.rivalLight : C.amberLight, 'stroke-width': 1.5, opacity: 0 }, g);
    const body = ctx.svg('g', {}, g);
    let tx = null;
    if (side === 'vega') { const s = 17.3; ctx.svg('path', { d: `M0 ${-s} L${(s * 0.92).toFixed(2)} ${(s * 0.62).toFixed(2)} L${(-s * 0.92).toFixed(2)} ${(s * 0.62).toFixed(2)}Z`, fill: col }, body); }
    else { ctx.svg('circle', { r: 22, fill: col }, body); tx = ctx.svg('text', { y: 7, 'text-anchor': 'middle', fill: '#1b140a', style: 'font: 600 20px var(--mono); letter-spacing: .04em', text: label }, body); }
    const p = { x: 0, y: 0, s: 1, pop: 1, a: 0, txt: 1, ts: 1, pulseAt: -99 };   // ts: initials scale
    function draw(lt) {
      if (p.a <= 0.001) { g.style.display = 'none'; return; }
      g.style.display = '';
      g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.s.toFixed(4)})`);
      g.setAttribute('opacity', String(clamp(p.a, 0, 1)));
      body.setAttribute('transform', `scale(${p.pop.toFixed(4)})`);
      if (tx) { tx.setAttribute('opacity', String(clamp(p.txt, 0, 1))); tx.setAttribute('transform', p.ts === 1 ? '' : `scale(${p.ts.toFixed(4)})`); }
      const u = (lt - p.pulseAt) / 1.0;
      if (u < 0 || u > 1) { pr.setAttribute('opacity', '0'); return; }
      const e = 1 - Math.pow(1 - u, 2);
      pr.setAttribute('r', (22 * (1 + 1.2 * e)).toFixed(2));
      pr.setAttribute('opacity', (0.6 * (1 - u)).toFixed(3));
    }
    return { g, p, draw };
  }
  // 2 f overshoot snap: scale 1 -> 1.15 -> 1 (pure function of time)
  const snapPop = (lt, t0) => { const f = (lt - t0) * FPS; if (f < 0) return 1; if (f < 2) return 1 + 0.15 * (f / 2); if (f < 5) return 1.15 - 0.15 * ez('power2.out')((f - 2) / 3); return 1; };

  // ---- planned matchmaking: bone dashed line (1.5 px, 4/6 ground-anchored), dots stepping at the head ----
  function kMM(ctx, parent, htmlParent) {
    const R = samplerC(smoothPath(MM_PTS), 32);
    const g = ctx.svg('g', { style: 'display:none' }, parent);
    const line = ctx.svg('path', { fill: 'none', stroke: C.bone, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g);
    const dots = [0, 1, 2].map(() => ctx.svg('circle', { r: 3.5, fill: C.bone, opacity: 0 }, g));
    const lab = ctx.el('div', 'k-mono', htmlParent, '');
    lab.style.color = C.bone; lab.style.opacity = '0';
    const p = { f: 0, op: 1, dots: 0, dA: 1, lab: 0 };
    function draw(F, zoom) {
      if (p.f <= 0.001 || p.op <= 0.001) { g.style.display = 'none'; lab.style.opacity = '0'; return; }
      g.style.display = '';
      const pd = partialD(F, R, Math.min(1, p.f));
      const k = zoom / 1.6;
      line.setAttribute('d', pd.d);
      line.setAttribute('stroke-dasharray', `${(4 * k).toFixed(2)} ${(6 * k).toFixed(2)}`);
      line.setAttribute('opacity', p.op.toFixed(3));
      const a = pd.a * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a);
      dots.forEach((dt, i) => {
        dt.setAttribute('cx', (pd.tip[0] + ux * (16 + 14 * i)).toFixed(1)); dt.setAttribute('cy', (pd.tip[1] + uy * (16 + 14 * i)).toFixed(1));
        dt.setAttribute('opacity', (p.dots > i + 0.5 ? clamp(p.dA, 0, 1) * Math.min(1, p.op + 0.4) : 0).toFixed(3));
      });
      lab.style.left = (pd.tip[0] + ux * 16 - 4).toFixed(1) + 'px';
      lab.style.top = (pd.tip[1] + uy * 16 - 44).toFixed(1) + 'px';
      lab.style.opacity = clamp(p.lab, 0, 1).toFixed(3);
    }
    return { g, p, draw, R, lab };
  }

  // ---- headline line: masked words rise (20 f expo.out, 3 f stagger), weight settles 560 -> 620 ----
  function kLine(ctx, o) {
    o = Object.assign({ size: 120, color: C.ink, parent: ctx.root }, o);
    const m = ctx.el('div', 'k-hl', o.parent);
    Object.assign(m.style, { position: 'absolute', left: (o.x - 0.08 * o.size).toFixed(1) + 'px', top: '0px', overflow: 'hidden', padding: '0 .08em .16em', whiteSpace: 'nowrap',
      font: `560 ${o.size}px/1 var(--display)`, letterSpacing: '-0.055em', color: o.color });
    const words = o.text.split(' ').map((w, i) => { if (i) m.appendChild(document.createTextNode(' ')); const s = ctx.el('span', '', m, w); s.style.display = 'inline-block'; return s; });
    const probe = ctx.el('span', '', m); Object.assign(probe.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
    const off = probe.getBoundingClientRect().top - m.getBoundingClientRect().top; m.removeChild(probe);
    m.style.top = (o.base - off).toFixed(1) + 'px';
    const wt = { w: 560 };
    ctx.tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 20 / FPS, ease: 'expo.out', stagger: 3 / FPS }, o.at);
    ctx.tl.fromTo(wt, { w: 560 }, { w: 620, duration: 24 / FPS, ease: 'power2.out', immediateRender: false }, o.at);
    ctx.onFrame(() => { const s = String(Math.round(wt.w)); if (m.style.fontWeight !== s) m.style.fontWeight = s; });
    if (o.out != null) ctx.tl.to(words, { yPercent: -118, duration: 9 / FPS, ease: 'power2.in', stagger: 1 / FPS }, o.out);
    return { el: m, words, landed: o.at + 20 / FPS + 3 / FPS * (words.length - 1) };
  }

  // ---- chapter label: '01 —— FORM YOUR TEAM' (mono 24, number amber, rule drawn). Scrambles in left to
  //      right and out right to left (deterministic: Match.scramble, a pure function of time) ----
  function kChapter(ctx, o) {
    const el = ctx.el('div', 'k-chap', o.parent || ctx.root, '<span class="n"></span><i class="r"></i><span class="t"></span>');
    Object.assign(el.style, { position: 'absolute', left: o.x + 'px', top: o.y + 'px', display: 'flex', alignItems: 'center', gap: '16px', font: '500 24px/24px var(--mono)', letterSpacing: '.12em', textTransform: 'uppercase', whiteSpace: 'pre', color: C.ink });
    const n = el.querySelector('.n'), r = el.querySelector('.r'), t = el.querySelector('.t');
    Object.assign(n.style, { color: C.amber, fontWeight: '600', minWidth: '2.3ch' });
    Object.assign(r.style, { display: 'block', width: '44px', height: '2px', background: C.amber, opacity: '0.75', transformOrigin: '0 50%' });
    ctx.tl.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'expo.out' }, o.at + 0.05);
    if (o.out != null) ctx.tl.to(r, { scaleX: 0, duration: 0.25, ease: 'power2.in' }, o.out + 0.05);
    ctx.onFrame((lt) => {
      let un = seg(lt, o.at, o.at + 0.25), ut = seg(lt, o.at + 0.08, o.at + 0.5);
      if (o.out != null) { ut = Math.min(ut, 1 - seg(lt, o.out, o.out + 0.3)); un = Math.min(un, 1 - seg(lt, o.out + 0.15, o.out + 0.3)); }
      const sn = Match.scramble(o.num, un, ctx.id + '-chn', 'in'), st = Match.scramble(o.title, ut, ctx.id + '-cht', 'in');
      if (n.textContent !== sn) n.textContent = sn;
      if (t.textContent !== st) t.textContent = st;
    });
    return el;
  }
  // ======================================== END KIT ========================================

  // 'PLANNED / MATCHMAKING' on the planned-matchmaking line (s06 + s07, outside the shared kit): mono 24 px,
  // bone at full strength with a dark halo, two lines, pinned above the line head; drawn even before the
  // line starts (f = 0: at its first point). Call the returned fn after mm.draw with the label opacity.
  function kMMLabel(mm, F) {
    const lab = mm.lab;
    lab.innerHTML = 'PLANNED<br>MATCHMAKING';
    Object.assign(lab.style, { font: '600 24px/28px var(--mono)', letterSpacing: '.12em', color: C.bone,
      textShadow: '0 0 12px rgba(11,12,14,.95), 0 0 4px rgba(11,12,14,.9), 0 0 2px rgba(11,12,14,.9)' });
    return (v) => {
      if (v <= 0.001) { if (lab.style.opacity !== '0') lab.style.opacity = '0'; return; }
      const pd = partialD(F, mm.R, clamp(mm.p.f, 1e-4, 1)), a = pd.a * Math.PI / 180;
      lab.style.left = (pd.tip[0] + Math.cos(a) * 16 - 4).toFixed(1) + 'px';
      lab.style.top = (pd.tip[1] + Math.sin(a) * 16 - 78).toFixed(1) + 'px';
      lab.style.opacity = v >= 0.999 ? '1' : v.toFixed(3);
    };
  }

  Film.scene({
    id: ID,
    duration: 6,
    build(ctx) {
      const tl = ctx.tl, root = ctx.root, T0 = 28;
      ctx.css(`
        [data-scene="${ID}"] .s07-team { position:absolute; left:0; top:0; font: 600 64px/1 var(--display); letter-spacing:-0.02em; color:${C.rival}; white-space:pre; transform-origin: 50% 70%; }
        [data-scene="${ID}"] .s07-fly { position:absolute; left:0; top:0; font-family: var(--mono); font-weight:500; line-height:normal; text-transform:uppercase; white-space:pre; text-shadow: 0 0 10px rgba(11,12,14,.9); }
        [data-scene="${ID}"] .s07-ui .fg-roster, [data-scene="${ID}"] .s07-ui .fg-channel, [data-scene="${ID}"] .s07-ui .fg-objective, [data-scene="${ID}"] .s07-ui .fg-signal { display:none; }
      `);

      // ---- camera ----
      // 28.0-28.75 WHIP along the planned-matchmaking line: LOBBY_A2 (z 1.4) -> mid-river (z 0.9) -> LOBBY_V
      // (Vega apex at (1340,560), z 2.2), expo.inOut; hold with a slow drift; 32.5-33.0 pull back to OVERVIEW_WIDE
      const A2 = LOBBY_A2, V = LOBBY.vega, MID = [905, 452];
      const CTRL = [2 * MID[0] - 0.5 * (A2.x + V.x), 2 * MID[1] - 0.5 * (A2.y + V.y)];
      const DIP = 0.5 * (Math.log(A2.zoom) + Math.log(V.zoom)) - Math.log(0.9);
      const whip = (u) => {
        const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
        return { x: a * A2.x + b * CTRL[0] + c * V.x, y: a * A2.y + b * CTRL[1] + c * V.y, zoom: Math.exp(lerp(Math.log(A2.zoom), Math.log(V.zoom), u) - DIP * Math.sin(Math.PI * u)) };
      };
      // the whip inherits s06's rise: s06 ends power2.in (A23 -> LOBBY_A2 over 1 s, speed 2|A2 - A23| on the
      // cut), so the warp starts with that slope (the bezier leaves A2 within 2 deg of the rise direction),
      // then expo.inOut peaks on 28.4 and lands on LOBBY_V at 28.75
      const A23 = camAt(APEX.atlas, LOBBY_SCREEN, 2.3);
      const WHIP_C = 2 * Math.hypot(A2.x - A23.x, A2.y - A23.y) * 0.75 / (2 * Math.hypot(CTRL[0] - A2.x, CTRL[1] - A2.y));
      const whipS = (x) => ez('expo.inOut')(x) + WHIP_C * x * Math.pow(1 - x, 3);
      const V226 = camAt(APEX.vega, LOBBY_SCREEN, 2.26);
      const camFn = (lt) => {
        if (lt < 0.75) return whip(whipS(lt / 0.75));
        if (lt < 4.5) return camAt(APEX.vega, LOBBY_SCREEN, Math.exp(lerp(Math.log(2.2), Math.log(2.26), ez('sine.inOut')(seg(lt, 0.75, 4.5)))));
        return camLerp(V226, CAM.OVERVIEW_WIDE, ez('power3.inOut')(seg(lt, 4.5, 5.0)));
      };
      // conduit flow: continuous with s06 on 28.0, and on 34.0 in the dash phase s08 uses (tau = -6.5): the
      // fraction of a dash period is absorbed while the conduit is off screen (29.0-32.0)
      const DASH_T = 9 / 14, NAT = T0 - 12 + 6;
      const FLOW_FIX = -6.5 + Math.round((NAT + 6.5) / DASH_T) * DASH_T - NAT;
      const K = kBase(ctx, { T0, cam: camFn, labels: true, flow: (lt) => T0 - 12 + lt + FLOW_FIX * ez('sine.inOut')(seg(lt, 1.0, 4.0)) });
      const F = K.F;
      // map labels as s08 shows them at 08:32 (no CONTESTED, no LAST SEEN): they arrive with the pill
      if (F.el.labels.crossing.sub) F.el.labels.crossing.sub.textContent = '';
      const mapLabs = K.labels.filter((e) => e !== F.el.labels.lastSeen);
      tl.fromTo(mapLabs, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.inOut', immediateRender: false }, 5.5);

      // whip motion blur: 5 ghost copies of the terrain canvas along the velocity, only above 40 px/frame
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const og = off.getContext('2d'), tg = F.T.canvas.getContext('2d');
      const GH = [0.5, 0.3, 0.2, 0.12, 0.08];
      ctx.onFrame((lt) => {
        if (lt <= 0 || lt >= 0.75) return;
        const c1 = camFn(lt), c0 = camFn(Math.max(0, lt - 1 / FPS));
        const vx = (c1.x - c0.x) * c1.zoom * S, vy = (c1.y - c0.y) * c1.zoom * S;
        if (Math.hypot(vx, vy) <= 40) return;
        og.globalCompositeOperation = 'copy'; og.drawImage(F.T.canvas, 0, 0);
        tg.setTransform(1, 0, 0, 1, 0, 0);
        for (let k = 1; k <= 5; k++) { tg.globalAlpha = GH[k - 1]; tg.drawImage(off, vx * k / 5, vy * k / 5); }
        tg.globalAlpha = 1;
      });

      // ---- versus line: bank tints (one polygon per bank, the river closed to the domain corners) + hairline ----
      const RX = Floodgate.RIVER_EXT, X0 = -240, Y0 = -240, X1 = 1840, Y1 = 1240;
      const poly = (pts) => 'M' + pts.map((q) => q[0] + ' ' + q[1]).join(' L') + 'Z';
      const tint = ctx.svg('g', { opacity: 0 }, F.el.baseG);
      ctx.svg('path', { d: poly(RX.concat([[X0, RX[RX.length - 1][1]], [X0, Y0], [RX[0][0], Y0]])), fill: C.amber, 'fill-opacity': 0.06 }, tint);
      ctx.svg('path', { d: poly(RX.concat([[RX[RX.length - 1][0], Y1], [X1 + 400, Y1], [X1 + 400, RX[0][1]]])), fill: C.rival, 'fill-opacity': 0.05 }, tint);
      const hair = ctx.svg('path', { d: smoothPath(RX), fill: 'none', stroke: C.ink, 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke', opacity: 0 }, F.el.baseG);
      tl.fromTo(tint, { opacity: 0 }, { opacity: 1, duration: 4 / FPS, ease: 'power2.out', immediateRender: false }, 5.0);
      tl.to(tint, { opacity: 0, duration: 0.5, ease: 'power1.inOut' }, 5.5);
      tl.fromTo(hair, { opacity: 0 }, { opacity: 0.7, duration: 3 / FPS, ease: 'power2.out', immediateRender: false }, 5.0);
      tl.to(hair, { opacity: 0.22, duration: 0.25, ease: 'power2.inOut' }, 5.25);
      tl.to(hair, { opacity: 0, duration: 0.45, ease: 'power1.in' }, 5.5);
      // the live river: the same slow glints buildMatchScreen draws (s08 tau = lt - 6.5, so 34.0 matches)
      const offsetPoly = (pts, o2) => pts.map((q, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [q[0] - dy / l * o2, q[1] + dx / l * o2]; });
      const glints = [[0, '7 38', 15, 0.24], [-17, '5 52', 10, 0.16], [17, '9 34', 12, 0.16]].map(([o2, dash, speed, op]) => ({
        speed, el: ctx.svg('path', { d: smoothPath(o2 ? offsetPoly(RX, o2) : RX), fill: 'none', stroke: '#9fb0a2', 'stroke-opacity': op, 'stroke-width': 1.2, 'stroke-dasharray': dash, 'stroke-linecap': 'round' }, F.el.baseG) }));
      tl.fromTo(glints.map((q) => q.el), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.inOut' }, 5.4);
      ctx.onFrame((lt) => { const tau = lt - 12.5; for (const q of glints) q.el.setAttribute('stroke-dashoffset', (-tau * q.speed).toFixed(2)); });

      // ---- light: the Atlas pool hands over to Vega's summit; focus falloff follows the lobby ----
      const pA = K.wpt(APEX.atlas), pV = K.wpt(APEX.vega);
      const poolA = { x: pA[0], y: pA[1], r: POOL.r, a: POOL.lobby }, poolV = { x: pV[0], y: pV[1], r: POOL.r, a: 0 };
      F.T.spots.push(poolA, poolV);
      tl.to(poolA, { a: 0, duration: 0.5, ease: 'power1.in' }, 0.1);
      tl.to(poolV, { a: POOL.lobby, duration: 0.55, ease: 'power2.out' }, 0.45);
      tl.to(poolV, { a: 0, duration: 0.5, ease: 'power2.inOut' }, 4.5);
      const focus = kFocus(ctx);
      const foA = { a: 0.38 }, foV = { a: 0 };
      tl.to(foA, { a: 0, duration: 0.3, ease: 'power1.in' }, 0.05);
      tl.to(foV, { a: FOCUS_A, duration: 0.45, ease: 'power2.out' }, 0.5);
      tl.to(foV, { a: 0, duration: 0.5, ease: 'power2.inOut' }, 4.5);

      // ---- screen-space marks: both lobbies (mirror build), both banners, the line ----
      const ov = ctx.svg('svg', { class: 'brand-svg' });
      const htm = ctx.el('div', 'k-full', root);
      const lobA = kLobby(ctx, F, ov, 'atlas'); lobA.p.m = 1; lobA.p.a = 0.95; lobA.p.w = 2;
      const lobV = kLobby(ctx, F, ov, 'vega');
      const mm = kMM(ctx, ov, htm);
      const mmLabel = kMMLabel(mm, F);                   // 'PLANNED / MATCHMAKING' exactly as s06 leaves it
      mm.p.f = MM_HEAD_S06; mm.p.dots = 3; mm.p.lab = 1;
      const bA = kBanner(ctx, ov, 'atlas', T0); bA.p.rise = 1; bA.p.cloth = 1;
      const bV = kBanner(ctx, ov, 'vega', T0); bV.p.rise = 1; bV.p.cloth = 1;
      const nc = kMarker(ctx, ov, 'atlas', 'NC'), ek = kMarker(ctx, ov, 'atlas', 'EK');
      const vt = [0, 1, 2].map(() => kMarker(ctx, ov, 'vega', ''));
      // the 33.0 pulse completes inside this scene (s08's first pulse is 34.5), so 34.0 cuts clean
      const N = kNode(ctx, ov, { T0, pulses: nodePulses(27, 32).concat([[33.0, 0.95]]) });

      // the line draws ahead of the camera and ends on the Vega summit at 28.75; label and dots leave there
      // it keeps the speed it had at the cut (s06 draws it power1.in: 0.54 of the path per second at 28.0),
      // then accelerates with the whip and lands on the Vega ring at 28.7
      const V0 = 2 * MM_HEAD_S06 * 0.7 / (1 - MM_HEAD_S06);
      const headF = (lt) => { const x = seg(lt, 0, 0.7); return MM_HEAD_S06 + (1 - MM_HEAD_S06) * (V0 * x + (1 - V0) * ez('expo.inOut')(x)); };
      tl.to(mm.p, { dA: 0, lab: 0, duration: 0.15, ease: 'none' }, 0.75);
      tl.to(mm.p, { op: 0.45, duration: 0.5, ease: 'power1.inOut' }, 0.9);
      tl.to(mm.p, { op: 0, duration: 0.4, ease: 'power1.in' }, 4.5);

      // 28.75 the Vega summit contour becomes the same lobby ring (2 px red-orange)
      tl.fromTo(lobV.p, { m: 0 }, { m: 1, duration: 0.35, ease: 'power3.inOut', immediateRender: false }, 0.75);
      tl.fromTo(lobV.p, { a: 0 }, { a: 0.95, duration: 4 / FPS, ease: 'none', immediateRender: false }, 0.75);
      tl.fromTo(lobV.p, { w: 1.5 }, { w: 2, duration: 0.35, ease: 'power2.out', immediateRender: false }, 0.75);
      lobV.slots.forEach((s, i) => tl.fromTo(s.p, { a: 0, s: 0.6 }, { a: 1, s: 1, duration: 6 / FPS, ease: 'power3.out', immediateRender: false }, 0.9 + i * 2 / FPS));
      const STAMP = [1.0, 1.25, 1.5];
      lobV.slots.forEach((s, i) => tl.to(s.p, { a: 0, duration: 2 / FPS, ease: 'none' }, STAMP[i]));
      lobV.addPulse(1.75);
      vt.forEach((m, i) => { m.p.pulseAt = STAMP[i]; });
      const stampS = (lt, t0) => { const f = (lt - t0) * FPS; if (f < 0) return 0; if (f < 4) return 1.35 - 0.35 * ez('power2.out')(f / 4); return 1; };

      // VEGA stamps under the ring (baseline 840)
      const team = ctx.el('div', 's07-team', htm, 'VEGA');
      const tProbe = ctx.el('span', '', team); Object.assign(tProbe.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
      const teamBase = tProbe.getBoundingClientRect().top - team.getBoundingClientRect().top; team.removeChild(tProbe);
      const teamW = team.getBoundingClientRect().width;
      tl.fromTo(team, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 4 / FPS, ease: 'power2.out' }, 1.75);
      tl.to(team, { opacity: 0, duration: 0.25, ease: 'none' }, 4.25);

      // ---- type: 02 —— FIND YOUR OPPOSITION / 'The same challenge.' / 'Another approach.' (same positions as s06).
      //      Exits on 32.0 / 32.25 so the frame is clear before the pull-back (drift-only rule while type is up) ----
      kChapter(ctx, { num: '02', title: 'FIND YOUR OPPOSITION', x: 120, y: 150, at: 0.75, out: 4.25 });
      kLine(ctx, { text: 'The same challenge.', x: 120, base: 380, size: 120, color: C.ink, at: 0.75, out: 4.0 });
      kLine(ctx, { text: 'Another approach.', x: 120, base: 510, size: 120, color: C.amber, at: 1.25, out: 4.25 });

      // ---- the versus labels, then LANDING #2: they fly into the score pill and the topbar ----
      const uiL = ctx.el('div', 'k-full s07-ui', root);
      const U = Floodgate.ui(ctx, { parent: uiL, layout: 'film', clockRun: false, clockFrom: 512, progress: { v: 0 } });
      Match.flapClock(ctx, { el: U.clockEl, value: () => 512 });
      const sc = U.score, atl = sc.querySelector('.atlas'), veg = sc.querySelector('.vega');
      atl.innerHTML = '<span class="w">Atlas</span> <b class="sa">1</b>';
      veg.innerHTML = '<b class="sv">1</b> <span class="w">Vega</span>';
      const pillW = sc.offsetWidth;
      sc.style.left = (W / 2 - pillW / 2).toFixed(1) + 'px';
      const rectOf = (el) => { const r = el.getBoundingClientRect(), r0 = root.getBoundingClientRect(); return { x: r.left - r0.left, y: r.top - r0.top, w: r.width, h: r.height }; };
      const wA = atl.querySelector('.w'), wV = veg.querySelector('.w'), tMono = U.topbar.querySelector('.mono'), tStrong = U.topbar.querySelector('strong'), tDiv = U.topbar.querySelector('i');
      const RA = rectOf(wA), RV = rectOf(wV), RT = rectOf(tMono);
      [wA, wV, tMono].forEach((e) => { e.style.visibility = 'hidden'; });
      const pill = { u: 0 };
      tl.fromTo(pill, { u: 0 }, { u: 1, duration: 0.5, ease: 'power3.inOut', immediateRender: false }, 5.5);
      const topb = { u: 0 };
      tl.fromTo(topb, { u: 0 }, { u: 1, duration: 10 / FPS, ease: 'power3.out', immediateRender: false }, 5.55);

      const flyL = ctx.el('div', 'k-full', root);
      const fly = (text, col0, col1, size0, size1, ls0, ls1, at, disp) => {
        const el = ctx.el('div', 's07-fly', flyL, '');
        el.style.color = col0;
        // letters scramble, digits never do: 'TEAM CHALLENGE · 3 V 3' types on with its digits stable
        if (/\d/.test(text)) {
          const seed = ID + '-fly-' + text;
          ctx.onFrame((lt) => { const s = lt < at ? '' : Match.scramble(text, (lt - at) / 0.25, seed, 'in'); if (el.textContent !== s) el.textContent = s; });
        } else B.scrambleTo(tl, el, text, at, 0.25);
        const meas = (sz, ls) => { el.textContent = text; el.style.fontSize = sz + 'px'; el.style.letterSpacing = ls + 'em'; const r = el.getBoundingClientRect(); el.textContent = ''; return { w: r.width, h: r.height }; };
        const f = { el, col0, col1, size0, size1, ls0, ls1, m0: meas(size0, ls0), m1: meas(size1, ls1) };
        if (disp) {
          // the pill's own type (Manrope 600 26 px, sentence case): the mono bank label dissolves into it
          // at full speed mid-flight, and it docks pixel-exact on the pill word s08 shows on 34.0
          const d = ctx.el('div', 's07-fly', flyL, disp);
          Object.assign(d.style, { font: '600 26px/1 var(--display)', letterSpacing: 'normal', textTransform: 'none', color: col1, opacity: '0' });
          const r = d.getBoundingClientRect();
          f.d = d; f.dm = { w: r.width, h: r.height };
        }
        return f;
      };
      const fA = fly('ATLAS', C.amber, C.amber, 24, 20, 0.12, 0.12, 5.0, 'Atlas');
      const fV = fly('VEGA', C.rival, C.rival, 24, 20, 0.12, 0.12, 5.03, 'Vega');
      const fT = fly('TEAM CHALLENGE · 3 V 3', C.muted, C.muted2, 22, 20, 0.12, 0.1, 5.06);
      // start positions (top-left of the text box) and docked positions
      // ATLAS on the west bank, VEGA on the east bank, level with each other across the river and the gate
      fA.p0 = [520 - fA.m0.w / 2, 640 - fA.m0.h / 2]; fA.p1 = [RA.x + RA.w / 2 - fA.m1.w / 2, RA.y + RA.h / 2 - fA.m1.h / 2];
      fV.p0 = [1100 - fV.m0.w / 2, 640 - fV.m0.h / 2]; fV.p1 = [RV.x + RV.w / 2 - fV.m1.w / 2, RV.y + RV.h / 2 - fV.m1.h / 2];
      fT.p0 = [W / 2 - fT.m0.w / 2, 168]; fT.p1 = [RT.x, RT.y + (RT.h - fT.m1.h) / 2];
      fA.d0 = [520, 640]; fA.d1 = [RA.x, RA.y];          // display twins: start centre, docked top-left
      fV.d0 = [1100, 640]; fV.d1 = [RV.x, RV.y];
      fT.yLag = true;                      // slides left under the opening pill, then rises into the topbar
      const flyU = { u: 0 };
      tl.fromTo(flyU, { u: 0 }, { u: 1, duration: 15 / FPS, ease: 'none', immediateRender: false }, 5.5);
      const mix = (a, b, u) => { const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), Bc = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return `rgb(${A.map((v, i) => Math.round(lerp(v, Bc[i], u))).join(',')})`; };

      // ---- the lobbies fold into the match's opening positions as the pill lands ----
      const fold = { u: 0 };
      tl.fromTo(fold, { u: 0 }, { u: 1, duration: 0.5, ease: 'power3.inOut', immediateRender: false }, 5.5);
      tl.to([lobA.p, lobV.p], { a: 0, duration: 0.4, ease: 'power1.in' }, 5.5);
      tl.to([bA.p, bV.p], { a: 0, duration: 0.3, ease: 'power1.in' }, 5.5);
      const vtA = { a: 1 };
      tl.to(vtA, { a: 0, duration: 0.3, ease: 'power1.in' }, 5.5);
      const H0 = kHud(ctx);
      tl.to(H0.ticks, { opacity: 0, duration: 0.5, ease: 'none' }, 5.5);
      // the slug settles to the match screen's tracking (.1em, match.js) under the whip, so 34.0 is exact
      tl.fromTo(H0.slug, { letterSpacing: '0.12em' }, { letterSpacing: '0.1em', duration: 0.4, ease: 'sine.inOut', immediateRender: false }, 0.2);

      ctx.onFrame((lt) => {
        const z = K.cam.zoom, ms = markerScale(z);
        mm.p.f = headF(lt);
        lobA.draw(lt, z); lobV.draw(lt, z);
        const gA = lobA.geo(), gV = lobV.geo();
        if (foA.a > 0.002) focus.draw(gA.c[0], gA.c[1], foA.a); else focus.draw(gV.c[0], gV.c[1], foV.a);
        mm.draw(F, z);
        mmLabel(mm.p.lab);                                 // pinned to the head until 28.75, out by 28.9
        bA.p.s = bV.p.s = bannerScale(z);
        bA.draw(gA.c[0], gA.c[1], lt); bV.draw(gV.c[0], gV.c[1], lt);
        // Atlas: JK (the node), NC, EK hold their slots, then fold into Match.SLOTS as match tokens
        const fu = fold.u, tokS = 19 * S * z / 22;
        const at = (i, key) => { const s = lobA.slotScreen(i), q = F.toScreen(Match.SLOTS[key][0], Match.SLOTS[key][1]); return [lerp(s[0], q[0], fu), lerp(s[1], q[1], fu)]; };
        const sc2 = lerp(ms, tokS, fu), txt = Math.max(clamp((ms - 0.55) / 0.15, 0, 1), seg(lt, 5.6, 5.9));
        const qJ = at(0, 'jk'), qN = at(1, 'nc'), qE = at(2, 'ek');
        // ... and dock as s08's tokens: initials 13 product px (ts), JK's node ring r 24 and glow r 120
        // (NodeMark size 2 in product units), expressed in this marker's own scale (tokS)
        const ts = lerp(1, 13 * 22 / (20 * 19), fu);
        [[nc, qN], [ek, qE]].forEach(([mk, q]) => { mk.p.x = q[0]; mk.p.y = q[1]; mk.p.s = sc2; mk.p.a = 1; mk.p.txt = txt; mk.p.ts = ts; mk.draw(lt); });
        Object.assign(N.p, { x: qJ[0], y: qJ[1], s: sc2, disc: 1, rr: lerp(29, 24 * 22 / 19, fu), gr: lerp(94, 120 * 22 / 19, fu), core: 0, txt, ts });
        N.draw(lt);
        // Vega: three triangles stamp in at other angles (right, upper-left, lower-left)
        vt.forEach((m, i) => {
          const q = lobV.slotScreen(i);
          m.p.x = q[0]; m.p.y = q[1]; m.p.s = ms;
          const st = stampS(lt, STAMP[i]);
          m.p.a = (st > 0 ? 1 : 0) * vtA.a; m.p.pop = st;
          m.draw(lt);
        });
        const tb = gV.c[1] + gV.Rpx + 82;
        team.style.left = (gV.c[0] - teamW / 2).toFixed(1) + 'px'; team.style.top = (tb - teamBase).toFixed(1) + 'px';
        // pill + topbar build, labels fly
        const pu = pill.u;
        sc.style.visibility = pu > 0.001 ? '' : 'hidden';
        sc.style.clipPath = pu >= 0.999 ? '' : `inset(0px ${(pillW / 2 * (1 - pu)).toFixed(1)}px 0px ${(pillW / 2 * (1 - pu)).toFixed(1)}px round 16px)`;
        const tu = topb.u;
        U.topbar.style.visibility = tu > 0.001 ? '' : 'hidden';
        tStrong.style.clipPath = tu >= 0.999 ? '' : `inset(-6px ${(100 * (1 - tu)).toFixed(2)}% -6px 0px)`;
        tDiv.style.transform = `scaleY(${tu.toFixed(3)})`;
        const r = flyU.u, u = ez('power3.inOut')(r);
        const dA = ez('sine.inOut')(seg(r, 0.3, 0.62));     // mono -> pill type, while the labels move fastest
        [fA, fV, fT].forEach((f) => {
          // TEAM CHALLENGE slides under the opening pill first, then rises into the topbar (docked by 33.967)
          const uy = f.yLag ? ez('power3.inOut')(seg(r, 0.25, 1)) : u;
          const sz = lerp(f.size0, f.size1, u), ls = lerp(f.ls0, f.ls1, u);
          f.el.style.fontSize = sz.toFixed(2) + 'px'; f.el.style.letterSpacing = ls.toFixed(4) + 'em';
          f.el.style.color = u > 0 ? mix(f.col0, f.col1, u) : f.col0;
          f.el.style.transform = `translate(${lerp(f.p0[0], f.p1[0], u).toFixed(1)}px, ${lerp(f.p0[1], f.p1[1], uy).toFixed(1)}px)`;
          if (!f.d) return;
          f.el.style.opacity = (1 - dA).toFixed(3);
          f.d.style.opacity = dA.toFixed(3);
          const dx = lerp(f.d0[0] - f.dm.w / 2, f.d1[0], u), dy = lerp(f.d0[1] - f.dm.h / 2, f.d1[1], u);
          f.d.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
        });
      });
    },
  });
})();
