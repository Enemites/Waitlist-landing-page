/* s11-the-match (film 52-56 s, bars 27.1-29.1). Local 0 = 52.0. THE PEAK.
 * Eight hard cuts, one per beat, on ONE living map (the shared kit: Match.state(m), m = 488 - lt,
 * clock 487 - floor(lt): 08:07 at 52.0 ... 08:04 at 55.0, where it stops). Every cut is a camera
 * preset set directly (presets[floor(lt / 0.5)], no tween); every micro-move peaks on its cut frame.
 * No headline type: only the map's own labels, the score pill and the slug. Ours solid amber,
 * theirs dashed red-orange.
 *
 * 0.00 M1 WIDE (800,500) 0.80: both plans; the Vega triangles slide 40 px toward the Crossing.
 * 0.50 M2 EMRE (920,420) 2.2: EK's pulse ring fires, his watch cone flares 12 -> 20 -> 12%.
 * 1.00 M3 PUMP 1.8, GRID-CELL CUT #1 (2 frames of A-L x 01-08 checkerboard): NC at the pump
 *      with a pulsing 'RESTORING' tag (mono 22 px amber), JK heading back to cover him; the red
 *      triangle lunges in from frame right.
 * 1.50 M4 JULES 2.4, a NODE MATCH CUT (THE NODE holds screen (1080,540) as the frame punches in):
 *      JK advances along the reroute while a runner dash travels it, the node pulses.
 * 2.00 M5 GATE (800,560) 2.2: the 62% arc glows, the gate bars flicker once (steps).
 * 2.50 M6 VEGA 2.4, the red triangle on the left third with the gate ahead of it: it edges forward
 *      16 px, a red runner dash travels its route to the gate.
 * 3.00 M7 CROSSING (1004,396) 2.4, GRID-CELL CUT #2: the upper Vega triangle edges toward the bridge,
 *      EK's cone holds, 'CONTESTED' pulses.
 * 3.50 M8 SCORE: world hidden; a DOM macro of the score pill at 2.2x, centred, flap on 08:04.
 * 4.00 hard cut into s12's review fold.
 */
