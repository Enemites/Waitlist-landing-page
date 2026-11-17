/* c10-holds (film 60.0-64.0, 4.0 s; local 0 = film 60.0). THE PAYOFF. "See whose strategy holds."
 * (w15 at 60.3: see 60.30, whose 60.56, strategy 60.82, holds 61.26).
 *
 * Dark space. The two plans are two ribbons of light (amber = Atlas, red-orange = Vega) racing out of the
 * camera toward one objective, with speed lines streaming from it. The objective sits exactly where the
 * full stop of the headline will be: when the line sets, the objective point IS its period.
 *   0.00  PAYOFF hit: the cut lands mid-jump (speed lines at full stretch for 3 frames), objective punch-in
 *   0.00-1.00  the race: amber leads, red-orange surges; both heads reach the objective on 1.00 (61.0)
 *   1.00  impact: white core flash, amber + red-orange + ink rings, spark rays; FREEZE (speed lines die,
 *         the ribbons hold as dimmed trails); 'See whose' / 'strategy' rise (1.00 / 1.06 / 1.10)
 *   1.26  'holds' punches in on the VO word; the point pulses as the period
 *   1.30-3.20  calm drift: a slow pull-back around the point
 *   2.85  the line drops out; the trails fade
 *   2.95-3.95  the point glides to frame centre and becomes the seed point (THE NODE look: core 6 / ring 12,
 *         glow .35; its pulse runs on film time, so it continues across the 64.0 cut into c11)
 */
