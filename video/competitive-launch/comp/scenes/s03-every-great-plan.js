/* s03-every-great-plan: film 4.0-12.0 s (8 s, bars 3.1-7.1). Starts 1.0 s over s02 and owns the
 * DRAIN: the frozen round-start world (08:32, Match.state 512, WINDOW camera, 1040 x 780 board
 * window) is rebuilt on an identical frame and drains along its contour lines into the 1943 filter
 * centre table. Then four NODE MATCH CUTS on the archive (rakes, lantern, Apollo 8 huddle, 1904 crews)
 * with the node riding the one spot where people coordinate. Local 0 = film 4.0.
 *
 * Plate features were measured from the graded frames (template tracking + stills); tables below
 * are source pixels keyed by sequence frame number (file 0001 = 1). Overlays follow
 * plateXY(plate, feature(file(lt)), lt): fit + 3 % push + gate weave, stepped on the plate's frames.
 */
(function () {
  'use strict';
  const ID = 's03-every-great-plan';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const S = 1.5;                                        // Floodgate world scale
  const WIN = { x: 440, y: 150, w: 1040, h: 780 };       // SD board window (s02's window, 4:3)
  const HD = { x: 320, y: 130, w: 1280, h: 800 };        // HD archive window (16:10)
  // s02's hand-over frame (film 4.0): Match.HANDOFF is the shared contract with s02
  const HAND = (window.Match && Match.HANDOFF && Match.HANDOFF['s02-freeze-rewind@4.0']) || { node: [607.2, 372], window: WIN };
  const CAMW = (window.Match && Match.CAM && Match.CAM.WINDOW) || { x: 800, y: 520, zoom: 0.56 }; // product units
  const JK_SCREEN = HAND.node;                             // JK's lobby slot under WINDOW
  const NODE_S0 = (HAND.nodeRingR || 24 * CAMW.zoom * S) / 12; // s02's world-space node ring (size 2) / our screen node ring
  const toProduct = (sx, sy) => [CAMW.x + (sx - W / 2) / (CAMW.zoom * S), CAMW.y + (sy - H / 2) / (CAMW.zoom * S)];
  const FR = '../.work/frames/';

  // ---- plates (one model drives Brand.archive and the overlay transform) --------------------
  const PLATES = {
    table:  { dir: FR + 'warroom-filter-map-overhead', count: 84, fps: 30, src: [960, 720], rect: WIN, align: [0.5, 0.5], at: 0.0, out: 1.0, st0: 0.0 },
    rakes:  { dir: FR + 'warroom-plotters-rakes', count: 240, fps: 30, src: [960, 720], rect: WIN, align: [0.5, 0.5], at: 1.0, out: 3.0, st0: 5.5 },
    river:  { dir: FR + 'river-levee-silhouette', count: 118, fps: 24, src: [1440, 1038], rect: HD, align: [0.5, 0.3], at: 3.0, out: 4.5, st0: 0.6 },
    apollo: { dir: FR + 'mc-apollo8-huddle-lift', count: 240, fps: 30, src: [1440, 1064], rect: HD, align: [0.5, 0.0], at: 4.5, out: 6.0, st0: 2.0 },
    crews:  { dir: FR + 'sport-two-crews-1904-hc', count: 116, fps: 24, src: [1440, 1080], rect: HD, align: [0.5, 1.0], at: 6.0, out: null, st0: 0.0 },
  };
  const PUSH = 0.03;
  for (const k in PLATES) { const p = PLATES[k]; p.pushDur = p.out != null ? (p.out - p.at) + 1.0 : 8 - p.at; }
  const seqT = (p, lt) => p.st0 + (lt - p.at);                         // seconds into the clip
  const fileAt = (p, lt) => 1 + Math.min(p.count - 1, Math.max(0, Math.floor(seqT(p, lt) * p.fps + 1e-6)));
  const p1out = gsap.parseEase('power1.out');
  let weaveTab = null;
  function plateXY(p, px, py, lt) {
    const R = p.rect, k = Math.max(R.w / p.src[0], R.h / p.src[1]);
    const fx = (R.w - p.src[0] * k) * p.align[0], fy = (R.h - p.src[1] * k) * p.align[1];
    const s = 1 + PUSH * (1 - p1out(Math.min(1, Math.max(0, (lt - p.at) / p.pushDur))));
    const wt = weaveTab[p.dir], wv = wt[((Math.floor(lt * p.fps) % wt.length) + wt.length) % wt.length];
    return [R.x + R.w / 2 + (fx + px * k - R.w / 2) * s + wv[0], R.y + R.h / 2 + (fy + py * k - R.h / 2) * s + wv[1]];
  }
  // keyframe table {file: [x, y]} -> linear interpolation at an integer file (stepped on frames)
  function kf(tab, f) {
    const ks = tab._k || (tab._k = Object.keys(tab).filter((k) => k !== '_k').map(Number).sort((a, b) => a - b));
    if (f <= ks[0]) return tab[ks[0]];
    if (f >= ks[ks.length - 1]) return tab[ks[ks.length - 1]];
    for (let i = 0; i < ks.length - 1; i++) if (f <= ks[i + 1]) {
      const a = tab[ks[i]], b = tab[ks[i + 1]], u = (f - ks[i]) / (ks[i + 1] - ks[i]);
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    }
    return tab[ks[ks.length - 1]];
  }
  const run = (f0, flat) => { const t = {}; for (let i = 0; i < flat.length; i += 2) t[f0 + i / 2] = [flat[i], flat[i + 1]]; return t; };

  // ---- measured features (source px) --------------------------------------------------------
  // filter-centre table: the plotting marker the node lands on (stable plaque, slight camera drift)
  const TABLE_MARK = { 1: [368, 409], 30: [371, 412], 40: [373, 415], 84: [373, 416] };
  // rakes, middle plotter's T-head (template-tracked, files 163-228) and her handle top
  const RAKE_A = run(163, [404, 637, 398, 641, 397, 642, 397, 642, 397, 642, 387, 653, 376, 661, 363, 649, 349, 641, 349, 641, 332, 641, 317, 643, 309, 638, 308, 636, 307, 634, 308, 632, 309, 630, 309, 630, 310, 629, 310, 629, 310, 628, 310, 628, 310, 628, 310, 627, 310, 627, 309, 626, 309, 626, 309, 625, 310, 625, 310, 624, 310, 623, 310, 621, 310, 619, 310, 618, 310, 618, 310, 616, 309, 615, 309, 614, 309, 613, 309, 612, 309, 610, 309, 609, 309, 609, 309, 609, 309, 609, 310, 607, 309, 607, 310, 608, 310, 610, 310, 610, 310, 610, 310, 610, 310, 611, 310, 611, 310, 611, 310, 610, 310, 610, 309, 610, 310, 610, 310, 610, 310, 609, 310, 608, 310, 608, 310, 608, 310, 608, 310, 609, 309, 609]);
  const RAKE_A_TOP = run(163, [265, 249, 276, 250, 277, 247, 277, 247, 288, 245, 301, 241, 311, 245, 323, 248, 323, 248, 337, 251, 349, 256, 358, 261, 360, 261, 362, 260, 364, 260, 366, 261, 366, 262, 367, 263, 367, 263, 367, 264, 367, 265, 366, 266, 366, 266, 365, 267, 363, 268, 361, 268, 359, 269, 359, 268, 358, 268, 357, 268, 356, 267, 355, 267, 355, 266, 355, 266, 354, 264, 353, 264, 352, 263, 352, 263, 352, 262, 351, 261, 351, 260, 351, 260, 351, 260, 352, 259, 352, 258, 352, 257, 352, 259, 352, 260, 352, 261, 352, 261, 353, 261, 353, 262, 353, 262, 353, 262, 352, 262, 352, 262, 352, 262, 353, 261, 353, 261, 352, 261, 352, 260, 353, 259, 353, 259, 352, 260, 352, 260]);
  // the right plotter's standing rake: T-head on the table, then she slides it up the board
  const RAKE_B = { 163: [549, 690], 202: [550, 690], 207: [566, 670], 212: [567, 637], 218: [578, 635], 226: [614, 655], 228: [618, 657] };
  const RAKE_B_TOP = { 163: [541, 490], 180: [541, 483], 195: [541, 470], 202: [530, 462], 205: [541, 396], 208: [563, 369], 211: [581, 292], 215: [592, 288], 220: [586, 306], 225: [584, 309], 228: [590, 316] };
  // the third plotter's rake, entering from the right edge (foot on the table edge, hand)
  const RAKE_C = { 163: [815, 646], 180: [800, 650], 195: [835, 648], 210: [855, 650], 228: [850, 650] };
  const RAKE_C_TOP = { 163: [882, 505], 180: [870, 500], 195: [895, 500], 210: [885, 530], 228: [865, 560] };
  // The River: the lantern (24 fps frames)
  const LANTERN = { 15: [378, 628], 18: [366, 640], 20: [360, 655], 24: [339, 662], 28: [366, 684], 33: [492, 684], 36: [575, 688], 39: [632, 690], 42: [678, 700], 45: [665, 715], 48: [650, 712], 51: [632, 708] };
  // Apollo 8 huddle (stable): the nearest controller's crown, and three heads (centre, radii)
  const APOLLO_NODE = { 61: [455, 222], 105: [445, 228] };
  const HEADS = [{ c: [442, 334], r: [140, 174] }, { c: [842, 236], r: [132, 140] }, { c: [1120, 186], r: [112, 128] }];
  // 1904: our bow, and the rival boat's bow
  const BOW = { 1: [1230, 860], 12: [1260, 854], 24: [1290, 916], 31: [1260, 936], 40: [1224, 940], 48: [1186, 948] };
  const RIVAL = { 31: [626, 746], 40: [730, 748], 48: [826, 754] };

  Film.scene({
    id: ID,
    duration: 8,
    async build(ctx) {
      const tl = ctx.tl, root = ctx.root;
      weaveTab = {};
      for (const k in PLATES) {
        const r = ctx.rng('weave:' + PLATES[k].dir); // the same table Brand.archive builds
        weaveTab[PLATES[k].dir] = Array.from({ length: 64 }, () => [Math.round(r.range(-1.2, 1.2)), Math.round(r.range(-1.2, 1.2))]);
      }
      const expoIO = gsap.parseEase('expo.inOut'), p2io = gsap.parseEase('power2.inOut'), p2o = gsap.parseEase('power2.out');
      const clamp = B.clamp, lerp = B.lerp;
      const fr = (lt) => Math.round(lt * FPS);
      const twos = (lt) => Math.floor(fr(lt) / 2) * 2 / FPS;

      ctx.css(`
        [data-scene="${ID}"] .s03-bg { position:absolute; inset:0; background:${C.bg}; }
        [data-scene="${ID}"] .s03-full { position:absolute; left:0; top:0; width:${W}px; height:${H}px; }
        [data-scene="${ID}"] .s03-odo { position:absolute; left:0; top:0; color:${C.ink}; }
        [data-scene="${ID}"] .s03-odo .lab { font: 500 20px/20px var(--mono); letter-spacing:.12em; color:${C.muted2}; text-transform:uppercase; white-space:pre; height:20px; }
        [data-scene="${ID}"] .s03-odo .clk, [data-scene="${ID}"] .s03-odo .txt { position:absolute; left:0; top:28px; height:32px; display:flex; font: 600 28px/32px var(--mono); white-space:pre; }
        [data-scene="${ID}"] .s03-odo .reel { position:relative; overflow:hidden; height:32px; width:1ch; }
        [data-scene="${ID}"] .s03-odo .strip { position:absolute; left:0; top:0; width:1ch; text-align:center; }
        [data-scene="${ID}"] .s03-odo .colon { overflow:hidden; height:32px; text-align:center; }
        [data-scene="${ID}"] .s03-slug { position:absolute; left:120px; top:990px; display:flex; align-items:center; font: 500 20px/20px var(--mono); letter-spacing:.12em; color:${C.muted3}; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .s03-slug .ico { overflow:hidden; height:20px; flex:none; }
      `);

      // ---- node path + world switch: registered FIRST so it runs before the node / terrain ----
      let F = null, N = null, NW = null, D = null, field = null, tokEls = [];
      function feature(lt) {
        if (lt < 1.0) { const p = PLATES.table; const q = kf(TABLE_MARK, fileAt(p, lt)); return plateXY(p, q[0], q[1], lt); }
        if (lt < 3.0) { const p = PLATES.rakes; const q = kf(RAKE_A, fileAt(p, lt)); return plateXY(p, q[0], q[1], lt); }
        if (lt < 4.5) { const p = PLATES.river; const q = kf(LANTERN, fileAt(p, lt)); return plateXY(p, q[0], q[1], lt); }
        if (lt < 6.0) { const p = PLATES.apollo; const q = kf(APOLLO_NODE, fileAt(p, lt)); return plateXY(p, q[0], q[1], lt); }
        const p = PLATES.crews; const q = kf(BOW, fileAt(p, lt)); return plateXY(p, q[0], q[1], lt);
      }
      const CUTS = [1.0, 3.0, 4.5, 6.0];
      function nodePos(lt) {
        if (lt < 10 / FPS) { const u = expoIO(clamp(lt / (10 / FPS), 0, 1)); const b = feature(lt); return [lerp(JK_SCREEN[0], b[0], u), lerp(JK_SCREEN[1], b[1], u)]; }
        for (const c of CUTS) {
          if (lt >= c && lt < c + 8 / FPS) {
            const a = feature(c - 1 / FPS), b = feature(lt), u = expoIO(clamp((lt - c) / (8 / FPS), 0, 1));
            return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
          }
        }
        return feature(lt);
      }
      // 0-1.0: the node lives in the world's hot layer (product space, under the three tokens, as s02
      // left it: size 2), shrinks to its screen size on the glide and cross-fades to the screen-space
      // node over the last 4 f of the glide; from then on the screen node carries it.
      const XF0 = 6 / FPS, XF1 = 10 / FPS;
      ctx.onFrame((lt) => {
        if (F) F.T.state.alpha = lt < 1.0 ? 1 : 0;
        const q = nodePos(lt);
        const xf = clamp((lt - XF0) / (XF1 - XF0), 0, 1);
        if (N) { N.p.x = q[0]; N.p.y = q[1]; N.p.a = xf; }
        if (NW) {
          const pp = toProduct(q[0], q[1]);
          NW.p.x = pp[0]; NW.p.y = pp[1]; NW.p.a = lt < 1.0 ? 1 - xf : 0;
          NW.p.s = lerp(1, 1 / NODE_S0, expoIO(clamp(lt / (10 / FPS), 0, 1)));
        }
      });

      // ---- ground ----
      ctx.el('div', 's03-bg', root);

      // ---- archive plates (bare: this scene draws one frame around all of them) ----
      const plates = ctx.el('div', 's03-full', root);
      const A = {};
      for (const k in PLATES) {
        const p = PLATES[k];
        A[k] = B.archive(ctx, {
          dir: p.dir, count: p.count, fps: p.fps, x: p.rect.x, y: p.rect.y, w: p.rect.w, h: p.rect.h, align: p.align, src: p.src,
          at: p.at, out: p.out, open: p.at === 0 ? 'none' : 'cut', close: 'cut', chrome: false, push: PUSH, pushDur: p.pushDur,
          time: (lt) => seqT(p, lt), parent: plates,
        });
      }
      tl.to(A.crews.win, { opacity: 0.75, duration: 0.5, ease: 'none' }, 7.5); // 7.5-8.0 the plate dims

      // ---- the frozen round-start world: s02's 4.0 frame rebuilt with the same kit and state
      //      (Match.state(512), WINDOW camera, ambient frozen at tau -15, 1040 x 780 window clip) ----
      const MS = Match.buildMatchScreen(ctx, { m: 512, tau: -15, camera: 'WINDOW', ui: false, hud: false, slug: '' });
      F = MS.F;
      MS.setClip(HAND.window);
      // the drain clips a wrapper around the world layer (the kit owns the layer's own window clip)
      const drainWrap = ctx.el('div', 's03-full', root);
      root.insertBefore(drainWrap, MS.L.world); drainWrap.appendChild(MS.L.world);
      // THE NODE as s02 left it (world space, size 2, under the tokens), in the hot layer so the drain
      // never cuts it; the three tokens move up with it and vanish when the front passes them
      const hotNode = ctx.svg('g', {}, MS.L.hotWg);
      NW = NodeMark.create(ctx, { parent: hotNode, x: 380, y: 320, size: 2 });
      tokEls = ['nc', 'ek', 'jk'].map((k) => { const el = F.el.tokens[k]; MS.L.hotWg.appendChild(el); return [k, el]; });
      ctx.onFrame((lt) => {
        const on = lt < 1.0;
        drainWrap.style.display = on ? '' : 'none'; MS.L.hot.style.display = on ? '' : 'none';
        if (!on) return;
        const t = D.p.t;
        for (const [k, el] of tokEls) {
          const pp = MS.pos[k] || [380, 320], sx = W / 2 + (pp[0] - CAMW.x) * CAMW.zoom * S, sy = H / 2 + (pp[1] - CAMW.y) * CAMW.zoom * S;
          const a = clamp((t - ContourFlood.valueAt(field, sx, sy)) / 0.03 + 0.5, 0, 1);
          el.style.opacity = a >= 1 ? '' : a.toFixed(3);
        }
      });

      // ---- DRAIN: the world keeps N' < t, t 1 -> 0 over 0-1.0 (power1.inOut), 1.5 px amber front ----
      field = ContourFlood.worldField(F, WIN, { cam: { cx: (CAMW.x + F.M) * S, cy: (CAMW.y + F.M) * S, zoom: CAMW.zoom }, step: 4 });
      D = ContourFlood.create(ctx, { field, target: drainWrap, keep: 'below', frontParent: root });
      D.play(0, 1.0, 1, 0, 'power1.inOut');

      // ---- overlays (screen space) ----
      const ov = ctx.svg('svg', { class: 'brand-svg' });
      const mkMarker = (n) => {
        const g = ctx.svg('g', { opacity: 0 }, ov);
        ctx.svg('circle', { r: 24, fill: 'none', stroke: C.amber, 'stroke-opacity': 0.35, 'stroke-width': 1.5 }, g);
        ctx.svg('circle', { r: 16, fill: C.amber }, g);
        ctx.svg('text', { y: 7, 'text-anchor': 'middle', fill: '#1b140a', style: 'font: 600 20px var(--mono)', text: String(n) }, g);
        return g;
      };
      const stampS = (lt, t0) => { const f = (lt - t0) * FPS; if (f < 0) return 0; if (f < 2) return 1.15 * p2o(f / 2); if (f < 4) return 1.15 - 0.15 * ((f - 2) / 2); return 1; };
      const tele = (w) => ctx.svg('path', { fill: 'none', stroke: C.amber, 'stroke-width': w || 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, ov);
      // rakes: markers 2 and 3 + three handle strokes
      const m2 = mkMarker(2), m3 = mkMarker(3);
      const strokes = [tele(), tele(), tele()];
      const RAKES = [[RAKE_A, RAKE_A_TOP, 1.50], [RAKE_B, RAKE_B_TOP, 1.75], [RAKE_C, RAKE_C_TOP, 2.00]];
      // Apollo: three circles; 1904: course line + chevron, Vega ring
      const circles = HEADS.map(() => tele());
      const course = ctx.svg('line', { stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '10 8', 'stroke-linecap': 'round', opacity: 0 }, ov);
      const chev = ctx.svg('path', { d: 'M-12 -9 L0 0 L-12 9', fill: 'none', stroke: C.amber, 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, ov);
      const vega = ctx.svg('g', { opacity: 0 }, ov);
      ctx.svg('circle', { r: 14, fill: B.rgba(C.rival, 0.12), stroke: C.rival, 'stroke-width': 3 }, vega);
      const vegaPulse = ctx.svg('circle', { r: 14, fill: 'none', stroke: C.rivalLight, 'stroke-width': 1.5, opacity: 0 }, vega);
      const wob = ctx.noise2D('s03-tele');

      ctx.onFrame((lt) => {
        // ----- rakes plate 1.0-3.0 -----
        const onR = lt >= 1.0 && lt < 3.0, pr = PLATES.rakes, fR = fileAt(pr, lt);
        [[m2, RAKE_B, 1.75], [m3, RAKE_C, 2.00]].forEach(([g, tab, t0]) => {
          const s = onR ? stampS(lt, t0) : 0;
          if (s <= 0) { g.setAttribute('opacity', '0'); return; }
          const q = kf(tab, fR), xy = plateXY(pr, q[0], q[1], lt);
          g.setAttribute('opacity', '1');
          g.setAttribute('transform', `translate(${xy[0].toFixed(1)} ${xy[1].toFixed(1)}) scale(${s.toFixed(3)})`);
        });
        RAKES.forEach(([foot, top, t0], i) => {
          const el = strokes[i];
          const u = onR ? clamp((twos(lt) - t0) / 0.4, 0, 1) : 0;
          if (u <= 0) { el.setAttribute('opacity', '0'); return; }
          const a = kf(foot, fR), b = kf(top, fR);
          const pa = plateXY(pr, a[0] + (b[0] - a[0]) * 0.1, a[1] + (b[1] - a[1]) * 0.1, lt), pb = plateXY(pr, b[0], b[1], lt);
          const ex = lerp(pa[0], pb[0], p2o(u)), ey = lerp(pa[1], pb[1], p2o(u));
          const nx = -(pb[1] - pa[1]), ny = pb[0] - pa[0], nl = Math.hypot(nx, ny) || 1;
          const wv = 2.2 * wob(i * 3.1, Math.floor(fr(lt) / 2) * 0.37);
          const mx = (pa[0] + ex) / 2 + nx / nl * wv, my = (pa[1] + ey) / 2 + ny / nl * wv;
          el.setAttribute('d', `M${pa[0].toFixed(1)} ${pa[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
          el.setAttribute('opacity', '0.95');
        });
        // ----- Apollo 4.5-6.0: telestrator circles on twos, 4 f apart, overdrawn to 110 % -----
        const pa = PLATES.apollo;
        HEADS.forEach((hd, i) => {
          const el = circles[i], t0 = 4.60 + i * 4 / FPS;
          const u = lt >= 4.5 && lt < 6.0 ? clamp((twos(lt) - t0) / (7 / FPS), 0, 1) : 0;
          if (u <= 0) { el.setAttribute('opacity', '0'); return; }
          const c = plateXY(pa, hd.c[0], hd.c[1], lt), k = Math.max(pa.rect.w / pa.src[0], pa.rect.h / pa.src[1]);
          const rx = hd.r[0] * k, ry = hd.r[1] * k, th0 = -1.9 + i * 0.35, span = Math.PI * 2 * 1.1 * p2o(u);
          let d = '';
          const n = Math.max(2, Math.ceil(64 * 1.1 * p2o(u)));
          for (let j = 0; j <= n; j++) {
            const th = th0 + span * j / n, grow = 1 + 0.045 * (j / n) * 1.1;
            const rr = grow * (1 + 0.025 * Math.sin(3 * th + i) + 0.018 * Math.sin(5 * th + 2 * i));
            d += (j ? 'L' : 'M') + (c[0] + Math.cos(th) * rx * rr).toFixed(1) + ' ' + (c[1] + Math.sin(th) * ry * rr).toFixed(1);
          }
          el.setAttribute('d', d); el.setAttribute('opacity', '0.95');
        });
        // ----- 1904 6.0-8.0: course line ahead of our bow, then the Vega ring on theirs -----
        const pc = PLATES.crews;
        if (lt >= 6.0) {
          const q = kf(BOW, fileAt(pc, lt)), bw = plateXY(pc, q[0], q[1], lt);
          const u = clamp((lt - 6.10) / 0.6, 0, 1), ue = p2io(u);
          const x0 = bw[0] + 18, x1 = pc.rect.x + pc.rect.w - 26, y = bw[1] - 4;
          course.setAttribute('x1', x0.toFixed(1)); course.setAttribute('y1', y.toFixed(1));
          course.setAttribute('x2', lerp(x0, x1, ue).toFixed(1)); course.setAttribute('y2', y.toFixed(1));
          course.setAttribute('opacity', u > 0 ? '1' : '0');
          const cs = stampS(lt, 6.70);
          chev.setAttribute('opacity', cs > 0 ? '1' : '0');
          chev.setAttribute('transform', `translate(${(x1 + 4).toFixed(1)} ${y.toFixed(1)}) scale(${cs.toFixed(3)})`);
          const vs = stampS(lt, 7.25);
          if (vs > 0) {
            const r = kf(RIVAL, fileAt(pc, lt)), rv = plateXY(pc, r[0], r[1], lt);
            vega.setAttribute('opacity', '1'); vega.setAttribute('transform', `translate(${rv[0].toFixed(1)} ${rv[1].toFixed(1)}) scale(${vs.toFixed(3)})`);
            const pu = clamp((lt - 7.25) / 1.0, 0, 1); // one pulse ring: 1 -> 2.2, .6 -> 0 (the node's language, in Vega's colour)
            vegaPulse.setAttribute('r', (14 * (1 + 1.2 * p2o(pu)) / Math.max(0.01, vs)).toFixed(2));
            vegaPulse.setAttribute('opacity', (pu < 1 ? 0.6 * (1 - pu) : 0).toFixed(3));
          }
          else vega.setAttribute('opacity', '0');
        } else { course.setAttribute('opacity', '0'); chev.setAttribute('opacity', '0'); vega.setAttribute('opacity', '0'); }
      });

      // ---- the frame: one rect proxy (1040 x 780 board window -> 1280 x 800 at 3.0, 4 f) ----
      const R = { x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h };
      tl.to(R, { x: HD.x, y: HD.y, w: HD.w, h: HD.h, duration: 4 / FPS, ease: 'power3.out' }, 3.0);
      const chrome = ctx.svg('svg', { class: 'brand-svg' });
      // hairline + corners exactly as s02 hands them over (1 px amber at 30 %, HUD corners 2 px at 80 %)
      const outline = ctx.svg('rect', { fill: 'none', stroke: C.amber, 'stroke-width': 1, opacity: 0.3 }, chrome);
      const corners = [0, 1, 2, 3].map(() => ctx.svg('path', { fill: 'none', stroke: C.amber, 'stroke-width': 2, 'stroke-opacity': 0.8, 'stroke-linecap': 'square' }, chrome));
      ctx.onFrame((lt) => {
        const x0 = R.x, y0 = R.y, x1 = R.x + R.w, y1 = R.y + R.h, a = 34;
        outline.setAttribute('x', x0.toFixed(2)); outline.setAttribute('y', y0.toFixed(2));
        outline.setAttribute('width', R.w.toFixed(2)); outline.setAttribute('height', R.h.toFixed(2));
        [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, sx, sy], i) =>
          corners[i].setAttribute('d', `M${x.toFixed(1)} ${(y + a * sy).toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)} L${(x + a * sx).toFixed(1)} ${y.toFixed(1)}`));
        // the river plate rides the snap: clip it to the frame while the frame grows
        const snap = lt >= 3.0 && lt < 3.0 + 5 / FPS;
        A.river.el.style.clipPath = snap ? `inset(${(R.y - HD.y).toFixed(1)}px ${(HD.x + HD.w - x1).toFixed(1)}px ${(HD.y + HD.h - y1).toFixed(1)}px ${(R.x - HD.x).toFixed(1)}px)` : '';
      });

      // ---- THE NODE (screen space, on top of the overlays) ----
      N = NodeMark.create(ctx, { x: JK_SCREEN[0], y: JK_SCREEN[1], a: 0 });
      CUTS.forEach((c) => N.step(c));
      // on the rakes the node wears marker "1" (stamped at 1.50, gone on the 3.0 cut)
      const m1 = ctx.svg('g', { opacity: 0 }, N.inner);
      N.inner.insertBefore(m1, N.core);
      ctx.svg('circle', { r: 16, fill: C.amber }, m1);
      ctx.svg('text', { y: 7, 'text-anchor': 'middle', fill: '#1b140a', style: 'font: 600 20px var(--mono)', text: '1' }, m1);
      ctx.onFrame((lt) => {
        const s = lt >= 1.5 && lt < 3.0 ? stampS(lt, 1.50) : 0;
        m1.setAttribute('opacity', s > 0 ? '1' : '0');
        m1.setAttribute('transform', `scale(${s.toFixed(3)})`);
        N.core.setAttribute('opacity', s > 0.6 ? '0' : '1');
      });

      // ---- ODOMETER: 08:32 -> 19:43 -> 1943 (cell rides the frame's top-left corner) ----
      const odo = ctx.el('div', 's03-odo', root);
      const lab = ctx.el('div', 'lab', odo, 'ROUND 2');
      const clk = ctx.el('div', 'clk', odo);
      const txt = ctx.el('div', 'txt', odo, '1943');
      const digits0 = [0, 8, 3, 2];
      const reels = digits0.map((d, i) => {
        const r = ctx.el('div', 'reel', clk);
        const strip = ctx.el('div', 'strip', r, '0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9');
        if (i === 1) ctx.el('div', 'colon', clk, ':');
        return strip;
      });
      const colonEl = clk.querySelector('.colon');
      const chW = reels[0].parentNode.getBoundingClientRect().width || 16.8;
      // reel i steps up by one at 2, 4, 6, 8 f (steps(1) + 3 f settle; frame 0 is s02's 08:32);
      // the colon closes at 0.50 (6 f)
      const STEP = [2, 4, 6, 8].map((f) => f / FPS);
      // s02's rewind rolls its flap clock up one notch per frame into the hand-over (08:29, 08:30,
      // 08:31, 08:32 on its last frames), so on frames 0-2 its reels are still settling: carry that
      // settle over (Match.flapClock SETTLE .16 / -.06 / .02 of a 1.12em = 31.36 px row, rolling up)
      // so the clock does not snap still on the hand-over frame.
      const HSET = [null, null, [0.02, 0, 0], [0.16, -0.06, 0.02]];
      ctx.onFrame((lt) => {
        const f0 = fr(lt);
        reels.forEach((strip, i) => {
          const t0 = STEP[i], on = lt >= t0;
          const v = digits0[i] + (on ? 1 : 0);
          const u = on ? clamp((lt - t0) / (3 / FPS), 0, 1) : 1;
          const off = on ? 0.24 * (1 - p2o(u)) : 0;
          const hs = HSET[i] && f0 >= 0 && f0 < 3 ? -HSET[i][f0] * 31.36 : 0;
          strip.style.transform = `translateY(${((-v + off) * 32 + hs).toFixed(2)}px)`;
        });
        const c = 1 - p2io(clamp((lt - 0.50) / (6 / FPS), 0, 1));
        colonEl.style.width = (chW * c).toFixed(2) + 'px';
        colonEl.style.opacity = c.toFixed(3);
        odo.style.left = R.x + 'px'; odo.style.top = (R.y - 66) + 'px';
      });
      B.scrambleTo(tl, lab, 'ARCHIVE', 0.25, 0.35);
      // 3.00-3.30 the year scrambles out: the year readout lives only over 1943 footage
      tl.fromTo(txt, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: 'none' }, 2.999);
      tl.to(clk, { opacity: 0, duration: 0.001, ease: 'none' }, 2.999);
      B.scrambleTo(tl, txt, '', 3.0, 0.3, '0123456789');
      B.scrambleTo(tl, lab, '', 3.0, 0.3);

      // ---- caption + REF under the frame ----
      const cap = B.label(ctx, { text: 'ARCHIVE · FILTER CENTRE', x: 0, y: 0, at: 0.5, size: 20, color: C.muted, dur: 0.4 });
      // REF nn: the word holds, only the number rolls on each plate cut
      const ref = ctx.el('div', 'brand-label', root, '<span class="w">REF\u00a0</span><span class="n"></span>');
      Object.assign(ref.style, { position: 'absolute', font: '500 20px/1 var(--mono)', letterSpacing: '.12em', color: C.amber, textTransform: 'uppercase', whiteSpace: 'pre' });
      const refW = ref.querySelector('.w'), refN = ref.querySelector('.n');
      tl.fromTo(refW, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 0.55); B.scrambleTo(tl, refN, '01', 0.6, 0.25, '0123456789');
      [[3.0, 'ARCHIVE · THE RIVER', '02'], [4.5, 'ARCHIVE · MISSION CONTROL', '03'], [6.0, 'ARCHIVE · BOAT RACE', '04']].forEach(([t, c, r]) => {
        B.scrambleTo(tl, cap, c, t, 0.32); B.scrambleTo(tl, refN, r, t, 0.2, '0123456789');
      });
      ctx.onFrame(() => {
        cap.style.left = R.x + 'px'; cap.style.top = (R.y + R.h + 22) + 'px';
        ref.style.left = 'auto'; ref.style.right = (W - R.x - R.w) + 'px'; ref.style.top = (R.y + R.h + 22) + 'px';
      });

      // ---- slug: s02's REWIND (double triangle) becomes the archive slug ----
      const slug = ctx.el('div', 's03-slug', root, '');
      const ico = ctx.el('div', 'ico', slug);
      const icoSv = ctx.svg('svg', { width: 34, height: 20, viewBox: '0 0 34 20', style: 'display:block' }, ico);
      ctx.svg('path', { d: 'M13 3 L3 10 L13 17Z M25 3 L15 10 L25 17Z', fill: C.muted3 }, icoSv);
      const slugTxt = ctx.el('span', '', slug, 'REWIND');
      tl.fromTo(ico, { width: 34, opacity: 1 }, { width: 0, opacity: 0, duration: 6 / FPS, ease: 'power2.in' }, 0.05);
      B.scrambleTo(tl, slugTxt, 'REALMS · COMPETITIVE', 0.05, 0.45);
    },
  });
})();
