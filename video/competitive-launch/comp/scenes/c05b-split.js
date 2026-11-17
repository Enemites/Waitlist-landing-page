/* c05b-split (film 30.0-36.0, local 0 = 30.0): "The same challenge. Another approach."
 * SPLIT SCREEN on the brand slant: the STORM CITY (comp/lib/world-city.js) twice, divided by a seam that
 * leans Brand.SLANT (34 deg) off the vertical, through the frame centre. The camera (yaw 24.4, pitch 42.4)
 * puts the city's north-south avenues parallel to the seam, so the seam reads as one more avenue.
 * Left = ATLAS (amber), right = VEGA (red-orange). Both halves start identical (same world, same start, same
 * objective, the same lightning); then each team draws its own plan.
 *
 *   0.00  hard cut on a lightning strike (both halves): the seam opens from the centre (a hot ink line,
 *         then both halves wipe out from it, expo.out 0.7 s) while both cameras pull out (zoom 1.5 -> 1.12).
 *   0.30  eyebrows ATLAS · PLAN (left, diamond) / VEGA · PLAN (right, ring); identical slugs at the foot.
 *   0.50  start pillars pop (Atlas diamond / Vega ring, same street corner); 0.75 the objective ring (both).
 *   1.40  (w08 'The same challenge') ATLAS draws start -> power plant (power2.inOut, lands 2.2): the plant
 *         powers up (towers glow, steam lit), pulse ring, callout 01 SECURE POWER.
 *   1.50  VEGA rushes: three arrows fan out to the three bridges at once (expo.out, land 2.1), the bridges
 *         ping red-orange, callout 01 RUSH THE BRIDGES.
 *   2.74  (w08 'Another approach') the cameras whip apart in mirror (yaw -/+ 8 deg, expo.inOut 0.6 s) and
 *         each half takes its team's tint; Atlas goes on plant -> east bridge -> objective (lands 3.6),
 *         Vega's three arrows cross and converge on the objective (land 3.25). Callouts 02.
 *   3.25 / 3.60  the objective pings in each half as its plan arrives. Hold: dashes march, rain.
 *   4.50  a second strike, both halves at once (same world).
 *   5.50-5.93  the seam slams shut (both halves collapse into it, power3.in, cameras push in); the seam
 *         flashes on 5.93 and is gone on the last frame.
 */
