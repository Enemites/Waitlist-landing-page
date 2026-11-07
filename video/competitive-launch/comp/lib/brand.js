/* Realms Competitive film: shared motion design system.
 *
 * Loaded after gsap + core.js (see comp/index.html). Every scene uses these pieces so the film
 * reads as one system: the same terrain, the same overlay marks, the same type moves, the same
 * transitions. All helpers follow the engine rules: motion lives on ctx.tl (tweens on proxies)
 * or in ctx.onFrame (pure functions of time). Nothing here reads the clock or Math.random.
 *
 *   Brand.C / Brand.BEAT / Brand.BAR / Brand.E          palette, tempo, eases
 *   Brand.terrain(ctx, o)        living topographic world (cached contours + camera + light)
 *   Brand.hud(ctx, o)            register corners, edge ticks, slug + timecode (the overlay system)
 *   Brand.eyebrow(ctx, o)        diamond + scrambled mono label
 *   Brand.headline(ctx, o)       masked word reveal, amber turn line, beat offsets, exit
 *   Brand.chapter(ctx, o)        "01 / Form your team" chapter card
 *   Brand.label(ctx, o)          small scrambled mono label anywhere (HUD text)
 *   Brand.mark(ctx, o)           the Enemites mark as 5 separate vector bars (slide or draw-on)
 *   Brand.lockup(ctx, o)         mark + "Realms" + COMPETITIVE
 *   Brand.banner(ctx, o)         Atlas (amber, diamond) / Vega (red-orange, ring) pennants that sway
 *   Brand.token / Brand.cross / Brand.rivalToken / Brand.objective   board marks (SVG)
 *   Brand.archive(ctx, o)        framed, graded archival sequence window with caption
 *   Brand.flood(ctx, o)          signature "rising water" transition (clips the incoming scene)
 *   Brand.iris(ctx, o)           circle iris from a point, ring riding the edge
 *   Brand.whip(ctx, o)           horizontal whip with directional blur
 *   Brand.bindText(ctx, el, fn)  set textContent from a pure function of local time
 *   Brand.counter(ctx, o)        split-flap style stepping number / clock
 *   Brand.ease helpers, Brand.route(...) dashed route draw with arrowhead
 */
