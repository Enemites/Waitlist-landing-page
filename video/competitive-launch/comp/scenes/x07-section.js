/* x07-section: revision v3 round 2 insert (overlay, film 30.5-32.0). Local 0 = 30.5. Spec: docs/revision-v3.md.
 * SECTION: the valley read side-on, as one survey section from the Atlas summit (380,320) through the gate
 * (800,560) to the Vega summit (1260,690) (Floodgate.productHeight(), the same heightfield as the map).
 * The front profile is the cut: a bright section line, the earth under it hatched, the river trough holding
 * water at sea level, the gate spanning the trough bank to bank (deck bearing on both banks, four piers,
 * three leaves, its body clipped to the trough so nothing crosses the section line or the hatch). Behind it,
 * nine parallel offset profiles (42 product units apart, toward the north-east) drawn as drafting HIDDEN
 * LINES: bone, 1 px, 0.32 -> 0.10, the farther half dashed [6,5], each filled with the ground so nearer
 * ridges occlude farther ones. Amber is kept for the cut (section line, hatch, markers). The depth step grows
 * to the right (the stack climbs into the empty right third, clear of the headline) but is held constant
 * across the river, so every profile's water run is level. Vertical exaggeration ~250 px per height unit;
 * 1 px per product unit along the line; the far profiles are lightly low-passed. The sheet is clipped to
 * x 96-1800 (a left edge line, an elevation ruler on the right) over a ticked datum at y 940.
 *
 * Type and frame chrome are s07's, pixel for pixel, so the headline reads straight across both cuts:
 * '02 —— FIND YOUR OPPOSITION' (120,150), 'The same challenge.' (ink) / 'Another approach.' (amber), x 120,
 * baselines 380 / 510, Manrope 620 120 px; s07's HUD (corners inset 72 + ticks, slug at 120,990 .1em).
 * s07's Vega lobby ring is carried across both cuts: on 30.5 it is exactly s07's ring (centre 1340,560,
 * r = 60 x 1.5 x zoom), it collapses onto the Vega summit marker (8 f expo.out); 31.767-31.967 it opens back
 * to s07's ring (power3.inOut), so 32.0 cuts on the same ring.
 *
 * 0.00 (30.5) hard cut: the profiles rise out of the sea line, front first, a wave travelling back
 *      (8 f expo.out, 1 f pre-roll, 1.2 f lag per profile); the datum and station ticks draw left to right.
 * 0.07-0.34 markers: Atlas pillar + diamond, gate, Vega pillar under the arriving ring; labels scramble in.
 *      The plate holds still: the motion is the rise, the scan and the rings.
 * 0.50 (31.0) SCAN: a reading line sweeps the section left to right (0.5 s power2.inOut). Behind it the
 *      section line turns light (read); a light band rides every profile (occluded by the ridges in front);
 *      the cut face glows behind the head, its trail sized to the head's speed (no strobing at peak);
 *      the markers ping as it crosses them (Atlas, gate sonar ring, Vega ring pulse).
 * 1.267-1.467 the ring opens back to s07's lobby ring; 1.50 (32.0) hard cut back to s07.
 */
