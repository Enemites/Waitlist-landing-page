/* x11-archive-flash: revision v3 insert (overlay, film 52.5-54.5). Local 0 = 52.5.
 * Two full-bleed archive flashes replace two of s11's eight montage beats; the scene is fully
 * transparent outside them, so s11's map cuts play through.
 *
 *   0.00-0.50 (52.5-53.0, over M2)  chess-1925-move-piece: the hand lifts a piece and sets it down
 *   1.50-2.00 (54.0-54.5, over M5)  sport-crew-race-1904: the crew's oars drive together
 *
 * Each flash uses s11's GRID-CELL CUT grammar (the same 12 x 8 lattice, 160 x 135 cells, charcoal
 * cells + 30% amber lattice lines): frame 1 the A cells are charcoal, frame 2 the B cells, then the
 * plate is clean. The chess flash has NO out-checker: its clean plate holds through 52.967 and s11's
 * own grid cut into M3 (53.0) is the transition, the way s11 changes its own shots (13 clean frames,
 * a 2-frame checker run instead of 4). The crew flash closes on the B cells then the A cells, because
 * s11 hard-cuts at 54.5.
 * The crew plate is source frames 158-176: the near crew in silhouette, oars driving, a rival crew
 * rowing on the horizon (match against another); cropped to the bottom of the 4:3 plate so the label
 * sits on sky.
 *
 * Plate: amber-graded frames (already graded) played at 1.25x so every film frame is a new source
 * frame (24 fps x 1.25 = 30), a 3% push-in over the beat, a +-1 px gate weave on the source cadence,
 * a one-frame exposure lift on the first clean frame, register corners, an 'ARCHIVE · 1925' /
 * 'ARCHIVE · 1904' corner label (letters scramble, the year types on) and s03's archive slug.
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
    { key: 'chess', dir: FR + 'chess-1925-move-piece', count: 48, first: 19, at: 0.0, align: [0.5, 0.36], zoom: 1, origin: '50% 50%', cap: 'ARCHIVE · 1925', outGrid: false },
    // the crew: near crew in silhouette driving the oars, the rival crew on the horizon, sky above
    { key: 'crew', dir: FR + 'sport-crew-race-1904', count: 192, first: 158, at: 1.5, align: [0.5, 1.0], zoom: 1.15, origin: '50% 85%', cap: 'ARCHIVE · 1904', outGrid: true },
  ];
  const RATE = 1.25;
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
        [data-scene="${ID}"] .x11-slug { position:absolute; left:120px; top:990px; font: 500 20px/20px var(--mono); letter-spacing:.12em; color:${C.muted3}; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .x11-cap { position:absolute; left:120px; top:112px; display:flex; align-items:center; gap:14px; font: 500 22px/22px var(--mono); letter-spacing:.14em; color:${C.amber}; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .x11-cap .dia { width:10px; height:10px; background:${C.amber}; transform:rotate(45deg); flex:none; }
      `);

      const shots = SHOTS.map((S, si) => {
        const wrap = ctx.el('div', 'x11-shot', root);
        const plate = ctx.el('div', 'x11-plate', wrap);
        plate.style.transformOrigin = S.origin;
        const seq = ctx.sequence({
          dir: S.dir, count: S.count, fps: 24, fit: 'cover', align: S.align, width: W, height: H, parent: plate, preload: 8,
          // every film frame is the next source frame; held on the first/last frame outside the beat
          time: (lt) => (S.first - 1) / 24 + Math.min(Math.max(lt - S.at, 0), (LEN - 1) / FPS) * RATE + 0.25 / 24,
        });
        void seq;
        const lift = ctx.el('div', 'x11-lift', wrap);
        // register corners (archive frame marks, inset like the HUD) + lattice for the grid-cell cut
        const sv = ctx.svg('svg', { class: 'brand-svg' }, wrap);
        const I = 72, A = 34;
        [[I, I, 1, 1], [W - I, I, -1, 1], [I, H - I, 1, -1], [W - I, H - I, -1, -1]].forEach(([x, y, sx, sy]) =>
          ctx.svg('path', { d: `M${x} ${y + A * sy} L${x} ${y} L${x + A * sx} ${y}`, stroke: C.amber, 'stroke-width': 2, fill: 'none', 'stroke-opacity': 0.85, 'stroke-linecap': 'square' }, sv));
        const grid = ctx.svg('g', { style: 'display:none' }, sv);
        const cellsA = ctx.svg('g', {}, grid), cellsB = ctx.svg('g', {}, grid);
        for (let c = 0; c < 12; c++) for (let r = 0; r < 8; r++) ctx.svg('rect', { x: c * 160, y: r * 135, width: 160, height: 135, fill: C.bg }, (c + r) % 2 ? cellsB : cellsA);
        const gl = ctx.svg('g', { stroke: C.amber, 'stroke-opacity': 0.3, 'stroke-width': 1 }, grid);
        for (let c = 1; c < 12; c++) ctx.svg('line', { x1: c * 160, y1: 0, x2: c * 160, y2: H }, gl);
        for (let r = 1; r < 8; r++) ctx.svg('line', { x1: 0, y1: r * 135, x2: W, y2: r * 135 }, gl);
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
          // grid-cell cut: in A, B; out B, A (crew only: the chess plate hands over to s11's own grid cut)
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
          // label: 'ARCHIVE' scrambles in over the first 7 frames (letters only), the year types on
          const cu = Math.min(1, Math.max(0, (k + 1) / 8));
          const txt = B.scrambleFrame('', o.S.cap, cu, { seed: o.seed, time: k / FPS });
          if (o.capT.textContent !== txt) o.capT.textContent = txt;
        }
      });
    },
  });
})();
