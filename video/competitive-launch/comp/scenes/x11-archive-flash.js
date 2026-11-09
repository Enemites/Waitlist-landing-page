/* x11-archive-flash: revision v3 insert (overlay, film 52.5-54.5). Local 0 = 52.5.
 * Two full-bleed archive flashes replace two of s11's eight montage beats; the scene is fully
 * transparent outside them, so s11's map cuts play through.
 *
 *   0.00-0.50 (52.5-53.0, over M2)  chess-1925-move-piece: the hand lifts a piece and sets it down
 *   1.50-2.00 (54.0-54.5, over M5)  river-levee-sandbag-team (The River, 1937, FSA): men stacking sandbags
 *                                   against the flood; a full bag swings out of one man's hands down the line
 *
 * Each flash opens with s11's GRID-CELL CUT grammar (the same 12 x 8 lattice, 160 x 135 cells, charcoal
 * cells + 30% amber lattice lines): frame 1 the A cells are charcoal, frame 2 the B cells, then the
 * plate is clean. The register corners sit ABOVE the cells, so all four hold through the checker.
 * Neither flash has an out-checker (the grid cut is s11's peak-tempo device; with x11 it fired five times
 * in 2.5 s): the chess plate holds clean through 52.967 and s11's own grid cut into M3 (53.0) is the
 * transition; the levee plate holds clean through 54.467 and HARD-CUTS into s11's 54.5 beat cut (M6).
 * Both get 13 clean frames.
 * The levee plate is source frames 35-49 at 1.25x like the chess (every film frame a new source frame); the
 * clean frames are 37-49: the middle man holds a full bag up (37-42), then it swings out of his hands and down
 * the line to the next pair of hands (43-49; a team effort; it replaces the 1904 crew, which repeated s03's
 * 10-12 s shot).
 * Its scan is flatter than the chess plate (blacks ~17, highlights ~112 vs ~10 / ~158), so it is
 * re-graded on the brand ramp at draw time: an SVG filter takes the frame's luminance, stretches it to the
 * chess plate's range (deep blacks, the sky lifted to light amber, with a shoulder above ramp 0.5 so the
 * stretch does not amplify the sky's grain) and maps it back onto the extractor's
 * ramp #0b0c0e > #5a472f > #a37a42 > #f6d39f, so both flashes share one grade. The scan is also soft (it is
 * upscaled no more than the chess plate; zooming would only soften it), so the filter first de-grains
 * (1.1 px) and runs an unsharp mask (3 px, amount 1.1) ahead of the luminance tables: edges crisper, grain
 * held near the chess plate's.
 *
 * Plate: amber-graded frames (already graded) played at 1.25x so every film frame is a new source frame
 * (24 fps x 1.25 = 30), a 3% push-in over the beat, a +-1 px gate weave on the source cadence,
 * a one-frame exposure lift on the first clean frame, register corners (on the levee, a 30% charcoal shade over
 * the top 220 px and bottom 160 px separates the label and slug from its bright sky), an 'ARCHIVE · 1925' /
 * 'ARCHIVE · 1937' corner label (letters scramble, the year types on, readable from the 4th frame) and
 * s03's archive slug.
 */
