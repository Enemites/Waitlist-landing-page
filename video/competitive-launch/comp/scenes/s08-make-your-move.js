/* s08-make-your-move (film 34-44 s, bars 18.1-23.1). Local 0 = 34.0.
 * The live match plays forward from 08:32, one match-second per beat (m = 513 - 2 lt), and every
 * Atlas message lands as the clock shows its own timestamp. Built on the shared kit (match.js):
 * the world, chrome, clock and every live element come from Match.state(m); this scene adds the
 * grid snap, the camera plan, the chapter label, THE NODE on JK, the lifts and the chrome dim.
 *
 * 0.00 INTO THE RING + GRID SNAP: ring pulse on the arrival frame; camera settles OVERVIEW_WIDE ->
 *      PLAN (15 f power3.out; PLAN keeps the Atlas lobby clear of the roster so THE NODE never hides);
 *      A-L / 01-08 board lines draw outward from the objective cell (1 f apart), coordinates scramble.
 * 0.25 panels enter (10 f power3.out, 2 f stagger); '03 —— MAKE YOUR MOVE' scrambles in (out 1.75).
 * 0.50 the clock starts at 08:32.
 * 1.00-2.50 LIFT: Jules 08:31 (types 0.6 s, 2x clone at 42 px); tifo cells light at 1.4 / 1.6.
 * 2.50-3.50 NC's route draws, NC travels; chrome dims to 55% (messages land in a dimmed channel).
 * 3.50 Nora 08:26 (not lifted), RESTORING.
 * 4.00 LIFT + LANDING #3: PLAN AGREED stamps and lifts at 1.7x until 5.0.
 * 4.25-5.25 EK's route + travel; HOLDING + cone at 5.25.
 * 5.00-6.50 LIFT: OBJECTIVE in place at 1.6x; 0 -> 62% in steps(12) (one per 8th); the ring is
 *      raised above the dim so its arc fills in sync. Camera PLAN -> MATCH (5.0-6.5) finds the far bank.
 * 6.50 / 6.75 Vega out of the fog. 7.00 Emre 08:19. 7.25-7.90 their route; 7.5 CONTESTED; 7.9 alert row.
 * 8.00 ghost + LAST SEEN; camera MATCH -> HOOK (8.0-9.5, power3.inOut).
 * 8.25-9.33 LIFT: the alert, exactly as in the hook. 9.00-9.33 the chrome comes back to full.
 * 9.50 (43.5, 08:14) = s01 at 3.0 (same state 494, HOOK, tau 3.0); THE NODE on JK is the difference.
 */
