/* x05-versus: revision v3 insert (overlay, film 20.0-22.0). Local 0 = 20.0.
 * VERSUS SLAB: the two banners of s05 blown up to full frame. A diagonal split at the Enemites
 * slant (Brand.SLANT = 34 deg, the lean of the mark's bar ends), Atlas upper-left, Vega lower-right.
 * Each slab is solid cloth colour (amber / red-orange) with the banner's charcoal emblem and name,
 * and carries its own summit's contours (Floodgate.productHeight around the Atlas / Vega summit,
 * charcoal at 10-17%, drifting) centred on its emblem.
 *
 *   0.00 (20.0, VO 'team')  the amber slab slams in from the left (6 f expo.out, pre-rolled one frame so
 *                           the cut frame already shows a crisp slab edge ~315 px from rest; a hard-edged
 *                           motion smear (<= 110 px) on its leading edge; the EDGE alone overshoots on
 *                           20.067-20.1); ATLAS rides in behind it (parallax, directional blur while fast).
 *   0.45                    a dashed red-orange hairline draws along the empty side of the seam.
 *   0.75 (20.75)            the red-orange slab slams in from the right onto it (same pre-roll; lands
 *                           ~20.8 on 'match'); the amber slab recoils.
 *   1.25 (21.25)            the slabs drift apart (gap 4 -> 52 px).
 *   1.30 (21.3, 'another')  the hit: the gap band burns ink on 21.3 (full gap, with a 2 px ink core on each
 *                           inner edge) and 21.333 (30% about the seam line); the gap is clean charcoal from
 *                           21.367. Each slab carries a soft light bleed from its inner edge (a 90 px gradient
 *                           perpendicular to the seam, rivalLight on the red side, ink 0.7 on the amber side,
 *                           inside the slab, under its HUD; 0.9, 0.5, 0.2, gone); a one-frame 10% ink lift.
 *   1.40 (21.4)             '3 V 3' types on in the clean charcoal gap, always ink, each glyph in its final place.
 *   1.75-1.967              THROUGH THE DIAMOND: a log-space dive (s = 42^(u^2): 1.02, 1.22, 1.74, 2.96, 5.98,
 *                           14.5, 42) into the amber slab's charcoal diamond, its centre travelling onto s06's
 *                           banner diamond (1372, 460). On 21.967 the diamond covers the whole frame, so the
 *                           cut into s06's dark map at 22.0 reads as coming out through it. Zoom smear on 21.9
 *                           and 21.933: 8 soft (blurred) copies per slab at 10% each, spread evenly over a
 *                           180-degree shutter of the frame's own scale step, so it reads as a continuous blur.
 * HUD: register corners + ticks + slug stay fixed on every frame (amber on the charcoal ground and on
 * the charcoal diamond, charcoal on the slabs: one HUD per layer, each clipped with its layer). The dashed
 * hint is clipped off the slug box; where the ink band crosses the slug (21.3-21.333) a charcoal slug copy
 * clipped to the band keeps the slug whole (charcoal on ink), and the light bleeds sit under each slab's HUD.
 */
