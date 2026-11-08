/* s09-last-seen (film 44-46 s, bar 23.1-24.1). Local 0 = 44.0. BREATH #2.
 * Invisible cut from s08: the same hook screen (Match.state 494, HOOK, river phase continuous,
 * THE NODE's 43.5 pulse still expanding). The clock holds 08:14. The only near-still shot.
 * 0.00 the camera pushes HOOK -> GHOST (zoom 0.96 -> 1.6 on (1060,640), power1.out, 2.0 s); everything
 *      but the ghost dims over 0.6 s: the world under one radial-hole div (transparent r ~160 px
 *      around the ghost, #0b0c0e 60% outside), the UI to 30% (dark plates over the panels and the
 *      score pill, opacity on the bare topbar / signal). The fog drifts in from the right.
 *      The push throws the Atlas side of the map toward the chrome (EK onto the topbar, the gate
 *      ring and THE NODE against the roster), so every world mark except the ghost, its label, the
 *      Vega triangles and their route fades out over 0.1-0.7 (tokens, THE NODE, Atlas routes, pump,
 *      conduit, gate + ring, crossing, cone): the ghost owns the frame. The ground (terrain, river,
 *      fog) stays, under the dims; everything world-side stays under the chrome.
 * 0.25 'LAST SEEN 0:20' re-scrambles beside the ghost (left) at 24 px, bone (screen-space); the
 *      other map labels have cleared by 0.35.
 * 0.50 the ghost's dashed ring starts to turn (12 deg/s).
 * 1.00 (45.0) the music is gone; one tick; the ghost triangle flickers (.45 -> .12 -> .3, 4 f).
 * 1.50 (45.5) the dashed ring steps 15 deg and its stroke pulses 70 -> 100 -> 70% (9 f).
 * 2.00 (46.0) hard cut out of the silence into s10's low hit.
 */