(function () {
  'use strict';
  const W = 1920, H = 1080;
  const C = {
    bg: '#0b0c0e', bg2: '#0d0d0e', bg3: '#101012', warm: '#121110', map: '#0f0d0a',
    amber: '#efbd70', amberLight: '#f6d39f', amberSoft: '#f4cc8d', amberDeep: '#a37a42', amberLine: '#5a472f', amberDark: '#3a3127',
    rival: '#dd6248', rivalDeep: '#c9503a', rivalLight: '#f0a08f',
    bone: '#c9c0b2', bone2: '#a79e90', ink: '#f2eee7', ink2: '#eee5d7',
    muted: '#b8afa2', muted2: '#a89f92', muted3: '#a89a85', ok: '#7fd38a',
  };
  const BPM = 120, BEAT = 0.5, BAR = 2.0;
  const E = { enter: 'expo.out', exit: 'power2.in', camera: 'power3.inOut', whip: 'expo.inOut', ui: 'power3.out', hud: 'none' };
  const SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/';
  const SLANT = 34; // degrees: the lean of the Enemites mark bars, used for diagonal splits

  const U = () => Film.utils;
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const rgba = (c, a) => { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const gauss = (x, y, cx, cy, s, a) => a * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));
  function distToPath(x, y, pts) {
    let best = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    return best;
  }
  let uid = 0;
  const nid = (p) => `${p}-${++uid}`;

  // ---------------------------------------------------------------------------------------
  // Film-wide overlay: fine animated grain + soft vignette above every scene.
  // ---------------------------------------------------------------------------------------
  (function installOverlay() {
    const root = Film.overlayRoot();
    const vig = document.createElement('div');
    Object.assign(vig.style, { position: 'absolute', inset: '0', zIndex: '50000', background: 'radial-gradient(125% 100% at 50% 50%, rgba(0,0,0,0) 55%, rgba(4,4,5,.42) 100%)' });
    root.appendChild(vig);
    const cv = document.createElement('canvas');
    cv.width = W / 2; cv.height = H / 2;
    Object.assign(cv.style, { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px', mixBlendMode: 'overlay', opacity: '0.5', zIndex: '50001' });
    root.appendChild(cv);
    const g = cv.getContext('2d');
    const TILE = 256, N = 6;
    const r = Film.utils.rng('grain');
    const tiles = [];
    for (let k = 0; k < N; k++) {
      const t = document.createElement('canvas'); t.width = TILE; t.height = TILE;
      const tg = t.getContext('2d'); const img = tg.createImageData(TILE, TILE);
      for (let i = 0; i < TILE * TILE; i++) {
        const v = clamp(128 + r.gauss() * 34, 0, 255);
        img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
      }
      tg.putImageData(img, 0, 0);
      tiles.push(g.createPattern(t, 'repeat'));
    }
    Film.overlay((t) => {
      const f = Math.floor(Math.round(t * Film.fps) / 2); // grain changes on twos (filmic, and kinder to the encoder)
      const k = f % N;
      const ox = (f * 97) % TILE, oy = (f * 61) % TILE;
      g.setTransform(1, 0, 0, 1, -ox, -oy);
      g.fillStyle = tiles[k];
      g.fillRect(ox, oy, cv.width, cv.height);
    });
  })();

  // ---------------------------------------------------------------------------------------
  // Terrain: a heightfield drawn as a tinted topographic map, rendered once to offscreen
  // canvases (base + bright contour layer), then shown through a camera every frame.
  //   state: cx, cy (world point at screen centre), zoom, rot (deg), alpha, reveal (0-1),
  //          revealX/revealY (world), light (0-1 global brightening), pulse (0-1 ring progress),
  //          pulseX/pulseY/pulseR, flood (0-1 rising waterline reveal)
  //   spots: [{ x, y, r, a }] world-space light pools (a can be tweened; objects are live)
  // ---------------------------------------------------------------------------------------
  function defaultHeight(o) {
    const n = U().noise2D(o.seed || 'realms');
    const sc = o.scale || 0.0013;
    return (x, y) => {
      let h = n.fbm(x * sc, y * sc, 5) * 0.9 + n.fbm(x * sc * 3.1 + 40, y * sc * 3.1 - 13, 3) * 0.12;
      if (o.hills) for (const k of o.hills) h += gauss(x, y, k[0], k[1], k[2], k[3]);
      if (o.river) {
        const d = distToPath(x, y, o.river.pts);
        h -= (o.river.depth || 0.55) * Math.exp(-(d * d) / (2 * (o.river.width || 60) ** 2));
      }
      return h;
    };
  }

  function terrain(ctx, o) {
    o = Object.assign({ seed: 'realms', w: 2400, h: 1350, cell: 5, step: 0.052, sea: null, tint: true, palette: 'amber', className: '' }, o || {});
    const height = o.height || defaultHeight(o);
    const WW = o.w, WH = o.h, cell = o.cell;
    const cols = Math.ceil(WW / cell) + 1, rows = Math.ceil(WH / cell) + 1;
    const field = new Float32Array(cols * rows);
    let lo = Infinity, hi = -Infinity;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const v = height(c * cell, r * cell); field[r * cols + c] = v; if (v < lo) lo = v; if (v > hi) hi = v;
    }
    const pal = typeof o.palette === 'object' ? Object.assign({ line: C.amber, bright: C.amberLight, low: '#0e0d0b', high: '#1c1712', water: '#0a0a0b' }, o.palette) : o.palette === 'rival'
      ? { line: C.rival, bright: C.rivalLight, low: '#100b0a', high: '#1d1210', water: '#0a0909' }
      : o.palette === 'bone'
        ? { line: C.bone, bright: C.ink, low: '#0e0e0e', high: '#191816', water: '#09090a' }
        : { line: C.amber, bright: C.amberLight, low: '#0e0d0b', high: '#1c1712', water: '#0a0a0b' };
    const sea = o.sea;
    const levels = [];
    const base0 = sea != null ? sea : Math.ceil(lo / o.step) * o.step;
    for (let v = base0 - Math.floor((base0 - lo) / o.step) * o.step; v < hi; v += o.step) levels.push(+v.toFixed(5));

    function strokeLevels(g, filter, style) {
      levels.forEach((v, k) => {
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
    // base layer: tint bands + faint contours
    const base = mk(WW, WH); const bg = base.getContext('2d'); bg.scale(RES, RES);
    bg.fillStyle = C.map; bg.fillRect(0, 0, WW, WH);
    if (o.tint) {
      const img = new ImageData(cols, rows);
      const L = hexRgb(pal.low), Hh = hexRgb(pal.high), Wt = hexRgb(pal.water);
      for (let i = 0; i < field.length; i++) {
        const v = field[i];
        let rgb;
        if (sea != null && v < sea) rgb = pal.waterShallow ? (() => { const S2 = hexRgb(pal.waterShallow); const tt = clamp(1 + (v - sea) / 0.35, 0, 1); return [0, 1, 2].map((j) => Math.round(Wt[j] + (S2[j] - Wt[j]) * tt)); })() : Wt;
        else { const tt = sea != null ? clamp((Math.floor((v - sea) / o.step) * o.step) / 0.7, 0, 1) : clamp((Math.floor((v - lo) / o.step) * o.step) / (hi - lo), 0, 1); rgb = [0, 1, 2].map((j) => Math.round(L[j] + (Hh[j] - L[j]) * tt)); }
        img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = 255;
      }
      const small = document.createElement('canvas'); small.width = cols; small.height = rows;
      small.getContext('2d').putImageData(img, 0, 0);
      bg.imageSmoothingEnabled = true; bg.drawImage(small, 0, 0, cols * cell, rows * cell);
    }
    bg.lineJoin = 'round'; bg.lineCap = 'round';
    strokeLevels(bg, () => true, (g, isIndex, under, coast) => {
      if (coast) { g.strokeStyle = pal.coast || rgba(pal.line, 0.55); g.lineWidth = 1.6; }
      else if (under) { g.strokeStyle = pal.seaLine || rgba(pal.line, 0.07); g.lineWidth = 0.9; }
      else { g.strokeStyle = rgba(pal.line, isIndex ? 0.31 : 0.17); g.lineWidth = isIndex ? 1.7 : 1.05; }
    });
    // bright layer: contours only, full strength (shown through light pools / pulse rings)
    const bright = mk(WW, WH); const brg = bright.getContext('2d'); brg.scale(RES, RES);
    brg.lineJoin = 'round'; brg.lineCap = 'round';
    strokeLevels(brg, (i, under) => !under, (g, isIndex, under, coast) => {
      g.strokeStyle = rgba(pal.bright, isIndex || coast ? 0.95 : 0.6); g.lineWidth = isIndex || coast ? 2.0 : 1.3;
    });

    const { canvas, g } = ctx.canvas({ className: ('terrain ' + o.className).trim(), parent: o.parent });
    const scratch = document.createElement('canvas'); scratch.width = W; scratch.height = H;
    const sg = scratch.getContext('2d');
    const state = Object.assign({ cx: WW / 2, cy: WH / 2, zoom: 1, rot: 0, alpha: 1, reveal: 1, revealX: WW / 2, revealY: WH / 2, revealSoft: 420,
      light: 0, pulse: 0, pulseX: WW / 2, pulseY: WH / 2, pulseR: 900, flood: 1, floodAmp: 22 }, o.state || {});
    const spots = o.spots || [];
    const bound = [];
    const floodNoise = U().noise2D((o.seed || 'realms') + ':flood');

    function camMatrix() {
      const z = state.zoom, a = state.rot * Math.PI / 180, cs = Math.cos(a) * z, sn = Math.sin(a) * z;
      // screen = R*S*(world - c) + centre
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
      // light: pools + pulse ring + global, through the bright layer
      const anyLight = state.light > 0.001 || state.pulse > 0.001 && state.pulse < 0.999 || spots.some((s) => (s.a == null ? 1 : s.a) > 0.001);
      if (anyLight) {
        sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, W, H);
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
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.drawImage(scratch, 0, 0);
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      // reveal (radial from a world point) and flood (rising waterline)
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
      canvas, state, spots, world: { w: WW, h: WH }, height: (x, y) => height(x, y), field, toScreen, svgTransform,
      /** SVG <g> whose children are in world coordinates; follows the camera every frame. */
      group(svgParent, attrs) { const gg = ctx.svg('g', attrs || {}, svgParent); bound.push(gg); return gg; },
      bind(gEl) { bound.push(gEl); return gEl; },
      /** tween the camera on ctx.tl */
      move(at, dur, to, ease) { ctx.tl.to(state, Object.assign({ duration: dur, ease: ease || E.camera }, to), at); return this; },
    };
  }

  // ---------------------------------------------------------------------------------------
  // HUD: the overlay system (register corners, edge ticks, slug, timecode).
  // ---------------------------------------------------------------------------------------
  function hud(ctx, o) {
    o = Object.assign({ at: 0, inset: 64, arm: 34, color: C.amber, ticks: true, slug: '', right: null, tc: true, out: null, parent: undefined, drawIn: true, alpha: 0.8 }, o || {});
    const sv = ctx.svg('svg', { class: 'brand-hud' }, o.parent);
    const I = o.inset, A = o.arm;
    const corners = [[I, I, 1, 1], [W - I, I, -1, 1], [I, H - I, 1, -1], [W - I, H - I, -1, -1]].map(([x, y, sx, sy]) =>
      ctx.svg('path', { d: `M${x} ${y + A * sy} L${x} ${y} L${x + A * sx} ${y}`, stroke: o.color, 'stroke-width': 2, fill: 'none', 'stroke-opacity': o.alpha, 'stroke-linecap': 'square' }, sv));
    const ticks = [];
    if (o.ticks) {
      for (let i = 1; i < 12; i++) {
        const x = I + (W - 2 * I) * i / 12;
        ticks.push(ctx.svg('line', { x1: x, y1: I - 6, x2: x, y2: I + (i % 3 === 0 ? 8 : 3), stroke: o.color, 'stroke-opacity': 0.35, 'stroke-width': 1 }, sv));
        ticks.push(ctx.svg('line', { x1: x, y1: H - I + 6, x2: x, y2: H - I - (i % 3 === 0 ? 8 : 3), stroke: o.color, 'stroke-opacity': 0.35, 'stroke-width': 1 }, sv));
      }
      for (let j = 1; j < 8; j++) {
        const y = I + (H - 2 * I) * j / 8;
        ticks.push(ctx.svg('line', { x1: I - 6, y1: y, x2: I + 3, y2: y, stroke: o.color, 'stroke-opacity': 0.35, 'stroke-width': 1 }, sv));
        ticks.push(ctx.svg('line', { x1: W - I + 6, y1: y, x2: W - I - 3, y2: y, stroke: o.color, 'stroke-opacity': 0.35, 'stroke-width': 1 }, sv));
      }
    }
    const slugEl = o.slug ? label(ctx, { text: o.slug, x: I + 2, y: H - I + 22, at: o.at + 0.2, size: 20, color: C.muted3, parent: o.parent }) : null;
    let tcEl = null;
    if (o.tc || o.right) {
      tcEl = ctx.el('div', 'brand-label', o.parent, '');
      Object.assign(tcEl.style, { position: 'absolute', right: (I - 2) + 'px', top: (H - I + 22) + 'px', font: '500 20px/1 var(--mono)', letterSpacing: '.12em', color: C.amber, textTransform: 'uppercase', whiteSpace: 'pre', opacity: 0 });
      ctx.tl.to(tcEl, { opacity: 1, duration: 0.3, ease: 'none' }, o.at + 0.3);
      ctx.onFrame((lt, gt) => {
        if (typeof o.right === 'function') { tcEl.textContent = o.right(lt, gt); return; }
        if (typeof o.right === 'string') { tcEl.textContent = o.right; return; }
        const f = Math.round(gt * 30); const s = Math.floor(f / 30), ff = f % 30;
        tcEl.textContent = `REC  00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
      });
    }
    if (o.drawIn) {
      ctx.tl.from(corners, { drawSVG: '0%', duration: 0.6, ease: 'power3.out', stagger: 0.06 }, o.at);
      if (ticks.length) ctx.tl.from(ticks, { opacity: 0, duration: 0.25, ease: 'none', stagger: { each: 0.008, from: 'start' } }, o.at + 0.15);
      // keep hidden before `at`
      if (o.at > 0) ctx.tl.fromTo(sv, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: 'none' }, o.at);
    }
    if (o.out != null) ctx.tl.to([sv, slugEl, tcEl].filter(Boolean), { opacity: 0, duration: 0.3, ease: 'none' }, o.out);
    return { svg: sv, corners, ticks, slug: slugEl, tc: tcEl };
  }

  // ---------------------------------------------------------------------------------------
  // Type
  // ---------------------------------------------------------------------------------------
  function scrambleTo(tl, elm, text, at, dur, chars) {
    tl.to(elm, { duration: dur != null ? dur : Math.max(0.35, Math.min(1.1, text.length * 0.045)), ease: 'none', scrambleText: { text, chars: chars || SCRAMBLE, revealDelay: 0.2, speed: 0.8 } }, at);
  }

  /** Small mono label. o: text, x, y, at, size (>=18), color, align ('left'|'right'|'center'), out, parent, scramble (default true) */
  function label(ctx, o) {
    o = Object.assign({ size: 20, color: C.muted, align: 'left', scramble: true, weight: 500, tracking: '.12em' }, o);
    const elx = ctx.el('div', 'brand-label', o.parent, o.scramble ? '' : o.text);
    Object.assign(elx.style, { position: 'absolute', top: o.y + 'px', font: `${o.weight} ${o.size}px/1 var(--mono)`, letterSpacing: o.tracking, color: o.color, textTransform: 'uppercase', whiteSpace: 'pre' });
    if (o.align === 'right') elx.style.right = (W - o.x) + 'px';
    else if (o.align === 'center') { elx.style.left = o.x + 'px'; elx.style.transform = 'translateX(-50%)'; }
    else elx.style.left = o.x + 'px';
    if (o.scramble) scrambleTo(ctx.tl, elx, String(o.text).toUpperCase(), o.at || 0, o.dur);
    else if (o.at) ctx.tl.fromTo(elx, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' }, o.at);
    if (o.out != null) ctx.tl.to(elx, { opacity: 0, duration: 0.2, ease: 'none' }, o.out);
    return elx;
  }

  /** Diamond + scrambled mono eyebrow. o: text, x, y, at, color, size (22), out, parent */
  function eyebrow(ctx, o) {
    o = Object.assign({ size: 22, color: C.amber, at: 0 }, o);
    const wrap = ctx.el('div', 'brand-eyebrow', o.parent, '<span class="dia"></span><span class="txt"></span>');
    Object.assign(wrap.style, { position: 'absolute', left: o.x + 'px', top: o.y + 'px', display: 'flex', alignItems: 'center', gap: Math.round(o.size * 0.7) + 'px',
      font: `500 ${o.size}px/1 var(--mono)`, letterSpacing: '.13em', textTransform: 'uppercase', color: o.color, whiteSpace: 'pre' });
    const dia = wrap.querySelector('.dia');
    Object.assign(dia.style, { width: Math.round(o.size * 0.5) + 'px', height: Math.round(o.size * 0.5) + 'px', background: o.color, transform: 'rotate(45deg)', flex: 'none' });
    const txt = wrap.querySelector('.txt');
    ctx.tl.fromTo(dia, { scale: 0, rotation: -90 }, { scale: 1, rotation: 45, duration: 0.5, ease: 'back.out(2)' }, o.at);
    scrambleTo(ctx.tl, txt, String(o.text).toUpperCase(), o.at + 0.05, o.dur);
    if (o.out != null) ctx.tl.to(wrap, { opacity: 0, duration: 0.25, ease: 'none' }, o.out);
    return wrap;
  }

  /**
   * Headline: lines in masks, words rise with expo.out; accent lines (amber) enter one beat later.
   * o: lines [str], x, y, size (136), at, accent [indices] (default [1]), lineDelay (BEAT),
   *    wordStagger (0.07), dur (0.7), out (time) | null, outStagger, align, width, color, weight, parent, leading
   * returns { el, lines: [lineEls], words: [[wordEls]], end }  (end = time the last word settles)
   */
  function headline(ctx, o) {
    o = Object.assign({ size: 136, at: 0, accent: [1], lineDelay: BEAT, wordStagger: 0.07, dur: 0.75, out: null, align: 'left', width: 1600, color: C.ink, weight: 620, leading: 1.02, tracking: '-0.055em' }, o);
    const box = ctx.el('div', 'brand-headline', o.parent);
    Object.assign(box.style, { position: 'absolute', top: o.y + 'px', width: o.width + 'px', font: `${o.weight} ${o.size}px/${o.leading} var(--display)`, letterSpacing: o.tracking, color: o.color, textAlign: o.align });
    if (o.align === 'center') { box.style.left = (o.x - o.width / 2) + 'px'; } else if (o.align === 'right') { box.style.left = (o.x - o.width) + 'px'; } else box.style.left = o.x + 'px';
    const lineEls = [], wordEls = [];
    let tEnd = o.at;
    o.lines.forEach((txt, i) => {
      const ln = ctx.el('div', 'hl-line', box);
      Object.assign(ln.style, { overflow: 'hidden', padding: '0 0.08em 0.14em', margin: '0 -0.08em -0.14em', whiteSpace: 'nowrap' });
      if (o.accent.includes(i)) ln.style.color = o.accentColor || C.amber;
      const words = String(txt).split(' ').map((w) => { const s = ctx.el('span', 'hl-word', ln, w); s.style.display = 'inline-block'; return s; });
      // re-insert spaces between words
      for (let k = words.length - 1; k > 0; k--) ln.insertBefore(document.createTextNode(' '), words[k]);
      lineEls.push(ln); wordEls.push(words);
      const t0 = o.at + i * o.lineDelay;
      ctx.tl.fromTo(words, { yPercent: 118 }, { yPercent: 0, duration: o.dur, ease: E.enter, stagger: o.wordStagger }, t0);
      tEnd = Math.max(tEnd, t0 + o.dur + o.wordStagger * (words.length - 1));
    });
    if (o.out != null) {
      lineEls.forEach((ln, i) => ctx.tl.to(wordEls[i], { yPercent: -118, duration: 0.32, ease: E.exit, stagger: 0.025 }, o.out + i * (o.outStagger != null ? o.outStagger : 0.1)));
    }
    return { el: box, lines: lineEls, words: wordEls, end: tEnd };
  }

  /** Chapter card. o: num ('01'), title, total ('03'), x, y, at, out, parent, size */
  function chapter(ctx, o) {
    o = Object.assign({ x: 132, y: 760, at: 0, size: 112, total: '03' }, o);
    const sv = ctx.svg('svg', { class: 'brand-chapter-rule' }, o.parent);
    const rule = ctx.svg('line', { x1: o.x, y1: o.y - 34, x2: o.x + 760, y2: o.y - 34, stroke: C.amber, 'stroke-width': 2, 'stroke-opacity': 0.9 }, sv);
    const tick = ctx.svg('rect', { x: o.x, y: o.y - 40, width: 12, height: 12, fill: C.amber, transform: `rotate(45 ${o.x + 6} ${o.y - 34})` }, sv);
    const num = ctx.el('div', 'brand-chapter-num', o.parent, '');
    Object.assign(num.style, { position: 'absolute', left: o.x + 'px', top: (o.y - 96) + 'px', font: '600 30px/1 var(--mono)', letterSpacing: '.12em', color: C.amber, whiteSpace: 'pre' });
    const step = label(ctx, { text: `STEP ${o.num} / ${o.total}`, x: o.x + 760, y: o.y - 96 + 6, align: 'right', at: o.at + 0.25, size: 20, color: C.muted, parent: o.parent });
    ctx.tl.fromTo(rule, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease: E.whip }, o.at);
    ctx.tl.fromTo(tick, { scale: 0, svgOrigin: `${o.x + 6} ${o.y - 34}` }, { scale: 1, svgOrigin: `${o.x + 6} ${o.y - 34}`, duration: 0.4, ease: 'back.out(2.5)' }, o.at);
    scrambleTo(ctx.tl, num, o.num, o.at + 0.1, 0.4, '0123456789');
    const head = headline(ctx, { lines: [o.title], x: o.x - 4, y: o.y - 10, size: o.size, at: o.at + 0.2, accent: o.accent || [], out: o.out, parent: o.parent });
    if (o.out != null) ctx.tl.to([sv, num, step], { opacity: 0, duration: 0.3, ease: 'none' }, o.out);
    return { rule, num, head, svg: sv };
  }

  /** textContent from a pure function of time: fn(localT, globalT) -> string */
  function bindText(ctx, elm, fn) { ctx.onFrame((lt, gt) => { const s = fn(lt, gt); if (elm.textContent !== s) elm.textContent = s; }); return elm; }

  /** Stepping counter: o.el, from, to, at, dur, fmt(v) -> string, steps (int, default |to-from|) */
  function counter(ctx, o) {
    const proxy = { v: o.from };
    const n = o.steps || Math.max(1, Math.round(Math.abs(o.to - o.from)));
    ctx.tl.to(proxy, { v: o.to, duration: o.dur, ease: o.ease || `steps(${n})` }, o.at);
    const fmt = o.fmt || ((v) => String(Math.round(v)));
    return bindText(ctx, o.el, () => fmt(proxy.v));
  }

  // ---------------------------------------------------------------------------------------
  // Mark + lockup
  // ---------------------------------------------------------------------------------------
  const MARK_BARS = [
    { cx: 252.5, cy: 41.1, d: 'M86.1 82.6 L177.8 18.1 L194.0 7.6 L212.3 2.3 L221.0 1.9 L414.9 2.0 L415.7 2.2 L344.5 61.5 L336.3 69.6 L319.2 78.4 L304.6 81.7 L121.1 81.5 L86.1 82.6Z' },
    { cx: 487.6, cy: 40.6, d: 'M512.3 81.0 L398.3 79.1 L397.9 78.7 L473.4 7.9 L479.7 3.7 L486.5 2.1 L570.0 2.0 L570.3 2.6 L525.5 68.6 L521.5 75.8 L517.8 79.1 L512.3 81.0Z' },
    { cx: 168.8, cy: 162.4, d: 'M300.6 120.3 L232.4 182.1 L225.0 189.8 L214.6 197.1 L201.3 202.4 L192.0 203.9 L35.0 204.8 L34.1 204.7 L118.8 138.2 L130.2 129.0 L144.0 122.5 L152.0 120.3 L157.5 119.6 L299.6 119.5 L300.6 120.3Z' },
    { cx: 411.4, cy: 228.6, d: 'M364.7 207.0 L281.0 205.8 L280.2 205.7 L279.8 205.2 L373.2 124.7 L380.4 120.4 L387.0 119.0 L550.6 118.9 L551.3 119.7 L505.6 180.4 L485.6 207.3 L385.0 380.4 L370.8 394.4 L268.1 419.0 L267.7 418.6 L366.9 213.6 L367.7 210.4 L366.0 207.3 L364.7 207.0Z' },
    { cx: 136.0, cy: 281.4, d: 'M263.0 239.6 L250.0 252.8 L190.5 312.8 L185.5 316.4 L178.8 318.8 L175.0 319.6 L5.0 320.6 L4.1 320.0 L6.8 317.8 L92.1 251.4 L101.1 244.2 L104.5 242.1 L108.9 240.4 L118.4 238.4 L125.0 237.9 L262.0 237.9 L263.0 239.6Z' },
  ];
  /** o: x, y (top-left), h (height px, default 160), color, at, style ('slide'|'draw'|'none'), parent (svg or undefined) */
  function mark(ctx, o) {
    o = Object.assign({ x: 0, y: 0, h: 160, color: C.ink, at: 0, style: 'slide', stagger: 0.07 }, o);
    const s = o.h / 420;
    const sv = o.parent && o.parent.namespaceURI === 'http://www.w3.org/2000/svg' ? o.parent : ctx.svg('svg', { class: 'brand-mark' }, o.parent);
    const gg = ctx.svg('g', { transform: `translate(${o.x} ${o.y}) scale(${s})` }, sv);
    const bars = MARK_BARS.map((b) => ctx.svg('path', { d: b.d, fill: o.color }, gg));
    const order = [2, 4, 0, 1, 3]; // left bars first, then the top-right flag, then the stem
    const seq = order.map((i) => bars[i]);
    if (o.style === 'slide') {
      // each bar travels in along the mark's slant from the lower left
      ctx.tl.fromTo(seq, { x: -90, y: 48, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.7, ease: E.enter, stagger: o.stagger }, o.at);
    } else if (o.style === 'draw') {
      bars.forEach((b) => { b.setAttribute('stroke', o.color); b.setAttribute('stroke-width', 3 / s); b.setAttribute('fill-opacity', 0); });
      ctx.tl.fromTo(seq, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: o.stagger }, o.at);
      ctx.tl.to(seq, { attr: { 'fill-opacity': 1, 'stroke-opacity': 0 }, duration: 0.35, ease: 'none', stagger: o.stagger }, o.at + 0.75);
    }
    return { svg: sv, g: gg, bars, seq, width: 572 * s, height: o.h };
  }

  /** "Realms" wordmark + COMPETITIVE. o: x, y (centre), scale (1 = 150px wordmark), at, align 'center' */
  function lockup(ctx, o) {
    o = Object.assign({ x: W / 2, y: H / 2, scale: 1, at: 0, parent: undefined, mode: 'COMPETITIVE' }, o);
    const sc = o.scale;
    const wrap = ctx.el('div', 'brand-lockup', o.parent);
    Object.assign(wrap.style, { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px' });
    const markH = 118 * sc;
    const wordSize = 150 * sc;
    // measure the wordmark: Manrope 640 at -0.05em, "Realms" ~ 2.95em wide
    const wordW = wordSize * 3.02;
    const gap = 44 * sc;
    const total = 572 * (markH / 420) + gap + wordW;
    const left = o.x - total / 2;
    const m = mark(ctx, { x: left, y: o.y - markH * 0.58, h: markH, color: C.ink, at: o.at, parent: wrap });
    const word = ctx.el('div', 'brand-word', wrap, '');
    Object.assign(word.style, { position: 'absolute', left: (left + m.width + gap) + 'px', top: (o.y - wordSize * 0.62) + 'px', font: `640 ${wordSize}px/1 var(--display)`, letterSpacing: '-0.05em', color: C.ink, overflow: 'hidden', padding: '0 .05em .12em', whiteSpace: 'nowrap' });
    const inner = ctx.el('span', '', word, 'Realms'); inner.style.display = 'inline-block';
    ctx.tl.fromTo(inner, { yPercent: 115 }, { yPercent: 0, duration: 0.9, ease: E.enter }, o.at + 0.2);
    const modeEl = label(ctx, { text: o.mode, x: o.x, y: o.y + wordSize * 0.56, align: 'center', at: o.at + 0.7, size: Math.max(20, Math.round(30 * sc)), color: C.amber, parent: wrap, tracking: '.42em', weight: 600 });
    return { el: wrap, mark: m, word, inner, mode: modeEl };
  }

  // ---------------------------------------------------------------------------------------
  // Banners: Atlas (amber, diamond emblem) and Vega (red-orange, ring emblem). Cloth sways.
  // o: side 'atlas'|'vega', x (pole x), y (pole top), h (cloth height, 420), w (cloth width, 190),
  //    at (drop-in time), sway (amplitude px, 10), parent (svg or undefined), flip (cloth to the left)
  // ---------------------------------------------------------------------------------------
  function banner(ctx, o) {
    o = Object.assign({ side: 'atlas', x: 400, y: 200, h: 420, w: 190, at: 0, sway: 10, flip: false, label: true }, o);
    const col = o.side === 'vega' ? C.rival : C.amber;
    const deep = o.side === 'vega' ? C.rivalDeep : C.amberDeep;
    const sv = o.parent && o.parent.namespaceURI === 'http://www.w3.org/2000/svg' ? o.parent : ctx.svg('svg', { class: 'brand-banner' }, o.parent);
    const gg = ctx.svg('g', {}, sv);
    const id = nid('bn');
    const pole = ctx.svg('line', { x1: o.x, y1: o.y - 30, x2: o.x, y2: o.y + o.h + 160, stroke: C.bone, 'stroke-width': 3, 'stroke-linecap': 'round' }, gg);
    const finial = ctx.svg('circle', { cx: o.x, cy: o.y - 36, r: 7, fill: C.bone }, gg);
    const cdefs = ctx.svg('defs', {}, gg);
    const clip = ctx.svg('clipPath', { id: id + '-clip' }, cdefs);
    const clipP = ctx.svg('path', {}, clip);
    const clothG = ctx.svg('g', { 'clip-path': `url(#${id}-clip)` }, gg);
    const cloth = ctx.svg('path', { fill: col }, clothG);
    const shade = ctx.svg('path', { fill: deep, 'fill-opacity': 0.55 }, clothG);
    const emblem = ctx.svg('g', {}, clothG);
    const ex = o.x + (o.flip ? -1 : 1) * o.w / 2, ey = o.y + o.h * 0.36;
    if (o.side === 'vega') {
      ctx.svg('circle', { cx: 0, cy: 0, r: o.w * 0.2, fill: 'none', stroke: C.bg, 'stroke-width': o.w * 0.075 }, emblem);
    } else {
      ctx.svg('rect', { x: -o.w * 0.15, y: -o.w * 0.15, width: o.w * 0.3, height: o.w * 0.3, fill: C.bg, transform: 'rotate(45)' }, emblem);
    }
    const nameEl = o.label ? ctx.svg('text', { x: 0, y: o.w * 0.62, 'text-anchor': 'middle', fill: C.bg, style: `font: 700 ${Math.round(o.w * 0.12)}px var(--mono); letter-spacing: .18em`, text: o.side === 'vega' ? 'VEGA' : 'ATLAS' }, emblem) : null;
    const sd = o.flip ? -1 : 1;
    const N = 14;
    const proxy = { drop: 1, sway: o.sway };
    function clothPath(t, k) {
      // left edge on the pole; the free edge and the swallowtail ripple with a travelling wave
      const pts = [];
      const amp = proxy.sway, ph = t * 2.2 + (o.side === 'vega' ? 1.7 : 0);
      const h = o.h * (1 - proxy.drop);
      const wave = (u, v) => amp * u * Math.sin(ph + u * 3.1 + v * 2.2);
      for (let i = 0; i <= N; i++) { const u = i / N; pts.push([o.x + sd * u * o.w, o.y + wave(u, 0) * 0.4]); }
      const notch = o.h * 0.16;
      for (let j = 1; j <= N; j++) { const v = j / N; pts.push([o.x + sd * o.w + sd * wave(1, v) * 0.35, o.y + v * h + wave(1, v)]); }
      pts.push([o.x + sd * o.w * 0.5 + sd * wave(0.5, 1) * 0.3, o.y + h - notch * (1 - proxy.drop) + wave(0.5, 1)]);
      for (let j = N; j >= 0; j--) { const v = j / N; pts.push([o.x, o.y + v * h]); }
      return pts;
    }
    const toD = (pts) => 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + 'Z';
    ctx.onFrame((lt) => {
      const pts = clothPath(lt);
      const dd = toD(pts);
      cloth.setAttribute('d', dd); clipP.setAttribute('d', dd);
      clothG.style.display = proxy.drop > 0.985 ? 'none' : '';
      // a shading fold along the travelling wave
      const fold = pts.slice(0, N + 1).map((p, i) => [p[0], p[1]]);
      const u0 = 0.55 + 0.1 * Math.sin(lt * 2.2), uu = Math.round(u0 * N);
      const top = pts[uu], bot = [pts[uu][0], o.y + o.h * (1 - proxy.drop) + 4];
      shade.setAttribute('d', `M${top[0].toFixed(1)} ${top[1].toFixed(1)} L${(top[0] + sd * o.w * 0.18).toFixed(1)} ${top[1].toFixed(1)} L${(bot[0] + sd * o.w * 0.12).toFixed(1)} ${bot[1].toFixed(1)} L${bot[0].toFixed(1)} ${bot[1].toFixed(1)}Z`);
      shade.setAttribute('fill-opacity', (0.28 + 0.12 * Math.sin(lt * 2.2 + 1)).toFixed(3));
      const ew = proxy.sway * 0.5 * Math.sin(lt * 2.2 + 1.6);
      emblem.setAttribute('transform', `translate(${(ex + sd * ew * 0.4).toFixed(1)} ${(ey + ew * 0.6).toFixed(1)})`);
      emblem.setAttribute('opacity', String(clamp(1 - proxy.drop * 1.6, 0, 1)));
      void fold;
    });
    // drop in: the cloth unrolls from the top bar
    proxy.drop = 1;
    ctx.tl.to(proxy, { drop: 0, duration: 0.85, ease: 'power4.out' }, o.at);
    ctx.tl.fromTo([pole, finial], { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, Math.max(0, o.at - 0.15));
    return { svg: sv, g: gg, cloth, emblem, proxy, pole };
  }

  // ---------------------------------------------------------------------------------------
  // Board marks (SVG): our numbered tokens, opposition crosses, rival triangles, objective
  // ---------------------------------------------------------------------------------------
  function token(ctx, parent, o) {
    o = Object.assign({ x: 0, y: 0, n: '1', r: 18, color: C.amber }, o);
    const g = ctx.svg('g', { transform: `translate(${o.x} ${o.y})` }, parent);
    const halo = ctx.svg('circle', { r: o.r + 10, fill: 'none', stroke: o.color, 'stroke-opacity': 0.35, 'stroke-width': 1.5 }, g);
    const disc = ctx.svg('circle', { r: o.r, fill: C.bg, stroke: o.color, 'stroke-width': 2.2 }, g);
    const tx = ctx.svg('text', { y: o.r * 0.33, 'text-anchor': 'middle', fill: o.color, style: `font: 700 ${Math.round(o.r * 0.9)}px var(--mono)`, text: o.n }, g);
    return { g, halo, disc, text: tx };
  }
  function cross(ctx, parent, o) {
    o = Object.assign({ x: 0, y: 0, s: 10, color: C.bone, w: 2.6 }, o);
    const g = ctx.svg('g', { transform: `translate(${o.x} ${o.y})` }, parent);
    ctx.svg('path', { d: `M${-o.s} ${-o.s} L${o.s} ${o.s} M${o.s} ${-o.s} L${-o.s} ${o.s}`, stroke: o.color, 'stroke-width': o.w, 'stroke-linecap': 'round' }, g);
    return g;
  }
  function rivalToken(ctx, parent, o) {
    o = Object.assign({ x: 0, y: 0, s: 15, ghost: false }, o);
    const g = ctx.svg('g', { transform: `translate(${o.x} ${o.y})` }, parent);
    ctx.svg('path', { d: `M0 ${-o.s} L${o.s * 0.92} ${o.s * 0.62} L${-o.s * 0.92} ${o.s * 0.62}Z`, fill: o.ghost ? 'none' : C.rival, stroke: C.rival, 'stroke-width': o.ghost ? 1.8 : 0, 'stroke-dasharray': o.ghost ? '4 4' : null }, g);
    return g;
  }
  /** objective ring with a dashed outer ring and pulse rings. returns { g, ring, outer, core, pulse(at, n) } */
  function objective(ctx, parent, o) {
    o = Object.assign({ x: 0, y: 0, r: 26, color: C.amber }, o);
    const g = ctx.svg('g', { transform: `translate(${o.x} ${o.y})` }, parent);
    const outer = ctx.svg('circle', { r: o.r * 1.75, fill: 'none', stroke: o.color, 'stroke-width': 1.5, 'stroke-dasharray': '4 7', 'stroke-opacity': 0.8 }, g);
    const ring = ctx.svg('circle', { r: o.r, fill: rgba(o.color, 0.08), stroke: o.color, 'stroke-width': 2.2 }, g);
    const core = ctx.svg('circle', { r: o.r * 0.23, fill: o.color }, g);
    return {
      g, ring, outer, core,
      /** n pulse rings from `at`, `gap` s apart; drawn as a pure function of time */
      pulse(at, n, gap, dur) {
        n = n || 2; gap = gap != null ? gap : 0.5; dur = dur || 1.5;
        for (let i = 0; i < n; i++) {
          const p = ctx.svg('circle', { r: o.r, fill: 'none', stroke: C.amberLight, 'stroke-width': 1.6, opacity: 0 }, g);
          const t0 = at + i * gap;
          ctx.onFrame((lt) => {
            const u = (lt - t0) / dur;
            if (u < 0 || u > 1) { p.setAttribute('opacity', '0'); return; }
            const e = 1 - Math.pow(1 - u, 2.2);
            p.setAttribute('r', (o.r * (1 + 2.5 * e)).toFixed(2));
            p.setAttribute('opacity', (0.65 * (1 - u)).toFixed(3));
          });
        }
      },
      spin(at, dur) { ctx.tl.fromTo(outer, { rotation: 0, svgOrigin: '0 0' }, { rotation: 90 * dur / 3, svgOrigin: '0 0', duration: dur, ease: 'none' }, at); },
      pop(at) { ctx.tl.fromTo([ring, core], { attr: { r: 0 } }, { attr: { r: (i) => (i === 0 ? o.r : o.r * 0.23) }, duration: 0.55, ease: 'back.out(1.8)', stagger: 0.06 }, at);
        ctx.tl.fromTo(outer, { attr: { r: 0 }, opacity: 0 }, { attr: { r: o.r * 1.75 }, opacity: 1, duration: 0.8, ease: E.enter }, at + 0.08); },
    };
  }

  /**
   * Dashed route with an arrowhead riding the tip (one active route at a time).
   * o: d (path), at, dur, color, width (3), dash ('10 8'), parent (svg), ease, arrow (true), solid (false)
   */
  function route(ctx, parent, o) {
    o = Object.assign({ at: 0, dur: 1.2, color: C.amber, width: 3, dash: '10 8', ease: 'power2.inOut', arrow: true, solid: false }, o);
    const id = nid('route');
    const defs = ctx.svg('defs', {}, parent);
    const mask = ctx.svg('mask', { id, maskUnits: 'userSpaceOnUse', x: -4000, y: -4000, width: 12000, height: 12000 }, defs);
    const mp = ctx.svg('path', { d: o.d, fill: 'none', stroke: '#fff', 'stroke-width': o.width * 6, 'stroke-linecap': 'round' }, mask);
    const line = ctx.svg('path', { d: o.d, fill: 'none', stroke: o.color, 'stroke-width': o.width, 'stroke-dasharray': o.solid ? null : o.dash, 'stroke-linecap': 'round', mask: `url(#${id})` }, parent);
    const guide = ctx.svg('path', { d: o.d, fill: 'none', stroke: 'none' }, parent);
    let arrow = null;
    ctx.tl.fromTo(mp, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: o.dur, ease: o.ease }, o.at);
    if (o.arrow) {
      const a = o.width * 4.6;
      arrow = ctx.svg('path', { d: `M${-a} ${-a * 0.68} L0 0 L${-a} ${a * 0.68}`, fill: 'none', stroke: o.color, 'stroke-width': o.width + 0.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, parent);
      ctx.tl.fromTo(arrow, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: 'none' }, o.at);
      ctx.tl.fromTo(arrow, { motionPath: { path: guide, autoRotate: true, start: 0, end: 0 } }, { duration: o.dur, ease: o.ease, motionPath: { path: guide, autoRotate: true, start: 0, end: 1 } }, o.at);
    }
    return { line, mask: mp, arrow, guide };
  }

  // ---------------------------------------------------------------------------------------
  // Archive window: a graded image sequence inside a frame with register marks and caption.
  // o: dir (frames dir, relative to comp/), count, fps (native, e.g. 24), start (s into seq),
  //    x, y, w, h, at, out, caption, ref, push (0.05), parent, open ('wipe'|'iris'|'cut')
  // ---------------------------------------------------------------------------------------
  function archive(ctx, o) {
    o = Object.assign({ x: 360, y: 160, w: 1200, h: 680, at: 0, out: null, push: 0.05, fps: 24, start: 0, open: 'wipe', caption: '', ref: '', loop: true, align: [0.5, 0.5] }, o);
    const wrap = ctx.el('div', 'brand-archive', o.parent);
    Object.assign(wrap.style, { position: 'absolute', left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px' });
    const win = ctx.el('div', 'win', wrap);
    Object.assign(win.style, { position: 'absolute', inset: '0', overflow: 'hidden', background: C.bg, outline: `1px solid ${rgba(C.amber, 0.38)}` });
    const seq = ctx.sequence({ dir: o.dir, count: o.count, fps: o.fps, start: o.start, loop: o.loop, fit: 'cover', width: o.w, height: o.h, parent: win, align: o.align });
    // gate weave: +-1 px, changes on the native cadence
    const r = ctx.rng('weave:' + o.dir);
    const weave = Array.from({ length: 64 }, () => [Math.round(r.range(-1.2, 1.2)), Math.round(r.range(-1.2, 1.2))]);
    const pushP = { s: 1 + o.push };
    ctx.tl.to(pushP, { s: 1, duration: Math.max(1, (o.out != null ? o.out : ctx.duration) - o.at + 0.5), ease: 'power1.out' }, o.at);
    ctx.onFrame((lt) => {
      const k = Math.floor(lt * o.fps) % weave.length;
      seq.style.transform = `translate(${weave[k][0]}px, ${weave[k][1]}px) scale(${pushP.s.toFixed(5)})`;
    });
    const bar = ctx.el('div', 'bar', wrap);
    Object.assign(bar.style, { position: 'absolute', top: '0', bottom: '0', left: '0', width: '6px', background: C.amber, opacity: 0 });
    const sv = ctx.svg('svg', { width: o.w + 80, height: o.h + 80, viewBox: `-40 -40 ${o.w + 80} ${o.h + 80}`, style: 'position:absolute;left:-40px;top:-40px;overflow:visible' }, wrap);
    const A = 22, P = 14;
    const marks = [[-P, -P, 1, 1], [o.w + P, -P, -1, 1], [-P, o.h + P, 1, -1], [o.w + P, o.h + P, -1, -1]].map(([x, y, sx, sy]) =>
      ctx.svg('path', { d: `M${x} ${y + A * sy} L${x} ${y} L${x + A * sx} ${y}`, stroke: C.amber, 'stroke-width': 2, fill: 'none' }, sv));
    const cap = o.caption ? label(ctx, { text: o.caption, x: 0, y: o.h + 22, at: o.at + 0.35, size: 20, color: C.muted, parent: wrap }) : null;
    if (cap) { cap.style.left = '0px'; }
    const refEl = o.ref ? label(ctx, { text: o.ref, x: o.w, y: o.h + 22, at: o.at + 0.45, size: 20, color: C.amber, parent: wrap, align: 'left' }) : null;
    if (refEl) { refEl.style.left = 'auto'; refEl.style.right = '0px'; }
    // open
    if (o.open === 'wipe') {
      ctx.tl.fromTo(win, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: E.whip }, o.at);
      ctx.tl.fromTo(bar, { x: 0 }, { x: o.w - 6, duration: 0.6, ease: E.whip }, o.at);
      ctx.tl.fromTo(bar, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: 'none' }, o.at);
      ctx.tl.to(bar, { opacity: 0, duration: 0.2, ease: 'none' }, o.at + 0.55);
    } else if (o.open === 'iris') {
      ctx.tl.fromTo(win, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 0.7, ease: 'power4.inOut' }, o.at);
    } else {
      ctx.tl.fromTo(win, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: 'none' }, o.at);
    }
    ctx.tl.fromTo(marks, { opacity: 0, scale: 1.25, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.45, ease: E.enter, stagger: 0.04 }, o.at + 0.1);
    if (o.out != null) {
      ctx.tl.to(win, { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.45, ease: 'power3.in' }, o.out);
      ctx.tl.to([marks, cap, refEl].flat().filter(Boolean), { opacity: 0, duration: 0.25, ease: 'none' }, o.out + 0.1);
    }
    return { el: wrap, win, seq, marks, caption: cap, ref: refEl };
  }

  // ---------------------------------------------------------------------------------------
  // Transitions
  // ---------------------------------------------------------------------------------------
  /**
   * Rising water: the target (default the scene root) is revealed from the bottom under a
   * noisy waterline with an amber edge. o: at, dur (1.0), target, amp (26), edge (true),
   * dir ('up'|'down'), ease
   */
  function flood(ctx, o) {
    o = Object.assign({ at: 0, dur: 1.0, target: ctx.root, amp: 26, edge: true, dir: 'up', ease: 'power3.inOut', color: C.amber }, o);
    const p = { v: 0 };
    ctx.tl.fromTo(p, { v: 0 }, { v: 1, duration: o.dur, ease: o.ease }, o.at);
    const nz = U().noise2D('flood:' + ctx.id);
    const sv = o.edge ? ctx.svg('svg', { class: 'brand-flood-edge', style: 'z-index: 9000' }, o.target) : null;
    const line = sv ? ctx.svg('polyline', { fill: 'none', stroke: o.color, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, sv) : null;
    const glow = sv ? ctx.svg('polyline', { fill: 'none', stroke: o.color, 'stroke-width': 10, 'stroke-opacity': 0.18, 'stroke-linejoin': 'round' }, sv) : null;
    ctx.onFrame((lt) => {
      const v = lt < o.at ? 0 : p.v;
      if (v >= 0.999) { o.target.style.clipPath = ''; if (sv) sv.style.display = 'none'; return; }
      const span = H + o.amp * 4 + 40;
      const yb = o.dir === 'up' ? H + o.amp * 2 + 20 - v * span : -o.amp * 2 - 20 + v * span;
      const pts = [];
      const amp = o.amp * (0.5 + 0.5 * Math.sin(Math.PI * v));
      for (let x = 0; x <= W; x += 32) {
        const y = yb + amp * (0.65 * nz(x * 0.0021, lt * 0.6) + 0.35 * Math.sin(x * 0.006 + lt * 3.2));
        pts.push([x, y]);
      }
      const poly = o.dir === 'up'
        ? pts.map((q) => `${q[0]}px ${(q[1] - 3).toFixed(1)}px`).join(',') + `,${W}px ${H + 10}px,0px ${H + 10}px`
        : `0px -10px,${W}px -10px,` + pts.slice().reverse().map((q) => `${q[0]}px ${(q[1] + 3).toFixed(1)}px`).join(',');
      o.target.style.clipPath = v <= 0.001 ? 'inset(100% 0 0 0)' : `polygon(${poly})`;
      if (sv) {
        sv.style.display = v <= 0.001 ? 'none' : '';
        const s = pts.map((q) => q[0] + ',' + q[1].toFixed(1)).join(' ');
        line.setAttribute('points', s); glow.setAttribute('points', s);
      }
    });
    return { proxy: p, edge: sv };
  }

  /** Iris from a point: o: at, dur (0.8), x, y, target, ring (true), from (40), to (diag) */
  function iris(ctx, o) {
    o = Object.assign({ at: 0, dur: 0.8, x: W / 2, y: H / 2, target: ctx.root, ring: true, from: 30, to: Math.hypot(W, H), ease: 'power4.inOut', color: C.amber }, o);
    const p = { r: o.from };
    ctx.tl.fromTo(p, { r: o.from }, { r: o.to, duration: o.dur, ease: o.ease }, o.at);
    const sv = o.ring ? ctx.svg('svg', { class: 'brand-iris', style: 'z-index: 9000' }, o.target) : null;
    const ring = sv ? ctx.svg('circle', { cx: o.x, cy: o.y, r: o.from, fill: 'none', stroke: o.color, 'stroke-width': 2.5 }, sv) : null;
    ctx.onFrame((lt) => {
      const r = lt < o.at ? o.from : p.r;
      const done = lt >= o.at + o.dur;
      o.target.style.clipPath = done ? '' : `circle(${r.toFixed(1)}px at ${o.x}px ${o.y}px)`;
      if (ring) { ring.setAttribute('r', r.toFixed(1)); ring.setAttribute('stroke-opacity', String(clamp(1 - (lt - o.at) / o.dur, 0, 1))); sv.style.display = done ? 'none' : ''; }
    });
    return { proxy: p, ring };
  }

  /** Whip: moves the target horizontally with directional blur. o: at, dur (0.3), dir (-1 left), mode ('out'|'in'), target */
  let whipN = 0;
  function whip(ctx, o) {
    o = Object.assign({ at: 0, dur: 0.3, dir: -1, mode: 'out', target: ctx.root, dist: W }, o);
    const id = 'whip-' + ctx.id + '-' + (++whipN);
    const sv = ctx.svg('svg', { class: 'brand-whip', width: 0, height: 0 });
    const f = ctx.svg('filter', { id, x: '-20%', y: '0%', width: '140%', height: '100%', 'color-interpolation-filters': 'sRGB' }, ctx.svg('defs', {}, sv));
    const blur = ctx.svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '0 0' }, f);
    const p = { x: o.mode === 'out' ? 0 : -o.dir * o.dist };
    const to = o.mode === 'out' ? o.dir * o.dist : 0;
    ctx.tl.fromTo(p, { x: p.x }, { x: to, duration: o.dur, ease: o.mode === 'out' ? 'expo.in' : 'expo.out' }, o.at);
    let prev = null;
    ctx.onFrame((lt) => {
      const active = o.mode === 'out' ? lt >= o.at : lt < o.at + o.dur;
      const x = o.mode === 'out' ? (lt < o.at ? 0 : p.x) : (lt < o.at ? -o.dir * o.dist : p.x);
      // velocity estimate from the analytic ease: sample the proxy is not possible without state, so use distance-based blur
      const k = o.mode === 'out' ? Math.abs(x) / o.dist : 1 - Math.abs(x) / o.dist;
      const v = o.mode === 'out' ? k : 1 - k;
      const sd = active ? Math.min(60, 140 * Math.sin(Math.PI * clamp(Math.abs(x) / o.dist, 0, 1)) + 0) : 0;
      o.target.style.transform = active && Math.abs(x) > 0.01 ? `translateX(${x.toFixed(1)}px)` : '';
      blur.setAttribute('stdDeviation', `${sd.toFixed(1)} 0`);
      o.target.style.filter = active && sd > 0.5 ? `url(#${id})` : '';
      void v; void prev;
    });
    return { proxy: p };
  }

  // ---------------------------------------------------------------------------------------
  // UI primitives (match the Floodgate screen composition: design/screen-compositions/competitive.html)
  // ---------------------------------------------------------------------------------------
  function panel(ctx, o) {
    o = Object.assign({ x: 0, y: 0, w: 380, h: 300, radius: 14, parent: undefined, title: '', meta: '' }, o);
    const p = ctx.el('div', 'brand-panel', o.parent);
    Object.assign(p.style, { position: 'absolute', left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h != null ? o.h + 'px' : 'auto', boxSizing: 'border-box',
      background: 'rgba(13,12,10,.94)', border: '1px solid rgba(255,255,255,.09)', borderRadius: o.radius + 'px', padding: '26px 28px', color: C.ink, fontFamily: 'var(--display)' });
    if (o.title) {
      const hd = ctx.el('div', 'hd', p, `<span class="t">${o.title}</span><span class="m">${o.meta || ''}</span>`);
      Object.assign(hd.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', font: '600 22px/1.1 var(--display)', letterSpacing: '-0.02em' });
      Object.assign(hd.querySelector('.m').style, { font: '500 16px/1 var(--mono)', letterSpacing: '.08em', color: C.muted2, textTransform: 'uppercase' });
    }
    return p;
  }

  window.Brand = {
    C, BPM, BEAT, BAR, E, SCRAMBLE, SLANT, W, H,
    rgba, clamp, lerp, smooth, gauss, distToPath,
    terrain, hud, label, eyebrow, headline, chapter, bindText, counter, scrambleTo,
    mark, lockup, banner, token, cross, rivalToken, objective, route, archive,
    flood, iris, whip, panel, MARK_BARS,
    /** beats/bars to seconds */
    b: (n) => n * BEAT, bar: (n) => n * BAR,
  };
})();
