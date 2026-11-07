/* Floodgate module test (not part of the film). */
Film.scene({
  id: '_fgtest',
  duration: 8,
  build(ctx) {
    const F = Floodgate.world(ctx, { scale: 1.5 });
    F.reveal(0.2);
    F.T.state.zoom = 0.8; F.T.state.cx = 800 * 1.5; F.T.state.cy = 540 * 1.5;
    ctx.tl.to(F.T.state, { zoom: 1.0, duration: 8, ease: 'power1.inOut' }, 0);
    F.T.spots.push({ x: F.P.gate[0], y: F.P.gate[1], r: 380, a: 0 });
    ctx.tl.to(F.T.spots[0], { a: 0.8, duration: 1 }, 2);
    const U = Floodgate.ui(ctx, { progress: F.progress, clockAt: 2 });
    U.enter(2.5).typeMessages(3.2, 0.8);
    ctx.tl.to(F.progress, { v: 0.8, duration: 2, ease: 'power2.inOut' }, 5);
  },
});
