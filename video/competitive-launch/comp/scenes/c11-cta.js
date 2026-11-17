/* c11-cta (film 64.0-74.0, 10.0 s; local 0 = film 64.0). The call to action.
 * VO w16 at 64.5 (bring 64.50, this 64.76, challenge 65.00, to 65.36, your 65.68, group 65.80),
 * w17 at 68.2 (get 68.20, match 68.42, updates 68.70).
 *
 * The seed point from c10 holds at frame centre (THE NODE, pulsing on film time, so the 64.0 cut is
 * invisible). Behind it the catalogue of worlds drifts, very dim (12 line-art world tiles).
 *   0.00-1.20  the catalogue fades up and drifts along the slant
 *   0.50-1.80  'Bring this challenge' rises above the point, 'to your group.' below it, word by word on the VO
 *   2.10       the line rises out
 *   2.50/2.75  'Make your' (ink) above the point, 'next move.' (amber) below it
 *   3.00       LOCKUP: the Enemites mark (bars slide in on the slant) + 'Realms' + COMPETITIVE (amber)
 *   3.25       the button draws on as an amber outline, 'Get match updates' + arrow; 3.50 URL; 3.60 status
 *   3.70-4.20  the point leaves the centre and docks in the button's socket; the headline closes up
 *   4.20       DOCK (68.2, 'Get'): the button floods amber from the socket, label flips dark, ring pulse,
 *              arrow nudge. Settled by 5.0 (69.0); hold to 10.0 with the catalogue drifting.
 */
