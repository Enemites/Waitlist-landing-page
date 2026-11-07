/* Brand system test (not part of the film): exercises every Brand helper in 12 s. */
Film.scene({
  id: '_brandtest',
  duration: 12,
  build(ctx) {
    const B = Brand, C = B.C;
    const RIVER = [[0, 380], [520, 560], [900, 700], [1300, 780], [1700, 1000], [2400, 1260]];
    const T = B.terrain(ctx, {
      seed: 'floodgate', w: 2400, h: 1350,
      river: { pts: RIVER, width: 70, depth: 0.6 },
      hills: [[700, 380, 260, 0.45], [1750, 520, 300, 0.5], [1180, 1120, 220, 0.3]],
      state: { cx: 1200, cy: 675, zoom: 0.9, reveal: 0, revealX: 1100, revealY: 760, light: 0 },
      spots: [{ x: 1300, y: 780, r: 420, a: 0 }],
    });
    ctx.tl.to(T.state, { reveal: 1, duration: 2.2, ease: 'power2.inOut' }, 0);
    ctx.tl.to(T.state, { zoom: 1.15, cx: 1250, cy: 760, duration: 12, ease: 'power1.inOut' }, 0);
    ctx.tl.to(T.spots[0], { a: 1, duration: 1.2, ease: 'power2.out' }, 2.0);
    ctx.tl.fromTo(T.state, { pulse: 0, pulseX: 1300, pulseY: 780 }, { pulse: 1, duration: 2.0, ease: 'power2.out' }, 1.0);

    // world-space overlay group following the camera
    const map = ctx.svg('svg', {});
    const wg = T.group(map);
    const obj = B.objective(ctx, wg, { x: 1300, y: 780 });
    obj.pop(2.2); obj.pulse(2.6, 3, 0.5); obj.spin(2.2, 9);
    B.route(ctx, wg, { d: 'M760 1040 C900 1000 980 900 1100 880 S1230 820 1268 792', at: 3.0, dur: 1.4 });
    [[760, 1040, '1'], [880, 1110, '2'], [700, 1150, '3']].forEach(([x, y, n], i) => {
      const t = B.token(ctx, wg, { x, y, n });
      ctx.tl.fromTo(t.g, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.45, ease: 'back.out(2)' }, 2.6 + i * 0.12);
    });
    [[1560, 640], [1640, 700]].forEach(([x, y], i) => {
      const r = B.rivalToken(ctx, wg, { x, y });
      ctx.tl.fromTo(r, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.4, ease: 'back.out(2.4)' }, 4.6 + i * 0.12);
    });
    const cx = B.cross(ctx, wg, { x: 1480, y: 860 });
    ctx.tl.fromTo(cx, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 4.9);

    B.hud(ctx, { at: 0.2, slug: 'REALMS / COMPETITIVE · BRAND TEST' });
    B.eyebrow(ctx, { text: 'Competitive / Team against team', x: 132, y: 600, at: 0.6, out: 5.6 });
    B.headline(ctx, { lines: ['One world.', 'Opposing plans.'], x: 124, y: 640, at: 1.0, out: 5.4 });
    B.label(ctx, { text: 'OBJ · THE CROSSING', x: 1360, y: 300, at: 2.6, color: C.amberLight });

    // archive window
    B.archive(ctx, { dir: '../.work/engine-test/seq-arena', count: 60, fps: 24, x: 1180, y: 120, w: 560, h: 315, at: 3.2, out: 5.5, caption: 'ARCHIVE · 1937 · THE RIVER', ref: 'REF 02' });

    // second half: chapter card + banners + lockup on a flood transition layer
    const layer = ctx.el('div', 'layer2');
    Object.assign(layer.style, { position: 'absolute', inset: '0', background: C.bg });
    const L = Object.assign({}, ctx, { root: layer, el: (t, c, p, h) => ctx.el(t, c, p === undefined ? layer : p, h), svg: (t, a, p) => ctx.svg(t, a, p === undefined ? layer : p) });
    B.flood(L, { at: 5.6, dur: 1.0, target: layer });
    B.chapter(L, { num: '01', title: 'Form your team.', x: 132, y: 520, at: 6.4, out: 9.0 });
    B.banner(L, { side: 'atlas', x: 1260, y: 170, h: 380, w: 170, at: 6.6 });
    B.banner(L, { side: 'vega', x: 1700, y: 170, h: 380, w: 170, at: 6.9, flip: true });
    B.lockup(L, { x: 960, y: 820, scale: 0.7, at: 9.4 });
    const n = L.el('div', 'num', layer, '');
    Object.assign(n.style, { position: 'absolute', left: '132px', top: '860px', font: '600 40px/1 var(--mono)', color: C.amber, letterSpacing: '.08em' });
    B.counter(ctx, { el: n, from: 0, to: 62, at: 7.0, dur: 2.0, fmt: (v) => String(Math.round(v)).padStart(2, '0') + '%' });
  },
});
