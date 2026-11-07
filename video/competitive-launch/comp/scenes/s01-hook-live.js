/* s01-hook-live (film 0-3 s, bars 1.1-2.3): in medias res. The finished Floodgate match, live,
 * readable on frame 0 (state m = 497, final). The camera pushes MATCH -> HOOK toward the Crossing,
 * the alert lifts on beat 2, the clock flips 08:17 -> 08:16 -> 08:15 and lands on 08:14 on the cut.
 * Built entirely on the shared kit (comp/lib/match.js). The 3.0 frame equals s08 at 43.5.
 */
Film.scene({
  id: 's01-hook-live',
  duration: 3,
  build(ctx) {
    // m runs 497 -> 494 (one match-second per second); clock = format(497 - floor(lt)).
    const M = Match.buildMatchScreen(ctx, {
      m: (lt) => 497 - lt,
      tau: (lt) => lt,                       // Vega pulses at 0.5 / 1.5 / 2.5 (the default pulse list)
      camera: 'MATCH',
      raise: ['vega', 'vegaRoutes'],         // the threat stays lit while the alert is lifted
    });
    // the only mover besides the clock, the pulses and the lift
    M.camera.move(0, 3, 'HOOK', 'power1.inOut');

    // 0.50 LIFT: 'Vega is contesting the crossing' rises to a 40 px card (20 px row x 2), centred
    // at x 960, top 792, 10 f power3.out; drops back 2.50-2.83 (10 f power2.in).
    M.lift(M.U.warn, { at: 0.5, dur: 10 / 30, out: 2.5, outDur: 10 / 30, scale: 2, cx: 960, top: 792, accent: 'rival' });

    // 1.00: the 'CONTESTED' map label re-scrambles (resolves left to right in 12 f)
    const sub = M.F.el.labels.crossing.sub;
    ctx.onFrame((lt) => {
      if (lt >= 1.0 && lt < 1.4) sub.textContent = Match.scramble('CONTESTED', (lt - 1.0) / 0.4, 's01-contested', 'resolve');
    });
  },
});
