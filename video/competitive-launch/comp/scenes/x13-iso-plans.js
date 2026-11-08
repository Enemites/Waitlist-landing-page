/* x13-iso-plans (overlay, film 58.0-59.5; local 0 = 58.0). Ridgeline 3D, docs/revision-v3.md.
 * The payoff accent lands on a low, dramatic angle: the camera sits down the river (looking upstream,
 * north-east, pitch 18), the Atlas summit on the left, the Vega summit on the right, and both plans
 * already drawn as light, their heads meeting on the Floodgate.
 *   0.00-0.30  (58.0) impact on the low hero angle: a bright flash at the meeting point (bloom + anamorphic
 *         streak), a shock ring that rolls out OVER the ground (draped: up the slopes, behind the ridges),
 *         the gate lights, both heads flare; the camera breathes in. The hero camera sits west and low
 *         (target 700,560, yaw 46, dist 1240 -> 1180, sy 150) so the island's east cliff is framed out and the
 *         terrain fills the frame; the footprint edge is held at 0 here and comes up with the crane (0.3-0.7).
 *   0.30-1.50  CRANE: the camera swings round to north and cranes up to near top-down (pitch 18 -> 80,
 *         yaw 46 -> 0, power3.inOut speed ramp, still moving into the last frames) while the relief
 *         settles late (hs 1 -> .5, power3.in), landing on s13's OVERVIEW framing (centre 817,509,
 *         1.217 px per unit) on the cut. The pillars shorten (150 -> 70).
 *   0.30-1.00  a comet of light runs each plan, summit -> gate, landing on 59.0 with a small ring pulse.
 *   1.00-1.40  the river banks trace in (amber) and the water darkens to the map's river core;
 *   1.10-1.4667  both emblems slide onto s13's banner emblems, so the hard cut at 59.5 matches
 *         ('See whose' rises in s13). No headline here.
 */