(function () {
  'use strict';
  const ID = 's11-the-match';
  const C = Brand.C;
  const W = 1920, H = 1080, FPS = 30, S = 1.5;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;

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
    duration: 4,
    build(ctx) {
      const tl = ctx.tl;
      const po2 = gsap.parseEase('power2.out'), io2 = gsap.parseEase('power2.inOut'), so = gsap.parseEase('sine.inOut');
      const CAM = Match.CAM, K15 = 1.5;
      // The cut plan changes scale or subject side on every beat so no two neighbouring shots read as
      // a jump cut:  M1 wide 0.80 | M2 EK 2.2 | M3 pump, mid 1.8 | M4 JK 2.4 | M5 gate 2.2 |
      //              M6 triangle 2.4 (left third, heading for the gate) | M7 crossing 2.4
      // M3 -> M4 is a NODE MATCH CUT: THE NODE holds screen (1080, 540) while the frame punches in 1.33x.
      // (a preset that puts product point (px, py) on screen (sx, sy) at zoom z)
      const at = (px, py, sx, sy, z) => ({ x: px - (sx - W / 2) / (z * K15), y: py - (sy - H / 2) / (z * K15), zoom: z });
      const jk = Match.route('JK_REROUTE').at(0.1);                       // JK through M3 (m 487 -> 486.5)
      // M3 PUMP: NC + the pump on the left, JK heading back to cover him, the triangle lunging in from
      // frame right (clear of the HUD corner)
      const M3 = at(jk.x, jk.y, 1080, 540, 1.8);
      const M4 = at(jk.x, jk.y, 1080, 540, 2.4);
      const tri = Match.route('VEGA_PUMP').at(0.3845);                     // the resolved triangle at M6
      const M6 = at(tri.x, tri.y, 700, 560, 2.4);
      const PRESETS = [CAM.M1, CAM.M2, M3, M4, CAM.M5, M6, CAM.M7];

      const M = Match.buildMatchScreen(ctx, {
        m: (lt) => Math.max(484, 488 - lt),
        tau: (lt) => 11.5 + lt,                    // river phase continues from s10
        pulses: [],
        camera: CAM.M1,
        res: 2,                                    // every preset zoom <= 2.4 on the res-2 shared bake
        clock: (lt) => (lt < 0 ? 488 : Math.max(484, 487 - Math.floor(lt + 1e-6))),
        clockMinT: -0.2,                           // 08:08 -> 08:07 settles on the first cut frame
      });
      const U = M.U, F = M.F, K = M.K, L = M.L, SC = M.score;
      PRESETS.forEach((p, i) => { if (i) M.camera.cut(i * 0.5, p); });
      gsap.set([U.topbar, U.signal, U.roster, U.channel, U.objective], { autoAlpha: 0 });

      // ours solid amber, theirs dashed red-orange: our live plan (the reroute) is drawn solid, so it
      // reads clearly under Vega's dashed route in the shared corridor to the pump (the settled
      // trails stay dashed at 32%)
      ['JK_REROUTE', 'JK_COMMIT'].forEach((n) => K.routes[n].line.removeAttribute('stroke-dasharray'));
      // a soft dark corner behind the slug so it reads over close-ups
      const corner = ctx.el('div', 's11-corner', ctx.root);
      Object.assign(corner.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse 820px 250px at 340px 1030px, rgba(11,12,14,.84) 0%, rgba(11,12,14,.62) 45%, rgba(11,12,14,0) 100%)' });
      ctx.root.insertBefore(corner, L.top);

      // ---- THE NODE rides JK; size step on the cuts where JK is in frame; pulses: s10's 51.0 pulse
      // continues, then one on M4
      const N = NodeMark.create(ctx, { parent: F.el.nodeG, x: 684, y: 484, size: 2, pulses: [-1.0, 1.5] });
      N.step(0).step(1.0).step(1.5).step(2.0);
      M.pre(() => { N.p.x = M.pos.jk[0]; N.p.y = M.pos.jk[1]; });

      // ---- M2: EK's pulse ring (below the token) and the cone flare
      const ekPulse = ctx.svg('circle', { r: 19, fill: 'none', stroke: C.amberLight, 'stroke-width': 1.4, opacity: 0 }, F.el.nodeG);
      // ---- M3: 'RESTORING' tag beside NC (screen space), a pulsing dot + mono 22 px amber
      const tag = ctx.el('div', 's11-tag', L.world, '<i></i><span>RESTORING</span>');
      Object.assign(tag.style, { position: 'absolute', left: 0, top: 0, display: 'none', alignItems: 'center', gap: '12px', font: '600 22px/22px var(--mono)', letterSpacing: '.12em', color: C.amber, whiteSpace: 'pre',
        padding: '9px 14px 9px 12px', borderRadius: '8px', background: 'rgba(15,13,10,.86)', border: '1px solid rgba(239,189,112,.38)' });
      const tagDot = tag.querySelector('i');
      tag.style.display = 'flex'; const tagW = tag.offsetWidth; tag.style.display = 'none';
      Object.assign(tagDot.style, { width: '10px', height: '10px', borderRadius: '50%', background: C.amber, flex: 'none' });
      // ---- runner dashes (M4 ours, M6 theirs): one bright dash travelling the route
      const runner = (name, col) => ctx.svg('path', { d: Match.ROUTES[name], fill: 'none', stroke: col, 'stroke-width': 3.6, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '0.08 3', opacity: 0 }, F.el.routesG);
      const runA = runner('JK_REROUTE', C.amberLight), runV = runner('VEGA_PUMP', C.rivalLight);
      // ---- M5: arc glow halo
      const halo = ctx.svg('circle', { cx: 800, cy: 560, r: 64, fill: 'none', stroke: C.amberLight, 'stroke-width': 12, opacity: 0, transform: 'rotate(-90 800 560)', pathLength: 100, 'stroke-dasharray': '62 100', 'stroke-linecap': 'round' }, F.wg);
      F.wg.insertBefore(halo, F.el.ring);

      // ---- M8: charcoal plate + faint board grid behind the macro pill (above the world)
      const plate = ctx.el('div', 's11-plate', ctx.root);
      Object.assign(plate.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', background: C.bg, display: 'none' });
      ctx.root.insertBefore(plate, L.top);
      const pg = ctx.svg('svg', { class: 'brand-svg' }, plate);
      for (let c = 1; c < 12; c++) ctx.svg('line', { x1: c * 160, y1: 0, x2: c * 160, y2: H, stroke: C.amber, 'stroke-opacity': 0.045, 'stroke-width': 1 }, pg);
      for (let r = 1; r < 8; r++) ctx.svg('line', { x1: 0, y1: r * 135, x2: W, y2: r * 135, stroke: C.amber, 'stroke-opacity': 0.045, 'stroke-width': 1 }, pg);

      // ---- GRID-CELL CUTS (1.00 and 3.00): a 12 x 8 lattice (A-L x 01-08) over the new framing.
      // Frame 1: alternate cells charcoal; frame 2: the other alternate cells; frame 3: clear.
      const gridL = ctx.svg('svg', { class: 'brand-svg s11-gridcut', style: 'display:none' });
      ctx.root.insertBefore(gridL, L.top);
      const cellsA = ctx.svg('g', {}, gridL), cellsB = ctx.svg('g', {}, gridL);
      for (let c = 0; c < 12; c++) for (let r = 0; r < 8; r++) ctx.svg('rect', { x: c * 160, y: r * 135, width: 160, height: 135, fill: C.bg }, (c + r) % 2 ? cellsB : cellsA);
      const gl = ctx.svg('g', { stroke: C.amber, 'stroke-opacity': 0.3, 'stroke-width': 1 }, gridL);
      for (let c = 1; c < 12; c++) ctx.svg('line', { x1: c * 160, y1: 0, x2: c * 160, y2: H }, gl);
      for (let r = 1; r < 8; r++) ctx.svg('line', { x1: 0, y1: r * 135, x2: W, y2: r * 135 }, gl);

      // ---- M8 score macro geometry (the pill keeps its DOM text; scaled 2.2x about its centre)
      const pillH = SC.el.offsetHeight, pillTop = SC.top;
      const SETTLE = [-0.6, 0.16, -0.06, 0.02];      // a flap rolling down onto 08:04, then the settle
      const lastReel = M.clock.reels[3];

      const crossSub = F.el.labels.crossing.sub;
      const frameOf = (lt) => Math.round(lt * FPS);

      ctx.onFrame((lt) => {
        const f = frameOf(lt), shot = Math.min(7, Math.floor(lt / 0.5 + 1e-6));
        safeLabels(M, 110, 150, 1810, 960);

        // M2: EK pulse (0.5 s, r 19 -> 2.2x) + cone flare 12 -> 20 -> 12%
        const ep = (lt - 0.5) / 0.5;
        if (ep >= 0 && ep < 1) { ekPulse.setAttribute('cx', M.pos.ek[0].toFixed(2)); ekPulse.setAttribute('cy', M.pos.ek[1].toFixed(2)); ekPulse.setAttribute('r', (19 * (1 + 1.2 * po2(ep))).toFixed(2)); ekPulse.setAttribute('opacity', (0.7 * (1 - ep)).toFixed(3)); }
        else if (ekPulse.getAttribute('opacity') !== '0') ekPulse.setAttribute('opacity', '0');
        const cf = ep >= 0 && ep < 1 ? Math.sin(Math.PI * clamp01(ep / 0.8)) : 0;
        F.el.cone.setAttribute('fill-opacity', (0.12 + 0.08 * cf).toFixed(3));

        // M3: RESTORING tag beside NC, the dot pulses on 8ths
        if (shot === 2) {
          const [nx, ny] = F.toScreen(M.pos.nc[0], M.pos.nc[1]);
          const rr = 19 * M.T.state.zoom * S;
          tag.style.display = 'flex';
          tag.style.transform = `translate(${(nx - rr - 18 - tagW).toFixed(1)}px, ${(ny - 21).toFixed(1)}px)`;   // beside him, on the clear side
          tagDot.style.opacity = (0.35 + 0.65 * (0.5 + 0.5 * Math.cos((lt - 1.0) * Math.PI * 4))).toFixed(3);
        } else if (tag.style.display !== 'none') tag.style.display = 'none';

        // M4 / M6 runner dashes (one dash travels the route ahead of the token, power2.inOut)
        const run = (el, t0, u0, u1) => {
          const u = (lt - t0) / 0.5;
          if (u < 0 || u >= 1) { if (el.getAttribute('opacity') !== '0') el.setAttribute('opacity', '0'); return; }
          const p = lerp(u0, u1, io2(u));
          el.setAttribute('stroke-dashoffset', (-p).toFixed(4));
          el.setAttribute('opacity', (u < 0.12 ? u / 0.12 : u > 0.8 ? (1 - u) / 0.2 : 1).toFixed(3));
        };
        run(runA, 1.5, 0.14, 0.9);
        run(runV, 2.5, 0.39, 0.66);                 // from the triangle to the gate (stays in frame)

        // M5: arc glow (3 f up, 12 f down) + gate bars flicker once, in steps
        const gu = lt - 2.0;
        const g = gu >= 0 && gu < 0.5 ? (gu < 3 / FPS ? gu / (3 / FPS) : Math.max(0, 1 - (gu - 3 / FPS) / (12 / FPS))) : 0;
        halo.setAttribute('opacity', (0.34 * g).toFixed(3));
        F.el.ring.setAttribute('stroke', g > 0.02 ? C.amberLight : C.amber);
        const fb = f - 60;
        const bars = fb < 0 || fb > 14 ? 0.5 : [1, 1, 0.22, 0.22, 1, 0.95, 0.9, 0.84, 0.78, 0.72, 0.66, 0.61, 0.56, 0.52, 0.5][fb];
        F.el.gateBars.setAttribute('stroke-opacity', bars.toFixed(3));

        // M7: CONTESTED pulses (red-orange, twice on 8ths)
        const cp = lt - 3.0;
        const ck = cp >= 0 && cp < 0.5 ? Math.max(0, Math.sin(Math.PI * clamp01(cp / 0.25)), Math.sin(Math.PI * clamp01((cp - 0.25) / 0.25)) * 0.7) : 0;
        crossSub.setAttribute('fill', ck > 0.02 ? C.rivalLight : C.muted2);
        crossSub.style.opacity = ck > 0.02 ? (0.75 + 0.25 * ck).toFixed(3) : crossSub.style.opacity;

        // grid-cell cuts: frames 30/31 and 90/91
        const gc = f === 30 || f === 90 ? 1 : f === 31 || f === 91 ? 2 : 0;
        gridL.style.display = gc ? '' : 'none';
        if (gc) { cellsA.style.display = gc === 1 ? '' : 'none'; cellsB.style.display = gc === 2 ? '' : 'none'; }

        // M8: the world goes, the pill becomes the macro
        const macro = shot === 7;
        const wv = macro ? 'hidden' : '';
        if (L.world.style.visibility !== wv) { L.world.style.visibility = wv; L.hot.style.visibility = wv; }
        plate.style.display = macro ? '' : 'none';
        SC.el.style.transformOrigin = '50% 50%';
        SC.el.style.transform = macro ? `translateY(${(540 - (pillTop + pillH / 2)).toFixed(1)}px) scale(2.2)` : '';
        const fm = f - 105;
        if (macro && fm >= 0 && fm < SETTLE.length) {
          lastReel.s.style.transform = `translateY(${(SETTLE[fm] * 1.12).toFixed(3)}em)`;
          lastReel.last = '';                         // the clock rewrites its reel on the next frame
        }
      });
    },
  });
})();
