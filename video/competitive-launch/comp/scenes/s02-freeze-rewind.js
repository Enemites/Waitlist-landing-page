/* s02-freeze-rewind (film 3-5 s, bars 2.3-3.3). Local 0 = 3.0.
 * 0.00 FREEZE on the identical hook frame (same builder, Match.state(494), HOOK camera, tau 3.0);
 *      the HUD corners snap 8 px in, the slug flips to REWIND, THE NODE is born on JK.
 * 0.07-1.00 REWIND: m runs 494 -> 512 (power2.in) through Match.state, so the match plays backwards;
 *      the clock flaps UP to 08:32; the UI exits one panel per step (0.40 / 0.50 / 0.60 / 0.70);
 *      the score pill folds into its clock cell and glides above the board window; the camera pulls
 *      HOOK -> WINDOW while the world clips to the 1040 x 780 window and the corners ride the clip.
 * 1.00 (4.0): round start, 08:32, framed empty valley. s03 drains this frame on top; this scene
 *      holds it underneath and hands over the clock cell, THE NODE and the slug (Match.HANDOFF).
 */
Film.scene({
  id: 's02-freeze-rewind',
  duration: 2,
  build(ctx) {
    const W = 1920, H = 1080;
    const C = Brand.C;
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const pin = gsap.parseEase('power2.in'), cam3 = gsap.parseEase('power3.inOut'), io2 = gsap.parseEase('power2.inOut');
    const T0 = 0.07, T1 = 1.0;                       // hard stop 2 f, then the rewind
    const mAt = (lt) => (lt <= T0 ? 494 : lt >= T1 ? 512 : 494 + 18 * pin((lt - T0) / (T1 - T0)));

    const M = Match.buildMatchScreen(ctx, {
      m: mAt,
      tau: (lt, gt, m) => 3.0 - (m - 494),           // frozen at the hook's 3.0, then runs backward with the tape
      camera: 'HOOK',
      raise: ['vega', 'vegaRoutes'],
      slug: '',                                       // the REWIND slug replaces it (below)
    });
    const U = M.U, SC = M.score;

    // camera: hold HOOK, then pull back to WINDOW (0.20-1.00, power3.inOut)
    M.camera.move(0.2, 0.8, 'WINDOW', 'power3.inOut');

    // THE NODE is born on JK's token (world space, under the token: ring + glow around it)
    const N = NodeMark.create(ctx, { parent: M.F.el.nodeG, x: 684, y: 484, size: 2 });
    N.born(0);

    // REWIND slug: SVG double triangle + mono label in the slug position (x 120, top 990), drawn
    // exactly like s03's opening slug so the hand-over at 1.00 is invisible (Match.HANDOFF slug)
    const rw = ctx.el('div', 's02-rewind', ctx.root,
      `<svg width="34" height="20" viewBox="0 0 34 20" style="display:block;flex:none"><path d="M13 3 L3 10 L13 17Z M25 3 L15 10 L25 17Z" fill="${C.muted3}"/></svg><span>REWIND</span>`);
    Object.assign(rw.style, { position: 'absolute', left: '120px', top: '990px', display: 'flex', alignItems: 'center', font: '500 20px/20px var(--mono)', letterSpacing: '.12em', color: C.muted3, textTransform: 'uppercase', whiteSpace: 'pre' });

    // hairline frame of the board window (fades in as the clip closes)
    const frame = ctx.svg('rect', { fill: 'none', stroke: C.amber, 'stroke-width': 1, opacity: 0 }, M.L.liftSvg);

    // UI exits: plain translate + opacity, 8 f power2.in, one panel per step (the last one is gone
    // by 0.967, so nothing of the chrome survives into the hand-over frame)
    const ex = (els, at, v) => ctx.tl.to(els, Object.assign({ opacity: 0, duration: 8 / 30, ease: 'power2.in' }, v), at);
    ex(U.objective, 0.40, { y: 150 });
    ex(U.channel, 0.50, { x: 200 });
    ex(U.roster, 0.60, { x: -200 });
    ex([U.topbar, U.signal], 0.70, { y: -80 });

    // score pill geometry (rest), for the fold + glide
    const roundW = SC.round.offsetWidth, ckW = SC.ck.offsetWidth, cellW = SC.w.cell;
    const PAD = 26;
    const corners = M.hud.corners, A = 34;
    const WIN = Match.HANDOFF['s02-freeze-rewind@4.0'].window;
    const CELL = Match.HANDOFF['s02-freeze-rewind@4.0'].clockCell;
    const cellPadL = parseFloat(getComputedStyle(SC.cell).paddingLeft), cellPadT = parseFloat(getComputedStyle(SC.cell).paddingTop);
    const inner = Math.max(roundW, ckW);

    M.pre((lt) => {
      // THE NODE rides JK (product coords), and is handed to s03 at 1.00
      N.p.x = M.pos.jk[0]; N.p.y = M.pos.jk[1]; N.p.a = lt >= T1 - 1e-6 ? 0 : 1;

      // HUD corners: snap 8 px inward over 2 f, then ride the clip onto the window corners
      const snap = Math.min(1, (lt + 1 / 30) / (2 / 30));
      const I = 72 + 8 * snap;
      const u = cam3(clamp01((lt - 0.2) / 0.8));
      const clip = { x: lerp(0, WIN.x, u), y: lerp(0, WIN.y, u), w: lerp(W, WIN.w, u), h: lerp(H, WIN.h, u) };
      M.setClip(u > 0 ? clip : null);
      const cr = { x: lerp(I, WIN.x, u), y: lerp(I, WIN.y, u), w: lerp(W - 2 * I, WIN.w, u), h: lerp(H - 2 * I, WIN.h, u) };
      [[cr.x, cr.y, 1, 1], [cr.x + cr.w, cr.y, -1, 1], [cr.x, cr.y + cr.h, 1, -1], [cr.x + cr.w, cr.y + cr.h, -1, -1]].forEach(([x, y, sx, sy], i) => {
        corners[i].setAttribute('d', `M${x.toFixed(2)} ${(y + A * sy).toFixed(2)} L${x.toFixed(2)} ${y.toFixed(2)} L${(x + A * sx).toFixed(2)} ${y.toFixed(2)}`);
      });
      frame.setAttribute('x', clip.x.toFixed(2)); frame.setAttribute('y', clip.y.toFixed(2));
      frame.setAttribute('width', clip.w.toFixed(2)); frame.setAttribute('height', clip.h.toFixed(2));
      frame.setAttribute('opacity', (0.3 * clamp01((u - 0.5) / 0.5)).toFixed(3));

      // score pill: team segments fold into the clock cell (0.50-0.70), the cell glides to the
      // window's top-left (0.60-1.00) and drops its box, leaving 'ROUND 2' / clock, left-aligned
      const f = io2(clamp01((lt - 0.5) / 0.2)), g = cam3(clamp01((lt - 0.6) / 0.4));
      const k = 1 - f;
      [SC.atlas, SC.vega].forEach((t, i) => {
        const w0 = i === 0 ? SC.w.atlas : SC.w.vega;
        t.style.width = f > 0 ? (w0 * k).toFixed(2) + 'px' : '';
        t.style.paddingLeft = t.style.paddingRight = f > 0 ? (PAD * k).toFixed(2) + 'px' : '';
        t.style.opacity = clamp01(1 - f * 1.4).toFixed(3);
      });
      const pw = (SC.w.atlas + SC.w.vega) * k + cellW + 2;
      const leftC = W / 2 - pw / 2;
      const leftT = CELL.x - 2 - cellPadL - (cellW - 2 - 2 * cellPadL - inner) / 2, topT = CELL.y - 1 - cellPadT;
      SC.el.style.left = lerp(leftC, leftT, g).toFixed(2) + 'px';
      SC.el.style.top = lerp(SC.top, topT, g).toFixed(2) + 'px';
      const box = 1 - g;
      SC.el.style.backgroundColor = `rgba(13,12,10,${(0.93 * box).toFixed(3)})`;
      SC.el.style.borderColor = `rgba(255,255,255,${(0.09 * box).toFixed(3)})`;
      SC.cell.style.borderColor = `rgba(255,255,255,${(0.09 * box).toFixed(3)})`;
      // centred lines -> left-aligned lines
      SC.round.style.transform = `translateX(${(-(inner - roundW) / 2 * g).toFixed(2)}px)`;
      SC.ck.style.transform = `translateX(${(-(inner - ckW) / 2 * g).toFixed(2)}px)`;
      // hand-over at 1.00: s03 owns the odometer, the node and the slug
      const handed = lt >= T1 - 1e-6;
      SC.el.style.visibility = handed ? 'hidden' : '';
      rw.style.visibility = handed ? 'hidden' : '';
    });
  },
});
