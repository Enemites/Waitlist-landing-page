/* c03-title: film 12.0-16.0 (local 0 = film 12.0). Title out of the collision (docs/storyboard-v4.md).
 *
 *   0.00 (12.0)  TITLE HIT: the hot core left by c02's collision flares and throws a shockwave (two rings);
 *                the title arrives as TWO REGISTRATIONS: the top halves (Enemites mark + 'Realms') slide in amber
 *                from the left, the bottom halves red-orange from the right, misregistered like a two-colour
 *                print (fast in, a slow creep with ~30 px of offset left, then a one-frame snap).
 *   0.50 (12.5)  LOCK on VO 'Realms': both halves snap into register and turn ink; a glint runs along the seam;
 *                the registration targets either side lock to bone.
 *   0.75-1.00    'Competitive' registers the same way (faster) and locks into amber on 13.0 (VO 'Competitive').
 *   1.30 (13.3)  eyebrow 'TEAM AGAINST TEAM' scrambles in between an amber diamond and a red-orange ring.
 *   0.5-3.75     slow push (1 -> 1.035) and a fine dust drifting out of the collision point.
 *   3.75 (15.75) WIPE on the brand slant: an amber edge leads an INK panel across the frame (6 frames); the
 *                last frames (15.933-15.967) are full INK, ready for c04's paper-white product world.
 */