(function () {
  'use strict';
  const ID = 'x07-section';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, FPS = 30, S = 1.5;
  const SLUG = 'REALMS · COMPETITIVE · INTERFACE CONCEPT';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const expoOut = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
  const p2io = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const p3io = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const sineIO = (u) => -(Math.cos(Math.PI * clamp(u, 0, 1)) - 1) / 2;
  const T0 = 30.5;                                  // film time of local 0

  // ---- s07 carry-over: the Vega lobby ring (s07 local = film - 28; zoom 2.2 -> 2.26 sine.inOut over 0.75-4.5)
  const RING07 = { x: 1340, y: 560, w: 2, a: 0.95 };
  const ringR07 = (ft) => 60 * S * Math.exp(lerp(Math.log(2.2), Math.log(2.26), sineIO(seg(ft - 28, 0.75, 4.5))));

  // ---- section geometry
  const SEA = 0.18;
  const PA = [380, 320], PG = [800, 560], PV = [1260, 690];
  const LAG = Math.hypot(PG[0] - PA[0], PG[1] - PA[1]), LGV = Math.hypot(PV[0] - PG[0], PV[1] - PG[1]);
  const DAG = [(PG[0] - PA[0]) / LAG, (PG[1] - PA[1]) / LAG], DGV = [(PV[0] - PG[0]) / LGV, (PV[1] - PG[1]) / LGV];
  const KX = 1.0;                                   // screen px per product unit along the section
  const XV = 1340;                                  // the Vega summit sits under s07's ring
  const XA = XV - (LAG + LGV) * KX, XG = XA + LAG * KX;
  const YS = 795, VS = 250, YD = 940;               // sea level, px per height unit, datum (bottom of the cut face)
  const NP = 10, OFF = 42;                          // profiles (front + 9 behind), lateral spacing (product units)
  const X0 = 40, X1 = 1880, DXS = 4;                // station range (screen) and step
  const NS = Math.round((X1 - X0) / DXS) + 1;
  const stepY = (x) => lerp(6.0, 31.0, smooth((x - 300) / 1350));   // depth step (px per profile), grows to the right
  const STEP_X = 6.4;                               // and each profile sits a little to the right (oblique)
  const SHEET = [96, 1800];                          // the section is clipped to the sheet (left edge line, right ruler)

  // product point + north-east normal at arc length s (from the Atlas summit; negative before it)
  function along(s) {
    let p, d;
    if (s <= LAG) { p = [PA[0] + DAG[0] * s, PA[1] + DAG[1] * s]; d = DAG; } else { p = [PG[0] + DGV[0] * (s - LAG), PG[1] + DGV[1] * (s - LAG)]; d = DGV; }
    const b = smooth((s - (LAG - 260)) / 520);      // the normal turns smoothly through the gate
    const nx = lerp(DAG[1], DGV[1], b), ny = lerp(-DAG[0], -DGV[0], b), nl = Math.hypot(nx, ny);
    void d;
    return { p, n: [nx / nl, ny / nl] };
  }

  Film.scene({
    id: ID,
    duration: 1.5,
    build(ctx) {
      const { root } = ctx;
      ctx.css(`
        [data-scene="${ID}"] .x07-bg { position:absolute; inset:0; background:${C.bg}; }
        [data-scene="${ID}"] .x07-slug { position:absolute; left:120px; top:990px; font: 500 20px/20px var(--mono); letter-spacing:.1em; color:${C.muted3}; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .x07-lab { position:absolute; left:0; top:0; font: 500 22px/22px var(--mono); letter-spacing:.14em; text-transform:uppercase; white-space:pre; text-shadow: 0 0 10px rgba(11,12,14,.95), 0 0 3px rgba(11,12,14,.95); }
      `);
      ctx.el('div', 'x07-bg', root);
      const { g } = ctx.canvas();

      // ---- heights: NP profiles x NS stations, sampled once ----
      const hf = Floodgate.productHeight();
      const HT = Array.from({ length: NP }, () => new Float32Array(NS));
      const SX = new Float32Array(NS);
      for (let i = 0; i < NS; i++) {
        const x = X0 + i * DXS; SX[i] = x;
        const a = along((x - XA) / KX);
        for (let k = 0; k < NP; k++) HT[k][i] = hf(a.p[0] + a.n[0] * OFF * k, a.p[1] + a.n[1] * OFF * k);
      }
      // a light low-pass along each profile (the far lines read as clean ridges, the cut keeps its grain)
      for (let k = 0; k < NP; k++) {
        const src = HT[k].slice(), wts = k === 0 ? [1, 2, 1] : [1, 2, 3, 2, 1], hw = (wts.length - 1) / 2, ws = wts.reduce((a, b) => a + b, 0);
        for (let i = 0; i < NS; i++) { let acc = 0; for (let j = -hw; j <= hw; j++) acc += src[clamp(i + j, 0, NS - 1)] * wts[j + hw]; HT[k][i] = acc / ws; }
      }
      const hAt = (s) => { const a = along(s); return hf(a.p[0], a.p[1]); };
      const hA = hAt(0), hV = hAt(LAG + LGV);
      // depth step per station: the stepY ramp, held at the gate's value across the river so every profile's
      // water run is level (water is wet where the height is under the sea: independent of the step). The flat
      // span covers every wet run that meets the gate's neighbourhood, plus a margin; it blends back over 140 px.
      let span = 130;
      for (let k = 0; k < NP; k++) {
        for (let i = 0; i < NS; i++) {
          if (HT[k][i] >= SEA) continue;
          const x = SX[i];
          if (Math.abs(x - XG) < 320) span = Math.max(span, Math.abs(x - XG) + 24);
        }
      }
      span = Math.min(span, 300);
      const STG = stepY(XG);
      const STY = new Float32Array(NS);
      for (let i = 0; i < NS; i++) STY[i] = lerp(STG, stepY(SX[i]), smooth((Math.abs(SX[i] - XG) - span) / 140));
      // the front trough (wet run of the cut around the gate) at sea level: WL..WR (screen x, sub-station)
      let iLo = clamp(Math.round((XG - X0) / DXS), 0, NS - 1);
      for (let i = iLo - 40; i <= iLo + 40; i++) if (HT[0][i] < HT[0][iLo]) iLo = i;
      let wa = iLo, wb = iLo;
      while (wa > 0 && HT[0][wa - 1] < SEA) wa--;
      while (wb < NS - 1 && HT[0][wb + 1] < SEA) wb++;
      const cross0 = (i0, i1) => { const h0 = HT[0][i0] - SEA, h1 = HT[0][i1] - SEA; return SX[i0] + (SX[i1] - SX[i0]) * (h0 / (h0 - h1)); };
      const WL = wa > 0 ? cross0(wa - 1, wa) : SX[wa], WR = wb < NS - 1 ? cross0(wb, wb + 1) : SX[wb];
      const GX = (WL + WR) / 2;                        // the gate's centre line (the trough centre)
      // the downstream water behind the gate: the level mark sits on the nearest back profile's level water run
      // that is visible (wet, not hidden by a nearer profile, clear of the cut line) right of the deck's end
      const topAt = (k, x) => {                          // settled visible top of profile k at screen x
        const i = clamp(Math.round((x - STEP_X * k - X0) / DXS), 0, NS - 1), base = YS - STY[i] * k;
        return { y: Math.min(base - (HT[k][i] - SEA) * VS * (1 - 0.22 * k / (NP - 1)), base), wet: HT[k][i] < SEA, base };
      };
      const LAB_T = YS - 16 - 84, LAB_B = LAB_T + 22;   // the FLOODGATE label's band (top, bottom)
      // for each back profile (nearest first) whose water line lies below the label's band, the free stretch of
      // level water right of the deck's end (wet, not hidden by a nearer profile); the mark takes the middle of the
      // first stretch at least 30 px long
      let LVL = null;
      for (let k = 1; k < NP && !LVL; k++) {
        const x0 = WR + 10;
        const t0 = topAt(k, x0), y = t0.base;
        if (y - 11 < LAB_B + 4) continue;
        const free = (x) => { const t = topAt(k, x); if (!t.wet) return false; for (let j = 0; j < k; j++) if (topAt(j, x).y < y + 2) return false; return true; };
        let a = x0; while (a < x0 + 90 && !free(a)) a += 1;
        let b = a; while (b < a + 200 && free(b + 1)) b += 1;
        if (b - a >= 30) LVL = { k, x: (a + b) / 2, y };
      }
      // static envelope (top of the stack per station, full height, no drift): the scan line's height
      const ENV = new Float32Array(NS);
      for (let i = 0; i < NS; i++) {
        let m = YD;
        for (let k = 0; k < NP; k++) { const d = k / (NP - 1); m = Math.min(m, YS - STY[i] * k - Math.max(HT[k][i] - SEA, 0) * VS * (1 - 0.22 * d)); }
        ENV[i] = m;
      }
      const envAt = (x) => ENV[clamp(Math.round((x - X0) / DXS), 0, NS - 1)];

      // ---- per-frame state ----
      const hsK = (lt, k) => expoOut((lt + 1 / FPS - k * 1.2 / FPS) / (8 / FPS));
      const SCAN0 = 0.5, SCAN1 = 1.0, SX0 = 96, SX1 = 1824;
      const scanX = (lt) => lerp(SX0, SX1, p2io(seg(lt, SCAN0, SCAN1)));
      // when the scan crosses a front-profile station (bisection on a monotonic function)
      const crossT = (xs) => { let a = SCAN0, b = SCAN1; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (scanX(m) < xs) a = m; else b = m; } return (a + b) / 2; };
      const TC = { A: crossT(XA), G: crossT(GX), V: crossT(XV) };
      // the scan head's speed (px per frame) sets the length of its trailing glow, so it sweeps, never strobes
      const scanLen = (lt) => Math.max(60, 1.3 * Math.abs(scanX(lt) - scanX(lt - 1 / FPS)));
      // scan crossings (local s): Atlas ~0.640, gate ~0.734, Vega ~0.811 (film 31.14 / 31.23 / 31.31)

      const YT = new Float32Array(NS), YG = new Float32Array(NS), XS = new Float32Array(NS), ENVF = new Float32Array(NS);
      function profile(lt, k) {
        const d = k / (NP - 1), hs = hsK(lt, k), vs = VS * (1 - 0.22 * d) * hs;
        const dx = STEP_X * k, H_ = HT[k];
        for (let i = 0; i < NS; i++) {
          const base = YS - STY[i] * k;
          XS[i] = SX[i] + dx;
          YG[i] = base - (H_[i] - SEA) * vs;                 // terrain (riverbed included)
          YT[i] = Math.min(YG[i], base);                      // visible top: water counts as a floor
        }
        return { d, hs, dx };
      }
      const amb = (a) => B.rgba(C.amber, a), ambL = (a) => B.rgba(C.amberLight, a), bone = (a) => B.rgba(C.bone, a);
      // stroke gradient: base alpha, a light band behind the scan head (len x 0.3, sized to its speed), 'read'
      // level left of it
      function lineStyle(xs, len, a0, aRead, aHot, col) {
        if (xs == null || xs <= SX0 - 1) return col(a0);
        const gr = g.createLinearGradient(0, 0, W, 0);
        const f = (x) => clamp(x / W, 0, 1);
        gr.addColorStop(0, col(aRead));
        gr.addColorStop(f(xs - len * 0.3), col(aRead));
        gr.addColorStop(f(xs - 3), ambL(aHot));
        gr.addColorStop(f(xs), ambL(aHot));
        gr.addColorStop(f(xs + 1.5), col(a0));
        gr.addColorStop(1, col(a0));
        return gr;
      }
      // diagonal hatch of the cut face (pre-built path, clipped per frame)
      const HATCH = new Path2D();
      for (let c = -1200; c < W + 200; c += 10) { HATCH.moveTo(c, YD + 40); HATCH.lineTo(c + 640, YD - 600); }

      // ---- marks (SVG): the carried ring + the ping rings ----
      const sv = ctx.svg('svg', { class: 'brand-svg' });
      const ring = ctx.svg('circle', { cx: RING07.x, cy: RING07.y, r: ringR07(T0).toFixed(2), fill: 'none', stroke: C.rival, 'stroke-width': RING07.w, opacity: RING07.a }, sv);
      const pingV = ctx.svg('circle', { r: 30, fill: 'none', stroke: C.rival, 'stroke-width': 1.5, opacity: 0 }, sv);
      const pingG = ctx.svg('circle', { r: 20, fill: 'none', stroke: C.amberLight, 'stroke-width': 1.5, opacity: 0 }, sv);

      // ---- labels ----
      const labA = ctx.el('div', 'x07-lab', root, ''); labA.style.color = C.amber;
      const labG = ctx.el('div', 'x07-lab', root, ''); labG.style.color = C.bone; labG.style.fontSize = '20px';
      const labV = ctx.el('div', 'x07-lab', root, ''); labV.style.color = C.rival;
      B.scrambleTo(ctx.tl, labA, 'ATLAS', 0.07, 0.2);
      B.scrambleTo(ctx.tl, labG, 'FLOODGATE', 0.12, 0.22);
      B.scrambleTo(ctx.tl, labV, 'VEGA', 0.15, 0.18);

      // ---- s07's type + HUD, pixel for pixel ----
      function kLine(o) {
        const m = ctx.el('div', 'x07-hl', root);
        Object.assign(m.style, { position: 'absolute', left: (o.x - 0.08 * o.size).toFixed(1) + 'px', top: '0px', overflow: 'hidden', padding: '0 .08em .16em', whiteSpace: 'nowrap',
          font: `560 ${o.size}px/1 var(--display)`, letterSpacing: '-0.055em', color: o.color });
        o.text.split(' ').forEach((w, i) => { if (i) m.appendChild(document.createTextNode(' ')); const s = ctx.el('span', '', m, w); s.style.display = 'inline-block'; });
        const probe = ctx.el('span', '', m); Object.assign(probe.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
        const off = probe.getBoundingClientRect().top - m.getBoundingClientRect().top; m.removeChild(probe);
        m.style.top = (o.base - off).toFixed(1) + 'px';
        m.style.fontWeight = '620';
        return m;
      }
      function kChapter(o) {
        const el = ctx.el('div', 'x07-chap', root, '<span class="n"></span><i class="r"></i><span class="t"></span>');
        Object.assign(el.style, { position: 'absolute', left: o.x + 'px', top: o.y + 'px', display: 'flex', alignItems: 'center', gap: '16px', font: '500 24px/24px var(--mono)', letterSpacing: '.12em', textTransform: 'uppercase', whiteSpace: 'pre', color: C.ink });
        const n = el.querySelector('.n'), r = el.querySelector('.r'), t = el.querySelector('.t');
        Object.assign(n.style, { color: C.amber, fontWeight: '600', minWidth: '2.3ch' });
        Object.assign(r.style, { display: 'block', width: '44px', height: '2px', background: C.amber, opacity: '0.75', transformOrigin: '0 50%' });
        n.textContent = o.num; t.textContent = o.title;
        return el;
      }
      kChapter({ num: '02', title: 'FIND YOUR OPPOSITION', x: 120, y: 150 });
      kLine({ text: 'The same challenge.', x: 120, base: 380, size: 120, color: C.ink });
      kLine({ text: 'Another approach.', x: 120, base: 510, size: 120, color: C.amber });
      B.hud(ctx, { inset: 72, tc: false, drawIn: false, slug: '', ticks: true });
      ctx.el('div', 'x07-slug', root, SLUG);

      // ---- the frame ----
      const front = { x: new Float32Array(NS), yg: new Float32Array(NS), yt: new Float32Array(NS) };
      ctx.onFrame((lt) => {
        const ft = T0 + lt;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, W, H);
        const scanOn = lt >= SCAN0 && lt <= SCAN1 + 0.12;
        const xs = lt >= SCAN0 ? scanX(lt) : null;
        const read = lt >= SCAN0;                        // left of the head the section reads light
        const glowA = scanOn ? 1 - seg(lt, SCAN1, SCAN1 + 0.12) : 0;
        const len = scanLen(lt);
        g.lineJoin = 'round'; g.lineCap = 'round';
        g.save(); g.beginPath(); g.rect(SHEET[0], 0, SHEET[1] - SHEET[0], H); g.clip();   // the sheet: x 96 .. 1800

        // back profiles, far to near: drafting hidden lines (bone, 1 px, the farther half dashed)
        ENVF.fill(YD);
        for (let k = NP - 1; k >= 1; k--) {
          const st = profile(lt, k), d = st.d;
          for (let i = 0; i < NS; i++) if (YT[i] < ENVF[i]) ENVF[i] = YT[i];
          const a0 = lerp(0.32, 0.10, (k - 1) / (NP - 2)) * clamp(st.hs * 3, 0, 1);
          // occluding fill: the visible top (water as floor) down past the datum
          g.beginPath(); g.moveTo(XS[0], YT[0]);
          for (let i = 1; i < NS; i++) g.lineTo(XS[i], YT[i]);
          g.lineTo(XS[NS - 1], H + 10); g.lineTo(XS[0], H + 10); g.closePath();
          g.fillStyle = C.bg; g.fill();
          // land runs and water runs (bone; the scan's light band still travels through the stack)
          g.lineWidth = 1; g.lineCap = 'butt';
          g.setLineDash(k >= NP / 2 ? [6, 5] : []);
          g.strokeStyle = lineStyle(xs, len, a0, Math.min(1, a0 * 1.3), (0.62 - 0.32 * d) * glowA + a0 * (1 - glowA), bone);
          g.beginPath();
          let pen = false;
          for (let i = 0; i < NS; i++) {
            const land = YG[i] <= YT[i] + 0.01;
            if (land) { if (!pen) { g.moveTo(XS[i], YT[i]); pen = true; } else g.lineTo(XS[i], YT[i]); } else if (pen) { g.lineTo(XS[i], YT[i]); pen = false; }
          }
          g.stroke();
          g.strokeStyle = bone(a0 * 0.6); g.lineWidth = 1;
          g.beginPath(); pen = false;
          for (let i = 0; i < NS; i++) {
            const water = YG[i] > YT[i] + 0.01;
            if (water) { if (!pen) { g.moveTo(XS[Math.max(0, i - 1)], YT[Math.max(0, i - 1)]); pen = true; } g.lineTo(XS[i], YT[i]); } else if (pen) { g.lineTo(XS[i], YT[i]); pen = false; }
          }
          g.stroke();
          g.setLineDash([]);
        }

        // front profile: the cut
        const st0 = profile(lt, 0);
        front.x.set(XS); front.yg.set(YG); front.yt.set(YT);
        g.beginPath(); g.moveTo(XS[0], YT[0]);
        for (let i = 1; i < NS; i++) g.lineTo(XS[i], YT[i]);
        g.lineTo(XS[NS - 1], H + 10); g.lineTo(XS[0], H + 10); g.closePath();
        g.fillStyle = C.bg; g.fill();
        // earth: hatch between the terrain line and the datum, fading down
        const ymin = Math.min(...YG);
        g.save();
        g.beginPath(); g.moveTo(XS[0], YG[0]);
        for (let i = 1; i < NS; i++) g.lineTo(XS[i], YG[i]);
        g.lineTo(XS[NS - 1], YD); g.lineTo(XS[0], YD); g.closePath();
        g.clip();
        const hg = g.createLinearGradient(0, ymin, 0, YD);
        hg.addColorStop(0, amb(0.5)); hg.addColorStop(0.45, amb(0.22)); hg.addColorStop(1, amb(0.06));
        g.strokeStyle = hg; g.lineWidth = 1.4; g.lineCap = 'butt';
        g.stroke(HATCH);
        g.restore();
        // water body in the trough: level line + horizontal water dashes
        g.save();
        g.beginPath();
        let open = false;
        for (let i = 0; i < NS; i++) {
          const wet = YG[i] > YS + 0.01;
          if (wet && !open) { g.moveTo(XS[i], YS); open = true; }
          if (wet) g.lineTo(XS[i], YG[i]);
          if (!wet && open) { g.lineTo(XS[i], YS); g.closePath(); open = false; }
        }
        g.clip();
        g.fillStyle = bone(0.05); g.fillRect(0, YS, W, YD - YS);
        g.strokeStyle = bone(0.5); g.lineWidth = 1.4; g.lineCap = 'butt';
        g.setLineDash([12, 9]);
        for (let y = YS + 12, r = 0; y < YD; y += 12, r++) { g.lineDashOffset = (r % 2) * 12 + lt * 30 * (r % 2 ? 1 : -1); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        g.setLineDash([]);
        g.restore();
        // the sea line across the trough (bone) + the level mark
        g.strokeStyle = bone(0.7 * clamp(st0.hs * 2, 0, 1)); g.lineWidth = 1.5; g.lineCap = 'butt';
        g.beginPath(); open = false;
        for (let i = 0; i < NS; i++) {
          const wet = YG[i] > YS + 0.01;
          if (wet && !open) { g.moveTo(XS[Math.max(0, i - 1)], YS); open = true; }
          if (wet) g.lineTo(XS[i], YS);
          if (!wet && open) { g.lineTo(XS[i], YS); open = false; }
        }
        g.stroke();
        // section line (the cut): amber, read light behind the scan
        g.lineCap = 'round';
        // on the cut the line strikes light (2 f), then settles to amber; behind the scan it reads light
        const strike = 1 - seg(lt, 1 / FPS, 3 / FPS);
        g.lineWidth = 2.6 + 1.2 * strike;
        g.strokeStyle = lineStyle(xs, len, 0.95, 1, 1, read ? (a) => B.rgba(C.amberLight, a) : amb);
        if (!read) g.strokeStyle = strike > 0.5 ? C.amberLight : amb(0.95);
        g.beginPath(); g.moveTo(XS[0], YG[0]);
        for (let i = 1; i < NS; i++) g.lineTo(XS[i], YG[i]);
        g.stroke();
        g.save(); g.globalCompositeOperation = 'lighter';            // a soft bloom under the cut line
        g.strokeStyle = amb(0.07 + 0.08 * strike); g.lineWidth = 9; g.stroke(); g.restore();

        g.restore();
        // sheet edge (left) rises with the datum draw
        // datum + station ticks (draw left to right on the cut)
        const dr = expoOut((lt + 1 / FPS) / 0.35);
        const dx0 = 96, dx1 = lerp(96, 1824, dr);
        g.strokeStyle = amb(0.45); g.lineWidth = 1;
        g.beginPath(); g.moveTo(dx0, YD + 0.5); g.lineTo(dx1, YD + 0.5); g.stroke();
        g.strokeStyle = amb(0.3);
        g.beginPath();
        for (let x = 96; x <= dx1; x += 48) { g.moveTo(x, YD); g.lineTo(x, YD + 6); }
        g.stroke();

        // left sheet edge: from the datum up to the cut line
        {
          const i0 = clamp(Math.round((SHEET[0] - front.x[0]) / DXS), 0, NS - 1), yy = front.yg[i0];
          g.strokeStyle = amb(0.42); g.lineWidth = 1; g.lineCap = 'butt';
          g.beginPath(); g.moveTo(SHEET[0] + 0.5, YD); g.lineTo(SHEET[0] + 0.5, lerp(YD, yy, dr)); g.stroke();
        }
        // elevation ruler at the right edge (rises from the datum with the datum draw)
        {
          const rx = 1800, yTop = YD - (YD - (YS - 300)) * dr;
          g.strokeStyle = amb(0.42); g.lineWidth = 1; g.lineCap = 'butt';
          g.beginPath(); g.moveTo(rx + 0.5, YD); g.lineTo(rx + 0.5, yTop); g.stroke();
          g.strokeStyle = amb(0.3); g.beginPath();
          for (let y = YS, j = 0; y >= yTop; y -= 25, j++) { const L = j % 4 === 0 ? 14 : 6; g.moveTo(rx, y + 0.5); g.lineTo(rx - L, y + 0.5); }
          for (let y = YS + 25, j = 1; y <= YD; y += 25, j++) { const L = j % 4 === 0 ? 14 : 6; g.moveTo(rx, y + 0.5); g.lineTo(rx - L, y + 0.5); }
          g.stroke();
          if (dr > 0.3) { g.fillStyle = bone(0.8); g.beginPath(); g.moveTo(rx + 6, YS - 7); g.lineTo(rx + 6, YS + 7); g.lineTo(rx - 4, YS); g.closePath(); g.fill(); }
        }

        // station lines + markers
        const pAx = XA, pGx = GX, pVx = XV;
        const yA = YS - (hA - SEA) * VS * st0.hs, yV = YS - (hV - SEA) * VS * st0.hs;
        let bedY = YS; for (let i = wa; i <= wb; i++) bedY = Math.max(bedY, front.yg[i]);   // the trough's floor
        g.setLineDash([2, 6]); g.strokeStyle = bone(0.28); g.lineWidth = 1;
        g.beginPath();
        [[pAx, yA], [pVx, yV]].forEach(([x, y]) => { g.moveTo(x, y + 8); g.lineTo(x, YD); });
        g.moveTo(pGx, bedY + 6); g.lineTo(pGx, YD);
        g.stroke(); g.setLineDash([]);
        g.strokeStyle = amb(0.6); g.beginPath();
        [pAx, pGx, pVx].forEach((x) => { g.moveTo(x, YD); g.lineTo(x, YD + 8); });
        g.stroke();

        // Atlas: pillar + diamond (pops on 0.07, flashes when read)
        const mA = expoOut((lt - 0.07) / (6 / FPS));
        const flA = Math.max(0, 1 - Math.abs(lt - TC.A) / 0.12) * (lt >= SCAN0 ? 1 : 0);
        if (mA > 0) {
          const ph = 58 * mA, top = yA - ph;
          const pg = g.createLinearGradient(0, yA, 0, top);
          pg.addColorStop(0, amb(0.1)); pg.addColorStop(1, ambL(0.95));
          g.strokeStyle = pg; g.lineWidth = 2; g.lineCap = 'butt';
          g.beginPath(); g.moveTo(pAx, yA - 3); g.lineTo(pAx, top); g.stroke();
          const s = 12 * (0.4 + 0.6 * mA) * (1 + 0.3 * flA);
          g.fillStyle = flA > 0.05 ? C.amberLight : C.amber;
          g.beginPath(); g.moveTo(pAx, top - s); g.lineTo(pAx + s, top); g.lineTo(pAx, top + s); g.lineTo(pAx - s, top); g.closePath(); g.fill();
          if (flA > 0) { g.fillStyle = ambL(0.25 * flA); g.beginPath(); g.arc(pAx, top, 34, 0, Math.PI * 2); g.fill(); }
          labA.style.transform = `translate(${(pAx + 24).toFixed(1)}px, ${(top - 11).toFixed(1)}px)`;
        }
        // the gate spanning the trough (front elevation): the deck bears on both banks (WL-8 .. WR+8 at YS-16 /
        // YS-10), four piers evenly across the wet run (the end ones are the abutments against the banks), three
        // leaves between them. Everything is clipped to the air above the section line, so the body fills the
        // trough exactly and nothing crosses the cut line or the hatch. It rises from the floor (6 f expo.out).
        const mG = expoOut((lt - 0.13) / (6 / FPS));
        if (mG > 0) {
          const deckT = YS - 16, top = lerp(bedY + 2, deckT, mG), span = WR - WL;
          g.save();
          g.beginPath();
          const i0 = Math.max(0, wa - 12), i1 = Math.min(NS - 1, wb + 12);
          g.moveTo(front.x[i0], 0);
          for (let i = i0; i <= i1; i++) g.lineTo(front.x[i], front.yg[i] - 0.8);
          g.lineTo(front.x[i1], 0); g.closePath(); g.clip();
          g.fillStyle = C.bg; g.fillRect(WL - 10, top, span + 20, bedY + 6 - top);
          const PX = [0, 1, 2, 3].map((j) => WL + span * j / 3), PW = 9;
          g.fillStyle = amb(0.16);
          for (let j = 0; j < 3; j++) { const x0 = PX[j] + PW / 2 + 3, x1 = PX[j + 1] - PW / 2 - 3; g.fillRect(x0, top + 10, x1 - x0, Math.max(0, bedY + 4 - top - 10)); }
          g.strokeStyle = C.amber; g.lineWidth = 2; g.lineCap = 'butt';
          g.beginPath();
          for (const x of PX) g.rect(x - PW / 2, top + 6, PW, bedY + 8 - top);
          g.moveTo(WL - 8, top); g.lineTo(WR + 8, top);
          g.moveTo(WL - 8, top + 6); g.lineTo(WR + 8, top + 6);
          g.stroke();
          g.restore();
          labG.style.transform = `translate(${(pGx - labG.offsetWidth / 2).toFixed(1)}px, ${LAB_T.toFixed(1)}px)`;
          // the water level mark (surveyor's symbol: inverted triangle on the water line, two short bars under
          // it) on the downstream water behind the gate, clear of the deck
          if (LVL) {
            g.fillStyle = bone(0.85 * mG);
            g.beginPath(); g.moveTo(LVL.x - 6, LVL.y - 11); g.lineTo(LVL.x + 6, LVL.y - 11); g.lineTo(LVL.x, LVL.y - 1); g.closePath(); g.fill();
            g.strokeStyle = bone(0.7 * mG); g.lineWidth = 1.5; g.lineCap = 'butt';
            g.beginPath(); g.moveTo(LVL.x - 7, LVL.y + 4.5); g.lineTo(LVL.x + 7, LVL.y + 4.5); g.moveTo(LVL.x - 3.5, LVL.y + 8.5); g.lineTo(LVL.x + 3.5, LVL.y + 8.5); g.stroke();
          }
        }
        const pgU = (lt - TC.G) / 0.6;
        if (lt >= SCAN0 && pgU >= 0 && pgU <= 1) {
          pingG.setAttribute('cx', pGx.toFixed(1)); pingG.setAttribute('cy', (YS - 14).toFixed(1));
          pingG.setAttribute('r', (20 + 120 * (1 - Math.pow(1 - pgU, 2.2))).toFixed(2));
          pingG.setAttribute('opacity', (0.8 * (1 - pgU)).toFixed(3));
        } else pingG.setAttribute('opacity', '0');

        // Vega: the ring (carried from s07), on a pillar over the summit
        const PHV = 116, RV = 30;
        const tgt = { x: pVx, y: yV - PHV, r: RV, w: 2.5, a: 1 };
        const src = { x: RING07.x, y: RING07.y, r: ringR07(ft), w: RING07.w, a: RING07.a };
        const uin = expoOut(lt / (8 / FPS)), uout = p3io(seg(lt, 1.5 - 7 / FPS, 1.5 - 1 / FPS));
        const mix = (k) => lerp(lerp(src[k], tgt[k], uin), src[k], uout);
        const rx = mix('x'), ry = mix('y'), rr = mix('r');
        ring.setAttribute('cx', rx.toFixed(2)); ring.setAttribute('cy', ry.toFixed(2)); ring.setAttribute('r', rr.toFixed(2));
        ring.setAttribute('stroke-width', mix('w').toFixed(2)); ring.setAttribute('opacity', mix('a').toFixed(3));
        const pv = uin * (1 - uout);
        if (pv > 0.01) {
          const top = ry + rr;
          const pg = g.createLinearGradient(0, yV, 0, top);
          pg.addColorStop(0, B.rgba(C.rival, 0.1)); pg.addColorStop(1, B.rgba(C.rival, 0.9 * pv));
          g.strokeStyle = pg; g.lineWidth = 2; g.lineCap = 'butt';
          g.beginPath(); g.moveTo(pVx, yV - 3); g.lineTo(pVx, Math.min(yV - 3, top)); g.stroke();
          g.fillStyle = C.rival; g.beginPath(); g.arc(rx, ry, 5 * pv, 0, Math.PI * 2); g.fill();
        }
        labV.style.opacity = (1 - uout).toFixed(3);
        labV.style.transform = `translate(${(rx + rr + 16).toFixed(1)}px, ${(ry - 11).toFixed(1)}px)`;
        const pvU = (lt - TC.V) / 0.6;
        if (lt >= SCAN0 && pvU >= 0 && pvU <= 1) {
          pingV.setAttribute('cx', rx.toFixed(1)); pingV.setAttribute('cy', ry.toFixed(1));
          pingV.setAttribute('r', (RV + 70 * (1 - Math.pow(1 - pvU, 2.2))).toFixed(2));
          pingV.setAttribute('opacity', (0.75 * (1 - pvU)).toFixed(3));
        } else pingV.setAttribute('opacity', '0');

        // the reading line
        if (scanOn && xs != null) {
          const yTop = envAt(xs) - 40;
          // the glow trails the head on the cut face only (section line down to the datum), its length set by
          // the head's speed: amber 0.18 at the head falling to 0
          const gw = g.createLinearGradient(xs - len, 0, xs, 0);
          gw.addColorStop(0, amb(0)); gw.addColorStop(1, amb(0.18 * glowA));
          g.save();
          g.beginPath(); g.moveTo(front.x[0], front.yg[0]);
          for (let i = 1; i < NS; i++) g.lineTo(front.x[i], front.yg[i]);
          g.lineTo(front.x[NS - 1], YD); g.lineTo(front.x[0], YD); g.closePath(); g.clip();
          g.fillStyle = gw; g.fillRect(xs - len, 0, len, YD);
          g.restore();
          g.strokeStyle = ambL(0.95 * glowA); g.lineWidth = 2; g.lineCap = 'butt';
          g.beginPath(); g.moveTo(xs, yTop); g.lineTo(xs, YD + 8); g.stroke();
          // the read point on the section line
          const i = clamp(Math.round((xs - front.x[0]) / DXS), 0, NS - 1);
          const yy = front.yg[i];
          g.fillStyle = ambL(0.25 * glowA); g.beginPath(); g.arc(xs, yy, 16, 0, Math.PI * 2); g.fill();
          g.fillStyle = ambL(glowA); g.beginPath(); g.arc(xs, yy, 5, 0, Math.PI * 2); g.fill();
        }
      });
    },
  });
})();
