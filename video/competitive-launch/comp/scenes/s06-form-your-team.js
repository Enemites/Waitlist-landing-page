/* s06-form-your-team: film 22.0-28.0 s (6 s, bars 12.1-15.1). Local 0 = film 22.0.
 * Starts on s05's last frame (LOBBY_A, the light pool on the Atlas summit, banner + node at the apex).
 * 01 —— FORM YOUR TEAM. The summit contour becomes the lobby ring (22.5); JK (the node), NC and EK
 * snap into their slots on the beats 23.5 / 24.0 / 24.5; the team joins into a triangle; ATLAS stamps
 * on 26.0 (landing note D5). 27.0-28.0: PLANNED MATCHMAKING leaves east as a bone dashed line and the
 * camera rises with it to LOBBY_A2, where s07 whips along the line.
 * Mirror build: the lobby (kLobby / kMarker / kBanner) is side-agnostic and shared with s07.
 */
(function () {
  'use strict';
  const ID = 's06-form-your-team';
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

  Film.scene({
    id: ID,
    duration: 6,
    build(ctx) {
      const tl = ctx.tl, root = ctx.root, T0 = 22;
      ctx.css(`
        [data-scene="${ID}"] .s06-name { color:${C.ink}; text-shadow: 0 0 10px rgba(11,12,14,.95), 0 0 3px rgba(11,12,14,.9); }
        [data-scene="${ID}"] .s06-team { position:absolute; left:0; top:0; font: 600 64px/1 var(--display); letter-spacing:-0.02em; color:${C.amber}; white-space:pre; transform-origin: 50% 70%; }
        [data-scene="${ID}"] .s06-sub { color:${C.muted}; text-shadow: 0 0 10px rgba(11,12,14,.95); }
      `);

      // ---- camera: LOBBY_A (apex at (1340,560), z 2.2) drifting to 2.3 by 27.0, then rising to
      //      LOBBY_A2 (z 1.4, heading east) with the planned-matchmaking line. The rise ACCELERATES
      //      (power2.in) into the cut: the lobby stays clear of the exiting type, and s07's whip picks
      //      up this exact velocity on 28.0, so rise and whip read as one move along the line ----
      const A23 = camAt(APEX.atlas, LOBBY_SCREEN, 2.3);
      const camFn = (lt) => (lt < 5 ? camAt(APEX.atlas, LOBBY_SCREEN, Math.exp(lerp(Math.log(2.2), Math.log(2.3), ez('sine.inOut')(seg(lt, 0, 5)))))
        : camLerp(A23, LOBBY_A2, ez('power2.in')(seg(lt, 5, 6))));
      const K = kBase(ctx, { T0, cam: camFn });
      const F = K.F;
      const aW = K.wpt(APEX.atlas);
      const pool = { x: aW[0], y: aW[1], r: POOL.r, a: POOL.dive };
      F.T.spots.push(pool);
      tl.to(pool, { a: POOL.lobby, duration: 0.5, ease: 'power2.inOut' }, 0.5);   // the ring takes the light
      const focus = kFocus(ctx);
      const fo = { a: FOCUS_A };

      // ---- screen-space marks ----
      const ov = ctx.svg('svg', { class: 'brand-svg' });
      const htm = ctx.el('div', 'k-full', root);
      const lob = kLobby(ctx, F, ov, 'atlas');
      const mm = kMM(ctx, ov, htm);
      const triG = ctx.svg('g', {}, ov);
      const triL = [0, 1, 2].map(() => ctx.svg('line', { stroke: C.amber, 'stroke-opacity': 0.6, 'stroke-width': 1.5, 'stroke-linecap': 'round', style: 'display:none' }, triG));
      const trail = ctx.svg('path', { fill: 'none', stroke: C.amber, 'stroke-opacity': 0.55, 'stroke-width': 1.5, 'stroke-dasharray': '3 4', style: 'display:none' }, ov);
      const bA = kBanner(ctx, ov, 'atlas', T0); bA.p.rise = 1; bA.p.cloth = 1;
      const nc = kMarker(ctx, ov, 'atlas', 'NC'), ek = kMarker(ctx, ov, 'atlas', 'EK');
      const N = kNode(ctx, ov, { T0, pulses: nodePulses(21, 28) });

      // 22.5 CONTOUR BECOMES RING: the summit contour brightens to 2 px amber and pulls into a perfect circle
      tl.fromTo(lob.p, { m: 0 }, { m: 1, duration: 0.5, ease: 'power3.inOut', immediateRender: false }, 0.5);
      tl.fromTo(lob.p, { a: 0 }, { a: 0.95, duration: 4 / FPS, ease: 'none', immediateRender: false }, 0.5);
      tl.fromTo(lob.p, { w: 1.5 }, { w: 2, duration: 0.5, ease: 'power2.out', immediateRender: false }, 0.5);
      lob.slots.forEach((s, i) => tl.fromTo(s.p, { a: 0, s: 0.6 }, { a: 1, s: 1, duration: 8 / FPS, ease: 'power3.out', immediateRender: false }, 0.75 + i * 2 / FPS));
      lob.addPulse(4.0);
      // markers snap in on the beats: JK (the node) 23.5 from the apex, NC 24.0 from above, EK 24.5 from the right
      const LAND = [1.5, 2.0, 2.5], TRAVEL = 8 / FPS;
      lob.slots.forEach((s, i) => tl.to(s.p, { a: 0, duration: 2 / FPS, ease: 'none' }, LAND[i]));
      const mv = (lt, i) => ez('power2.in')(seg(lt, LAND[i] - TRAVEL, LAND[i]));
      nc.p.pulseAt = LAND[1]; ek.p.pulseAt = LAND[2];
      const jkPulse = kMarker(ctx, ov, 'atlas', ''); jkPulse.g.querySelector('g').style.display = 'none'; jkPulse.p.pulseAt = LAND[0];
      ov.insertBefore(jkPulse.g, N.g);

      // names: screen-space mono 20, scrambled in as each member lands
      const names = [['JULES · COORDINATION', 'r'], ['NORA · POWER SYSTEMS', 'c'], ['EMRE · CROSSING', 'l']].map(([t, al], i) => {
        const el = ctx.el('div', 'k-mono s06-name', htm, '');
        B.scrambleTo(tl, el, t, LAND[i] + 0.05, 0.4);
        return { el, al };
      });
      tl.to(names.map((n) => n.el), { opacity: 0, duration: 0.3, ease: 'none' }, 5.5);

      // 26.0 LANDING #1: ATLAS stamps under the ring, YOUR TEAM below; the ring pulses
      const team = ctx.el('div', 's06-team', htm, 'ATLAS');
      const tProbe = ctx.el('span', '', team); Object.assign(tProbe.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
      const teamBase = tProbe.getBoundingClientRect().top - team.getBoundingClientRect().top; team.removeChild(tProbe);
      const teamW = team.getBoundingClientRect().width;
      tl.fromTo(team, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 4 / FPS, ease: 'power2.out' }, 4.0);
      const sub = ctx.el('div', 'k-mono s06-sub', htm, '');
      B.scrambleTo(tl, sub, 'YOUR TEAM', 4.08, 0.35);
      tl.to([team, sub], { opacity: 0, duration: 0.3, ease: 'none' }, 5.5);

      // ---- type: 01 —— FORM YOUR TEAM / 'Bring friends.' / 'Or join a team.' (left five columns) ----
      kChapter(ctx, { num: '01', title: 'FORM YOUR TEAM', x: 120, y: 150, at: 0, out: 5.5 });
      kLine(ctx, { text: 'Bring friends.', x: 120, base: 380, size: 120, color: C.ink, at: 1.0, out: 5.0 });
      // line 2 leaves on 27.25 (held 3.05 s from landing), clear before the rising lobby slides west
      kLine(ctx, { text: 'Or join a team.', x: 120, base: 510, size: 120, color: C.amber, at: 1.5, out: 5.25 });

      // 27.0-28.0 PLANNED MATCHMAKING: bone line leaves east, dots step on the beats, the label says 'planned'
      tl.fromTo(mm.p, { f: 0 }, { f: MM_HEAD_S06, duration: 1.0, ease: 'power1.in', immediateRender: false }, 5.0);
      B.scrambleTo(tl, mm.lab, 'PLANNED MATCHMAKING', 5.25, 0.5);
      tl.to(fo, { a: 0.38, duration: 1.0, ease: 'power2.inOut' }, 5.0);

      kHud(ctx);

      ctx.onFrame((lt) => {
        const z = K.cam.zoom, ms = markerScale(z);
        lob.draw(lt, z);
        const ge = lob.geo();
        focus.draw(ge.c[0], ge.c[1], fo.a);
        mm.p.dots = lt >= 6 - 1e-6 ? 3 : lt >= 5.5 ? 2 : lt >= 5.0 ? 1 : 0;
        mm.p.lab = lt >= 5.25 ? 1 : 0;
        mm.draw(F, z);
        bA.p.s = bannerScale(z); bA.draw(ge.c[0], ge.c[1], lt);
        // member positions
        const sJ = lob.slotScreen(0), sN = lob.slotScreen(1), sE = lob.slotScreen(2);
        const uJ = mv(lt, 0), uN = mv(lt, 1), uE = mv(lt, 2);
        const jx = lerp(ge.c[0], sJ[0], uJ), jy = lerp(ge.c[1], sJ[1], uJ);
        const nx = sN[0], ny = sN[1] - 150 * (1 - uN), ex = sE[0] + 220 * (1 - uE), ey = sE[1];
        // JK = THE NODE: steps on a short dashed trail, lands as the JK disc wrapped by the node ring
        const landed = lt >= LAND[0];
        N.p.x = jx; N.p.y = jy; N.p.s = ms;
        N.p.disc = landed ? snapPop(lt, LAND[0]) : 0;
        N.p.rr = lerp(12, 29, ez('power3.out')(seg(lt, LAND[0], LAND[0] + 6 / FPS)));
        N.p.core = 1 - seg(lt, LAND[0], LAND[0] + 2 / FPS);
        N.p.txt = clamp((ms - 0.55) / 0.15, 0, 1);
        const ta = (lt >= LAND[0] - TRAVEL ? 1 : 0) * (1 - seg(lt, 1.9, 2.4));
        if (ta > 0.001) { trail.style.display = ''; trail.setAttribute('d', `M${ge.c[0].toFixed(1)} ${ge.c[1].toFixed(1)} L${jx.toFixed(1)} ${jy.toFixed(1)}`); trail.setAttribute('opacity', ta.toFixed(3)); }
        else trail.style.display = 'none';
        jkPulse.p.x = sJ[0]; jkPulse.p.y = sJ[1]; jkPulse.p.s = ms; jkPulse.p.a = landed ? 1 : 0; jkPulse.draw(lt);
        [[nc, nx, ny, 1], [ek, ex, ey, 2]].forEach(([mk, x, y, i]) => {
          mk.p.x = x; mk.p.y = y; mk.p.s = ms;
          mk.p.a = seg(lt, LAND[i] - TRAVEL, LAND[i] - TRAVEL + 3 / FPS);
          mk.p.pop = snapPop(lt, LAND[i]);
          mk.p.txt = clamp((ms - 0.55) / 0.15, 0, 1);
          mk.draw(lt);
        });
        N.draw(lt);
        // the team decides how it works together: three lines join the markers, drawn on twos
        const tq = Math.floor(lt * FPS / 2) * 2 / FPS, triA = 1 - seg(lt, 5.5, 5.8);
        const P = [[sJ[0], sJ[1]], [sN[0], sN[1]], [sE[0], sE[1]]], gap = 30 * ms;
        triL.forEach((ln, k) => {
          const pk = seg(tq, 3.0 + k / 6, 3.0 + (k + 1) / 6);
          if (pk <= 0 || triA <= 0.001) { ln.style.display = 'none'; return; }
          const a = P[k], b = P[(k + 1) % 3], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
          const L1 = gap + (L - 2 * gap) * pk;
          ln.style.display = '';
          ln.setAttribute('x1', (a[0] + ux * gap).toFixed(1)); ln.setAttribute('y1', (a[1] + uy * gap).toFixed(1));
          ln.setAttribute('x2', (a[0] + ux * L1).toFixed(1)); ln.setAttribute('y2', (a[1] + uy * L1).toFixed(1));
          ln.setAttribute('opacity', triA.toFixed(3));
        });
        // labels follow their slots (constant size)
        const nm = names;
        nm[0].el.style.right = (W - (sJ[0] - 19 * ms)).toFixed(1) + 'px'; nm[0].el.style.top = (sJ[1] + 41 * ms).toFixed(1) + 'px';
        nm[1].el.style.left = sN[0].toFixed(1) + 'px'; nm[1].el.style.transform = 'translateX(-50%)'; nm[1].el.style.top = (sN[1] - 59 * ms).toFixed(1) + 'px';
        nm[2].el.style.left = (sE[0] + 19 * ms).toFixed(1) + 'px'; nm[2].el.style.top = (sE[1] + 41 * ms).toFixed(1) + 'px';
        const tb = ge.c[1] + ge.Rpx + 82;
        team.style.left = (ge.c[0] - teamW / 2).toFixed(1) + 'px'; team.style.top = (tb - teamBase).toFixed(1) + 'px';
        sub.style.left = ge.c[0].toFixed(1) + 'px'; sub.style.transform = 'translateX(-50%)'; sub.style.top = (tb + 25).toFixed(1) + 'px';
      });
    },
  });
})();
