/* x05-iso-world (overlay, film 18.25-20.0; local 0 = 18.25). Ridgeline 3D, docs/revision-v3.md.
 * Hard cut from the flat map (s05, our route just drawn) into the same Floodgate valley as a floating
 * island of ridgelines on a 3/4 view.
 *   0.00  cut in on pitch 32: the terrain inflates out of the flat map (hs .5 -> 1, expo.out) while the
 *         camera WHIPS round (yaw -16 -> 3, expo.out, 0.5 s); the lines flash in (x1.45) and a band of
 *         light sweeps the rows far -> near. The Atlas pillar (amber diamond) shoots up.
 *   0.50-1.50  the camera keeps creeping under the hold (yaw 3 -> 11, dist 2820 -> 2480, power1.inOut):
 *         the island never stops turning, so the parallax carries the 3D read.
 *   0.00  OUR plan is already drawn, as the map's dashed route was on the last s05 frame (no rewind across the
 *         cut); its head flares on the gate (1.6 -> 1, 0.3 s).
 *   0.10  eyebrow 'FLOODGATE · TEAM CHALLENGE · 3 V 3' scrambles in top-left; ATLAS tag at the pillar.
 *   0.45  (18.70) the Vega pillar (red ring) shoots up (VEGA tag 0.5); THEIR plan draws 0.45-1.05, summit ->
 *         crossing -> gate, so both plans hold on screen together from ~19.0.
 *   1.25  (19.5) the gate fires a sonar pulse that rolls over the ground (draped rings, hidden behind the
 *         ridges) and both heads flare on the objective.
 *   1.50-1.7167  fast push into the gate (power2.in, dist 2480 -> 330, fov 30 -> 34: the gate ring ~36% of the frame), ending ON the last
 *         aired frame (19.9667); tags and eyebrow clear; hard cut to x05-versus at 20.0.
 */