(function () {
  'use strict';
  const ID = 's09-last-seen';
  const C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  function rectOf(el, root) {
    let x = 0, y = 0, e = el;
    while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }

  Film.scene({
    id: ID,
    duration: 2,
    build(ctx) {
      const tl = ctx.tl;
      const io2 = gsap.parseEase('power2.inOut'), sio = gsap.parseEase('sine.inOut');
      const M = Match.buildMatchScreen(ctx, {
        m: 494,                                  // final hook state; the clock holds 08:14
        tau: (lt) => 3.5 + lt,                   // river phase continues from s08 (tau 3.5 at 44.0)
        camera: 'HOOK',
        raise: [],                               // nothing above the dim: only the ghost is spared
      });
      const U = M.U, F = M.F, L = M.L;
      M.camera.move(0, 2.0, 'GHOST', 'power1.out');

      // THE NODE stays on JK (it slides out of focus under the push); its 43.5 pulse continues
      const N = NodeMark.create(ctx, { parent: F.el.nodeG, x: 684, y: 484, size: 2, pulses: [-0.5, 1.0] });

      // ---- dims (0 -> 1 over 0.0-0.6)
      const D = { v: 0 };
      tl.fromTo(D, { v: 0 }, { v: 1, duration: 0.6, ease: 'power2.inOut' }, 0);
      // world: one radial-hole div between the world and the chrome
      const hole = ctx.el('div', 's09-hole', ctx.root);
      Object.assign(hole.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none', opacity: 0 });
      ctx.root.insertBefore(hole, L.chrome);
      // UI: dark plates over the panels (opaque panels stay opaque) and the score pill
      const plate = (el, parent, rad) => {
        const r = rectOf(el, ctx.root), d = ctx.el('div', 's09-plate', parent);
        Object.assign(d.style, { position: 'absolute', left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', borderRadius: rad + 'px', background: C.bg, opacity: 0 });
        return d;
      };
      const plates = [plate(U.roster, U.root, 18), plate(U.channel, U.root, 18), plate(U.objective, U.root, 18), plate(M.score.el, L.top, 16)];
      const bare = [U.topbar, U.signal];

      // ---- the ghost
      const ghost = F.el.ghost;
      const gRing = ghost.querySelector('circle'), gTri = ghost.querySelector('path');
      const lsWorld = F.el.labels.lastSeen;
      // screen-space 'LAST SEEN 0:20' beside the ghost, 24 px bone, above the dims
      const LS = 'LAST SEEN 0:20';
      const ls = ctx.el('div', 's09-ls', ctx.root, '');
      ctx.root.insertBefore(ls, L.lift);
      Object.assign(ls.style, { position: 'absolute', font: '500 24px/24px var(--mono)', letterSpacing: '.12em', color: C.bone, whiteSpace: 'pre' });
      ls.textContent = LS; const lsW = ls.offsetWidth; ls.textContent = '';   // fixed left edge while it types

      const fogCx = +F.el.fog.getAttribute('cx');

      // world marks that clear out under the push (everything but the ghost, its label, the Vega
      // triangles and their route). Plain marks take the fade as their opacity; marks whose opacity
      // Match.state sets every frame (Atlas routes, the cone) are multiplied after it; the objective
      // ring through its progress alpha.
      const K = M.K;
      const plainMarks = [F.el.tokens.jk, F.el.tokens.nc, F.el.tokens.ek, F.el.nodeG, F.el.pump, F.el.conduit, F.el.gate, F.el.ringTrack, F.el.crossing];
      // (only marks state re-sets on every frame at m = 494, so the product never compounds)
      const stateMarks = [K.routes.JK.g, K.routes.NC.g, K.routes.EK.g, F.el.cone];

      M.pre((lt) => {
        N.p.x = M.pos.jk[0]; N.p.y = M.pos.jk[1];
        // clear the Atlas side of the map (0.1 -> 0.7, with the dims)
        const wf = 1 - io2(clamp01((lt - 0.1) / 0.6));
        const ws = wf >= 0.999 ? '1' : wf.toFixed(3);
        for (const e of plainMarks) if (e.getAttribute('opacity') !== ws) e.setAttribute('opacity', ws);
        for (const e of stateMarks) {
          const a = e.getAttribute('opacity'), v = (a == null ? 1 : +a) * wf;
          e.setAttribute('opacity', v >= 0.999 ? '1' : v.toFixed(3));
        }
        F.progress.alpha = wf;
        // the world label hands over to the screen-space one at 0.25
        const lw = 1 - clamp01((lt - 0.25) / 0.1);
        lsWorld.setAttribute('opacity', lw.toFixed(3));
        // the other map labels clear out as the push starts (they would slide under the score pill)
        const lo = (1 - clamp01(lt / 0.35)).toFixed(3);
        for (const k of ['gate', 'pump', 'crossing']) { const g = F.el.labels[k]; if (g && g.getAttribute('opacity') !== lo) g.setAttribute('opacity', lo); }
        // the fog band drifts in from the right over the bar (~60 px on screen)
        F.el.fog.setAttribute('cx', (fogCx - 34 * sio(clamp01(lt / 2))).toFixed(2));
        // ring: turns from 0.5 at 12 deg/s, +15 deg step at 1.5; stroke pulse 70 -> 100 -> 70% (9 f)
        const ang = 12 * Math.max(0, lt - 0.5) + (lt >= 1.5 ? 15 : 0);
        gRing.setAttribute('transform', `rotate(${ang.toFixed(2)})`);
        const pu = (lt - 1.5) / (9 / FPS);
        const so = pu >= 0 && pu <= 1 ? 0.7 + 0.3 * (pu < 0.4 ? pu / 0.4 : 1 - (pu - 0.4) / 0.6) : 0.7;
        gRing.setAttribute('stroke-opacity', so.toFixed(3));
        // triangle flicker at 1.0 (4 frames): .12, .3, .12, then .3
        const f = Math.floor((lt - 1.0) * FPS + 1e-6);
        const tri = lt < 1.0 - 1e-6 ? 0.45 : f === 0 ? 0.12 : f === 1 ? 0.3 : f === 2 ? 0.12 : 0.3;
        gTri.setAttribute('fill-opacity', String(tri));
      });

      ctx.onFrame((lt) => {
        const d = D.v;
        const [gx, gy] = F.toScreen(1060, 640);
        // world hole: transparent to r 120, full 60% from r 210 (a soft r ~160 hole), easing to 80%
        // toward the frame edges so the tokens the push throws to the corners stay quiet
        hole.style.opacity = d > 0.001 ? d.toFixed(3) : '0';
        hole.style.background = `radial-gradient(circle at ${gx.toFixed(1)}px ${gy.toFixed(1)}px, rgba(11,12,14,0) 0px, rgba(11,12,14,0) 120px, rgba(11,12,14,0.6) 210px, rgba(11,12,14,0.6) 520px, rgba(11,12,14,0.8) 1000px)`;
        // UI to 30%
        const pv = (0.7 * d).toFixed(3);
        for (const p of plates) if (p.style.opacity !== pv) p.style.opacity = pv;
        const bv = (1 - 0.7 * d).toFixed(3);
        for (const b of bare) if (b.style.opacity !== bv) b.style.opacity = bv;
        // LAST SEEN beside the ghost, on its left (the channel panel is on the right while the
        // camera travels): right edge = ring radius (22 product units on screen) + 22 px gap
        const zr = 22 * M.F.T.state.zoom * Match.S;
        ls.style.left = (gx - zr - 22 - lsW).toFixed(1) + 'px';
        ls.style.top = (gy - 12).toFixed(1) + 'px';
        const s = lt >= 0.25 ? Match.scramble(LS, (lt - 0.25) / 0.4, 's09-ls', 'in') : '';
        if (ls.textContent !== s) ls.textContent = s;
      });
    },
  });
})();
