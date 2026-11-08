/* x10-formation (film 46.0-48.0): revision v3 insert, FORMATION. Local 0 = 46.0 = THE DROP (the
 * film's one low hit). Hides s10's 'Coordinate.' card. Spec: docs/revision-v3.md.
 *
 * 0.00 (46.0) THE HIT: hard cut out of s09's silence onto a black field with a dot grid. The impact
 *      frame: a shock ring bursts from the formation centre, an amber bloom, the grid kicks, the
 *      frame punches in (1.05 -> 1) and shakes (decays in ~0.3 s), and three particle streams are
 *      already in flight from three edges (JK from the top, EK from the left, NC from the bottom),
 *      motion-blurred.
 *      A full-frame additive flash (amberLight .45 -> 0 by 0.1), the shock ring opens at r 200 (6 px
 *      core + 60 px halo), the ribbons are 1.6x wide on the hit frame and ease back by 0.2, and the stage
 *      turns -10 deg -> 0 round the formation centre (0-0.6, expo.out) for camera energy.
 * 0.00-0.90 the streams (300 particles each, deterministic) spiral in on a speed ramp (fast entry, a
 *      short slow braid 46.3-46.45, then a long whip dive onto the nodes). JK and EK turn clockwise
 *      over the top, NC counter-clockwise up the right, all three orbit at the same radius (300), so NC
 *      crosses JK (~46.2) and then EK (~46.55): a braid, NC over JK, then under EK (the depth cue: the
 *      front arm brighter and wider). Light, not straw: trails add ('lighter'), heads are soft sprites,
 *      each ribbon has a light core (3 px amberLight + 18 px at 10%), and a half-res bloom pass
 *      (blur 8 px, 'lighter' at .55) makes dense areas glow. The cores fade out 0.767-0.867.
 * 0.90 (46.9) LOCK: the streams stop dead on three nodes (JK, NC, EK tokens) - the discs flash
 *      amberLight -> amber (4 f), 4 px rings burst from r x 1.4, THE NODE's ring and glow on JK,
 *      hairlines draw between them.
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
  const TAU = Math.PI * 2;
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

  // particle streams: entry point (just off an edge), turning direction (+1 clockwise on screen) and a
  // phase lag (deg, enveloped by sin(pi u) so the ends stay put). JK (from the top) and EK (from the left)
  // arc clockwise over the top; NC (from the bottom) runs counter-clockwise up the right. Same braid
  // radius; JK runs ~80 deg ahead of EK so the two never merge, and NC cuts through JK (~0.15) and then EK (~0.55).
  const STREAM = {
    jk: { E: [860, -150], dir: 1, rhoB: 300, phi: 18 },
    nc: { E: [1300, 1230], dir: -1, rhoB: 300, phi: 5 },
    ek: { E: [-150, 430], dir: 1, rhoB: 300, P: 2.4, phi: 0 },
  };
  // depth (-1 back .. 0 neutral .. 1 front): NC passes OVER JK at the first crossing (~0.13) and UNDER EK
  // at the second (~0.58); the front arm is brighter and wider, the back arm dims
  const sm = (a, b, t) => { const v = Math.min(1, Math.max(0, (t - a) / (b - a))); return v * v * (3 - 2 * v); };
  const depthOf = (si, t) => si === 1 ? 1 - 2 * sm(0.22, 0.48, t) : si === 0 ? -1 + sm(0.18, 0.36, t) : sm(0.36, 0.52, t);
  const depthB = (d) => (d >= 0 ? 0.85 + 0.15 * d : 0.85 + 0.5 * d);
  const NP = 340;
  const BC = [1180, 570];                  // the braid turns round this point (centre-right, low enough that the top arc clears the frame)
  // the stream head's path parameter over x = t / T_LOCK: a speed ramp (fast entry, a slower braid,
  // a whip into the lock), monotone cubic Hermite
  const HK = [[0, 0.3, 2.0], [0.22, 0.62, 0.8], [0.5, 0.72, 0.4], [1, 1, 1.6]];
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
      const rng = ctx.rng('x10-formation');
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
      const wrap = (v) => ((v % TAU) + TAU) % TAU;
      const streams = KEYS.map((k, si) => {
        const S = STREAM[k];
        const [hx, hy] = HOLD[k];
        const thN = Math.atan2(hy - BC[1], hx - BC[0]), rhoN = Math.hypot(hx - BC[0], hy - BC[1]);
        const th0 = Math.atan2(S.E[1] - BC[1], S.E[0] - BC[0]), rho0 = Math.hypot(S.E[0] - BC[0], S.E[1] - BC[1]);
        const sweep = S.dir > 0 ? wrap(thN - th0) : -wrap(th0 - thN);
        return { k, si, th0, rho0, thN, rhoN, sweep, rhoB: S.rhoB, P: S.P || 1.8, phi: (S.phi || 0) * Math.PI / 180 };
      });
      const parts = [];
      for (const st of streams) {
        for (let i = 0; i < NP; i++) {
          const flow = rng() < 0.12;                     // these run along the hairlines in the hold
          parts.push({
            st, flow,
            lag: 0.42 * Math.pow(rng(), 1.45),             // position behind the stream head (path units; dense at the head)
            ph: rng() * TAU,                              // helix phase
            a: 0.12 + 0.88 * rng(),                       // ribbon offset factor
            w0: 90 + 70 * rng(),                          // ribbon half-width at entry
            b: 0.4 + 0.6 * rng(),                         // brightness
            orb: 12 + 48 * Math.pow(rng(), 1.5),          // hold orbit radius (a tight swarm)
            om: (rng() < 0.5 ? -1 : 1) * (0.7 + 2.2 * rng()),
            a0: rng() * TAU,
            edge: Math.floor(rng() * 2), f0: rng(), fv: 0.35 + 0.5 * rng(),
          });
        }
      }
      const TWIST = TAU * 0.8, U_B = 0.8;
      // radius: in from the edge to the braid orbit (rhoB) by U_B, then the dive onto the node
      const rhoOf = (st, u) => {
        if (u < 0) return st.rho0 - u * 2400;                          // not yet in: straight out beyond the entry point
        if (u < U_B) return st.rhoB + (st.rho0 - st.rhoB) * Math.pow(1 - u / U_B, st.P);
        const v = (u - U_B) / (1 - U_B); return st.rhoB + (st.rhoN - st.rhoB) * v * v * (3 - 2 * v);
      };
      const drhoOf = (st, u) => {
        if (u < 0) return -2400;
        if (u < U_B) return -(st.rho0 - st.rhoB) * st.P * Math.pow(1 - u / U_B, st.P - 1) / U_B;
        const v = (u - U_B) / (1 - U_B); return (st.rhoN - st.rhoB) * 6 * v * (1 - v) / (1 - U_B);
      };
      const tmpA = [0, 0], tmpB = [0, 0];
      // centreline of a stream at path parameter u (u < 0: still beyond the edge)
      function centre(st, u, out) {
        const om = 1 - u;
        const uc = Math.max(u, 0);
        const th = st.th0 + st.sweep * uc + st.phi * Math.sin(Math.PI * Math.min(uc, 1));
        const weave = 60 * Math.pow(Math.max(0, Math.sin(Math.PI * clamp01(u))), 1.2) * Math.sin(TAU * 1.25 * u + st.si * 2.1);
        const rho = rhoOf(st, Math.min(u, 1)) + weave;
        out[0] = BC[0] + rho * Math.cos(th); out[1] = BC[1] + rho * Math.sin(th);
        return [th, rho, om];
      }
      // in-flight position of a particle at path parameter u: the centreline + a twisting ribbon offset
      function flight(p, u, out) {
        const st = p.st;
        const [th, rho, om] = centre(st, u, out);
        const c = Math.cos(th), s = Math.sin(th);
        const drho = drhoOf(st, Math.min(u, 1));
        const sw = u < 0 ? 0 : st.sweep;
        const tx = drho * c - rho * sw * s, ty = drho * s + rho * sw * c;
        const tl2 = Math.hypot(tx, ty) || 1;
        const hel = p.ph + TWIST * u;
        const off = p.w0 * wMul * (1 + 0.12 * sDep[st.si]) * (1 - Math.pow(clamp01(u), 2.5)) * p.a * Math.cos(hel);
        out[0] += (-ty / tl2) * off; out[1] += (tx / tl2) * off;
        return Math.sin(hel);   // depth cue (-1 back .. 1 front)
      }
      // per-frame globals set at the top of onFrame (pure functions of t): the hit's ribbon width, the arm depths
      let wMul = 1;
      const sDep = [0, 0, 0];
      const setFrameGlobals = (t) => {
        wMul = 1 + 0.6 * (1 - p2o(clamp01(t / 0.2)));
        for (let i = 0; i < 3; i++) sDep[i] = depthOf(i, t);
      };
      const compress = (x) => { const v = clamp01((x - 0.55) / 0.45); return v * v * (3 - 2 * v); };
      const uOf = (p, t) => { const x = t / T_LOCK; return headOf(x) - p.lag * (1 - compress(x)); };
      // position of particle p at time t (any t: in flight, hold or snap)
      function pos(p, t, out) {
        if (t < T_LOCK) return flight(p, uOf(p, t), out);
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
      const BW = W / 4, BH = H / 4;      // quarter-res bloom buffer (blur 4 px here = 16 px at full res)
      const offCv = document.createElement('canvas'); offCv.width = BW; offCv.height = BH;
      const og = offCv.getContext('2d');
      const offCv2 = document.createElement('canvas'); offCv2.width = BW; offCv2.height = BH;
      const og2 = offCv2.getContext('2d');

      // trail sampling: J samples back over DT (shutter); front half and tail half go to separate buckets (taper)
      const J = 5, DT = 0.07;
      for (const p of parts) p.buf = new Float64Array(2 * J + 2);     // trail samples, reused every frame
      const BK = 6;
      const fronts = Array.from({ length: BK }, () => []);
      const amberRGB = '239,189,112', lightRGB = '246,211,159', deepRGB = '163,122,66';
      const heads = [];          // x, y, alpha, scale
      const dot = (gx, x, y, a, s) => { const d = SPR * s; gx.globalAlpha = a; gx.drawImage(spr, x - d / 2, y - d / 2, d, d); };
      // per-frame scratch (reused; filled from t each frame): light-core polylines, packet trails
      const CNS = 48, CSEG = 8, PNS = 8;
      const cores = [0, 1, 2].map(() => new Float64Array(2 * CNS + 2)); let coreN = 0;
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
        const lp = 1 - clamp01((t - 0.767) / 0.1);         // the light cores fade out 0.767 -> 0.867
        coreN = 0;
        if (lp > 0) {
          const x = Math.min(t, T_LOCK) / T_LOCK, hd = headOf(x);
          const ua = Math.max(-0.1, hd - 0.4);
          for (const st of streams) {
            const pts = cores[coreN++];
            pts.df = depthB(sDep[st.si]) * lp;
            for (let q = 0; q <= CNS; q++) { centre(st, ua + (hd - ua) * q / CNS, tmpB); pts[2 * q] = tmpB[0]; pts[2 * q + 1] = tmpB[1]; }
          }
        }
        for (let b = 0; b < BK; b++) fronts[b].length = 0;
        heads.length = 0;
        const snapping = t > T_S0;
        const holding = t >= T_LOCK + 0.02 && !snapping;
        const su2 = snapU(t), fadeP = 1 - 0.6 * su2;
        // shutter drag: in the slow braid the shutter opens (up to 2x) so the trails keep their length
        const xs = Math.min(t, T_LOCK) / T_LOCK, slope = (headOf(xs + 0.01) - headOf(xs - 0.01)) / 0.02;
        const drag = Math.min(2, Math.max(1, 0.8 / Math.max(0.05, slope)));
        const dt = t < T_LOCK + 0.02 ? DT * drag : snapping ? DT * 0.9 : DT * 0.25;
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          if (p.flow && su2 > 0.25) continue;            // the data dashes leave with the hairlines
          const d0 = pos(p, t, tmpA);
          const x0 = tmpA[0], y0 = tmpA[1];
          const br = p.b * (0.62 + 0.38 * d0) * (t < T_LOCK ? depthB(sDep[p.st.si]) : 1);
          const lvl = Math.max(0, Math.min(BK - 1, Math.floor(br * BK)));
          const seg = p.buf; seg[0] = x0; seg[1] = y0;
          for (let j = 1; j <= J; j++) { pos(p, t - dt * j / J, tmpB); seg[2 * j] = tmpB[0]; seg[2 * j + 1] = tmpB[1]; }
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
          // light cores: 18 px glow at 10% + 3 px amberLight, bright at the head, fading to the tail
          for (let n = 0; n < coreN; n++) {
            const pts = cores[n];
            for (let pass = bloomPass ? 1 : 0; pass < 2; pass++) {
              gx.lineWidth = pass === 0 ? 18 * wMul : 3;
              for (let sg = 0; sg < CSEG; sg++) {
                gx.beginPath();
                const q0 = sg * CNS / CSEG, q1 = (sg + 1) * CNS / CSEG;
                gx.moveTo(pts[2 * q0], pts[2 * q0 + 1]);
                for (let q = q0 + 1; q <= q1; q++) gx.lineTo(pts[2 * q], pts[2 * q + 1]);
                const ramp = Math.pow((sg + 1) / CSEG, 1.6) * pts.df;
                gx.strokeStyle = pass === 0 ? `rgba(${amberRGB},${(0.13 * ramp).toFixed(3)})` : `rgba(${lightRGB},${(0.85 * ramp).toFixed(3)})`;
                gx.stroke();
              }
            }
          }
          // trails: front part at the bucket alpha, tail fainter and thinner (the trail tapers)
          for (let b = 0; b < BK; b++) {
            const list = fronts[b]; if (!list.length) continue;
            const a = (0.1 + 0.62 * (b / (BK - 1))) * fadeP, rgb = b < 2 ? deepRGB : amberRGB;
            gx.beginPath();
            for (const sgm of list) { gx.moveTo(sgm[0], sgm[1]); gx.lineTo(sgm[2], sgm[3]); gx.lineTo(sgm[4], sgm[5]); }
            gx.strokeStyle = `rgba(${rgb},${a.toFixed(3)})`; gx.lineWidth = 1.2 + 0.36 * b; gx.stroke();
            if (bloomPass) continue;
            gx.beginPath();
            for (const sgm of list) { gx.moveTo(sgm[4], sgm[5]); for (let q = 6; q < sgm.length; q += 2) gx.lineTo(sgm[q], sgm[q + 1]); }
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
