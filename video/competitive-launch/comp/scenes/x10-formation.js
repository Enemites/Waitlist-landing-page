/* x10-formation (film 46.0-48.0): revision v3 insert, FORMATION. Local 0 = 46.0 = THE DROP (the
 * film's one low hit). Hides s10's 'Coordinate.' card. Spec: docs/revision-v3.md.
 *
 * 0.00 (46.0) THE HIT: hard cut out of s09's silence onto a black field with a dot grid. The impact
 *      frame: a shock ring bursts from the formation centre, an amber bloom, the grid kicks, the
 *      frame punches in (1.05 -> 1) and shakes (decays in ~0.3 s), and three particle streams are
 *      already in flight from three edges (JK from the top, EK from the left, NC from the bottom),
 *      motion-blurred.
 *      A full-frame additive flash (amberLight .45 -> 0 by 0.1), the shock ring opens at r 200 (6 px
 *      core + 60 px halo), the light cores are 1.6x wide and the particle cones 2.2x on the hit frame
 *      (both ease back by 0.2), the entry tails are doubled (long streaks from the edges; NC's head sits
 *      ~140 px inside the bottom edge), and the stage turns -10 deg -> 0 round the formation centre (0-0.6,
 *      expo.out) for camera energy.
 * 0.00-0.90 three COMETS (340 particles each, deterministic), one per member, keyframed at film TIMES in
 *      polar coordinates round the braid centre (1060,540), so the action fills the right two thirds and
 *      no head ever crawls (25-50 px a frame through the braid, a whip into the lock). JK drops from the
 *      top and swings counter-clockwise through the left and along the bottom (~300); NC climbs
 *      counter-clockwise up the right and HOOKS over the top (46.55-46.75) before dropping onto its node;
 *      EK flies in from the left, runs clockwise over the top under NC's hook and whips out to its node.
 *      Crossings: EK cuts JK's entry path at ~46.22 (JK over: the front comet brighter and wider); NC
 *      crosses EK's lane at ~46.60, the two heads pass at ~46.68 (NC over), NC crosses back at ~46.79 and
 *      EK whips out through NC's climb at ~46.76: the streams braid. A comet = a hot head sprite (ink core
 *      in an amber halo) + a dense knot of particles + a tail that lags in TIME (~0.24 s through the
 *      braid) and opens into a cone of spray (3 px at the head to ~16 px at the tail end, plus the path
 *      term) + a light core (30 / 10 / 3.5 px) + an orbit trace (1.5 px at .8 over the last 0.7 s: the
 *      three lanes read as an orbit diagram). Each stream's shutter and trail sampling follow its head
 *      speed (no faceted wires). A quarter-res bloom pass makes dense areas glow. The tails keep 30% of
 *      their length until 46.867 and collapse only in the last frame; stacked trails dim as they collapse;
 *      cores and heads stay hot to 46.833 and fade into the lock.
 *      Paths are monotone cubics in the head parameter, baked into a look-up table at build.
 * 0.90 (46.9) LOCK: the streams stop dead on three nodes (JK, NC, EK tokens) - the discs flash
 *      amberLight -> amber (4 f), 4 px rings burst from r x 1.4, THE NODE's ring and glow on JK,
 *      hairlines draw between them. On the lock frame each stream leaves ONE tapered streak along its
 *      last ~2 frames of approach (6 px at the node to 0, amber -> amberLight, <= .8); no particle trails.
 *      'Coordinate.' rises from 0.80 (s10's word card exactly: Manrope 620, 150 px, ink, x 120,
 *      baseline 600, 12 f expo.out) so it lands with the lock.
 * 0.90-1.73 hold: the formation pushes 1.0 -> 1.05 round GC (power1.out, by its coordinates, so the
 *      snap still lands on END); particles orbit their nodes in tight swarms (dots). 1.25 (47.25) THE
 *      BEAT: rings from all three tokens, the hairlines flash amberLight (3 f), and three bright packets
 *      run the triangle JK -> NC -> EK -> JK in 0.4 s (power2.inOut).
 * 1.733 'Coordinate.' exits up (7 f power2.in, as s10 does) while the formation SNAPS (power4.in,
 *      7 f): each token flies to its exact screen position and size in s10's C2 framing at 48.0
 *      (JK 1203.6,489.6 / NC 910.8,384 / EK 1770,336, r 45.6), each swarm collapses into its token and
 *      streaks behind it, and s10's charcoal scrim fades in over the left third (1.733-1.967, power2.in,
 *      the identical gradient) so NC lands at s10's brightness: the cut to 'Commit.' at 48.0 is a NODE
 *      MATCH CUT (the film's device #1).
 * HUD: s10's corners (inset 72) and slug on every frame.
 */
