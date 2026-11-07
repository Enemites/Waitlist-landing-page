/* s04-hinge-title: film 12.0-16.0 s (4 s, bars 7.1-9.1). Hard NODE MATCH CUT from the 1904 bow
 * back to the 1943 filter-centre table; markers 2 and 3 join the node; the RISING-WATER FLOOD
 * (ContourFlood, t 0 -> 1, 12.5-14.0) replaces the table with the Floodgate world along its
 * contour lines while the odometer rolls 1943 -> 08:32; the window opens to full frame on
 * OVERVIEW and the title lands on 14.0 (bar 8.1): Enemites mark + 'Enemites', 'Realms',
 * COMPETITIVE / TEAM AGAINST TEAM. Ends as a cut on 16.0 into s05's identical OVERVIEW world.
 * Local 0 = film 12.0.
 */
(function () {
  'use strict';
  const ID = 's04-hinge-title';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const S = 1.5;
  const WIN = { x: 440, y: 150, w: 1040, h: 780 };
  const FULL = { x: 0, y: 0, w: W, h: H };
  const HUDR = { x: 72, y: 72, w: W - 144, h: H - 144 };           // Brand.hud({ inset: 72 }) corners
  // the film's ONE world: Floodgate.world with the shared margin-240 bake and film type sizes
  // (world = (product + margin) x scale); camera presets from the shared kit
  const MARGIN = 240;
  const CAMP = (window.Match && Match.CAM) || { WINDOW: { x: 800, y: 520, zoom: 0.56 }, OVERVIEW: { x: 820, y: 510, zoom: 0.80 } };
  const camW = (c) => ({ cx: (c.x + MARGIN) * S, cy: (c.y + MARGIN) * S, zoom: c.zoom });
  const CAM_WINDOW = camW(CAMP.WINDOW), CAM_OVERVIEW = camW(CAMP.OVERVIEW);
  const JK_W = [(380 + MARGIN) * S, (320 + MARGIN) * S];             // JK's place on hill A (world)
  const FR = '../.work/frames/';
  const PUSH = 0.03;
  const TABLE = { dir: FR + 'warroom-filter-map-overhead', count: 84, fps: 30, src: [960, 720], rect: WIN, align: [0.5, 0.5], at: 0, pushDur: 2.5 };
  const tableT = (lt) => 1.0 + 0.75 * lt;   // frames 1.0-2.5 s of the clip at 0.75x, held frames
  // s03's last frame (film 11.967): the node on our bow in the 1904 plate (same model as s03)
  const CREWS = { dir: FR + 'sport-two-crews-1904-hc', fps: 24, src: [1440, 1080], rect: { x: 320, y: 130, w: 1280, h: 800 }, align: [0.5, 1.0], at: 6.0, pushDur: 2.0 };
  const BOW_LAST = [1186, 948];
  // table plaques (source px): the node's marker, and the two markers that join it
  const MARK_NODE = { 31: [371, 412], 40: [373, 415], 84: [373, 416] };
  const MARK_2 = [505, 528], MARK_3 = [265, 312];

  Film.scene({
    id: ID,
    duration: 4,
    async build(ctx) {
      const tl = ctx.tl, root = ctx.root;
      const clamp = B.clamp, lerp = B.lerp;
      const p1out = gsap.parseEase('power1.out'), p2o = gsap.parseEase('power2.out'), p2io = gsap.parseEase('power2.inOut');
      const expoIO = gsap.parseEase('expo.inOut'), p3io = gsap.parseEase('power3.inOut');
      const weave = (dir) => { const r = ctx.rng('weave:' + dir); return Array.from({ length: 64 }, () => [Math.round(r.range(-1.2, 1.2)), Math.round(r.range(-1.2, 1.2))]); };
      const WV = { [TABLE.dir]: weave(TABLE.dir), [CREWS.dir]: weave(CREWS.dir) };
      function plateXY(p, px, py, lt) {
        const R = p.rect, k = Math.max(R.w / p.src[0], R.h / p.src[1]);
        const fx = (R.w - p.src[0] * k) * p.align[0], fy = (R.h - p.src[1] * k) * p.align[1];
        const s = 1 + PUSH * (1 - p1out(clamp((lt - p.at) / p.pushDur, 0, 1)));
        const wt = WV[p.dir], wv = wt[((Math.floor(lt * p.fps) % 64) + 64) % 64];
        return [R.x + R.w / 2 + (fx + px * k - R.w / 2) * s + wv[0], R.y + R.h / 2 + (fy + py * k - R.h / 2) * s + wv[1]];
      }
      const S03_END = plateXY(CREWS, BOW_LAST[0], BOW_LAST[1], 8 - 1 / FPS);
      const tableFile = (lt) => 1 + Math.min(TABLE.count - 1, Math.floor(tableT(lt) * TABLE.fps + 1e-6));
      function kf(tab, f) {
        const ks = Object.keys(tab).map(Number).sort((a, b) => a - b);
        if (f <= ks[0]) return tab[ks[0]];
        for (let i = 0; i < ks.length - 1; i++) if (f <= ks[i + 1]) { const a = tab[ks[i]], b = tab[ks[i + 1]], u = (f - ks[i]) / (ks[i + 1] - ks[i]); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; }
        return tab[ks[ks.length - 1]];
      }
      const stampS = (lt, t0) => { const f = (lt - t0) * FPS; if (f < 0) return 0; if (f < 2) return 1.15 * p2o(f / 2); if (f < 4) return 1.15 - 0.15 * ((f - 2) / 2); return 1; };

      ctx.css(`
        [data-scene="${ID}"] .s04-full { position:absolute; left:0; top:0; width:${W}px; height:${H}px; }
        [data-scene="${ID}"] .s04-bg { position:absolute; inset:0; background:${C.bg}; }
        [data-scene="${ID}"] .s04-odo { position:absolute; left:${WIN.x}px; top:${WIN.y - 66}px; color:${C.ink}; }
        [data-scene="${ID}"] .s04-odo .lab { font: 500 20px/20px var(--mono); letter-spacing:.12em; color:${C.muted2}; text-transform:uppercase; white-space:pre; height:20px; }
        [data-scene="${ID}"] .s04-odo .clk, [data-scene="${ID}"] .s04-odo .txt { position:absolute; left:0; top:28px; height:32px; display:flex; font: 600 28px/32px var(--mono); white-space:pre; }
        [data-scene="${ID}"] .s04-odo .reel { position:relative; overflow:hidden; height:32px; width:1ch; }
        [data-scene="${ID}"] .s04-odo .strip { position:absolute; left:0; top:0; width:1ch; text-align:center; }
        [data-scene="${ID}"] .s04-odo .colon { overflow:hidden; height:32px; text-align:center; }
        [data-scene="${ID}"] .s04-slug { position:absolute; left:120px; top:990px; font: 500 20px/20px var(--mono); letter-spacing:.12em; color:${C.muted3}; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .s04-dim { position:absolute; inset:0; background:${C.bg}; opacity:0; }
        [data-scene="${ID}"] .s04-row { position:absolute; top:0; left:0; height:64px; display:flex; align-items:center; gap:20px; }
        [data-scene="${ID}"] .s04-row .word { font: 600 44px/1 var(--display); letter-spacing:-0.02em; color:${C.ink}; white-space:nowrap; }
        [data-scene="${ID}"] .s04-realms { position:absolute; left:0; width:${W}px; text-align:center; overflow:hidden; padding: 0 0 .1em; }
        [data-scene="${ID}"] .s04-realms span { display:inline-block; font: 620 260px/1 var(--display); letter-spacing:-0.055em; color:${C.ink}; padding: 0 .06em; }
        [data-scene="${ID}"] .s04-eye { position:absolute; display:flex; align-items:center; gap:18px; font: 500 26px/26px var(--mono); letter-spacing:.13em; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .s04-eye .dia { width:13px; height:13px; background:${C.amber}; flex:none; }
      `);

      // ---- node + camera-tracked position: registered first so it runs before the node ----
      let N = null, F = null;
      const proj = (wx, wy) => F.T.toScreen(wx, wy);
      function nodePos(lt) {
        const mark = () => { const q = kf(MARK_NODE, tableFile(lt)); return plateXY(TABLE, q[0], q[1], lt); };
        if (lt < 8 / FPS) { const u = expoIO(clamp(lt / (8 / FPS), 0, 1)), b = mark(); return [lerp(S03_END[0], b[0], u), lerp(S03_END[1], b[1], u)]; }
        if (lt < 1.25) return mark();
        const end = proj(JK_W[0], JK_W[1]);
        if (lt < 1.75) {
          // a short arc from the drowning table marker onto JK's place on the Atlas summit
          const a = (() => { const q = kf(MARK_NODE, tableFile(1.25)); return plateXY(TABLE, q[0], q[1], 1.25); })();
          const u = p3io(clamp((lt - 1.25) / 0.5, 0, 1));
          const mx = (a[0] + end[0]) / 2, my = (a[1] + end[1]) / 2, dx = end[0] - a[0], dy = end[1] - a[1], L = Math.hypot(dx, dy) || 1;
          const cx = mx + (dy / L) * 70, cy = my - (dx / L) * 70; // bow out to one side
          const x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * cx + u * u * end[0];
          const y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * cy + u * u * end[1];
          return [x, y];
        }
        return end;
      }
      ctx.onFrame((lt) => { if (N && F) { const q = nodePos(lt); N.p.x = q[0]; N.p.y = q[1]; } });

      ctx.el('div', 's04-bg', root);

      // ---- the world (underneath), clipped to the window rect; opens to full frame 1.75-2.25 ----
      const R = { u: 0 };
      tl.to(R, { u: 1, duration: 0.5, ease: 'power3.inOut' }, 1.75);
      const rectAt = (a, b) => ({ x: lerp(a.x, b.x, R.u), y: lerp(a.y, b.y, R.u), w: lerp(a.w, b.w, R.u), h: lerp(a.h, b.h, R.u) });
      const worldWrap = ctx.el('div', 's04-full', root);
      F = Floodgate.world(ctx, { scale: S, margin: MARGIN, film: true, labels: false, parent: worldWrap, state: { cx: CAM_WINDOW.cx, cy: CAM_WINDOW.cy, zoom: CAM_WINDOW.zoom } });
      F.progress.v = 0;
      [...F.el.vega, F.el.ghost, F.el.cone, ...Object.values(F.el.tokens)].forEach((e) => e.setAttribute('opacity', '0')); // the node is Atlas's only marker until s06
      tl.to(F.T.state, { cx: CAM_OVERVIEW.cx, cy: CAM_OVERVIEW.cy, zoom: CAM_OVERVIEW.zoom, duration: 0.5, ease: 'power3.inOut' }, 1.75);
      ctx.onFrame(() => {
        const r = rectAt(WIN, FULL);
        worldWrap.style.clipPath = R.u >= 0.999 ? '' : `inset(${r.y.toFixed(1)}px ${(W - r.x - r.w).toFixed(1)}px ${(H - r.y - r.h).toFixed(1)}px ${r.x.toFixed(1)}px)`;
      });

      // ---- the 1943 table on top (plus markers 2 and 3); flooded away along the contour lines ----
      const arch = ctx.el('div', 's04-full', root);
      const A = B.archive(ctx, { dir: TABLE.dir, count: TABLE.count, fps: TABLE.fps, x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, src: TABLE.src, at: 0, open: 'none', chrome: false, push: PUSH, pushDur: TABLE.pushDur, time: tableT, parent: arch });
      const msv = ctx.svg('svg', { class: 'brand-svg' }, arch);
      const mk = (n) => {
        const g = ctx.svg('g', { opacity: 0 }, msv);
        ctx.svg('circle', { r: 24, fill: 'none', stroke: C.amber, 'stroke-opacity': 0.35, 'stroke-width': 1.5 }, g);
        ctx.svg('circle', { r: 16, fill: C.amber }, g);
        ctx.svg('text', { y: 7, 'text-anchor': 'middle', fill: '#1b140a', style: 'font: 600 20px var(--mono)', text: String(n) }, g);
        return g;
      };
      const markers = [[mk(2), MARK_2, 0.25], [mk(3), MARK_3, 0.50]];
      ctx.onFrame((lt) => {
        markers.forEach(([g, q, t0]) => {
          const s = stampS(lt, t0);
          if (s <= 0) { g.setAttribute('opacity', '0'); return; }
          const xy = plateXY(TABLE, q[0], q[1], lt);
          g.setAttribute('opacity', '1');
          g.setAttribute('transform', `translate(${xy[0].toFixed(1)} ${xy[1].toFixed(1)}) scale(${s.toFixed(3)})`);
        });
        arch.style.display = lt < 2.05 ? '' : 'none';
      });
      void A;
      // FLOOD: the table keeps N' > t, t 0 -> 1 over 45 f from 0.5 (power1.inOut); the world rises out of the river
      const field = ContourFlood.worldField(F, WIN, { cam: CAM_WINDOW, step: 4 });
      const D = ContourFlood.create(ctx, { field, target: arch, keep: 'above', frontParent: root });
      D.play(0.5, 1.5, 0, 1, 'power1.inOut');

      // ---- title dim: the world drops to 14 % on the latch (14.0) ----
      const dim = ctx.el('div', 's04-dim', root);
      tl.fromTo(dim, { opacity: 0 }, { opacity: 0.86, duration: 4 / FPS, ease: 'power2.out', immediateRender: false }, 2.0);

      // ---- HUD: corners ride from the window to the frame (inset 72); ticks arrive with the frame ----
      const hudH = B.hud(ctx, { inset: 72, tc: false, drawIn: false, slug: '' });
      hudH.corners.forEach((c) => c.setAttribute('display', 'none'));
      tl.fromTo(hudH.ticks, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none', stagger: { each: 0.004, from: 'start' } }, 2.0);
      const csv = ctx.svg('svg', { class: 'brand-svg' });
      const outline = ctx.svg('rect', { fill: 'none', stroke: C.amber, 'stroke-opacity': 0.34, 'stroke-width': 1, 'shape-rendering': 'crispEdges' }, csv);
      const corners = [0, 1, 2, 3].map(() => ctx.svg('path', { fill: 'none', stroke: C.amber, 'stroke-width': 2, 'stroke-opacity': 0.8, 'stroke-linecap': 'square' }, csv));
      tl.to(outline, { opacity: 0, duration: 0.2, ease: 'none' }, 1.75);
      ctx.onFrame(() => {
        const r = rectAt(WIN, HUDR), x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.h, a = 34;
        outline.setAttribute('x', WIN.x + 0.5); outline.setAttribute('y', WIN.y + 0.5); outline.setAttribute('width', WIN.w - 1); outline.setAttribute('height', WIN.h - 1);
        [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, sx, sy], i) =>
          corners[i].setAttribute('d', `M${x.toFixed(1)} ${(y + a * sy).toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)} L${(x + a * sx).toFixed(1)} ${y.toFixed(1)}`));
      });

      // ---- THE NODE ----
      N = NodeMark.create(ctx, { x: S03_END[0], y: S03_END[1], pulses: [3.0, 3.5] });
      N.step(0);

      // ---- ODOMETER: 1943 -> 19:43 -> 08:32 ----
      const odo = ctx.el('div', 's04-odo', root);
      const lab = ctx.el('div', 'lab', odo, '');
      const clk = ctx.el('div', 'clk', odo);
      const txt = ctx.el('div', 'txt', odo, '');
      const from = [1, 9, 4, 3];
      const reels = from.map((d, i) => {
        const r = ctx.el('div', 'reel', clk);
        const strip = ctx.el('div', 'strip', r, '0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9');
        if (i === 1) ctx.el('div', 'colon', clk, ':');
        return strip;
      });
      const colonEl = clk.querySelector('.colon');
      const chW = reels[0].parentNode.getBoundingClientRect().width || 16.8;
      const STEP = [0, 2, 4, 6].map((f) => 1.5 + f / FPS); // reels step down from 13.5, 2 f apart
      ctx.onFrame((lt) => {
        reels.forEach((strip, i) => {
          const t0 = STEP[i], on = lt >= t0, v = from[i] - (on ? 1 : 0);
          const u = on ? clamp((lt - t0) / (3 / FPS), 0, 1) : 1;
          strip.style.transform = `translateY(${((-v - (on ? 0.24 * (1 - p2o(u)) : 0)) * 32).toFixed(2)}px)`;
        });
        const c = p2io(clamp((lt - 1.0) / (6 / FPS), 0, 1)); // the colon opens on 13.0
        colonEl.style.width = (chW * c).toFixed(2) + 'px'; colonEl.style.opacity = c.toFixed(3);
      });
      // scramble back in over the cut, then hand over to the reels (same glyphs, same place)
      B.scrambleTo(tl, txt, '1943', 0.0, 0.3, '0123456789');
      B.scrambleTo(tl, lab, 'ARCHIVE', 0.0, 0.3);
      tl.fromTo(clk, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: 'none' }, 0.333);
      tl.to(txt, { opacity: 0, duration: 0.001, ease: 'none' }, 0.333);
      B.scrambleTo(tl, lab, 'ROUND 2', 1.0, 0.35);
      tl.to(odo, { opacity: 0, duration: 0.3, ease: 'none' }, 2.0);

      // ---- caption + REF ----
      const cap = ctx.el('div', 'brand-label', root, 'ARCHIVE · BOAT RACE');
      Object.assign(cap.style, { position: 'absolute', left: WIN.x + 'px', top: (WIN.y + WIN.h + 22) + 'px', font: '500 20px/1 var(--mono)', letterSpacing: '.12em', color: C.muted, textTransform: 'uppercase', whiteSpace: 'pre' });
      const ref = ctx.el('div', 'brand-label', root, '<span class="w">REF\u00a0</span><span class="n">04</span>');
      const refW = ref.querySelector('.w'), refN = ref.querySelector('.n');
      Object.assign(ref.style, { position: 'absolute', right: (W - WIN.x - WIN.w) + 'px', top: (WIN.y + WIN.h + 22) + 'px', font: '500 20px/1 var(--mono)', letterSpacing: '.12em', color: C.amber, textTransform: 'uppercase', whiteSpace: 'pre' });
      B.scrambleTo(tl, cap, 'ARCHIVE · FILTER CENTRE', 0.0, 0.32);
      B.scrambleTo(tl, refN, '01', 0.0, 0.2, '0123456789');
      B.scrambleTo(tl, cap, 'FLOODGATE · TEAM CHALLENGE · 3 V 3', 1.0, 0.5);
      B.scrambleTo(tl, refN, '', 1.0, 0.2, '0123456789'); tl.to(refW, { opacity: 0, duration: 0.2, ease: 'none' }, 1.1);
      tl.to(cap, { opacity: 0, duration: 0.3, ease: 'none' }, 2.0);

      // ---- slug: regains '· INTERFACE CONCEPT' as the world returns (13.25) ----
      const slug = ctx.el('div', 's04-slug', root, 'REALMS · COMPETITIVE');
      B.scrambleTo(tl, slug, 'REALMS · COMPETITIVE · INTERFACE CONCEPT', 1.25, 0.5);

      // ---- TITLE on 14.0 ----
      const title = ctx.el('div', 's04-full', root);
      // (1) Enemites mark (logo.png, canvas source-in recolour to ink) + 'Enemites', wiped along the 27 deg stem lean
      const img = new Image(); img.src = '/public/assets/logo.png'; await img.decode();
      const MH = 64, MW = Math.round(MH * img.naturalWidth / img.naturalHeight);
      const cv = document.createElement('canvas'); cv.width = MW * 2; cv.height = MH * 2;
      const g2 = cv.getContext('2d'); g2.drawImage(img, 0, 0, cv.width, cv.height); g2.globalCompositeOperation = 'source-in'; g2.fillStyle = C.ink; g2.fillRect(0, 0, cv.width, cv.height);
      Object.assign(cv.style, { width: MW + 'px', height: MH + 'px', display: 'block', flex: 'none' });
      const row = ctx.el('div', 's04-row', title);
      row.appendChild(cv);
      const word = ctx.el('div', 'word', row, 'Enemites');
      const rw = row.getBoundingClientRect().width;
      row.style.left = Math.round(W / 2 - rw / 2) + 'px'; row.style.top = (330 - MH / 2) + 'px';
      const SL = Math.tan(27 * Math.PI / 180) * MH; // the edge leans like the mark's stems
      const wipe = { e: -SL };
      tl.fromTo(wipe, { e: -SL }, { e: rw + SL, duration: 15 / FPS, ease: 'expo.out', immediateRender: false }, 2.0);
      ctx.onFrame((lt) => {
        if (lt < 2.0) { row.style.visibility = 'hidden'; return; }
        row.style.visibility = '';
        const e = wipe.e;
        row.style.clipPath = e >= rw + SL - 0.5 ? '' : `polygon(-10px -10px, ${(e + SL / 2).toFixed(1)}px -10px, ${(e - SL / 2).toFixed(1)}px ${MH + 10}px, -10px ${MH + 10}px)`;
      });
      void word;
      // (2) 'Realms' 260 px, centred on baseline 640, rises in its mask with a 560 -> 620 weight settle
      const rm = ctx.el('div', 's04-realms', title);
      const rs = ctx.el('span', '', rm, 'Realms');
      const probe = ctx.el('span', '', rs); Object.assign(probe.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline', padding: '0' });
      const base = probe.getBoundingClientRect().top - rm.getBoundingClientRect().top; rs.removeChild(probe);
      rm.style.top = (640 - base).toFixed(1) + 'px';
      const wt = { w: 560 };
      tl.fromTo(rs, { yPercent: 112 }, { yPercent: 0, duration: 18 / FPS, ease: 'expo.out' }, 2.05);
      tl.fromTo(wt, { w: 560 }, { w: 620, duration: 24 / FPS, ease: 'power2.out', immediateRender: false }, 2.05);
      ctx.onFrame(() => { rs.style.fontWeight = String(Math.round(wt.w)); });
      // (3) eyebrow on 14.5: diamond + COMPETITIVE (amber) + / TEAM AGAINST TEAM (muted), baseline 730
      const eye = ctx.el('div', 's04-eye', title, '<span class="dia"></span><span class="a"></span><span class="m"></span>');
      const ea = eye.querySelector('.a'), em = eye.querySelector('.m'), dia = eye.querySelector('.dia');
      ea.style.color = C.amber; em.style.color = C.muted;
      ea.textContent = 'COMPETITIVE'; em.textContent = ' / TEAM AGAINST TEAM';
      const ew = eye.getBoundingClientRect().width;
      ea.textContent = ''; em.textContent = '';
      eye.style.left = Math.round(W / 2 - ew / 2) + 'px'; eye.style.top = (730 - 21) + 'px';
      tl.fromTo(dia, { scale: 0, rotation: -90 }, { scale: 1, rotation: 45, duration: 0.5, ease: 'back.out(2)' }, 2.5);
      B.scrambleTo(tl, ea, 'COMPETITIVE', 2.5, 0.36);
      B.scrambleTo(tl, em, ' / TEAM AGAINST TEAM', 2.55, 0.42);
    },
  });
})();