(function () {
  'use strict';
  const ID = 'x05-iso-world';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const SLUG = 'REALMS · COMPETITIVE · INTERFACE CONCEPT';
  const T_V = 0.45;   // Vega's pillar, tag and plan (18.70)

  Film.scene({
    id: ID,
    duration: 1.75,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`[data-scene="${ID}"] .x5-bg { position:absolute; inset:0; background:${C.bg}; }
        [data-scene="${ID}"] .x5-scrim { position:absolute; left:0; top:860px; width:1100px; height:220px; background: radial-gradient(70% 100% at 0% 100%, rgba(11,12,14,.82), rgba(11,12,14,0)); }
        [data-scene="${ID}"] .x5-tag { position:absolute; left:0; top:0; font: 500 20px/20px var(--mono); letter-spacing:.14em; text-transform:uppercase; white-space:pre; }`);
      ctx.el('div', 'x5-bg', root);
      const P = Ridgeline.POINTS;
      const R = Ridgeline.create(ctx, {
        cam: { tx: 820, ty: 520, th: 30, yaw: -16, pitch: 32, dist: 3020, fov: 30, sy: -20 },
        look: { hs: 0.3, sweep: 0, sweepA: 0 },
      });
      const ours = R.route({ pts: Ridgeline.PLANS.ours, color: C.amber, light: C.amberLight });
      const theirs = R.route({ pts: Ridgeline.PLANS.theirs, color: C.rival, light: C.rivalLight });

      // camera: a whip (expo.out), a creep under the hold, then the push into the gate (ends on the last frame)
      tl.fromTo(R.cam, { yaw: -16, dist: 3020 }, { yaw: 3, dist: 2820, duration: 0.5, ease: 'expo.out' }, 0);
      tl.to(R.cam, { yaw: 11, dist: 2480, ty: 535, duration: 1.0, ease: 'power1.inOut' }, 0.5);
      tl.fromTo(R.look, { hs: 0.5, lines: 1.45 }, { hs: 1, lines: 1, duration: 0.6, ease: 'expo.out' }, 0);
      tl.fromTo(R.look, { sweep: 0.12, sweepA: 1.1 }, { sweep: 1.15, sweepA: 0, duration: 0.5, ease: 'power2.out' }, 0);
      tl.to(R.cam, { dist: 330, tx: P.gate[0], ty: P.gate[1], th: 0, sy: 0, pitch: 48, fov: 34, duration: 0.2167, ease: 'power2.in' }, 1.5);

      // plans: ours is already drawn on the cut (the map's dashed route is complete on the last s05 frame: no
      // rewind), its head flaring on the gate; theirs draws 18.70-19.30 (power3.out) so the opposing-plans picture
      // holds from ~19.0
      ours.p.draw = 1;
      tl.fromTo(ours.p, { head: 1.6 }, { head: 1, duration: 0.3, ease: 'power2.out' }, 0);
      tl.fromTo(theirs.p, { draw: 0 }, { draw: 1, duration: 0.6, ease: 'power3.out' }, T_V);
      // both heads flare on the objective with the pulse (19.5)
      tl.fromTo([ours.p, theirs.p], { head: 1 }, { head: 2.2, duration: 0.08, ease: 'power2.out', immediateRender: false }, 1.25);
      tl.to([ours.p, theirs.p], { head: 0.8, duration: 0.4, ease: 'power2.out' }, 1.33);

      // markers
      const mk = { atlas: 0.3, vega: 0, pulse: 0, ring: 0, flare: 0 };
      tl.fromTo(mk, { atlas: 0.3 }, { atlas: 1, duration: 0.3, ease: 'expo.out' }, 0);
      tl.fromTo(mk, { vega: 0 }, { vega: 1, duration: 0.3, ease: 'expo.out' }, T_V);
      tl.fromTo(mk, { ring: 0.4 }, { ring: 1, duration: 0.3, ease: 'power3.out' }, 0);
      tl.fromTo(mk, { pulse: 0 }, { pulse: 1, duration: 0.5, ease: 'none' }, 1.25);
      tl.fromTo(mk, { flare: 0 }, { flare: 1, duration: 0.06, ease: 'none' }, 1.25);
      tl.to(mk, { flare: 0, duration: 0.45, ease: 'power2.out' }, 1.31);
      const PH = 150;
      R.draw((g, lt) => {
        R.gate(g, { a: 1, lit: mk.flare });
        R.ring(g, { x: P.gate[0], y: P.gate[1], r: 64, color: C.amber, a: 0.9 * mk.ring * (1 + 0.3 * mk.flare), lw: 2 + 1.5 * mk.flare });
        if (mk.pulse > 0 && mk.pulse < 1) {
          const u = mk.pulse, e = 1 - Math.pow(1 - u, 3);
          R.ring(g, { x: P.gate[0], y: P.gate[1], r: 64 * (1 + 1.7 * e), color: C.amberLight, a: 0.9 * (1 - u), lw: 2.4, drape: true, seg: 160, lift: 3 });
          R.ring(g, { x: P.gate[0], y: P.gate[1], r: 64 * (1 + 0.9 * e), color: C.amber, a: 0.45 * (1 - u), lw: 1.4, glow: 0, drape: true, seg: 120, lift: 3 });
        }
        R.pillar(g, { x: P.atlas[0], y: P.atlas[1], h: PH, kind: 'diamond', color: C.amber, grow: mk.atlas, a: 1 });
        R.pillar(g, { x: P.vega[0], y: P.vega[1], h: PH, kind: 'ring', color: C.rival, grow: mk.vega, a: mk.vega > 0 ? 1 : 0 });
      });
      // team tags ride the pillar tops (screen space, constant size)
      const tagA = B.label(ctx, { text: 'ATLAS', x: 0, y: 0, at: 0.12, dur: 0.3, color: C.amber, size: 20 });
      const tagV = B.label(ctx, { text: 'VEGA', x: 0, y: 0, at: T_V + 0.05, dur: 0.22, color: C.rival, size: 20 });
      for (const el of [tagA, tagV]) el.style.textShadow = '0 0 6px rgba(11,12,14,.95), 0 0 14px rgba(11,12,14,.8)';
      ctx.onFrame(() => {
        for (const [el, pt, gr] of [[tagA, P.atlas, mk.atlas], [tagV, P.vega, mk.vega]]) {
          const q = R.project(pt[0], pt[1], R.surfaceY(pt[0], pt[1]) + 3 + PH * gr);
          if (!q || lt0(q)) { el.style.visibility = 'hidden'; continue; }
          el.style.visibility = 'visible';
          el.style.transform = `translate(${(q[0] + 26).toFixed(1)}px, ${(q[1] - 10).toFixed(1)}px)`;
        }
      });
      const lt0 = (q) => q[0] < 0 || q[0] > W - 200 || q[1] < 0 || q[1] > H;
      tl.to([tagA, tagV], { opacity: 0, duration: 0.1, ease: 'none' }, 1.5);

      ctx.el('div', 'x5-scrim', root);
      // HUD (same placement as s05) + eyebrow
      B.hud(ctx, { inset: 72, tc: false, drawIn: false, slug: '', ticks: true });
      B.label(ctx, { text: SLUG, x: 120, y: 990, size: 20, color: C.muted3, scramble: false, tracking: '.12em' });
      const eb = B.eyebrow(ctx, { text: 'FLOODGATE · TEAM CHALLENGE · 3 V 3', x: 120, y: 112, at: 0.08, dur: 0.5 });
      tl.to(eb, { opacity: 0, duration: 0.12, ease: 'none' }, 1.55);
    },
  });
})();
