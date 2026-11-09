/* x08-contest (film 41.0-42.25): revision v3 round 3 insert, THE RIVAL SCAN. Local 0 = 41.0.
 * Hides the static wide s08 UI (Vega out of the fog, CONTESTED, their route) right before the hook
 * callback. Spec: docs/revision-v3.md, "Round 3".
 *
 * The one red-led frame of the film: Vega's polar radar on charcoal. Everything is rival red-orange
 * except the crossing glyph (the bridge capsule), the single amber element.
 *
 * MATCH ON BOTH CUTS: the radar is centred on the bridge exactly where s08 draws it (screen ~1137,392:
 * s08's camera is MATCH at 41.0 and barely moving at 42.25), so the eye sits on the crossing through
 * both hard cuts. On the last frame the two contacts sit on s08's Vega triangles, at their size, with
 * s08's 42.0 pulse rings at the same radius, and contact 2's vector is s08's VEGA_CROSSING route
 * (dashed, chevron) on the same pixels: the cut back to s08 at 42.25 changes the world, not the story.
 *
 * Anatomy: range rings (118 px), a double bezel at r 472 graduated every 2 / 10 / 30 degrees, faint
 * spokes, graduated cardinal axes to the frame edges, outer rings dashed (extrapolated range). The
 * sweep arm (rivalLight) trails a TRUE phosphor: the wedge's brightness at each bearing is the time
 * since the arm crossed it (inverted from the arm's angle function), so the whips smear long and the
 * creeps stay tight; the linework lights up under it. No numbers anywhere (no ranges, bearings, times).
 *
 * The arm's speed is a ramp on the music grid: a creep plus, before every 8th-note ping (41.0 / 41.25 /
 * 41.5 / 41.75 / 42.0, landing on the frames 41.0 / 41.267 / 41.5 / 41.767 / 42.0), an asymmetric whip (long
 * wind-up, short brake) centred 0.035 s before the ping frame. Each 8th is warped to exactly one revolution,
 * so the arm brakes through both contacts and the swept fan is at full size ON the ping frame. The pings
 * escalate: the creep climbs 6 -> 10 -> 16 -> 26 deg a frame (the parked wedge walks round the scope) and
 * the phosphor, the lit linework and the bloom kick get stronger ping by ping, the lock above them all.
 * The ping frame itself flashes (fan + linework). The phosphor is tapered by angle behind the arm as well
 * as by age, so the light hugs the arm.
 * 0.00 (41.0) HARD CUT on the beat: the scope deploys (rings ripple out 0.82 -> 1, expo.out, outer rings
 *      last; the linework is over-exposed and settles in 6 f), a transmit ring leaves the capsule, the
 *      arm whips through both contacts: PING 1, first detection far out (outside the bezel).
 * 0.25 / 0.50 / 0.75 / 1.00 PINGS 2-5: each sweep refreshes the contacts one step closer (radar truth:
 *      the blip jumps when swept, the old one stays as a decaying echo outline on a dashed track),
 *      brackets snap on (expo.out 4 f), a pulse ring opens (s08's Vega pulse: r 18 -> 32.4 product
 *      units, .6 -> 0, 1 s, power2.out) and the scope kicks out with the ground bloom (escalating).
 * 0.483-0.667 'CONTESTED · CROSSING' scrambles in (first glyphs on the 41.5 frame, letters only) on a
 *      callout (leader + rule, expo.out 5 f) off the capsule's lower-left flank.
 * 0.50-0.60 THE CONVERGENCE: both intercept vectors fire from the contacts and accelerate (power2.in)
 *      into the crossing, landing at 0.60 (41.6): the capsule takes the hit (amberLight + glow + a kick).
 * 1.00 (42.0) LOCK: final ping, the contacts land on s08's triangles; a red capsule contour clamps onto
 *      the amber one (56 -> 13 px, expo.out 5 f). The lock over-exposes the scope (42.0 is the brightest
 *      frame of the insert, 42.033 still above every non-ping frame) and the fan burns longer; the arm stops dead and snaps back onto the contacts
 *      (rest 25 deg, between them, expo.out 3 f).
 * 1.067-1.2 release: the scope steps back to 70%, the phosphor goes out, the arm holds at 60% on 42.1 /
 *      42.133 and is gone by 42.2. 1.133-1.233 (power2.in): the frame thins to what s08 shows on the cut
 *      (capsule to 45%, red clamp to 70%, echoes and tracks out, contact 1's vector to 45%); hard cut to
 *      s08 at 42.25 as the alert card starts to lift (first s08 frame 42.267).
 * HUD: s08's corners (inset 72, no ticks) and slug (120, 990), the corners in rival (the POV is Vega's).
 */
