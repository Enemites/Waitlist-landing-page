/* world-city.js (v4): STORM CITY, an isometric city at night in a storm (canvas renderer).
 *
 * The look: an orthographic dimetric view of a dense night city. Charcoal blocks of buildings whose
 * faces carry thousands of lit windows (amber / bone / ink on charcoal), wet dark streets with
 * street lamps and moving car lights, a river with sunk embankments and lit bridges, a power plant
 * (two cooling towers with steam, turbine hall, chimney), a landmark tower downtown, rain streaks,
 * low drifting cloud, lightning (flash + bolt). Districts can be lit or blacked out one by one, a
 * coloured wave can kill a district block by block, and routes (plans) and markers are drawn over it.
 * No contour lines anywhere: this world must not look like the topographic maps of the film.
 *
 *   const city = WorldCity.create(ctx, o)
 *     o.seed        model seed (default 'storm'; the model is baked once per seed and shared)
 *     o.parent      canvas parent (default ctx.root)
 *     o.cam         camera proxy start values (tween city.cam on ctx.tl):
 *                     tx, ty   world point (ground) the camera looks at
 *                     zoom     screen px per world unit
 *                     yaw      degrees (45 = the classic diamond; the -y (north) axis then rises to the right)
 *                     pitch    degrees above the horizon (42.4 puts both street axes at +-34 deg = Brand.SLANT)
 *                     sx, sy   screen position of the target, relative to the frame centre (px)
 *                     shake    px of camera shake (pure function of time)
 *     o.look        proxy: alpha, lights (global window/lamp multiplier), rain, fog, haze, flash (extra
 *                     manual flash 0..1), xray (strength of the see-through pass of routes), cars, ground
 *     o.clip(g, lt) optional: build a path (identity transform) that clips everything this instance draws
 *     o.cull        optional [x0, y0, x1, y1] screen rect: objects outside it are skipped (use with clip)
 *     o.strikes     lightning: [{ t, x, y, z, k }] (world strike point; k = strength 0..1, default 1)
 *     o.rainSeed    seed of the rain streaks (default the canvas id)
 *
 *   city.cam / city.look      proxies (above)
 *   city.M                    the model: { POINTS, streetX(i), streetY(j), riverY(x), districts, cells... }
 *   city.district(name)       proxy { lit } (0..1, default 1): lights of a whole district
 *   city.route(o)             a plan drawn over the city. o: { pts: [[x, y], ...] world polyline (street
 *                               centres; corners are rounded), color, light, width (3.2 px core), glow (1),
 *                               dash ([18, 10] px; null = solid), lift (z units), arrow (true), xray (0.55) }
 *                             returns h with h.p proxy: draw 0..1, tail 0..1, alpha, head (head glow), march
 *                             (dash speed px/s), cut0 / cut1 (arc fractions of a broken stretch, -1 = none),
 *                             cutA (0..1: how broken that stretch is) and h.at(u) -> [x, y], h.L (length)
 *   city.marker(o)            o: { x, y, kind: 'atlas'|'vega'|'objective'|'start'|'dot', color, h (beam height,
 *                               units), r (ring radius, units) } -> proxy { a, grow, pulse (0..1 one ring) }
 *   city.wave(o)              a front that sweeps a district from (x, y): o: { district, x, y, t0, speed
 *                               (units/s), color (rival), kill (true) }. Buildings and lamps die block by
 *                               block as it passes (flash of the wave colour, flicker, dark).
 *   city.relight(route, o)    buildings near `route` come back on as its head passes ({ radius: 70 })
 *   city.draw(fn)             extra drawing after the buildings, before rain: fn(g, lt, city)
 *   city.toScreen(x, y, z)    -> [sx, sy] for the current camera (call inside ctx.onFrame)
 *   city.flashAt(lt)          the lightning flash level (0..1+) at local time lt
 *
 * Rendering: everything is a pure function of the proxies and lt. The model (blocks, lots, heights,
 * window textures, ground texture) is baked once per seed. Painter's order is exact: the city is a
 * grid of cell slabs (each block plus the street to its east / south) and every block is a BSP of
 * lots, so the far-to-near order only depends on the signs of sin(yaw) and cos(yaw). Faces are
 * parallelograms (orthographic), filled with a window pattern through an affine transform: one fill
 * per face. Measured per frame on this machine: see the scene notes (c05b-split, c07c-adapt).
 */
