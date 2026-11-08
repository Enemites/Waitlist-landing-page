/* s14-make-your-next-move (film 64-72 s, bars 33.1-37.1). Local 0 = film 64.0. The end card.
 *
 * The medallion holds through the 64.0 cut: it is rebuilt by the MEDALLION KIT (verbatim copy of s13's)
 * from the same film-time functions (camera, rotation 0.6 deg/s, pulse ring of 63.5 still expanding),
 * so the cut is invisible. THE NODE sits on the ring's 9 o'clock point (1120,540).
 *   0.00  LOCKUP: the Enemites mark (logo.png recoloured to ink, 56 px, x 120 / y 150) + 'Enemites'
 *         (Manrope 600 40 px) wipe in along the mark's 27 deg stem lean (15 f expo.out).
 *   0.25  'Realms' (Manrope 620 180 px, -0.055em) rises in its mask at baseline 400 (18 f expo.out,
 *         weight 560 -> 620).
 *   0.75  diamond + 'COMPETITIVE / TEAM AGAINST TEAM' (mono 24, .13em) scrambles in at baseline 460.
 *   2.00  'Make your' (110 px, ink) rises at baseline 640; 2.50 'next move.' (amber) at 760, lands 67.27.
 *   3.00  CTA ROW wipes in left to right (10 f power3.out): amber button 520 x 76 at (120,820), r 8,
 *         'Get match updates' + 22 px SVG arrow; 'enemites.com/realms' at x 680, centred on the button.
 *   3.00-3.60  THE BATON: the node leaves the ring at 9 o'clock and arcs (18 f power3.inOut) onto the
 *         tip of the button's arrow (ARROW_TIP, 618,858; the SVG arrow's head stops 14 px short and points
 *         into it). On the amber its disc goes solid ink, its glow is clipped to the button and its pulse
 *         ring turns ink-dark, so it reads as the arrow's light point; it pulses on 68.5, 70.0, 71.5.
 *   3.50  'IN DEVELOPMENT · PRIVATE BETA' (mono 20, muted) scrambles in at baseline 940.
 *   4.00  SONIC LOGO: the Atlas diamond pulses (68.0, D5), the Vega ring (68.25, F5), the node (68.5,
 *         A5). The archival credit line fades in at baseline 1004.
 *   4.00-8.00  hold the full end card to the last frame (no fade, no cut). The medallion keeps turning.
 * Every left-column element is aligned on its INK edge at x 120 (measured glyph bearings).
 */
