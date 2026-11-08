/* s10-coordinate-commit-adapt (film 46-52 s, bars 24.1-27.1). Local 0 = 46.0.
 * Past the hook: the match plays on from 08:14 (continuous m = 494 - lt; the clock shows
 * 493 - floor(lt): 08:13 on the hit, 08:08 at 51.0). Built on the shared kit (match.js): world,
 * score pill, THE NODE and every live mark come from Match.state(m); this scene adds the layout
 * (word card left third over a charcoal scrim, the match framed at x 1000-1800 on the right), the
 * telestrator lines, the glows, the pulses and the arrowhead pops.
 *
 * 0.00 THE ONE LOW HIT: hard cut to C1 (JK, NC, EK, the gate); the clock flips 08:14 -> 08:13;
 *      'Coordinate.' rises (150 px, 12 f expo.out). 0.50-1.25 amber hairlines JK -> NC and JK -> EK
 *      draw on twos; arrowheads pop at 1.25; THE NODE pulses on JK at 0.50. 1.75 the word exits.
 * 2.00 hard cut to C2 (JK and the gate); 'Commit.' rises. 2.25-2.90 JK_COMMIT draws ahead of him and
 *      2.50-3.50 JK advances along it to (722,512). 3.00 (49.0, half bar) hard cut to C2P, an axial punch
 *      onto JK (he holds his screen place across the cut) as the 62% arc and the gate bars glow once.
 *      3.75 the word exits.
 * 4.00 hard cut to C3 (dam, pump, ghost); 'Adapt.' rises in amber. 4.25 the LAST SEEN ghost resolves
 *      (red pulse) into a solid triangle; VEGA_PUMP draws 4.25-4.90, arrowhead pops at 4.90 and the
 *      triangle lunges along it. 5.00 (51.0, half bar) hard cut to C3P, a punch onto the pump: the red
 *      route arrives from the south-east as 5.10 JK's forward route fades; JK_REROUTE draws 5.10-5.75, its
 *      arrowhead pops at 5.75 and JK starts along it (ours solid amber, as in s11). 5.75 the word exits.
 *      From 4.00 every other route sits at ~35% (match.js ADAPT), the two lines reach the pump from
 *      different sides (Vega south-east, JK east), 50+ units apart.
 *      6.00 hard cut into s11.
 */
