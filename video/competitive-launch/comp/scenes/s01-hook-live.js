/* s01-hook-live (film 0-3 s, bars 1.1-2.3): in medias res. The finished Floodgate match, live,
 * readable on frame 0 (state m = 497, final). The camera pushes MATCH -> HOOK toward the Crossing in
 * TWO beat-synced moves (expo.out) with a hold between: 0.0-0.467 the frame reads still; push one
 * (MATCH -> 55% of the way, log zoom) starts a frame early so its biggest step lands on the 0.50 alert
 * lift; hold; push two likewise lands its biggest step on the clock's 08:15 flip at 2.00 and settles
 * exactly on HOOK at 2.867, holding it, so the 2.9667 frame is HOOK and the cut
 * into s02's freeze (HOOK, the identical frame) is clean. The alert lifts on beat 2, the clock flips
 * 08:17 -> 08:16 -> 08:15 and lands on 08:14 on the cut.
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
    // the only mover besides the clock, the pulses and the lift: two pushes, MATCH -> MID -> HOOK
    const A = Match.CAM.MATCH, Z = Match.CAM.HOOK, k = 0.55;
    const MID = { x: A.x + (Z.x - A.x) * k, y: A.y + (Z.y - A.y) * k, zoom: A.zoom * Math.pow(Z.zoom / A.zoom, k) };
    // each push starts one frame before its beat, so its biggest step (expo.out) lands ON the beat frame
    // (0.5 the alert, 2.0 the 08:15 flap tick) instead of the frame after it; push two still lands by 2.867
    M.camera.move(0.5 - 1 / 30, 0.75, MID, 'expo.out').move(2.0 - 1 / 30, 0.9, 'HOOK', 'expo.out');

    // 0.50 LIFT: 'Vega is contesting the crossing' rises to a 40 px card (20 px row x 2), centred
    // at x 960, top 792, 10 f power3.out; drops back 2.50-2.83 (10 f power2.in).
    const AL = M.lift(M.U.warn, { at: 0.5, dur: 10 / 30, out: 2.5, outDur: 10 / 30, scale: 2, cx: 960, top: 792, accent: 'rival' });
    // the pill is opaque on every frame it is off its row, both ways: the kit fades the card ground with p (0..0.63),
    // so on the lift-in (0.533 / 0.567, p .27 / .49) and the drop-back (2.767 / 2.8, p .36 / .19), as the pill crosses
    // the objective card, 'Restore gate power' and the OBJECTIVE label read through it (two lines of text on top of
    // each other). Opaque, the pill simply passes over them. p is 0 on 0.0-0.467 and from 2.833, so the 0.0 frame and
    // the 3.0 end key (= s08 at 43.5) are unchanged. Registered after the kit's lift, so it overrides that frame's value
    ctx.onFrame(() => { if (AL.P.p > 0.0005) AL.bg.style.opacity = '1'; });

    // 1.00: the 'CONTESTED' map label re-scrambles (resolves left to right in 12 f)
    const sub = M.F.el.labels.crossing.sub;
    ctx.onFrame((lt) => {
      if (lt >= 1.0 && lt < 1.4) sub.textContent = Match.scramble('CONTESTED', (lt - 1.0) / 0.4, 's01-contested', 'resolve');
    });
  },
});
