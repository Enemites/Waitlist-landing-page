/* Floodgate: the example Competitive match (design/screen-compositions/competitive.html and
 * public/assets/realms/screens/competitive-main-2000.webp), rebuilt as a live, animatable world.
 *
 *   const F = Floodgate.world(ctx, { scale: 1.5, state: { zoom: 0.8 } })
 *     F.T            terrain handle (camera state, spots, toScreen, move, group) - same API as Brand.terrain
 *     F.svg, F.g     full-frame SVG + world group (product coordinates x scale, follows camera)
 *     F.wg           <g> in PRODUCT coordinates (the 1600x1000 composition); put world marks here
 *     F.P            named points in WORLD coordinates (gate, pump, crossing, nc, jk, ek, vega1, vega2, ghost ...)
 *     F.el           handles: gate, gateBars, ring (objective progress arc), ringTrack, pump, conduit, crossing,
 *                    cone, fog, tokens { nc, jk, ek }, vega [v1, v2], ghost, labels { pump, gate, crossing, lastSeen }
 *                    (each label has .name / .sub text elements), plus insertion groups (below the tokens):
 *                    baseG (just above the terrain), routesG (routes), nodeG (between routes and tokens)
 *     F.progress     proxy { v } 0..1 for the objective ring (tween it; drawn every frame)
 *     F.flow         { rate, time }: conduit dash flow. time == null -> uses local time; set a number to drive it
 *     F.reveal(at)   default build-on: terrain reveal + marks pop in sequence
 *     F.M, F.S       margin (product units) and scale
 *     F.toWorld(px, py)   product -> world coordinates (what T.state.cx/cy and F.P use)
 *     F.toScreen(px, py)  product -> screen pixels under the current camera
 *     F.cam(px, py, zoom) -> { cx, cy, zoom } world camera state that centres product point (px,py)
 *
 *   Options (all optional; defaults keep the original behaviour):
 *     margin: 0       product units baked around the 1600x1000 composition (e.g. 240): wider camera
 *                     presets never show a terrain edge. The outer 120 units fade to #0b0c0e and the
 *                     river is extended past the frame. World coords then include the margin offset.
 *     shared: true    share ONE baked terrain bitmap between every scene that asks for the same
 *                     terrain (module-level cache keyed by seed/size/step/res/margin). Each scene
 *                     still owns its own display canvas and camera. false = Brand.terrain per scene.
 *     film: false     film type sizes: map labels keep a constant SCREEN size at any zoom
 *                     (names 22 px Manrope, sublabels 20 px mono), tokens r 19 with 13-unit initials.
 *     zoomCap: 2.4    maximum world zoom (shared terrain only); close-ups need terrain: { res: 2 }.
 *     parent          layer element for both the terrain canvas and the marks SVG.
 *
 *   Floodgate.ui(ctx, o) builds the screen chrome as DOM, each piece separately animatable:
 *     topbar, score (with live clock), roster (3 members), channel (messages, pinned plan,
 *     compose), objective (progress bar + warning). Returns handles; nothing animates unless
 *     you call the returned helpers (enter(at), typeMessages(at), setState(...)).
 *     o.layout: 'film' applies the film-safe layout (title-safe positions, every mono >= 20 px);
 *     match.js uses it.
 *
 * World coordinates: the product composition is 1600x1000; world = (product + margin) x scale.
 */