(function () {
  'use strict';
  const ID = 'x08-contest';
  const C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const rgba = (c, a) => { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a < 0 ? 0 : a > 1 ? 1 : +a.toFixed(4)})`; };

  // ---- s08's camera on the first frame after the cut (42.2667 = s08 local 8.2667; MATCH -> HOOK from 8.0
  // over 1.5 s, power3.inOut, log-space zoom): every match target below is s08's geometry under it
  const T_CUT = 8.2667;
  const cam = (() => {
    const u = gsap.parseEase('power3.inOut')(clamp01((T_CUT - 8.0) / 1.5));
    const a = Match.CAM.MATCH, b = Match.CAM.HOOK;
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), u)) };
  })();
  const K = cam.zoom * Match.S;                                   // screen px per product unit (~1.205)
  const scr = (px, py) => Match.screenOf(px, py, cam);
  // the bridge (floodgate.js el.crossing: 'M948 340 1060 440M936 352 1048 452'), its centre = the radar centre
  const BR = [[948, 340, 1060, 440], [936, 352, 1048, 452]].map(([a, b, c, d]) => [scr(a, b), scr(c, d)]);
  const CEN = scr(998, 396);
  const CX = CEN[0], CY = CEN[1];
  const AX = Math.atan2(100, 112);                                // bridge axis (41.76 deg)
  const CAP = { w: 192 * K, h: 62 * K };                          // s08's crossing zone capsule (192 x 62, product)
  // Vega on the cut frame (Match.VEGA v1 / v2), triangle 'M0 -12l14 24h-28Z' and s08's pulse ring
  const V1F = scr(Match.VEGA.v1[0], Match.VEGA.v1[1]);
  const V2F = scr(Match.VEGA.v2[0], Match.VEGA.v2[1]);
  const TRI = { top: -12 * K, half: 14 * K, base: 12 * K };
  // contact 2's vector = s08's VEGA_CROSSING route on the cut frame (cubic, product)
  const RT = [[1140, 524], [1110, 500], [1080, 470], [1056, 448]].map(([x, y]) => scr(x, y));

  // ---- radar geometry (screen px)
  const RING = 118, RB = 472;                                     // range ring step, bezel radius (4 rings)
  const RINGS = [];
  for (let r = RING; r < 1380; r += RING) RINGS.push(r);

  const eo = gsap.parseEase('expo.out'), po2 = gsap.parseEase('power2.out'), po3 = gsap.parseEase('power3.out'), p2i = gsap.parseEase('power2.in');

  // ---- the pings and the arm. PINGS are the music's 8ths (local s); VP the frame each one lands on
  // (41.25 / 41.75 fall between frames: 41.267 / 41.767). The arm is a creep plus, before every ping, an
  // ASYMMETRIC whip (long wind-up, short brake) centred LEAD s before the ping frame: it is still slowing as
  // it crosses the contacts and the swept fan is at full size ON the ping frame, not after it.
  const PINGS = [0, 0.25, 0.5, 0.75, 1.0];
  const VP = PINGS.map((p) => Math.ceil(p * FPS - 1e-6) / FPS);
  const T_LOCK = 1.0;
  const LEAD = 0.035, SIG_L = 0.036, SIG_T = 0.018;
  // interval boundaries (each interval ends on a ping frame and is warped to exactly one revolution) and the
  // creep in each (deg a frame): it climbs ping by ping, so the parked wedge walks round the scope (escalation)
  const BND = [-0.75, -0.5, -0.25, 0, VP[1], VP[2], VP[3], VP[4]];
  const CREEP = [6, 6, 6, 6, 10, 16, 26];
  const NORM = Math.sqrt(TAU) / 2 * (SIG_L + SIG_T);             // area of a unit-peak bump (s)
  const AMP = CREEP.map((c, j) => (360 - c * FPS * (BND[j + 1] - BND[j])) / NORM);   // whip peak per interval (deg/s)
  const DT = 0.0005, T0 = -0.75, T1 = 1.4;
  const NT = Math.round((T1 - T0) / DT) + 1;
  const TH = new Float64Array(NT);                                // arm angle table (deg, unwrapped), frozen after the lock
  {
    const speed = (t) => {
      if (t > T_LOCK) return 0;
      let j = 0; while (j < CREEP.length - 1 && t >= BND[j + 1]) j++;
      let sp = CREEP[j] * FPS;
      for (let m = 0; m < CREEP.length; m++) {
        const u = t - (BND[m + 1] - LEAD), s = u < 0 ? SIG_L : SIG_T;
        sp += AMP[m] * Math.exp(-(u * u) / (2 * s * s));
      }
      return sp;
    };
    let acc = 0;
    TH[0] = 0;
    for (let i = 1; i < NT; i++) { const ta = T0 + (i - 1) * DT; acc += 0.5 * (speed(ta) + speed(ta + DT)) * DT; TH[i] = acc; }
    const idx = (t) => Math.round((t - T0) / DT);
    const raw = Float64Array.from(TH);
    for (let j = 0; j < CREEP.length; j++) {                     // warp each interval to exactly 360 deg
      const i0 = idx(BND[j]), i1 = idx(BND[j + 1]);
      const a0 = raw[i0], a1 = raw[i1];
      for (let i = i0; i <= i1; i++) TH[i] = 360 * j + (raw[i] - a0) * 360 / (a1 - a0);
    }
    const iL = idx(T_LOCK);
    for (let i = iL + 1; i < NT; i++) TH[i] = TH[iL];
  }
  const thRaw = (t) => { const f = (clamp01((t - T0) / (T1 - T0))) * (NT - 1); const i = Math.min(NT - 2, Math.floor(f)); return TH[i] + (TH[i + 1] - TH[i]) * (f - i); };
  // offset: on every ping frame the arm has just braked through both contacts (v1 ~ -24 deg, v2 ~ +40)
  const THETA = 46;
  const TH_OFF = THETA - thRaw(0);
  const armDeg = (t) => thRaw(t) + TH_OFF;                         // the scan (phosphor source), stops dead at the lock
  // the drawn arm: after the lock it snaps back onto the contacts (expo.out 3 f) and rests between them
  const REST = 25;
  const A_LOCK = armDeg(T_LOCK), A_REST = A_LOCK - (THETA - REST);
  const armDraw = (t) => (t <= T_LOCK ? armDeg(t) : lerp(A_LOCK, A_REST, eo(clamp01((t - T_LOCK) / (3 / FPS)))));
  // per-ping escalation (pings 1-4, then the lock above them all); a ping's level starts with its whip
  const PH_AMAX = [0.50, 0.58, 0.66, 0.76, 0.88];                 // phosphor wedge strength
  const KICK_G = [1.0, 1.15, 1.3, 1.5, 1.8];                      // ground bloom + scope punch
  const LIT_G = [1.3, 1.45, 1.6, 1.8, 2.0];                       // lit-pass linework gain
  const T_REL = T_LOCK + 2 / FPS;                                 // the release after the lock (42.067)
  const pingIdx = (t) => { let k = 0; for (let i = 1; i < VP.length; i++) if (t >= VP[i] - 0.1) k = i; return k; };
  // inverse: the time the arm was at (unwrapped) angle a; -Infinity before the table
  function tAtDeg(a) {
    const r = a - TH_OFF;
    if (r <= TH[0]) return -Infinity;
    let lo = 0, hi = NT - 1;
    if (r >= TH[hi]) return T1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (TH[m] < r) lo = m; else hi = m; }
    return T0 + (lo + (r - TH[lo]) / (TH[hi] - TH[lo])) * DT;
  }

  // ---- contacts: they step in on each sweep (radar truth), from outside the bezel to s08's triangles
  const STEP = [0, 0.42, 0.68, 0.87, 1];                          // approach per ping (decisive, then arriving)
  const dir1 = Math.atan2(V1F[1] - CY, V1F[0] - CX);
  const R1F = Math.hypot(V1F[0] - CX, V1F[1] - CY), R1S = 640;
  const v2dir = (() => { const dx = RT[0][0] - RT[1][0], dy = RT[0][1] - RT[1][1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; })();  // back along the route's first tangent
  const L2S = 420;                                                 // contact 2 comes in along its route's line
  const CONTACTS = [
    { pos: (k) => { const r = lerp(R1S, R1F, STEP[k]); return [CX + r * Math.cos(dir1), CY + r * Math.sin(dir1)]; } },
    { pos: (k) => { const l = L2S * (1 - STEP[k]); return [V2F[0] + v2dir[0] * l, V2F[1] + v2dir[1] * l]; } },
  ];
  // each contact's ping times: when the arm crosses its bearing (computed from the arm, in [ping - 1 f, ping])
  CONTACTS.forEach((c) => {
    c.steps = VP.map((p, k) => {
      const [x, y] = c.pos(k);
      let b = Math.atan2(y - CY, x - CX) / DEG;
      const a0 = armDeg(p - 0.12);
      while (b < a0) b += 360;
      while (b - 360 >= a0) b -= 360;
      return { k, x, y, b: Math.atan2(y - CY, x - CX) / DEG, t: tAtDeg(b) };
    });
  });

  // ---- the convergence (0.50 -> 0.60, expo.out) and the lock
  const T_VEC = 0.5, T_HIT = 0.6;                                 // vectors fire on the 41.5 ping, accelerate into the hit at 41.6
  const T_LAB = 0.5 - 0.5 / FPS;                                  // label + callout: the first glyphs are up on the 41.5 frame

  Film.scene({
    id: ID,
    duration: 1.25,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`
        [data-scene="${ID}"] .x08c-bg { position:absolute; inset:0;
          background: radial-gradient(circle 860px at ${CX.toFixed(1)}px ${CY.toFixed(1)}px, rgba(221,98,72,.085) 0%, rgba(221,98,72,.03) 53%, rgba(221,98,72,0) 100%), ${C.bg}; }
        [data-scene="${ID}"] .x08c-kick { position:absolute; inset:0; opacity:0;
          background: radial-gradient(circle 700px at ${CX.toFixed(1)}px ${CY.toFixed(1)}px, rgba(221,98,72,.127) 0%, rgba(221,98,72,.036) 55%, rgba(221,98,72,0) 100%); }
        [data-scene="${ID}"] .x08c-slug { position:absolute; left:120px; top:990px; font: 500 20px/20px var(--mono); letter-spacing:.1em; color:${C.muted3}; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .x08c-lab { position:absolute; font: 600 30px/30px var(--mono); letter-spacing:.14em; color:${C.ink}; text-transform:uppercase; white-space:pre; text-align:right;
          text-shadow: 0 0 12px rgba(11,12,14,.95), 0 0 4px rgba(11,12,14,.95), 0 0 2px rgba(11,12,14,1); }
      `);
      ctx.el('div', 'x08c-bg', root);
      const kickEl = ctx.el('div', 'x08c-kick', root);
      const { canvas, g } = ctx.canvas();
      void canvas;
      const OUT_A = 0.28;                                          // phosphor strength outside the bezel
      const KICK_OP = 0.55;                                        // bloom opacity per unit kick (the lock's 1.8 reaches ~1)

      // ---- linework: vector every frame (cheap), so the deploy ripple and the ping kicks stay crisp.
      // paint(al) sets the stroke for an element of base alpha al (a flat rgba for the base pass, a conic
      // gradient for the phosphor-lit pass); rs(i, r) scales ring i (deploy ripple + kicks)
      function lines(gg, paint, wMul, rs) {
        gg.lineCap = 'butt';
        // range rings (inside the bezel solid; outside dashed and fading with range)
        RINGS.forEach((r0, i) => {
          if (r0 === RB) return;
          const r = r0 * rs(i, r0);
          const outside = r0 > RB;
          // outside: 2 px with an alpha floor, so the red survives 4:2:0 (the only structure in the left 40%)
          paint(outside ? 0.30 * Math.max(0.55, 1 - (r0 - RB) / 1000) : 0.42); gg.lineWidth = (outside ? 2 : 1.5) * wMul;
          gg.setLineDash(outside ? [12, 9] : []);
          gg.beginPath(); gg.arc(CX, CY, r, 0, TAU); gg.stroke();
        });
        gg.setLineDash([]);
        // the bezel: double ring + graduations (2 / 10 / 30 deg), drawn inward; 30s also break outward
        const rb = RB * rs(3, RB);
        paint(0.8); gg.lineWidth = 2 * wMul;
        gg.beginPath(); gg.arc(CX, CY, rb, 0, TAU); gg.stroke();
        paint(0.5); gg.lineWidth = 1.5 * wMul;
        gg.beginPath(); gg.arc(CX, CY, rb + 12, 0, TAU); gg.stroke();
        paint(0.62); gg.lineWidth = 1.4 * wMul;
        gg.beginPath();
        for (let d = 0; d < 360; d += 2) {
          if (d % 10 === 0) continue;
          const c = COS[d], sn = SIN[d];
          gg.moveTo(CX + c * (rb - 9), CY + sn * (rb - 9)); gg.lineTo(CX + c * rb, CY + sn * rb);
        }
        gg.stroke();
        paint(0.85); gg.lineWidth = 2 * wMul;
        gg.beginPath();
        for (let d = 0; d < 360; d += 10) {
          const c = COS[d], sn = SIN[d];
          const r0 = d % 30 === 0 ? rb - 30 : rb - 18, r1 = d % 30 === 0 ? rb + 22 : rb;
          gg.moveTo(CX + c * r0, CY + sn * r0); gg.lineTo(CX + c * r1, CY + sn * r1);
        }
        gg.stroke();
        // spokes every 30 deg (inside the bezel), off the glyph
        paint(0.2); gg.lineWidth = 1.3 * wMul;
        gg.beginPath();
        for (let d = 0; d < 360; d += 30) {
          if (d % 90 === 0) continue;
          const c = COS[d], sn = SIN[d];
          gg.moveTo(CX + c * 150, CY + sn * 150); gg.lineTo(CX + c * (rb - 34), CY + sn * (rb - 34));
        }
        gg.stroke();
        // cardinal axes to the frame edges, graduated every half ring (they ride the scope scale)
        const k = rb / RB;
        paint(0.34); gg.lineWidth = 1.5 * wMul;
        gg.beginPath();
        gg.moveTo(0, CY); gg.lineTo(CX - 150, CY); gg.moveTo(CX + 150, CY); gg.lineTo(W, CY);
        gg.moveTo(CX, 0); gg.lineTo(CX, CY - 150); gg.moveTo(CX, CY + 150); gg.lineTo(CX, H);
        gg.stroke();
        paint(0.42); gg.lineWidth = 1.5 * wMul;
        gg.beginPath();
        for (let r0 = RING / 2; r0 < 1400; r0 += RING / 2) {
          const r = r0 * k;
          if (r < 150) continue;
          const L = (Math.round(r0 / (RING / 2)) % 2 === 0) ? 9 : 5;
          if (CX - r > 0) { gg.moveTo(CX - r, CY - L); gg.lineTo(CX - r, CY + L); }
          if (CX + r < W) { gg.moveTo(CX + r, CY - L); gg.lineTo(CX + r, CY + L); }
          if (CY - r > 0) { gg.moveTo(CX - L, CY - r); gg.lineTo(CX + L, CY - r); }
          if (CY + r < H) { gg.moveTo(CX - L, CY + r); gg.lineTo(CX + L, CY + r); }
        }
        gg.stroke();
      }
      const COS = [], SIN = [];
      for (let d = 0; d < 360; d++) { COS.push(Math.cos(d * DEG)); SIN.push(Math.sin(d * DEG)); }

      // ---- the phosphor: alpha behind the arm from the time since it crossed each bearing. One table per
      // frame (age per stop) feeds two conic gradients: the wedge fill (rival) and the lit linework (rivalLight)
      const NST = 90;
      const AGE = new Float64Array(NST + 1);
      function phosphor(t) {
        const a = armDraw(t);                                      // (after the lock the fan's edge follows the arm back)
        let dMax = 0;
        for (let i = 0; i <= NST; i++) {
          const d = 360 * (1 - i / NST);
          const age = t - tAtDeg(a - d - 1e-7);                    // (frozen after the lock: everything only ages)
          AGE[i] = age;
          if (age >= 0 && age < 0.5) dMax = Math.max(dMax, d);         // (covers the lock's longer burn)
        }
        return { a, dMax: Math.min(360, dMax + 360 / NST) };
      }
      function conic(gg, a, rgb, amax, tau) {
        const grad = gg.createConicGradient(a * DEG, CX, CY);
        for (let i = 0; i <= NST; i++) {
          const age = AGE[i];
          // tapered by angle behind the arm as well as by age: the light hugs the arm, the tail falls off
          const v = age < 0 ? 0 : amax * Math.exp(-age / tau) * (0.35 + 0.65 * Math.exp(-(360 * (1 - i / NST)) / 110));
          grad.addColorStop(i / NST, `rgba(${rgb},${v.toFixed(4)})`);
        }
        return grad;
      }
      // the lit sector as a path (centre + arc behind the arm), to clip the fills to where there is light
      function sector(gg, a, dMax, R) {
        gg.beginPath();
        if (dMax >= 359) { gg.arc(CX, CY, R, 0, TAU); return; }
        gg.moveTo(CX, CY); gg.arc(CX, CY, R, (a - dMax) * DEG, a * DEG); gg.closePath();
      }

      // ---- HUD + slug (s08's), the corners in rival
      Brand.hud(ctx, { inset: 72, tc: false, drawIn: false, slug: '', ticks: false, color: C.rival });

      // ---- the callout: leader off the capsule's lower-left flank, a rule, the label (scrambles in at 0.5)
      const nx = -Math.sin(AX), ny = Math.cos(AX);                  // capsule normal (down-left)
      const LD0 = [CX + nx * (CAP.h / 2 + 10), CY + ny * (CAP.h / 2 + 10)];
      const LD1 = [CX + nx * 150, CY + ny * 150];
      const RULE_W = 470;
      const lab = ctx.el('div', 'x08c-lab', root, '');
      Object.assign(lab.style, { right: (W - LD1[0] + 8) + 'px', top: (LD1[1] - 44) + 'px' });
      Brand.scrambleTo(tl, lab, 'CONTESTED · CROSSING', T_LAB, 0.18);
      ctx.el('div', 'x08c-slug', root, 'REALMS · COMPETITIVE · INTERFACE CONCEPT');
      const call = { u: 0 };
      tl.fromTo(call, { u: 0 }, { u: 1, duration: 5 / FPS, ease: 'expo.out' }, T_LAB);

      // ---- per frame
      ctx.onFrame((t) => {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        g.clearRect(0, 0, W, H);

        // the pings kick the ground bloom and the scope (a radial punch), escalating ping by ping to the lock
        let kick = 0;
        VP.forEach((p, k) => { const u = t - p; if (u >= 0) kick = Math.max(kick, KICK_G[k] * Math.exp(-u / 0.07)); });
        const ko = kick > 0.004 ? Math.min(1, KICK_OP * kick).toFixed(3) : '0';
        if (kickEl.style.opacity !== ko) kickEl.style.opacity = ko;
        // the scope deploys on the cut (rings ripple out 0.82 -> 1, expo.out 0.2 s, outer rings last) and
        // kicks out on each ping (more at range)
        const rs = (i, r) => lerp(0.82, 1, eo(clamp01((t - i * 0.012) / 0.2))) * (1 + 0.022 * kick * (r / RB));
        const boot = 1 + 1.1 * Math.exp(-t / 0.07);                 // over-exposed on the cut, settles in ~6 f
        // the lock: its own over-exposure (42.0 / 42.033 are the brightest frames), then the release from
        // 42.067: the scope steps back to 70% by 42.2, the phosphor goes out, the arm (snapped back onto the
        // contacts) holds at 60% on 42.1 / 42.133 and is gone by 42.2
        const lockX = t >= T_LOCK ? 1 + 0.9 * Math.exp(-(t - T_LOCK) / 0.09) : 1;
        const tauP = t >= T_LOCK ? 0.1 : 0.07;                       // the lock's fan burns longer
        const hold = po2(clamp01((t - T_REL) / (4 / FPS)));
        const pf = 1 - clamp01((t - T_REL) / (4 / FPS));
        const armA = t < T_LOCK + 4 / FPS
          ? lerp(1, 0.6, po2(clamp01((t - T_REL) / (1 / FPS))))
          : 0.6 * (1 - p2i(clamp01((t - (T_LOCK + 4 / FPS)) / (2 / FPS))));
        const pk = pingIdx(t);
        // the ping frame itself flashes: the return lights the fan and the linework (decays in ~2 f)
        let uP = 9; for (const p of VP) if (t >= p) uP = t - p;
        const pfl = 1 + 0.45 * Math.exp(-uP / 0.05);
        const rb = RB * rs(3, RB);

        // phosphor wedge: full strength inside the bezel, OUT_A outside, clipped to the lit sector
        const ph = phosphor(t);
        if (pf > 0.003 && ph.dMax > 0.5) {
          const wf = conic(g, ph.a, '221,98,72', PH_AMAX[pk] * pf * pfl, tauP);
          g.save(); sector(g, ph.a, ph.dMax, rb); g.clip();
          g.fillStyle = wf; g.fillRect(CX - rb, CY - rb, 2 * rb, 2 * rb);
          g.restore();
          g.save(); sector(g, ph.a, ph.dMax, 1500); g.moveTo(CX + rb, CY); g.arc(CX, CY, rb, 0, TAU, true); g.clip('evenodd');
          g.globalAlpha = OUT_A; g.fillStyle = wf; g.fillRect(0, 0, W, H);
          g.restore();
        }

        // linework: the base pass, then the phosphor-lit pass (stroked with the conic gradient)
        const bootA = Math.min(1.6, boot) * (1 - 0.3 * hold) * lockX * (1 + 0.4 * kick);
        lines(g, (al) => { g.strokeStyle = rgba(C.rival, al * bootA); }, 1, rs);
        if (pf > 0.003 && ph.dMax > 0.5) {
          const wl = conic(g, ph.a, '240,160,143', pf, tauP);
          const lg = LIT_G[pk];
          g.strokeStyle = wl;
          lines(g, (al) => { g.globalAlpha = Math.min(1, al * lg); }, 1.15, rs);
          g.globalAlpha = 1;
        }

        // the transmit ring on the cut (the lock has its own clamp on the capsule)
        for (const t0 of [0]) {
          const u = (t - t0) / 0.32;
          if (u < 0 || u > 1) continue;
          const r = lerp(140, 1300, po3(u));                        // leaves from just outside the capsule
          g.strokeStyle = rgba(C.rivalLight, 0.7 * (1 - u)); g.lineWidth = 3;
          g.beginPath(); g.arc(CX, CY, r, 0, TAU); g.stroke();
          g.strokeStyle = rgba(C.rival, 0.18 * (1 - u) * clamp01(u * 6)); g.lineWidth = 16;
          g.beginPath(); g.arc(CX, CY, r - 8, 0, TAU); g.stroke();
        }

        // the sweep arm
        const aR = armDraw(t) * DEG, ac = Math.cos(aR), as = Math.sin(aR);
        if (armA > 0.003) {
          g.lineCap = 'round';
          g.strokeStyle = rgba(C.rival, 0.35 * armA); g.lineWidth = 9;
          g.beginPath(); g.moveTo(CX + ac * 60, CY + as * 60); g.lineTo(CX + ac * 1500, CY + as * 1500); g.stroke();
          g.strokeStyle = rgba(C.rivalLight, armA); g.lineWidth = 3;
          g.beginPath(); g.moveTo(CX + ac * 60, CY + as * 60); g.lineTo(CX + ac * 1500, CY + as * 1500); g.stroke();
        }

        // the out-cut: over the last 3 frames (power2.in) the frame thins to what s08 shows on 42.267 (bridge,
        // triangles, pulse rings, route, label stay; capsule to 45%, the red clamp to 70%, echoes and tracks out)
        const fo = p2i(clamp01((t - (T_LOCK + 4 / FPS)) / (3 / FPS)));

        // contacts: echoes, the live blip, brackets, pulse rings, vectors
        const vecU = p2i(clamp01((t - T_VEC) / (T_HIT - T_VEC)));
        CONTACTS.forEach((c, ci) => {
          let cur = -1;
          for (const s of c.steps) if (t >= s.t) cur = s.k;
          if (cur < 0) return;
          const live = c.steps[cur];
          // echoes: earlier positions, outline, decaying from the moment they were superseded
          for (let k = 0; k < cur; k++) {
            const s = c.steps[k], age = t - c.steps[k + 1].t;
            const al = 0.75 * Math.exp(-age / 0.32) * (1 - fo);
            if (al < 0.02) continue;
            tri(g, s.x, s.y, 1, null, rgba(C.rival, al), 1.6);
          }
          // the track: a fine dashed line through the echoes to the live blip
          if (cur > 0 && fo < 0.999) {
            g.setLineDash([4, 6]); g.strokeStyle = rgba(C.rival, 0.5 * (1 - fo)); g.lineWidth = 1.5;
            g.beginPath(); g.moveTo(c.steps[0].x, c.steps[0].y); g.lineTo(live.x, live.y); g.stroke();
            g.setLineDash([]);
          }
          // intercept vector: fires 0.5 -> 0.6, then follows the contact
          if (t >= T_VEC) {
            if (ci === 1) routeVec(g, live, vecU);
            else straightVec(g, live, vecU, lerp(1, 0.45, fo));
          }
          const age = t - live.t;
          const fl = Math.exp(-age / 0.09);
          // pulse ring (s08's: r 18 -> 32.4 product units, .6 -> 0 over 1 s, power2.out)
          const pu = clamp01(age);
          if (pu < 1) {
            g.strokeStyle = rgba(C.rival, 0.6 * (1 - pu)); g.lineWidth = 1.6 * K;
            g.beginPath(); g.arc(live.x, live.y, 18 * K * (1 + 0.8 * po2(pu)), 0, TAU); g.stroke();
          }
          // the blip: flare (rivalLight, scale 1.35 -> 1) decaying to rival
          const sc = 1 + 0.35 * fl;
          tri(g, live.x, live.y, sc, fl > 0.05 ? mixHex(C.rival, C.rivalLight, fl) : C.rival, null, 0);
          // lock brackets: snap in from 1.7x (4 f expo.out), hold at .9 then settle to .6
          const bu = eo(clamp01(age / (4 / FPS)));
          const bs = lerp(52, 30, bu);
          const bk = clamp01((age - 0.06) / 0.2);
          brackets(g, live.x, live.y + 1, bs, bs, 10, bk < 0.999 ? mixHex(C.rivalLight, C.rival, bk) : C.rival, 2);
        });

        // the crossing glyph: the one amber element (s08's bridge lines inside the zone capsule)
        const hit = t >= T_HIT ? Math.exp(-(t - T_HIT) / 0.1) : 0;
        const lockAge = t - T_LOCK;
        const lk = lockAge >= 0 ? Math.exp(-lockAge / 0.1) : 0;
        const gk = 1 + 0.08 * hit + 0.05 * lk;
        g.save();
        g.translate(CX, CY); g.rotate(AX); g.scale(gk, gk);
        g.globalAlpha = lerp(1, 0.45, fo);
        const cw = CAP.w, ch = CAP.h;
        g.fillStyle = rgba(C.bg, 0.92);
        rr(g, -cw / 2, -ch / 2, cw, ch, ch / 2); g.fill();
        g.fillStyle = rgba(C.amber, 0.07);
        rr(g, -cw / 2, -ch / 2, cw, ch, ch / 2); g.fill();
        if (hit > 0.02) {                                            // the hit: an amber glow round the capsule
          g.strokeStyle = rgba(C.amber, 0.28 * hit); g.lineWidth = 14;
          rr(g, -cw / 2 - 3, -ch / 2 - 3, cw + 6, ch + 6, ch / 2 + 3); g.stroke();
        }
        g.strokeStyle = hit > 0.05 ? mixHex(C.amber, C.amberLight, hit) : C.amber; g.lineWidth = 2 + hit;
        rr(g, -cw / 2, -ch / 2, cw, ch, ch / 2); g.stroke();
        g.restore();
        g.globalAlpha = 1;
        g.lineCap = 'round';
        g.strokeStyle = hit > 0.05 ? mixHex(C.amber, C.amberLight, hit) : C.amber; g.lineWidth = 3;
        g.beginPath();
        for (const [p0, p1] of BR) {
          const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
          g.moveTo(CX + (p0[0] - CX) * gk, CY + (p0[1] - CY) * gk); g.lineTo(CX + (p1[0] - CX) * gk, CY + (p1[1] - CY) * gk);
          void mx; void my;
        }
        g.stroke();
        // lock brackets on the capsule (rotated with it), clamp in at the lock
        // the lock: a red capsule contour clamps onto the amber one (Vega's mark on our crossing)
        if (lockAge >= 0) {
          const bu = eo(clamp01(lockAge / (5 / FPS)));
          const o = lerp(56, 13, bu);
          g.save(); g.translate(CX, CY); g.rotate(AX); g.globalAlpha = lerp(1, 0.7, fo);
          g.strokeStyle = bu < 0.999 ? mixHex(C.rivalLight, C.rival, bu) : C.rival; g.lineWidth = 2.5;
          rr(g, -cw / 2 - o, -ch / 2 - o, cw + 2 * o, ch + 2 * o, ch / 2 + o); g.stroke();
          g.restore(); g.globalAlpha = 1;
        }

        // the callout leader + rule (draws 0.50 -> 0.67)
        if (call.u > 0.001) {
          const u = call.u;
          g.strokeStyle = rgba(C.rival, 0.95); g.lineWidth = 2; g.lineCap = 'butt';
          const l1 = clamp01(u * 2), l2 = clamp01(u * 2 - 1);
          g.beginPath(); g.moveTo(LD0[0], LD0[1]); g.lineTo(lerp(LD0[0], LD1[0], l1), lerp(LD0[1], LD1[1], l1));
          if (l2 > 0) { g.moveTo(LD1[0], LD1[1]); g.lineTo(LD1[0] - RULE_W * l2, LD1[1]); }
          g.stroke();
          g.fillStyle = C.rivalLight;
          g.beginPath(); g.arc(LD0[0], LD0[1], 3.5, 0, TAU); g.fill();
        }
      });

      // ---- drawing helpers
      function tri(gg, x, y, s, fill, stroke, lw) {
        gg.beginPath();
        gg.moveTo(x, y + TRI.top * s); gg.lineTo(x + TRI.half * s, y + TRI.base * s); gg.lineTo(x - TRI.half * s, y + TRI.base * s); gg.closePath();
        if (fill) { gg.fillStyle = fill; gg.fill(); }
        if (stroke) { gg.strokeStyle = stroke; gg.lineWidth = lw; gg.lineJoin = 'round'; gg.stroke(); }
      }
      function brackets(gg, x, y, hx, hy, arm, col, lw) {
        gg.strokeStyle = col; gg.lineWidth = lw; gg.lineCap = 'square'; gg.lineJoin = 'miter';
        gg.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          gg.moveTo(x + sx * hx, y + sy * (hy - arm)); gg.lineTo(x + sx * hx, y + sy * hy); gg.lineTo(x + sx * (hx - arm), y + sy * hy);
        }
        gg.stroke();
      }
      function rr(gg, x, y, w, h, r) {
        gg.beginPath();
        gg.moveTo(x + r, y); gg.lineTo(x + w - r, y); gg.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2); gg.lineTo(x + r, y + h); gg.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5); gg.closePath();
      }
      function mixHex(a, b, u) { const pa = hexRgb(a), pb = hexRgb(b); return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp01(u))).join(',')})`; }
      function chevron(gg, x, y, ang, col) {
        const c = Math.cos(ang), s = Math.sin(ang), a = 8.5 * K, b = 6 * K;
        gg.strokeStyle = col; gg.lineWidth = 2.6 * K; gg.lineCap = 'round'; gg.lineJoin = 'round';
        gg.beginPath();
        gg.moveTo(x + (-a) * c - (-b) * s, y + (-a) * s + (-b) * c); gg.lineTo(x, y); gg.lineTo(x + (-a) * c - b * s, y + (-a) * s + b * c);
        gg.stroke();
      }
      // contact 1: a straight dashed vector to the capsule's flank
      function straightVec(gg, live, u, al) {
        const dx = CX - live.x, dy = CY - live.y, L = Math.hypot(dx, dy);
        const ux = dx / L, uy = dy / L;
        const stop = L - 62;                                        // stops at the capsule edge (+ a gap)
        const e = stop * u;
        if (e < 24) return;
        gg.setLineDash([8.4 * K, 6.6 * K]); gg.strokeStyle = rgba(C.rival, al); gg.lineWidth = 2.4 * K; gg.lineCap = 'round';
        gg.beginPath(); gg.moveTo(live.x + ux * 24, live.y + uy * 24); gg.lineTo(live.x + ux * e, live.y + uy * e); gg.stroke();
        gg.setLineDash([]);
        chevron(gg, live.x + ux * e, live.y + uy * e, Math.atan2(uy, ux), rgba(C.rival, al));
      }
      // contact 2: back along the route's line to its start, then s08's VEGA_CROSSING curve (same pixels on the cut)
      const RT_N = 40, RTP = [];
      for (let i = 0; i <= RT_N; i++) {
        const s = i / RT_N, m = 1 - s;
        RTP.push([m * m * m * RT[0][0] + 3 * m * m * s * RT[1][0] + 3 * m * s * s * RT[2][0] + s * s * s * RT[3][0],
          m * m * m * RT[0][1] + 3 * m * m * s * RT[1][1] + 3 * m * s * s * RT[2][1] + s * s * s * RT[3][1]]);
      }
      function routeVec(gg, live, u) {
        const pts = [[live.x, live.y]].concat(RTP);
        const cum = [0];
        for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        const total = cum[cum.length - 1], start = Math.min(24, total), end = start + (total - start) * u;
        if (end - start < 2) return;
        gg.setLineDash([8.4 * K, 6.6 * K]); gg.lineDashOffset = 0; gg.strokeStyle = C.rival; gg.lineWidth = 2.4 * K; gg.lineCap = 'round';
        gg.beginPath();
        let started = false, tip = pts[0], ang = 0;
        for (let i = 1; i < pts.length; i++) {
          const a0 = cum[i - 1], a1 = cum[i];
          if (a1 < start) continue;
          const f0 = clamp01((start - a0) / (a1 - a0)), f1 = clamp01((end - a0) / (a1 - a0));
          const p0 = [lerp(pts[i - 1][0], pts[i][0], f0), lerp(pts[i - 1][1], pts[i][1], f0)];
          const p1 = [lerp(pts[i - 1][0], pts[i][0], f1), lerp(pts[i - 1][1], pts[i][1], f1)];
          if (!started) { gg.moveTo(p0[0], p0[1]); started = true; }
          gg.lineTo(p1[0], p1[1]);
          tip = p1; ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
          if (a1 >= end) break;
        }
        gg.stroke(); gg.setLineDash([]);
        chevron(gg, tip[0], tip[1], ang, C.rival);
      }
    },
  });
})();
