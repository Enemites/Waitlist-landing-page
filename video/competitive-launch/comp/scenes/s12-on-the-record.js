/* s12-on-the-record (film 56-58 s, bar 29.1-30.1). Local 0 = 56.0. The one-bar hold after the peak.
 * The record, shown in the product's own terms. Built on the shared kit: Match.buildMatchScreen +
 * Match.review (the same builder s13 uses to rebuild this scene's last frame, Match.HANDOFF
 * 's12-on-the-record@58.0').
 *
 * 0.00 hard cut out of the score macro onto the whole match (M1 wide, 08:04, the pill at rest):
 *      0.00-0.60 THE FOLD, a callback to the rewind: the world clips into the review window
 *      (x 320-1600, y 150-690; 1 px amber frame, the HUD corners ride the clip) while the camera
 *      fits the match (REVIEW_WIN, zoom 0.6); the score pill exits up (0.07, 8 f); the objective panel
 *      stretches into the timeline track (x 160-1760, y 860, a tick per match-second 08:31-08:04)
 *      under 'ROUND 2 · REVIEW'; THE WORLD REMEMBERS: every route of the film fades up to 70% as the
 *      record (ours amber, theirs red-orange). 0.15-0.60 THE NODE leaves JK and lands on the track
 *      head at 08:04.
 * 0.60-1.50 THE NODE IS THE PLAYHEAD: it scrubs 08:04 -> 08:31 (power2.out) and Match.state rewinds
 *      in lockstep (tokens and triangles walk back, the routes stay). Markers pop as it crosses them:
 *      the ghost-resolve dot (~0.70), the contested dot (~0.88), '08:19 · EMRE' (~0.90),
 *      '08:26 · NORA' (~1.12); it lands on '08:31 · JULES' at 1.50 (57.5, on 'record').
 * 2.00 hard cut (bar 30.1): s13 dissolves the review chrome and opens the window.
 */
(function () {
  'use strict';
  const ID = 's12-on-the-record';
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  Film.scene({
    id: ID,
    duration: 2,
    build(ctx) {
      const tl = ctx.tl;
      const cam3 = gsap.parseEase('power3.inOut'), io2 = gsap.parseEase('power2.inOut'), po2 = gsap.parseEase('power2.out');
      // the playhead (match-seconds): holds 08:04 through the fold, scrubs back to 08:31 by 1.50
      const mAt = (lt) => (lt <= 0.6 ? 484 : 484 + 27 * po2(clamp01((lt - 0.6) / 0.9)));

      const M = Match.buildMatchScreen(ctx, {
        m: mAt,                                   // Match.state rewinds in lockstep with the playhead
        tau: (lt) => 15.5 + lt,                   // the river keeps flowing (it is the world, not the clock)
        pulses: [],
        camera: 'M1',
        clock: () => 484,                         // the clock no longer runs: we are reviewing
      });
      const U = M.U;
      M.camera.move(0, 0.6, 'REVIEW_WIN', 'power3.inOut');
      gsap.set([U.topbar, U.signal, U.roster, U.channel], { autoAlpha: 0 });
      // the score pill exits up as the review takes over (8 f power2.in)
      tl.fromTo(M.score.el, { y: 0, opacity: 1 }, { y: -60, opacity: 0, duration: 8 / 30, ease: 'power2.in' }, 0.07);

      Match.review(ctx, M, {
        fold: (lt) => cam3(clamp01(lt / 0.6)),
        rec: (lt) => io2(clamp01((lt - 0.1) / 0.45)),
        fly: (lt) => clamp01((lt - 0.15) / 0.45),
        m: mAt,
        nodePulses: [1.5],                        // THE NODE pulses as it lands on 08:31 (57.5)
      });
    },
  });
})();