(function () {
  'use strict';
  const ID = 's08-make-your-move';
  const C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  // the plan framing: lobby (380,320) clear of the roster, crossing clear of the channel
  const PLAN = { x: 700, y: 400, zoom: 0.74 };
  // THE NODE pulses every 3 beats on the film grid (global 34.5, 36.0 ... 43.5)
  const NODE_PULSES = [0.5, 2.0, 3.5, 5.0, 6.5, 8.0, 9.5];

  function rectOf(el, root) {
    let x = 0, y = 0, e = el;
    while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }
  const mapNode = (src, cl, node) => { const a = [src, ...src.querySelectorAll('*')], b = [cl, ...cl.querySelectorAll('*')]; return b[a.indexOf(node)]; };

  Film.scene({
    id: ID,
    duration: 10,
    build(ctx) {
      const tl = ctx.tl;
      const po2 = gsap.parseEase('power2.out');

      // clock: 08:32 at 0.5 ... 08:14 at 9.5, held to 10.0
      const mAt = (lt) => Math.max(494, Math.min(512, 513 - 2 * lt));
      const M = Match.buildMatchScreen(ctx, {
        m: mAt,
        tau: (lt) => lt - 6.5,                  // Vega pulses at 7.0 / 8.0 / 9.0; tau 3.0 at 9.5 (= s01 3.0)
        camera: 'OVERVIEW_WIDE',                // s07's last framing
        raise: ['vega', 'vegaRoutes'],          // the threat stays lit under every lift
        zones: true,
      });
      const U = M.U, F = M.F, K = M.K, L = M.L;

      // ---- camera: settle into the plan, follow EK east, push to the hook
      M.camera.move(0, 0.5, PLAN, 'power3.out');
      M.camera.move(5.0, 1.5, 'MATCH', 'power2.inOut');   // EK has reached the crossing; find the far bank
      M.camera.move(8.0, 1.5, 'HOOK', 'power3.inOut');

      // ---- raised world marks (above the LIFT dim): tifo cells always; the objective ring only
      // while its own panel is lifted (5.0-6.5), so it fills in sync with the card
      const hotMark = ctx.svg('g', {}, L.hotWg);
      L.hotWg.insertBefore(hotMark, L.hotWg.firstChild);
      // tifo cells: the kit's 12% fill, plus a hairline outline that follows the same envelope
      const zoneLines = (K.zones || []).map((z) => {
        L.hotWg.insertBefore(z, hotMark);
        const o = ctx.svg('rect', { x: z.getAttribute('x'), y: z.getAttribute('y'), width: z.getAttribute('width'), height: z.getAttribute('height'), fill: 'none', stroke: C.amber, 'stroke-width': 1.1, opacity: 0 }, L.hotWg);
        L.hotWg.insertBefore(o, hotMark);
        return { z, o };
      });
      const ringNodes = [F.el.gate, F.el.ringTrack, F.el.ring];
      const ringHome = F.el.crossing;            // the node created right after the ring in F.wg
      let ringUp = null;
      const setRingUp = (up) => {
        if (ringUp === up) return; ringUp = up;
        ringNodes.forEach((n) => (up ? L.hotWg.insertBefore(n, hotMark) : F.wg.insertBefore(n, ringHome)));
      };
      // the ring's arrival pulse (INTO THE RING), in the hot layer
      const ringPulse = ctx.svg('circle', { cx: 800, cy: 560, r: 64, fill: 'none', stroke: C.amberLight, 'stroke-width': 1.6, opacity: 0 }, L.hotWg);

      // ---- THE NODE rides JK from the lobby (it never cuts: size step on the arrival frame)
      const N = NodeMark.create(ctx, { parent: F.el.nodeG, x: 380, y: 320, size: 2, pulses: NODE_PULSES });
      N.step(0);
      M.pre((lt) => {
        N.p.x = M.pos.jk[0]; N.p.y = M.pos.jk[1];
        setRingUp(lt >= 4.95 && lt < 6.9);
      });

      // ---- GRID SNAP: A-L x 01-08 over the 1600 x 1000 composition, drawn outward from the
      // objective cell G05 (lines bounding it first, 1 f per ring), settling to 6%
      const G = Match.GRID;
      const gridG = ctx.svg('g', { class: 's08-grid' }, F.el.baseG);
      const lines = [];
      for (let c = 0; c <= G.cols; c++) lines.push({ x1: c * G.w / G.cols, y1: 0, x2: c * G.w / G.cols, y2: G.h, k: c <= 6 ? 6 - c : c - 7, f: 56 });
      for (let r = 0; r <= G.rows; r++) lines.push({ x1: 0, y1: r * G.h / G.rows, x2: G.w, y2: r * G.h / G.rows, k: r <= 4 ? 4 - r : r - 5, f: 50 });
      lines.forEach((ln) => {
        const el = ctx.svg('line', { x1: ln.x1, y1: ln.y1, x2: ln.x2, y2: ln.y2, stroke: C.amber, 'stroke-width': 0.9 }, gridG);
        tl.fromTo(el, { drawSVG: `${ln.f}% ${ln.f}%` }, { drawSVG: '0% 100%', duration: 12 / FPS, ease: 'power2.out' }, ln.k / FPS);
      });
      tl.fromTo(gridG, { opacity: 0.16 }, { opacity: 0.06, duration: 0.6, ease: 'power2.inOut' }, 0.4);
      tl.to(gridG, { opacity: 0, duration: 0.8, ease: 'none' }, 8.0);

      // coordinates (screen-space, mono 20 px, muted): letters along the top band, numbers along
      // the left edge; they ride the camera settle and leave as the chrome takes the frame
      const coordL = ctx.el('div', 's08-coords', L.world);
      Object.assign(coordL.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' });
      const mkC = (txt) => {
        const d = ctx.el('div', '', coordL, '');
        Object.assign(d.style, { position: 'absolute', font: '500 20px/20px var(--mono)', letterSpacing: '.1em', color: C.muted, whiteSpace: 'pre' });
        return { d, txt };
      };
      const letters = G.letters.split('').map((ch, c) => Object.assign(mkC(ch), { c, k: Math.abs(c - 6) }));
      const numbers = Array.from({ length: G.rows }, (_, r) => Object.assign(mkC(String(r + 1).padStart(2, '0')), { r, k: Math.abs(r - 4) }));

      // ---- UI panels enter at functional speed (topbar and score pill are already in from s07)
      [[U.roster, { x: -40 }], [U.channel, { x: 40 }], [U.objective, { y: 30 }], [U.signal, { y: -16 }]].forEach(([el, from], i) => {
        tl.fromTo(el, Object.assign({ opacity: 0 }, from), { opacity: 1, x: 0, y: 0, duration: 10 / FPS, ease: 'power3.out' }, 0.25 + i * 2 / FPS);
      });

      // ---- chapter label, centred under the score pill (in the chrome: it dims under the lift)
      const CHAP = '03  ——  MAKE YOUR MOVE';
      const chap = ctx.el('div', 's08-chapter', U.root, '');
      Object.assign(chap.style, { position: 'absolute', left: '960px', top: '150px', transform: 'translateX(-50%)', font: '500 24px/24px var(--mono)', letterSpacing: '.12em', color: C.ink, whiteSpace: 'pre' });

      // ---- chrome dim (2.5 -> 9.0): panels to 55% under dark plates (opaque, so the world never
      // shows through), topbar + signal by opacity; back to full with the alert's return
      const cd = { v: 0 };
      tl.to(cd, { v: 0.45, duration: 10 / FPS, ease: 'power2.out' }, 2.5);
      tl.to(cd, { v: 0, duration: 10 / FPS, ease: 'power2.inOut' }, 9.0);
      tl.to([U.topbar, U.signal], { opacity: 0.55, duration: 10 / FPS, ease: 'power2.out' }, 2.5);
      tl.to([U.topbar, U.signal], { opacity: 1, duration: 10 / FPS, ease: 'power2.inOut' }, 9.0);
      const plates = [U.roster, U.channel, U.objective].map((el) => {
        const r = rectOf(el, ctx.root), d = ctx.el('div', 's08-plate', U.root);
        Object.assign(d.style, { position: 'absolute', left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', borderRadius: '18px', background: C.bg, opacity: '0', display: 'none' });
        return d;
      });

      // ---- LIFTS
      // 1.00-2.50 Jules 08:31: 2x clone (42 px text), types in sync with the channel row
      const mm0 = K.ui.msgs[0];
      let jTy = null, jRs = null;
      // the clone is narrowed so the two orders break as two lines (clause per line)
      M.lift(U.msgEls[0], {
        at: 1.0, out: 2.5, scale: 2, cx: 985, top: 190, leader: 'side', fit: false, pad: [12, 14],
        prep: (cl, src) => {
          jTy = mapNode(src, cl, mm0.ty); jRs = mapNode(src, cl, mm0.rs);
          const p = mapNode(src, cl, src.querySelector('p'));
          jTy.textContent = 'Nora, take the pump station.'; jRs.textContent = '';
          const w = Math.ceil(jTy.offsetWidth) + 6;
          jTy.textContent = ''; jRs.textContent = mm0.full;
          cl.style.width = w + 'px'; p.style.width = w + 'px';
        },
      });
      // 4.00-5.00 PLAN AGREED (LANDING #3), amber-edged
      M.lift(U.pinned, {
        at: 4.0, out: 5.0, scale: 1.7, cx: 925, top: 166, leader: 'side', accent: 'amber', fit: false, pad: [0, 0],
        prep: (cl, src, wrap, bg) => { bg.style.borderRadius = '13px'; },
      });
      // 5.00-6.50 OBJECTIVE, lifted in place (bottom-anchored, no leader); the card's bar and % run
      // from the same progress proxy as the panel and the ring
      const objR = rectOf(U.objective, ctx.root);
      let oPc = null, oBar = null;
      M.lift(U.objective, {
        at: 5.0, out: 6.5, scale: 1.6, cx: objR.x + objR.w / 2, top: (w0, h0, s) => 972 - h0 * s, leader: false, fit: false, pad: [0, 0],
        prep: (cl, src, wrap, bg) => {
          bg.style.borderRadius = '18px';
          mapNode(src, cl, U.warn).style.display = 'none';
          cl.style.height = 'auto';
          oPc = mapNode(src, cl, U.pct); oBar = mapNode(src, cl, U.bar);
        },
      });
      // 8.25-9.33 the alert, exactly as in the hook
      M.lift(U.warn, { at: 8.25, dur: 10 / FPS, out: 9.0, outDur: 10 / FPS, scale: 2, cx: 960, top: 792, accent: 'rival' });

      // ---- per frame (after the kit's state + the lifts)
      ctx.onFrame((lt) => {
        // ring pulse at the arrival frame (scale 1 -> 2.2, .6 -> 0, 45 f)
        const pu = lt / 1.5;
        if (pu >= 0 && pu <= 1) { ringPulse.setAttribute('r', (64 * (1 + 1.2 * po2(pu))).toFixed(2)); ringPulse.setAttribute('opacity', (0.6 * (1 - pu)).toFixed(3)); }
        else if (ringPulse.getAttribute('opacity') !== '0') ringPulse.setAttribute('opacity', '0');

        // tifo outlines
        for (const zl of zoneLines) { const v = +(zl.z.getAttribute('opacity') || 0); zl.o.setAttribute('opacity', (v / 0.12 * 0.55).toFixed(3)); }

        // coordinates: in outward from the objective column (1 f apart, 6 f scramble); out from the
        // centre outward from 0.22 as the chapter label takes the band (gone by ~0.55)
        for (const o of letters) {
          const x = F.toScreen((o.c + 0.5) * G.w / G.cols, 0)[0];
          const tin = o.k / FPS, out = 0.22 + Math.abs(x - 960) / 960 * 0.25;
          const a = clamp01((lt - tin) / 0.1) * (1 - clamp01((lt - out) / 0.1));
          const show = a > 0.001 && x > 140 && x < 1780;
          o.d.style.display = show ? '' : 'none';
          if (!show) continue;
          o.d.style.left = (x - 6).toFixed(1) + 'px'; o.d.style.top = '150px';
          o.d.style.opacity = a.toFixed(3);
          o.d.textContent = Match.scramble(o.txt, (lt - tin) / 0.2, 's08-l' + o.c, 'resolve');
        }
        for (const o of numbers) {
          const tin = o.k / FPS;
          const y = F.toScreen(0, (o.r + 0.5) * G.h / G.rows)[1];
          const a = clamp01((lt - tin) / 0.1) * (1 - clamp01((lt - 0.3 - o.k / FPS) / 0.1));
          const show = a > 0.001 && y > 180 && y < 940;
          o.d.style.display = show ? '' : 'none';
          if (!show) continue;
          o.d.style.left = '104px'; o.d.style.top = (y - 10).toFixed(1) + 'px';
          o.d.style.opacity = a.toFixed(3);
          o.d.textContent = Match.scramble(o.txt, (lt - tin) / 0.2, 's08-n' + o.r, 'resolve');
        }

        // chapter label: scrambles in at 0.25 (0.4 s), out at 1.75 (0.3 s)
        let s = '';
        if (lt >= 0.25 && lt < 1.75) s = Match.scramble(CHAP, (lt - 0.25) / 0.4, 's08-chap', 'in');
        else if (lt >= 1.75 && lt < 2.05) s = Match.scramble(CHAP, 1 - (lt - 1.75) / 0.3, 's08-chap-o', 'in');
        const html = s ? `<span style="color:${C.amber}">${s.slice(0, 2)}</span>${s.slice(2)}` : '';
        if (chap.innerHTML !== html) chap.innerHTML = html;

        // chrome dim plates
        const pv = cd.v > 0.001 ? cd.v.toFixed(3) : '';
        for (const p of plates) { if (p.style.opacity !== pv) { p.style.opacity = pv || '0'; p.style.display = pv ? '' : 'none'; } }

        // lift clones that follow live content
        if (jTy) {
          if (jTy.textContent !== mm0.ty.textContent) jTy.textContent = mm0.ty.textContent;
          if (jRs.textContent !== mm0.rs.textContent) jRs.textContent = mm0.rs.textContent;
          if (jRs.style.visibility !== 'hidden') jRs.style.visibility = 'hidden';
        }
        if (oPc) {
          const v = Math.round(clamp01(F.progress.v) * 100);
          const t = v + '%'; if (oPc.textContent !== t) oPc.textContent = t;
          oBar.style.width = v + '%';
        }
      });
    },
  });
})();
