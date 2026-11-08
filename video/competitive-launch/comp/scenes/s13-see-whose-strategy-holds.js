/* s13-see-whose-strategy-holds (film 58-64 s, bars 30.1-33.1). Local 0 = film 58.0.
 *
 * Rebuilds s12's last frame (Match.HANDOFF 's12-on-the-record@58.0': buildMatchScreen + Match.review),
 * then, on the payoff accent (58.0, bar 30.1; every hit tween starts 1 frame early so 58.0 is the
 * impact frame):
 *   0.00  the review chrome dissolves (6 f) and the window opens back to full frame (14 f expo.out)
 *         while the camera goes REVIEW_WIN -> OVERVIEW (the window's 1 px frame rides the clip out); the
 *         world drops into the record treatment (tint 38 %, contours re-lit on top: a bitmap baked once
 *         from the shared terrain bake); the record distils into the two plans (ours amber, theirs
 *         red-orange, meeting at the ring); both banners rise on their summits; JK's tokens, the map
 *         labels and Vega's fog fade. THE NODE lifts off the playhead (track head) back into the world.
 *   0.50  the node lands on the Atlas summit (pulse); an amber runner (comet) travels our plan (0.50-1.25).
 *         Timing note: nothing is placed before 0 on ctx.tl (GSAP would shift the whole timeline); the
 *         1-frame-early hit moves are pure functions of lt.
 *   1.50  'See whose' (160 px, ink) rises at x 120 / baseline 760 (59.5, on the VO's 'see whose').
 *   2.00  'strategy holds.' (amber) at baseline 910, lands 60.77; a red-orange runner dash travels
 *         their plan (2.00-2.75).
 *   3.00  the Floodgate ring and both arrowheads pulse (no score change, no winner).
 *   3.30-5.80  breath #3.
 *   4.00-5.50  INTO THE RING: the world shrinks into the objective ring. The camera dollies out and the
 *         valley centre slides to (1420,540) (power4.inOut, zoom 0.84 -> MEDALLION 0.28) while a circular
 *         clip, locked to the world, closes to r 300; a 2 px amber ring rides the clip edge and stays,
 *         with a 60-tick bezel. Banners give way to 14 px emblems (amber diamond, red-orange ring).
 *         The medallion starts turning (0.6 deg/s, eased in from 62.0). Slug out and HUD to 50 % at 62.0.
 *   5.00  line 1 exits (9 f power2.in); the node hops from the summit onto the ring's 9 o'clock point.
 *   5.50  line 2 exits; the node lands on (1120,540); the medallion fires its pulse ring (45 f).
 *   6.00  s14 rebuilds the identical medallion (MEDALLION KIT below, verbatim in both files).
 */