(function () {
  'use strict';
  const ID = 's14-make-your-next-move';

  // ============================================================================================
  // MEDALLION KIT: identical in s13-see-whose-strategy-holds and s14-make-your-next-move (keep the
  // two copies in sync). The medallion is the ONE Floodgate world (shared margin-240 bake, res 1,
  // film marks) seen through a circular clip, in the record treatment, with the two plans drawn in
  // screen space, the summit emblems, the centre ring, the 2 px edge ring, the bezel and the pulse.
  // Every value is a pure function of FILM time (ft) and the medallion progress, so s13's last frame
  // and s14's first frame are built by the same code from the same numbers.
  // ============================================================================================
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, FPS = 30, S = 1.5, MARGIN = 240;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const EZ = {};
  const ez = (n) => EZ[n] || (EZ[n] = gsap.parseEase(n));
  const MED = { x: 1420, y: 540, r: 300 };            // the medallion on screen
  const MED_P = [800, 500];                             // valley centre (product units) on the medallion centre
  const MED_Z = 0.28;                                   // medallion zoom: both summits inside, terrain fills the disc
  const MED_R0 = 1125;                                  // iris start radius (covers the frame from the drift camera)
  const REC = { dim: 0.62, light: 0.26, mix: 0.3 };    // record treatment: tint down to 38 %, contours re-lit on top;
                                                        // the medallion mixes 30 % of the live terrain back in
  const APEX = { atlas: [380, 320], vega: [1260, 690] };
  const GATE = [800, 560], RING_R = 64;                 // the Floodgate objective ring (product units)
  const ROT0 = 62.0, ROT_RAMP = 1.5, ROT_SPEED = 0.6;   // the medallion turns 0.6 deg/s, eased in from 62.0
  const MED_PULSE = 63.5;                               // the medallion pulse ring (scale 1 -> 2.2, 45 f)
  const NODE_RING = [MED.x - MED.r, MED.y];             // THE NODE's seat on the ring (9 o'clock)
  const SLUG_TOP = 990;

  function medRot(ft) {
    const t = ft - ROT0;
    if (t <= 0) return 0;
    if (t < ROT_RAMP) return ROT_SPEED * t * t / (2 * ROT_RAMP);
    return ROT_SPEED * (ROT_RAMP / 2 + (t - ROT_RAMP));
  }
  // world camera state that puts product point P on screen point sp at zoom z, rotation rot (deg)
  function camFor(P, sp, z, rot) {
    const a = rot * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
    const dx = (sp[0] - W / 2) / z, dy = (sp[1] - H / 2) / z;
    return { cx: (P[0] + MARGIN) * S - (cs * dx + sn * dy), cy: (P[1] + MARGIN) * S - (-sn * dx + cs * dy), zoom: z, rot };
  }
  const medCam = (ft) => camFor(MED_P, [MED.x, MED.y], MED_Z, medRot(ft));
  // iris progress u (0..1, eased): zoom in log space, valley centre on a straight screen line, and a
  // clip radius locked to the world (r ~ zoom^p), so the world reads as one disc shrinking into the ring
  function irisAt(u, sp0, z0) {
    const z = Math.exp(lerp(Math.log(z0), Math.log(MED_Z), u));
    const p = Math.log(MED_R0 / MED.r) / Math.log(z0 / MED_Z);
    return { z, sp: [lerp(sp0[0], MED.x, u), lerp(sp0[1], MED.y, u)], r: u >= 1 ? MED.r : MED.r * Math.pow(z / MED_Z, p) };
  }
  // the end state (s14 holds it; s13 reaches it exactly at 63.5)
  const MED_FINAL = { rec: 1, k: 1, clip: { x: MED.x, y: MED.y, r: MED.r }, z: MED_Z, plan: 1, emblem: 1, ring: 1, bezel: 1, centre: 1, arrow: 1, emA: 1, emV: 1 };

  function setA(e, v) { if (!e) return; const s = v >= 0.999 ? '1' : v <= 0.001 ? '0' : v.toFixed(3); if (e.getAttribute('opacity') !== s) e.setAttribute('opacity', s); }
  function samplerC(d) {
    const R = Match.sampler(d, 48);
    const cum = [0];
    for (let k = 1; k < R.pts.length; k++) cum.push(cum[k - 1] + Math.hypot(R.pts[k][0] - R.pts[k - 1][0], R.pts[k][1] - R.pts[k - 1][1]));
    R.cum = cum;
    return R;
  }

  // screen-space plan (dashed, chevron at the end): matches the match kit's world routes at any zoom
  // (2.4 / 8.4-6.6 product units) and never thins below 2 px in the medallion
  function kPlan(ctx, parent, d, col) {
    const R = samplerC(d);
    const g = ctx.svg('g', {}, parent);
    const line = ctx.svg('path', { fill: 'none', stroke: col, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    const arrow = ctx.svg('path', { fill: 'none', stroke: col, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    function draw(F, z, op, as) {
      if (op <= 0.001) { g.style.display = 'none'; return; }
      g.style.display = '';
      setA(g, op);
      const k = Math.max(S * z, 0.75), w = Math.max(2.4 * S * z, 2.0);
      let dd = '';
      for (let i = 0; i < R.pts.length; i++) { const q = F.toScreen(R.pts[i][0], R.pts[i][1]); dd += (i ? 'L' : 'M') + q[0].toFixed(2) + ' ' + q[1].toFixed(2); }
      line.setAttribute('d', dd);
      line.setAttribute('stroke-width', w.toFixed(3));
      line.setAttribute('stroke-dasharray', `${(8.4 * k).toFixed(3)} ${(6.6 * k).toFixed(3)}`);
      const n = R.pts.length, a = F.toScreen(R.pts[n - 2][0], R.pts[n - 2][1]), b = F.toScreen(R.pts[n - 1][0], R.pts[n - 1][1]);
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, s = k * as;
      arrow.setAttribute('d', `M${(-8.5 * s).toFixed(2)} ${(-6 * s).toFixed(2)} L0 0 L${(-8.5 * s).toFixed(2)} ${(6 * s).toFixed(2)}`);
      arrow.setAttribute('stroke-width', (w * 1.08).toFixed(3));
      arrow.setAttribute('transform', `translate(${b[0].toFixed(2)} ${b[1].toFixed(2)}) rotate(${ang.toFixed(3)})`);
    }
    return { g, R, draw };
  }

  // the medallion. o: F (Floodgate.world), worldLayer (div holding the terrain canvas + F.svg),
  // wrap (the clip div: worldLayer + the screen-space overlay), top (unclipped svg layer)
  function kMedallion(ctx, o) {
    const F = o.F;
    // the record treatment, baked ONCE from the shared terrain bake (base dimmed + bright contours on top)
    // and drawn with the world camera on a canvas above the live terrain: one static drawImage per frame
    // (compositing the terrain's light layer every frame costs ~40 ms in software raster)
    const bk = Array.from(Floodgate.bakes.values()).find((b) => b.field === F.T.field);
    if (!bk) throw new Error(ctx.id + ': medallion needs the shared Floodgate terrain bake');
    const RES = bk.RES;
    const recBmp = document.createElement('canvas'); recBmp.width = bk.base.width; recBmp.height = bk.base.height;
    const rb = recBmp.getContext('2d');
    rb.drawImage(bk.base, 0, 0);
    rb.fillStyle = `rgba(11,12,14,${REC.dim})`; rb.fillRect(0, 0, recBmp.width, recBmp.height);
    rb.globalAlpha = REC.light; rb.drawImage(bk.bright, 0, 0); rb.globalAlpha = 1;
    rb.getImageData(0, 0, 1, 1);                         // rasterise now, not on the first frame
    const rec = ctx.canvas({ className: 'med-rec', parent: o.worldLayer });
    o.worldLayer.insertBefore(rec.canvas, F.svg);
    function drawRec(a) {
      const g = rec.g;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.clearRect(0, 0, W, H);
      if (a <= 0.001) return;
      const e = F.T.toScreen(0, 0), ax = F.T.toScreen(1, 0), ay = F.T.toScreen(0, 1);
      g.setTransform((ax[0] - e[0]) / RES, (ax[1] - e[1]) / RES, (ay[0] - e[0]) / RES, (ay[1] - e[1]) / RES, e[0], e[1]);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.globalAlpha = Math.min(1, a);
      g.drawImage(recBmp, 0, 0);
    }
    const ov = ctx.svg('svg', { class: 'brand-svg med-ov' }, o.wrap);
    const centre = ctx.svg('circle', { fill: 'none', stroke: C.amber, 'stroke-width': 1.5, opacity: 0 }, ov);
    const our = kPlan(ctx, ov, Match.ROUTES.OUR_PLAN, C.amber);
    const their = kPlan(ctx, ov, Match.ROUTES.THEIR_PLAN, C.rival);
    // emblems (screen space, upright): amber diamond 14 px, red-orange ring 14 px, each on a dark halo
    const emA = ctx.svg('g', { opacity: 0 }, ov), emV = ctx.svg('g', { opacity: 0 }, ov);
    ctx.svg('rect', { x: -5, y: -5, width: 10, height: 10, transform: 'rotate(45)', fill: C.amber, stroke: C.bg, 'stroke-width': 3, 'paint-order': 'stroke' }, emA);
    ctx.svg('circle', { r: 6, fill: 'none', stroke: C.bg, 'stroke-width': 5 }, emV);
    ctx.svg('circle', { r: 6, fill: 'none', stroke: C.rival, 'stroke-width': 2.2 }, emV);
    const emPulse = [ctx.svg('circle', { fill: 'none', stroke: C.amberLight, 'stroke-width': 1.5, opacity: 0 }, ov), ctx.svg('circle', { fill: 'none', stroke: C.rivalLight, 'stroke-width': 1.5, opacity: 0 }, ov)];
    // unclipped: the 2 px edge ring, the bezel (60 ticks, every 5th long: the match clock), the pulse ring
    const ring = ctx.svg('circle', { fill: 'none', stroke: C.amber, 'stroke-width': 2, opacity: 0 }, o.top);
    const bezel = ctx.svg('g', { opacity: 0 }, o.top);
    let bd = '';
    for (let i = 0; i < 60; i++) {
      const a = i * 6 * Math.PI / 180, r0 = MED.r + 9, r1 = MED.r + (i % 5 === 0 ? 21 : 14);
      bd += `M${(Math.cos(a) * r0).toFixed(2)} ${(Math.sin(a) * r0).toFixed(2)}L${(Math.cos(a) * r1).toFixed(2)} ${(Math.sin(a) * r1).toFixed(2)}`;
    }
    ctx.svg('path', { d: bd, stroke: C.amber, 'stroke-opacity': 0.42, 'stroke-width': 1, fill: 'none' }, bezel);
    const pulse = ctx.svg('circle', { cx: MED.x, cy: MED.y, fill: 'none', stroke: C.amberLight, 'stroke-width': 1.5, opacity: 0 }, o.top);
    const ringPulse = (el, cx, cy, r0, u, k, op) => {
      if (u < 0 || u > 1) { setA(el, 0); return; }
      const e = 1 - Math.pow(1 - u, 2);
      el.setAttribute('cx', cx.toFixed(2)); el.setAttribute('cy', cy.toFixed(2));
      el.setAttribute('r', (r0 * (1 + k * e)).toFixed(2));
      setA(el, (op || 0.6) * (1 - u));
    };

    // world marks for the record / medallion: rec 0..1 (record treatment), k 0..1 (medallion)
    function marks(rec, k) {
      const el = F.el;
      Object.values(el.tokens).forEach((t) => setA(t, 1 - rec));
      el.vega.forEach((t) => setA(t, 0)); setA(el.ghost, 0); setA(el.cone, 0);
      Object.values(el.labels || {}).forEach((g) => setA(g, 1 - rec));
      setA(el.fog, 1 - rec);
      [el.pump, el.crossing, el.conduit].forEach((e) => setA(e, 1 - k));
      setA(el.gate, 1); setA(el.ringTrack, 1); setA(el.ring, 0);
      if (F.match) { F.match.flow.forEach((f) => setA(f.el, 1 - k)); setA(F.match.gtri, 0); }
    }

    /** s: rec, k, clip {x, y, r} | null, z (zoom, for stroke scale), plan, arrow (scale), emblem, emA/emV
     *  (pulse scales), ring, bezel, centre. Camera must already be set (F.T.state) for this frame. */
    function apply(ft, s) {
      marks(s.rec, s.k);
      const ra = s.rec * (1 - REC.mix * s.k);
      F.T.state.alpha = ra >= 0.999 ? 0 : 1;            // the live terrain only draws where it shows through
      drawRec(ra);
      const cl = s.clip ? `circle(${s.clip.r.toFixed(2)}px at ${s.clip.x.toFixed(2)}px ${s.clip.y.toFixed(2)}px)` : '';
      if (o.wrap.style.clipPath !== cl) o.wrap.style.clipPath = cl;
      our.draw(F, s.z, s.plan, s.arrow); their.draw(F, s.z, s.plan, s.arrow);
      const toS = (p) => F.toScreen(p[0], p[1]);           // product units -> screen
      const gc = toS(GATE);
      centre.setAttribute('cx', gc[0].toFixed(2)); centre.setAttribute('cy', gc[1].toFixed(2));
      centre.setAttribute('r', (RING_R * S * s.z).toFixed(2));
      setA(centre, 0.85 * s.centre);
      const a = toS(APEX.atlas), v = toS(APEX.vega);
      emA.setAttribute('transform', `translate(${a[0].toFixed(2)} ${a[1].toFixed(2)}) scale(${(s.emA || 1).toFixed(4)})`);
      emV.setAttribute('transform', `translate(${v[0].toFixed(2)} ${v[1].toFixed(2)}) scale(${(s.emV || 1).toFixed(4)})`);
      setA(emA, s.emblem); setA(emV, s.emblem);
      ringPulse(emPulse[0], a[0], a[1], 9, s.puA != null ? s.puA : -1, 1.2);
      ringPulse(emPulse[1], v[0], v[1], 9, s.puV != null ? s.puV : -1, 1.2);
      if (s.clip) { ring.setAttribute('cx', s.clip.x.toFixed(2)); ring.setAttribute('cy', s.clip.y.toFixed(2)); ring.setAttribute('r', s.clip.r.toFixed(2)); }
      setA(ring, s.clip ? s.ring : 0);
      bezel.setAttribute('transform', `translate(${MED.x} ${MED.y}) rotate(${medRot(ft).toFixed(4)})`);
      setA(bezel, s.bezel);
      ringPulse(pulse, MED.x, MED.y, MED.r, (ft - MED_PULSE) / 1.5, 1.2);
      return { a, v, gc };
    }
    return { rec, ov, our, their, emA, emV, ring, bezel, pulse, centre, apply, marks };
  }
  // ====================================== END MEDALLION KIT ======================================

  // ---- type helpers: ink-edge alignment and exact baselines (measured, not guessed) ----
  const MCV = document.createElement('canvas').getContext('2d');
  function ink(font, text) { MCV.font = font; const m = MCV.measureText(text); return { left: -m.actualBoundingBoxLeft, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent, w: m.width }; }
  // put an absolutely positioned text element's alphabetic baseline at y (inline-block probe)
  function baselineOffset(el) {
    const probe = document.createElement('span');
    Object.assign(probe.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
    el.appendChild(probe);
    const off = probe.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.removeChild(probe);
    return off;
  }
  // headline line (house type move): masked words rise 20 f expo.out, 3 f stagger, weight 560 -> 620
  function kLine(ctx, o) {
    o = Object.assign({ size: 110, color: C.ink, parent: ctx.root, dur: 20 / FPS }, o);
    const x = o.x - ink(`620 ${o.size}px "Manrope Variable"`, o.text).left;
    const m = ctx.el('div', 's14-hl', o.parent);
    Object.assign(m.style, { position: 'absolute', left: (x - 0.08 * o.size).toFixed(2) + 'px', top: '0px', overflow: 'hidden', padding: '0 .08em .16em', whiteSpace: 'nowrap',
      font: `560 ${o.size}px/1 var(--display)`, letterSpacing: '-0.055em', color: o.color });
    const words = o.text.split(' ').map((w, i) => { if (i) m.appendChild(document.createTextNode(' ')); const s = ctx.el('span', '', m, w); s.style.display = 'inline-block'; return s; });
    m.style.top = (o.base - baselineOffset(m)).toFixed(2) + 'px';
    const wt = { w: 560 };
    ctx.tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: o.dur, ease: 'expo.out', stagger: 3 / FPS }, o.at);
    ctx.tl.fromTo(wt, { w: 560 }, { w: 620, duration: 24 / FPS, ease: 'power2.out', immediateRender: false }, o.at);
    ctx.onFrame(() => { const s = String(Math.round(wt.w)); if (m.style.fontWeight !== s) m.style.fontWeight = s; });
    return { el: m, words, landed: o.at + o.dur + 3 / FPS * (words.length - 1) };
  }

  // ---- end-card layout (screen px) ----
  const COL = 120;                                         // the left column's ink edge
  const MARK = { x: COL, y: 150, h: 56 };
  const BTN = { x: COL, y: 820, w: 520, h: 76, r: 8, padL: 32, arrow: 22 };
  const ARROW_TIP = [BTN.x + BTN.w - 22, BTN.y + BTN.h / 2];          // the baton's end point (618, 858)
  const ARROW_GAP = 14;                                    // the SVG arrow's head stops 14 px short: it points INTO the node
  const URL_X = 680;

  Film.scene({
    id: ID,
    duration: 8,
    async build(ctx) {
      const tl = ctx.tl, root = ctx.root, T0 = 64;
      ctx.css(`
        [data-scene="${ID}"] .s14-layer { position:absolute; left:0; top:0; width:${W}px; height:${H}px; pointer-events:none; }
        [data-scene="${ID}"] .s14-mono { position:absolute; left:0; top:0; font: 500 20px/1 var(--mono); letter-spacing:.12em; text-transform:uppercase; white-space:pre; }
      `);
      ctx.el('div', 's14-layer', root).style.background = C.bg;

      // ---- THE MEDALLION (identical to s13's last frame): camera + kit applied BEFORE the world draws ----
      let F = null, K = null;
      const emPulse = (lt, t0) => { const u = (lt - t0) / (10 / FPS); return u < 0 || u > 1 ? 1 : 1 + 0.35 * (u < 0.3 ? ez('power2.out')(u / 0.3) : 1 - ez('power2.inOut')((u - 0.3) / 0.7)); };
      ctx.onFrame((lt) => {
        if (!F || !K) return;
        const ft = T0 + lt;
        Object.assign(F.T.state, medCam(ft));
        K.apply(ft, Object.assign({}, MED_FINAL, {
          emA: emPulse(lt, 4.0), emV: emPulse(lt, 4.25),
          puA: (lt - 4.0) / 1.5, puV: (lt - 4.25) / 1.5,
        }));
      });
      const medWrap = ctx.el('div', 's14-layer s14-med', root);
      const worldLayer = ctx.el('div', 's14-layer', medWrap);
      F = Floodgate.world(ctx, { scale: S, margin: MARGIN, film: true, parent: worldLayer, terrain: { res: 1 }, state: medCam(T0) });
      F.progress.v = 0;                                     // no objective progress (no score, no winner)
      const top = ctx.svg('svg', { class: 'brand-svg s14-med-top' }, root);
      K = kMedallion(ctx, { F, worldLayer, wrap: medWrap, top });

      // ---- HUD corners at 50 % (no slug on the end card) ----
      const hud = B.hud(ctx, { inset: 72, tc: false, ticks: false, drawIn: false, slug: '' });
      hud.svg.style.opacity = '0.5';

      const card = ctx.el('div', 's14-layer s14-card', root);

      // ---- (1) the Enemites mark (logo.png, canvas source-in recolour) + 'Enemites', 27 deg wipe ----
      const img = new Image(); img.src = '/public/assets/logo.png'; await img.decode();
      const MW = MARK.h * img.naturalWidth / img.naturalHeight;
      const cv = document.createElement('canvas'); cv.width = Math.round(MW * 2); cv.height = MARK.h * 2;
      const g2 = cv.getContext('2d'); g2.imageSmoothingQuality = 'high';
      g2.drawImage(img, 0, 0, cv.width, cv.height); g2.globalCompositeOperation = 'source-in'; g2.fillStyle = C.ink; g2.fillRect(0, 0, cv.width, cv.height);
      Object.assign(cv.style, { position: 'absolute', left: '0px', top: '0px', width: (cv.width / 2) + 'px', height: MARK.h + 'px', display: 'block' });
      const row = ctx.el('div', 's14-row', card);
      Object.assign(row.style, { position: 'absolute', left: MARK.x + 'px', top: MARK.y + 'px', height: MARK.h + 'px', width: '420px' });
      row.appendChild(cv);
      const word = ctx.el('div', '', row, 'Enemites');
      const wf = '600 40px "Manrope Variable"', wi = ink(wf, 'Enemites');
      Object.assign(word.style, { position: 'absolute', top: '0px', font: '600 40px/1 var(--display)', letterSpacing: '-0.02em', color: C.ink, whiteSpace: 'nowrap' });
      word.style.left = (cv.width / 2 + 18 - wi.left).toFixed(2) + 'px';
      // cap height centred on the mark
      word.style.top = (MARK.h / 2 + ink(wf, 'E').asc / 2 - baselineOffset(word)).toFixed(2) + 'px';
      const rw = cv.width / 2 + 18 + wi.w + 4;
      const SL = Math.tan(27 * Math.PI / 180) * MARK.h;     // the wipe edge leans like the mark's stems
      const wipe = { e: -SL };
      tl.fromTo(wipe, { e: -SL }, { e: rw + SL, duration: 15 / FPS, ease: 'expo.out' }, 0);
      ctx.onFrame(() => {
        const e = wipe.e;
        row.style.clipPath = e >= rw + SL - 0.5 ? '' : `polygon(-10px -10px, ${(e + SL / 2).toFixed(1)}px -10px, ${(e - SL / 2).toFixed(1)}px ${MARK.h + 10}px, -10px ${MARK.h + 10}px)`;
      });

      // ---- (2) 'Realms' 180 px, baseline 400 ----
      kLine(ctx, { text: 'Realms', x: COL, base: 400, size: 180, color: C.ink, at: 0.25, dur: 18 / FPS, parent: card });

      // ---- (3) eyebrow: diamond + COMPETITIVE (amber) + / TEAM AGAINST TEAM (muted), baseline 460 ----
      const eye = ctx.el('div', 's14-eye', card, '<span class="dia"></span><span class="a"></span><span class="m"></span>');
      Object.assign(eye.style, { position: 'absolute', left: '0px', top: '0px', display: 'flex', alignItems: 'baseline', font: '500 24px/24px var(--mono)', letterSpacing: '.13em', textTransform: 'uppercase', whiteSpace: 'pre' });
      const ea = eye.querySelector('.a'), em = eye.querySelector('.m'), dia = eye.querySelector('.dia');
      ea.style.color = C.amber; em.style.color = C.muted;
      em.style.marginLeft = '0.73em';                       // one mono space (0.6em + .13em tracking) before the slash
      const DS = 12, DD = DS * Math.SQRT2;                  // diamond: 12 px square, 17 px across
      Object.assign(dia.style, { display: 'inline-block', width: DS + 'px', height: DS + 'px', background: C.amber, flex: 'none', marginLeft: ((DD - DS) / 2).toFixed(2) + 'px', marginRight: (16 + (DD - DS) / 2).toFixed(2) + 'px' });
      ea.textContent = 'COMPETITIVE';
      eye.style.left = COL + 'px';
      const ebo = baselineOffset(eye);
      eye.style.top = (460 - ebo).toFixed(2) + 'px';
      // the diamond's centre on the caps' middle (flex baseline puts its bottom on the baseline)
      dia.style.transform = '';
      dia.style.position = 'relative';
      dia.style.top = (-(ink('500 24px "JetBrains Mono Variable"', 'C').asc / 2 - DS / 2)).toFixed(2) + 'px';
      ea.textContent = '';
      tl.fromTo(dia, { scale: 0, rotation: -90 }, { scale: 1, rotation: 45, duration: 0.5, ease: 'back.out(2)' }, 0.75);
      B.scrambleTo(tl, ea, 'COMPETITIVE', 0.8, 0.36);
      B.scrambleTo(tl, em, '/ TEAM AGAINST TEAM', 0.85, 0.42);

      // ---- (4) 'Make your' / 'next move.' ----
      kLine(ctx, { text: 'Make your', x: COL, base: 640, size: 110, color: C.ink, at: 2.0, parent: card });
      kLine(ctx, { text: 'next move.', x: COL, base: 760, size: 110, color: C.amber, at: 2.5, parent: card });

      // ---- (5) CTA row: button (DOM rounded rect + inline SVG arrow) + URL, wiping in left to right ----
      const cta = ctx.el('div', 's14-layer s14-cta', card);
      const btn = ctx.el('div', 's14-btn', cta);
      Object.assign(btn.style, { position: 'absolute', left: BTN.x + 'px', top: BTN.y + 'px', width: BTN.w + 'px', height: BTN.h + 'px', borderRadius: BTN.r + 'px', background: C.amber });
      const bl = ctx.el('div', '', btn, 'Get match updates');
      const lf = '600 30px "Manrope Variable"';
      Object.assign(bl.style, { position: 'absolute', top: '0px', font: '600 30px/1 var(--display)', letterSpacing: '-0.01em', color: '#1b140a', whiteSpace: 'nowrap' });
      bl.style.left = (BTN.padL - ink(lf, 'Get match updates').left).toFixed(2) + 'px';
      bl.style.top = (BTN.h / 2 + ink(lf, 'H').asc / 2 - baselineOffset(bl)).toFixed(2) + 'px';
      const asv = ctx.svg('svg', { width: BTN.w, height: BTN.h, viewBox: `0 0 ${BTN.w} ${BTN.h}`, style: 'position:absolute;left:0;top:0;overflow:visible' }, btn);
      const ax = ARROW_TIP[0] - BTN.x - ARROW_GAP, ay = BTN.h / 2;
      ctx.svg('path', { d: `M${ax - BTN.arrow} ${ay} L${ax - 1} ${ay} M${ax - 8.5} ${ay - 7.5} L${ax} ${ay} L${ax - 8.5} ${ay + 7.5}`, fill: 'none', stroke: '#1b140a', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, asv);
      const url = ctx.el('div', 's14-url', cta, 'enemites.com/realms');
      const uf = '500 26px "JetBrains Mono Variable"';
      Object.assign(url.style, { position: 'absolute', top: '0px', font: '500 26px/1 var(--mono)', letterSpacing: '0.02em', color: C.ink2, whiteSpace: 'nowrap' });
      url.style.left = (URL_X - ink(uf, 'enemites.com/realms').left).toFixed(2) + 'px';
      url.style.top = (BTN.y + BTN.h / 2 + ink(uf, 'l').asc / 2 - baselineOffset(url)).toFixed(2) + 'px';
      const ctaW = URL_X + ink(uf, 'enemites.com/realms').w + 40 - BTN.x;
      tl.fromTo(cta, { clipPath: `inset(0px ${W - BTN.x}px 0px ${BTN.x - 4}px)` }, { clipPath: `inset(0px ${W - BTN.x - ctaW}px 0px ${BTN.x - 4}px)`, duration: 10 / FPS, ease: 'power3.out' }, 3.0);

      // ---- (6) status + (7) archival credit ----
      const status = ctx.el('div', 's14-mono', card, '');
      status.style.color = C.muted;
      status.textContent = 'IN DEVELOPMENT · PRIVATE BETA';
      status.style.left = (COL - ink('500 20px "JetBrains Mono Variable"', 'I').left).toFixed(2) + 'px';
      status.style.top = (940 - baselineOffset(status)).toFixed(2) + 'px';
      status.textContent = '';
      B.scrambleTo(tl, status, 'IN DEVELOPMENT · PRIVATE BETA', 3.5, 0.6);
      const CREDIT = 'ARCHIVAL FOOTAGE: NASA · U.S. NATIONAL ARCHIVES · U.S. ARMY AIR FORCES · LIBRARY OF CONGRESS';
      const credit = ctx.el('div', 's14-mono', card, CREDIT);
      Object.assign(credit.style, { color: C.muted3, letterSpacing: '.08em' });
      credit.style.left = (COL - ink('500 20px "JetBrains Mono Variable"', 'A').left).toFixed(2) + 'px';
      credit.style.top = (1004 - baselineOffset(credit)).toFixed(2) + 'px';
      tl.fromTo(credit, { opacity: 0 }, { opacity: 0.7, duration: 0.5, ease: 'power1.inOut' }, 4.0);

      // ---- THE NODE: on the ring until 67.0, then the baton onto the arrow tip ----
      let N = null;
      const io3 = ez('power3.inOut');
      const P0 = NODE_RING, P3 = ARROW_TIP;
      const C1 = [P0[0] - 150, P0[1] + 20], C2 = [P3[0] + 150, P3[1] - 210];   // leaves outward (left), lands from above-right
      const LAND = 3.0 + 18 / FPS;
      let pulseEl = null;
      ctx.onFrame((lt) => {
        if (!N) return;
        const u = io3(seg(lt, 3.0, LAND)), v = 1 - u;
        N.p.x = v * v * v * P0[0] + 3 * v * v * u * C1[0] + 3 * v * u * u * C2[0] + u * u * u * P3[0];
        N.p.y = v * v * v * P0[1] + 3 * v * v * u * C1[1] + 3 * v * u * u * C2[1] + u * u * u * P3[1];
        // on the button: the node layer is clipped to the button (its glow becomes a soft hot spot on the
        // amber, its pulse ring turns ink-dark so the 68.5 / 70.0 / 71.5 pulses read on amber)
        const onBtn = lt >= LAND;
        N.p.glow = onBtn ? 0.3 * ez('power2.out')(seg(lt, LAND, LAND + 10 / FPS)) : 0.35 * (1 - seg(lt, LAND - 6 / FPS, LAND));
        const cp = onBtn ? `url(#${ID}-btnclip)` : null;
        if (cp) { if (nodeG.getAttribute('clip-path') !== cp) nodeG.setAttribute('clip-path', cp); } else if (nodeG.hasAttribute('clip-path')) nodeG.removeAttribute('clip-path');
        const sc = onBtn ? '#1b140a' : C.amberLight;
        if (pulseEl && pulseEl.getAttribute('stroke') !== sc) pulseEl.setAttribute('stroke', sc);
        // its ring disc goes solid ink on the amber, so the core reads as a light point at the arrow's tip
        const fu = seg(lt, LAND - 3 / FPS, LAND + 3 / FPS);
        const rf = fu <= 0 ? 'rgba(11,12,14,.55)' : `rgba(${Math.round(lerp(11, 27, fu))},${Math.round(lerp(12, 20, fu))},${Math.round(lerp(14, 10, fu))},${(0.55 + 0.45 * fu).toFixed(3)})`;
        if (N.ring.getAttribute('fill') !== rf) N.ring.setAttribute('fill', rf);
      });
      const nsv = ctx.svg('svg', { class: 'brand-svg s14-node' }, root);
      const ndefs = ctx.svg('defs', {}, nsv);
      const bclip = ctx.svg('clipPath', { id: `${ID}-btnclip` }, ndefs);
      ctx.svg('rect', { x: BTN.x, y: BTN.y, width: BTN.w, height: BTN.h, rx: BTN.r }, bclip);
      const nodeG = ctx.svg('g', {}, nsv);
      N = NodeMark.create(ctx, { parent: nodeG, x: P0[0], y: P0[1], pulses: [0.5, 2.0, 4.5, 6.0, 7.5] });
      pulseEl = N.inner.children[1];                        // NodeMark: glow, pulse, ring, core
    },
  });
})();