(function () {
  'use strict';
  const ID = 's10-coordinate-commit-adapt';
  const C = Brand.C;
  const W = 1920, H = 1080, FPS = 30, S = 1.5;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  // presets framed into the right two-thirds: product point (px, py) lands on screen (sx, 540)
  const right = (px, py, zoom, sx) => ({ x: px - (sx - W / 2) / (zoom * S), y: py, zoom });
  const C1 = right(760, 500, 1.3, 1400);   // JK, NC, EK and the gate
  const C2 = right(740, 505, 1.6, 1338);   // JK and the gate (y 520 -> 505 keeps the pump label clear of the pill;
                                           // x on 1338 keeps EK whole inside the frame)
  const C3 = right(840, 560, 1.2, 1320);   // the dam, the pump and the far-bank ghost
  // half-bar punches (round 2: the cut rate doubles after the drop; inside the zoom cap 2.4 and the res-2 bake).
  // at(): product point (px, py) lands on screen (sx, sy)
  const at = (px, py, zoom, sx, sy) => ({ x: px - (sx - W / 2) / (zoom * S), y: py - (sy - H / 2) / (zoom * S), zoom });
  // 49.0: a cut-in on JK: product (692, 498) on screen (1262, 556) moves JK only ~60 px, down-right along his own
  // arrow (1241,517 on 48.967 -> 1298,556), so the punch reads as a cut onto him, not a camera bump. The glowing
  // gate ring sits wholly inside (centre ~1610,756, r ~219), below right on the diagonal of his arrow; the pump
  // box hangs ~36 px under the score pill; NC stays under the scrim and EK leaves the frame (~16 px clear)
  const C2P = at(692, 498, 2.15, 1262, 556);
  // 51.0: onto the pump: the red route arrives from below onto NC, JK's reroute reaches the box's east side;
  // JK right. The gate is context, decisively cropped: its bar box leaves through the right edge and the ring's
  // lower arc through the bottom, both clear of the bottom-right HUD corner bracket (bar box ~60 px above it)
  const C3P = right(625, 455, 2.1, 1290);

  // world map labels fade out as they cross the title-safe edge (they are screen-constant, so a
  // close-up can push one against the frame or the HUD corners)
  function safeLabels(M, X0, Y0, X1, Y1) {
    const O = M.K.occl; if (!O) return;
    for (const lb of O.labs) {
      const [sx, sy] = M.F.toScreen(lb.anchor[0], lb.anchor[1]);
      const x0 = sx + lb.bb.x, x1 = x0 + lb.bb.width, y0 = sy + lb.bb.y, y1 = y0 + lb.bb.height;
      const v = clamp01(1 + Math.min(x0 - X0, X1 - x1, y0 - Y0, Y1 - y1) / 24);
      if (v >= 0.999) continue;
      for (const k of lb.kids) { const cur = k.style.opacity === '' ? 1 : +k.style.opacity; k.style.opacity = Math.min(cur, v).toFixed(3); }
    }
  }

  Film.scene({
    id: ID,
    duration: 6,
    build(ctx) {
      const tl = ctx.tl;
      const po2 = gsap.parseEase('power2.out'), bo = gsap.parseEase('back.out(2.2)');

      const M = Match.buildMatchScreen(ctx, {
        m: (lt) => 494 - lt,
        tau: (lt) => 5.5 + lt,                 // river phase continues from s09 (tau 5.5 at 46.0)
        pulses: [],
        camera: C1,
        res: 2,                                // close-ups (zoom 1.2-1.6) on the shared res-2 bake
        clock: (lt) => (lt < 0 ? 494 : Math.max(488, 493 - Math.floor(lt + 1e-6))),
        clockMinT: -0.2,                       // the 08:14 -> 08:13 flip settles on the hit frame
      });
      const U = M.U, F = M.F, K = M.K, L = M.L;
      M.camera.cut(2.0, C2).cut(3.0, C2P).cut(4.0, C3).cut(5.0, C3P);

      // thin match: roster, channel, objective, topbar and signal hidden; the score pill stays on the
      // top layer (above the scrim), the HUD corners and the slug stay
      gsap.set([U.topbar, U.signal, U.roster, U.channel, U.objective], { autoAlpha: 0 });
      // ours solid amber, theirs dashed red-orange (as in s11): the reroute is drawn solid. From the
      // 'Adapt.' cut (m 490) every other route steps down to ~35% (match.js), so the card reads as one red
      // move (under the ring, south of JK, onto the pump's south-east corner) and one amber answer (JK
      // north of the conduit onto the pump's east side)
      K.routes.JK_REROUTE.line.removeAttribute('stroke-dasharray');

      // ---- the charcoal scrim under the word card (#0b0c0e 94% -> 0 across x 0-1100), one div
      const scrim = ctx.el('div', 's10-scrim', ctx.root);
      Object.assign(scrim.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none',
        background: 'linear-gradient(90deg, rgba(11,12,14,.94) 0px, rgba(11,12,14,.9) 360px, rgba(11,12,14,.72) 620px, rgba(11,12,14,.36) 860px, rgba(11,12,14,.1) 1010px, rgba(11,12,14,0) 1100px)' });
      ctx.root.insertBefore(scrim, L.top);

      // ---- THE NODE rides JK; a size step on every card cut; pulses on the film's 3-beat grid
      // (global 46.5 / 48.0 / 49.5 / 51.0, given in local time so isolated renders match the film)
      const N = NodeMark.create(ctx, { parent: F.el.nodeG, x: 684, y: 484, size: 2, pulses: [0.5, 2.0, 3.5, 5.0] });
      N.step(0).step(2).step(3).step(4).step(5);
      M.pre(() => { N.p.x = M.pos.jk[0]; N.p.y = M.pos.jk[1]; });

      // ---- word cards (Manrope 620, 150 px, x 120, baseline 600)
      const card = (word, at, out, amber) => {
        const h = Brand.headline(ctx, { lines: [word], x: 120, y: 0, size: 150, at, dur: 12 / FPS, wordStagger: 0, accent: amber ? [0] : [], out: null, width: 1000 });
        // exit up, power2.in, finished on the frame before the next card cut
        tl.to(h.words[0], { yPercent: -118, duration: 7 / FPS, ease: 'power2.in' }, out);
        // put the baseline at y 600: measure it with a zero-height inline-block on the line
        const probe = ctx.el('span', '', h.lines[0]); probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        const base = probe.offsetTop + h.lines[0].offsetTop; probe.remove();
        h.el.style.top = (600 - base).toFixed(1) + 'px';
        return h;
      };
      card('Coordinate.', 0, 52 / FPS, false);
      card('Commit.', 2.0, 112 / FPS, false);
      card('Adapt.', 4.0, 172 / FPS, true);

      // ---- telestrator hairlines (C1): JK -> NC and JK -> EK, 1.5 px amber with a slight
      // hand-drawn wobble, drawn on twos 0.50-1.25; chevrons pop at 1.25
      const tele = ctx.svg('svg', { class: 'brand-svg s10-tele' }, L.world);
      const wob = ctx.noise2D('s10-tele');
      const mkTele = (to, k) => {
        const [ax, ay] = Match.screenOf(684, 484, C1), [bx, by] = Match.screenOf(to[0], to[1], C1);
        const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
        const r0 = 19 * C1.zoom * S + 14;                  // clear of both tokens
        const n = 28, pts = [];
        for (let i = 0; i <= n; i++) {
          const t = i / n, d = r0 + (len - 2 * r0) * t;
          const bow = Math.sin(t * Math.PI) * len * (k ? -0.13 : 0.035);   // a hand arc (EK's clears the gate label)
          const w = 1.5 * wob(t * 3.1, k * 7.3);
          pts.push([ax + ux * d - uy * (bow + w), ay + uy * d + ux * (bow + w)]);
        }
        const d = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
        const line = ctx.svg('path', { d, fill: 'none', stroke: C.amber, 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '0 2' }, tele);
        const e = pts[n], p = pts[n - 2], a = Math.atan2(e[1] - p[1], e[0] - p[0]) * 180 / Math.PI;
        const arrow = ctx.svg('path', { d: 'M-11 -7.5 L0 0 L-11 7.5', fill: 'none', stroke: C.amber, 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, tele);
        return { line, arrow, e, a };
      };
      const teles = [mkTele(Match.POSTS.nc, 0), mkTele(Match.POSTS.ek, 1)];

      // ---- 3.00 glow on the 62% arc + gate bars (the percentage does not change)
      const halo = ctx.svg('circle', { cx: 800, cy: 560, r: 64, fill: 'none', stroke: C.amberLight, 'stroke-width': 12, opacity: 0, transform: 'rotate(-90 800 560)', pathLength: 100, 'stroke-dasharray': '62 100', 'stroke-linecap': 'round' }, F.wg);
      F.wg.insertBefore(halo, F.el.ring);
      // ---- 4.25 the ghost resolves: one red pulse ring from the ghost position
      const gPulse = ctx.svg('circle', { cx: Match.GHOST[0], cy: Match.GHOST[1], r: 22, fill: 'none', stroke: C.rival, 'stroke-width': 1.6, opacity: 0 }, F.wg);
      F.wg.insertBefore(gPulse, F.el.nodeG);

      const env = (lt, t0, rise, fall) => { const u = lt - t0; if (u < 0 || u > rise + fall) return 0; return u < rise ? u / rise : 1 - (u - rise) / fall; };
      const pop = (lt, t0) => { const u = (lt - t0) / (6 / FPS); return u < 0 ? 0 : u >= 1 ? 1 : bo(u); };

      ctx.onFrame((lt) => {
        safeLabels(M, 110, 140, 1810, 960);
        // telestrator: on twos (the reveal steps every 2 frames), chevrons pop at 1.25
        const f2 = Math.floor(Math.round(lt * FPS) / 2) * 2 / FPS;
        const dr = clamp01((f2 - 0.5) / 0.75);
        const vis = lt < 2.0;                              // the C1 card only
        for (const T of teles) {
          T.line.style.display = vis && dr > 0 ? '' : 'none';
          T.line.setAttribute('stroke-dasharray', `${dr.toFixed(4)} 2`);
          const s = vis ? pop(lt, 1.25) : 0;
          T.arrow.setAttribute('opacity', s > 0 ? '1' : '0');
          T.arrow.setAttribute('transform', `translate(${T.e[0].toFixed(1)} ${T.e[1].toFixed(1)}) rotate(${T.a.toFixed(1)}) scale(${s.toFixed(3)})`);
        }
        // 3.00 glow: up in 3 f, down in 12 f
        const g = env(lt, 3.0, 3 / FPS, 12 / FPS);
        halo.setAttribute('opacity', (0.32 * g).toFixed(3));
        F.el.ring.setAttribute('stroke', g > 0.02 ? C.amberLight : C.amber);
        F.el.gateBars.setAttribute('stroke-opacity', (0.5 + 0.5 * g).toFixed(3));
        // ghost resolve pulse (scale 1 -> 2.2, .7 -> 0, 1.0 s)
        const pu = (lt - 4.25) / 1.0;
        if (pu >= 0 && pu <= 1) { gPulse.setAttribute('r', (22 * (1 + 1.2 * po2(pu))).toFixed(2)); gPulse.setAttribute('opacity', (0.7 * (1 - pu)).toFixed(3)); }
        else if (gPulse.getAttribute('opacity') !== '0') gPulse.setAttribute('opacity', '0');
        // arrowhead pops: VEGA_PUMP at 4.90, JK_REROUTE at 5.75 (1 -> 1.6 -> 1 over 6 f)
        for (const [name, t0] of [['VEGA_PUMP', 4.9], ['JK_REROUTE', 5.75]]) {
          const r = K.routes[name]; if (!r.vis) continue;
          const u = (lt - t0) / (6 / FPS);
          if (u < 0 || u > 1) continue;
          const s = 1 + 0.6 * (u < 0.35 ? u / 0.35 : 1 - (u - 0.35) / 0.65);
          r.arrow.setAttribute('transform', r.arrow.getAttribute('transform').replace(/ scale\([^)]*\)/, '') + ` scale(${s.toFixed(3)})`);
        }
      });
    },
  });
})();