(function () {
  'use strict';
  const ID = 'x13-iso-plans';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080;
  const SLUG = 'REALMS · COMPETITIVE · INTERFACE CONCEPT';
  // s13's camera at 59.5: OVERVIEW drifting toward z .84 (power1.inOut over 4 s, u = .375)
  const END = { x: 817.2, y: 508.6, scale: 0.8112 * 1.5 };

  Film.scene({
    id: ID,
    duration: 1.5,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`[data-scene="${ID}"] .x13-bg { position:absolute; inset:0; background:${C.bg}; }
        [data-scene="${ID}"] .x13-scrim { position:absolute; left:0; top:860px; width:1100px; height:220px; background: radial-gradient(70% 100% at 0% 100%, rgba(11,12,14,.82), rgba(11,12,14,0)); }
        [data-scene="${ID}"] .x13-shade { position:absolute; right:0; bottom:0; width:720px; height:430px; background: radial-gradient(80% 100% at 100% 100%, rgba(11,12,14,.92), rgba(11,12,14,.55) 40%, rgba(11,12,14,0) 100%); }`);
      ctx.el('div', 'x13-bg', root);
      const P = Ridgeline.POINTS;
      const FOV1 = 22, PITCH1 = 80;
      const foc1 = (H / 2) / Math.tan(FOV1 * Math.PI / 360);
      const R = Ridgeline.create(ctx, {
        cam: { tx: 700, ty: 560, th: 6, yaw: 46, pitch: 18, dist: 1240, fov: 32, sy: 150 },
        look: { hs: 1, glow: 0.8 },
      });
      const ours = R.route({ pts: Ridgeline.PLANS.ours, color: C.amber, light: C.amberLight });
      const theirs = R.route({ pts: Ridgeline.PLANS.theirs, color: C.rival, light: C.rivalLight });
      ours.p.draw = 1; theirs.p.draw = 1;

      // camera: a breath on the impact (the hero angle holds 9 frames), then the crane (swing to north +
      // rise to near top-down), ending on the cut so the motion carries into the last aired frames
      tl.fromTo(R.cam, { dist: 1240 }, { dist: 1180, duration: 0.3, ease: 'power2.out' }, 0);
      tl.to(R.cam, { tx: END.x, ty: END.y, th: 0, yaw: 0, pitch: PITCH1, dist: foc1 / END.scale, fov: FOV1, sy: 0, duration: 1.2, ease: 'power3.inOut' }, 0.3);
      tl.fromTo(R.look, { hs: 1, lines: 1, glow: 0.8 }, { hs: 0.5, lines: 0.82, glow: 0.4, duration: 1.15, ease: 'power3.in' }, 0.3);
      // the footprint edge stays off on the low hero angle (the east cliff is framed out) and comes up with the crane
      tl.fromTo(R.look, { edge: 0 }, { edge: 1, duration: 0.4, ease: 'power2.out', immediateRender: true }, 0.3);
      // the map's river: banks trace in, the water darkens toward the river core
      tl.fromTo(R.look, { banks: 0 }, { banks: 1, duration: 0.4, ease: 'power2.out' }, 1.0);

      // the meeting: heads flare on the impact and settle
      tl.fromTo([ours.p, theirs.p], { head: 2.4 }, { head: 0.5, duration: 0.6, ease: 'power3.out' }, 0);
      // comets: summit -> gate, landing on 59.0
      tl.fromTo([ours.p, theirs.p], { run: 0, runA: 0 }, { run: 1, runA: 1, duration: 0.7, ease: 'power2.in', immediateRender: false }, 0.3);
      tl.to([ours.p, theirs.p], { runA: 0, duration: 0.25, ease: 'power2.out' }, 1.0);

      const fx = { flash: 1, shock: 0, pulse: 0, lit: 1, ph: 150, emb: 0 };
      // pillars shorten over the crane; the emblems slide onto s13's banner emblems for the match cut
      tl.fromTo(fx, { ph: 150 }, { ph: 70, duration: 1.1, ease: 'power2.inOut' }, 0.3);
      tl.fromTo(fx, { emb: 0 }, { emb: 1, duration: 0.3667, ease: 'power2.inOut' }, 1.1);
      const EMB_A = [458, 213], EMB_V = [1532, 663];   // s13 at 59.5: banner diamond / banner ring
      tl.fromTo(fx, { flash: 1 }, { flash: 0, duration: 0.6, ease: 'power3.out' }, 0);
      tl.fromTo(fx, { shock: 0 }, { shock: 1, duration: 0.7, ease: 'none' }, 0);
      tl.fromTo(fx, { lit: 1 }, { lit: 0.25, duration: 0.8, ease: 'power2.out' }, 0);
      tl.fromTo(fx, { pulse: 0 }, { pulse: 1, duration: 0.45, ease: 'none', immediateRender: false }, 1.0);

      R.draw((g, lt) => {
        R.gate(g, { a: 1, lit: fx.lit });
        R.ring(g, { x: P.gate[0], y: P.gate[1], r: 64, color: C.amber, a: 0.9, lw: 2 + 1.2 * fx.lit });
        if (fx.shock > 0 && fx.shock < 1) {
          const u = fx.shock, e = 1 - Math.pow(1 - u, 3);
          // light rolling over the ground in the mid-ground: a faster fade, a tighter reach and a soft 9 px halo, so on a
          // still it reads as a shockwave, not as a wire loop through the foreground
          R.ring(g, { x: P.gate[0], y: P.gate[1], r: 64 * (1 + 2.4 * e), color: C.amberLight, a: 0.75 * Math.pow(1 - u, 2.4), lw: 1.5, drape: true, seg: 200, lift: 3,
            halo: [[10, 0.42, C.amber], [26, 0.13, C.amber]] });
        }
        if (fx.pulse > 0 && fx.pulse < 1) {
          const u = fx.pulse, e = 1 - Math.pow(1 - u, 3);
          R.ring(g, { x: P.gate[0], y: P.gate[1], r: 64 * (1 + 1.2 * e), color: C.amberLight, a: 0.8 * (1 - u), lw: 2, drape: true, seg: 140, lift: 3 });
        }
        R.pillar(g, { x: P.atlas[0], y: P.atlas[1], h: fx.ph, kind: 'diamond', color: C.amber, a: 1, emb: EMB_A, embT: fx.emb, embE: 10 });
        R.pillar(g, { x: P.vega[0], y: P.vega[1], h: fx.ph, kind: 'ring', color: C.rival, a: 1, emb: EMB_V, embT: fx.emb, embE: 13.5 });
        // the flash at the meeting point: bloom, core, anamorphic streak
        if (fx.flash > 0.002) {
          const q = R.project(P.gate[0], P.gate[1], R.surfaceY(P.gate[0], P.gate[1]) + 10);
          if (q) {
            const f = fx.flash, x = q[0], y = q[1];
            g.globalCompositeOperation = 'lighter';
            let gr = g.createRadialGradient(x, y, 0, x, y, 420);
            gr.addColorStop(0, `rgba(242,238,231,${(0.85 * f).toFixed(3)})`);
            gr.addColorStop(0.12, `rgba(246,211,159,${(0.45 * f).toFixed(3)})`);
            gr.addColorStop(0.45, `rgba(239,189,112,${(0.12 * f).toFixed(3)})`);
            gr.addColorStop(1, 'rgba(239,189,112,0)');
            g.fillStyle = gr; g.fillRect(x - 420, y - 420, 840, 840);
            g.save(); g.translate(x, y); g.scale(1, 0.035);
            gr = g.createRadialGradient(0, 0, 0, 0, 0, 900);
            gr.addColorStop(0, `rgba(242,238,231,${(0.6 * f).toFixed(3)})`);
            gr.addColorStop(0.08, `rgba(246,211,159,${(0.55 * f).toFixed(3)})`);
            gr.addColorStop(0.3, `rgba(246,211,159,${(0.35 * f).toFixed(3)})`);
            gr.addColorStop(1, 'rgba(239,189,112,0)');
            g.fillStyle = gr; g.fillRect(-900, -900, 1800, 1800);
            g.restore();
            g.fillStyle = `rgba(242,238,231,${Math.min(1, 1.2 * f).toFixed(3)})`;
            g.beginPath(); g.arc(x, y, 5 + 9 * f, 0, Math.PI * 2); g.fill();
            g.globalCompositeOperation = 'source-over';
          }
        }
      });

      ctx.el('div', 'x13-scrim', root);
      // the hero hold's corner shade: the low angle leaves a sliver of cliff and void behind the bottom-right bracket;
      // a shade (the bottom-left scrim's twin) settles it into a vignette, then clears with the crane (top-down end)
      const shade = ctx.el('div', 'x13-shade', root);
      tl.fromTo(shade, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 0.3);
      // HUD as on s13 (corners inset 72, no ticks; slug at 120 / 990)
      B.hud(ctx, { inset: 72, tc: false, drawIn: false, slug: '', ticks: false });
      B.label(ctx, { text: SLUG, x: 120, y: 990, size: 20, color: C.muted3, scramble: false, tracking: '.1em' });
    },
  });
})();