(function () {
  'use strict';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080;
  const RIVER = [[1640, 60], [1380, 190], [1190, 262], [1030, 372], [900, 460], [800, 560], [690, 636], [530, 680], [360, 770], [140, 830], [-40, 900]];
  // collinear extensions past both ends of the composition (used only when margin > 0)
  const RIVER_EXT = [[2160, -200]].concat(RIVER, [[-560, 1070]]);
  const PAL = { low: '#211c15', high: '#4a3c2a', water: '#0b0f10', waterShallow: '#18211f', coast: 'rgba(232,200,138,.72)', seaLine: 'rgba(159,176,162,.15)', line: '#efbd70', bright: '#f6d39f' };

  // ---------------------------------------------------------------------------------------
  // Shared terrain: ONE bake per (seed, size, step, res, margin) for the whole film, and one
  // display canvas + camera per scene. Display logic mirrors Brand.terrain exactly.
  // ---------------------------------------------------------------------------------------
  const BAKES = new Map();
  let SCRATCH = null;
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function bakeTerrain(o) {
    const height = o.height;
    const WW = o.w, WH = o.h, cell = o.cell;
    const cols = Math.ceil(WW / cell) + 1, rows = Math.ceil(WH / cell) + 1;
    const field = new Float32Array(cols * rows);
    let lo = Infinity, hi = -Infinity;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const v = height(c * cell, r * cell); field[r * cols + c] = v; if (v < lo) lo = v; if (v > hi) hi = v;
    }
    const pal = Object.assign({ line: C.amber, bright: C.amberLight, low: '#0e0d0b', high: '#1c1712', water: '#0a0a0b' }, o.palette);
    const sea = o.sea;
    const levels = [];
    const base0 = sea != null ? sea : Math.ceil(lo / o.step) * o.step;
    for (let v = base0 - Math.floor((base0 - lo) / o.step) * o.step; v < hi; v += o.step) levels.push(+v.toFixed(5));
    function strokeLevels(g, filter, style) {
      levels.forEach((v) => {
        const kk = Math.round((v - base0) / o.step);
        const isIndex = kk % 4 === 0;
        const under = sea != null && v < sea;
        const coast = sea != null && Math.abs(v - sea) < 1e-6;
        if (!filter(isIndex, under, coast)) return;
        g.beginPath();
        for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
          const a = field[r * cols + c], b = field[r * cols + c + 1], cc = field[(r + 1) * cols + c + 1], d = field[(r + 1) * cols + c];
          let n = 0; const px = [0, 0, 0, 0], py = [0, 0, 0, 0];
          if ((a >= v) !== (b >= v)) { px[n] = (c + (v - a) / (b - a)) * cell; py[n++] = r * cell; }
          if ((b >= v) !== (cc >= v)) { px[n] = (c + 1) * cell; py[n++] = (r + (v - b) / (cc - b)) * cell; }
          if ((cc >= v) !== (d >= v)) { px[n] = (c + (v - d) / (cc - d)) * cell; py[n++] = (r + 1) * cell; }
          if ((d >= v) !== (a >= v)) { px[n] = c * cell; py[n++] = (r + (v - a) / (d - a)) * cell; }
          for (let i = 0; i + 1 < n; i += 2) { g.moveTo(px[i], py[i]); g.lineTo(px[i + 1], py[i + 1]); }
        }
        style(g, isIndex, under, coast);
        g.stroke();
      });
    }
    const RES = o.res || 1;
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.round(w * RES); c.height = Math.round(h * RES); return c; };
    const base = mk(WW, WH); const bg = base.getContext('2d'); bg.scale(RES, RES);
    bg.fillStyle = C.map; bg.fillRect(0, 0, WW, WH);
    if (o.tint !== false) {
      const img = new ImageData(cols, rows);
      const L = hexRgb(pal.low), Hh = hexRgb(pal.high), Wt = hexRgb(pal.water);
      const S2 = pal.waterShallow ? hexRgb(pal.waterShallow) : null;
      for (let i = 0; i < field.length; i++) {
        const v = field[i];
        let rgb;
        if (sea != null && v < sea) rgb = S2 ? (() => { const tt = clamp(1 + (v - sea) / 0.35, 0, 1); return [0, 1, 2].map((j) => Math.round(Wt[j] + (S2[j] - Wt[j]) * tt)); })() : Wt;
        else { const tt = sea != null ? clamp((Math.floor((v - sea) / o.step) * o.step) / 0.7, 0, 1) : clamp((Math.floor((v - lo) / o.step) * o.step) / (hi - lo), 0, 1); rgb = [0, 1, 2].map((j) => Math.round(L[j] + (Hh[j] - L[j]) * tt)); }
        img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = 255;
      }
      const small = document.createElement('canvas'); small.width = cols; small.height = rows;
      small.getContext('2d').putImageData(img, 0, 0);
      bg.imageSmoothingEnabled = true; bg.drawImage(small, 0, 0, cols * cell, rows * cell);
    }
    bg.lineJoin = 'round'; bg.lineCap = 'round';
    strokeLevels(bg, () => true, (g, isIndex, under, coast) => {
      if (coast) { g.strokeStyle = pal.coast || B.rgba(pal.line, 0.55); g.lineWidth = 1.6; }
      else if (under) { g.strokeStyle = pal.seaLine || B.rgba(pal.line, 0.07); g.lineWidth = 0.9; }
      else { g.strokeStyle = B.rgba(pal.line, isIndex ? 0.31 : 0.17); g.lineWidth = isIndex ? 1.7 : 1.05; }
    });
    const bright = mk(WW, WH); const brg = bright.getContext('2d'); brg.scale(RES, RES);
    brg.lineJoin = 'round'; brg.lineCap = 'round';
    strokeLevels(brg, (i, under) => !under, (g, isIndex, under, coast) => {
      g.strokeStyle = B.rgba(pal.bright, isIndex || coast ? 0.95 : 0.6); g.lineWidth = isIndex || coast ? 2.0 : 1.3;
    });
    return { base, bright, field, WW, WH, RES, height };
  }

  function terrainShared(ctx, o, key) {
    let bk = BAKES.get(key);
    if (!bk) { bk = bakeTerrain(o); BAKES.set(key, bk); }
    const { base, bright, WW, WH, RES } = bk;
    const zoomCap = o.zoomCap || 2.4;
    const { canvas, g } = ctx.canvas({ className: ('terrain ' + (o.className || '')).trim(), parent: o.parent });
    if (!SCRATCH) { SCRATCH = document.createElement('canvas'); SCRATCH.width = W; SCRATCH.height = H; }
    const scratch = SCRATCH, sg = scratch.getContext('2d');
    const state = Object.assign({ cx: WW / 2, cy: WH / 2, zoom: 1, rot: 0, alpha: 1, reveal: 1, revealX: WW / 2, revealY: WH / 2, revealSoft: 420,
      light: 0, pulse: 0, pulseX: WW / 2, pulseY: WH / 2, pulseR: 900, flood: 1, floodAmp: 22 }, o.state || {});
    const spots = o.spots || [];
    const bound = [];
    const floodNoise = Film.utils.noise2D((o.seed || 'realms') + ':flood');
    function camMatrix() {
      const z = Math.min(state.zoom, zoomCap), a = state.rot * Math.PI / 180, cs = Math.cos(a) * z, sn = Math.sin(a) * z;
      return [cs, sn, -sn, cs, W / 2 - (cs * state.cx - sn * state.cy), H / 2 - (sn * state.cx + cs * state.cy)];
    }
    function toScreen(x, y) { const m = camMatrix(); return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
    function svgTransform() { const m = camMatrix(); return `matrix(${m.map((v) => +v.toFixed(5)).join(' ')})`; }
    function frame(t) {
      const m = camMatrix();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.clearRect(0, 0, W, H);
      if (state.alpha <= 0.001) { for (const b of bound) b.setAttribute('transform', svgTransform()); return; }
      g.setTransform(m[0] / RES, m[1] / RES, m[2] / RES, m[3] / RES, m[4], m[5]);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(base, 0, 0);
      const anyLight = state.light > 0.001 || state.pulse > 0.001 && state.pulse < 0.999 || spots.some((s) => (s.a == null ? 1 : s.a) > 0.001);
      if (anyLight) {
        sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'source-over'; sg.globalAlpha = 1; sg.clearRect(0, 0, W, H);
        sg.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
        if (state.light > 0.001) { sg.globalAlpha = clamp(state.light, 0, 1); sg.fillStyle = '#fff'; sg.fillRect(0, 0, WW, WH); }
        for (const s of spots) {
          const a = s.a == null ? 1 : s.a; if (a <= 0.001) continue;
          const gr = sg.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
          gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
          sg.globalAlpha = clamp(a, 0, 1); sg.fillStyle = gr; sg.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
        }
        if (state.pulse > 0.001 && state.pulse < 0.999) {
          const R = state.pulse * state.pulseR, band = 70 + 120 * state.pulse;
          const gr = sg.createRadialGradient(state.pulseX, state.pulseY, Math.max(0, R - band), state.pulseX, state.pulseY, R + band * 0.35);
          gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.72, `rgba(255,255,255,${0.95 * (1 - state.pulse)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
          sg.globalAlpha = 1; sg.fillStyle = gr; sg.fillRect(state.pulseX - R - band, state.pulseY - R - band, (R + band) * 2, (R + band) * 2);
        }
        sg.globalAlpha = 1; sg.globalCompositeOperation = 'source-in';
        sg.setTransform(m[0] / RES, m[1] / RES, m[2] / RES, m[3] / RES, m[4], m[5]);
        sg.drawImage(bright, 0, 0);
        sg.globalCompositeOperation = 'source-over';
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.drawImage(scratch, 0, 0);
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      if (state.reveal < 0.999) {
        const [sx, sy] = toScreen(state.revealX, state.revealY);
        const R = state.reveal * 2600 * Math.max(1, state.zoom * 0.6), soft = state.revealSoft;
        const gr = g.createRadialGradient(sx, sy, Math.max(0, R - soft), sx, sy, R + 1);
        gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalCompositeOperation = 'destination-in'; g.fillStyle = state.reveal <= 0.001 ? 'rgba(0,0,0,0)' : gr; g.fillRect(0, 0, W, H);
      }
      if (state.flood < 0.999) {
        const yb = H + 60 - state.flood * (H + 160);
        g.globalCompositeOperation = 'destination-in'; g.fillStyle = '#000';
        g.beginPath(); g.moveTo(0, H + 10);
        for (let x = 0; x <= W; x += 24) g.lineTo(x, yb + state.floodAmp * floodNoise(x * 0.0022, t * 0.35));
        g.lineTo(W, H + 10); g.closePath(); g.fill();
      }
      g.globalCompositeOperation = 'source-over';
      canvas.style.opacity = String(clamp(state.alpha, 0, 1));
      for (const b of bound) b.setAttribute('transform', svgTransform());
    }
    ctx.onFrame(frame);
    return {
      canvas, state, spots, world: { w: WW, h: WH }, height: (x, y) => bk.height(x, y), field: bk.field, toScreen, svgTransform, shared: true,
      group(svgParent, attrs) { const gg = ctx.svg('g', attrs || {}, svgParent); bound.push(gg); return gg; },
      bind(gEl) { bound.push(gEl); return gEl; },
      move(at, dur, to, ease) { ctx.tl.to(state, Object.assign({ duration: dur, ease: ease || B.E.camera }, to), at); return this; },
    };
  }

  function world(ctx, o) {
    o = Object.assign({ scale: 1.5, seed: 58, labels: true, margin: 0, shared: true, film: false, zoomCap: 2.4 }, o || {});
    const S = o.scale, M = o.margin || 0, OFF = M * S;
    const RPTS = M > 0 ? RIVER_EXT : RIVER;
    const n = Film.utils.noise2D(o.seed);
    const height = (X, Y) => {
      const x = X / S - M, y = Y / S - M;
      const nn = n.fbm(x / 230, y / 230, 5);
      const d = B.distToPath(x, y, RPTS);
      const river = 0.62 * Math.exp(-((d / (58 + 18 * nn)) ** 2));
      return 0.36 + 0.2 * nn - river
        + B.gauss(x, y, 380, 320, 170, 0.42) + B.gauss(x, y, 1260, 690, 190, 0.48)
        + B.gauss(x, y, 1380, 360, 110, 0.25) + B.gauss(x, y, 300, 760, 120, 0.15);
    };
    const tOpts = Object.assign({
      seed: 'floodgate-' + o.seed, w: (1600 + 2 * M) * S, h: (1000 + 2 * M) * S, cell: 5, step: 0.06, sea: 0.18, palette: PAL, height,
      state: Object.assign({ cx: 800 * S + OFF, cy: 520 * S + OFF, zoom: 1920 / (1600 * S) * 1.0 }, o.state || {}),
      parent: o.parent, zoomCap: o.zoomCap,
    }, o.terrain || {});
    let T;
    const custom = o.terrain && o.terrain.height;
    if (o.shared && !custom) {
      const key = JSON.stringify(['fg', o.seed, S, M, tOpts.w, tOpts.h, tOpts.cell, tOpts.step, tOpts.sea, tOpts.res || 1, tOpts.tint !== false, tOpts.palette]);
      T = terrainShared(ctx, tOpts, key);
    } else T = B.terrain(ctx, tOpts);
    const p = (x, y) => [(x + M) * S, (y + M) * S];
    const P = {
      gate: p(800, 560), pump: p(562, 399), crossing: p(1004, 396), nc: p(562, 440), jk: p(684, 484), ek: p(920, 420),
      vega1: p(1118, 342), vega2: p(1140, 524), ghost: p(1060, 640), river: RIVER.map(([x, y]) => p(x, y)),
      atlasBank: p(560, 420), vegaBank: p(1180, 560),
    };

    const svg = ctx.svg('svg', { class: 'brand-svg floodgate-marks' }, o.parent);
    const g = T.group(svg);
    const wg = ctx.svg('g', { transform: M ? `translate(${OFF} ${OFF}) scale(${S})` : `scale(${S})` }, g); // product coordinates inside
    const mono = (sz, w) => `font: ${w || 600} ${sz}px var(--mono); letter-spacing: .08em`;
    const el = { tokens: {}, labels: {} };

    // Edge feather (margin only): the outer 120 units fade to the film ground, solid beyond
    if (M > 0) {
      const fe = ctx.svg('g', { class: 'fg-feather' }, wg);
      const fdefs0 = ctx.svg('defs', {}, fe);
      const x0 = -M, y0 = -M, x1 = 1600 + M, y1 = 1000 + M, Fw = 120, BIG = 40000;
      const grad = (id, x1g, y1g, x2g, y2g) => {
        const lg = ctx.svg('linearGradient', { id, x1: x1g, y1: y1g, x2: x2g, y2: y2g }, fdefs0);
        ctx.svg('stop', { offset: '0%', 'stop-color': C.bg, 'stop-opacity': 1 }, lg);
        ctx.svg('stop', { offset: '100%', 'stop-color': C.bg, 'stop-opacity': 0 }, lg);
        return `url(#${id})`;
      };
      const gid = ctx.id + '-fg-fe-' + Math.round(M);
      ctx.svg('rect', { x: x0, y: y0, width: Fw, height: y1 - y0, fill: grad(gid + 'l', 0, 0, 1, 0) }, fe);
      ctx.svg('rect', { x: x1 - Fw, y: y0, width: Fw, height: y1 - y0, fill: grad(gid + 'r', 1, 0, 0, 0) }, fe);
      ctx.svg('rect', { x: x0, y: y0, width: x1 - x0, height: Fw, fill: grad(gid + 't', 0, 0, 0, 1) }, fe);
      ctx.svg('rect', { x: x0, y: y1 - Fw, width: x1 - x0, height: Fw, fill: grad(gid + 'b', 0, 1, 0, 0) }, fe);
      ctx.svg('path', { d: `M${x0 - BIG} ${y0 - BIG}H${x1 + BIG}V${y1 + BIG}H${x0 - BIG}Z M${x0} ${y0}V${y1}H${x1}V${y0}Z`, fill: C.bg, 'fill-rule': 'evenodd' }, fe);
      el.feather = fe;
    }
    el.baseG = ctx.svg('g', { class: 'fg-base' }, wg);

    // Fog over the far bank (Vega's side only partly known)
    const fogId = ctx.id + '-fg-fog';
    const fdefs = ctx.svg('defs', {}, wg);
    const rg = ctx.svg('radialGradient', { id: fogId, cx: 0.5, cy: 0.5, r: 0.5 }, fdefs);
    ctx.svg('stop', { offset: '0%', 'stop-color': C.map, 'stop-opacity': 0.82 }, rg);
    ctx.svg('stop', { offset: '100%', 'stop-color': C.map, 'stop-opacity': 0 }, rg);
    el.fog = ctx.svg('ellipse', { cx: 1470, cy: 620, rx: 900, ry: 700, fill: `url(#${fogId})` }, wg);

    // Conduit pump -> gate (dotted)
    el.conduit = ctx.svg('path', { d: 'M594 399C640 420 690 470 760 540', fill: 'none', stroke: C.amber, 'stroke-opacity': 0.6, 'stroke-width': 2, 'stroke-dasharray': '3 6' }, wg);
    // power flows along the conduit toward the gate (dash offset is a pure function of time)
    const flow = { rate: 14, time: null };
    ctx.onFrame((lt) => el.conduit.setAttribute('stroke-dashoffset', (-(flow.time != null ? flow.time : lt) * flow.rate).toFixed(2)));
    // Pump station
    el.pump = ctx.svg('rect', { x: 530, y: 376, width: 64, height: 46, rx: 4, fill: '#2a2219', stroke: C.amber, 'stroke-opacity': 0.8, 'stroke-width': 1.5 }, wg);
    // Floodgate (rotated) + objective ring
    el.gate = ctx.svg('g', { transform: 'rotate(-32 800 560)' }, wg);
    ctx.svg('rect', { x: 742, y: 548, width: 116, height: 24, rx: 3, fill: '#2a2219', stroke: C.amber, 'stroke-width': 1.5 }, el.gate);
    el.gateBars = ctx.svg('path', { d: 'M760 548v24M778 548v24M796 548v24M814 548v24M832 548v24', stroke: C.amber, 'stroke-opacity': 0.5 }, el.gate);
    el.ringTrack = ctx.svg('circle', { cx: 800, cy: 560, r: 64, fill: 'none', stroke: 'rgba(255,255,255,.12)', 'stroke-width': 5 }, wg);
    el.ring = ctx.svg('circle', { cx: 800, cy: 560, r: 64, fill: 'none', stroke: C.amber, 'stroke-width': 5, 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': '0 100', transform: 'rotate(-90 800 560)' }, wg);
    const progress = { v: 0.62, alpha: 1 };
    ctx.onFrame(() => {
      const v = Math.max(0, Math.min(1, progress.v)) * 100;
      el.ring.setAttribute('stroke-dasharray', `${v.toFixed(2)} 100`);
      el.ring.setAttribute('opacity', v < 0.2 ? '0' : String(progress.alpha));
    });
    // Crossing (two lines)
    el.crossing = ctx.svg('path', { d: 'M948 340 1060 440M936 352 1048 452', stroke: '#e6d6b8', 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none' }, wg);
    // Emre's watch cone
    el.cone = ctx.svg('path', { d: 'M920 420 1046 318 1080 372Z', fill: C.amber, 'fill-opacity': 0.12 }, wg);
    // insertion points below the tokens (routes, then THE NODE)
    el.routesG = ctx.svg('g', { class: 'fg-routes' }, wg);
    el.nodeG = ctx.svg('g', { class: 'fg-node' }, wg);
    // Atlas tokens
    const TR = o.film ? 19 : 17, TF = o.film ? 13 : 11;
    const tok = (key, x, y, txt) => {
      const gg = ctx.svg('g', { transform: `translate(${x} ${y})` }, wg);
      const inner = ctx.svg('g', {}, gg);
      ctx.svg('circle', { r: TR, fill: C.amber }, inner);
      ctx.svg('text', { y: TF * 0.36, 'text-anchor': 'middle', fill: '#1b140a', style: mono(TF), text: txt }, inner);
      el.tokens[key] = gg; el.tokens[key].inner = inner; return gg;
    };
    tok('nc', 562, 440, 'NC'); tok('jk', 684, 484, 'JK'); tok('ek', 920, 420, 'EK');
    el.tokenR = TR;
    // Vega: two seen, one last seen
    const tri = (x, y, op) => { const gg = ctx.svg('g', { transform: `translate(${x} ${y})` }, wg); ctx.svg('path', { d: 'M0 -12l14 24h-28Z', fill: C.rival, 'fill-opacity': op == null ? 1 : op }, gg); return gg; };
    el.vega = [tri(1118, 342), tri(1140, 524)];
    el.ghost = ctx.svg('g', { transform: 'translate(1060 640)' }, wg);
    ctx.svg('circle', { r: 22, fill: 'none', stroke: C.rival, 'stroke-opacity': 0.7, 'stroke-dasharray': '3 5', 'stroke-width': 1.5 }, el.ghost);
    ctx.svg('path', { d: 'M0 -10l9 15h-18Z', fill: C.rival, 'fill-opacity': 0.45 }, el.ghost);
    // Labels (product style: sans label + mono sublabel). Film mode: constant screen size.
    const screenLabels = [];
    if (o.labels) {
      const halo = 'paint-order: stroke; stroke: #0f0d0a; stroke-linejoin: round';
      const lab = (key, x, y, txt, sub, subAbove) => {
        let gg, nameEl, subEl;
        if (o.film) {
          gg = ctx.svg('g', {}, wg);
          nameEl = ctx.svg('text', { x: 0, y: 0, fill: C.ink, style: `font: 600 22px var(--display); letter-spacing: -0.01em; ${halo}; stroke-width: 6px`, text: txt }, gg);
          if (sub) subEl = ctx.svg('text', { x: 0, y: subAbove ? -26 : 25, fill: C.muted2, style: mono(20, 500) + `; ${halo}; stroke-width: 6px`, text: sub }, gg);
          screenLabels.push({ g: gg, x, y });
        } else {
          gg = ctx.svg('g', {}, wg);
          nameEl = ctx.svg('text', { x, y, fill: C.ink, style: `font: 600 15px var(--display); letter-spacing: -0.01em; ${halo}; stroke-width: 4px`, text: txt }, gg);
          if (sub) subEl = ctx.svg('text', { x, y: subAbove ? y - 18 : y + 18, fill: C.muted2, style: mono(10, 500) + `; ${halo}; stroke-width: 4px`, text: sub }, gg);
        }
        gg.name = nameEl; gg.sub = subEl;
        if (o.film) gg.anchor = [x, y];
        el.labels[key] = gg; return gg;
      };
      lab('gate', 760, o.film ? 444 : 476, 'Floodgate', 'OBJECTIVE');
      lab('pump', 512, 362, 'Pump station');
      lab('crossing', 1040, 318, 'Crossing', 'CONTESTED', true);
      if (o.film) {
        // centred above the ghost ring (screen-constant offset above the ring top)
        const gg = ctx.svg('g', {}, wg);
        const t = ctx.svg('text', { x: 0, y: -14, 'text-anchor': 'middle', fill: C.muted2, style: mono(20, 500) + `; ${halo}; stroke-width: 6px`, text: 'LAST SEEN 0:20' }, gg);
        gg.name = t; gg.anchor = [1060, 618]; el.labels.lastSeen = gg; screenLabels.push({ g: gg, x: 1060, y: 618 });
      } else {
        el.labels.lastSeen = ctx.svg('text', { x: 1092, y: 684, fill: C.muted2, style: mono(10, 500), text: 'LAST SEEN 0:20' }, wg);
      }
      if (screenLabels.length) {
        ctx.onFrame(() => {
          const k = 1 / (S * Math.min(T.state.zoom, o.zoomCap || 2.4));
          for (const L of screenLabels) L.g.setAttribute('transform', `translate(${L.x} ${L.y}) scale(${k.toFixed(5)})`);
        });
      }
    }

    function reveal(at, opts) {
      opts = Object.assign({ terrain: true }, opts || {});
      const tl = ctx.tl;
      if (opts.terrain) tl.fromTo(T.state, { reveal: 0, revealX: P.gate[0], revealY: P.gate[1] }, { reveal: 1, duration: 1.6, ease: 'power2.inOut' }, at);
      tl.fromTo([el.pump, el.gate, el.crossing], { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'none', stagger: 0.12 }, at + 0.6);
      tl.fromTo(el.conduit, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'none' }, at + 0.9);
      tl.fromTo(progress, { v: 0 }, { v: progress.v, duration: 1.0, ease: 'power3.out' }, at + 1.0);
      tl.fromTo(el.ringTrack, { opacity: 0 }, { opacity: 1, duration: 0.3 }, at + 0.9);
      tl.fromTo(Object.values(el.tokens).map((t) => t.inner), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.45, ease: 'back.out(2)', stagger: 0.1 }, at + 1.1);
      tl.fromTo(el.cone, { opacity: 0 }, { opacity: 1, duration: 0.5 }, at + 1.5);
      tl.fromTo([...el.vega, el.ghost], { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.12 }, at + 1.7);
      if (o.labels) tl.fromTo([...Object.values(el.labels)], { opacity: 0 }, { opacity: 1, duration: 0.35, stagger: 0.06 }, at + 1.2);
      tl.fromTo(el.fog, { opacity: 0 }, { opacity: 1, duration: 1.0 }, at + 0.5);
    }

    const toWorld = (px, py) => [(px + M) * S, (py + M) * S];
    return {
      T, svg, g, wg, P, el, progress, flow, S, M, reveal, RIVER,
      toWorld,
      toScreen: (px, py) => T.toScreen((px + M) * S, (py + M) * S),
      cam: (px, py, zoom) => ({ cx: (px + M) * S, cy: (py + M) * S, zoom }),
    };
  }

  // ---------------------------------------------------------------------------------------
  // UI chrome (DOM), sized for 1920x1080 (the product shot is 2000x1250; we scale its CSS x1.35
  // so text stays >= 20 px on video). Every piece is absolutely positioned; tweak o.layout.
  // ---------------------------------------------------------------------------------------
  const CSS_ONCE = { done: false };
  function css() {
    if (CSS_ONCE.done) return; CSS_ONCE.done = true;
    const st = document.createElement('style');
    st.textContent = `
      .fg-ui { position:absolute; inset:0; font-family: var(--display); color: ${C.ink}; }
      .fg-ui .mono { font-family: var(--mono); text-transform: uppercase; letter-spacing: .1em; }
      .fg-ui .panel { position:absolute; box-sizing:border-box; background: rgba(13,12,10,.93); border: 1px solid rgba(255,255,255,.09); border-radius: 18px; }
      .fg-topbar { position:absolute; left:48px; top:34px; display:flex; align-items:center; gap:22px; }
      .fg-topbar strong { font: 650 34px/1 var(--display); letter-spacing:-.03em; }
      .fg-topbar i { width:1px; height:30px; background: rgba(255,255,255,.18); }
      .fg-topbar .mono { font-size: 20px; color: ${C.muted2}; }
      .fg-signal { position:absolute; right:48px; top:42px; display:flex; align-items:center; gap:12px; font: 500 20px/1 var(--display); color: ${C.muted2}; }
      .fg-signal i { width:10px; height:10px; border-radius:50%; background: ${C.ok}; }
      .fg-score { position:absolute; left:50%; top:22px; transform: translateX(-50%); display:flex; border:1px solid rgba(255,255,255,.09); border-radius:16px; overflow:hidden; background: rgba(13,12,10,.93); }
      .fg-score .team { display:flex; align-items:center; gap:14px; padding: 14px 26px; font: 600 26px/1 var(--display); }
      .fg-score .team b { font: 600 32px/1 var(--mono); }
      .fg-score .atlas { color:${C.amber}; box-shadow: inset 0 -3px 0 ${C.amber}; }
      .fg-score .vega { color:${C.rival}; box-shadow: inset 0 -3px 0 ${C.rival}; }
      .fg-score .clock { display:grid; place-items:center; padding: 8px 28px; border-inline: 1px solid rgba(255,255,255,.09); }
      .fg-score .clock span { font: 500 15px/1 var(--mono); letter-spacing:.1em; color:${C.muted2}; }
      .fg-score .clock strong { margin-top:5px; font: 600 28px/1 var(--mono); }
      .fg-roster { left:44px; top:150px; width:470px; padding: 28px 30px; }
      .fg-roster h2, .fg-channel h2 { margin:0; display:flex; justify-content:space-between; align-items:center; font: 600 24px/1 var(--display); }
      .fg-roster h2 span, .fg-channel h2 span { font: 500 16px/1 var(--mono); letter-spacing:.1em; color:${C.muted2}; text-transform:uppercase; }
      .fg-member { display:grid; grid-template-columns: 54px 1fr auto; gap: 16px; align-items:center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,.07); }
      .fg-avatar { display:grid; place-items:center; width:54px; height:54px; border-radius:13px; background: rgba(239,189,112,.12); border: 1px solid rgba(239,189,112,.4); color:${C.amber}; font: 600 17px/1 var(--mono); }
      .fg-member strong { display:block; font: 600 22px/1.15 var(--display); }
      .fg-member small { display:block; font: 500 19px/1.3 var(--display); color:${C.muted2}; }
      .fg-state { font: 600 15px/1 var(--mono); letter-spacing:.08em; text-transform:uppercase; padding: 8px 11px; border-radius: 8px; background: rgba(255,255,255,.06); color:${C.ink}; }
      .fg-state.busy { background: rgba(239,189,112,.16); color:${C.amber}; }
      .fg-channel { right:44px; top:150px; width:560px; padding: 28px 30px; }
      .fg-msg { margin-top: 20px; font: 500 21px/1.42 var(--display); }
      .fg-msg b { font-weight: 650; margin-right: 10px; }
      .fg-msg small { font: 500 15px/1 var(--mono); color:${C.muted2}; letter-spacing:.06em; }
      .fg-msg p { margin: 4px 0 0; color: #d8d1c5; }
      .fg-pinned { margin-top: 24px; padding: 18px 22px; border: 1px solid rgba(239,189,112,.36); border-radius: 13px; background: rgba(239,189,112,.06); }
      .fg-pinned .mono { font-size: 15px; color:${C.amber}; }
      .fg-pinned strong { display:block; margin-top: 8px; font: 650 24px/1.2 var(--display); }
      .fg-pinned small { display:block; margin-top: 6px; font: 500 19px/1.2 var(--display); color:${C.muted2}; }
      .fg-compose { display:flex; justify-content:space-between; align-items:center; margin-top: 20px; padding: 15px 20px; border: 1px solid rgba(255,255,255,.08); border-radius: 13px; font: 500 20px/1 var(--display); color:${C.muted2}; }
      .fg-objective { left:50%; bottom: 30px; transform: translateX(-50%); width: 760px; padding: 24px 30px; }
      .fg-objective .row { display:flex; justify-content:space-between; align-items:baseline; }
      .fg-objective .mono { font-size: 16px; color:${C.muted2}; }
      .fg-objective strong { font: 650 26px/1.1 var(--display); }
      .fg-objective b { font: 600 24px/1 var(--mono); color:${C.amber}; }
      .fg-bar { position:relative; height: 8px; margin-top: 16px; border-radius: 4px; background: rgba(255,255,255,.08); overflow:hidden; }
      .fg-bar i { position:absolute; left:0; top:0; bottom:0; width:62%; border-radius:4px; background:${C.amber}; }
      .fg-warn { display:flex; align-items:center; gap: 10px; margin-top: 16px; font: 500 19px/1 var(--display); color: ${C.rivalLight}; }
      .fg-warn i { width: 9px; height: 9px; border-radius: 50%; background: ${C.rival}; }

      /* Film-safe layout (storyboard s01 build notes): title-safe positions, every mono >= 20 px.
         Panel text columns start at x 114 (inset 84 + padding 30); the topbar/signal sit at 132 so the
         HUD corners (inset 72, snapping to 80 in s02) never touch them. Panels never use transforms,
         so offset-based measuring (LIFT) gives their true rest positions. */
      .fg-ui.fg-film .fg-topbar { left:132px; top:66px; gap:20px; }
      .fg-ui.fg-film .fg-topbar strong { font-size:30px; }
      .fg-ui.fg-film .fg-topbar i { height:26px; }
      .fg-ui.fg-film .fg-signal { right:132px; top:71px; }
      .fg-ui.fg-film .panel { background: rgba(13,12,10,.955); }
      .fg-ui.fg-film .fg-score { top:50px; left:auto; transform:none; }
      .fg-ui.fg-film .fg-score .team { padding: 14px 26px; box-sizing:border-box; white-space:nowrap; overflow:hidden; }
      .fg-ui.fg-film .fg-score .team b { font-size:30px; }
      .fg-ui.fg-film .fg-score .clock { padding: 9px 28px 10px; }
      .fg-ui.fg-film .fg-score .clock span { font-size:20px; letter-spacing:.12em; }
      .fg-ui.fg-film .fg-score .clock strong { margin-top:8px; }
      .fg-ui.fg-film .fg-roster { left:84px; top:168px; width:440px; }
      .fg-ui.fg-film .fg-channel { right:84px; top:168px; width:470px; }
      .fg-ui.fg-film .fg-roster h2 span, .fg-ui.fg-film .fg-channel h2 span { font-size:20px; }
      .fg-ui.fg-film .fg-avatar { font-size:20px; }
      .fg-ui.fg-film .fg-member small { font-size:20px; }
      .fg-ui.fg-film .fg-state { font-size:20px; padding: 8px 10px; }
      .fg-ui.fg-film .fg-msg { margin-top:18px; }
      .fg-ui.fg-film .fg-msg small { font-size:20px; }
      .fg-ui.fg-film .fg-pinned .mono { font-size:20px; }
      .fg-ui.fg-film .fg-pinned small { font-size:20px; }
      .fg-ui.fg-film .fg-objective { left:710px; bottom:64px; width:500px; transform:none; padding: 22px 28px; }
      .fg-ui.fg-film .fg-objective .mono { font-size:20px; }
      .fg-ui.fg-film .fg-warn { font-size:20px; }
    `;
    document.head.appendChild(st);
  }

  /**
   * o.parent, o.clockFrom (seconds), o.clockAt, o.clockRun (false = static text; drive it yourself),
   * o.messages (default product messages), o.progress (proxy shared with world.progress),
   * o.layout ('film' = film-safe layout)
   */
  function ui(ctx, o) {
    css();
    o = Object.assign({ round: 'ROUND 2', score: [1, 1], clockFrom: 8 * 60 + 14, clockAt: 0, clockRun: true, layout: null }, o || {});
    const root = ctx.el('div', 'fg-ui' + (o.layout === 'film' ? ' fg-film' : ''), o.parent);
    const topbar = ctx.el('div', 'fg-topbar', root, `<strong>Floodgate</strong><i></i><span class="mono">Team challenge · 3 v 3</span>`);
    const signal = ctx.el('div', 'fg-signal', root, `<i></i>All players connected`);
    const fmt0 = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const score = ctx.el('div', 'fg-score', root, `<div class="team atlas">Atlas <b class="sa">${o.score[0]}</b></div><div class="clock"><span>${o.round}</span><strong class="ck">${fmt0(o.clockFrom)}</strong></div><div class="team vega"><b class="sv">${o.score[1]}</b> Vega</div>`);
    const clockEl = score.querySelector('.ck');
    if (o.clockRun) {
      B.bindText(ctx, clockEl, (lt) => fmt0(Math.max(0, Math.floor(o.clockFrom - Math.max(0, lt - o.clockAt)))));
    }
    const members = [['JK', 'Jules', 'Coordination', 'Moving', ''], ['NC', 'Nora', 'Power systems', 'Restoring', 'busy'], ['EK', 'Emre', 'Crossing', 'Holding', '']];
    const roster = ctx.el('div', 'panel fg-roster', root, `<h2>Atlas <span>Your team</span></h2>` + members.map((m) =>
      `<div class="fg-member"><span class="fg-avatar">${m[0]}</span><div><strong>${m[1]}</strong><small>${m[2]}</small></div><span class="fg-state ${m[4]}">${m[3]}</span></div>`).join(''));
    const msgs = o.messages || [['Jules', '08:31', 'Nora, take the pump station. Emre, watch the crossing.'], ['Nora', '08:26', 'On it. Call if they commit to the route.'], ['Emre', '08:19', 'Two of them by the crossing. Holding the approach.']];
    const channel = ctx.el('div', 'panel fg-channel', root, `<h2>Team channel <span>Atlas only</span></h2>` + msgs.map((m) =>
      `<div class="fg-msg"><b>${m[0]}</b><small>${m[1]}</small><p>${m[2]}</p></div>`).join('') +
      `<div class="fg-pinned"><span class="mono">Plan agreed</span><strong>Restore gate power first</strong><small>3 roles assigned</small></div><div class="fg-compose">Message your team<span></span></div>`);
    const prog = o.progress || { v: 0.62 };
    const objective = ctx.el('div', 'panel fg-objective', root, `<div class="row"><span class="mono">Objective 2 of 3</span><b class="pc">62%</b></div><div class="row" style="margin-top:8px"><strong>Restore gate power</strong></div><div class="fg-bar"><i></i></div><div class="fg-warn"><i></i>Vega is contesting the crossing</div>`);
    const pc = objective.querySelector('.pc'), barI = objective.querySelector('.fg-bar i');
    ctx.onFrame(() => { const v = Math.round(Math.max(0, Math.min(1, prog.v)) * 100); const s = v + '%'; if (pc.textContent !== s) pc.textContent = s; barI.style.width = v + '%'; });
    const warn = objective.querySelector('.fg-warn');
    const msgEls = Array.from(channel.querySelectorAll('.fg-msg'));
    const memberEls = Array.from(roster.querySelectorAll('.fg-member'));

    const api = {
      root, topbar, signal, score, clockEl, roster, channel, objective, warn, msgEls, memberEls, progress: prog,
      pinned: channel.querySelector('.fg-pinned'), compose: channel.querySelector('.fg-compose'),
      chips: memberEls.map((m) => m.querySelector('.fg-state')), pct: pc, bar: barI,
      /** panels slide/fade in, functional speed */
      enter(at, which) {
        const list = which || [topbar, score, signal, roster, channel, objective];
        list.forEach((e, i) => {
          const dy = e === objective ? 30 : e === topbar || e === score || e === signal ? -20 : 0;
          const dx = e === roster ? -40 : e === channel ? 40 : 0;
          ctx.tl.fromTo(e, { opacity: 0, x: dx, y: dy }, { opacity: 1, x: 0, y: 0, duration: 0.45, ease: B.E.ui }, at + i * 0.08);
        });
        return api;
      },
      /** reveal chat messages one by one (each with a type-on of its text) */
      typeMessages(at, gap, list) {
        (list || msgEls).forEach((m, i) => {
          const p = m.querySelector('p'); const full = p.textContent;
          const t0 = at + i * (gap || 1.0);
          ctx.tl.fromTo(m, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, ease: B.E.ui }, t0);
          const pr = { n: 0 };
          ctx.tl.fromTo(pr, { n: 0 }, { n: full.length, duration: Math.min(0.9, full.length * 0.018), ease: 'none' }, t0 + 0.1);
          B.bindText(ctx, p, () => full.slice(0, Math.round(pr.n)));
        });
        return api;
      },
      /** set a member state label (e.g. 'Holding' -> 'Moving') at a time */
      setState(i, at, text, busy) {
        const st = memberEls[i].querySelector('.fg-state');
        const before = st.textContent;
        B.bindText(ctx, st, (lt) => (lt >= at ? text : before));
        const wasBusy = st.classList.contains('busy');
        if (busy != null) ctx.onFrame((lt) => st.classList.toggle('busy', lt >= at ? !!busy : wasBusy));
        return api;
      },
    };
    return api;
  }

  window.Floodgate = { world, ui, RIVER, RIVER_EXT, PAL, bakes: BAKES };
})();
