/* ENGINE DEMO: a short end card that starts 0.8 s before _demo ends (manifest overlap: 0.8),
 * proving that scenes cross: it sits above _demo (later in the manifest = higher z) and wipes
 * over it. Not part of the film. */
Film.scene({
  id: '_demo_outro',
  duration: 3,
  build(ctx) {
    const { root, tl } = ctx;
    ctx.css(`
      [data-scene="_demo_outro"] .wipe { position:absolute; inset:0; background: var(--amber); }
      [data-scene="_demo_outro"] .card { position:absolute; inset:0; background: var(--bg); }
      [data-scene="_demo_outro"] .edge { position:absolute; top:0; bottom:0; left:0; width:14px; background: var(--amber); }
      [data-scene="_demo_outro"] .mark { position:absolute; left:50%; top:47%; transform: translate(-50%,-50%);
        font: 600 230px/1 var(--display); letter-spacing: -0.06em; color: var(--ink); white-space: nowrap; }
      [data-scene="_demo_outro"] .sub { position:absolute; left:0; right:0; top:62%; text-align:center;
        font: 500 22px/1 var(--mono); letter-spacing: .16em; text-transform: uppercase; color: var(--amber); white-space: pre; }
    `);
    const wipe = ctx.el('div', 'wipe');
    const card = ctx.el('div', 'card');
    const edge = ctx.el('div', 'edge', card);
    const mark = ctx.el('div', 'mark', card, 'Realms');
    const sub = ctx.el('div', 'sub', card, '');
    const chars = SplitText.create(mark, { type: 'chars', charsClass: 'c', mask: 'chars' });

    // 0 .. 0.8 s overlaps the end of _demo
    tl.fromTo(wipe, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.65, ease: 'expo.inOut' }, 0);
    tl.fromTo(card, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.inOut' }, 0.32);
    tl.from(chars.chars, { yPercent: 105, duration: 0.9, ease: 'expo.out', stagger: 0.045 }, 0.75);
    tl.to(sub, { duration: 0.9, ease: 'none', scrambleText: { text: 'Competitive · get match updates', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', speed: 0.7 } }, 1.1);
    tl.to(mark, { letterSpacing: '-0.045em', duration: 2.2, ease: 'power1.out' }, 0.75);
  },
});