(function () {
  'use strict';
  const ID = 'c11-cta';
  const C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const smooth = (a, b, x) => { const u = seg(x, a, b); return u * u * (3 - 2 * u); };
  const EZ = {};
  const ez = (n) => EZ[n] || (EZ[n] = gsap.parseEase(n));
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const rgba = (c, a) => { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; };
  const DARK = '#1b140a';

  // ---- layout ----
  const CX = 960, CY = 540;
  const HL = 112;                                  // headline px
  const L1 = { open: 466, final: 478 }, L2 = { open: 652, final: 602 };   // baselines (spread round the point, then closed)
  const BTN = { w: 548, h: 88, r: 6, y: 690 };
  BTN.x = CX - BTN.w / 2;
  const DOCK = [BTN.x + 46, BTN.y + BTN.h / 2];
  const T_LOCK = 3.0, T_BTN = 3.25, T_LEAVE = 3.7, T_DOCK = 4.2;

  const MCV = document.createElement('canvas').getContext('2d');
  function measure(font, text, track) { MCV.font = font; MCV.letterSpacing = track || '0px'; const m = MCV.measureText(text); MCV.letterSpacing = '0px'; return { left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, w: m.width, asc: m.actualBoundingBoxAscent }; }
  function baselineOffset(el) {
    const probe = document.createElement('span');
    Object.assign(probe.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
    el.appendChild(probe);
    const off = probe.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.removeChild(probe);
    return off;
  }

  // ---- the catalogue of worlds: 12 line-art tiles (drawn once) ----
  const TW = 384, TH = 216;
  const WORLDS = ['COASTLINE', 'RIDGELINES', 'ORBITAL STATION', 'ARCHIPELAGO', 'DUNE SEA', 'RIVER VALLEY', 'FOREST', 'CANYON', 'NIGHT CITY', 'WEATHER FRONTS', 'ICE SHELF', 'VOLCANIC ISLAND'];
  function tile(ctx, k) {
    const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
    const g = cv.getContext('2d');
    const r = ctx.rng(ID + ':tile:' + k), n = ctx.noise2D(ID + ':tn:' + k);
    g.fillStyle = '#0f0d0a'; g.fillRect(0, 0, TW, TH);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const bone = (a) => rgba(C.bone, a), amb = (a) => rgba(C.amber, a);
    const poly = (f, x0, x1, step) => { g.beginPath(); for (let x = x0; x <= x1; x += step) { const y = f(x); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); };
    switch (k) {
      case 0: { g.font = '500 11px "JetBrains Mono Variable"'; g.textAlign = 'center';
        for (let y = 12; y < TH; y += 13) for (let x = 8; x < TW; x += 11) { const v = n(x * 0.012, y * 0.016); if (v < -0.05) continue; g.fillStyle = v < 0.05 ? amb(0.9) : bone(0.35 + v * 0.5); g.fillText(v < 0.05 ? '·' : v < 0.3 ? '+' : '#', x, y); } break; }
      case 1: for (let i = 0; i < 12; i++) { g.strokeStyle = bone(0.25 + i * 0.05); g.lineWidth = 1.4; poly((x) => 40 + i * 14 - 40 * Math.max(0, n(x * 0.01, i * 0.3) + 0.2) * (1 - Math.abs(x - TW / 2) / TW), 0, TW, 6); } break;
      case 2: for (let i = 0; i < 6; i++) { g.strokeStyle = i === 2 ? amb(0.9) : bone(0.5); g.lineWidth = 1.5; g.beginPath(); g.ellipse(TW / 2, TH / 2, 40 + i * 22, 14 + i * 7, -0.35 + i * 0.12, 0, Math.PI * 2); g.stroke(); } g.fillStyle = bone(0.7); g.beginPath(); g.arc(TW / 2, TH / 2, 10, 0, Math.PI * 2); g.fill(); break;
      case 3: for (let i = 0; i < 40; i++) { const x = TW / 2 + r.gauss() * 80, y = TH / 2 + r.gauss() * 34, s = 9; g.fillStyle = bone(0.5); g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 1.6, y - s * 0.2); g.lineTo(x, y + s * 0.6); g.lineTo(x - s * 1.6, y - s * 0.2); g.fill(); g.fillStyle = i % 7 ? bone(0.22) : amb(0.6); g.fillRect(x - s * 1.6, y - s * 0.2, s * 1.6, s * 0.9); } break;
      case 4: g.lineWidth = 1.3; for (let i = 0; i < 16; i++) { g.strokeStyle = i === 8 ? amb(0.9) : bone(0.4); poly((x) => i * 14 + 8 + 9 * Math.sin(x * 0.03 + i * 0.6) + 5 * n(x * 0.02, i), 0, TW, 5); } break;
      case 5: for (let i = 1; i < 9; i++) { g.strokeStyle = bone(0.32); g.lineWidth = 1.3; g.beginPath(); for (let a = 0; a <= 64; a++) { const th = a / 64 * Math.PI * 2, rr = i * 14 * (1 + 0.18 * n(Math.cos(th) + i * 0.1, Math.sin(th))); const x = TW * 0.42 + Math.cos(th) * rr * 1.5, y = TH / 2 + Math.sin(th) * rr; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } g.strokeStyle = amb(0.95); g.lineWidth = 2.5; poly((x) => TH * 0.7 + 22 * Math.sin(x * 0.02), 0, TW, 6); break;
      case 6: for (let i = 0; i < 420; i++) { const x = r() * TW, y = 30 + r() * (TH - 30), h = 8 + r() * 18; g.strokeStyle = r() < 0.06 ? amb(0.8) : bone(0.25 + r() * 0.35); g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r.range(-2, 2), y - h); g.stroke(); } break;
      case 7: { const a = (x) => 70 + 20 * Math.sin(x * 0.02), b = (x) => 150 + 18 * Math.sin(x * 0.02 + 2); g.strokeStyle = rgba(C.amberDeep, 0.9); g.lineWidth = 1.4;
        for (let x = 0; x < TW; x += 6) for (let y = 0; y < TH; y += 13) { const yy = y + (x * 0.4) % 13; if (yy > a(x) && yy < b(x)) continue; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 5, yy - 7); g.stroke(); }
        g.strokeStyle = amb(0.9); g.lineWidth = 2.5; poly((x) => (a(x) + b(x)) / 2, 0, TW, 6); break; }
      case 8: for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) { const x = TW / 2 + (i - j) * 8, y = -20 + (i + j) * 4; if (x < 4 || x > TW - 4 || y < 4 || y > TH - 4 || i % 5 === 0 || j % 6 === 0) continue; g.fillStyle = r() < 0.55 ? amb(0.5 + r() * 0.5) : bone(0.15); g.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); } break;
      case 9: [[0.3, 0.45], [0.72, 0.6]].forEach(([fx, fy], c) => { for (let i = 1; i < 8; i++) { g.strokeStyle = c ? bone(0.4) : amb(0.55); g.lineWidth = 1.3; g.beginPath(); g.ellipse(TW * fx, TH * fy, i * 16, i * 11, 0.3 * c, 0, Math.PI * 2); g.stroke(); } }); break;
      case 10: { g.fillStyle = bone(0.12); g.fillRect(0, 60, TW, TH); g.strokeStyle = bone(0.55); g.lineWidth = 1.3; for (let i = 0; i < 26; i++) { let x = r() * TW, y = 60 + r() * (TH - 60); g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 3; s++) { x += r.range(-30, 30); y += r.range(-20, 20); g.lineTo(x, y); } g.stroke(); } g.strokeStyle = amb(0.85); g.lineWidth = 2; g.beginPath(); g.moveTo(0, 60); g.lineTo(TW, 60); g.stroke(); break; }
      case 11: for (let i = 1; i < 10; i++) { g.strokeStyle = i < 3 ? rgba(C.rival, 0.8) : bone(0.4); g.lineWidth = 1.4; g.beginPath(); g.ellipse(TW / 2 + i * 3, TH / 2 + i * 2, i * 15, i * 9.5, 0.1, 0, Math.PI * 2); g.stroke(); } break;
    }
    g.strokeStyle = bone(0.35); g.lineWidth = 1; g.strokeRect(0.5, 0.5, TW - 1, TH - 1);
    g.font = '600 13px "JetBrains Mono Variable"'; g.letterSpacing = '1.6px'; g.textAlign = 'left'; g.fillStyle = bone(0.75);
    g.fillText(`WORLD ${String(k + 1).padStart(2, '0')} · ${WORLDS[k]}`, 12, TH - 12);
    return cv;
  }

  Film.scene({
    id: ID,
    duration: 10,
    async build(ctx) {
      const { root, tl } = ctx;
      root.style.background = C.bg;
      ctx.css(`
        [data-scene="${ID}"] .c11-layer { position:absolute; left:0; top:0; width:${W}px; height:${H}px; }
        [data-scene="${ID}"] .c11-line { position:absolute; left:0; top:0; white-space:nowrap; overflow:hidden; padding:0 .08em .22em; margin:0 -.08em;
          font: 620 ${HL}px/1 var(--display); letter-spacing:-0.055em; }
        [data-scene="${ID}"] .c11-line span { display:inline-block; }
        [data-scene="${ID}"] .c11-mono { position:absolute; left:0; top:0; font: 500 20px/1 var(--mono); letter-spacing:.12em; text-transform:uppercase; white-space:pre; }
      `);

      // ================= the catalogue (dim, drifting on the slant) =================
      const TILES = Array.from({ length: 12 }, (_, k) => tile(ctx, k));
      const cat = ctx.canvas();
      const GX = TW + 28, GY = TH + 28;
      const SL = Brand.SLANT * Math.PI / 180;
      ctx.onFrame((t) => {
        const g = cat.g;
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.clearRect(0, 0, W, H);
        const a = 0.2 * smooth(0, 1.4, t);
        if (a <= 0.001) return;
        const d = 8 + t * 9;                               // drift along the mark's slant
        const ox = ((d * Math.cos(SL)) % GX + GX) % GX, oy = ((-d * Math.sin(SL)) % GY + GY) % GY;
        g.globalAlpha = a;
        for (let j = -1; j < 5; j++) for (let i = -1; i < 6; i++) {
          const k = ((j * 5 + i) % 12 + 12) % 12;
          const x = i * GX + ox - 60 + (j % 2) * GX * 0.5, y = j * GY + oy - 40;
          if (x > W || y > H || x + TW < 0 || y + TH < 0) continue;
          g.drawImage(TILES[k], Math.round(x), Math.round(y));
        }
        g.globalAlpha = 1;
        // keep the centre clean for type
        const gr = g.createRadialGradient(CX, CY, 120, CX, CY, 980);
        gr.addColorStop(0, 'rgba(11,12,14,0.92)'); gr.addColorStop(0.55, 'rgba(11,12,14,0.6)'); gr.addColorStop(1, 'rgba(11,12,14,0.05)');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      });

      const lay = ctx.el('div', 'c11-layer', root);
      const svg = ctx.svg('svg', { class: 'brand-svg' }, root);

      // ================= headline lines (centred, words in masks) =================
      const font = `620 ${HL}px "Manrope Variable"`, track = (-0.055 * HL).toFixed(2) + 'px';
      function line(text, base, color) {
        const wrap = ctx.el('div', 'c11-layer', lay);
        const el = ctx.el('div', 'c11-line', wrap);
        el.style.color = color;
        const words = text.split(' ').map((w, i) => { if (i) el.appendChild(document.createTextNode(' ')); return ctx.el('span', '', el, w); });
        const m = measure(font, text, track);
        el.style.left = (CX - (m.left + m.right) / 2).toFixed(2) + 'px';   // text origin (the mask's -.08em margin and .08em padding cancel)
        el.style.top = (base - baselineOffset(el)).toFixed(2) + 'px';
        return { wrap, el, words };
      }
      const rise = (words, at, stagger) => tl.fromTo(words, { yPercent: 140 }, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: stagger || 0 }, at);
      // card 1: on the VO
      const b1 = line('Bring this challenge', L1.open, C.ink);
      const b2 = line('to your group.', L2.open, C.ink);
      [0.5, 0.76, 1.0].forEach((at, i) => rise(b1.words[i], at));
      [1.36, 1.68, 1.8].forEach((at, i) => rise(b2.words[i], at));
      tl.to([...b1.words, ...b2.words], { yPercent: -140, duration: 0.34, ease: 'power3.in', stagger: 0.025 }, 2.08);
      // card 2: 'Make your' / 'next move.'
      const m1 = line('Make your', L1.open, C.ink);
      const m2 = line('next move.', L2.open, C.amber);
      rise(m1.words, 2.5, 0.08);
      rise(m2.words, 2.75, 0.08);
      // close up as the point leaves
      tl.fromTo(m1.wrap, { y: 0 }, { y: L1.final - L1.open, duration: 0.6, ease: 'power3.inOut', immediateRender: false }, T_LEAVE + 0.05);
      tl.fromTo(m2.wrap, { y: 0 }, { y: L2.final - L2.open, duration: 0.6, ease: 'power3.inOut', immediateRender: false }, T_LEAVE + 0.05);

      // ================= lockup: mark + Realms + COMPETITIVE =================
      const LK = { y: 172, markH: 64, word: 96, gap: 26 };
      const markW = 572 * LK.markH / 420;
      const wf = `640 ${LK.word}px "Manrope Variable"`, wm = measure(wf, 'Realms', (-0.05 * LK.word) + 'px');
      const total = markW + LK.gap + (wm.left + wm.right);
      const left = CX - total / 2;
      Brand.mark(ctx, { x: left, y: LK.y - LK.markH * 0.55, h: LK.markH, color: C.ink, at: T_LOCK, parent: svg, stagger: 0.05 });
      const wordBox = ctx.el('div', 'c11-line', lay);
      Object.assign(wordBox.style, { font: `640 ${LK.word}px/1 var(--display)`, letterSpacing: '-0.05em', color: C.ink });
      const wIn = ctx.el('span', '', wordBox, 'Realms');
      wordBox.style.left = (left + markW + LK.gap - wm.left).toFixed(2) + 'px';
      const capH = measure(wf, 'R').asc;
      wordBox.style.top = (LK.y + capH / 2 - baselineOffset(wordBox)).toFixed(2) + 'px';
      tl.fromTo(wIn, { yPercent: 140 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, T_LOCK + 0.12);
      const mode = ctx.el('div', 'c11-mono', lay, '');
      Object.assign(mode.style, { font: '600 22px/1 var(--mono)', letterSpacing: '.42em', color: C.amber });
      const modeW = measure('600 22px "JetBrains Mono Variable"', 'COMPETITIVE', (0.42 * 22) + 'px');
      mode.style.left = (CX - (modeW.w - 0.42 * 22) / 2).toFixed(2) + 'px';
      mode.style.top = (LK.y + 66) + 'px';
      Brand.scrambleTo(tl, mode, 'COMPETITIVE', T_LOCK + 0.4, 0.45);

      // ================= the button =================
      const bx = BTN.x, by = BTN.y;
      const outline = ctx.svg('rect', { x: bx + 1, y: by + 1, width: BTN.w - 2, height: BTN.h - 2, rx: BTN.r, fill: 'none', stroke: C.amber, 'stroke-width': 2.2 }, svg);
      tl.fromTo(outline, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.55, ease: 'power3.inOut' }, T_BTN);
      // socket (where the point docks)
      const socket = ctx.svg('circle', { cx: DOCK[0], cy: DOCK[1], r: 12, fill: 'none', stroke: rgba(C.amber, 0.55), 'stroke-width': 1.5, 'stroke-dasharray': '3 4' }, svg);
      tl.fromTo(socket, { opacity: 0, scale: 0.4, svgOrigin: `${DOCK[0]} ${DOCK[1]}` }, { opacity: 1, scale: 1, svgOrigin: `${DOCK[0]} ${DOCK[1]}`, duration: 0.4, ease: 'back.out(2)' }, T_BTN + 0.3);
      tl.to(socket, { opacity: 0, duration: 0.05, ease: 'none' }, T_DOCK);
      // label + arrow, twice: ink (outline state) and dark (filled state, revealed by the flood)
      const LF = '600 31px "Manrope Variable"', lm = measure(LF, 'Get match updates', '-0.31px');
      function face(color, parent) {
        const f = ctx.el('div', 'c11-layer', parent);
        const lb = ctx.el('div', '', f, 'Get match updates');
        Object.assign(lb.style, { position: 'absolute', left: '0px', top: '0px', font: '600 31px/1 var(--display)', letterSpacing: '-0.01em', color, whiteSpace: 'nowrap' });
        lb.style.left = (bx + 84 - lm.left).toFixed(2) + 'px';
        lb.style.top = (by + BTN.h / 2 + measure(LF, 'H').asc / 2 - baselineOffset(lb)).toFixed(2) + 'px';
        const as = ctx.svg('svg', { class: 'brand-svg' }, f);
        const ax = bx + BTN.w - 34, ay = by + BTN.h / 2;
        const arrow = ctx.svg('path', { d: `M${ax - 24} ${ay} L${ax - 1} ${ay} M${ax - 9} ${ay - 8} L${ax} ${ay} L${ax - 9} ${ay + 8}`, fill: 'none', stroke: color, 'stroke-width': 2.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, as);
        return { f, lb, arrow };
      }
      const inkFace = face(C.ink, lay);
      tl.fromTo([inkFace.lb, inkFace.arrow], { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.08 }, T_BTN + 0.22);
      const fill = ctx.el('div', 'c11-layer', lay);
      const fillBg = ctx.el('div', '', fill);
      Object.assign(fillBg.style, { position: 'absolute', left: bx + 'px', top: by + 'px', width: BTN.w + 'px', height: BTN.h + 'px', borderRadius: BTN.r + 'px', background: C.amber });
      const darkFace = face(DARK, fill);
      // the docked seed: a dark bullet in the socket
      const bsv = ctx.svg('svg', { class: 'brand-svg' }, fill);
      ctx.svg('circle', { cx: DOCK[0], cy: DOCK[1], r: 11.5, fill: 'none', stroke: DARK, 'stroke-width': 1.6 }, bsv);
      ctx.svg('circle', { cx: DOCK[0], cy: DOCK[1], r: 5.5, fill: DARK }, bsv);
      const flood = { r: 0 };
      tl.fromTo(flood, { r: 0 }, { r: 620, duration: 0.42, ease: 'power3.out', immediateRender: false }, T_DOCK);
      ctx.onFrame((t) => {
        const r = t < T_DOCK ? 0 : flood.r;
        fill.style.clipPath = r >= 619 ? '' : `circle(${r.toFixed(1)}px at ${DOCK[0]}px ${DOCK[1]}px)`;
        fill.style.visibility = r <= 0.01 ? 'hidden' : 'visible';
        // arrow nudge on the dock
        const u = seg(t, T_DOCK + 0.08, T_DOCK + 0.5);
        const nx = 10 * Math.sin(Math.PI * u) * (1 - u * 0.3);
        darkFace.arrow.setAttribute('transform', `translate(${nx.toFixed(2)} 0)`);
      });
      // button pulse: an outline ring expanding off the button
      const pulse = ctx.svg('rect', { fill: 'none', stroke: C.amberLight, 'stroke-width': 2, opacity: 0, rx: BTN.r + 4 }, svg);
      const glow = ctx.svg('rect', { x: bx - 18, y: by - 18, width: BTN.w + 36, height: BTN.h + 36, rx: 22, fill: C.amber, opacity: 0 }, svg);
      svg.insertBefore(glow, svg.firstChild);
      ctx.onFrame((t) => {
        let u = -1, big = false;
        for (const t0 of [T_DOCK, 6.0, 8.0]) { const k = t0 === T_DOCK; const v = (t - t0) / (k ? 0.9 : 1.4); if (v >= 0 && v <= 1) { u = v; big = k; } }
        if (u < 0) pulse.setAttribute('opacity', 0);
        else {
          const e = 1 - Math.pow(1 - u, 2.4), grow = (big ? 34 : 18) * e;
          pulse.setAttribute('x', (bx - grow).toFixed(2)); pulse.setAttribute('y', (by - grow).toFixed(2));
          pulse.setAttribute('width', (BTN.w + grow * 2).toFixed(2)); pulse.setAttribute('height', (BTN.h + grow * 2).toFixed(2));
          pulse.setAttribute('opacity', ((big ? 0.85 : 0.4) * (1 - u)).toFixed(3));
        }
        const ga = t < T_DOCK ? 0 : 0.07 + 0.16 * Math.exp(-(t - T_DOCK) * 4) + 0.02 * Math.sin((t - T_DOCK) * 1.6);
        glow.setAttribute('opacity', ga.toFixed(3));
      });

      // ================= URL + status =================
      const url = ctx.el('div', 'c11-mono', lay, 'enemites.com/realms');
      Object.assign(url.style, { font: '500 27px/1 var(--mono)', letterSpacing: '.02em', textTransform: 'none', color: C.ink2 });
      const um = measure('500 27px "JetBrains Mono Variable"', 'enemites.com/realms', (0.02 * 27) + 'px');
      url.style.left = (CX - (um.w - 0.54) / 2).toFixed(2) + 'px';
      url.style.top = (842 - baselineOffset(url)).toFixed(2) + 'px';
      tl.fromTo(url, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, T_BTN + 0.3);
      const status = ctx.el('div', 'c11-mono', lay, 'IN DEVELOPMENT · PRIVATE BETA');
      Object.assign(status.style, { color: C.muted, letterSpacing: '.16em' });
      const sm = measure('500 20px "JetBrains Mono Variable"', 'IN DEVELOPMENT · PRIVATE BETA', (0.16 * 20) + 'px');
      status.style.left = (CX - (sm.w - 3.2) / 2).toFixed(2) + 'px';
      status.style.top = (968 - baselineOffset(status)).toFixed(2) + 'px';
      status.textContent = '';
      Brand.scrambleTo(tl, status, 'IN DEVELOPMENT · PRIVATE BETA', T_BTN + 0.4, 0.6);

      // ================= THE NODE: holds at centre, then docks =================
      const nsv = ctx.svg('svg', { class: 'brand-svg' }, root);
      const N = NodeMark.create(ctx, { parent: nsv, x: CX, y: CY });
      const P0 = [CX, CY], P1 = [560, 530], P2 = [540, 770], P3 = DOCK;
      const go = { u: 0 };
      tl.fromTo(go, { u: 0 }, { u: 1, duration: T_DOCK - T_LEAVE, ease: 'power3.inOut', immediateRender: false }, T_LEAVE);
      ctx.onFrame((t) => {
        const u = t < T_LEAVE ? 0 : go.u, v = 1 - u;
        N.p.x = v * v * v * P0[0] + 3 * v * v * u * P1[0] + 3 * v * u * u * P2[0] + u * u * u * P3[0];
        N.p.y = v * v * v * P0[1] + 3 * v * v * u * P1[1] + 3 * v * u * u * P2[1] + u * u * u * P3[1];
        N.p.pulse = t < T_LEAVE - 0.2 ? 1 : 0;
        N.p.a = 1 - seg(t, T_DOCK + 0.02, T_DOCK + 0.12);
        N.p.glow = 0.35 + 0.4 * Math.exp(-Math.pow((t - T_DOCK) / 0.12, 2));
      });
    },
  });
})();