(function () {
  'use strict';
  const ID = 'c05b-split';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const SL = (B.SLANT || 34) * Math.PI / 180;
  const U = [Math.sin(SL), -Math.cos(SL)];          // up the seam (leaning right)
  const NL = [-Math.cos(SL), -Math.sin(SL)];        // normal toward the left (Atlas) half
  const CEN = [960, 540];
  const GAP = 12;                                    // the seam band (px)
  const HALF_X = 480;                                // each half's camera target sits 480 px off centre
  const MONO = '"JetBrains Mono Variable", monospace';
  const T_PLAN = 1.4, T_V = 1.5, T_ANOTHER = 2.74, T_CLOSE = 5.5;
  const STRIKES = [0.02, 4.5];

  Film.scene({
    id: ID,
    duration: 6,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`[data-scene="${ID}"] { background: ${C.bg}; }
        [data-scene="${ID}"] .c5-eb { position:absolute; top:96px; display:flex; align-items:center; gap:16px; font: 500 22px/1 var(--mono); letter-spacing:.14em; text-transform:uppercase; white-space:pre; text-shadow: 0 0 8px rgba(11,12,14,.9), 0 0 18px rgba(11,12,14,.8); }
        [data-scene="${ID}"] .c5-eb .ic { width:14px; height:14px; flex:none; }
        [data-scene="${ID}"] .c5-slug { position:absolute; top:968px; font: 500 20px/1 var(--mono); letter-spacing:.12em; color:${C.muted3}; text-transform:uppercase; white-space:pre; text-shadow: 0 0 8px rgba(11,12,14,.9); }`);

      // ---- the two cities ----
      const open = { L: 0, R: 0, slide: 1 };
      const band = (g, side, R) => {
        // the half between the seam band and the opening front (R px from the seam)
        const s = side === 'L' ? 1 : -1, a = GAP / 2, b = Math.max(a + 0.01, R);
        const P = (k, d) => [CEN[0] + s * NL[0] * d + U[0] * k, CEN[1] + s * NL[1] * d + U[1] * k];
        const p = [P(-1600, a), P(1600, a), P(1600, b), P(-1600, b)];
        g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < 4; i++) g.lineTo(p[i][0], p[i][1]); g.closePath();
      };
      const camBase = { tx: -46, ty: 74, zoom: 1.12, yaw: 24.4, pitch: 42.4 };
      const strikes = STRIKES.map((t) => ({ t, x: -80, y: -202, z: 440 }));
      const mk = (side) => WorldCity.create(ctx, {
        cam: Object.assign({}, camBase, { sx: side === 'L' ? -HALF_X : HALF_X, sy: 0 }),
        clip: (g) => band(g, side, side === 'L' ? open.L : open.R),
        cull: side === 'L' ? [0, 0, CEN[0] + 380, H] : [CEN[0] - 380, 0, W, H],
        strikes, rainSeed: 'c05b-' + side,
        look: { fog: 0.5, power: 0.3, tintCol: side === 'L' ? C.amber : C.rival },
      });
      const L = mk('L'), R = mk('R');
      const M = L.M, sx = M.streetX, sy = M.streetY;
      for (const c of [L, R]) {
        c.district('southwest').lit = 0.15; c.district('northeast').lit = 0.4; c.district('farsouth').lit = 0.3; c.district('quay-west').lit = 0.7;
      }

      // ---- opening / closing (the seam) ----
      tl.fromTo(open, { L: 0, R: 0 }, { L: 1500, R: 1500, duration: 0.7, ease: 'expo.out' }, 0.04);
      tl.to(open, { L: 0, R: 0, duration: 0.43, ease: 'power3.in' }, T_CLOSE);
      // cameras: pull out on the open, slow push, mirror whip on 'Another', push into the seam on the close
      for (const [c, s] of [[L, -1], [R, 1]]) {
        tl.fromTo(c.cam, { zoom: 1.55, sx: s * HALF_X - s * 90 }, { zoom: 1.12, sx: s * HALF_X, duration: 0.8, ease: 'expo.out' }, 0);
        tl.to(c.cam, { zoom: 1.2, duration: T_ANOTHER - 0.8, ease: 'sine.inOut' }, 0.8);
        tl.to(c.cam, { yaw: 24.4 + s * 8, tx: -46 + s * 30, duration: 0.6, ease: 'expo.inOut' }, T_ANOTHER - 0.1);
        tl.to(c.cam, { zoom: 1.27, yaw: 24.4 + s * 10, duration: T_CLOSE - T_ANOTHER - 0.5, ease: 'sine.inOut' }, T_ANOTHER + 0.5);
        tl.to(c.cam, { zoom: 1.75, sx: s * HALF_X * 0.55, duration: 0.45, ease: 'power3.in' }, T_CLOSE);
        tl.fromTo(c.look, { tint: 0 }, { tint: 1, duration: 0.6, ease: 'power2.out' }, T_ANOTHER);
      }

      // ---- markers (identical in both halves) ----
      const P0 = M.POINTS.start, OB = M.POINTS.objective;
      const marks = {};
      for (const [c, side] of [[L, 'L'], [R, 'R']]) {
        const team = side === 'L' ? 'atlas' : 'vega';
        const st = c.marker({ kind: team, x: P0[0], y: P0[1], h: 70 });
        const sr = c.marker({ kind: 'start', x: P0[0], y: P0[1], r: 18, color: side === 'L' ? C.amber : C.rival });
        const ob = c.marker({ kind: 'objective', x: OB[0], y: OB[1], r: 36, h: 0, color: C.bone });
        tl.fromTo(st, { grow: 0, a: 0 }, { grow: 1, a: 1, duration: 0.5, ease: 'expo.out' }, 0.5);
        tl.fromTo(sr, { ring: 0, a: 0 }, { ring: 1, a: 1, duration: 0.45, ease: 'back.out(2)' }, 0.5);
        tl.fromTo(ob, { ring: 0, a: 0 }, { ring: 1, a: 1, duration: 0.5, ease: 'back.out(1.8)' }, 0.75);
        tl.fromTo(ob, { pulse: 0 }, { pulse: 1, duration: 0.9, ease: 'none' }, 0.8);
        marks[side] = { st, sr, ob };
      }

      // ---- plans ----
      // Atlas: start -> plant (secure power first) -> east bridge -> objective
      const atlas = L.route({ color: C.amber, light: C.amberLight, width: 4, pts: [P0, [sx(10), sy(12)], [sx(10), sy(11)], [sx(11), sy(11)], [sx(11), sy(8)], [sx(9), sy(8)], [sx(9), OB[1]]] });
      const uPlant = (() => { let best = 0, bd = Infinity; for (let i = 0; i < atlas.pts.length; i++) { const d = Math.hypot(atlas.pts[i][0] - sx(10), atlas.pts[i][1] - sy(11)); if (d < bd) { bd = d; best = atlas.cum[i] / atlas.L; } } return best; })();
      tl.fromTo(atlas.p, { draw: 0 }, { draw: uPlant, duration: 0.8, ease: 'power2.inOut' }, T_PLAN);
      tl.to(atlas.p, { draw: 1, duration: 0.86, ease: 'power2.inOut' }, T_ANOTHER);
      // Vega: three arrows, one per bridge, then on to the objective
      const vegaPaths = [
        [P0, [sx(7), sy(12)], [sx(7), sy(8)], [sx(9) - 40, sy(8)]],
        [P0, [sx(9), OB[1] + 70]],
        [P0, [sx(11), sy(12)], [sx(11), sy(8)], [sx(9) + 40, sy(8)]],
      ];
      const vega = vegaPaths.map((pts) => R.route({ color: C.rival, light: C.rivalLight, width: 4, pts, dash: [14, 9] }));
      const bridgeU = vega.map((h, k) => {
        const bx = [sx(7), sx(9), sx(11)][k], by = M.riverY(bx) - 70;
        let best = 0, bd = Infinity; for (let i = 0; i < h.pts.length; i++) { const d = Math.hypot(h.pts[i][0] - bx, h.pts[i][1] - by); if (d < bd) { bd = d; best = h.cum[i] / h.L; } } return best;
      });
      vega.forEach((h, k) => {
        tl.fromTo(h.p, { draw: 0 }, { draw: bridgeU[k], duration: 0.6, ease: 'expo.out' }, T_V + k * 0.04);
        tl.to(h.p, { draw: 1, duration: 0.5, ease: 'power3.inOut' }, T_ANOTHER + 0.02 * k);
      });
      // plan beats: the plant powers up (Atlas), the bridges ping (Vega)
      const plantRing = L.marker({ kind: 'start', x: sx(10) + 6, y: sy(11) - 6, r: 92, color: C.amber });
      tl.fromTo(plantRing, { ring: 0.6, a: 0 }, { ring: 1, a: 1, duration: 0.5, ease: 'expo.out' }, T_PLAN + 0.8);
      tl.fromTo(plantRing, { pulse: 0 }, { pulse: 1, duration: 1.0, ease: 'none' }, T_PLAN + 0.8);
      tl.fromTo(L.look, { power: 0.3 }, { power: 1, duration: 0.5, ease: 'power2.out' }, T_PLAN + 0.78);
      const bridgePings = [sx(7), sx(9), sx(11)].map((bx, k) => {
        const m = R.marker({ kind: 'start', x: bx, y: M.riverY(bx), r: 22, color: C.rival });
        const tHit = T_V + 0.32 + k * 0.04;
        tl.fromTo(m, { ring: 0, a: 0 }, { ring: 1, a: 1, duration: 0.35, ease: 'back.out(2.2)' }, tHit);
        tl.fromTo(m, { pulse: 0 }, { pulse: 1, duration: 0.8, ease: 'none' }, tHit);
        return m;
      });
      // the objective pings as each plan arrives
      tl.fromTo(marks.R.ob, { pulse: 0 }, { pulse: 1, duration: 0.9, ease: 'none', immediateRender: false }, T_ANOTHER + 0.52);
      tl.fromTo(marks.L.ob, { pulse: 0 }, { pulse: 1, duration: 0.9, ease: 'none', immediateRender: false }, T_ANOTHER + 0.86);
      void bridgePings;

      // ---- callouts (drawn into each half's canvas: clipped with it) ----
      const callouts = [];
      const callout = (city, o) => { const c = Object.assign({ p: { a: 0, u: 0 } }, o); callouts.push(c); return c; };
      const coA1 = callout(L, { at: [sx(10) - 60, sy(12) - 20, 0], text: 'SECURE POWER', num: '01', col: C.amber, dx: -250, dy: 30 });
      const coA2 = callout(L, { at: [sx(11), M.riverY(sx(11)), 0], text: 'EAST BRIDGE', num: '02', col: C.amber, dx: 70, dy: 70 });
      const coV1 = callout(R, { at: [sx(7), M.riverY(sx(7)) + 20, 0], text: 'RUSH THE BRIDGES', num: '01', col: C.rival, dx: -250, dy: 150 });
      const coV2 = callout(R, { at: [sx(9) + 40, sy(8) - 10, 0], text: 'CONVERGE', num: '02', col: C.rival, dx: 120, dy: -60 });
      const coOL = callout(L, { at: [OB[0], OB[1], 0], text: 'OBJECTIVE', num: '', col: C.bone, dx: -210, dy: -40 });
      const coOR = callout(R, { at: [OB[0], OB[1], 0], text: 'OBJECTIVE', num: '', col: C.bone, dx: -210, dy: -40 });
      for (const [c, t] of [[coOL, 0.85], [coOR, 0.85], [coA1, T_PLAN + 0.82], [coV1, T_V + 0.4], [coV2, T_ANOTHER + 0.4], [coA2, T_ANOTHER + 0.3]]) {
        tl.fromTo(c.p, { a: 0, u: 0 }, { a: 1, u: 1, duration: 0.45, ease: 'power2.out' }, t);
        tl.to(c.p, { a: 0, duration: 0.2, ease: 'none' }, T_CLOSE);
      }
      const drawCallouts = (city) => (g, lt) => {
        for (const c of callouts) {
          if (c.city !== city || c.p.a <= 0.001) continue;
          const [ax, ay] = city.toScreen(c.at[0], c.at[1], c.at[2]);
          const ex = ax + c.dx, ey = ay + c.dy;
          const k = c.p.u, A = c.p.a;
          // leader: from the anchor to the label, then a short underline
          g.setTransform(1, 0, 0, 1, 0, 0);
          g.lineCap = 'round';
          const mx = lerp(ax, ex, k), my = lerp(ay, ey, k);
          g.beginPath(); g.moveTo(ax, ay); g.lineTo(mx, my);
          g.strokeStyle = B.rgba(c.col, 0.85 * A); g.lineWidth = 1.6; g.stroke();
          g.beginPath(); g.arc(ax, ay, 3.2, 0, Math.PI * 2); g.fillStyle = B.rgba(c.col, A); g.fill();
          const txt = B.scrambleFrame('', (c.num ? c.num + '  ' : '') + c.text, clamp(k * 1.25, 0, 1), { time: k * 0.45 });
          g.font = `500 21px ${MONO}`; g.letterSpacing = '2.6px';
          const tw = g.measureText((c.num ? c.num + '  ' : '') + c.text).width;
          const left = c.dx < 0, tx = left ? ex - tw - 10 : ex + 10, ty = ey + 7;
          g.beginPath(); g.moveTo(ex, ey); g.lineTo(left ? ex - (tw + 10) * k : ex + (tw + 10) * k, ey);
          g.strokeStyle = B.rgba(c.col, 0.55 * A); g.lineWidth = 1.2; g.stroke();
          g.fillStyle = 'rgba(11,12,14,0.72)'; g.fillRect(tx - 8, ey - 26, tw + 16, 26);
          g.globalAlpha = A;
          if (c.num) {
            const head = txt.slice(0, Math.min(txt.length, c.num.length));
            g.fillStyle = c.col; g.fillText(head, tx, ty - 8);
            g.fillStyle = C.ink; g.fillText(txt.slice(head.length), tx + g.measureText(head).width, ty - 8);
          } else { g.fillStyle = c.col; g.fillText(txt, tx, ty - 8); }
          g.globalAlpha = 1;
        }
      };
      coA1.city = L; coA2.city = L; coOL.city = L; coV1.city = R; coV2.city = R; coOR.city = R;
      L.draw(drawCallouts(L)); R.draw(drawCallouts(R));

      // ---- the seam (SVG over both halves) ----
      const sv = ctx.svg('svg', { class: 'brand-svg', style: 'position:absolute;left:0;top:0;z-index:5' });
      const P = (k, d) => [CEN[0] + NL[0] * d + U[0] * k, CEN[1] + NL[1] * d + U[1] * k];
      const seam = { len: 0, flash: 0, a: 1 };
      const gapPoly = ctx.svg('polygon', { fill: C.bg }, sv);
      const lineA = ctx.svg('line', { stroke: C.amber, 'stroke-width': 2.5 }, sv);
      const lineV = ctx.svg('line', { stroke: C.rival, 'stroke-width': 2.5 }, sv);
      const hot = ctx.svg('line', { stroke: C.ink, 'stroke-width': 4, 'stroke-linecap': 'round' }, sv);
      tl.fromTo(seam, { len: 0 }, { len: 1, duration: 0.22, ease: 'expo.out' }, 0);
      tl.fromTo(seam, { flash: 1 }, { flash: 0, duration: 0.3, ease: 'power2.out' }, 0);
      tl.to(seam, { flash: 1, duration: 0.05, ease: 'none' }, T_CLOSE + 0.38);
      tl.to(seam, { len: 0, duration: 0.07, ease: 'power2.in' }, T_CLOSE + 0.43);
      ctx.onFrame(() => {
        const Lh = 700 * seam.len;
        const g0 = P(-Lh, GAP / 2), g1 = P(Lh, GAP / 2), g2 = P(Lh, -GAP / 2), g3 = P(-Lh, -GAP / 2);
        gapPoly.setAttribute('points', [g0, g1, g2, g3].map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));
        const setL = (el, a, b) => { el.setAttribute('x1', a[0].toFixed(1)); el.setAttribute('y1', a[1].toFixed(1)); el.setAttribute('x2', b[0].toFixed(1)); el.setAttribute('y2', b[1].toFixed(1)); };
        setL(lineA, g0, g1); setL(lineV, g3, g2);
        setL(hot, P(-Lh, 0), P(Lh, 0));
        hot.setAttribute('stroke-opacity', seam.flash.toFixed(3));
        hot.setAttribute('stroke-width', (3 + 9 * seam.flash).toFixed(2));
        sv.style.display = seam.len < 0.001 ? 'none' : '';
      });

      // ---- type ----
      const eyebrow = (side, text, at) => {
        const col = side === 'L' ? C.amber : C.rival;
        const el = ctx.el('div', 'c5-eb', root, `<svg class="ic" viewBox="-8 -8 16 16">${side === 'L' ? `<rect x="-5" y="-5" width="10" height="10" fill="${col}" transform="rotate(45)"/>` : `<circle r="5.2" fill="none" stroke="${col}" stroke-width="2.6"/>`}</svg><span class="tx"></span>`);
        el.style.color = col;
        if (side === 'L') el.style.left = '120px'; else { el.style.right = '120px'; el.style.flexDirection = 'row-reverse'; }
        const tx = el.querySelector('.tx');
        tl.fromTo(el.querySelector('.ic'), { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }, at);
        B.scrambleTo(tl, tx, text, at + 0.05, 0.5);
        tl.to(el, { opacity: 0, duration: 0.15, ease: 'none' }, T_CLOSE);
        return el;
      };
      eyebrow('L', 'ATLAS · PLAN', 0.3);
      eyebrow('R', 'VEGA · PLAN', 0.36);
      for (const side of ['L', 'R']) {
        const el = ctx.el('div', 'c5-slug', root, '');
        if (side === 'L') el.style.left = '120px'; else el.style.right = '120px';
        B.scrambleTo(tl, el, 'STORM CITY · SAME START', 0.45, 0.5);
        tl.to(el, { opacity: 0, duration: 0.15, ease: 'none' }, T_CLOSE);
      }
    },
  });
})();