(function () {
  'use strict';
  const ID = 'c03-title';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, CX = 960, CY = 540, FPS = 30;
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const sat = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => sat((t - a) / (b - a));
  const eo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const p4o = (x) => 1 - Math.pow(1 - x, 4);
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const rgba = (c, a) => { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; };
  const SL = B.SLANT * DEG, DX = Math.cos(SL), DY = -Math.sin(SL), NX = Math.sin(SL), NY = Math.cos(SL);

  const T_LOCK = 0.5, T_MODE0 = 0.72, T_MODE = 1.0, T_EYE = 1.3, T_WIPE = 3.75, T_WIPE_END = 3.94;
  const REALMS_PX = 272, MODE_PX = 128, BASE = 604, MODE_BASE = 768, EYE_Y = 326;

  /** registration offset (px) of a half, t seconds into its run of `dur` ending on the lock:
   *  fast in (power4.out) to ~3% of the throw, a slow creep, then a one-frame snap onto the lock */
  function regOffset(t, t0, tLock, throw0) {
    if (t >= tLock) return 0;
    const dur = tLock - t0, u = seg(t, t0, tLock);
    const creep0 = 0.72;                       // fraction of the run spent flying in
    if (u < creep0) return throw0 * lerp(1, 0.032, p4o(u / creep0));
    const v = (u - creep0) / (1 - creep0);
    const last = 1 - (1 / FPS) / dur / (1 - creep0); // the last frame before the lock
    return throw0 * lerp(0.032, 0.02, Math.min(1, v / Math.max(0.01, last)));
  }

  Film.scene({
    id: ID,
    duration: 4,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`[data-scene="${ID}"] .c3-bg { position:absolute; inset:0; background:${C.bg}; }
        [data-scene="${ID}"] .c3-layer { position:absolute; left:0; top:0; width:${W}px; height:${H}px; }
        [data-scene="${ID}"] .c3-word { position:absolute; left:0; top:0; white-space:pre; }
        [data-scene="${ID}"] .c3-eye { position:absolute; top:${EYE_Y - 13}px; left:0; width:${W}px; text-align:center; font: 500 26px/26px var(--mono); letter-spacing:.34em; color:${C.bone}; white-space:pre; }
        [data-scene="${ID}"] .c3-eye-dia, [data-scene="${ID}"] .c3-eye-ring { position:absolute; top:${EYE_Y - 9}px; width:18px; height:18px; box-sizing:border-box; }
        [data-scene="${ID}"] .c3-eye-dia { background:${C.amber}; }
        [data-scene="${ID}"] .c3-eye-ring { border:3.5px solid ${C.rival}; border-radius:50%; }`);
      ctx.el('div', 'c3-bg', root);
      const { g } = ctx.canvas({ className: 'c3-fx' });

      // ---- measure the title ----
      const probe = ctx.el('span', 'c3-word', root, 'Realms');
      Object.assign(probe.style, { font: `640 ${REALMS_PX}px/1 var(--display)`, letterSpacing: '-0.05em' });
      const realmsW = probe.getBoundingClientRect().width - (-0.05 * REALMS_PX);  // drop the trailing tracking
      probe.textContent = 'Competitive'; Object.assign(probe.style, { font: `600 ${MODE_PX}px/1 var(--display)`, letterSpacing: '-0.045em' });
      const modeW = probe.getBoundingClientRect().width - (-0.045 * MODE_PX);
      root.removeChild(probe);
      const capH = REALMS_PX * 0.715, modeCap = MODE_PX * 0.715;
      const MARK_H = capH * 1.02, MS = MARK_H / 420, MARK_W = 572 * MS, GAP = 58;
      const rowW = MARK_W + GAP + realmsW, rowL = CX - rowW / 2;
      const SPLIT = BASE - capH / 2, MSPLIT = MODE_BASE - modeCap / 2;
      const markX = rowL, markY = BASE - MARK_H + 2, textX = rowL + MARK_W + GAP, modeX = CX - modeW / 2;

      // ---- the title as layers: [locked whole] + top/bottom registration halves ----
      // each half is a full-frame layer, clipped above / below the split line, holding mark + word
      function titleLayer(cls, withMode, onlyMode) {
        const L = ctx.el('div', 'c3-layer ' + cls, root);
        if (!onlyMode) {
          const sv = ctx.svg('svg', { class: 'brand-svg', width: W, height: H, viewBox: `0 0 ${W} ${H}` }, L);
          const gg = ctx.svg('g', { transform: `translate(${markX.toFixed(2)} ${markY.toFixed(2)}) scale(${MS.toFixed(5)})` }, sv);
          B.MARK_BARS.forEach((b) => ctx.svg('path', { d: b.d, fill: 'currentColor' }, gg));
          const w = ctx.el('span', 'c3-word', L, 'Realms');
          Object.assign(w.style, { font: `640 ${REALMS_PX}px/1 var(--display)`, letterSpacing: '-0.05em', left: textX + 'px' });
          w.style.top = '0px';
          const b0 = baselineOf(w); w.style.top = (BASE - b0).toFixed(1) + 'px';
        }
        if (withMode || onlyMode) {
          const m = ctx.el('span', 'c3-word', L, 'Competitive');
          Object.assign(m.style, { font: `600 ${MODE_PX}px/1 var(--display)`, letterSpacing: '-0.045em', left: modeX + 'px', top: '0px' });
          const b1 = baselineOf(m); m.style.top = (MODE_BASE - b1).toFixed(1) + 'px';
        }
        return L;
      }
      function baselineOf(el) {
        const pr = document.createElement('span'); Object.assign(pr.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
        el.appendChild(pr); const y = pr.getBoundingClientRect().top - el.getBoundingClientRect().top; el.removeChild(pr); return y;
      }
      // the whole title lives in one pushed group
      const grp = ctx.el('div', 'c3-layer c3-grp', root);
      const reparent = (el) => { grp.appendChild(el); return el; };
      const topT = reparent(titleLayer('c3-top')), botT = reparent(titleLayer('c3-bot'));
      const topM = reparent(titleLayer('c3-mtop', false, true)), botM = reparent(titleLayer('c3-mbot', false, true));
      topT.style.clipPath = `polygon(0 0, ${W}px 0, ${W}px ${SPLIT}px, 0 ${SPLIT}px)`;
      botT.style.clipPath = `polygon(0 ${SPLIT}px, ${W}px ${SPLIT}px, ${W}px ${H}px, 0 ${H}px)`;
      topM.style.clipPath = `polygon(0 0, ${W}px 0, ${W}px ${MSPLIT}px, 0 ${MSPLIT}px)`;
      botM.style.clipPath = `polygon(0 ${MSPLIT}px, ${W}px ${MSPLIT}px, ${W}px ${H}px, 0 ${H}px)`;
      topT.style.color = C.amber; botT.style.color = C.rival; topM.style.color = C.amber; botM.style.color = C.rival;
      // lock: ink on 12.5 (title), amber on 13.0 (mode)
      tl.fromTo([topT, botT], { color: (i) => (i ? C.rival : C.amber) }, { color: C.ink, duration: 2 / FPS, ease: 'none', immediateRender: false }, T_LOCK);
      tl.fromTo(botM, { color: C.rival }, { color: C.amber, duration: 2 / FPS, ease: 'none', immediateRender: false }, T_MODE);

      // eyebrow
      const eye = ctx.el('div', 'c3-eye', grp, '');
      const EYE_TXT = 'TEAM AGAINST TEAM';
      const pr2 = ctx.el('span', '', root, EYE_TXT); Object.assign(pr2.style, { position: 'absolute', font: '500 26px/26px var(--mono)', letterSpacing: '.34em', whiteSpace: 'pre' });
      const eyeW = pr2.getBoundingClientRect().width; root.removeChild(pr2);
      const dia = ctx.el('div', 'c3-eye-dia', grp), ring = ctx.el('div', 'c3-eye-ring', grp);
      dia.style.left = (CX - eyeW / 2 - 52) + 'px'; ring.style.left = (CX + eyeW / 2 + 26) + 'px';
      tl.fromTo(dia, { scale: 0, rotation: -135 }, { scale: 1, rotation: 45, duration: 0.45, ease: 'back.out(2)' }, T_EYE);
      tl.fromTo(ring, { scale: 0 }, { scale: 1, duration: 0.45, ease: 'back.out(2)' }, T_EYE + 0.06);
      B.scrambleTo(tl, eye, EYE_TXT, T_EYE + 0.04, 0.5);

      // push (the whole group) from the lock to the wipe
      const push = { s: 1 };
      tl.fromTo(push, { s: 1 }, { s: 1.035, duration: T_WIPE - T_LOCK, ease: 'power1.inOut', immediateRender: false }, T_LOCK);

      // ---- dust drifting out of the collision ----
      const r = ctx.rng('c03-dust');
      const dust = Array.from({ length: 220 }, () => {
        const a = r() * TAU, sp = 60 + Math.pow(r(), 2) * 900;
        return { a, sp, r0: r() * 30, sz: r.range(1.4, 3.2), c: r() < 0.65 ? C.amber : r() < 0.6 ? C.bone : C.rival, al: r.range(0.25, 0.8), tw: r() * TAU, up: r.range(10, 40) };
      });

      // registration targets either side of the title (circle + cross)
      const TGT = [[rowL - 104, SPLIT], [rowL + rowW + 104, SPLIT]];
      function target(x, y, colTop, colBot, a, dxTop, dxBot) {
        const R = 17, L = 30;
        for (const [half, col, dx] of [[-1, colTop, dxTop], [1, colBot, dxBot]]) {
          g.save(); g.beginPath(); g.rect(x - 60 + dx, half < 0 ? y - 60 : y, 120, 60); g.clip();
          g.strokeStyle = rgba(col, a); g.lineWidth = 2.5;
          g.beginPath(); g.arc(x + dx, y, R, 0, TAU); g.moveTo(x + dx - L, y); g.lineTo(x + dx + L, y); g.moveTo(x + dx, y - L); g.lineTo(x + dx, y + L); g.stroke();
          g.restore();
        }
      }

      ctx.onFrame((t) => {
        // registration offsets (top from the left, bottom from the right)
        const oT = -regOffset(t, 0, T_LOCK, 1450), oB = regOffset(t, 0, T_LOCK, 1450);
        const mT = -regOffset(t, T_MODE0, T_MODE, 1000), mB = regOffset(t, T_MODE0, T_MODE, 1000);
        // a one-frame kick on each lock
        const kick = (at) => (t >= at && t < at + 0.2 ? Math.exp(-(t - at) * 22) : 0);
        const k1 = kick(T_LOCK), k2 = kick(T_MODE);
        topT.style.transform = `translate(${oT.toFixed(1)}px, ${(-6 * k1).toFixed(1)}px)`;
        botT.style.transform = `translate(${oB.toFixed(1)}px, ${(6 * k1).toFixed(1)}px)`;
        topM.style.transform = `translate(${mT.toFixed(1)}px, ${(-4 * k2).toFixed(1)}px)`;
        botM.style.transform = `translate(${mB.toFixed(1)}px, ${(4 * k2).toFixed(1)}px)`;
        topM.style.visibility = botM.style.visibility = t >= T_MODE0 ? 'visible' : 'hidden';
        grp.style.transformOrigin = `${CX}px ${CY}px`;
        grp.style.transform = `scale(${push.s.toFixed(5)})`;

        // ---- fx canvas: core flare, shockwaves, dust, lock glints, targets, wipe ----
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        g.clearRect(0, 0, W, H);
        // the hot core flares on the hit and cools
        const core = Math.exp(-t * 5);
        if (core > 0.01) {
          const gr = g.createRadialGradient(CX, CY, 0, CX, CY, 260 + 300 * (1 - core));
          gr.addColorStop(0, rgba(C.amberLight, 0.9 * core)); gr.addColorStop(0.3, rgba(C.amber, 0.35 * core)); gr.addColorStop(1, rgba(C.amber, 0));
          g.fillStyle = gr; g.fillRect(0, 0, W, H);
          g.fillStyle = rgba(C.ink, core); g.beginPath(); g.arc(CX, CY, 12 * core + 2, 0, TAU); g.fill();
        }
        // shockwaves
        for (const [at, w0, col, a0] of [[0, 9, C.amberLight, 1], [0.06, 3, C.ink, 0.6], [T_LOCK, 2.5, C.bone, 0.35]]) {
          const e = t - at; if (e < 0 || e > 0.9) continue;
          const v = e / 0.9, rr = 20 + 1500 * eo(v * 0.9);
          g.strokeStyle = rgba(col, a0 * Math.pow(1 - v, 1.5)); g.lineWidth = lerp(w0, 1.5, v);
          g.beginPath(); g.arc(CX, CY, rr, 0, TAU); g.stroke();
        }
        // dust
        for (const p of dust) {
          const d = p.r0 + p.sp * (1 - Math.exp(-t * 1.6)) / 1.6 + 8 * t;
          const x = CX + Math.cos(p.a) * d, y = CY + Math.sin(p.a) * d * 0.8 - p.up * t;
          const a = p.al * sat(t / 0.15) * (0.6 + 0.4 * Math.sin(p.tw + t * 5));
          if (a <= 0.01) continue;
          g.fillStyle = rgba(p.c, a); g.fillRect(x - p.sz / 2, y - p.sz / 2, p.sz, p.sz);
        }
        // registration targets: halves slide with the title, lock to bone
        const ta = t < T_LOCK ? sat(t / 0.1) : 1 - 0.75 * seg(t, T_LOCK + 0.3, T_LOCK + 1.2);
        for (const [x, y] of TGT) target(x, y, t < T_LOCK ? C.amber : C.bone, t < T_LOCK ? C.rival : C.bone, ta, oT * 0.55, oB * 0.55);
        // lock glints along the seams
        for (const [at, y, x0, x1] of [[T_LOCK, SPLIT, rowL - 140, rowL + rowW + 140], [T_MODE, MSPLIT, CX - modeW / 2 - 60, CX + modeW / 2 + 60]]) {
          const e = t - at; if (e < 0 || e > 0.35) continue;
          const v = e / 0.35, xm = lerp(x0, x1, eo(v));
          const lg = g.createLinearGradient(x0, 0, xm, 0);
          lg.addColorStop(0, rgba(C.ink, 0)); lg.addColorStop(1, rgba(C.ink, 0.95 * (1 - v)));
          g.fillStyle = lg; g.fillRect(x0, y - 1.5, xm - x0, 3);
        }
        // ---- the wipe on the slant: amber leading band, ink behind ----
        if (t >= T_WIPE) {
          const u = seg(t, T_WIPE, T_WIPE_END), ease = u * u * (3 - 2 * u);
          // the edge travels along the normal N, from the upper-left corner past the lower-right one
          const s0 = -1010, s1 = 1010 + 160, s = lerp(s0, s1, ease);
          const L = 2600;
          const band = (sa, sb, col) => {
            g.fillStyle = col; g.beginPath();
            g.moveTo(CX + NX * sa - DX * L, CY + NY * sa - DY * L); g.lineTo(CX + NX * sa + DX * L, CY + NY * sa + DY * L);
            g.lineTo(CX + NX * sb + DX * L, CY + NY * sb + DY * L); g.lineTo(CX + NX * sb - DX * L, CY + NY * sb - DY * L); g.closePath(); g.fill();
          };
          band(-3000, s - 150, C.ink);
          band(s - 150, s, C.amber);
          // the title is pushed ahead of the edge (a short shove along the normal)
          grp.style.transform = `translate(${(NX * 90 * ease).toFixed(1)}px, ${(NY * 90 * ease).toFixed(1)}px) scale(${push.s.toFixed(5)})`;
        }
      });
      // the canvas carries the wipe, so it must sit above the title group during the wipe
      ctx.onFrame((t) => { g.canvas.style.zIndex = t >= T_WIPE ? '5' : '0'; grp.style.zIndex = t >= T_WIPE ? '1' : '2'; });
      g.canvas.style.position = 'absolute'; grp.style.position = 'absolute';
    },
  });
})();