(function () {
  'use strict';
  const ID = 'c10-holds';
  const C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const smooth = (a, b, x) => { const u = seg(x, a, b); return u * u * (3 - 2 * u); };
  const EZ = {};
  const ez = (n) => EZ[n] || (EZ[n] = gsap.parseEase(n));
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const rgba = (c, a) => { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; };

  const T_HIT = 1.0, T_HOLDS = 1.26, T_OUT = 2.85, T_GO = 2.95, T_END = 3.95;
  const SIZE = 164;                          // headline px
  const X0 = 150;                            // ink edge of the headline
  const BASE1 = 492, LEAD = 170;             // baselines
  const HEAD_FONT = `620 ${SIZE}px "Manrope Variable"`;
  const CENTRE = [960, 540];

  // ---- type measurement (canvas measureText with the CSS tracking) ----
  const MCV = document.createElement('canvas').getContext('2d');
  function ink(text) {
    MCV.font = HEAD_FONT; MCV.letterSpacing = (-0.055 * SIZE).toFixed(2) + 'px';
    const m = MCV.measureText(text);
    return { left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, w: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent };
  }
  function baselineOffset(el) {
    const probe = document.createElement('span');
    Object.assign(probe.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
    el.appendChild(probe);
    const off = probe.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.removeChild(probe);
    return off;
  }

  Film.scene({
    id: ID,
    duration: 4,
    build(ctx) {
      const { root, tl } = ctx;
      root.style.background = C.bg;
      ctx.css(`
        [data-scene="${ID}"] .c10-layer { position:absolute; left:0; top:0; width:${W}px; height:${H}px; }
        [data-scene="${ID}"] .c10-line { position:absolute; left:0; top:0; white-space:nowrap; overflow:hidden; padding:0 .08em .2em; margin:0 -.08em;
          font: 620 ${SIZE}px/1 var(--display); letter-spacing:-0.055em; }
        [data-scene="${ID}"] .c10-line span { display:inline-block; }
      `);

      // ---- where the period of 'strategy holds.' sits: the objective ----
      const L2 = 'strategy holds';
      const m2 = ink(L2), mDot = ink('.'), mWithDot = ink(L2 + '.');
      const lineLeft = X0 - ink('See whose').left;          // both lines share the ink edge of the 'S'
      const BASE2 = BASE1 + LEAD;
      const dotCx = lineLeft + (mWithDot.w - mDot.w) + (mDot.left + mDot.right) / 2 + (-0.055 * SIZE) * 0;
      const dotR = (mDot.right + mDot.left) / 2;
      const dotCy = BASE2 - mDot.asc / 2;
      const O = [dotCx, dotCy];                             // THE OBJECTIVE / THE PERIOD

      const { g } = ctx.canvas();
      const typeLayer = ctx.el('div', 'c10-layer', root);
      typeLayer.style.transformOrigin = `${O[0]}px ${O[1]}px`;
      const svg = ctx.svg('svg', { class: 'brand-svg' }, root);

      // ---------------- the two ribbons ----------------
      // screen-space cubic Beziers from beyond the frame edge (near the camera: wide) into the objective
      // (far: thin). s = 0..1 along the path; the head runs ahead, the band trails to the edge.
      const RIB = [
        { col: C.amber, light: C.amberLight, P: [[-260, 250], [380, 40], [700, 860], null], w0: 92, twist: 0.2, s0: 0.1, pw: 1.25 },
        { col: C.rival, light: C.rivalLight, P: [[2160, 1060], [1820, 1240], [1560, 300], null], w0: 82, twist: 1.6, s0: 0.03, pw: 1.9 },
      ];
      RIB.forEach((R) => { R.P[3] = O; });
      function pathAt(R, s, t) {
        const [p0, p1, p2, p3] = R.P, v = 1 - s;
        const x = v * v * v * p0[0] + 3 * v * v * s * p1[0] + 3 * v * s * s * p2[0] + s * s * s * p3[0];
        const y = v * v * v * p0[1] + 3 * v * v * s * p1[1] + 3 * v * s * s * p2[1] + s * s * s * p3[1];
        const wob = 26 * v * v * Math.sin(s * 9 + t * 5 + R.twist);
        return [x + wob * 0.6, y + wob];
      }
      const headS = (R, t) => (t >= T_HIT ? 1 : R.s0 + (1 - R.s0) * Math.pow(clamp(t / T_HIT, 0, 1), R.pw));
      function drawRibbon(R, t, alpha, frozenT) {
        const tt = frozenT != null ? frozenT : t;
        const sh = headS(R, tt);
        const N = 96;
        const pts = [], nor = [], hw = [], al = [];
        for (let i = 0; i <= N; i++) pts.push(pathAt(R, sh * i / N, tt));
        for (let i = 0; i <= N; i++) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
          const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
          nor.push([-dy / l, dx / l]);
          const s = sh * i / N;
          const tw = 0.14 + 0.86 * Math.abs(Math.cos(s * Math.PI * 2.4 + R.twist + tt * 3.1));
          hw.push((R.w0 * Math.pow(1 - s, 1.05) + 2.4) * tw);
          al.push(alpha * (0.3 + 0.7 * smooth(sh - 0.6, sh, s)));
        }
        g.globalCompositeOperation = 'lighter';
        for (let pass = 0; pass < 2; pass++) {
          const wk = pass === 0 ? 2.4 : 1, ak = pass === 0 ? 0.09 : 0.36;
          for (let i = 0; i < N; i++) {
            const a = pts[i], b = pts[i + 1], na = nor[i], nb = nor[i + 1];
            const ha = hw[i] * wk, hb = hw[i + 1] * wk;
            g.fillStyle = rgba(R.col, (al[i] * ak).toFixed(3));
            g.beginPath();
            g.moveTo(a[0] + na[0] * ha, a[1] + na[1] * ha); g.lineTo(b[0] + nb[0] * hb, b[1] + nb[1] * hb);
            g.lineTo(b[0] - nb[0] * hb, b[1] - nb[1] * hb); g.lineTo(a[0] - na[0] * ha, a[1] - na[1] * ha);
            g.closePath(); g.fill();
          }
        }
        const line = (off, col, w, aMul) => {
          for (let i = 0; i < N; i += 3) {
            const j = Math.min(N, i + 3);
            g.strokeStyle = rgba(col, Math.min(1, al[i] * aMul).toFixed(3)); g.lineWidth = w;
            g.beginPath();
            for (let k = i; k <= j; k++) { const p = pts[k], n = nor[k], h = hw[k] * off; k === i ? g.moveTo(p[0] + n[0] * h, p[1] + n[1] * h) : g.lineTo(p[0] + n[0] * h, p[1] + n[1] * h); }
            g.stroke();
          }
        };
        line(1, R.light, 1.6, 0.8); line(-1, R.light, 1.6, 0.8);
        line(0, R.light, 2.6, 1.1);
        g.globalCompositeOperation = 'source-over';
        return pts[N];
      }

      // ---------------- speed lines (from the objective, outward) ----------------
      const r = ctx.rng(ID + ':speed');
      const SPEED = Array.from({ length: 190 }, () => ({ a: r() * Math.PI * 2, ph: r(), v: r.range(0.75, 1.3), w: r.range(1, 2.2), amber: r() < 0.16, lenk: r.range(0.18, 0.42) }));
      const speedTravel = (t) => (t < 0 ? t * 3.2 : 3.2 * t + 1.6 * t * t);   // accelerating into the objective
      function drawSpeed(t, a) {
        if (a <= 0.001) return;
        const R0 = 40, R1 = 1500, LN = Math.log(R1 / R0);
        const jump = 1 - seg(t, 0.0, 0.12);                  // the hit frames: streaks at full stretch
        g.lineCap = 'round';
        for (const sp of SPEED) {
          const u = ((sp.ph + speedTravel(t) * sp.v * 0.35) % 1 + 1) % 1;
          const rr = R0 * Math.exp(u * LN);
          const len = rr * (sp.lenk + 0.9 * jump);
          const r0 = Math.max(10, rr - len);
          const ca = Math.cos(sp.a), sa = Math.sin(sp.a);
          const aa = a * Math.min(1, u * 2.2) * (0.55 + 0.45 * jump);
          g.strokeStyle = sp.amber ? rgba(C.amberLight, (0.75 * aa).toFixed(3)) : rgba(C.bone, (0.55 * aa).toFixed(3));
          g.lineWidth = sp.w * (0.6 + 0.8 * u);
          g.beginPath(); g.moveTo(O[0] + ca * r0, O[1] + sa * r0); g.lineTo(O[0] + ca * rr, O[1] + sa * rr); g.stroke();
        }
      }

      // ---------------- the objective (before the impact) + burst ----------------
      function ring(x, y, rr, col, w, a) { if (a <= 0.001 || rr <= 0) return; g.strokeStyle = rgba(col, a.toFixed(3)); g.lineWidth = w; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.stroke(); }
      function drawObjective(t) {
        if (t >= T_HIT) return;
        const punch = 1 + 0.6 * (1 - ez('expo.out')(seg(t, 0, 0.35)));
        const close = seg(t, 0.6, T_HIT);
        const rr = 34 * punch * (1 - 0.25 * close);
        g.setLineDash([5, 8]);
        g.lineDashOffset = -t * 40;
        ring(O[0], O[1], rr * 1.8, C.amber, 2, 0.75);
        g.setLineDash([]);
        ring(O[0], O[1], rr, C.amber, 2.6, 0.95);
        // tick marks
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2 + t * 0.8, r0 = rr * 2.2, r1 = rr * 2.6;
          g.strokeStyle = rgba(C.amber, 0.8); g.lineWidth = 2;
          g.beginPath(); g.moveTo(O[0] + Math.cos(a) * r0, O[1] + Math.sin(a) * r0); g.lineTo(O[0] + Math.cos(a) * r1, O[1] + Math.sin(a) * r1); g.stroke();
        }
      }
      const SPARK = Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * Math.PI * 2 + r.range(-0.08, 0.08), v: r.range(0.6, 1.2), col: i % 3 === 0 ? C.rival : i % 3 === 1 ? C.amberLight : C.ink }));
      function drawBurst(t) {
        const u = t - T_HIT;
        if (u < 0 || u > 1.6) return;
        g.globalCompositeOperation = 'lighter';
        // core flash
        const f = Math.exp(-u * 9);
        if (f > 0.01) {
          const R = 70 + 420 * (1 - Math.exp(-u * 10));
          const gr = g.createRadialGradient(O[0], O[1], 0, O[0], O[1], R);
          gr.addColorStop(0, rgba(C.ink, 0.95 * f)); gr.addColorStop(0.3, rgba(C.amberLight, 0.5 * f)); gr.addColorStop(1, rgba(C.amber, 0));
          g.fillStyle = gr; g.fillRect(O[0] - R, O[1] - R, R * 2, R * 2);
        }
        g.globalCompositeOperation = 'source-over';
        const e = (d) => ez('expo.out')(clamp(u / d, 0, 1));
        ring(O[0], O[1], 16 + 560 * e(0.75), C.amber, 3, 0.95 * (1 - clamp(u / 0.75, 0, 1)));
        ring(O[0], O[1], 16 + 400 * e(0.62), C.rival, 2.6, 0.9 * (1 - clamp((u) / 0.62, 0, 1)));
        ring(O[0], O[1], 16 + 980 * e(1.2), C.ink, 1.5, 0.45 * (1 - clamp(u / 1.2, 0, 1)));
        // spark rays
        g.lineCap = 'round';
        for (const sp of SPARK) {
          const k = clamp(u / (0.5 * sp.v), 0, 1);
          if (k >= 1) continue;
          const r0 = 26 + 300 * sp.v * ez('expo.out')(k), r1 = r0 + 60 * (1 - k) * sp.v;
          g.strokeStyle = rgba(sp.col, (0.9 * (1 - k)).toFixed(3)); g.lineWidth = 2.2;
          g.beginPath(); g.moveTo(O[0] + Math.cos(sp.a) * r0, O[1] + Math.sin(sp.a) * r0); g.lineTo(O[0] + Math.cos(sp.a) * r1, O[1] + Math.sin(sp.a) * r1); g.stroke();
        }
      }

      // ---------------- the headline ----------------
      function line(text, base, color) {
        const el = ctx.el('div', 'c10-line', typeLayer);
        el.style.color = color;
        const words = text.split(' ').map((w, i) => { if (i) el.appendChild(document.createTextNode(' ')); return ctx.el('span', '', el, w); });
        el.style.left = lineLeft.toFixed(2) + 'px';   // text origin (the mask's -.08em margin and .08em padding cancel)
        el.style.top = (base - baselineOffset(el)).toFixed(2) + 'px';
        return { el, words };
      }
      const l1 = line('See whose', BASE1, C.ink);
      const l2 = line('strategy holds', BASE2, C.amber);
      tl.fromTo(l1.words, { yPercent: 140 }, { yPercent: 0, duration: 0.62, ease: 'expo.out', stagger: 0.06 }, T_HIT);
      tl.fromTo(l2.words[0], { yPercent: 140 }, { yPercent: 0, duration: 0.62, ease: 'expo.out' }, T_HIT + 0.1);
      tl.fromTo(l2.words[1], { yPercent: 140, scale: 1.12, transformOrigin: '100% 100%' }, { yPercent: 0, scale: 1, duration: 0.5, ease: 'expo.out' }, T_HOLDS - 2 / FPS);
      // exit: the words drop out of their masks
      tl.to([...l1.words, ...l2.words], { yPercent: 140, duration: 0.42, ease: 'power3.in', stagger: 0.045 }, T_OUT);
      // calm drift: slow pull-back around the point
      const drift = { s: 1 };
      tl.fromTo(drift, { s: 1 }, { s: 0.95, duration: T_OUT + 0.4 - (T_HIT + 0.3), ease: 'sine.inOut', immediateRender: false }, T_HIT + 0.3);

      // ---------------- the point (THE NODE), the objective's core and the headline's period ----------------
      const pTo = { u: 0 };
      tl.fromTo(pTo, { u: 0 }, { u: 1, duration: T_END - T_GO, ease: 'power2.inOut', immediateRender: false }, T_GO);
      const sPeriod = dotR / 6;
      // the point's proxy is set in an onFrame registered BEFORE NodeMark's own, so the mark draws this frame
      const P = { x: O[0], y: O[1], s: sPeriod, a: 1, glow: 0.5, pulse: 0 };
      ctx.onFrame((t) => {
        const u = pTo.u;
        P.x = lerp(O[0], CENTRE[0], u); P.y = lerp(O[1], CENTRE[1], u);
        const holdPunch = t >= T_HOLDS ? 0.35 * Math.exp(-(t - T_HOLDS) * 9) : 0;
        const preHit = t < T_HIT ? 1.15 : 1;
        P.s = lerp(sPeriod, 1, ez('power2.inOut')(seg(t, T_GO + 0.2, T_END))) * (1 + holdPunch) * preHit;
        P.glow = t < T_HIT ? 0.5 : lerp(0.5, 0.35, seg(t, T_GO, T_END));
        P.pulse = t >= T_GO - 0.1 ? 1 : 0;
        if (N) Object.assign(N.p, P);
      });
      let N = null;
      N = NodeMark.create(ctx, { parent: svg, x: O[0], y: O[1], s: sPeriod, glow: 0.5 });

      ctx.onFrame((t) => {
        // ---- canvas ----
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
        const sc = t < T_HIT + 0.3 ? 1 : drift.s;
        g.setTransform(sc, 0, 0, sc, O[0] * (1 - sc), O[1] * (1 - sc));
        // warm pool around the objective
        const pool = g.createRadialGradient(O[0], O[1], 0, O[0], O[1], 760);
        const pa = (0.5 + 0.5 * smooth(0, T_HIT, t)) * (1 - smooth(T_OUT, T_END - 0.3, t));
        pool.addColorStop(0, `rgba(30,23,15,${(0.8 * pa).toFixed(3)})`); pool.addColorStop(1, 'rgba(11,12,14,0)');
        g.fillStyle = pool; g.fillRect(-200, -200, W + 400, H + 400);
        // speed lines: race, then FREEZE on impact
        const spA = t < T_HIT ? 1 : 1 - seg(t, T_HIT, T_HIT + 0.12);
        drawSpeed(Math.min(t, T_HIT), spA);
        // camera shake during the race
        const shk = t < T_HIT ? 2.2 * smooth(0.3, T_HIT, t) : 0;
        if (shk > 0) { const nz = Math.sin(t * 71.3) * Math.cos(t * 43.1); g.translate(shk * nz, shk * Math.sin(t * 57.7)); }
        // ribbons: race, then frozen trails dimming behind the line, then gone
        const ribA = t < T_HIT ? 1 : lerp(1, 0.34, ez('power2.out')(seg(t, T_HIT + 0.05, T_HIT + 0.6))) * (1 - seg(t, T_OUT - 0.2, T_OUT + 0.5));
        if (ribA > 0.002) for (const R of RIB) drawRibbon(R, t, ribA, t >= T_HIT ? T_HIT : null);
        // comet heads (race only)
        if (t < T_HIT) for (const R of RIB) {
          const hp = pathAt(R, headS(R, t), t);
          const gr = g.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], 70);
          gr.addColorStop(0, rgba(C.ink, 0.9)); gr.addColorStop(0.25, rgba(R.light, 0.55)); gr.addColorStop(1, rgba(R.col, 0));
          g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(hp[0] - 70, hp[1] - 70, 140, 140); g.globalCompositeOperation = 'source-over';
        }
        drawObjective(t);
        drawBurst(t);
        g.setTransform(1, 0, 0, 1, 0, 0);

        // ---- type layer drift ----
        typeLayer.style.transform = sc === 1 ? '' : `scale(${sc.toFixed(5)})`;

        // ---- the point (proxy set above; here only the ring/core attributes NodeMark does not own) ----
        // the ring is hidden while the point is a full stop; it comes back as the point becomes the seed
        const ringA = smooth(T_GO + 0.25, T_END - 0.1, t);
        N.ring.setAttribute('opacity', ringA.toFixed(3));
        N.core.setAttribute('r', (6 * lerp(1.0, 1, ringA)).toFixed(2));
      });
      // the period pulse on 'holds' (a ring around the full stop)
      const hp = ctx.svg('circle', { fill: 'none', stroke: C.amberLight, 'stroke-width': 2, opacity: 0 }, svg);
      ctx.onFrame((t) => {
        const u = (t - T_HOLDS) / 0.7;
        if (u < 0 || u > 1) { hp.setAttribute('opacity', 0); return; }
        const sc = t < T_HIT + 0.3 ? 1 : drift.s;
        hp.setAttribute('cx', O[0]); hp.setAttribute('cy', O[1]);
        hp.setAttribute('r', (dotR + 70 * ez('expo.out')(u) * sc).toFixed(2));
        hp.setAttribute('opacity', (0.8 * (1 - u)).toFixed(3));
      });
    },
  });
})();