(function () {
  'use strict';
  const ID = 'x11-archive-flash';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const FR = '../.work/frames/';
  const LEN = 15;                      // frames per flash (0.5 s)
  const SHOTS = [
    // first: source frame (1-based) on the cut frame; align: crop of the 4:3 plate inside 16:9
    { key: 'chess', dir: FR + 'chess-1925-move-piece', count: 48, first: 19, at: 0.0, align: [0.5, 0.36], zoom: 1, origin: '50% 50%', cap: 'ARCHIVE · 1925', outGrid: false, rate: 1.25 },
    // the levee: the middle man holds a full bag up (source 37-42), then it swings out of his hands down the line
    // (43-49); clean frames = source 37-49. No out-checker: the clean plate hard-cuts into s11's 54.5 beat cut.
    // align top: the men's heads in frame (only the bottom plank is lost); the push origin high, so it keeps them
    { key: 'levee', dir: FR + 'river-levee-sandbag-team', count: 90, first: 35, at: 1.5, align: [0.5, 0.0], zoom: 1, origin: '50% 30%', cap: 'ARCHIVE · 1937', outGrid: false, rate: 1.25, regrade: true, shade: true },
  ];
  // re-grade for the levee scan (see the header): source luminance -> ramp position x (inverse of the
  // extractor's ramp), stretched from its range (x 0.022 .. 0.575, p1 .. p99) to the chess plate's (0 .. 0.785)
  // with a 1.15 gamma that keeps the mids and deepens the shadows, then back onto the ramp
  const RAMP = [[11, 12, 14], [90, 71, 47], [163, 122, 66], [246, 211, 159]];
  const rampAt = (x) => { const f = Math.min(2.9999, Math.max(0, x) * 3), i = Math.floor(f), u = f - i; return RAMP[i].map((v, c) => v + (RAMP[i + 1][c] - v) * u); };
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const RAMP_L = RAMP.map(lum);
  const rampX = (L) => { for (let i = 0; i < 3; i++) if (L <= RAMP_L[i + 1] || i === 2) return Math.min(1, Math.max(0, (i + (L - RAMP_L[i]) / (RAMP_L[i + 1] - RAMP_L[i])) / 3)); return 1; };
  // shoulder: above ramp position 0.5 (the sky and the water, scan p90-p99) the slope eases from 1 to SH_END, so the
  // stretch stops amplifying the sky's grain; the top lands at ~0.71 instead of 0.785 and the mids are unchanged
  const SH_K = 0.5, SH_END = 0.45, SH_R = 0.785 - SH_K;
  const shoulder = (y) => (y <= SH_K ? y : y - (1 - SH_END) * (y - SH_K) * (y - SH_K) / (2 * SH_R));
  const REGRADE = (x) => shoulder(0.785 * Math.pow(Math.min(1, Math.max(0, (x - 0.022) / 0.553)), 1.15));
  // unsharp mask ahead of the tables (the River scan is soft; it is upscaled no more than the chess plate, so it is
  // sharpened rather than zoomed): src + USM_A x (src - blur(USM_R)), after a light de-grain blur (DG_R) so the
  // mask lifts edges, not the scan's pixel grain
  const DG_R = 1.1, USM_R = 3.0, USM_A = 1.1;
  const PUSH = 0.03;
  const p2o = (u) => 1 - (1 - u) * (1 - u);

  Film.scene({
    id: ID,
    duration: 2,
    build(ctx) {
      const { root } = ctx;
      ctx.css(`
        [data-scene="${ID}"] .x11-shot { position:absolute; left:0; top:0; width:${W}px; height:${H}px; overflow:hidden; background:${C.bg}; display:none; }
        [data-scene="${ID}"] .x11-plate { position:absolute; left:0; top:0; width:${W}px; height:${H}px; transform-origin:50% 50%; }
        [data-scene="${ID}"] .x11-lift { position:absolute; inset:0; background:${C.amberLight}; opacity:0; display:none; }
        [data-scene="${ID}"] .x11-shade { position:absolute; inset:0; background: linear-gradient(180deg, rgba(11,12,14,.3) 0px, rgba(11,12,14,0) 220px, rgba(11,12,14,0) 920px, rgba(11,12,14,.3) 1080px); }
        [data-scene="${ID}"] .x11-slug { position:absolute; left:120px; top:990px; font: 500 20px/20px var(--mono); letter-spacing:.12em; color:${C.muted3}; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .x11-cap { position:absolute; left:120px; top:112px; display:flex; align-items:center; gap:14px; font: 500 22px/22px var(--mono); letter-spacing:.14em; color:${C.amber}; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .x11-cap .dia { width:10px; height:10px; background:${C.amber}; transform:rotate(45deg); flex:none; }
      `);

      // the levee re-grade as an SVG filter (sRGB): luminance -> per-channel tables along the brand ramp
      const fsv = ctx.svg('svg', { width: 0, height: 0, style: 'position:absolute' });
      const filt = ctx.svg('filter', { id: ID + '-regrade', x: 0, y: 0, width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' }, ctx.svg('defs', {}, fsv));
      // each blur is renormalised (alpha forced to 1 on un-premultiplied colour), so the plate edge, where the blur
      // reads transparent pixels, gets no bright unsharp rim
      const NORM = '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1';
      ctx.svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: DG_R, result: 'dg0' }, filt);
      ctx.svg('feColorMatrix', { in: 'dg0', type: 'matrix', values: NORM, result: 'dg' }, filt);
      ctx.svg('feGaussianBlur', { in: 'dg', stdDeviation: USM_R, result: 'bl0' }, filt);
      ctx.svg('feColorMatrix', { in: 'bl0', type: 'matrix', values: NORM, result: 'bl' }, filt);
      ctx.svg('feComposite', { in: 'dg', in2: 'bl', operator: 'arithmetic', k1: 0, k2: 1 + USM_A, k3: -USM_A, k4: 0, result: 'sh' }, filt);
      ctx.svg('feColorMatrix', { in: 'sh', type: 'matrix', values: '0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0' }, filt);
      const ct = ctx.svg('feComponentTransfer', {}, filt);
      const NT = 96, tabs = [[], [], []];
      for (let i = 0; i < NT; i++) { const c = rampAt(REGRADE(rampX(255 * i / (NT - 1)))); for (let k = 0; k < 3; k++) tabs[k].push((c[k] / 255).toFixed(4)); }
      ['feFuncR', 'feFuncG', 'feFuncB'].forEach((f, k) => ctx.svg(f, { type: 'table', tableValues: tabs[k].join(' ') }, ct));

      const shots = SHOTS.map((S, si) => {
        const wrap = ctx.el('div', 'x11-shot', root);
        const plate = ctx.el('div', 'x11-plate', wrap);
        plate.style.transformOrigin = S.origin;
        const seq = ctx.sequence({
          dir: S.dir, count: S.count, fps: 24, fit: 'cover', align: S.align, width: W, height: H, parent: plate, preload: 8,
          // every film frame is the next source frame (24 fps x 1.25 = 30); held outside the beat
          time: (lt) => (S.first - 1) / 24 + Math.min(Math.max(lt - S.at, 0), (LEN - 1) / FPS) * S.rate + 0.25 / 24,
        });
        void seq;
        if (S.regrade) plate.style.filter = `url(#${ID}-regrade)`;
        // the levee's bright sky: a charcoal shade over the top 220 px and the bottom 160 px, so the label, the
        // register corners and the slug separate from it
        if (S.shade) ctx.el('div', 'x11-shade', wrap);
        const lift = ctx.el('div', 'x11-lift', wrap);
        // register corners (archive frame marks, inset like the HUD) + lattice for the grid-cell cut
        const sv = ctx.svg('svg', { class: 'brand-svg' }, wrap);
        const grid = ctx.svg('g', { style: 'display:none' }, sv);
        const cellsA = ctx.svg('g', {}, grid), cellsB = ctx.svg('g', {}, grid);
        for (let c = 0; c < 12; c++) for (let r = 0; r < 8; r++) ctx.svg('rect', { x: c * 160, y: r * 135, width: 160, height: 135, fill: C.bg }, (c + r) % 2 ? cellsB : cellsA);
        const gl = ctx.svg('g', { stroke: C.amber, 'stroke-opacity': 0.3, 'stroke-width': 1 }, grid);
        for (let c = 1; c < 12; c++) ctx.svg('line', { x1: c * 160, y1: 0, x2: c * 160, y2: H }, gl);
        for (let r = 1; r < 8; r++) ctx.svg('line', { x1: 0, y1: r * 135, x2: W, y2: r * 135 }, gl);
        // the register corners go ABOVE the checker cells: all four hold on every frame of the cut (drawn under the
        // grid, the charcoal A cells hid the top-left / bottom-right pair and the B cells the other pair: a HUD blink)
        const I = 72, A = 34;
        [[I, I, 1, 1], [W - I, I, -1, 1], [I, H - I, 1, -1], [W - I, H - I, -1, -1]].forEach(([x, y, sx, sy]) =>
          ctx.svg('path', { d: `M${x} ${y + A * sy} L${x} ${y} L${x + A * sx} ${y}`, stroke: C.amber, 'stroke-width': 2, fill: 'none', 'stroke-opacity': 0.85, 'stroke-linecap': 'square' }, sv));
        // corner label + archive slug (s03 style)
        const cap = ctx.el('div', 'x11-cap', wrap, '<span class="dia"></span><span class="t"></span>');
        const capT = cap.querySelector('.t');
        ctx.el('div', 'x11-slug', wrap, 'REALMS · COMPETITIVE');
        // the label resolves on the beat: letters scramble, the year types on (scramble policy)
        const seed = 0x11a0 + si * 977;
        // gate weave: +-1 px, changes on the source cadence (every 24th of a second of source time)
        const r = ctx.rng('x11-weave-' + S.key);
        const weave = Array.from({ length: 32 }, () => [Math.round(r.range(-1.2, 1.2)), Math.round(r.range(-1.2, 1.2))]);
        return { S, wrap, plate, lift, grid, cellsA, cellsB, capT, seed, weave };
      });

      ctx.onFrame((lt) => {
        for (const o of shots) {
          const k = Math.round((lt - o.S.at) * FPS);
          const on = k >= 0 && k < LEN;
          const disp = on ? 'block' : 'none';
          if (o.wrap.style.display !== disp) o.wrap.style.display = disp;
          if (!on) continue;
          // grid-cell cut: in A, B (an out-checker B, A is still possible per shot with outGrid; neither uses it)
          const out = o.S.outGrid;
          const gc = k === 0 ? 'A' : k === 1 ? 'B' : out && k === LEN - 2 ? 'B' : out && k === LEN - 1 ? 'A' : '';
          o.grid.style.display = gc ? '' : 'none';
          if (gc) { o.cellsA.style.display = gc === 'A' ? '' : 'none'; o.cellsB.style.display = gc === 'B' ? '' : 'none'; }
          // 3% push-in across the beat (power out: the move is alive from the first frame) + weave
          const u = k / (LEN - 1);
          const s = 1 + PUSH * p2o(u);
          const wv = o.weave[k % o.weave.length];
          o.plate.style.transform = `translate(${wv[0]}px, ${wv[1]}px) scale(${(s * o.S.zoom).toFixed(5)})`;
          // exposure lift: one bright frame as the plate comes clean, decaying over two more
          const lv = k === 2 ? 0.13 : k === 3 ? 0.05 : 0;
          o.lift.style.display = lv ? 'block' : 'none';
          o.lift.style.opacity = String(lv);
          // label: 'ARCHIVE' scrambles in over the first 3 frames (letters only), the year types on; it reads
          // whole from the 4th frame (12 of the 15)
          const cu = Math.min(1, Math.max(0, (k + 1) / 4));
          const txt = B.scrambleFrame('', o.S.cap, cu, { seed: o.seed, time: k / FPS });
          if (o.capT.textContent !== txt) o.capT.textContent = txt;
        }
      });
    },
  });
})();