(function () {
  'use strict';
  const W = 1920, H = 1080, DEG = Math.PI / 180;
  const C = Brand.C;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 1).toFixed(4)})`;
  const hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; };

  // ---- model constants (world units) ----
  const N = 20, P = 128, ORG = -(N * P) / 2;      // cells per axis, cell pitch, west / north edge of the city
  const TPU = 2;                                   // window texture texels per world unit
  const CW = 5, FL = 6;                            // window column width, floor height
  const TC = 16, TR = 24;                          // window tile: columns x rows
  const TW = TC * CW * TPU, TH = TR * FL * TPU;    // 160 x 288 texels
  const WATER_Z = -9;                              // river surface (the embankments are sunk walls)
  const RHW = 46, RPAD = 14;                       // river half width, embankment road
  const GTEX = 1;                                  // ground texture texels per unit
  const GMARGIN = 260;                             // ground texture margin around the city

  const COL = {
    amber: hexRgb(C.amber), amberL: hexRgb(C.amberLight), amberD: hexRgb(C.amberDeep), bone: hexRgb(C.bone), ink: hexRgb(C.ink), rival: hexRgb(C.rival),
    rivalL: hexRgb(C.rivalLight), bg: hexRgb(C.bg),
  };
  // derived darks (charcoal family). Walls per world facing (E, S, W, N): the city glow comes from the
  // south-east, so E is the lightest, then S.
  const WALL = { E: hexRgb('#18160f'), S: hexRgb('#100f0d'), W: hexRgb('#0e0d0c'), N: hexRgb('#0c0c0b') };
  const ROOF = hexRgb('#151413');
  const GLASS = hexRgb('#17171a');
  const GROUND = hexRgb('#0c0c0e');

  // ---------------------------------------------------------------------------------------------
  // Window tiles: one layout per variant (which window is lit, colour, brightness), rendered as an
  // opaque tile per wall facing (wall + glass + lights) and as lights-only tiles (for flares / tint).
  // ---------------------------------------------------------------------------------------------
  const VARIANTS = [
    { key: 'res', p: 0.22, rowVar: 0.35, cols: [['amberL', 0.4], ['bone', 0.35], ['amber', 0.25]] },
    { key: 'resDense', p: 0.36, rowVar: 0.3, cols: [['amberL', 0.38], ['bone', 0.37], ['amber', 0.25]] },
    { key: 'office', p: 0.5, rowVar: 0.85, cols: [['ink', 0.45], ['bone', 0.4], ['amberL', 0.15]] },
    { key: 'band', p: 0.62, rowVar: 0.7, band: true, cols: [['bone', 0.5], ['ink', 0.35], ['amberL', 0.15]] },
    { key: 'ind', p: 0.07, rowVar: 0.2, cols: [['amberL', 0.6], ['bone', 0.4]] },
    { key: 'tower', p: 0.6, rowVar: 0.55, cols: [['ink', 0.4], ['amberL', 0.35], ['amber', 0.25]] },
  ];
  const VIDX = Object.fromEntries(VARIANTS.map((v, i) => [v.key, i]));
  let TILES = null;
  function tiles() {
    if (TILES) return TILES;
    const r = Film.utils.rng('city-windows');
    const out = { opaque: [], amber: [], rival: [] };
    VARIANTS.forEach((v) => {
      const lay = [];
      const rowF = Array.from({ length: TR }, () => (r() < v.rowVar * 0.5 ? (r() < 0.5 ? 0.15 : 1.7) : 1));
      for (let rr = 0; rr < TR; rr++) {
        for (let cc = 0; cc < TC; cc++) {
          const on = r() < v.p * rowF[rr];
          let x = r(), col = v.cols[0][0];
          for (const [cn, w] of v.cols) { if (x < w) { col = cn; break; } x -= w; }
          lay.push({ rr, cc, on, col, k: 0.55 + 0.45 * r(), blind: r() < 0.18 ? 0.3 + 0.4 * r() : 0 });
        }
      }
      const mk = () => { const c = document.createElement('canvas'); c.width = TW; c.height = TH; return c; };
      const paint = (g, mode, wall) => {
        if (wall) { g.fillStyle = `rgb(${wall[0]},${wall[1]},${wall[2]})`; g.fillRect(0, 0, TW, TH); }
        // floor lines (slab edges) on the opaque tiles
        if (wall) { g.fillStyle = 'rgba(0,0,0,0.22)'; for (let rr = 0; rr < TR; rr++) g.fillRect(0, rr * FL * TPU, TW, 1); }
        for (const w of lay) {
          const x = w.cc * CW * TPU, y = w.rr * FL * TPU;
          const wx = x + 2, wy = y + 3, ww = CW * TPU - 4, wh = FL * TPU - 5;
          if (v.band) {
            // continuous strip glazing: one strip per floor, lit segment by segment
            if (wall) { g.fillStyle = rgba(GLASS, 1); g.fillRect(x, wy, CW * TPU, wh); }
            if (!w.on) continue;
            const c = mode === 'rival' ? COL.rival : COL[w.col];
            g.shadowColor = rgba(c, 0.55 * w.k); g.shadowBlur = 5;
            g.fillStyle = rgba(c, 0.9 * w.k); g.fillRect(x, wy + 1, CW * TPU, wh - 2);
            g.shadowBlur = 0;
            continue;
          }
          if (!w.on) { if (wall) { g.fillStyle = rgba(GLASS, 1); g.fillRect(wx, wy, ww, wh); } continue; }
          const c = mode === 'rival' ? COL.rival : COL[w.col];
          g.shadowColor = rgba(c, 0.6 * w.k); g.shadowBlur = 6;
          g.fillStyle = rgba(c, w.k); g.fillRect(wx, wy, ww, wh);
          g.shadowBlur = 0;
          if (w.blind) { g.fillStyle = wall ? rgba(wall, 0.75) : 'rgba(0,0,0,0.6)'; g.fillRect(wx, wy, ww, Math.round(wh * w.blind)); }
        }
      };
      const f = {};
      for (const k of ['E', 'S', 'W', 'N']) { const c = mk(); paint(c.getContext('2d'), 'opaque', WALL[k]); f[k] = c; }
      out.opaque.push(f);
      const a = mk(); paint(a.getContext('2d'), 'amber', null); out.amber.push(a);
      const rv = mk(); paint(rv.getContext('2d'), 'rival', null); out.rival.push(rv);
    });
    TILES = out;
    return out;
  }

  // ---------------------------------------------------------------------------------------------
  // Model: grid, river, blocks -> BSP lots -> buildings, plant, landmark, bridges, lamps, cars,
  // districts, ground texture. Baked once per seed.
  // ---------------------------------------------------------------------------------------------
  const MODELS = new Map();
  function model(seed) {
    seed = seed || 'storm';
    if (MODELS.has(seed)) return MODELS.get(seed);
    const U = Film.utils;
    const r = U.rng('city:' + seed);
    const nz = U.noise2D('city:' + seed);
    const sw = (k) => (k % 2 === 1 ? 32 : 20);     // street width east of column k / south of row k
    const BX0 = (i) => ORG + i * P, BX1 = (i) => ORG + (i + 1) * P - sw(i);
    const BY0 = (j) => ORG + j * P, BY1 = (j) => ORG + (j + 1) * P - sw(j);
    const streetX = (i) => ORG + (i + 1) * P - sw(i) / 2;
    const streetY = (j) => ORG + (j + 1) * P - sw(j) / 2;
    const riverY = (x) => 60 + 34 * Math.sin(x / 420 + 0.8) + 12 * Math.sin(x / 170 + 2.3);

    // named places (world units)
    const PLANT = { i0: 10, i1: 11, j0: 11, j1: 12 };
    const OBJ_CELL = [9, 8];
    const BRIDGES = [7, 9, 11, 3, 15];              // bridges on the N-S avenues east of these columns
    const DT = [(BX0(9) + BX1(9)) / 2, (BY0(8) + BY1(8)) / 2];   // downtown centre (the landmark)

    // cells
    const cells = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      cells.push({ i, j, x0: ORG + i * P, y0: ORG + j * P, x1: ORG + (i + 1) * P, y1: ORG + (j + 1) * P, objs: [], tree: null, zmax: 0, district: 0 });
    }
    const cellAt = (i, j) => cells[i * N + j];

    // districts (Voronoi on cell centres, never across the river)
    const DISTRICTS = [
      { name: 'downtown', x: -80, y: -250, north: true },
      { name: 'northwest', x: -700, y: -470, north: true },
      { name: 'northeast', x: 560, y: -420, north: true },
      { name: 'farnorth', x: 0, y: -940, north: true },
      { name: 'quay-west', x: -560, y: -40, north: true },
      { name: 'quay-east', x: 420, y: -60, north: true },
      { name: 'oldtown', x: -430, y: 330, north: false },
      { name: 'plant', x: 112, y: 300, north: false },
      { name: 'market', x: -40, y: 560, north: false },
      { name: 'southeast', x: 560, y: 380, north: false },
      { name: 'southwest', x: -920, y: 640, north: false },
      { name: 'farsouth', x: 360, y: 940, north: false },
    ];
    for (const c of cells) {
      const cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2;
      const north = cy < riverY(cx);
      let best = -1, bd = Infinity;
      DISTRICTS.forEach((d, k) => { if (d.north !== north) return; const dd = (d.x - cx) ** 2 + (d.y - cy) ** 2; if (dd < bd) { bd = dd; best = k; } });
      c.district = best;
      if (c.i >= PLANT.i0 && c.i <= PLANT.i1 && c.j >= PLANT.j0 && c.j <= PLANT.j1) c.district = DISTRICTS.findIndex((d) => d.name === 'plant');
    }

    // height field
    // the skyline: the tallest towers stand north-west of the landmark (behind it from the camera),
    // the quays are mid-rise, the south bank is low (open streets for the plans)
    const TALL = [DT[0] - 150, DT[1] - 170];
    const heightAt = (x, y) => {
      const north = y < riverY(x);
      const d = Math.hypot(x - TALL[0], (y - TALL[1]) * 1.1);
      const tall = north ? Math.exp(-(d * d) / (2 * 300 * 300)) : 0;
      const mid = north ? Math.exp(-(d * d) / (2 * 700 * 700)) : 0.25 * Math.exp(-(d * d) / (2 * 900 * 900));
      const n = 0.5 + 0.5 * nz(x / 260, y / 260);
      // keep the landmark's sightline clear: low buildings just south / east of the plaza
      const dl = Math.hypot(x - DT[0] - 60, y - DT[1] - 70);
      const clear = 1 - 0.75 * Math.exp(-(dl * dl) / (2 * 120 * 120));
      return { tall: tall * clear, mid: mid * clear, n, north };
    };

    const objs = [];   // every object (for relight / waves): { type, x0, y0, x1, y1, z0, z1, cell, ... }
    const add = (cell, o) => { o.cell = cell; o.district = cell.district; o.id = objs.length; o.cx = (o.x0 + o.x1) / 2; o.cy = (o.y0 + o.y1) / 2; objs.push(o); cell.zmax = Math.max(cell.zmax, o.z1 + (o.extra || 0)); return o; };

    const parks = [];
    const blocks = [];
    // blocks: trim by the river
    for (const c of cells) {
      const { i, j } = c;
      let x0 = BX0(i), x1 = BX1(i), y0 = BY0(j), y1 = BY1(j);
      let ymin = Infinity, ymax = -Infinity;
      for (let x = x0; x <= x1; x += 8) { const y = riverY(x); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
      const wet0 = ymin - RHW - RPAD, wet1 = ymax + RHW + RPAD;
      let river = null;
      if (y1 > wet0 && y0 < wet1) {
        const cy = (y0 + y1) / 2, ry = riverY((x0 + x1) / 2);
        if (cy < ry) { y1 = Math.min(y1, wet0); river = 'south'; } else { y0 = Math.max(y0, wet1); river = 'north'; }
      }
      const blk = { c, x0, y0, x1, y1, river, kind: 'city' };
      if (y1 - y0 < 34) { blk.kind = 'embank'; if (y1 - y0 > 6) parks.push(blk); blocks.push(blk); continue; }
      const inPlant = i >= PLANT.i0 && i <= PLANT.i1 && j >= PLANT.j0 && j <= PLANT.j1;
      if (inPlant) blk.kind = 'plant';
      else if (i === OBJ_CELL[0] && j === OBJ_CELL[1]) blk.kind = 'plaza';
      else if (r() < 0.05 && !(Math.abs(i - 7) < 2 && Math.abs(j - 9) < 3)) blk.kind = 'park';
      blocks.push(blk);
      if (blk.kind === 'park') parks.push(blk);
    }

    // BSP lots -> buildings
    function bsp(cell, x0, y0, x1, y1, depth, zone) {
      const w = x1 - x0, h = y1 - y0;
      const maxLot = zone.maxLot;
      if ((w > maxLot || h > maxLot) && depth < 6) {
        const axis = w >= h ? 'x' : 'y';
        const len = axis === 'x' ? w : h;
        let s = Math.round((len * (0.36 + 0.28 * r())) / CW) * CW;
        s = clamp(s, 18, len - 18);
        const gap = r() < 0.4 ? 0 : 2 + Math.round(r() * 3);
        if (axis === 'x') return { axis, c: x0 + s, a: bsp(cell, x0, y0, x0 + s - gap / 2, y1, depth + 1, zone), b: bsp(cell, x0 + s + gap / 2, y0, x1, y1, depth + 1, zone) };
        return { axis, c: y0 + s, a: bsp(cell, x0, y0, x1, y0 + s - gap / 2, depth + 1, zone), b: bsp(cell, x0, y0 + s + gap / 2, x1, y1, depth + 1, zone) };
      }
      if (r() < zone.empty) return null;
      const m = () => Math.round(r() * 2);
      const bx0 = x0 + m(), by0 = y0 + m(), bx1 = x1 - m(), by1 = y1 - m();
      if (bx1 - bx0 < 10 || by1 - by0 < 10) return null;
      const hf = heightAt((bx0 + bx1) / 2, (by0 + by1) / 2);
      let hh = zone.h(hf, r);
      hh = Math.max(FL * 2, Math.round(hh / FL) * FL);
      let vk;
      if (zone.ind) vk = 'ind';
      else if (hh >= 150) vk = r() < 0.6 ? 'tower' : 'office';
      else if (hh >= 66) vk = r() < 0.35 ? 'office' : r() < 0.5 ? 'band' : 'resDense';
      else vk = r() < 0.55 ? 'res' : 'resDense';
      const b = add(cell, { type: 'box', x0: bx0, y0: by0, x1: bx1, y1: by1, z0: 0, z1: hh, v: VIDX[vk], ox: Math.floor(r() * TC) * CW * TPU, oy: Math.floor(r() * TR) * FL * TPU, seed: Math.floor(r() * 1e9) });
      // rooftop plant room / blinking aviation light
      const fw = bx1 - bx0, fh = by1 - by0;
      if (hh >= 42 && fw >= 26 && fh >= 26 && r() < 0.7) {
        const pw = Math.round(fw * (0.3 + 0.2 * r())), ph = Math.round(fh * (0.3 + 0.2 * r()));
        const px = bx0 + 3 + r() * (fw - pw - 6), py = by0 + 3 + r() * (fh - ph - 6);
        b.top = { x0: px, y0: py, x1: px + pw, y1: py + ph, z0: hh, z1: hh + 5 + Math.round(r() * 5) };
        b.extra = b.top.z1 - hh;
        cell.zmax = Math.max(cell.zmax, b.top.z1);
      }
      if (hh >= 130) b.beacon = { phase: r() * 1.7, period: 1.3 + 0.6 * r() };
      return { leaf: b };
    }
    const ZONES = {
      city: { maxLot: 58, empty: 0.07, h: (f, rr) => 12 + 270 * f.tall * (0.3 + 0.7 * rr()) * (0.6 + 0.6 * f.n) + 80 * f.mid * rr() + 18 * rr() },
      low: { maxLot: 44, empty: 0.2, h: (f, rr) => 12 + (rr() < 0.15 ? 30 : 12) * rr() + 30 * f.mid * f.n },
      outer: { maxLot: 46, empty: 0.14, h: (f, rr) => 12 + 30 * rr() + 50 * f.mid * f.n },
      ind: { maxLot: 64, empty: 0.25, ind: true, h: (f, rr) => 12 + 12 * rr() },
    };
    for (const blk of blocks) {
      const c = blk.c;
      if (blk.kind !== 'city') continue;
      const ix = blk.x0 + 3, iy = blk.y0 + 3, ax = blk.x1 - 3, ay = blk.y1 - 3;
      const cx = (ix + ax) / 2, cy = (iy + ay) / 2;
      const dist = Math.hypot(cx - DT[0], cy - DT[1]);
      const nearPlant = Math.hypot(cx - 112, cy - 300) < 300 && cy > riverY(cx);
      const south = cy > riverY(cx);
      const zone = nearPlant && r() < 0.5 ? ZONES.ind : dist > 1150 ? ZONES.outer : south ? ZONES.low : ZONES.city;
      c.tree = bsp(c, ix, iy, ax, ay, 0, zone);
    }

    // the landmark (objective) tower on its plaza
    {
      const blk = blocks.find((b) => b.kind === 'plaza');
      const c = blk.c;
      const cx = (blk.x0 + blk.x1) / 2, cy = (blk.y0 + blk.y1) / 2;
      const s = 28;
      const tower = add(c, { type: 'box', x0: cx - s, y0: cy - s, x1: cx + s, y1: cy + s, z0: 0, z1: 288, v: VIDX.tower, ox: 30, oy: 24, seed: 7, landmark: true });
      tower.tiers = [{ x0: cx - s + 6, y0: cy - s + 6, x1: cx + s - 6, y1: cy + s - 6, z0: 288, z1: 336 }, { x0: cx - 13, y0: cy - 13, x1: cx + 13, y1: cy + 13, z0: 336, z1: 360 }];
      tower.antenna = { x: cx, y: cy, z0: 360, z1: 440 };
      tower.beacon = { phase: 0.2, period: 1.0 };
      tower.extra = 440 - 288;
      c.tree = { leaf: tower };
      c.zmax = 440;
    }

    // the power plant: two cooling towers, turbine hall, chimney, transformer yard (one object per cell)
    {
      const i0 = PLANT.i0, j0 = PLANT.j0;
      const cA = cellAt(i0, j0), cB = cellAt(i0 + 1, j0), cH = cellAt(i0, j0 + 1), cY = cellAt(i0 + 1, j0 + 1);
      const tower = (c, x, y, r0, h) => add(c, { type: 'tower', x, y, r0, rw: r0 * 0.66, rt: r0 * 0.74, x0: x - r0, y0: y - r0, x1: x + r0, y1: y + r0, z0: 0, z1: h });
      const tA = tower(cA, BX0(i0) + 60, BY0(j0) + 74, 46, 132);
      const tB = tower(cB, BX0(i0 + 1) + 52, BY0(j0) + 80, 42, 120);
      cA.tree = { leaf: tA }; cB.tree = { leaf: tB };
      const hy0 = BY0(j0 + 1) + 10;
      const hall = add(cH, { type: 'box', x0: BX0(i0) + 8, y0: hy0, x1: BX0(i0) + 118, y1: hy0 + 48, z0: 0, z1: 42, v: VIDX.band, ox: 0, oy: 0, seed: 11, plant: true });
      const hall2 = add(cH, { type: 'box', x0: BX0(i0) + 16, y0: hy0 + 56, x1: BX0(i0) + 84, y1: hy0 + 88, z0: 0, z1: 24, v: VIDX.ind, ox: 40, oy: 36, seed: 12, plant: true });
      cH.tree = { axis: 'y', c: hy0 + 52, a: { leaf: hall }, b: { leaf: hall2 } };
      const chim = add(cY, { type: 'chimney', x: BX0(i0 + 1) + 28, y: BY0(j0 + 1) + 34, r0: 9, x0: BX0(i0 + 1) + 19, y0: BY0(j0 + 1) + 25, x1: BX0(i0 + 1) + 37, y1: BY0(j0 + 1) + 43, z0: 0, z1: 190 });
      chim.beacon = { phase: 0.6, period: 1.1 };
      const xf = [];
      for (let a = 0; a < 2; a++) for (let b2 = 0; b2 < 2; b2++) {
        const x0 = BX0(i0 + 1) + 50 + a * 22, y0 = BY0(j0 + 1) + 16 + b2 * 28;
        xf.push(add(cY, { type: 'box', x0, y0, x1: x0 + 13, y1: y0 + 16, z0: 0, z1: 10, v: VIDX.ind, ox: 0, oy: 0, seed: 20 + a * 2 + b2, plant: true }));
      }
      // BSP: chimney | transformer columns (x), rows by y
      const col = (k) => ({ axis: 'y', c: BY0(j0 + 1) + 38, a: { leaf: xf[k * 2] }, b: { leaf: xf[k * 2 + 1] } });
      cY.tree = { axis: 'x', c: BX0(i0 + 1) + 44, a: { leaf: chim }, b: { axis: 'x', c: BX0(i0 + 1) + 68, a: col(0), b: col(1) } };
    }

    // bridges: decks across the river on the chosen N-S streets, split per row slab (exact painter order)
    const bridges = [];
    for (const k of BRIDGES) {
      const x = streetX(k), half = sw(k) / 2 - 3;
      const ry = riverY(x);
      const ya = ry - RHW - RPAD + 2, yb = ry + RHW + RPAD - 2;
      const pieces = [];
      for (let j = 0; j < N; j++) {
        const s0 = ORG + j * P, s1 = s0 + P;
        const a = Math.max(ya, s0), b = Math.min(yb, s1);
        if (b - a < 1) continue;
        const c = cellAt(k, j);
        const o = add(c, { type: 'bridge', x0: x - half, x1: x + half, y0: a, y1: b, z0: -3, z1: 1.5, ya, yb });
        pieces.push(o);
        // a bridge piece sits in the street part of its cell: it is nearer (east) than the block's lots
        c.tree = c.tree ? { axis: 'x', c: x - half - 0.5, a: c.tree, b: { leaf: o } } : { leaf: o };
      }
      bridges.push({ k, x, ya, yb, half, pieces });
    }

    // lamps: along every block edge (offset into the street), plus the bridges
    const lamps = [];
    for (const blk of blocks) {
      if (blk.kind === 'plant') continue;
      const d = blk.c.district, off = 3.5, step = 30;
      const edges = [[blk.x0, blk.y0 - off, blk.x1, blk.y0 - off], [blk.x0, blk.y1 + off, blk.x1, blk.y1 + off], [blk.x0 - off, blk.y0, blk.x0 - off, blk.y1], [blk.x1 + off, blk.y0, blk.x1 + off, blk.y1]];
      for (const [ax, ay, bx, by] of edges) {
        const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / step));
        for (let s = 0; s < n; s++) {
          const u = (s + 0.5) / n;
          lamps.push({ x: lerp(ax, bx, u), y: lerp(ay, by, u), d, c: blk.c });
        }
      }
    }
    const lampsByD = DISTRICTS.map(() => []);
    lamps.forEach((l, k) => { l.id = k; lampsByD[l.d].push(l); });

    // cars: on the E-W avenues (not through the plant) and the bridge avenues
    const cars = [];
    const ewAve = [1, 3, 5, 7, 13, 15, 17];
    for (const j of ewAve) {
      const y = streetY(j), n = 9;
      for (let k = 0; k < n; k++) cars.push({ axis: 'x', c: y + (k % 2 ? 7 : -7), dir: k % 2 ? 1 : -1, speed: 42 + r() * 30, ph: r() * 2432, lo: ORG, hi: -ORG, col: r() < 0.6 ? 'ink' : 'amberL' });
    }
    for (const k of [7, 9, 11]) {
      const x = streetX(k), n = 8;
      for (let q = 0; q < n; q++) cars.push({ axis: 'y', c: x + (q % 2 ? 7 : -7), dir: q % 2 ? 1 : -1, speed: 40 + r() * 30, ph: r() * 2432, lo: ORG, hi: -ORG, col: r() < 0.6 ? 'ink' : 'amberL' });
    }

    // river polygon (ground, world): north bank west->east, south bank east->west
    const RX0 = ORG - GMARGIN, RX1 = -ORG + GMARGIN;
    const riverN = [], riverS = [];
    for (let x = RX0; x <= RX1 + 0.1; x += 16) { riverN.push([x, riverY(x) - RHW]); riverS.push([x, riverY(x) + RHW]); }

    // ---- ground texture (world, GTEX texels per unit). The water is left transparent. ----
    const GW = Math.round((-ORG * 2 + GMARGIN * 2) * GTEX), GX0 = ORG - GMARGIN;
    const ground = document.createElement('canvas'); ground.width = GW; ground.height = GW;
    {
      const g = ground.getContext('2d');
      g.setTransform(GTEX, 0, 0, GTEX, -GX0 * GTEX, -GX0 * GTEX);
      g.fillStyle = rgba(GROUND, 1); g.fillRect(GX0, GX0, GW / GTEX, GW / GTEX);
      // asphalt mottling (wet patches)
      const rr = U.rng('ground:' + seed);
      for (let k = 0; k < 900; k++) {
        const x = GX0 + rr() * GW / GTEX, y = GX0 + rr() * GW / GTEX, R = 20 + rr() * 70;
        const gr = g.createRadialGradient(x, y, 0, x, y, R);
        gr.addColorStop(0, `rgba(30,30,34,${(0.12 + 0.12 * rr()).toFixed(3)})`); gr.addColorStop(1, 'rgba(30,30,34,0)');
        g.fillStyle = gr; g.fillRect(x - R, y - R, 2 * R, 2 * R);
      }
      // street centre dashes on the avenues, stop lines
      g.strokeStyle = rgba(COL.bone, 0.09); g.lineWidth = 1.2; g.setLineDash([10, 12]);
      g.beginPath();
      for (let k = 0; k < N; k++) {
        if (sw(k) < 30) continue;
        const x = streetX(k), y = streetY(k);
        g.moveTo(x, ORG); g.lineTo(x, -ORG);
        g.moveTo(ORG, y); g.lineTo(-ORG, y);
      }
      g.stroke(); g.setLineDash([]);
      // blocks: sidewalk rim + lot ground
      for (const blk of blocks) {
        if (blk.y1 - blk.y0 < 2) continue;
        if (blk.kind === 'plant') continue;
        g.fillStyle = '#151517'; g.fillRect(blk.x0 - 2, blk.y0 - 2, blk.x1 - blk.x0 + 4, blk.y1 - blk.y0 + 4);
        g.fillStyle = blk.kind === 'park' || blk.kind === 'embank' ? '#0d0e0d' : blk.kind === 'plaza' ? '#18171a' : '#0f0f11';
        g.fillRect(blk.x0 + 1, blk.y0 + 1, blk.x1 - blk.x0 - 2, blk.y1 - blk.y0 - 2);
        if (blk.kind === 'park' || blk.kind === 'embank') {
          for (let q = 0; q < (blk.x1 - blk.x0) * (blk.y1 - blk.y0) / 60; q++) {
            const x = blk.x0 + 3 + rr() * (blk.x1 - blk.x0 - 6), y = blk.y0 + 3 + rr() * (blk.y1 - blk.y0 - 6);
            g.fillStyle = `rgba(28,28,26,${(0.6 + 0.4 * rr()).toFixed(2)})`;
            g.beginPath(); g.arc(x, y, 2 + rr() * 3.5, 0, Math.PI * 2); g.fill();
          }
        }
        if (blk.kind === 'plaza') {
          g.strokeStyle = rgba(COL.bone, 0.12); g.lineWidth = 1;
          const cx = (blk.x0 + blk.x1) / 2, cy = (blk.y0 + blk.y1) / 2;
          for (let q = 1; q <= 3; q++) { g.beginPath(); g.arc(cx, cy, 34 + q * 9, 0, Math.PI * 2); g.stroke(); }
        }
      }
      // crosswalks at the avenue crossings
      g.fillStyle = rgba(COL.bone, 0.07);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        if (sw(i) < 30 || sw(j) < 30) continue;
        const x = streetX(i), y = streetY(j);
        for (let q = -3; q <= 3; q++) { g.fillRect(x + q * 4 - 1, y - sw(j) / 2 - 6, 2, 5); g.fillRect(x + q * 4 - 1, y + sw(j) / 2 + 1, 2, 5); g.fillRect(x - sw(i) / 2 - 6, y + q * 4 - 1, 5, 2); g.fillRect(x + sw(i) / 2 + 1, y + q * 4 - 1, 5, 2); }
      }
      // plant compound: concrete apron, internal roads, fence
      {
        const x0 = BX0(PLANT.i0) - 4, y0 = BY0(PLANT.j0) - 4, x1 = BX1(PLANT.i1) + 4, y1 = BY1(PLANT.j1) + 4;
        g.fillStyle = '#161512'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        g.fillStyle = '#1b1915';
        g.fillRect(streetX(PLANT.i0) - 7, y0, 14, y1 - y0);
        g.fillRect(x0, streetY(PLANT.j0) - 7, x1 - x0, 14);
        g.strokeStyle = rgba(COL.amber, 0.28); g.lineWidth = 1.4; g.setLineDash([6, 5]);
        g.strokeRect(x0 + 2, y0 + 2, x1 - x0 - 4, y1 - y0 - 4); g.setLineDash([]);
        // cooling tower footings
        g.fillStyle = '#0b0b0c';
        for (const o of objs) if (o.type === 'tower') { g.beginPath(); g.arc(o.x, o.y, o.r0 + 5, 0, Math.PI * 2); g.fill(); }
      }
      // street light: a soft wash along every street (stronger on the avenues), then the lamp pools
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'butt';
      for (let k = 0; k < N; k++) {
        const ave = sw(k) > 24;
        for (const [lw, a] of [[sw(k) * 1.6, ave ? 0.035 : 0.02], [sw(k) * 0.7, ave ? 0.05 : 0.025]]) {
          g.strokeStyle = `rgba(201,192,178,${a})`; g.lineWidth = lw;
          g.beginPath(); g.moveTo(streetX(k), ORG); g.lineTo(streetX(k), -ORG); g.moveTo(ORG, streetY(k)); g.lineTo(-ORG, streetY(k)); g.stroke();
        }
      }
      for (const l of lamps) {
        const R = 15;
        const gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, R);
        gr.addColorStop(0, 'rgba(246,211,159,0.2)'); gr.addColorStop(0.45, 'rgba(246,211,159,0.06)'); gr.addColorStop(1, 'rgba(246,211,159,0)');
        g.fillStyle = gr; g.fillRect(l.x - R, l.y - R, 2 * R, 2 * R);
      }
      g.globalCompositeOperation = 'source-over';
      // the blocks again over the street wash (the light stays on the asphalt)
      for (const blk of blocks) {
        if (blk.kind === 'plant' || blk.y1 - blk.y0 < 2) continue;
        g.fillStyle = blk.kind === 'park' || blk.kind === 'embank' ? 'rgba(13,14,13,0.7)' : 'rgba(15,15,17,0.7)';
        g.fillRect(blk.x0 + 1, blk.y0 + 1, blk.x1 - blk.x0 - 2, blk.y1 - blk.y0 - 2);
      }
      // the river: embankment promenade, then cut the water out (transparent)
      const poly = (pts) => { g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
      const band = (off) => poly(riverN.map((p) => [p[0], p[1] - off]).concat(riverS.slice().reverse().map((p) => [p[0], p[1] + off])));
      band(RPAD - 4); g.fillStyle = '#111113'; g.fill();
      band(4); g.fillStyle = '#18171a'; g.fill();
      g.save(); g.globalCompositeOperation = 'destination-out'; band(0); g.fill(); g.restore();
      // bank edge lines
      g.strokeStyle = rgba(COL.bone, 0.22); g.lineWidth = 1.2;
      for (const side of [riverN, riverS]) { g.beginPath(); side.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); }
    }

    // per-cell bounds (screen culling) and district cell lists (clips)
    const dCells = DISTRICTS.map(() => []);
    for (const c of cells) { c.zmax = Math.max(c.zmax, 4); dCells[c.district].push(c); }

    const POINTS = {
      start: [streetX(9), streetY(12)],
      plant: [streetX(PLANT.i0), streetY(PLANT.j0)],
      objective: DT,
      bridges: bridges.filter((b) => [7, 9, 11].includes(b.k)).map((b) => [b.x, riverY(b.x)]),
      downtown: DT,
    };
    const M = { seed, N, P, ORG, cells, cellAt, objs, blocks, bridges, lamps, lampsByD, cars, parks, DISTRICTS, dCells, ground, GW, GX0,
      riverN, riverS, riverY, streetX, streetY, BX0, BX1, BY0, BY1, sw, POINTS, PLANT, DT };
    MODELS.set(seed, M);
    return M;
  }

  // ---------------------------------------------------------------------------------------------
  // Renderer
  // ---------------------------------------------------------------------------------------------
  let instN = 0;
  function create(ctx, o) {
    o = Object.assign({ seed: 'storm' }, o || {});
    const M = model(o.seed);
    const T = tiles();
    const { canvas, g } = ctx.canvas({ parent: o.parent, className: 'world-city' });
    const id = ++instN;
    const cam = Object.assign({ tx: 0, ty: 120, zoom: 1, yaw: 45, pitch: 42.4, sx: 0, sy: 0, shake: 0 }, o.cam || {});
    const look = Object.assign({ alpha: 1, lights: 1, rain: 1, fog: 0.55, haze: 1, flash: 0, xray: 1, cars: 1, ground: 1, steam: 1, power: 0.35, landmark: 1, tint: 0, tintCol: C.amber }, o.look || {});
    const strikes = (o.strikes || []).map((s, k) => Object.assign({ k: 1, seed: k + 1 }, s));
    const dState = M.DISTRICTS.map(() => ({ lit: 1 }));
    const routes = [], markers = [], waves = [], relights = [], draws = [];
    // patterns (per context)
    const PAT = { opaque: T.opaque.map((f) => ({ E: g.createPattern(f.E, 'repeat'), S: g.createPattern(f.S, 'repeat'), W: g.createPattern(f.W, 'repeat'), N: g.createPattern(f.N, 'repeat') })),
      amber: T.amber.map((c) => g.createPattern(c, 'repeat')), rival: T.rival.map((c) => g.createPattern(c, 'repeat')) };
    const rainRng = Film.utils.rng('city-rain:' + (o.rainSeed || id));
    const RAIN = { far: [], near: [] };
    for (let k = 0; k < 760; k++) RAIN.far.push([rainRng() * 2400, rainRng(), 14 + rainRng() * 16, 0.05 + 0.08 * rainRng()]);
    for (let k = 0; k < 190; k++) RAIN.near.push([rainRng() * 2400, rainRng(), 46 + rainRng() * 50, 0.08 + 0.1 * rainRng()]);
    // cloud texture (screen space, drifting)
    const fogC = document.createElement('canvas'); fogC.width = 320; fogC.height = 200;
    {
      const fg = fogC.getContext('2d'), img = fg.createImageData(320, 200), nzf = Film.utils.noise2D('city-fog:' + o.seed);
      for (let y = 0; y < 200; y++) for (let x = 0; x < 320; x++) {
        const v = nzf.fbm(x / 110, y / 70, { octaves: 2 });
        const a = smooth((v + 0.1) * 1.4);
        const i = (y * 320 + x) * 4; img.data[i] = 46; img.data[i + 1] = 42; img.data[i + 2] = 36; img.data[i + 3] = Math.round(a * 255);
      }
      fg.putImageData(img, 0, 0);
    }

    // ---- camera ----
    const K = { ct: 1, st: 0, sp: 1, cp: 0, z: 1, a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, up: 0 };
    function prep(lt) {
      const yaw = cam.yaw * DEG, pit = cam.pitch * DEG;
      K.ct = Math.cos(yaw); K.st = Math.sin(yaw); K.sp = Math.sin(pit); K.cp = Math.cos(pit); K.z = cam.zoom;
      let shx = 0, shy = 0;
      if (cam.shake > 0.01) { const f = Math.floor(lt * 30); shx = (hash(f * 7 + 3) - 0.5) * 2 * cam.shake; shy = (hash(f * 13 + 5) - 0.5) * 2 * cam.shake; }
      const SX = W / 2 + cam.sx + shx, SY = H / 2 + cam.sy + shy, z = K.z;
      K.a = z * K.ct; K.b = z * K.sp * K.st; K.c = -z * K.st; K.d = z * K.sp * K.ct;
      K.e = SX - (K.a * cam.tx + K.c * cam.ty); K.f = SY - (K.b * cam.tx + K.d * cam.ty);
      K.up = -z * K.cp;   // screen y per unit of height
    }
    const sxOf = (x, y) => K.a * x + K.c * y + K.e;
    const syOf = (x, y, h) => K.b * x + K.d * y + K.f + K.up * (h || 0);
    function toScreen(x, y, h) { return [sxOf(x, y), syOf(x, y, h)]; }

    // ---- lighting state per object ----
    const flashAt = (lt) => {
      let f = look.flash;
      for (const s of strikes) {
        const d = lt - s.t;
        if (d < -0.001 || d > 0.9) continue;
        f += s.k * (Math.exp(-Math.max(0, d) / 0.045) + (d > 0.1 ? 0.75 * Math.exp(-(d - 0.1) / 0.07) : 0) + (d > 0.24 ? 0.35 * Math.exp(-(d - 0.24) / 0.12) : 0));
      }
      return f;
    }
    function waveState(o2, lt) {
      // returns { kill (0..1, 1 = dead), tint (0..1 wave colour) } for an object / lamp
      let kill = 0, tint = 0;
      for (const w of waves) {
        const arr = w.arr.get(o2);
        if (arr == null) continue;
        const d = lt - arr;
        if (d < -0.05) continue;
        tint = Math.max(tint, d < 0 ? (d + 0.05) / 0.05 : Math.exp(-d / 0.16));
        if (!w.kill) continue;
        if (d >= 0.22) kill = Math.max(kill, 0.96);
        else if (d >= 0) {
          const f = Math.floor(lt * 30 + (o2.id || 0) * 0.37);
          kill = Math.max(kill, hash(f * 31 + (o2.id || 0) * 7) < 0.5 + d * 2 ? 0.9 : 0.15);
        }
      }
      return { kill, tint };
    }
    function relightState(o2) {
      let on = 0, flare = 0;
      for (const rl of relights) {
        const u = rl.near.get(o2);
        if (u == null) continue;
        const D = rl.route.p.draw - u;
        if (D < 0) continue;
        on = Math.max(on, smooth(D / 0.025));
        flare = Math.max(flare, D < 0.12 ? Math.sin(Math.PI * clamp(D / 0.12, 0, 1)) : 0);
      }
      return { on, flare };
    }
    function litOf(ob, lt) {
      const base = dState[ob.district].lit * look.lights;
      const ws = waves.length ? waveState(ob, lt) : { kill: 0, tint: 0 };
      const rs = relights.length ? relightState(ob) : { on: 0, flare: 0 };
      let lit = base * (1 - ws.kill);
      lit = Math.max(lit, rs.on * look.lights);
      return { lit, tint: ws.tint * (1 - rs.on), flare: rs.flare };
    }

    // ---- drawing primitives ----
    const FACES = {
      E: { n: [1, 0], c: [1, 2] }, S: { n: [0, 1], c: [2, 3] }, W: { n: [-1, 0], c: [3, 0] }, N: { n: [0, -1], c: [0, 1] },
    };
    const X = new Float64Array(4), Y = new Float64Array(4);
    let visF = ['E', 'S'];
    let FL_NOW = 0;
    function corners(x0, y0, x1, y1) {
      X[0] = sxOf(x0, y0); Y[0] = syOf(x0, y0); X[1] = sxOf(x1, y0); Y[1] = syOf(x1, y0);
      X[2] = sxOf(x1, y1); Y[2] = syOf(x1, y1); X[3] = sxOf(x0, y1); Y[3] = syOf(x0, y1);
    }
    function faceCTM(fk, x0, y0, x1, y1) {
      // local u (texels) along the face, local y = -z * TPU
      let px, py, L, ux, uy;
      if (fk === 'E') { px = x1; py = y0; L = y1 - y0; ux = K.c; uy = K.d; }
      else if (fk === 'S') { px = x1; py = y1; L = x1 - x0; ux = -K.a; uy = -K.b; }
      else if (fk === 'W') { px = x0; py = y1; L = y1 - y0; ux = -K.c; uy = -K.d; }
      else { px = x0; py = y0; L = x1 - x0; ux = K.a; uy = K.b; }
      g.setTransform(ux / TPU, uy / TPU, 0, -K.up / TPU, sxOf(px, py), syOf(px, py));
      return L;
    }
    function drawBox(b, lt, L) {
      const { x0, y0, x1, y1, z0, z1 } = b;
      const up0 = K.up * z0, up1 = K.up * z1;
      corners(x0, y0, x1, y1);
      const fl = FL_NOW;
      for (const fk of visF) {
        const len = faceCTM(fk, x0, y0, x1, y1);
        const fx = b.ox || 0, fy = b.oy || 0;
        g.translate(-fx, -fy);
        const rx = fx, ry = fy - z1 * TPU, rw = len * TPU, rh = (z1 - z0) * TPU;
        if (b.v != null) {
          g.fillStyle = PAT.opaque[b.v][fk]; g.fillRect(rx, ry, rw, rh);
          if (L.lit < 0.995) { g.fillStyle = rgba(WALL[fk], (1 - L.lit) * 0.97); g.fillRect(rx, ry, rw, rh); }
          if (L.tint > 0.01) { g.globalAlpha = clamp(L.tint, 0, 1); g.fillStyle = PAT.rival[b.v]; g.fillRect(rx, ry, rw, rh); g.globalAlpha = 1; }
          if (L.flare > 0.01) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = clamp(L.flare, 0, 1); g.fillStyle = PAT.amber[b.v]; g.fillRect(rx, ry, rw, rh); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
        } else {
          g.fillStyle = rgba(WALL[fk], 1); g.fillRect(rx, ry, rw, rh);
        }
        if (fl > 0.01) { g.fillStyle = rgba(COL.ink, fl * (fk === 'E' ? 0.2 : fk === 'S' ? 0.12 : 0.07)); g.fillRect(rx, ry, rw, rh); }
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      // roof
      g.beginPath();
      g.moveTo(X[0], Y[0] + up1); g.lineTo(X[1], Y[1] + up1); g.lineTo(X[2], Y[2] + up1); g.lineTo(X[3], Y[3] + up1); g.closePath();
      g.fillStyle = fl > 0.01 ? rgba(ROOF.map((v, i) => v + (COL.ink[i] - v) * clamp(fl * 0.2, 0, 0.6)), 1) : rgba(ROOF, 1);
      g.fill();
      // edges: roof outline + the visible verticals
      g.strokeStyle = rgba(COL.bone, 0.2 + 0.45 * fl); g.lineWidth = 1;
      g.stroke();
      g.beginPath();
      for (const fk of visF) for (const k of FACES[fk].c) { g.moveTo(X[k], Y[k] + up0); g.lineTo(X[k], Y[k] + up1); }
      g.strokeStyle = rgba(COL.bone, 0.1 + 0.2 * fl); g.stroke();
    }
    function drawPlainBox(x0, y0, x1, y1, z0, z1, shade, edgeA) {
      corners(x0, y0, x1, y1);
      const up0 = K.up * z0, up1 = K.up * z1, fl = FL_NOW;
      for (const fk of visF) {
        const [a, b] = FACES[fk].c;
        g.beginPath(); g.moveTo(X[a], Y[a] + up0); g.lineTo(X[b], Y[b] + up0); g.lineTo(X[b], Y[b] + up1); g.lineTo(X[a], Y[a] + up1); g.closePath();
        const wc = WALL[fk].map((v) => v * (shade || 1));
        g.fillStyle = rgba(fl > 0.01 ? wc.map((v, i) => v + (COL.ink[i] - v) * fl * 0.15) : wc, 1); g.fill();
      }
      g.beginPath(); g.moveTo(X[0], Y[0] + up1); g.lineTo(X[1], Y[1] + up1); g.lineTo(X[2], Y[2] + up1); g.lineTo(X[3], Y[3] + up1); g.closePath();
      g.fillStyle = rgba(fl > 0.01 ? ROOF.map((v, i) => v + (COL.ink[i] - v) * fl * 0.4) : ROOF, 1); g.fill();
      if (edgeA) { g.strokeStyle = rgba(COL.bone, edgeA); g.lineWidth = 1; g.stroke(); }
    }
    function drawBridge(b, lt) {
      const { x0, y0, x1, y1 } = b;
      // piers at the ends of the water (only where this piece holds them)
      drawPlainBox(x0, y0, x1, y1, b.z0, b.z1, 1.25, 0.16);
      // deck top: asphalt + centre line
      corners(x0, y0, x1, y1);
      const up = K.up * b.z1;
      g.beginPath(); g.moveTo(X[0], Y[0] + up); g.lineTo(X[1], Y[1] + up); g.lineTo(X[2], Y[2] + up); g.lineTo(X[3], Y[3] + up); g.closePath();
      g.fillStyle = '#17161a'; g.fill();
      // railings
      g.strokeStyle = rgba(COL.bone, 0.32); g.lineWidth = 1;
      g.beginPath();
      for (const xx of [x0 + 0.5, x1 - 0.5]) { g.moveTo(sxOf(xx, y0), syOf(xx, y0, b.z1 + 2.5)); g.lineTo(sxOf(xx, y1), syOf(xx, y1, b.z1 + 2.5)); }
      g.stroke();
      // lamp posts along both rails (lit with the district)
      const lit = dState[b.district].lit * look.lights;
      if (lit < 0.05) return;
      const pts = [];
      for (let y = b.ya + 6 + Math.ceil((y0 - b.ya - 6) / 15) * 15; y < Math.min(y1, b.yb - 3); y += 15) for (const xx of [x0 + 1, x1 - 1]) pts.push(sxOf(xx, y), syOf(xx, y, b.z1 + 6));
      g.globalCompositeOperation = 'lighter';
      for (let q = 0; q < pts.length; q += 2) {
        const R = 9 * clamp(K.z, 0.8, 2);
        const gr = g.createRadialGradient(pts[q], pts[q + 1], 0, pts[q], pts[q + 1], R);
        gr.addColorStop(0, rgba(COL.amber, 0.55 * lit)); gr.addColorStop(1, rgba(COL.amber, 0));
        g.fillStyle = gr; g.fillRect(pts[q] - R, pts[q + 1] - R, 2 * R, 2 * R);
      }
      g.globalCompositeOperation = 'source-over';
      g.beginPath(); for (let q = 0; q < pts.length; q += 2) g.rect(pts[q] - 1.2, pts[q + 1] - 1.2, 2.4, 2.4);
      g.fillStyle = rgba(COL.amberL, lit); g.fill();
    }
    function drawTower(t, lt) {
      // hyperboloid cooling tower: silhouette from the projected circle extremes, shaded across
      const n = 18, z = K.z;
      const cx = sxOf(t.x, t.y), cy = syOf(t.x, t.y);
      const R = (h) => { const u = h / t.z1, w = 0.68; const k = (u - w) / (u < w ? w : 1 - w); return t.rw + (u < w ? (t.r0 - t.rw) : (t.rt - t.rw)) * k * k; };
      const L = [], Rr = [];
      for (let k = 0; k <= n; k++) { const h = t.z1 * k / n, rr = R(h) * z; L.push([cx - rr, cy + K.up * h]); Rr.push([cx + rr, cy + K.up * h]); }
      const rb = t.r0 * z, rt = t.rt * z, ty = cy + K.up * t.z1;
      const fl = FL_NOW, pw = look.power;
      g.beginPath();
      g.moveTo(L[0][0], L[0][1]);
      g.ellipse(cx, cy, rb, rb * K.sp, 0, Math.PI, 0, true);
      for (let k = 1; k <= n; k++) g.lineTo(Rr[k][0], Rr[k][1]);
      g.ellipse(cx, ty, rt, rt * K.sp, 0, 0, Math.PI, true);
      for (let k = n - 1; k >= 0; k--) g.lineTo(L[k][0], L[k][1]);
      g.closePath();
      const gr = g.createLinearGradient(cx - rb, 0, cx + rb, 0);
      const lift = fl * 0.25;
      const mix = (c, k) => rgba(c.map((v, i) => v + (COL.ink[i] - v) * k), 1);
      gr.addColorStop(0, mix([18, 17, 15], lift)); gr.addColorStop(0.55, mix([40, 37, 31], lift)); gr.addColorStop(0.8, mix([34, 31, 26], lift)); gr.addColorStop(1, mix([16, 15, 13], lift));
      g.fillStyle = gr; g.fill();
      // vertical ribs
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1;
      g.beginPath();
      for (let q = -3; q <= 3; q++) { const s = q / 4; for (let k = 0; k < n; k++) { const h0 = t.z1 * k / n, h1 = t.z1 * (k + 1) / n; if (k === 0) g.moveTo(cx + s * R(h0) * z, cy + K.up * h0 + Math.sqrt(1 - s * s) * R(h0) * z * K.sp); g.lineTo(cx + s * R(h1) * z, cy + K.up * h1 + Math.sqrt(1 - s * s) * R(h1) * z * K.sp); } }
      g.stroke();
      // base glow when powered (amber light at the intakes)
      if (pw > 0.01) {
        g.save(); g.clip();
        const bg = g.createRadialGradient(cx, cy, 0, cx, cy, rb * 1.3);
        bg.addColorStop(0, rgba(COL.amber, 0.55 * pw)); bg.addColorStop(1, rgba(COL.amber, 0));
        g.globalCompositeOperation = 'lighter'; g.fillStyle = bg; g.fillRect(cx - rb * 1.4, cy - rb * 1.4, rb * 2.8, rb * 2.8);
        g.restore();
      }
      // rim + hollow
      g.beginPath(); g.ellipse(cx, ty, rt, rt * K.sp, 0, 0, Math.PI * 2);
      g.fillStyle = '#08080a'; g.fill();
      if (pw > 0.01) {
        const ig = g.createRadialGradient(cx, ty, 0, cx, ty, rt);
        ig.addColorStop(0, rgba(COL.amberL, 0.55 * pw)); ig.addColorStop(1, rgba(COL.amber, 0.08 * pw));
        g.fillStyle = ig; g.fill();
      }
      g.strokeStyle = rgba(COL.bone, 0.45 + 0.4 * fl); g.lineWidth = 1.3; g.stroke();
      // silhouette edges
      g.strokeStyle = rgba(COL.bone, 0.16); g.lineWidth = 1;
      g.beginPath(); L.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
      g.beginPath(); Rr.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
      // rim warning lights (blink)
      const blink = Math.floor((lt + t.x * 0.001) * 2) % 2 === 0;
      if (blink) {
        g.fillStyle = rgba(COL.amber, 0.95);
        for (let q = 0; q < 6; q++) { const a = q / 6 * Math.PI * 2; const ex = cx + Math.cos(a) * rt, ey = ty + Math.sin(a) * rt * K.sp; if (Math.sin(a) < -0.2) continue; g.fillRect(ex - 1.5, ey - 1.5, 3, 3); }
      }
      t._top = [cx, ty, rt];
    }
    function drawChimney(c, lt) {
      const z = K.z, cx = sxOf(c.x, c.y), cy = syOf(c.x, c.y), r = c.r0 * z, ty = cy + K.up * c.z1, rt = r * 0.8;
      g.beginPath(); g.moveTo(cx - r, cy); g.ellipse(cx, cy, r, r * K.sp, 0, Math.PI, 0, true); g.lineTo(cx + rt, ty); g.ellipse(cx, ty, rt, rt * K.sp, 0, 0, Math.PI, true); g.closePath();
      const gr = g.createLinearGradient(cx - r, 0, cx + r, 0);
      gr.addColorStop(0, '#121110'); gr.addColorStop(0.55, '#2c2924'); gr.addColorStop(1, '#100f0e');
      g.fillStyle = gr; g.fill();
      // bands near the top
      g.fillStyle = rgba(COL.bone, 0.28);
      for (const hh of [c.z1 - 14, c.z1 - 30]) { const y = cy + K.up * hh; g.fillRect(cx - rt * 1.02, y - 3 * z, rt * 2.04, 3.5 * z); }
      g.beginPath(); g.ellipse(cx, ty, rt, rt * K.sp, 0, 0, Math.PI * 2); g.fillStyle = '#070708'; g.fill();
      c._top = [cx, ty, rt];
    }
    function drawLandmarkLights(ob, L) {
      // the landmark: light strips on its visible corners and a lit crown (amber)
      const k = clamp(L.lit, 0, 1) * look.landmark;
      if (k < 0.02) return;
      const edges = [], crown = [];
      const parts = [ob].concat(ob.tiers || []);
      parts.forEach((b, pi) => {
        corners(b.x0, b.y0, b.x1, b.y1);
        const u0 = K.up * b.z0, u1 = K.up * b.z1;
        const ks = new Set(); for (const fk of visF) for (const q of FACES[fk].c) ks.add(q);
        for (const q of ks) edges.push(X[q], Y[q] + u0, X[q], Y[q] + u1);
        if (pi === parts.length - 1 || pi === parts.length - 2) for (let q = 0; q < 4; q++) crown.push(X[q], Y[q] + u1, X[(q + 1) % 4], Y[(q + 1) % 4] + u1);
      });
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'butt';
      const pass = (arr, col, lw, a) => { g.beginPath(); for (let q = 0; q < arr.length; q += 4) { g.moveTo(arr[q], arr[q + 1]); g.lineTo(arr[q + 2], arr[q + 3]); } g.strokeStyle = rgba(col, a); g.lineWidth = lw; g.stroke(); };
      pass(edges, COL.amber, 7, 0.1 * k); pass(edges, COL.amberL, 1.6, 0.75 * k);
      pass(crown, COL.amber, 12, 0.14 * k); pass(crown, COL.amberL, 2, 0.95 * k);
      g.globalCompositeOperation = 'source-over';
    }
    function drawObj(ob, lt) {
      if (ob.type === 'box') {
        const L = litOf(ob, lt);
        drawBox(ob, lt, L);
        if (ob.tiers) for (const tr of ob.tiers) drawBox(Object.assign({ v: ob.v, ox: ob.ox, oy: ob.oy }, tr), lt, L);
        if (ob.top) drawPlainBox(ob.top.x0, ob.top.y0, ob.top.x1, ob.top.y1, ob.top.z0, ob.top.z1, 1.15, 0.14);
        if (ob.antenna) {
          const a = ob.antenna;
          g.strokeStyle = rgba(COL.bone, 0.55); g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(sxOf(a.x, a.y), syOf(a.x, a.y, a.z0)); g.lineTo(sxOf(a.x, a.y), syOf(a.x, a.y, a.z1)); g.stroke();
        }
        if (ob.landmark) drawLandmarkLights(ob, L);
      } else if (ob.type === 'bridge') drawBridge(ob, lt);
      else if (ob.type === 'tower') drawTower(ob, lt);
      else if (ob.type === 'chimney') drawChimney(ob, lt);
    }
    function walk(node, lt) {
      if (!node) return;
      if (node.leaf) { drawObj(node.leaf, lt); return; }
      const lowFirst = node.axis === 'x' ? K.st >= 0 : K.ct >= 0;
      if (lowFirst) { walk(node.a, lt); walk(node.b, lt); } else { walk(node.b, lt); walk(node.a, lt); }
    }

    // ---- ground layers ----
    function groundPass(lt) {
      // water (sunk), the visible embankment wall, then the ground texture over it
      const pathRiver = (h) => {
        g.beginPath();
        M.riverN.forEach((p, k) => (k ? g.lineTo(sxOf(p[0], p[1]), syOf(p[0], p[1], h)) : g.moveTo(sxOf(p[0], p[1]), syOf(p[0], p[1], h))));
        for (let k = M.riverS.length - 1; k >= 0; k--) { const p = M.riverS[k]; g.lineTo(sxOf(p[0], p[1]), syOf(p[0], p[1], h)); }
        g.closePath();
      };
      pathRiver(WATER_Z);
      g.fillStyle = '#060708'; g.fill();
      // water life: rain rings + drifting sheen, clipped to the water
      g.save(); pathRiver(WATER_Z); g.clip();
      const fl = FL_NOW;
      // reflected glow of the far bank
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = rgba(COL.amber, 0.05); g.lineWidth = 10 * K.z;
      g.beginPath(); M.riverN.forEach((p, k) => (k ? g.lineTo(sxOf(p[0], p[1] + 10), syOf(p[0], p[1] + 10, WATER_Z)) : g.moveTo(sxOf(p[0], p[1] + 10), syOf(p[0], p[1] + 10, WATER_Z)))); g.stroke();
      g.globalCompositeOperation = 'source-over';
      const slot = Math.floor(lt * 15);
      g.strokeStyle = rgba(COL.bone, 0.16 + 0.3 * fl); g.lineWidth = 1;
      g.beginPath();
      for (let k = 0; k < 140; k++) {
        const hs = hash(k * 977 + (slot + (k % 5)) * 131);
        const x = M.GX0 + 40 + hash(k * 31 + slot * 7) * (M.GW - 80), y = M.riverY(x) + (hs - 0.5) * 2 * (RHW - 6);
        const age = ((lt * 15 + (k % 5)) % 5) / 5, rr = (1.5 + 5 * age);
        const px = sxOf(x, y), py = syOf(x, y, WATER_Z);
        if (px < -20 || px > W + 20 || py < -20 || py > H + 20) continue;
        g.moveTo(px + rr * K.z, py); g.ellipse(px, py, rr * K.z, rr * K.z * K.sp, 0, 0, Math.PI * 2);
      }
      g.stroke();
      g.strokeStyle = rgba(COL.bone, 0.08); g.lineWidth = 1.2;
      g.beginPath();
      for (let k = 0; k < 120; k++) {
        const x = M.GX0 + ((hash(k * 17) * M.GW + lt * 38) % M.GW), y = M.riverY(x) + (hash(k * 53) - 0.5) * 2 * (RHW - 8);
        const a = sxOf(x, y), b = syOf(x, y, WATER_Z), a2 = sxOf(x + 22, M.riverY(x + 22) + (y - M.riverY(x))), b2 = syOf(x + 22, M.riverY(x + 22) + (y - M.riverY(x)), WATER_Z);
        if (a < -40 || a > W + 40 || b < -40 || b > H + 40) continue;
        g.moveTo(a, b); g.lineTo(a2, b2);
      }
      g.stroke();
      g.restore();
      // the embankment walls facing the camera (north bank faces south, i.e. +y)
      const wall = (side, ny) => {
        if (ny * K.ct + 0 * K.st <= 0.02) return;
        g.beginPath();
        side.forEach((p, k) => (k ? g.lineTo(sxOf(p[0], p[1]), syOf(p[0], p[1], 0)) : g.moveTo(sxOf(p[0], p[1]), syOf(p[0], p[1], 0))));
        for (let k = side.length - 1; k >= 0; k--) { const p = side[k]; g.lineTo(sxOf(p[0], p[1]), syOf(p[0], p[1], WATER_Z)); }
        g.closePath(); g.fillStyle = '#18171a'; g.fill();
      };
      wall(M.riverN, 1); wall(M.riverS, -1);
      // ground texture (affine)
      g.setTransform(K.a / GTEX, K.b / GTEX, K.c / GTEX, K.d / GTEX, sxOf(M.GX0, M.GX0), syOf(M.GX0, M.GX0));
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'medium';
      g.globalAlpha = look.ground;
      g.drawImage(M.ground, 0, 0);
      g.globalAlpha = 1;
      g.setTransform(1, 0, 0, 1, 0, 0);
      // dark districts: dim the ground (lamp pools) of districts whose lights are down
      dState.forEach((ds, k) => {
        const off = 1 - ds.lit * look.lights;
        if (off < 0.02) return;
        g.beginPath();
        for (const c of M.dCells[k]) cellPath(c);
        g.fillStyle = rgba(GROUND, 0.8 * off); g.fill();
      });
      // waves on the ground: a dark disc (lights out) behind a coloured front, clipped to the district
      for (const w of waves) {
        const d = lt - w.t0; if (d < 0) continue;
        const R = d * w.speed;
        g.save();
        g.beginPath(); for (const c of M.dCells[w.d]) cellPath(c); g.clip();
        if (w.kill) { g.beginPath(); groundCircle(w.x, w.y, Math.max(0, R - 30)); g.fillStyle = rgba(GROUND, 0.78); g.fill(); }
        const fade = clamp(1 - (R - w.maxR) / 300, 0, 1);
        if (fade > 0.01) {
          g.globalCompositeOperation = 'lighter';
          for (const [lw, a] of [[34, 0.07], [16, 0.16], [5, 0.5], [2, 0.95]]) { g.beginPath(); groundCircle(w.x, w.y, R); g.strokeStyle = rgba(w.col, a * fade); g.lineWidth = lw * Math.max(0.7, K.z); g.stroke(); }
          g.globalCompositeOperation = 'source-over';
        }
        g.restore();
      }
    }
    function cellPath(c) {
      g.moveTo(sxOf(c.x0, c.y0), syOf(c.x0, c.y0)); g.lineTo(sxOf(c.x1, c.y0), syOf(c.x1, c.y0)); g.lineTo(sxOf(c.x1, c.y1), syOf(c.x1, c.y1)); g.lineTo(sxOf(c.x0, c.y1), syOf(c.x0, c.y1)); g.closePath();
    }
    function groundCircle(x, y, R, h) {
      // a world circle on the ground is an ellipse on screen: build it under the ground affine
      g.save(); g.setTransform(K.a, K.b, K.c, K.d, K.e, K.f + K.up * (h || 0)); g.moveTo(x + R, y); g.arc(x, y, R, 0, Math.PI * 2); g.restore();
    }
    function lampsPass(lt, cull) {
      const [cx0, cy0, cx1, cy1] = cull;
      const lampH = 5;
      dState.forEach((ds, k) => {
        const list = M.lampsByD[k];
        const base = ds.lit * look.lights;
        const wd = waves.filter((w) => w.d === k);
        if (base < 0.02 && !wd.length && !relights.length) return;
        g.beginPath();
        let tinted = null;
        for (const l of list) {
          const px = sxOf(l.x, l.y), py = syOf(l.x, l.y, lampH);
          if (px < cx0 - 4 || px > cx1 + 4 || py < cy0 - 4 || py > cy1 + 4) continue;
          let on = base;
          if (wd.length) { const ws = waveState(l, lt); on *= 1 - ws.kill; if (ws.tint > 0.2) { (tinted || (tinted = [])).push(px, py); continue; } }
          if (relights.length) on = Math.max(on, relightState(l).on);
          if (on < 0.5) continue;
          g.rect(px - 1.1, py - 1.1, 2.4, 2.4);
        }
        g.fillStyle = rgba(COL.amberL, 0.9 * Math.max(base, wd.length || relights.length ? 1 : 0)); g.fill();
        if (tinted) { g.beginPath(); for (let q = 0; q < tinted.length; q += 2) g.rect(tinted[q] - 1.5, tinted[q + 1] - 1.5, 3, 3); g.fillStyle = rgba(COL.rival, 1); g.fill(); }
      });
    }
    function carsPass(lt, cull) {
      if (look.cars <= 0.01) return;
      const [cx0, cy0, cx1, cy1] = cull;
      const heads = [[], []];
      for (const c of M.cars) {
        const span = c.hi - c.lo;
        let s = ((c.ph + c.dir * c.speed * lt) % span + span) % span + c.lo;
        const x = c.axis === 'x' ? s : c.c, y = c.axis === 'x' ? c.c : s;
        // stop at the river where there is no bridge (only the bridge avenues carry N-S cars)
        const dx = c.axis === 'x' ? -c.dir * 9 : 0, dy = c.axis === 'y' ? -c.dir * 9 : 0;
        const px = sxOf(x, y), py = syOf(x, y, 1);
        if (px < cx0 - 10 || px > cx1 + 10 || py < cy0 - 10 || py > cy1 + 10) continue;
        const d = M.cellAt(clamp(Math.floor((x - ORG) / P), 0, N - 1), clamp(Math.floor((y - ORG) / P), 0, N - 1)).district;
        if (dState[d].lit < 0.3) continue;
        heads[c.col === 'ink' ? 0 : 1].push(px, py, sxOf(x + dx, y + dy), syOf(x + dx, y + dy, 1));
      }
      g.lineCap = 'round';
      [[COL.ink, heads[0]], [COL.amberL, heads[1]]].forEach(([col, arr]) => {
        g.beginPath(); for (let q = 0; q < arr.length; q += 4) { g.moveTo(arr[q + 2], arr[q + 3]); g.lineTo(arr[q], arr[q + 1]); }
        g.strokeStyle = rgba(col, 0.55 * look.cars); g.lineWidth = 1.6; g.stroke();
      });
    }

    // ---- routes ----
    function route(ro) {
      ro = Object.assign({ color: C.amber, light: C.amberLight, width: 3.2, glow: 1, dash: [18, 10], lift: 1.5, arrow: true, xray: 0.55, round: 26 }, ro);
      // round the corners of the street polyline (quadratic fillets), then resample
      const raw = ro.pts, pts = [];
      for (let i = 0; i < raw.length; i++) {
        const p = raw[i];
        if (i === 0 || i === raw.length - 1) { pts.push(p); continue; }
        const a = raw[i - 1], b = raw[i + 1];
        const la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
        const rr = Math.min(ro.round, la / 2, lb / 2);
        const p0 = [p[0] + (a[0] - p[0]) * rr / la, p[1] + (a[1] - p[1]) * rr / la], p1 = [p[0] + (b[0] - p[0]) * rr / lb, p[1] + (b[1] - p[1]) * rr / lb];
        for (let k = 0; k <= 6; k++) { const t = k / 6, u = 1 - t; pts.push([u * u * p0[0] + 2 * u * t * p[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * p[1] + t * t * p1[1]]); }
      }
      const dense = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 12));
        for (let k = 1; k <= n; k++) dense.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
      }
      const n = dense.length, cum = new Float64Array(n);
      for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]);
      const L = cum[n - 1];
      const p = { draw: 0, tail: 0, alpha: 1, head: 1, march: 34, cut0: -1, cut1: -1, cutA: 0, glow: ro.glow, width: 1 };
      const h = { o: ro, pts: dense, cum, L, p, col: hexRgb(ro.color), lig: hexRgb(ro.light), sx: new Float64Array(n), sy: new Float64Array(n) };
      h.idx = (u) => { const d = clamp(u, 0, 1) * L; let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= d) lo = m; else hi = m; } return lo + (cum[hi] > cum[lo] ? (d - cum[lo]) / (cum[hi] - cum[lo]) : 0); };
      h.at = (u) => { const f = h.idx(u), i = Math.min(n - 2, Math.floor(f)), t = f - i; return [lerp(dense[i][0], dense[i + 1][0], t), lerp(dense[i][1], dense[i + 1][1], t)]; };
      routes.push(h);
      return h;
    }
    function routeProject(h) {
      for (let i = 0; i < h.pts.length; i++) { h.sx[i] = sxOf(h.pts[i][0], h.pts[i][1]); h.sy[i] = syOf(h.pts[i][0], h.pts[i][1], h.o.lift); }
    }
    function tracePart(h, u0, u1) {
      // path from arc fraction u0 to u1 (screen)
      if (u1 <= u0) return false;
      const f0 = h.idx(u0), f1 = h.idx(u1), i0 = Math.floor(f0), i1 = Math.floor(f1);
      const at = (f) => { const i = Math.min(h.pts.length - 2, Math.floor(f)), t = f - i; return [lerp(h.sx[i], h.sx[i + 1], t), lerp(h.sy[i], h.sy[i + 1], t)]; };
      const a = at(f0); g.moveTo(a[0], a[1]);
      for (let i = i0 + 1; i <= i1; i++) g.lineTo(h.sx[i], h.sy[i]);
      const b = at(f1); g.lineTo(b[0], b[1]);
      return true;
    }
    function segs(h) {
      // the drawn stretch [tail, draw] minus the broken stretch (when cutA > 0)
      const P2 = h.p, out = [];
      if (P2.draw <= P2.tail + 1e-4) return out;
      if (P2.cut0 >= 0 && P2.cutA > 0.001) {
        if (P2.tail < P2.cut0) out.push([P2.tail, Math.min(P2.draw, P2.cut0)]);
        if (P2.draw > P2.cut1) out.push([Math.max(P2.tail, P2.cut1), P2.draw]);
      } else out.push([P2.tail, P2.draw]);
      return out;
    }
    function routeGround(h, lt) {
      const P2 = h.p; if (P2.alpha <= 0.001) return;
      routeProject(h);
      const A = P2.alpha, zk = clamp(K.z, 0.7, 2.4), W0 = h.o.width * P2.width;
      const S = segs(h);
      // street glow (additive): lights the street the plan runs along
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.globalCompositeOperation = 'lighter';
      for (const [lw, a] of [[30, 0.05], [15, 0.1], [7, 0.18]]) {
        g.beginPath(); for (const s of S) tracePart(h, s[0], s[1]);
        g.strokeStyle = rgba(h.col, a * A * P2.glow); g.lineWidth = lw * zk; g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
      // core: a thin solid guide + marching dashes
      g.beginPath(); for (const s of S) tracePart(h, s[0], s[1]);
      g.strokeStyle = rgba(h.col, 0.5 * A); g.lineWidth = Math.max(1.6, W0 * 0.55); g.stroke();
      if (h.o.dash) { g.setLineDash(h.o.dash); g.lineDashOffset = -lt * P2.march; }
      g.strokeStyle = rgba(h.col, A); g.lineWidth = W0; g.stroke();
      g.setLineDash([]);
      // the broken stretch: dim, jittered, falling apart
      if (P2.cut0 >= 0 && P2.cutA > 0.001 && P2.draw > P2.cut0) {
        const u1 = Math.min(P2.draw, P2.cut1);
        const f0 = h.idx(P2.cut0), f1 = h.idx(u1);
        g.beginPath();
        for (let i = Math.floor(f0); i < Math.ceil(f1); i += 2) {
          const k = hash(i * 13 + 5);
          if (k < P2.cutA * 0.55) continue;
          const j = Math.min(h.pts.length - 1, i + 1);
          const jx = (hash(i * 7 + Math.floor(lt * 15)) - 0.5) * 6 * P2.cutA, jy = (hash(i * 11 + Math.floor(lt * 15)) - 0.5) * 6 * P2.cutA;
          g.moveTo(h.sx[i] + jx, h.sy[i] + jy); g.lineTo(h.sx[j] + jx, h.sy[j] + jy);
        }
        g.strokeStyle = rgba(COL.bone, 0.5 * A * (1 - 0.5 * P2.cutA)); g.lineWidth = 2; g.stroke();
      }
    }
    function routeTop(h, lt) {
      const P2 = h.p; if (P2.alpha <= 0.001 || P2.draw <= P2.tail + 1e-4) return;
      const A = P2.alpha, zk = clamp(K.z, 0.7, 2.4);
      const S = segs(h);
      // see-through pass: where buildings stand in front, the plan still reads
      if (look.xray > 0.01 && h.o.xray > 0) {
        g.beginPath(); for (const s of S) tracePart(h, s[0], s[1]);
        g.lineJoin = 'round'; g.lineCap = 'round';
        g.strokeStyle = rgba(h.col, h.o.xray * look.xray * A); g.lineWidth = 1.6; g.stroke();
      }
      // head: glow + arrow
      const f = h.idx(P2.draw), i = Math.min(h.pts.length - 2, Math.floor(f)), t = f - i;
      const hx = lerp(h.sx[i], h.sx[i + 1], t), hy = lerp(h.sy[i], h.sy[i + 1], t);
      let dx = h.sx[i + 1] - h.sx[i], dy = h.sy[i + 1] - h.sy[i];
      const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      if (P2.head > 0.01) {
        const R = 34 * zk * P2.head;
        g.globalCompositeOperation = 'lighter';
        const gr = g.createRadialGradient(hx, hy, 0, hx, hy, R);
        gr.addColorStop(0, rgba(h.lig, 0.75 * A * Math.min(1, P2.head))); gr.addColorStop(0.25, rgba(h.col, 0.3 * A)); gr.addColorStop(1, rgba(h.col, 0));
        g.fillStyle = gr; g.fillRect(hx - R, hy - R, 2 * R, 2 * R);
        g.globalCompositeOperation = 'source-over';
      }
      if (h.o.arrow) {
        const a = 9 + 3 * zk;
        g.beginPath(); g.moveTo(hx - dx * a - dy * a * 0.62, hy - dy * a + dx * a * 0.62); g.lineTo(hx + dx * 2, hy + dy * 2); g.lineTo(hx - dx * a + dy * a * 0.62, hy - dy * a - dx * a * 0.62);
        g.strokeStyle = rgba(h.lig, A); g.lineWidth = 3; g.lineJoin = 'miter'; g.lineCap = 'butt'; g.stroke();
        g.lineJoin = 'round'; g.lineCap = 'round';
      }
      // break marks at the ends of a broken stretch
      if (P2.cut0 >= 0 && P2.cutA > 0.05) {
        for (const u of [P2.cut0, P2.cut1]) {
          if (u > P2.draw) continue;
          const ff = h.idx(u), ii = Math.min(h.pts.length - 2, Math.floor(ff)), tt = ff - ii;
          const x = lerp(h.sx[ii], h.sx[ii + 1], tt), y = lerp(h.sy[ii], h.sy[ii + 1], tt), s = 7 * P2.cutA;
          g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y + s); g.moveTo(x + s, y - s); g.lineTo(x - s, y + s);
          g.strokeStyle = rgba(COL.rival, A * P2.cutA); g.lineWidth = 2.6; g.stroke();
        }
      }
    }

    // ---- markers ----
    function marker(mo) {
      mo = Object.assign({ kind: 'dot', color: null, h: 90, r: 34 }, mo);
      mo.col = hexRgb(mo.color || (mo.kind === 'vega' ? C.rival : C.amber));
      mo.p = { a: 1, grow: 1, pulse: -1, ring: 1, x: mo.x, y: mo.y };
      markers.push(mo);
      return mo.p;
    }
    function drawMarker(m, lt) {
      const P2 = m.p; if (P2.a <= 0.001) return;
      const x = P2.x, y = P2.y, A = P2.a, col = m.col, zk = clamp(K.z, 0.75, 2.2);
      const gx = sxOf(x, y), gy = syOf(x, y, 1);
      if (m.kind === 'objective' || m.kind === 'start') {
        const R = m.r * P2.ring;
        g.lineCap = 'round';
        g.beginPath(); groundCircle(x, y, R, 1); g.fillStyle = rgba(col, 0.1 * A); g.fill();
        g.strokeStyle = rgba(col, A); g.lineWidth = 2.4; g.stroke();
        if (m.kind === 'objective') {
          g.beginPath(); groundCircle(x, y, R * 1.6, 1); g.setLineDash([5, 7]); g.lineDashOffset = -lt * 10; g.strokeStyle = rgba(col, 0.75 * A); g.lineWidth = 1.6; g.stroke(); g.setLineDash([]);
        }
        if (P2.pulse > 0 && P2.pulse < 1) {
          const u = P2.pulse, e = 1 - Math.pow(1 - u, 3);
          g.beginPath(); groundCircle(x, y, R * (1 + 2.4 * e), 1); g.strokeStyle = rgba(hexRgb(C.amberLight), 0.9 * (1 - u) * A); g.lineWidth = 2.2; g.stroke();
        }
        g.beginPath(); g.arc(gx, gy, 4 * zk, 0, Math.PI * 2); g.fillStyle = rgba(col, A); g.fill();
      }
      if (m.kind === 'atlas' || m.kind === 'vega' || m.kind === 'objective') {
        const hh = m.h * P2.grow;
        if (hh > 0.5) {
          const tx = sxOf(x, y), ty = syOf(x, y, hh);
          g.globalCompositeOperation = 'lighter';
          let gr = g.createLinearGradient(gx, gy, tx, ty);
          gr.addColorStop(0, rgba(col, 0.35 * A)); gr.addColorStop(1, rgba(col, 0.03 * A));
          g.strokeStyle = gr; g.lineWidth = 12 * zk; g.lineCap = 'butt';
          g.beginPath(); g.moveTo(gx, gy); g.lineTo(tx, ty); g.stroke();
          g.globalCompositeOperation = 'source-over';
          gr = g.createLinearGradient(gx, gy, tx, ty);
          gr.addColorStop(0, rgba(col, A)); gr.addColorStop(1, rgba(col, 0.5 * A));
          g.strokeStyle = gr; g.lineWidth = 2; g.beginPath(); g.moveTo(gx, gy); g.lineTo(tx, ty); g.stroke();
          const e = 10 * zk;
          if (m.kind === 'atlas' || m.kind === 'objective') {
            g.beginPath(); g.moveTo(tx, ty - e * 1.25); g.lineTo(tx + e, ty); g.lineTo(tx, ty + e * 1.25); g.lineTo(tx - e, ty); g.closePath();
            g.fillStyle = rgba(col, A); g.fill();
          } else {
            g.beginPath(); g.arc(tx, ty, e * 0.95, 0, Math.PI * 2); g.strokeStyle = rgba(col, A); g.lineWidth = 2.8; g.stroke();
            g.fillStyle = rgba(COL.bg, A); g.fill();
            g.beginPath(); g.arc(tx, ty, e * 0.95, 0, Math.PI * 2); g.stroke();
          }
          m.top = [tx, ty];
        }
      }
      if (m.kind === 'dot') {
        g.beginPath(); g.arc(gx, gy, 5 * zk, 0, Math.PI * 2); g.fillStyle = rgba(col, A); g.fill();
        g.globalCompositeOperation = 'lighter';
        const R = 22 * zk, gr = g.createRadialGradient(gx, gy, 0, gx, gy, R);
        gr.addColorStop(0, rgba(col, 0.5 * A)); gr.addColorStop(1, rgba(col, 0));
        g.fillStyle = gr; g.fillRect(gx - R, gy - R, 2 * R, 2 * R);
        g.globalCompositeOperation = 'source-over';
      }
    }

    // ---- steam from the cooling towers (drawn after the city) ----
    function steamPass(lt) {
      if (look.steam <= 0.01) return;
      for (const t of M.objs) {
        if (t.type !== 'tower' && t.type !== 'chimney' || !t._top) continue;
        const [cx, ty, rt] = t._top;
        if (cx < -400 || cx > W + 400) continue;
        const n = t.type === 'tower' ? 9 : 5;
        for (let k = 0; k < n; k++) {
          const u = ((lt * 0.32 + k / n + t.x * 0.0007) % 1 + 1) % 1;
          const rise = u * (t.type === 'tower' ? 150 : 90) * K.z, drift = u * u * 120 * K.z;
          const R = rt * (0.7 + 1.6 * u) + 6;
          const px = cx + drift + Math.sin(k * 2.1 + lt) * 6 * K.z, py = ty - rise;
          const a = (t.type === 'tower' ? 0.34 : 0.18) * (1 - u) * smooth(u / 0.12) * look.steam;
          const gr = g.createRadialGradient(px, py, 0, px, py, R);
          const lit = look.power;
          gr.addColorStop(0, `rgba(${Math.round(lerp(150, 239, lit * (1 - u)))},${Math.round(lerp(144, 189, lit * (1 - u)))},${Math.round(lerp(134, 112, lit * (1 - u)))},${a.toFixed(3)})`);
          gr.addColorStop(1, 'rgba(120,114,104,0)');
          g.fillStyle = gr; g.fillRect(px - R, py - R, 2 * R, 2 * R);
        }
      }
    }
    function beaconsPass(lt, cull) {
      g.fillStyle = rgba(COL.amber, 1);
      const pts = [];
      for (const ob of M.objs) {
        if (!ob.beacon) continue;
        const ph = ((lt + ob.beacon.phase) % ob.beacon.period) / ob.beacon.period;
        if (ph > 0.22) continue;
        const z1 = ob.antenna ? ob.antenna.z1 : ob.z1 + (ob.extra || 0);
        const x = ob.antenna ? ob.antenna.x : ob.type === 'chimney' ? ob.x : ob.x1 - 2, y = ob.antenna ? ob.antenna.y : ob.type === 'chimney' ? ob.y : ob.y1 - 2;
        const px = sxOf(x, y), py = syOf(x, y, z1);
        if (px < cull[0] || px > cull[2] || py < cull[1] || py > cull[3]) continue;
        if (dState[ob.district].lit * look.lights < 0.3) continue;
        pts.push(px, py);
      }
      g.beginPath(); for (let q = 0; q < pts.length; q += 2) g.rect(pts[q] - 1.8, pts[q + 1] - 1.8, 3.6, 3.6); g.fill();
      g.globalCompositeOperation = 'lighter';
      for (let q = 0; q < pts.length; q += 2) { const gr = g.createRadialGradient(pts[q], pts[q + 1], 0, pts[q], pts[q + 1], 12); gr.addColorStop(0, rgba(COL.amber, 0.5)); gr.addColorStop(1, rgba(COL.amber, 0)); g.fillStyle = gr; g.fillRect(pts[q] - 12, pts[q + 1] - 12, 24, 24); }
      g.globalCompositeOperation = 'source-over';
    }

    // ---- storm ----
    function boltPath(s, lt) {
      const [px, py] = toScreen(s.x, s.y, s.z || 0);
      const rr = Film.utils.rng('bolt:' + s.seed + ':' + o.seed);
      const top = -40, L = py - top;
      const main = [[px + (rr() - 0.5) * 260, top]];
      const n = 16;
      for (let k = 1; k < n; k++) { const u = k / n; main.push([lerp(main[0][0], px, u) + (rr() - 0.5) * 90 * (1 - u * 0.7), top + L * u + (rr() - 0.5) * 18]); }
      main.push([px, py]);
      const br = [];
      for (let b = 0; b < 3; b++) {
        const k = 3 + Math.floor(rr() * (n - 6)), p0 = main[k];
        const pts = [p0]; let x = p0[0], y = p0[1]; const dir = rr() < 0.5 ? -1 : 1;
        for (let q = 0; q < 5; q++) { x += dir * (14 + rr() * 30); y += 18 + rr() * 26; pts.push([x, y]); }
        br.push(pts);
      }
      return { main, br };
    }
    function stormPass(lt, cull) {
      // bolts
      for (const s of strikes) {
        const d = lt - s.t;
        if (d < 0 || d > 0.3 || (d > 0.075 && d < 0.1) || d > 0.16 && d < 0.24) continue;
        const b = boltPath(s, lt);
        g.lineJoin = 'round'; g.lineCap = 'round';
        const draw = (pts) => { g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); };
        g.globalCompositeOperation = 'lighter';
        for (const [lw, a] of [[22, 0.06], [9, 0.16], [4, 0.45]]) { draw(b.main); g.strokeStyle = rgba(COL.ink, a * s.k); g.lineWidth = lw; g.stroke(); for (const p of b.br) { draw(p); g.lineWidth = lw * 0.5; g.stroke(); } }
        g.globalCompositeOperation = 'source-over';
        draw(b.main); g.strokeStyle = rgba(COL.ink, 0.95 * s.k); g.lineWidth = 2.2; g.stroke();
        for (const p of b.br) { draw(p); g.lineWidth = 1.3; g.stroke(); }
      }
      // cloud drifting over the city (screen space)
      if (look.fog > 0.01) {
        const dx = -((lt * 26) % 640), dy = -((lt * 6) % 200);
        g.globalAlpha = clamp(look.fog, 0, 1) * 0.32;
        g.imageSmoothingEnabled = true;
        g.drawImage(fogC, dx - 120, dy - 140, 3200, 2000);
        g.globalAlpha = 1;
      }
      // haze toward the top of the frame (far side)
      if (look.haze > 0.01) {
        const gr = g.createLinearGradient(0, cull[1], 0, cull[1] + 520);
        gr.addColorStop(0, `rgba(34,31,27,${(0.55 * look.haze).toFixed(3)})`); gr.addColorStop(1, 'rgba(34,31,27,0)');
        g.fillStyle = gr; g.fillRect(cull[0], cull[1], cull[2] - cull[0], 520);
      }
      // team tint: a wash of colour from the top of the frame
      if (look.tint > 0.005) {
        const gr = g.createLinearGradient(0, cull[1], 0, cull[3]);
        const tc = hexRgb(look.tintCol);
        gr.addColorStop(0, rgba(tc, 0.16 * look.tint)); gr.addColorStop(0.6, rgba(tc, 0.04 * look.tint)); gr.addColorStop(1, rgba(tc, 0));
        g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(cull[0], cull[1], cull[2] - cull[0], cull[3] - cull[1]); g.globalCompositeOperation = 'source-over';
      }
      // rain: two layers of slanted streaks + splashes
      if (look.rain > 0.01) {
        const ang = 0.24, vx = Math.sin(ang), vy = Math.cos(ang);
        const layer = (arr, speed, lw, kA) => {
          g.beginPath();
          const Hh = H + 200;
          for (const [x0, ph, len, a] of arr) {
            const y = ((ph * Hh + lt * speed) % Hh) - 100;
            const x = ((x0 + y * vx / vy) % 2400 + 2400) % 2400 - 240;
            if (x < cull[0] - 80 || x > cull[2] + 80) continue;
            g.moveTo(x, y); g.lineTo(x - vx * len, y - vy * len);
          }
          g.strokeStyle = rgba(COL.bone, kA * look.rain); g.lineWidth = lw; g.stroke();
        };
        g.lineCap = 'butt';
        layer(RAIN.far, 1500, 1, 0.16);
        layer(RAIN.near, 2600, 1.6, 0.2);
        const slot = Math.floor(lt * 15);
        g.beginPath();
        for (let k = 0; k < 160; k++) {
          const x = cull[0] + hash(k * 7919 + slot * 104729) * (cull[2] - cull[0]), y = cull[1] + hash(k * 6007 + slot * 7727) * (cull[3] - cull[1]);
          g.rect(x, y, 1.6, 1.6);
        }
        g.fillStyle = rgba(COL.bone, 0.28 * look.rain); g.fill();
      }
      // flash wash
      const f = FL_NOW;
      if (f > 0.01) {
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = rgba(COL.bone, clamp(0.13 * f, 0, 0.5)); g.fillRect(cull[0], cull[1], cull[2] - cull[0], cull[3] - cull[1]);
        g.globalCompositeOperation = 'source-over';
      }
    }

    // ---- the frame ----
    function frame(lt) {
      prep(lt);
      for (const ob of M.objs) if (ob._top) ob._top = null;
      FL_NOW = flashAt(lt);
      visF = [];
      if (K.st > 1e-6) visF.push('E'); else if (K.st < -1e-6) visF.push('W');
      if (K.ct > 1e-6) visF.push('S'); else if (K.ct < -1e-6) visF.push('N');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.clearRect(0, 0, W, H);
      if (look.alpha <= 0.001) return;
      const cull = o.cull ? (typeof o.cull === 'function' ? o.cull(lt) : o.cull) : [0, 0, W, H];
      g.save();
      if (o.clip) { g.beginPath(); o.clip(g, lt); g.clip(); }
      g.globalAlpha = 1;
      g.fillStyle = rgba(COL.bg, 1); g.fillRect(cull[0], cull[1], cull[2] - cull[0], cull[3] - cull[1]);
      groundPass(lt);
      lampsPass(lt, cull);
      carsPass(lt, cull);
      for (const h of routes) routeGround(h, lt);
      // objects in painter's order: cell slabs (columns, then rows), each a BSP of lots
      const iOrd = K.st >= 0 ? 1 : -1, jOrd = K.ct >= 0 ? 1 : -1;
      g.lineJoin = 'miter'; g.lineCap = 'butt';
      for (let a = 0; a < N; a++) {
        const i = iOrd > 0 ? a : N - 1 - a;
        for (let b = 0; b < N; b++) {
          const j = jOrd > 0 ? b : N - 1 - b;
          const c = M.cells[i * N + j];
          if (!c.tree) continue;
          // cull the cell by its screen box
          corners(c.x0, c.y0, c.x1, c.y1);
          let mnx = Infinity, mxx = -Infinity, mny = Infinity, mxy = -Infinity;
          for (let k = 0; k < 4; k++) { if (X[k] < mnx) mnx = X[k]; if (X[k] > mxx) mxx = X[k]; if (Y[k] < mny) mny = Y[k]; if (Y[k] > mxy) mxy = Y[k]; }
          mny += K.up * c.zmax;
          if (mxx < cull[0] || mnx > cull[2] || mxy < cull[1] || mny > cull[3]) continue;
          walk(c.tree, lt);
        }
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.lineJoin = 'round'; g.lineCap = 'round';
      steamPass(lt);
      beaconsPass(lt, cull);
      for (const h of routes) routeTop(h, lt);
      for (const m of markers) drawMarker(m, lt);
      for (const fn of draws) { g.save(); fn(g, lt, api); g.restore(); }
      stormPass(lt, cull);
      g.restore();
      canvas.style.opacity = String(clamp(look.alpha, 0, 1));
    }
    ctx.onFrame(frame);

    const api = {
      canvas, g, cam, look, M, K,
      district(name) { const k = M.DISTRICTS.findIndex((d) => d.name === name); if (k < 0) throw new Error('WorldCity: no district ' + name); return dState[k]; },
      route, marker,
      wave(wo) {
        wo = Object.assign({ speed: 900, color: C.rival, kill: true }, wo);
        const d = M.DISTRICTS.findIndex((q) => q.name === wo.district);
        if (d < 0) throw new Error('WorldCity: no district ' + wo.district);
        const arr = new Map();
        let maxR = 0;
        // block by block: arrival per cell (its nearest point to the origin), plus a small per-object jitter
        for (const ob of M.objs) if (ob.district === d) {
          const c = ob.cell, nx = clamp(wo.x, c.x0, c.x1), ny = clamp(wo.y, c.y0, c.y1);
          const dist = Math.hypot(Math.max(Math.abs(ob.cx - wo.x) - 0, 0), Math.abs(ob.cy - wo.y));
          const cellD = Math.hypot(nx - wo.x, ny - wo.y);
          const dd = lerp(cellD, dist, 0.35);
          maxR = Math.max(maxR, dist);
          arr.set(ob, wo.t0 + dd / wo.speed + hash(ob.id * 3 + 1) * 0.05);
        }
        for (const l of M.lampsByD[d]) { const dist = Math.hypot(l.x - wo.x, l.y - wo.y); arr.set(l, wo.t0 + dist / wo.speed); }
        const w = { d, x: wo.x, y: wo.y, t0: wo.t0, speed: wo.speed, col: hexRgb(wo.color), kill: wo.kill, arr, maxR };
        waves.push(w);
        return w;
      },
      relight(h, ro) {
        ro = Object.assign({ radius: 70 }, ro);
        const near = new Map();
        const test = (ob, x, y, extra) => {
          let best = Infinity, bu = 0;
          for (let i = 0; i < h.pts.length; i += 2) { const d = Math.hypot(h.pts[i][0] - x, h.pts[i][1] - y); if (d < best) { best = d; bu = h.cum[i] / h.L; } }
          if (best < ro.radius + extra) near.set(ob, bu);
        };
        for (const ob of M.objs) test(ob, ob.cx, ob.cy, Math.max(ob.x1 - ob.x0, ob.y1 - ob.y0) / 2);
        for (const l of M.lamps) test(l, l.x, l.y, 0);
        relights.push({ route: h, near });
      },
      draw(fn) { draws.push(fn); return api; },
      toScreen(x, y, h) { prep(0); return toScreen(x, y, h); },
      toScreenAt(x, y, h, lt) { prep(lt); return toScreen(x, y, h); },
      flashAt,
      strikes,
    };
    return api;
  }

  window.WorldCity = { create, model, tiles };
})();