(function () {
  'use strict';
  const ID = 'x05-versus';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const NS = 'http://www.w3.org/2000/svg';
  const SL = (B.SLANT || 34) * Math.PI / 180;
  const DX = Math.cos(SL), DY = -Math.sin(SL);           // seam direction (rising to the right)
  const NX = -Math.sin(SL), NY = -Math.cos(SL);          // normal toward the Atlas (upper-left) side
  const P0 = [960, 540];
  const SLUG = 'REALMS · COMPETITIVE · INTERFACE CONCEPT';
  const T_A = 0.0, T_V = 0.75, T_GAP = 1.25, T_FLASH = 1.30, T_VS = 1.40, T_PUNCH = 1.75;
  const SLAM = 6 / FPS, SLAM_D = 1000;
  const PRE = 1 / FPS;                                   // slams pre-roll one frame: the cut frame shows the slab
  const PUNCH_TO = [1372, 460];                          // s06 @ 22.0: the banner's diamond emblem
  const DIVE = 42;                                       // punch scale on 21.967: the diamond (half-diagonal 65 px)
                                                         // covers the frame from PUNCH_TO even in the smallest ghost
  const SLUG_BOX = [100, 978, 720, 1022];                // the dashed hint never crosses the HUD slug
  const NGHOST = 8;                                      // zoom-smear copies per slab (21.9 / 21.933)
  const BLEED = 90;                                      // depth of the light bleed into each slab (px)

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const expoOut = (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
  const p4in = (u) => u * u * u * u;
  const mixHex = (a, b, t) => { const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), Bb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + A.map((v, i) => Math.round(lerp(v, Bb[i], t)).toString(16).padStart(2, '0')).join(''); };

  // ---- slab motion (pure functions of local time) ----
  // body: horizontal offset of a slab (amber from the left: negative; red from the right: positive)
  const slamBody = (t, t0) => { const u = (t - t0) / SLAM; return u < 0 ? SLAM_D : SLAM_D * (1 - expoOut(u)); };
  const slamVel = (t, t0) => { const u = (t - t0) / SLAM; return u < 0 || u >= 1 ? 0 : SLAM_D * 10 * Math.LN2 / SLAM * Math.pow(2, -10 * u); }; // px/s
  // the edge alone overshoots: a half-sine bump over frames 2..6 of the slam (peaks f4, past rest on f4-f5)
  const edgeBump = (t, t0) => { const u = (t - t0 - 2 / FPS) / (4 / FPS); return u <= 0 || u >= 1 ? 0 : 40 * Math.sin(Math.PI * u); };
  // the type follows 2 f behind and settles over 8 f (parallax), then drifts toward the seam
  const typeBody = (t, t0) => { const u = (t - t0) / (8 / FPS); return u < 0 ? 1250 : 1250 * (1 - expoOut(u)); };
  const typeVel = (t, t0) => { const u = (t - t0) / (8 / FPS); return u < 0 || u >= 1 ? 0 : 1250 * 10 * Math.LN2 / (8 / FPS) * Math.pow(2, -10 * u); };
  // the red impact pushes the amber slab back (recoil, frames after the red slam)
  const RECOIL = [0, 0, 0, 7, 10, 6, 2.5, 1, 0];
  const recoil = (t) => { const f = Math.round((t + PRE - T_V) * FPS); return f >= 0 && f < RECOIL.length ? RECOIL[f] : 0; };
  // the 'another' hit (frames from T_FLASH): the ink band stays solid ink (never a translucent grey over the
  // charcoal) and collapses onto the seam line: the full gap, 30%, gone on 21.367 (no tail); frame lift 0.10, 0.04
  const BAND = [1, 0.3];
  const bandAt = (t) => { const f = Math.round((t - T_FLASH) * FPS); return f >= 0 && f < BAND.length ? BAND[f] : 0; };
  const liftAt = (t) => { const f = Math.round((t - T_FLASH) * FPS); return f === 0 ? 0.1 : f === 1 ? 0.04 : 0; };
  // light bleed (gradient into each slab from its inner edge) and the 2 px ink cores, per frame from T_FLASH
  const BLEED_A = [0.9, 0.5, 0.2], CORE_A = [1];
  const flareF = (t) => Math.round((t - T_FLASH) * FPS);
  // punch scale (log space): u^2 in the exponent, so every frame is a bigger step than the last
  // (frames 21.767 ... 21.967: 1.02, 1.22, 1.74, 2.96, 5.98, 14.5, 42)
  const punchS = (t) => { const u = clamp((t - T_PUNCH) / (2 - 1 / FPS - T_PUNCH), 0, 1); return Math.exp(Math.log(DIVE) * u * u); };
  // seam gap (px, perpendicular): 4 at rest, opens fast at 1.25 then keeps easing apart
  const gapAt = (t) => { const u = (t - T_GAP) / 0.3; return 4 + (u <= 0 ? 0 : 40 * expoOut(Math.min(1, u)) + 8 * clamp((t - T_GAP - 0.3) / 0.45, 0, 1)); };

  // half-plane clip of the (padded) frame: keep dot(p - P, n) >= off
  function clipPoly(poly, px, py, nx, ny, off) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = (a[0] - px) * nx + (a[1] - py) * ny - off, db = (b[0] - px) * nx + (b[1] - py) * ny - off;
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) { const k = da / (da - db); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
    }
    return out;
  }
  // padded far past the frame: the clip polygons go through the punch transform (scale up to DIVE + travel)
  const FRAME = [[-2400, -2400], [W + 2400, -2400], [W + 2400, H + 2400], [-2400, H + 2400]];

  // contour bitmap of the Floodgate height field around a summit (product coords), drawn once
  function contourBitmap(height, cx, cy, k, bw, bh, color) {
    const cv = document.createElement('canvas'); cv.width = bw; cv.height = bh;
    const g = cv.getContext('2d');
    const cell = 2.6;                                  // product units per grid cell
    const x0 = cx - bw / 2 / k, y0 = cy - bh / 2 / k;
    const cols = Math.ceil(bw / k / cell) + 1, rows = Math.ceil(bh / k / cell) + 1;
    const f = new Float32Array(cols * rows);
    let lo = Infinity, hi = -Infinity;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const v = height(x0 + c * cell, y0 + r * cell); f[r * cols + c] = v; if (v < lo) lo = v; if (v > hi) hi = v; }
    const step = 0.024, s = cell * k;
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (let lv = Math.ceil(lo / step), n = 0; lv * step < hi; lv++, n++) {
      const v = lv * step, idx = lv % 4 === 0;
      g.beginPath();
      for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
        const a = f[r * cols + c], b = f[r * cols + c + 1], cc = f[(r + 1) * cols + c + 1], d = f[(r + 1) * cols + c];
        let m = 0; const px = [0, 0, 0, 0], py = [0, 0, 0, 0];
        if ((a >= v) !== (b >= v)) { px[m] = (c + (v - a) / (b - a)) * s; py[m++] = r * s; }
        if ((b >= v) !== (cc >= v)) { px[m] = (c + 1) * s; py[m++] = (r + (v - b) / (cc - b)) * s; }
        if ((cc >= v) !== (d >= v)) { px[m] = (c + (v - d) / (cc - d)) * s; py[m++] = (r + 1) * s; }
        if ((d >= v) !== (a >= v)) { px[m] = c * s; py[m++] = (r + (v - a) / (d - a)) * s; }
        for (let i = 0; i + 1 < m; i += 2) { g.moveTo(px[i], py[i]); g.lineTo(px[i + 1], py[i + 1]); }
      }
      g.strokeStyle = B.rgba(color, idx ? 0.17 : 0.095);
      g.lineWidth = idx ? 2.4 : 1.4;
      g.stroke();
    }
    return cv;
  }

  Film.scene({
    id: ID,
    duration: 2,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`
        [data-scene="${ID}"] .x05-full { position:absolute; left:0; top:0; width:${W}px; height:${H}px; }
        [data-scene="${ID}"] .x05-ground { background:${C.bg}; }
        [data-scene="${ID}"] .x05-slug { position:absolute; left:120px; top:990px; font: 500 20px/20px var(--mono); letter-spacing:.12em; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .x05-content { transform-origin: 0 0; }
        [data-scene="${ID}"] .x05-tex { position:absolute; left:0; top:0; transform-origin: 0 0; }
      `);

      // ---------- layers ----------
      const ground = ctx.el('div', 'x05-full x05-ground', root);
      const gContent = ctx.el('div', 'x05-full x05-content', ground);
      const gsv = ctx.svg('svg', { class: 'brand-svg' }, gContent);
      for (let c = -2; c < 15; c++) ctx.svg('line', { x1: c * 160, y1: -400, x2: c * 160, y2: H + 400, stroke: C.amber, 'stroke-opacity': 0.05, 'stroke-width': 1 }, gsv);
      for (let r = -3; r < 12; r++) ctx.svg('line', { x1: -400, y1: r * 135, x2: W + 400, y2: r * 135, stroke: C.amber, 'stroke-opacity': 0.05, 'stroke-width': 1 }, gsv);
      // frame minus the slug box (screen space, evenodd): the seam marks never cross the HUD slug
      const [sbx0, sby0, sbx1, sby1] = SLUG_BOX;
      const slugClip = (svgEl, idn) => {
        const cp = ctx.svg('clipPath', { id: `${ID}-slugclip-${idn}`, clipPathUnits: 'userSpaceOnUse' }, ctx.svg('defs', {}, svgEl));
        ctx.svg('path', { d: `M-4000 -4000 H${W + 4000} V${H + 4000} H-4000 Z M${sbx0} ${sby0} V${sby1} H${sbx1} V${sby0} Z`, 'clip-rule': 'evenodd', 'fill-rule': 'evenodd' }, cp);
        return `url(#${ID}-slugclip-${idn})`;
      };
      // the empty Vega side: a dashed red-orange hairline draws along the seam before the slam
      // (gone before the punch, so the ground's user space is the screen while it shows)
      const hintG = ctx.svg('g', { 'clip-path': slugClip(gsv, 'hint') }, gsv);
      const hint = ctx.svg('line', { x1: P0[0] - DX * 1500, y1: P0[1] - DY * 1500, x2: P0[0] + DX * 1500, y2: P0[1] + DY * 1500, stroke: C.rival, 'stroke-width': 2, 'stroke-opacity': 0.7, 'stroke-dasharray': '10 9' }, hintG);
      const hintMaskId = ID + '-hintmask';
      const hm = ctx.svg('mask', { id: hintMaskId, maskUnits: 'userSpaceOnUse', x: -400, y: -400, width: W + 800, height: H + 800 }, ctx.svg('defs', {}, gsv));
      const hintDraw = ctx.svg('line', { x1: P0[0] - DX * 1500, y1: P0[1] - DY * 1500, x2: P0[0] + DX * 1500, y2: P0[1] + DY * 1500, stroke: '#fff', 'stroke-width': 8 }, hm);
      hint.setAttribute('mask', `url(#${hintMaskId})`);
      hint.setAttribute('transform', `translate(${(-NX * 14).toFixed(2)} ${(-NY * 14).toFixed(2)})`);
      tl.fromTo(hintDraw, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.24, ease: 'power3.out' }, 0.45);
      tl.to(hint, { opacity: 0, duration: 0.001, ease: 'none' }, T_V + 2 / FPS);   // gone under the red slab

      function hudLayer(parent, color, alpha, slugColor) {
        const h = B.hud(ctx, { inset: 72, tc: false, drawIn: false, slug: '', ticks: true, color, alpha, parent });
        const sl = ctx.el('div', 'x05-slug', parent, SLUG);
        sl.style.color = slugColor;
        return h;
      }
      hudLayer(ground, C.amber, 0.8, C.muted3);

      // ---------- slabs ----------
      const height = Floodgate.productHeight();
      function slab(side) {
        const atlas = side === 'atlas';
        const col = atlas ? C.amber : C.rival;
        const wrap = ctx.el('div', 'x05-full', root);
        const fill = ctx.el('div', 'x05-full', wrap);
        // cloth: lighter toward the seam, deeper toward the far corner (palette mixes only)
        const far = atlas ? mixHex(C.amber, C.amberDeep, 0.28) : mixHex(C.rival, C.rivalDeep, 0.55);
        const near = atlas ? mixHex(C.amber, C.amberLight, 0.55) : mixHex(C.rival, C.rivalLight, 0.18);
        fill.style.background = atlas
          ? `linear-gradient(326deg, ${near} 44%, ${col} 62%, ${far} 100%)`
          : `linear-gradient(146deg, ${near} 44%, ${col} 62%, ${far} 100%)`;
        const content = ctx.el('div', 'x05-full x05-content', wrap);   // punch transform
        const mover = ctx.el('div', 'x05-full', content);               // slab translation
        // the 'another' light bleed: a gradient from the inner edge into the slab (screen space; the wrap's clip
        // keeps it inside the slab, so nothing lights the gap), above the cloth and under the slab's HUD, plus the
        // 2 px ink core of the edge (21.3 only)
        const bsv = ctx.svg('svg', { class: 'brand-svg' }, wrap);
        bsv.style.display = 'none';
        const gid = `${ID}-bleed-${side}`;
        const bgr = ctx.svg('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse' }, ctx.svg('defs', {}, bsv));
        const bc = atlas ? C.ink : C.rivalLight, bk = atlas ? 0.7 : 1;   // amberLight would vanish on the light amber cloth
        for (const [o, a] of [[0, 1], [0.16, 0.66], [0.45, 0.26], [0.75, 0.07], [1, 0]]) ctx.svg('stop', { offset: o, 'stop-color': bc, 'stop-opacity': (bk * a).toFixed(3) }, bgr);
        const bleed = ctx.svg('polygon', { fill: `url(#${gid})`, points: '' }, bsv);
        const core = ctx.svg('line', { stroke: C.ink, 'stroke-width': 4, 'stroke-linecap': 'butt' }, bsv);
        return { atlas, wrap, fill, content, mover, col, bsv, bgr, bleed, core };
      }
      const SA = slab('atlas'), SV = slab('vega');

      // giant names + emblems (SVG text: exact baselines and measured widths)
      // parts: [text, dx] runs; a dx opens one pair optically (the brand tracking stays -0.055em)
      function nameLayer(S, parts, x, y, anchor) {
        const sv = ctx.svg('svg', { class: 'brand-svg' }, S.mover);
        const tg = ctx.svg('g', {}, sv);
        const tx = ctx.svg('text', { x, y, 'text-anchor': anchor, fill: C.bg, style: 'font: 640 340px "Manrope Variable"; letter-spacing: -0.055em' }, tg);
        let kern = 0;
        for (const [str, dx] of parts) { const ts = ctx.svg('tspan', { text: str }, tx); if (dx) { ts.setAttribute('dx', dx); kern += dx; } }
        return { sv, tg, tx, w: tx.getComputedTextLength() + kern };
      }
      // Atlas: ATLAS top-left, YOUR TEAM under it, the diamond after it on the cap line.
      // L-A: at -0.055em the foot of the L runs into the second A's leg; +16 px opens that pair only
      const NA = nameLayer(SA, [['ATL', 0], ['AS', 16]], 100, 396, 'start');
      // Vega: VEGA bottom-right, OPPOSITION above it, the ring before it on the cap line
      const NV = nameLayer(SV, [['VEGA', 0]], 1820, 936, 'end');
      const capMid = 0.36 * 340;                         // half the cap height above the baseline
      const DIA = [Math.round(100 + NA.w + 140), Math.round(396 - capMid)];
      const RING = [Math.round(1820 - NV.w - 140), Math.round(936 - capMid)];
      const labA = ctx.svg('text', { x: 108, y: 462, fill: C.bg, 'fill-opacity': 0.82, style: 'font: 600 24px "JetBrains Mono Variable"; letter-spacing: .2em', text: '' }, NA.sv);
      const labV = ctx.svg('text', { x: 1814, y: 936 - 2 * capMid - 44, 'text-anchor': 'end', fill: C.bg, 'fill-opacity': 0.82, style: 'font: 600 24px "JetBrains Mono Variable"; letter-spacing: .2em', text: '' }, NV.sv);
      const diaG = ctx.svg('g', { transform: `translate(${DIA[0]} ${DIA[1]})` }, NA.sv);
      const dia = ctx.svg('rect', { x: -46, y: -46, width: 92, height: 92, fill: C.bg, transform: 'rotate(45)' }, diaG);
      const ringG = ctx.svg('g', { transform: `translate(${RING[0]} ${RING[1]})` }, NV.sv);
      const ring = ctx.svg('circle', { r: 52, fill: 'none', stroke: C.bg, 'stroke-width': 21 }, ringG);
      tl.fromTo(dia, { scale: 0, rotation: -45, svgOrigin: '0 0' }, { scale: 1, rotation: 45, svgOrigin: '0 0', duration: 0.42, ease: 'back.out(2.2)' }, 0.1);
      tl.fromTo(ring, { attr: { r: 0, 'stroke-width': 0 } }, { attr: { r: 52, 'stroke-width': 21 }, duration: 0.42, ease: 'back.out(2.2)' }, T_V + 0.1);
      B.scrambleTo(tl, labA, 'YOUR TEAM', 0.16, 0.36);
      B.scrambleTo(tl, labV, 'OPPOSITION', T_V + 0.16, 0.36);

      // summit contours behind each emblem (cached bitmaps, CSS-moved)
      const K = 2.5, BW = 2600, BH = 1700;
      const texA = contourBitmap(height, 380, 320, K, BW, BH, C.bg);
      const texV = contourBitmap(height, 1260, 690, K, BW, BH, C.bg);
      texA.className = 'x05-tex'; texV.className = 'x05-tex';
      SA.mover.insertBefore(texA, SA.mover.firstChild);
      SV.mover.insertBefore(texV, SV.mover.firstChild);

      // charcoal HUD on each slab (fixed: outside the moving content)
      hudLayer(SA.wrap, C.bg, 0.55, B.rgba(C.bg, 0.62));
      hudLayer(SV.wrap, C.bg, 0.55, B.rgba(C.bg, 0.62));

      // ---------- zoom smear (the dive, 21.9 / 21.933) ----------
      // a slab's cloth + a clone of its name layer, NGHOST copies per slab at 10% each, spread evenly over a
      // 180-degree shutter of the frame's own scale step (log space), each softened by a blur of about half its
      // step (3-18 px; the clip sits inside the blur, so the slab edge softens too): the steps merge into one continuous zoom blur
      // converging on the diamond. The clones are made once here; per frame only the few moving attributes
      // (transforms, the ring's radius, the label text) are copied across. (Contours are too faint to matter.)
      const GHOSTS = [];
      const syncOf = { atlas: [NA.tg, labA, diaG, dia], vega: [NV.tg, labV, ringG, ring] };
      for (const [S, N] of [[SA, NA], [SV, NV]]) {
        const all = Array.from(N.sv.querySelectorAll('*'));
        const idx = syncOf[S.atlas ? 'atlas' : 'vega'].map((e) => all.indexOf(e));
        for (let i = 1; i <= NGHOST; i++) {
          const gw = ctx.el('div', 'x05-full', root);
          gw.style.display = 'none'; gw.style.opacity = '0.1';
          const gi = ctx.el('div', 'x05-full', gw);
          const gf = ctx.el('div', 'x05-full', gi); gf.style.background = S.fill.style.background;
          const gc = ctx.el('div', 'x05-full x05-content', gi);
          const cl = N.sv.cloneNode(true);
          cl.style.filter = '';
          cl.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
          gc.appendChild(cl);
          const call = Array.from(cl.querySelectorAll('*'));
          GHOSTS.push({ S, i, gw, gi, gc, pairs: idx.map((k) => [all[k], call[k]]) });
        }
      }
      const syncGhost = (G) => {
        for (const [o, c] of G.pairs) {
          for (const a of ['transform', 'r', 'stroke-width']) { const v = o.getAttribute(a); if (v !== null && c.getAttribute(a) !== v) c.setAttribute(a, v); }
          if (o.tagName === 'text' && !o.firstElementChild && c.textContent !== o.textContent) c.textContent = o.textContent;
        }
      };
      // the HUD over the charcoal shapes of the Atlas slab (the diamond and the giant ATLAS): amber like the
      // ground's, clipped to their screen shapes (an SVG clipPath following the punch), so the corners and the
      // slug stay lit while the dive blows them up over the HUD and fills the frame with charcoal
      NA.tx.setAttribute('id', ID + '-atlas-tx');
      const dsv = ctx.svg('svg', { width: 0, height: 0, style: 'position:absolute' });
      const darkCp = ctx.svg('clipPath', { id: ID + '-darkclip', clipPathUnits: 'userSpaceOnUse' }, ctx.svg('defs', {}, dsv));
      const darkDia = ctx.svg('polygon', { points: '' }, darkCp);
      const darkTx = ctx.svg('use', { href: `#${ID}-atlas-tx` }, darkCp);
      const diaHud = ctx.el('div', 'x05-full', root);
      diaHud.style.clipPath = `url(#${ID}-darkclip)`;
      diaHud.style.display = 'none';
      hudLayer(diaHud, C.amber, 0.8, C.muted3);

      // ---------- seam layer: motion smears, hairline flash, 3 V 3 ----------
      const seam = ctx.svg('svg', { class: 'brand-svg' });
      const defs = ctx.svg('defs', {}, seam);
      const seamG = ctx.svg('g', {}, seam);
      function smear(col, idn) {
        const gr = ctx.svg('linearGradient', { id: ID + '-sm-' + idn, gradientUnits: 'userSpaceOnUse' }, defs);
        ctx.svg('stop', { offset: '0%', 'stop-color': col, 'stop-opacity': 0.9 }, gr);
        ctx.svg('stop', { offset: '22%', 'stop-color': col, 'stop-opacity': 0.42 }, gr);   // hard edge, short tail
        ctx.svg('stop', { offset: '100%', 'stop-color': col, 'stop-opacity': 0 }, gr);
        const p = ctx.svg('polygon', { fill: `url(#${ID}-sm-${idn})`, points: '' }, seamG);
        return { gr, p };
      }
      const smA = smear(C.amber, 'a'), smV = smear(C.rival, 'v');
      // seam marks (band, 3 V 3), inside the punch transform
      const marksG = ctx.svg('g', {}, seam);
      // the 'another' hit: the gap band between the two inner edges burns ink (two frames)
      const band = ctx.svg('polygon', { fill: C.ink, points: '', opacity: 0 }, marksG);
      // 3 V 3 along the seam (the only statement of the mode: 32 px bold), types on once the gap is clean.
      // Anchored at its start, x = -(glyph run)/2, so every glyph types on in its final place (no re-centring)
      const vs = ctx.svg('text', { x: 0, y: 0, 'text-anchor': 'start', fill: C.ink, style: 'font: 700 32px "JetBrains Mono Variable"; letter-spacing: .3em', text: '3 V 3' }, marksG);
      const vsAdv = vs.getComputedTextLength();                    // 5 advances, each with its .3em tracking
      vs.textContent = '';
      vs.setAttribute('x', (-(vsAdv - 0.3 * 32) / 2).toFixed(2));  // centre the glyphs (drop the trailing tracking)
      // one-frame ink lift of the whole frame on the hit (outside the punch transform)
      const lift = ctx.svg('rect', { x: 0, y: 0, width: W, height: H, fill: C.ink, opacity: 0 }, seam);
      B.scrambleTo(tl, vs, '3 V 3', T_VS, 0.16);
      // where the ink band crosses the HUD slug: a charcoal slug copy clipped to the band, so the slug stays whole
      // (charcoal on ink, like the slab HUDs) and the band runs unbroken
      const slugOver = ctx.el('div', 'x05-full', root);
      slugOver.style.display = 'none';
      ctx.el('div', 'x05-slug', slugOver, SLUG).style.color = B.rgba(C.bg, 0.62);

      // directional blur for the type while it is fast
      const fsv = ctx.svg('svg', { width: 0, height: 0, style: 'position:absolute' });
      const filt = ctx.svg('filter', { id: ID + '-blur', x: '-10%', y: '0%', width: '120%', height: '100%', 'color-interpolation-filters': 'sRGB' }, ctx.svg('defs', {}, fsv));
      const blurA = ctx.svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '0 0' }, filt);
      const filtV = ctx.svg('filter', { id: ID + '-blurv', x: '-10%', y: '0%', width: '120%', height: '100%', 'color-interpolation-filters': 'sRGB' }, ctx.svg('defs', {}, fsv));
      const blurV = ctx.svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '0 0' }, filtV);

      // ---------- the dive (into the diamond): punchS(t), a pure function of time ----------

      const pts = (poly) => poly.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',');
      const svgPts = (poly) => poly.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

      ctx.onFrame((t) => {
        // --- slab offsets (stage coordinates) ---
        const gap = gapAt(t);
        const ga = gap / 2;
        const drift = Math.max(0, t - 0.2) * 9;                     // slow lean toward the seam on the hold
        const tp = t + PRE;                                         // slam clock, one frame ahead
        const ax = -slamBody(tp, T_A) - recoil(t);                  // amber body (<= 0)
        const vx = t < T_V - 1e-6 ? W + 400 : slamBody(tp, T_V);    // red body (>= 0)
        const aEdge = ax + edgeBump(tp, T_A);
        const vEdge = vx - edgeBump(tp, T_V);
        // amber content: slab translation + gap along the normal; red mirrored
        const aOff = [ax + NX * ga, NY * ga], vOff = [vx - NX * ga, -NY * ga];
        // --- punch transform M(p) = Pp + s (p - D) ---
        const D = [DIA[0] + aOff[0] + drift, DIA[1] + aOff[1]];
        const s = punchS(t);
        // the diamond's centre travels on its own clock and lands on s06's banner diamond on the LAST
        // frame before the cut, while the scale keeps accelerating through it
        const up = clamp((t - T_PUNCH) / (2 - 1 / FPS - T_PUNCH), 0, 1), ep = up * up * up;
        const Pp = [lerp(D[0], PUNCH_TO[0], ep), lerp(D[1], PUNCH_TO[1], ep)];
        const M = (p) => [Pp[0] + s * (p[0] - D[0]), Pp[1] + s * (p[1] - D[1])];
        const cssM = `translate(${(Pp[0] - s * D[0]).toFixed(2)}px, ${(Pp[1] - s * D[1]).toFixed(2)}px) scale(${s.toFixed(5)})`;
        gContent.style.transform = cssM;
        SA.content.style.transform = cssM;
        SV.content.style.transform = cssM;
        const svgM = `translate(${(Pp[0] - s * D[0]).toFixed(2)} ${(Pp[1] - s * D[1]).toFixed(2)}) scale(${s.toFixed(5)})`;
        seamG.setAttribute('transform', svgM);
        marksG.setAttribute('transform', svgM);

        // --- clip polygons (stage -> screen through M) ---
        const pa = [P0[0] + aEdge + NX * ga, P0[1] + NY * ga];
        const stA = clipPoly(FRAME, pa[0], pa[1], NX, NY, 0), polyA = stA.map(M);
        SA.wrap.style.clipPath = polyA.length >= 3 ? `polygon(${pts(polyA)})` : 'inset(50%)';
        const pv = [P0[0] + vEdge - NX * ga, P0[1] - NY * ga];
        const stV = t < T_V - 1e-6 ? [] : clipPoly(FRAME, pv[0], pv[1], -NX, -NY, 0), polyV = stV.map(M);
        SV.wrap.style.display = polyV.length >= 3 ? 'block' : 'none';
        if (polyV.length >= 3) SV.wrap.style.clipPath = `polygon(${pts(polyV)})`;

        // --- content translation: type 2 f behind (parallax), contours at 0.7 + a slow drift ---
        const atx = -typeBody(tp, T_A) - recoil(t) * 0.6 + drift;
        const vtx = t < T_V - 1e-6 ? 1250 : typeBody(tp, T_V) - drift * 0.8;
        NA.tg.setAttribute('transform', `translate(${(atx + NX * ga).toFixed(2)} ${(NY * ga).toFixed(2)})`);
        NV.tg.setAttribute('transform', `translate(${(vtx - NX * ga).toFixed(2)} ${(-NY * ga).toFixed(2)})`);
        diaG.setAttribute('transform', `translate(${(DIA[0] + atx + NX * ga).toFixed(2)} ${(DIA[1] + NY * ga).toFixed(2)})`);
        ringG.setAttribute('transform', `translate(${(RING[0] + vtx - NX * ga).toFixed(2)} ${(RING[1] - NY * ga).toFixed(2)})`);
        // labels ride with their names (they live in the name svg, outside tg): keep them on tg's offset
        labA.setAttribute('transform', NA.tg.getAttribute('transform'));
        labV.setAttribute('transform', NV.tg.getAttribute('transform'));
        // the diamond's screen shape (half-diagonal 65 px at rest) and the giant ATLAS carry their own amber HUD
        // (after this frame's name transform is set: never read a transform left by another frame)
        const R = 65.05 * s;
        if (s > 1.5) {
          diaHud.style.display = 'block';
          darkDia.setAttribute('points', svgPts([[Pp[0], Pp[1] - R], [Pp[0] + R, Pp[1]], [Pp[0], Pp[1] + R], [Pp[0] - R, Pp[1]]]));
          darkTx.setAttribute('transform', `${svgM} ${NA.tg.getAttribute('transform')}`);
        } else if (diaHud.style.display !== 'none') diaHud.style.display = 'none';
        // contours: summit centred on the emblem, drifting along the seam, a slow 3% breathe
        const dr = t * 26, br = 1 + 0.03 * t / 2;
        const ta = [DIA[0] + 0.7 * (ax) + NX * ga + DX * dr, DIA[1] + NY * ga + DY * dr];
        texA.style.transform = `translate(${(ta[0] - BW / 2 * br).toFixed(1)}px, ${(ta[1] - BH / 2 * br).toFixed(1)}px) scale(${br.toFixed(4)})`;
        const tv = [RING[0] + 0.7 * vx - NX * ga - DX * dr, RING[1] - NY * ga - DY * dr];
        texV.style.transform = `translate(${(tv[0] - BW / 2 * br).toFixed(1)}px, ${(tv[1] - BH / 2 * br).toFixed(1)}px) scale(${br.toFixed(4)})`;

        // --- type motion blur while fast ---
        const sbA = Math.min(26, typeVel(tp, T_A) / FPS * 0.12), sbV = Math.min(26, typeVel(tp, T_V) / FPS * 0.12);
        blurA.setAttribute('stdDeviation', `${sbA.toFixed(1)} 0`);
        blurV.setAttribute('stdDeviation', `${sbV.toFixed(1)} 0`);
        NA.sv.style.filter = sbA > 0.6 ? `url(#${ID}-blur)` : '';
        NV.sv.style.filter = sbV > 0.6 && t >= T_V - 1e-6 ? `url(#${ID}-blurv)` : '';

        // --- leading-edge motion smears (half a frame of travel, 180 deg shutter) ---
        function setSmear(sm, P, nx, ny, vel) {
          const w = Math.min(110, vel / FPS * 0.5 * Math.abs(nx));   // normal width of the band (capped: hard edge)
          if (w < 2) { sm.p.setAttribute('points', ''); return; }
          // band ahead of the edge: dot(p-P, n) in [-w, 0]
          let poly = clipPoly(FRAME, P[0], P[1], nx, ny, -w);
          poly = clipPoly(poly, P[0], P[1], -nx, -ny, 0).map(M);
          sm.p.setAttribute('points', svgPts(poly));
          const a = M(P), b = M([P[0] - nx * w, P[1] - ny * w]);
          sm.gr.setAttribute('x1', a[0].toFixed(1)); sm.gr.setAttribute('y1', a[1].toFixed(1));
          sm.gr.setAttribute('x2', b[0].toFixed(1)); sm.gr.setAttribute('y2', b[1].toFixed(1));
        }
        setSmear(smA, pa, NX, NY, slamVel(tp, T_A));
        setSmear(smV, pv, -NX, -NY, t >= T_V - 1e-6 ? slamVel(tp, T_V) : 0);

        // --- the 'another' hit: ink band between the inner edges + frame lift ---
        const bA = bandAt(t);
        band.setAttribute('opacity', bA > 0 ? '1' : '0');
        if (bA > 0) {
          // the gap between the inner edges, narrowed about its centre line to bA of its width
          const c = [(pa[0] + pv[0]) / 2, (pa[1] + pv[1]) / 2];
          const hw = 0.5 * ((pa[0] - pv[0]) * NX + (pa[1] - pv[1]) * NY) * bA;
          let bp = clipPoly(FRAME, c[0], c[1], -NX, -NY, -hw);
          bp = clipPoly(bp, c[0], c[1], NX, NY, -hw);
          band.setAttribute('points', svgPts(bp));
          slugOver.style.display = 'block';
          slugOver.style.clipPath = `polygon(${pts(bp.map(M))})`;
        } else {
          band.setAttribute('points', '');
          if (slugOver.style.display !== 'none') slugOver.style.display = 'none';
        }
        lift.setAttribute('opacity', liftAt(t).toFixed(3));

        // --- light bleed from each inner edge into its own slab (under the slab HUD) + the 2 px ink cores ---
        const ff = flareF(t);
        const ba = ff >= 0 && ff < BLEED_A.length ? BLEED_A[ff] : 0, ca = ff >= 0 && ff < CORE_A.length ? CORE_A[ff] : 0;
        for (const [S, P, nx, ny] of [[SA, pa, NX, NY], [SV, pv, -NX, -NY]]) {
          if (!(ba > 0.001) || (!S.atlas && polyV.length < 3)) { if (S.bsv.style.display !== 'none') S.bsv.style.display = 'none'; continue; }
          S.bsv.style.display = '';
          // the band dot(p - P, n) in [0, BLEED], in screen space
          let bp = clipPoly(FRAME, P[0], P[1], nx, ny, 0);
          bp = clipPoly(bp, P[0], P[1], -nx, -ny, -BLEED).map(M);
          S.bleed.setAttribute('points', svgPts(bp));
          S.bleed.setAttribute('opacity', ba.toFixed(3));
          const g0 = M(P), g1 = M([P[0] + nx * BLEED, P[1] + ny * BLEED]);
          S.bgr.setAttribute('x1', g0[0].toFixed(1)); S.bgr.setAttribute('y1', g0[1].toFixed(1));
          S.bgr.setAttribute('x2', g1[0].toFixed(1)); S.bgr.setAttribute('y2', g1[1].toFixed(1));
          const e0 = M([P[0] - DX * 2400, P[1] - DY * 2400]), e1 = M([P[0] + DX * 2400, P[1] + DY * 2400]);
          S.core.setAttribute('x1', e0[0].toFixed(1)); S.core.setAttribute('y1', e0[1].toFixed(1));
          S.core.setAttribute('x2', e1[0].toFixed(1)); S.core.setAttribute('y2', e1[1].toFixed(1));
          S.core.setAttribute('opacity', ca > 0 ? '1' : '0');
        }
        // --- 3 V 3: centred in the gap, along the seam ---
        vs.setAttribute('transform', `translate(${P0[0]} ${P0[1]}) rotate(${(-34).toFixed(1)}) translate(0 11.5)`);
        vs.style.display = gap > 30 && s < 2 ? '' : 'none';   // off before the dive blows it up into debris

        // --- zoom smear: the last frames of the dive (shutter = half the frame's log scale step, NGHOST copies) ---
        const gOn = t >= 2 - 3.5 / FPS && t < 2 - 1.5 / FPS;   // 21.9, 21.933 (21.967 is inside the diamond: pure charcoal)
        const sPrev = punchS(t - 1 / FPS);
        // soften each copy by about half its step at the diamond's edge, so neighbouring copies merge
        const gBlur = `blur(${clamp(0.45 * R * (1 - Math.pow(sPrev / s, 0.5 / NGHOST)), 3, 18).toFixed(1)}px)`;
        for (const G of GHOSTS) {
          const poly = G.S.atlas ? stA : stV;
          if (!gOn || poly.length < 3) { if (G.gw.style.display !== 'none') G.gw.style.display = 'none'; continue; }
          const sg = s * Math.pow(sPrev / s, 0.5 * G.i / NGHOST);
          const Mg = (p) => [Pp[0] + sg * (p[0] - D[0]), Pp[1] + sg * (p[1] - D[1])];
          G.gw.style.display = 'block';
          if (G.gw.style.filter !== gBlur) G.gw.style.filter = gBlur;
          G.gi.style.clipPath = `polygon(${pts(poly.map(Mg))})`;
          G.gc.style.transform = `translate(${(Pp[0] - sg * D[0]).toFixed(2)}px, ${(Pp[1] - sg * D[1]).toFixed(2)}px) scale(${sg.toFixed(5)})`;
          syncGhost(G);
        }
      });
    },
  });
})();