(function () {
  'use strict';
  const ID = 'x10-formation';
  const C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpHex = (a, b, u) => { const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(',')})`; };

  const T_LOCK = 27 / FPS - 1e-6;          // 46.9 (minus an epsilon: film time 46.9 - 46.0 lands a hair under 0.9)
  const T_WORD = 24 / FPS;                 // 46.8: the word starts rising, lands with the lock
  const T_S0 = 52 / FPS, T_S1 = 59 / FPS;  // the snap: 47.733 -> 47.967 (last frame of the insert)

  // the hold formation (screen px) and its centre
  const GC = [1404, 484];
  const KEYS = ['jk', 'nc', 'ek'];
  const HOLD = { jk: [1392, 700], nc: [1128, 392], ek: [1690, 362] };
  const R_HOLD = 44;
  // s10 at 48.0: preset C2 (cam 582.5,505, zoom 1.6; S 1.5 -> 2.4 px per product unit), posts from match.js
  const K2 = 2.4, CAM2 = [582.5, 505];
  const POSTS = (window.Match && Match.POSTS) || { jk: [684, 484], nc: [562, 440], ek: [920, 420] };
  const END = {}; KEYS.forEach((k) => { END[k] = [(POSTS[k][0] - CAM2[0]) * K2 + W / 2, (POSTS[k][1] - CAM2[1]) * K2 + H / 2]; });
  const R_END = 19 * K2;                   // token radius in C2 (45.6)
  const FONT_END = 13 * K2;                // initials (31.2 px, mono 600)

  // particle streams: three COMETS, each on its own lane round the braid centre BC (left of the formation,
  // so the action fills the right two thirds). A stream is keyframed in polar coordinates round BC at film
  // TIMES: [t (local s), angle (deg, screen, + = clockwise), radius (px)]; at build each time becomes a path
  // parameter u = headOf(t / T_LOCK) and the path is a monotone cubic in u; u 0 = the entry point E just off
  // an edge, u 1 = the node (both added at build). JK drops in from the top and swings COUNTER-clockwise
  // through the left and along the bottom (inner lane, ~300); NC climbs counter-clockwise up the right and
  // HOOKS over the top (0.55-0.75) before dropping onto its node; EK flies in from the left and runs
  // CLOCKWISE over the top (outer lane, dipping in under NC's hook) and whips out to its node. No crawl:
  // every head keeps 25-50 px a frame through the braid. Crossings: EK cuts JK's entry path at ~0.22
  // (crossing 1, JK over), EK runs under NC's hook (NC crosses EK's lane at ~0.60 and again at ~0.79, the
  // heads pass ~0.68, NC over) and EK whips out across NC's climb at ~0.76.
  const STREAM = {
    jk: { E: [860, -150], T: [[0, -125, 520], [0.2, -192, 330], [0.4, -247, 305], [0.6, -290, 298], [0.75, -309, 320]] },
    nc: { E: [1300, 1160], T: [[0, 54, 470], [0.2, 26, 360], [0.4, -2, 360], [0.6, -42, 410], [0.75, -78, 330]] },
    ek: { E: [-150, 430], T: [[0, -168, 760], [0.2, -150, 450], [0.4, -118, 410], [0.6, -82, 290], [0.72, -52, 360]] },
  };
  // depth (-1 back .. 0 neutral .. 1 front): JK passes OVER EK at crossing 1 (~0.2), NC passes over EK under
  // its hook (~0.6-0.78); the front comet is brighter and wider, the back one dims
  const sm = (a, b, t) => { const v = Math.min(1, Math.max(0, (t - a) / (b - a))); return v * v * (3 - 2 * v); };
  const depthOf = (si, t) => {
    const d = sm(0.04, 0.14, t) * (1 - sm(0.34, 0.46, t)), d2 = sm(0.54, 0.62, t) * (1 - sm(0.74, 0.8, t));
    return si === 0 ? d : si === 1 ? d2 : -0.8 * d - 0.6 * d2;
  };
  const depthB = (d) => (d >= 0 ? 0.85 + 0.15 * d : 0.85 + 0.5 * d);
  const NP = 340;
  const BC = [1060, 540];                  // the braid turns round this point
  // the stream head's path parameter over x = t / T_LOCK (a gentle ramp: the choreography's tempo lives in the
  // time keys above; this only shapes the motion between keys and the tails beyond the entry edge)
  const HK = [[0, 0.3, 1.25], [1, 1, 0.55]];
  // monotone cubic (Fritsch-Carlson) through [xs, ys]; linear beyond the ends
  function monotone(xs, ys) {
    const n = xs.length, d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
    }
    return (x) => {
      if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
      if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
      let i = 0; while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  }
  function headOf(x) {
    if (x <= 0) return HK[0][1] + HK[0][2] * x;
    if (x >= 1) return 1;
    let i = 0; while (x > HK[i + 1][0]) i++;
    const [x0, y0, m0] = HK[i], [x1, y1, m1] = HK[i + 1], hh = x1 - x0, u = (x - x0) / hh;
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * hh * m0 + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * hh * m1;
  }

  Film.scene({
    id: ID,
    duration: 2,
    build(ctx) {
      const tl = ctx.tl, root = ctx.root;
      const rng = ctx.rng('x10-formation'), rng2 = ctx.rng('x10-comets');
      const nz = ctx.noise2D('x10-shake');
      ctx.css(`
        [data-scene="${ID}"] .x10-ground { position:absolute; left:0; top:0; width:${W}px; height:${H}px; background:#0b0c0e; }
        [data-scene="${ID}"] .x10-stage { position:absolute; left:0; top:0; width:${W}px; height:${H}px; transform-origin:${GC[0]}px ${GC[1]}px; }
        [data-scene="${ID}"] .x10-bloom { position:absolute; left:0; top:0; width:${W}px; height:${H}px; opacity:0;
          background: radial-gradient(900px 640px at ${GC[0]}px ${GC[1]}px, rgba(246,211,159,.42) 0%, rgba(239,189,112,.2) 30%, rgba(163,122,66,.08) 52%, rgba(11,12,14,0) 74%); }
        [data-scene="${ID}"] .x10-tok text { font: 600 13px var(--mono); letter-spacing: .08em; }
        [data-scene="${ID}"] .x10-flash { position:absolute; left:0; top:0; width:${W}px; height:${H}px; mix-blend-mode: plus-lighter; opacity:0;
          background: radial-gradient(1150px 800px at ${GC[0]}px ${GC[1]}px, rgba(246,211,159,1) 0%, rgba(246,211,159,.5) 40%, rgba(246,211,159,.18) 100%); }
        [data-scene="${ID}"] .x10-scrim { position:absolute; left:0; top:0; width:${W}px; height:${H}px; opacity:0;
          background: linear-gradient(90deg, rgba(11,12,14,.94) 0px, rgba(11,12,14,.9) 360px, rgba(11,12,14,.72) 620px, rgba(11,12,14,.36) 860px, rgba(11,12,14,.1) 1010px, rgba(11,12,14,0) 1100px); }
      `);
      ctx.el('div', 'x10-ground', root);

      // ---- dot grid (baked once): 48 px dots, a cross every 192 px; kicked on the hit
      const { canvas: gridCv, g: gg } = ctx.canvas({ parent: root });
      gg.clearRect(0, 0, W, H);
      for (let y = 12; y < H; y += 48) for (let x = (GC[0] % 48); x < W; x += 48) {
        const major = Math.round((x - GC[0]) / 48) % 4 === 0 && Math.round((y - 12) / 48) % 4 === 2;
        if (major) { gg.fillStyle = 'rgba(239,189,112,.5)'; gg.fillRect(x - 6, y, 13, 1); gg.fillRect(x, y - 6, 1, 13); }
        else { gg.fillStyle = 'rgba(239,189,112,.42)'; gg.fillRect(x - 1, y - 1, 2, 2); }
      }
      tl.fromTo(gridCv, { opacity: 1 }, { opacity: 0.32, duration: 0.45, ease: 'expo.out' }, 0);

      const bloom = ctx.el('div', 'x10-bloom', root);
      tl.fromTo(bloom, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: 'expo.out' }, 0);

      // ---- the stage (punch-in + shake on the hit): particles canvas + marks svg
      const stage = ctx.el('div', 'x10-stage', root);
      const { canvas: pcv, g } = ctx.canvas({ parent: stage });
      const sv = ctx.svg('svg', { class: 'brand-svg' }, stage);
      const shockH = ctx.svg('circle', { cx: GC[0], cy: GC[1], r: 200, fill: 'none', stroke: C.amber, 'stroke-width': 60, 'stroke-opacity': 0.15, opacity: 0 }, sv);
      const shock = ctx.svg('circle', { cx: GC[0], cy: GC[1], r: 200, fill: 'none', stroke: C.amberLight, 'stroke-width': 6, opacity: 0 }, sv);
      const shock2 = ctx.svg('circle', { cx: GC[0], cy: GC[1], r: 40, fill: 'none', stroke: C.amber, 'stroke-width': 2, opacity: 0 }, sv);
      const punch = { s: 1.05 };
      tl.fromTo(punch, { s: 1.05 }, { s: 1, duration: 0.3, ease: 'expo.out' }, 0);

      // hairlines (drawn on at the lock; endpoints follow the tokens)
      const hairs = [['jk', 'nc'], ['jk', 'ek'], ['nc', 'ek']].map(([a, b]) => ({ a, b, el: ctx.svg('path', { fill: 'none', stroke: C.amber, 'stroke-width': 1.5, 'stroke-opacity': 0.8, pathLength: 1, 'stroke-dasharray': '0 2', 'stroke-linecap': 'round' }, sv) }));
      // lock rings (one per node)
      const rings = KEYS.map(() => ctx.svg('circle', { r: 10, fill: 'none', stroke: C.amberLight, 'stroke-width': 4, opacity: 0 }, sv));
      const rings2 = KEYS.map(() => ctx.svg('circle', { r: 10, fill: 'none', stroke: C.amberLight, 'stroke-width': 3, opacity: 0 }, sv));

      // tokens: amber disc + dark mono initials (the map tokens); THE NODE rides JK
      const toks = {};
      KEYS.forEach((k) => {
        const gk = ctx.svg('g', { class: 'x10-tok', opacity: 0 }, sv);
        let node = null;
        if (k === 'jk') {
          node = ctx.svg('g', {}, gk);
          NodeMark.create(ctx, { parent: node, x: 0, y: 0, size: 2 * K2, pulses: [T_LOCK], pulseEvery: 0 });
        }
        const disc = ctx.svg('circle', { r: R_END, fill: C.amber }, gk);
        const txt = ctx.svg('text', { y: FONT_END * 0.36, 'text-anchor': 'middle', fill: '#1b140a', text: k.toUpperCase(), style: { fontSize: FONT_END + 'px' } }, gk);
        toks[k] = { g: gk, node, disc, txt };
      });
      const tokP = { a: 0 };
      tl.fromTo(tokP, { a: 0 }, { a: 1, duration: 1 / FPS, ease: 'none' }, T_LOCK - 1 / FPS);

      // ---- the hit flash (additive) and s10's scrim (fades in for the snap), above the stage, below the word
      const flash = ctx.el('div', 'x10-flash', root);
      tl.fromTo(flash, { opacity: 0.5 }, { opacity: 0, duration: 0.1, ease: 'expo.out' }, 0);
      const scrim = ctx.el('div', 'x10-scrim', root);
      tl.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: T_S1 - T_S0, ease: 'power2.in', immediateRender: false }, T_S0);

      // ---- 'Coordinate.' : s10's word card, same size and position (Manrope 620, 150 px, x 120, baseline 600)
      const h = Brand.headline(ctx, { lines: ['Coordinate.'], x: 120, y: 0, size: 150, at: T_WORD, dur: 12 / FPS, wordStagger: 0, accent: [], out: null, width: 1000 });
      tl.to(h.words[0], { yPercent: -118, duration: 7 / FPS, ease: 'power2.in' }, T_S0);
      { const probe = ctx.el('span', '', h.lines[0]); probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        const base = probe.offsetTop + h.lines[0].offsetTop; probe.remove(); h.el.style.top = (600 - base).toFixed(1) + 'px'; }

      // HUD (s09 / s10 corners and slug, same place)
      Brand.hud(ctx, { inset: 72, tc: false, ticks: false, drawIn: false, slug: '' });
      Brand.label(ctx, { text: 'REALMS · COMPETITIVE · INTERFACE CONCEPT', x: 120, y: 990, size: 20, color: C.muted3, scramble: false, tracking: '.1em' });

      // ---- node positions / radius over time (pure)
      const p4in = gsap.parseEase('power4.in'), eo = gsap.parseEase('expo.out'), p1o = gsap.parseEase('power1.out');
      const p2io = gsap.parseEase('power2.inOut'), p2o = gsap.parseEase('power2.out');
      const snapU = (t) => p4in(clamp01((t - T_S0) / (T_S1 - T_S0)));
      const breathe = (t) => 1 + 0.03 * Math.sin(TAU * (t - T_LOCK) / 1.1) * clamp01((t - T_LOCK) / 0.2);
      // the hold pushes 1.0 -> 1.05 round GC by its coordinates (the snap still lands exactly on END)
      const holdS = (t) => 1 + 0.05 * p1o(clamp01((t - T_LOCK) / (T_S0 - T_LOCK)));
      const nodePos = (k, t, out) => {
        const u = snapU(t), s = holdS(t);
        out[0] = lerp(GC[0] + (HOLD[k][0] - GC[0]) * s, END[k][0], u); out[1] = lerp(GC[1] + (HOLD[k][1] - GC[1]) * s, END[k][1], u); return out;
      };
      const nodeR = (t) => { const u = snapU(t); return lerp(R_HOLD * holdS(t) * breathe(t), R_END, u); };
      const T_BEAT = 1.25 - 1e-6;          // 47.25: the hold's one beat

      // ---- particles (all parameters fixed at build; positions are pure functions of t)
      // each stream's centreline is baked once into a look-up table over u (screen x, y and the unit normal)
      const U_LO = -0.6, LUTN = 3200, LUTK = LUTN / (1 - U_LO);
      const streams = KEYS.map((k, si) => {
        const S = STREAM[k];
        S.K = S.T.map(([tk, a, rr]) => [headOf(tk / T_LOCK), a, rr]);   // time keys -> path parameter
        const [hx, hy] = HOLD[k];
        const th0 = Math.atan2(S.E[1] - BC[1], S.E[0] - BC[0]) / DEG, rho0 = Math.hypot(S.E[0] - BC[0], S.E[1] - BC[1]);
        let thN = Math.atan2(hy - BC[1], hx - BC[0]) / DEG;
        const last = S.K[S.K.length - 1][1];
        while (thN - last > 180) thN -= 360;
        while (thN - last < -180) thN += 360;
        const K = [[0, th0, rho0]].concat(S.K, [[1, thN, Math.hypot(hx - BC[0], hy - BC[1])]]);
        const thF = monotone(K.map((r) => r[0]), K.map((r) => r[1])), rhF = monotone(K.map((r) => r[0]), K.map((r) => r[2]));
        const X = new Float64Array(LUTN + 1), Y = new Float64Array(LUTN + 1), NX = new Float64Array(LUTN + 1), NY = new Float64Array(LUTN + 1);
        for (let i = 0; i <= LUTN; i++) {
          const u = U_LO + i / LUTK, th = thF(u) * DEG, r = rhF(u);
          X[i] = BC[0] + r * Math.cos(th); Y[i] = BC[1] + r * Math.sin(th);
        }
        // the exact node at u = 1 (the lock lands on HOLD to the pixel)
        X[LUTN] = hx; Y[LUTN] = hy;
        for (let i = 0; i <= LUTN; i++) {
          const a = Math.max(0, i - 1), b = Math.min(LUTN, i + 1);
          const tx = X[b] - X[a], ty = Y[b] - Y[a], tl2 = Math.hypot(tx, ty) || 1;
          NX[i] = -ty / tl2; NY[i] = tx / tl2;
        }
        return { k, si, X, Y, NX, NY };
      });
      const LAGT = 0.17, LAGU = 0.05, LAG = 0.3;     // LAG: the path distance at which a tail reaches its full width
      const parts = [];
      for (const st of streams) {
        for (let i = 0; i < NP; i++) {
          // the draw order of rng() is the v3 one (flow, lag, ph, a, w0, b, orb, ...), so every hold / snap
          // parameter is unchanged and the formation from the lock on is the same frame for frame; the comet-only
          // parameters come from their own generator
          const flow = rng() < 0.12;                     // these run along the hairlines in the hold
          const knot = rng2() < 0.22;                    // the comet's head: a dense bright knot
          const rl = rng();
          parts.push({
            st, flow, knot,
            // behind the stream head, mostly in TIME (so the tail stretches on the fast entry and the whip and
            // shortens in the slow braid) plus a little in path units; dense at the head
            lagT: knot ? 0.006 * rl : LAGT * Math.pow(rl, 2.1), lagU: (knot ? 0.004 : LAGU) * Math.pow(rng2(), 1.6),
            lagN: knot ? 0 : Math.pow(rl, 2.1),          // place in the tail 0 (head) .. 1 (tail end): opens the cone
            ph: rng() * TAU,                              // helix phase
            a: 0.15 + 0.85 * rng(),                       // ribbon offset factor
            w0: 40 + 40 * rng(),                          // tail half-width at the end of the tail (the comet's cone)
            b: 0.4 + 0.6 * rng(),                         // brightness
            bk: knot ? 1.6 : 1,                           // in-flight boost (the knot)
            orb: 12 + 48 * Math.pow(rng(), 1.5),          // hold orbit radius (a tight swarm)
            om: (rng() < 0.5 ? -1 : 1) * (0.7 + 2.2 * rng()),
            a0: rng() * TAU,
            edge: Math.floor(rng() * 2), f0: rng(), fv: 0.35 + 0.5 * rng(),
          });
        }
      }
      const TWIST = TAU * 0.8;
      const tmpA = [0, 0], tmpB = [0, 0];
      // centreline of a stream at path parameter u (u < 0: still beyond the edge); returns the LUT position
      function centre(st, u, out) {
        const f = (Math.min(1, Math.max(U_LO, u)) - U_LO) * LUTK, i = Math.min(LUTN - 1, f | 0), t = f - i;
        out[0] = st.X[i] + (st.X[i + 1] - st.X[i]) * t; out[1] = st.Y[i] + (st.Y[i + 1] - st.Y[i]) * t;
        return i + (t >= 0.5 ? 1 : 0);
      }
      // in-flight position of a particle at path parameter u: the centreline + a twisting offset that
      // opens with the distance behind the head and with the particle's place in the tail (a comet: a tight
      // head, a cone of spray: 3 px at the head rising to ~16 px at the tail end, plus the path-distance term)
      function flight(p, u, lagE, out) {
        const st = p.st;
        const j = centre(st, u, out);
        const hel = p.ph + TWIST * u;
        const uc = clamp01(u), u3 = uc * uc * uc;
        const off = (3 + 13 * p.lagN + p.w0 * lagE / LAG) * wCone * (1 + 0.12 * sDep[st.si]) * (1 - u3 * u3) * p.a * Math.cos(hel);
        out[0] += st.NX[j] * off; out[1] += st.NY[j] * off;
        return Math.sin(hel);   // depth cue (-1 back .. 1 front)
      }
      // per-frame globals set at the top of onFrame (pure functions of t): the hit's core width (1.6x) and cone
      // width (2.2x), the arm depths
      let wMul = 1, wCone = 1;
      const sDep = [0, 0, 0];
      const setFrameGlobals = (t) => {
        const k = 1 - p2o(clamp01(t / 0.2));
        wMul = 1 + 0.6 * k; wCone = 1 + 1.2 * k;
        for (let i = 0; i < 3; i++) sDep[i] = depthOf(i, t);
      };
      const compress = (x) => { const v = clamp01((x - 0.55) / 0.45); return v * v * (3 - 2 * v); };
      // tail length over time (x LAGT): doubled on the hit (long entry streaks), x1.4 through the braid
      // (0.15-0.85: ~0.24 s of path), 1 into the lock
      const lagMul = (t) => 1 + (1 - p2o(clamp01(t / 0.12))) + 0.4 * sm(0.15, 0.3, t) * (1 - sm(0.72, 0.85, t));
      // the tails collapse into the heads for the lock, but keep 30% until 0.867 and close only in the last frame
      const T_CF = T_LOCK - 1 / FPS;
      const cfOf = (t) => Math.max(1 - compress(t / T_LOCK), 0.3 * (1 - clamp01((t - T_CF) / (T_LOCK - T_CF))));
      // position of particle p at time t (any t: in flight, hold or snap)
      function pos(p, t, out) {
        if (t < T_LOCK) {
          const x = t / T_LOCK, cf = cfOf(t), hd = headOf(x);
          const u = headOf(x - p.lagT * lagMul(t) * cf / T_LOCK) - p.lagU * cf;
          return flight(p, u, hd - u, out);
        }
        const k = p.st.k;
        const sc = nodeR(t) / R_HOLD;
        nodePos(k, t, out);
        const dt = t - T_LOCK;
        if (p.flow) {
          // data dashes along the hairlines: from this node toward a neighbour and back
          const other = KEYS[(p.st.si + 1 + p.edge) % 3];
          nodePos(other, t, tmpB);
          const f = (p.f0 + p.fv * dt) % 1;
          const e = clamp01(dt / 0.25);
          const ff = (f < 0.5 ? f * 2 : 2 - f * 2) * e;
          out[0] = lerp(out[0], tmpB[0], ff); out[1] = lerp(out[1], tmpB[1], ff);
          return 0.6;
        }
        const bloomR = p.orb * eo(clamp01(dt / 0.35)) * sc * (1 - snapU(t));
        const an = p.a0 + p.om * dt;
        const n1 = nz(p.a0 * 3 + dt * 0.7, p.ph) * 6 * sc;
        out[0] += Math.cos(an) * bloomR + n1;
        out[1] += Math.sin(an) * bloomR + nz(p.ph, p.a0 * 3 + dt * 0.7) * 6 * sc;
        return Math.sin(p.ph + an);
      }

      // ---- light: a prebaked soft dot sprite (3 px core + 12 px halo at ~15%) and a half-res bloom buffer
      const SPR = 32;
      const spr = document.createElement('canvas'); spr.width = spr.height = SPR;
      { const sg = spr.getContext('2d'); const gr = sg.createRadialGradient(SPR / 2, SPR / 2, 0, SPR / 2, SPR / 2, SPR / 2);
        gr.addColorStop(0, 'rgba(246,211,159,1)'); gr.addColorStop(1.5 / 16, 'rgba(246,211,159,1)'); gr.addColorStop(2.6 / 16, 'rgba(246,211,159,.42)');
        gr.addColorStop(5 / 16, 'rgba(239,189,112,.17)'); gr.addColorStop(12 / 16, 'rgba(239,189,112,.05)'); gr.addColorStop(1, 'rgba(239,189,112,0)');
        sg.fillStyle = gr; sg.fillRect(0, 0, SPR, SPR); }
      // the comet head: a hot ink core in an amber halo (drawn additively at each stream's head)
      const HSP = 150;
      const hspr = document.createElement('canvas'); hspr.width = hspr.height = HSP;
      { const sg = hspr.getContext('2d'); const gr = sg.createRadialGradient(HSP / 2, HSP / 2, 0, HSP / 2, HSP / 2, HSP / 2);
        gr.addColorStop(0, 'rgba(242,238,231,1)'); gr.addColorStop(0.07, 'rgba(242,238,231,.9)'); gr.addColorStop(0.14, 'rgba(246,211,159,.55)');
        gr.addColorStop(0.32, 'rgba(239,189,112,.2)'); gr.addColorStop(0.62, 'rgba(163,122,66,.07)'); gr.addColorStop(1, 'rgba(163,122,66,0)');
        sg.fillStyle = gr; sg.fillRect(0, 0, HSP, HSP); }
      const BW = W / 4, BH = H / 4;      // quarter-res bloom buffer (blur 4 px here = 16 px at full res)
      const offCv = document.createElement('canvas'); offCv.width = BW; offCv.height = BH;
      const og = offCv.getContext('2d');
      const offCv2 = document.createElement('canvas'); offCv2.width = BW; offCv2.height = BH;
      const og2 = offCv2.getContext('2d');

      // trail sampling: J samples back over the shutter dt; the front ~40% and the rest go to separate strokes
      // (taper). In flight each stream gets its own shutter (long enough for a ~140 px streak, DT .. 2.5 DT) and
      // enough samples for its speed (one per <= 30 px, 5 .. 14), so a fast head never draws a faceted wire; the
      // hold and the snap keep J 5 (the v3 frames).
      const J = 5, JMAX = 14, DT = 0.07;
      for (const p of parts) p.buf = new Float64Array(2 * JMAX + 2);  // trail samples, reused every frame
      const jS = [J, J, J], dtS = [DT, DT, DT];
      // the lock frame: one tapered streak per stream (6 px at the node down to 0, amber -> amberLight, <= .8)
      // instead of 340 coincident trails
      const STK = 18;
      const streaks = [0, 1, 2].map(() => new Float64Array(4 * (STK + 1)));
      const BK = 6;
      const fronts = Array.from({ length: BK }, () => []);
      const amberRGB = '239,189,112', lightRGB = '246,211,159', deepRGB = '163,122,66';
      const heads = [];          // x, y, alpha, scale
      const dot = (gx, x, y, a, s) => { const d = SPR * s; gx.globalAlpha = a; gx.drawImage(spr, x - d / 2, y - d / 2, d, d); };
      // per-frame scratch (reused; filled from t each frame): light-core polylines, packet trails
      const CNS = 48, CSEG = 8, PNS = 8;
      const cores = [0, 1, 2].map(() => new Float64Array(2 * CNS + 2)); let coreN = 0;
      // orbit traces: where each comet has been over the last TRS s, a hairline fading to nothing (the three lanes read)
      const TRN = 40, TRS = 0.7;
      const traces = [0, 1, 2].map(() => new Float64Array(2 * TRN + 2));
      const pkts = [0, 1, 2].map(() => new Float64Array(2 * PNS + 2)); let pktN = 0;
      // packets on the beat: three, one from each vertex, round JK -> NC -> EK -> JK
      const LOOP = ['jk', 'nc', 'ek'];
      const loopPt = (P, f, out) => {
        const L = [0, 0, 0]; let tot = 0;
        for (let i = 0; i < 3; i++) { const a = P[LOOP[i]], b = P[LOOP[(i + 1) % 3]]; L[i] = Math.hypot(b[0] - a[0], b[1] - a[1]); tot += L[i]; }
        let d = (((f % 1) + 1) % 1) * tot;
        for (let i = 0; i < 3; i++) {
          if (d <= L[i] || i === 2) { const a = P[LOOP[i]], b = P[LOOP[(i + 1) % 3]], u = Math.min(1, d / (L[i] || 1)); out[0] = lerp(a[0], b[0], u); out[1] = lerp(a[1], b[1], u); return tot; }
          d -= L[i];
        }
        return tot;
      };

      ctx.onFrame((t) => {
        setFrameGlobals(t);
        // layers that only matter for a few frames leave the compositor otherwise (a blend-mode layer costs every frame)
        const fOn = t < 0.1 ? '' : 'none', sOn = t > T_S0 ? '' : 'none';
        if (flash.style.display !== fOn) flash.style.display = fOn;
        if (scrim.style.display !== sOn) scrim.style.display = sOn;
        // stage: punch + shake (decays by ~0.3 s) + the -10 deg -> 0 turn round GC
        const amp = 15 * Math.exp(-t / 0.075) * (t < 0.4 ? 1 : 0);
        const sx = amp * nz(t * 38, 1.7), sy = amp * nz(3.1, t * 38);
        // the turn is applied inside the particle canvas (a CSS rotate of the full-frame stage is costly to composite;
        // the SVG marks are round, or not on screen until the turn has settled)
        const rot = -10 * (1 - eo(clamp01(t / 0.6))) * Math.PI / 180;
        stage.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${punch.s.toFixed(4)})`;

        // shock ring: opens from r 200; a 6 px core and a 60 px halo
        const su = clamp01(t / 0.55);
        if (su < 1) {
          const e = eo(su), r0 = (200 + 1150 * e).toFixed(1), fo = Math.pow(1 - su, 1.6);
          shock.setAttribute('r', r0); shockH.setAttribute('r', r0);
          shock.setAttribute('stroke-width', (6 * Math.pow(1 - su, 0.8) + 1).toFixed(2));
          shock.setAttribute('opacity', (0.95 * fo).toFixed(3));
          shockH.setAttribute('stroke-width', (60 * (1 - 0.5 * su)).toFixed(1));
          shockH.setAttribute('opacity', fo.toFixed(3));
          const e2 = eo(clamp01((t - 0.05) / 0.6));
          shock2.setAttribute('r', (120 + 900 * e2).toFixed(1));
          shock2.setAttribute('opacity', t > 0.05 ? (0.6 * Math.pow(1 - clamp01((t - 0.05) / 0.6), 1.4)).toFixed(3) : '0');
        } else { shock.setAttribute('opacity', '0'); shockH.setAttribute('opacity', '0'); shock2.setAttribute('opacity', '0'); }

        // ---- compute this frame's light (pure in t): cores, particle trails, heads, packets
        const lp = 1 - clamp01((t - 0.833) / 0.067);       // the light cores ride on hot into the lock (fade 0.833 -> 0.9)
        const lpH = lp;                                     // and so do the heads
        coreN = 0;
        if (lpH > 0) {
          const x = Math.min(t, T_LOCK) / T_LOCK, hd = headOf(x);
          const ua = Math.max(-0.2, hd - 0.2);
          for (const st of streams) {
            const pts = cores[coreN++];
            pts.df = depthB(sDep[st.si]) * lp; pts.dh = depthB(sDep[st.si]) * lpH;
            for (let q = 0; q <= CNS; q++) { centre(st, ua + (hd - ua) * q / CNS, tmpB); pts[2 * q] = tmpB[0]; pts[2 * q + 1] = tmpB[1]; }
            const tr = traces[coreN - 1];
            for (let q = 0; q <= TRN; q++) { centre(st, headOf(x - TRS * (1 - q / TRN) / T_LOCK), tmpB); tr[2 * q] = tmpB[0]; tr[2 * q + 1] = tmpB[1]; }
          }
        }
        // lock-frame streaks: each stream's path over its last ~2 frames of approach (at least ~200 px, so it
        // reads past the token), as a centreline + half-width per sample
        if (t >= T_LOCK && t < T_LOCK + 0.02) {
          for (const st of streams) {
            // walk back from the node until the streak is long enough (<= 0.12 s)
            let tb = T_LOCK, len = 0; centre(st, 1, tmpA);
            for (let n = 1; n <= 36; n++) {
              tb = T_LOCK - n * 0.12 / 36; centre(st, headOf(tb / T_LOCK), tmpB);
              len += Math.hypot(tmpB[0] - tmpA[0], tmpB[1] - tmpA[1]); tmpA[0] = tmpB[0]; tmpA[1] = tmpB[1];
              if (T_LOCK - tb >= 2 / FPS - 1e-9 && len >= 200) break;
            }
            const u0 = headOf(tb / T_LOCK), sk = streaks[st.si];
            for (let q = 0; q <= STK; q++) {
              const j = centre(st, u0 + (1 - u0) * q / STK, tmpB);
              sk[4 * q] = tmpB[0]; sk[4 * q + 1] = tmpB[1]; sk[4 * q + 2] = st.NX[j]; sk[4 * q + 3] = st.NY[j];
            }
          }
        }
        for (let b = 0; b < BK; b++) fronts[b].length = 0;
        heads.length = 0;
        const snapping = t > T_S0;
        const holding = t >= T_LOCK + 0.02 && !snapping;
        const su2 = snapU(t), fadeP = 1 - 0.6 * su2;
        const inFlight = t < T_LOCK, lockF = t >= T_LOCK && t < T_LOCK + 0.02;
        // shutters: in flight per stream from its head speed (px / frame); from T_LOCK - 2 f at most 0.75 f of
        // travel; on the lock frame no trails at all (the particles sit under the tokens; one streak per stream
        // replaces the 340 coincident trails); hold / snap as in v3
        const dtHold = t < T_LOCK + 0.02 ? DT : snapping ? DT * 0.9 : DT * 0.25;
        for (const st of streams) {
          const si = st.si;
          if (!inFlight) { jS[si] = lockF ? 0 : J; dtS[si] = dtHold; continue; }   // lock frame: no particle trails
          const x = t / T_LOCK;
          centre(st, headOf(x), tmpA); centre(st, headOf(x - 1 / FPS / T_LOCK), tmpB);
          const v = Math.max(1, Math.hypot(tmpA[0] - tmpB[0], tmpA[1] - tmpB[1]));   // px per frame
          let d = Math.min(2.5 * DT, Math.max(DT, 140 / (v * FPS)));
          if (t >= T_LOCK - 2 / FPS - 1e-6) d = Math.min(d, 0.75 / FPS);
          dtS[si] = d; jS[si] = Math.max(5, Math.min(JMAX, Math.ceil(v * FPS * d / 30)));
        }
        // stacked trails: as the tails collapse into the heads, the coincident strokes would sum to white
        const trailA = inFlight ? 1 / (1 + 8 * sm(0.75, 0.9, t)) : 1;
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          if (p.flow && su2 > 0.25) continue;            // the data dashes leave with the hairlines
          const d0 = pos(p, t, tmpA);
          const x0 = tmpA[0], y0 = tmpA[1];
          const br = t < T_LOCK ? Math.min(1, p.b * p.bk) * (0.62 + 0.38 * d0) * depthB(sDep[p.st.si]) : p.b * (0.62 + 0.38 * d0);
          const lvl = Math.max(0, Math.min(BK - 1, Math.floor(br * BK)));
          const seg = p.buf, Jp = jS[p.st.si], dt = dtS[p.st.si]; seg[0] = x0; seg[1] = y0; seg.n = Jp;
          for (let j = 1; j <= Jp; j++) { pos(p, t - dt * j / Jp, tmpB); seg[2 * j] = tmpB[0]; seg[2 * j + 1] = tmpB[1]; }
          fronts[lvl].push(seg);
          if (lvl >= 3 || holding) heads.push(x0, y0, Math.min(1, br * 1.1) * fadeP, holding ? 0.5 : 0.35 + 0.45 * br);
        }
        const r = nodeR(t);
        const sc = r / R_END;
        const P = {};
        KEYS.forEach((k) => { P[k] = nodePos(k, t, [0, 0]); });
        // packets on the beat (1.25 -> 1.65): three, chasing round the triangle
        pktN = 0;
        const pu = (t - T_BEAT) / 0.4;
        if (pu > 0 && pu < 1) {
          const q = p2io(pu), qp = p2io(Math.max(0, pu - 0.5 / FPS / 0.4));
          for (let n = 0; n < 3; n++) {
            const f0 = n / 3, pk = pkts[pktN++];
            const tot = loopPt(P, f0 + q, tmpA);
            const back = Math.max(40 / tot, q - qp);           // trail: at least 40 px, else the last half frame
            for (let sgi = 0; sgi <= PNS; sgi++) { loopPt(P, f0 + q - back * sgi / PNS, tmpB); pk[2 * sgi] = tmpB[0]; pk[2 * sgi + 1] = tmpB[1]; }
          }
        }

        // ---- paint it twice: full res, and straight into the quarter-res bloom buffer (no full-res readback)
        const c = Math.cos(rot), sn = Math.sin(rot);
        const ex = GC[0] - c * GC[0] + sn * GC[1], ey = GC[1] - sn * GC[0] - c * GC[1];
        const paint = (gx, k, bloomPass) => {
          gx.setTransform(1, 0, 0, 1, 0, 0);
          gx.globalCompositeOperation = 'source-over'; gx.globalAlpha = 1; gx.filter = 'none';
          gx.clearRect(0, 0, W * k, H * k);
          gx.setTransform(c * k, sn * k, -sn * k, c * k, ex * k, ey * k);
          gx.globalCompositeOperation = 'lighter';
          gx.lineCap = 'round'; gx.lineJoin = 'round';
          // light cores: a 30 px glow, a 10 px body and a 3.5 px amberLight filament, hot at the head, fading to the tail
          const CW = [30, 10, 3.5], CA = [0.16, 0.3, 0.95];
          if (!bloomPass) {
            // orbit traces: 1.5 px at .8 over the whole 0.7 s (the three lanes read as an orbit diagram); only the
            // oldest quarter fades out, so a trace never ends on a hard stub
            gx.lineWidth = 1.5; gx.lineCap = 'butt';
            for (let n = 0; n < coreN; n++) {
              const tr = traces[n], df = cores[n].df;
              if (df <= 0.002) continue;
              for (let sg = 0; sg < 8; sg++) {
                const q0 = sg * TRN / 8, q1 = (sg + 1) * TRN / 8;
                gx.beginPath(); gx.moveTo(tr[2 * q0], tr[2 * q0 + 1]);
                for (let q = q0 + 1; q <= q1; q++) gx.lineTo(tr[2 * q], tr[2 * q + 1]);
                gx.strokeStyle = `rgba(${amberRGB},${(0.8 * Math.min(1, (sg + 0.5) / 2) * df).toFixed(3)})`; gx.stroke();
              }
            }
            gx.lineCap = 'round';
          }
          // the lock frame: one tapered streak per stream, filled (6 px at the node down to 0 at the tail end),
          // amber -> amberLight, at most .8
          if (t >= T_LOCK && t < T_LOCK + 0.02) {
            for (let n = 0; n < 3; n++) {
              const sk = streaks[n];
              gx.beginPath();
              for (let q = 0; q <= STK; q++) { const w = 3 * Math.pow(q / STK, 0.8); gx.lineTo(sk[4 * q] + sk[4 * q + 2] * w, sk[4 * q + 1] + sk[4 * q + 3] * w); }
              for (let q = STK; q >= 0; q--) { const w = 3 * Math.pow(q / STK, 0.8); gx.lineTo(sk[4 * q] - sk[4 * q + 2] * w, sk[4 * q + 1] - sk[4 * q + 3] * w); }
              gx.closePath();
              const gr = gx.createLinearGradient(sk[0], sk[1], sk[4 * STK], sk[4 * STK + 1]);
              gr.addColorStop(0, `rgba(${amberRGB},0)`); gr.addColorStop(0.3, `rgba(${amberRGB},0.4)`); gr.addColorStop(0.65, `rgba(${lightRGB},0.75)`); gr.addColorStop(1, `rgba(${lightRGB},0.8)`);
              gx.fillStyle = gr; gx.fill();
            }
          }
          for (let n = 0; n < coreN; n++) {
            const pts = cores[n];
            for (let pass = bloomPass ? 1 : 0; pass < 3 && pts.df > 0.002; pass++) {
              gx.lineWidth = CW[pass] * (pass < 2 ? wMul : 1);
              for (let sg = 0; sg < CSEG; sg++) {
                gx.beginPath();
                const q0 = sg * CNS / CSEG, q1 = (sg + 1) * CNS / CSEG;
                gx.moveTo(pts[2 * q0], pts[2 * q0 + 1]);
                for (let q = q0 + 1; q <= q1; q++) gx.lineTo(pts[2 * q], pts[2 * q + 1]);
                const ramp = Math.pow((sg + 1) / CSEG, 1.8) * pts.df;
                gx.strokeStyle = `rgba(${pass === 2 ? lightRGB : amberRGB},${(CA[pass] * ramp).toFixed(3)})`;
                gx.stroke();
              }
            }
            // the comet head
            const hs = (bloomPass ? 1.3 : 1) * (1 + 0.15 * (pts.dh - 0.85)) * wMul, hd2 = HSP * hs;
            gx.globalAlpha = Math.min(1, pts.dh); gx.drawImage(hspr, pts[2 * CNS] - hd2 / 2, pts[2 * CNS + 1] - hd2 / 2, hd2, hd2); gx.globalAlpha = 1;
          }
          // trails: front part at the bucket alpha, tail fainter and thinner (the trail tapers)
          for (let b = 0; b < BK; b++) {
            const list = fronts[b]; if (!list.length) continue;
            const a = (0.1 + 0.62 * (b / (BK - 1))) * fadeP * trailA, rgb = b < 2 ? deepRGB : amberRGB;
            // front: samples 0 .. 40% of the trail; tail: the rest (with J 5: 0..2 and 2..5, as in v3)
            gx.beginPath();
            for (const sgm of list) { const jf = Math.floor(sgm.n * 0.4); gx.moveTo(sgm[0], sgm[1]); for (let q = 1; q <= jf; q++) gx.lineTo(sgm[2 * q], sgm[2 * q + 1]); }
            gx.strokeStyle = `rgba(${rgb},${a.toFixed(3)})`; gx.lineWidth = 1.2 + 0.36 * b; gx.stroke();
            if (bloomPass) continue;
            gx.beginPath();
            for (const sgm of list) { const jf = Math.floor(sgm.n * 0.4); gx.moveTo(sgm[2 * jf], sgm[2 * jf + 1]); for (let q = jf + 1; q <= sgm.n; q++) gx.lineTo(sgm[2 * q], sgm[2 * q + 1]); }
            gx.strokeStyle = `rgba(${rgb},${(a * 0.45).toFixed(3)})`; gx.lineWidth = 0.8 + 0.2 * b; gx.stroke();
          }
          // heads: soft sprites
          for (let q = 0; q < heads.length; q += 4) dot(gx, heads[q], heads[q + 1], heads[q + 2], heads[q + 3]);
          // packets
          for (let n = 0; n < pktN; n++) {
            const pk = pkts[n];
            gx.globalAlpha = 1; gx.lineWidth = 3;
            for (let sgi = 0; sgi < PNS; sgi++) {
              gx.beginPath(); gx.moveTo(pk[2 * sgi], pk[2 * sgi + 1]); gx.lineTo(pk[2 * sgi + 2], pk[2 * sgi + 3]);
              gx.strokeStyle = `rgba(${lightRGB},${(0.9 * (1 - sgi / PNS)).toFixed(3)})`; gx.stroke();
            }
            dot(gx, pk[0], pk[1], 1, 1.5);
          }
          gx.globalAlpha = 1;
          gx.setTransform(1, 0, 0, 1, 0, 0);
        };
        paint(g, 1, false);
        // bloom: the quarter-res light, blurred (4 px here = 16 px at full res), added back at .7
        paint(og, 0.25, true);
        og2.setTransform(1, 0, 0, 1, 0, 0); og2.globalCompositeOperation = 'source-over'; og2.filter = 'none';
        og2.clearRect(0, 0, BW, BH);
        og2.filter = 'blur(4px)'; og2.drawImage(offCv, 0, 0); og2.filter = 'none';
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.7; g.drawImage(offCv2, 0, 0, W, H); g.globalAlpha = 1;
        g.globalCompositeOperation = 'source-over';

        const pop = t >= T_LOCK ? 1 + 0.3 * (1 - eo(clamp01((t - T_LOCK) / 0.3))) : 1;
        // lock flash: discs amberLight -> amber over 4 frames
        const lf = clamp01((t - T_LOCK) / (4 / FPS));
        const discFill = t >= T_LOCK && lf < 1 ? lerpHex(C.amberLight, C.amber, p2o(lf)) : C.amber;
        KEYS.forEach((k) => {
          const T = toks[k];
          T.g.setAttribute('opacity', tokP.a.toFixed(3));
          T.g.setAttribute('transform', `translate(${P[k][0].toFixed(2)} ${P[k][1].toFixed(2)}) scale(${(sc * pop).toFixed(4)})`);
          T.disc.setAttribute('fill', discFill);
        });
        KEYS.forEach((k, i) => {
          // lock ring: from r x 1.4 beyond the popped disc (so it reads on the lock frame), 4 px
          const u = (t - T_LOCK) / 0.5;
          if (u < 0 || u > 1) rings[i].setAttribute('opacity', '0');
          else {
            rings[i].setAttribute('cx', P[k][0].toFixed(1)); rings[i].setAttribute('cy', P[k][1].toFixed(1));
            rings[i].setAttribute('r', (r * (pop + 0.4 + 1.6 * eo(u))).toFixed(1));
            rings[i].setAttribute('stroke-width', (4 * (1 - u) + 0.8).toFixed(2));
            rings[i].setAttribute('opacity', (0.95 * Math.pow(1 - u, 1.3)).toFixed(3));
          }
          // the beat ring
          const v = (t - T_BEAT) / 0.45;
          if (v < 0 || v > 1) rings2[i].setAttribute('opacity', '0');
          else {
            rings2[i].setAttribute('cx', P[k][0].toFixed(1)); rings2[i].setAttribute('cy', P[k][1].toFixed(1));
            rings2[i].setAttribute('r', (r * (1.3 + 1.6 * eo(v))).toFixed(1));
            rings2[i].setAttribute('stroke-width', (3 * (1 - v) + 0.8).toFixed(2));
            rings2[i].setAttribute('opacity', (0.85 * Math.pow(1 - v, 1.3)).toFixed(3));
          }
        });
        const dr = eo(clamp01((t - T_LOCK) / 0.22));
        const fade = 1 - clamp01((t - T_S0) / (T_S1 - T_S0 - 2 / FPS));
        const hf = t >= T_BEAT && t < T_BEAT + 3 / FPS;            // the beat: hairlines flash for 3 frames
        for (const hl of hairs) {
          if (dr <= 0) { hl.el.setAttribute('stroke-dasharray', '0 2'); continue; }
          const A = P[hl.a], B = P[hl.b];
          const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
          const gap = r * pop + 12;
          const ax = A[0] + dx / L * gap, ay = A[1] + dy / L * gap, bx = B[0] - dx / L * gap, by = B[1] - dy / L * gap;
          hl.el.setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)} L${bx.toFixed(1)} ${by.toFixed(1)}`);
          hl.el.setAttribute('stroke-dasharray', `${dr.toFixed(4)} 2`);
          hl.el.setAttribute('opacity', fade.toFixed(3));
          hl.el.setAttribute('stroke', hf ? C.amberLight : C.amber);
          hl.el.setAttribute('stroke-width', hf ? '2.5' : '1.5');
          hl.el.setAttribute('stroke-opacity', hf ? '1' : '0.8');
        }
      });
    },
  });
})();