(function () {
  'use strict';
  const ID = 's13-see-whose-strategy-holds';

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

  // ---- banners (replica of the s05 ONE-WORLD KIT banner: rise from the summit, sway on twos) ----
  const BANNER = { L: 152, w: 64, h: 128 };
  function kBanner(ctx, parent, side, T0) {
    const { L, w, h } = BANNER;
    const col = side === 'vega' ? C.rival : C.amber, deep = side === 'vega' ? C.rivalDeep : C.amberDeep;
    const g = ctx.svg('g', { style: 'display:none' }, parent);
    const cid = `${ctx.id}-kbn-${side}`;
    const defs = ctx.svg('defs', {}, g);
    const cp = ctx.svg('clipPath', { id: cid }, defs);
    const cr = ctx.svg('rect', { x: -14, y: 0, width: w + 40, height: 0 }, cp);
    const inner = ctx.svg('g', { 'clip-path': `url(#${cid})` }, g);
    ctx.svg('circle', { cx: 0, cy: 0, r: 3, fill: C.bone, opacity: 0.8 }, inner);
    ctx.svg('line', { x1: 0, y1: 0, x2: 0, y2: -L, stroke: C.bone, 'stroke-width': 2.5, 'stroke-linecap': 'round' }, inner);
    ctx.svg('circle', { cx: 0, cy: -L - 4, r: 4, fill: C.bone }, inner);
    const cloth = ctx.svg('path', { fill: col }, inner);
    const shade = ctx.svg('path', { fill: deep, 'fill-opacity': 0.42 }, inner);
    const em = ctx.svg('g', {}, inner);
    if (side === 'vega') ctx.svg('circle', { r: w * 0.2, fill: 'none', stroke: C.bg, 'stroke-width': w * 0.08 }, em);
    else ctx.svg('rect', { x: -w * 0.14, y: -w * 0.14, width: w * 0.28, height: w * 0.28, fill: C.bg, transform: 'rotate(45)' }, em);
    const p = { rise: 0, cloth: 0, a: 1, s: 1 };
    const ph = side === 'vega' ? 1.9 : 0;
    function draw(x, y, lt) {
      if (p.rise <= 0.001 || p.a <= 0.001) { g.style.display = 'none'; return; }
      g.style.display = '';
      const tq = Math.floor((T0 + lt) * FPS / 2 + 1e-6) * 2 / FPS;
      const ang = 1.5 * Math.sin(2 * Math.PI * tq / 2.6 + ph);
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(3)}) scale(${p.s.toFixed(4)})`);
      g.setAttribute('opacity', String(clamp(p.a, 0, 1)));
      const top = (L + 12) * p.rise;
      cr.setAttribute('y', (-top).toFixed(1)); cr.setAttribute('height', (top + 6).toFixed(1));
      const ch = h * p.cloth, x0 = 1.5, y0 = -L + 3;
      if (ch < 1) { cloth.setAttribute('d', ''); shade.setAttribute('d', ''); em.setAttribute('opacity', '0'); return; }
      const wv = (k) => 2.2 * Math.sin(2 * Math.PI * tq / 1.7 + k * 1.3 + ph);
      const notch = 0.2 * ch;
      cloth.setAttribute('d', `M${x0} ${y0} L${(x0 + w).toFixed(1)} ${(y0 + wv(0) * 0.3).toFixed(1)} L${(x0 + w + wv(1) * 0.4).toFixed(1)} ${(y0 + ch + wv(1)).toFixed(1)} L${(x0 + w / 2).toFixed(1)} ${(y0 + ch - notch + wv(2) * 0.6).toFixed(1)} L${x0} ${(y0 + ch).toFixed(1)}Z`);
      const fx = x0 + w * (0.58 + 0.05 * Math.sin(2 * Math.PI * tq / 1.7 + ph));
      shade.setAttribute('d', `M${fx.toFixed(1)} ${y0} L${(fx + w * 0.16).toFixed(1)} ${y0} L${(fx + w * 0.12).toFixed(1)} ${(y0 + ch - notch * 0.5).toFixed(1)} L${fx.toFixed(1)} ${(y0 + ch - notch * 0.3).toFixed(1)}Z`);
      em.setAttribute('transform', `translate(${(x0 + w / 2).toFixed(1)} ${(y0 + h * 0.36 + wv(1) * 0.3).toFixed(1)})`);
      em.setAttribute('opacity', String(clamp((p.cloth - 0.55) / 0.3, 0, 1)));
    }
    function rise(at) {
      ctx.tl.fromTo(p, { rise: 0 }, { rise: 1, duration: 14 / FPS, ease: 'expo.out', immediateRender: false }, at);
      ctx.tl.fromTo(p, { cloth: 0 }, { cloth: 1, duration: 14 / FPS, ease: 'expo.out', immediateRender: false }, at + 3 / FPS);
    }
    return { g, p, draw, rise };
  }

  // ---- headline line (house type move, as s05): masked words rise 20 f expo.out, 3 f stagger, weight
  //      560 -> 620 over 24 f; exits 9 f power2.in upward. x = the INK left edge (optically aligned) ----
  const MCV = document.createElement('canvas').getContext('2d');
  function inkLeft(font, text) { MCV.font = font; const m = MCV.measureText(text); return -m.actualBoundingBoxLeft; }
  function kLine(ctx, o) {
    o = Object.assign({ size: 160, color: C.ink, parent: ctx.root }, o);
    const x = o.x - inkLeft(`620 ${o.size}px "Manrope Variable"`, o.text);
    const m = ctx.el('div', 's13-hl', o.parent);
    Object.assign(m.style, { position: 'absolute', left: (x - 0.08 * o.size).toFixed(2) + 'px', top: '0px', overflow: 'hidden', padding: '0 .08em .16em', whiteSpace: 'nowrap',
      font: `560 ${o.size}px/1 var(--display)`, letterSpacing: '-0.055em', color: o.color });
    const words = o.text.split(' ').map((w, i) => { if (i) m.appendChild(document.createTextNode(' ')); const s = ctx.el('span', '', m, w); s.style.display = 'inline-block'; return s; });
    const probe = ctx.el('span', '', m); Object.assign(probe.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
    const off = probe.getBoundingClientRect().top - m.getBoundingClientRect().top; m.removeChild(probe);
    m.style.top = (o.base - off).toFixed(2) + 'px';
    const wt = { w: 560 };
    ctx.tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 20 / FPS, ease: 'expo.out', stagger: 3 / FPS }, o.at);
    ctx.tl.fromTo(wt, { w: 560 }, { w: 620, duration: 24 / FPS, ease: 'power2.out', immediateRender: false }, o.at);
    ctx.onFrame(() => { const s = String(Math.round(wt.w)); if (m.style.fontWeight !== s) m.style.fontWeight = s; });
    if (o.out != null) ctx.tl.to(words, { yPercent: -118, duration: 9 / FPS, ease: 'power2.in', stagger: 1 / FPS }, o.out);
    return { el: m, words, landed: o.at + 20 / FPS + 3 / FPS * (words.length - 1) };
  }

  Film.scene({
    id: ID,
    duration: 6,
    build(ctx) {
      const tl = ctx.tl, root = ctx.root, T0 = 58;
      const HIT = -1 / FPS;                                    // hit tweens start 1 f early: 58.0 is the impact frame
      const oe = (lt) => ez('expo.out')(seg(lt, HIT, HIT + 14 / FPS));        // window opens, camera to OVERVIEW
      const chromeA = (lt) => 1 - seg(lt, HIT, HIT + 6 / FPS);                // review chrome dissolves in 6 f
      const recU = (lt) => ez('power2.out')(seg(lt, HIT, HIT + 10 / FPS));    // record treatment + distil
      const irisU = (lt) => ez('power4.inOut')(seg(lt, 4.0, 5.5));            // INTO THE RING 62.0-63.5

      // ---- camera (product units): REVIEW_WIN -> OVERVIEW on the hit, drift to z 0.84 while type is up ----
      const CAM = Match.CAM, RW = CAM.REVIEW_WIN, OV = CAM.OVERVIEW, DRIFT = { x: 810, y: 505, zoom: 0.84 };
      const camLerp = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), u)) });
      const baseCam = (lt) => camLerp(RW, camLerp(OV, DRIFT, ez('power1.inOut')(seg(lt, 0, 4.0))), oe(lt));
      const SP0 = [W / 2 + (MED_P[0] - DRIFT.x) * DRIFT.zoom * S, H / 2 + (MED_P[1] - DRIFT.y) * DRIFT.zoom * S];
      // medallion progress, banner / emblem / ring timings (all reach their MED_FINAL values by 5.5)
      const st = (lt) => {
        const u = irisU(lt), ir = irisAt(u, SP0, DRIFT.zoom);
        return {
          u, ir,
          rec: recU(lt), k: u,
          clip: lt >= 4.0 ? { x: ir.sp[0], y: ir.sp[1], r: ir.r } : null,
          z: lt >= 4.0 ? ir.z : baseCam(lt).zoom,
          plan: lerp(0.7, 1, recU(lt)),
          arrow: 1 + 0.4 * (seg(lt, 3.0, 3.0 + 4 / FPS) - ez('power2.inOut')(seg(lt, 3.0 + 4 / FPS, 3.0 + 14 / FPS))),
          emblem: ez('power2.out')(seg(lt, 4.85, 5.2)),
          emA: 0.4 + 0.6 * ez('back.out(2)')(seg(lt, 4.85, 5.2)), emV: 0.4 + 0.6 * ez('back.out(2)')(seg(lt, 4.9, 5.25)),
          ring: 1, bezel: ez('power2.out')(seg(lt, 5.1, 5.6)), centre: ez('power2.out')(seg(lt, 4.7, 5.3)),
        };
      };

      // ---- s12's last frame (Match.HANDOFF 's12-on-the-record@58.0') ----
      ctx.el('div', 's13-bg', root).style.cssText = `position:absolute; inset:0; background:${C.bg};`;
      const M = Match.buildMatchScreen(ctx, { m: 511, tau: (lt) => 17.5 + lt, pulses: [], camera: false, clock: () => 484 });
      const F = M.F, U = M.U, L = M.L;
      gsap.set([U.topbar, U.signal, U.roster, U.channel, M.score.el], { autoAlpha: 0 });
      // camera first (runs before the review hook and the terrain draw)
      M.pre((lt) => {
        const ft = T0 + lt, s = F.T.state;
        if (lt < 4.0) { const c = baseCam(lt); s.cx = (c.x + MARGIN) * S; s.cy = (c.y + MARGIN) * S; s.zoom = c.zoom; s.rot = 0; return; }
        const ir = irisAt(irisU(lt), SP0, DRIFT.zoom);
        Object.assign(s, camFor(MED_P, ir.sp, ir.z, medRot(ft)));
      });
      const R = Match.review(ctx, M, { m: 511, fold: 1, open: oe, alpha: chromeA, rec: (lt) => 1 - recU(lt), nodePulses: [] });
      R.N.p.a = 0;                                             // our own NODE carries on (below)

      // ---- medallion structure: the world layer moves into a clip wrap; overlay + ring layers ----
      const medWrap = ctx.el('div', 'mx-layer s13-med', null);
      root.insertBefore(medWrap, L.world);
      medWrap.appendChild(L.world);
      const top = ctx.svg('svg', { class: 'brand-svg s13-med-top' }, null);
      root.insertBefore(top, medWrap.nextSibling);
      const K = kMedallion(ctx, { F, worldLayer: L.world, wrap: medWrap, top });
      // overview-only marks (inside the clip): banners, runners, the ring pulse
      const ex = ctx.svg('svg', { class: 'brand-svg s13-ex' }, medWrap);
      const ringPulse = ctx.svg('circle', { fill: 'none', stroke: C.amberLight, 'stroke-width': 1.6, opacity: 0 }, ex);
      // runner dash: a comet (gradient tail, bright head with a soft halo) riding the plan
      let rnN = 0;
      const runner = (col, d) => {
        const Rr = samplerC(d);
        const g = ctx.svg('g', { opacity: 0 }, ex);
        const gid = `${ID}-runner-${++rnN}`;
        const lg = ctx.svg('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse' }, ctx.svg('defs', {}, g));
        ctx.svg('stop', { offset: '0%', 'stop-color': col, 'stop-opacity': 0 }, lg);
        ctx.svg('stop', { offset: '100%', 'stop-color': col, 'stop-opacity': 1 }, lg);
        const tail = ctx.svg('path', { fill: 'none', stroke: `url(#${gid})`, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
        const halo = ctx.svg('circle', { r: 10, fill: col, opacity: 0.22 }, g);
        const head = ctx.svg('circle', { r: 3.6, fill: col }, g);
        return { Rr, g, lg, tail, head, halo };
      };
      const runOur = runner(C.amberLight, Match.ROUTES.OUR_PLAN), runTheir = runner(C.rivalLight, Match.ROUTES.THEIR_PLAN);
      const bV = kBanner(ctx, ex, 'vega', T0), bA = kBanner(ctx, ex, 'atlas', T0);
      // both banners rise on the accent (pure functions of lt: a ctx.tl position before 0 would shift the
      // whole scene timeline by a frame). The pole climbs 14 f expo.out, the cloth unrolls 3 f later.
      const riseAt = (b, t0) => (lt) => { b.p.rise = ez('expo.out')(seg(lt, t0, t0 + 14 / FPS)); b.p.cloth = ez('expo.out')(seg(lt, t0 + 3 / FPS, t0 + 17 / FPS)); };
      const riseA = riseAt(bA, HIT), riseV = riseAt(bV, HIT + 2 / FPS);

      // ---- left scrim under the type (#0b0c0e 72% -> 0 over x 0-1150, feathered above y 560) ----
      const sc = ctx.canvas({ className: 's13-scrim', parent: null });
      root.insertBefore(sc.canvas, top.nextSibling);
      (function paint(g) {
        const hg = g.createLinearGradient(0, 0, 1150, 0);
        hg.addColorStop(0, 'rgba(11,12,14,0.74)'); hg.addColorStop(0.6, 'rgba(11,12,14,0.5)'); hg.addColorStop(1, 'rgba(11,12,14,0)');
        g.fillStyle = hg; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'destination-in';
        const vg = g.createLinearGradient(0, 540, 0, 700);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,1)');
        g.fillStyle = vg; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'source-over';
      })(sc.g);
      tl.fromTo(sc.canvas, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power1.inOut' }, 0.5);
      tl.to(sc.canvas, { opacity: 0, duration: 1.0, ease: 'power1.inOut' }, 4.0);

      // ---- the medallion + overview marks, every frame (pre hook: after Match.state and the review) ----
      let NOW = null;
      M.pre((lt) => {
        const ft = T0 + lt, s = st(lt);
        // the record's two plans are ours (screen space); hide the kit's world-space copies
        ['OUR_PLAN', 'THEIR_PLAN'].forEach((n) => { const r = M.K.routes[n]; if (r && r.g && r.g.style.display !== 'none') { r.g.style.display = 'none'; r.vis = false; } });
        const pos = K.apply(ft, s);
        // the review window's 1 px frame rides the opening clip edge outward while it dissolves
        const ou = oe(lt), WIN = Match.HANDOFF['s12-on-the-record@58.0'].window;
        R.frame.setAttribute('x', lerp(WIN.x, 0, ou).toFixed(2)); R.frame.setAttribute('y', lerp(WIN.y, 0, ou).toFixed(2));
        R.frame.setAttribute('width', lerp(WIN.w, W, ou).toFixed(2)); R.frame.setAttribute('height', lerp(WIN.h, H, ou).toFixed(2));
        NOW = { s, pos };
        // banners: shrink with the world, give way to the emblems
        const z = s.z, bs = clamp(z / 0.84, 0.2, 1), ba = 1 - ez('power2.in')(seg(lt, 4.45, 4.85));
        bA.p.s = bs; bV.p.s = bs; bA.p.a = ba; bV.p.a = ba; riseA(lt); riseV(lt);
        bV.draw(pos.v[0], pos.v[1], lt); bA.draw(pos.a[0], pos.a[1], lt);
        // runner dashes: ours 0.50-1.25, theirs 2.00-2.75
        [[runOur, 0.5], [runTheir, 2.0]].forEach(([rn, t0]) => {
          const uu = (lt - t0) / 0.75;
          if (uu < 0 || uu > 1) { setA(rn.g, 0); return; }
          const hu = 1.22 * ez('power2.inOut')(uu), u1 = Math.min(1, hu), u0 = Math.max(0, hu - 0.22);
          let d = '', t0p = null;
          for (let i = 0; i <= 16; i++) { const q = rn.Rr.at(lerp(u0, u1, i / 16)); const sp = F.toScreen(q.x, q.y); if (!i) t0p = sp; d += (i ? 'L' : 'M') + sp[0].toFixed(1) + ' ' + sp[1].toFixed(1); }
          rn.tail.setAttribute('d', d);
          const hq = rn.Rr.at(u1), hs = F.toScreen(hq.x, hq.y);
          // gradient from the tail (transparent) to where the head would be at full length
          const hf = rn.Rr.at(Math.min(1.0, u0 + 0.22)), hfs = F.toScreen(hf.x, hf.y);
          rn.lg.setAttribute('x1', t0p[0].toFixed(1)); rn.lg.setAttribute('y1', t0p[1].toFixed(1));
          rn.lg.setAttribute('x2', hfs[0].toFixed(1)); rn.lg.setAttribute('y2', hfs[1].toFixed(1));
          [rn.head, rn.halo].forEach((c) => { c.setAttribute('cx', hs[0].toFixed(1)); c.setAttribute('cy', hs[1].toFixed(1)); });
          const ho = hu <= 1 ? 1 : 0;
          rn.head.setAttribute('opacity', String(ho)); rn.halo.setAttribute('opacity', String(0.22 * ho));
          setA(rn.g, Math.min(seg(hu, 0, 0.06), 1 - seg(hu, 1.0, 1.22)));
        });
        // 61.0: the Floodgate ring pulses (with both arrowheads, in st().arrow)
        const pu = (lt - 3.0) / 1.5;
        if (pu >= 0 && pu <= 1) {
          const e = 1 - Math.pow(1 - pu, 2), rr = RING_R * S * z;
          ringPulse.setAttribute('cx', pos.gc[0].toFixed(1)); ringPulse.setAttribute('cy', pos.gc[1].toFixed(1));
          ringPulse.setAttribute('r', (rr * (1 + 1.2 * e)).toFixed(2)); setA(ringPulse, 0.6 * (1 - pu));
        } else setA(ringPulse, 0);
      });

      // ---- slug out and HUD corners to 50 % at 62.0 (the medallion is a brand mark, not UI) ----
      tl.to(M.slug, { opacity: 0, duration: 0.3, ease: 'none' }, 4.0);
      tl.fromTo(M.hud.svg, { opacity: 1 }, { opacity: 0.5, duration: 0.5, ease: 'power1.inOut', immediateRender: false }, 4.0);

      // ---- type: 'See whose' / 'strategy holds.' (the thesis key phrase, heard and read) ----
      const typeL = ctx.el('div', 'mx-layer s13-type', root);
      kLine(ctx, { text: 'See whose', x: 120, base: 760, size: 160, color: C.ink, at: 1.5, out: 5.0, parent: typeL });
      kLine(ctx, { text: 'strategy holds.', x: 120, base: 910, size: 160, color: C.amber, at: 2.0, out: 5.5, parent: typeL });

      // ---- THE NODE: lifts off the playhead, lands on the Atlas summit (0.5), hops onto the ring (5.0-5.5) ----
      const TRACK = Match.HANDOFF['s12-on-the-record@58.0'].node;
      let N = null;
      const io3 = ez('power3.inOut');
      ctx.onFrame((lt) => {
        if (!N || !NOW) return;
        const a = NOW.pos.a;
        let x, y;
        if (lt < 0.5) {
          const u = io3(seg(lt, 0, 0.5)), mx = (TRACK[0] + a[0]) / 2, my = (TRACK[1] + a[1]) / 2;
          const dx = a[0] - TRACK[0], dy = a[1] - TRACK[1], Lh = Math.hypot(dx, dy) || 1;
          const cx = mx + (dy / Lh) * 90, cy = my - (dx / Lh) * 90;       // bows out to the left
          x = (1 - u) * (1 - u) * TRACK[0] + 2 * (1 - u) * u * cx + u * u * a[0];
          y = (1 - u) * (1 - u) * TRACK[1] + 2 * (1 - u) * u * cy + u * u * a[1];
        } else if (lt < 5.0) { x = a[0]; y = a[1]; }
        else if (lt < 5.5) {
          const c = NOW.s.clip, e = [c.x - c.r, c.y];
          const u = io3(seg(lt, 5.0, 5.5));
          const cx = (a[0] + e[0]) / 2 - 10, cy = Math.min(a[1], e[1]) - 46;   // a small arc over the rim
          x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * cx + u * u * e[0];
          y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * cy + u * u * e[1];
        } else { x = NODE_RING[0]; y = NODE_RING[1]; }
        N.p.x = x; N.p.y = y;
      });
      const nsv = ctx.svg('svg', { class: 'brand-svg s13-node' }, root);
      // pulses: s12's 57.5 ring is still expanding on 58.0; then the film cadence 58.5 / 60.0 / 61.5
      // (63.0 is the hop; the medallion fires its own pulse on 63.5)
      N = NodeMark.create(ctx, { parent: nsv, x: TRACK[0], y: TRACK[1], pulses: [-0.5, 0.5, 2.0, 3.5] });
      N.step(0);
    },
  });
})();
