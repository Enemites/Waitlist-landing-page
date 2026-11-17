/* c08-futures (film 52.0-56.0, 4.0 s; local 0 = film 52.0). "Your decisions, and their moves, change
 * what happens next." (w13 at 52.2: decisions 52.38, their 53.28, moves 53.42, change 53.82, what 54.28,
 * happens 54.50, next 54.80).
 *
 * Abstract world: a tree of futures (lightning / river delta) explodes out of one node at the left edge.
 * The tree is an infinite fractal grown lazily and deterministically (each node's children come from a
 * PRNG seeded by the node's id), drawn on one canvas through a 2D camera, every frame from t only.
 *   0.00  hit: root flash, leaders race out along a path-distance front (0.6 s), camera recoil 1.3 -> 1.0
 *   0.40  YOUR DECISION (amber, 'decisions' 52.38): a light runs up the upper branch; an amber cut on the
 *         lower branch; the whole lower half flashes amber and collapses into the cut (a 7 % ghost stays)
 *   1.30  THEIR MOVE (red-orange, 'moves' 53.42): a bolt strikes the upper fork from the top right; that
 *         sub-branch flashes red-orange and collapses
 *   1.55  the surviving branch lights amber, root to tip
 *   1.80-4.00  the flight: the camera dives along the surviving branch (infinite zoom, banking). From 2.5
 *         a fork passes on every 8th note (2.5, 2.75 ... 3.5); new futures sprout ahead; tiny world
 *         silhouettes at the tips morph. 3.62 speed ramp into the light (amber bloom) -> hard cut to c09.
 */
(function () {
  'use strict';
  const ID = 'c08-futures';
  const C = Brand.C;
  const W = 1920, H = 1080;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const smooth = (a, b, x) => { const u = seg(x, a, b); return u * u * (3 - 2 * u); };
  const EZ = {};
  const ez = (n) => EZ[n] || (EZ[n] = gsap.parseEase(n));
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const rgba = (c, a) => { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; };
  const mixC = (c1, c2, u) => { const a = hexRgb(c1), b = hexRgb(c2); return a.map((v, i) => Math.round(v + (b[i] - v) * u)); };
  const rgbaA = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

  // ---- timing (local s) ----
  const T_DEC = 0.40, T_MOVE = 1.30, T_LIGHT = 1.52, T_FLY = 1.80, T_GRID = 2.5, T_RAMP = 3.62;
  const D0 = 10;           // depth grown by the opening front; deeper futures sprout during the flight
  const AHEAD = 5;         // the flight grows futures this many levels ahead of the current level
  const L1 = 400;          // first branch length (world px; = screen px at zoom 1)
  const ROOT_S = [130, 540];
  const LREF = 640;        // in the flight the current surviving segment is LREF px long on screen
  const QEND = [540, 540]; // ... and the camera focus (on the branch) sits here

  // ---- world silhouettes (height profiles on x in [0,1]) that morph at the tips ----
  const NS = 33;
  const tri = (x, c, w, h) => Math.max(0, h * (1 - Math.abs(x - c) / w));
  const SHAPES = [
    (x) => Math.max(tri(x, 0.28, 0.24, 0.75), tri(x, 0.52, 0.2, 1), tri(x, 0.74, 0.22, 0.6)),                     // mountains
    (x) => [0.35, 0.62, 0.45, 1, 0.7, 0.85, 0.4, 0.55][Math.min(7, Math.floor(x * 8))] * (x > 0.04 && x < 0.96 ? 1 : 0.15), // city
    (x) => 0.3 + 0.16 * Math.sin(x * 9.5) + 0.08 * Math.sin(x * 23 + 1),                                           // dunes
    (x) => Math.max(0.12, tri(x, 0.5, 0.42, 1) - (Math.abs(x - 0.5) < 0.08 ? 0.22 : 0)),                            // volcano
    (x) => (x < 0.72 ? 0.42 + 0.03 * Math.sin(x * 40) : 0.12) - (Math.abs(x - 0.36) < 0.025 ? 0.3 : 0),            // ice shelf
    (x) => Math.max(0.12, Math.sqrt(Math.max(0, 0.09 - (x - 0.5) ** 2)) * 2.2, Math.abs(x - 0.62) < 0.012 ? 1 : 0), // dome station
    (x) => 0.18 + 0.7 * (1 - Math.abs(((x * 7) % 1) - 0.5) * 2) * (x > 0.05 && x < 0.95 ? 1 : 0),                    // forest
    (x) => Math.max(tri(x, 0.25, 0.18, 0.55), tri(x, 0.62, 0.16, 0.8), tri(x, 0.86, 0.08, 0.3)),                      // archipelago
  ].map((f) => Array.from({ length: NS }, (_, i) => clamp(f(i / (NS - 1)), 0, 1)));

  Film.scene({
    id: ID,
    duration: 4,
    build(ctx) {
      const { root } = ctx;
      root.style.background = C.bg;
      const { g } = ctx.canvas();

      // ============================ the tree (lazy, deterministic) ============================
      const ROOT = { id: 'r', depth: 0, x0: 0, y0: 0, x1: 0, y1: 0, ang: 0, len: L1 / 0.72, s0: 0, s1: 0, fate: 0, cut: null, h: 0.5, h2: 0.9, kids: null, jag: [] };
      let A = null;
      function kidsOf(n) {
        if (n.kids) return n.kids;
        const r = ctx.rng(ID + '/' + n.id);
        let k, spread, base;
        const rk = r();
        if (n.depth === 0) { k = 2; spread = 0.5; base = -0.02; }
        else if (n.depth === 1) { k = 2; spread = 0.38; base = n.ang * 0.7; }
        else if (!n.mustSplit && n.depth > 2 && rk < 0.3) { k = 1; spread = 0; base = n.ang * 0.85 + (r() - 0.5) * 0.42; }   // a river-like kink
        else { k = rk > 0.86 ? 3 : 2; spread = (k === 3 ? 0.38 : 0.25) + r() * 0.1; base = n.ang * 0.8 + (r() - 0.5) * 0.1; }
        const kids = [];
        for (let i = 0; i < k; i++) {
          const f = k === 1 ? 0 : (i / (k - 1)) * 2 - 1;
          const a = clamp(base + f * spread + (r() - 0.5) * (n.depth > 1 ? 0.14 : 0.04), -1.05, 1.05);
          const len = n.depth === 0 ? L1 : n.len * (k === 1 ? 0.84 + r() * 0.1 : 0.68 + r() * 0.12);
          const x0 = n.x1, y0 = n.y1;
          const jag = [];
          for (let j = 1; j < 6; j++) jag.push((r() - 0.5) * 2 * 0.07 * Math.sin(Math.PI * j / 6));
          kids.push({ id: n.id + '.' + i, depth: n.depth + 1, parent: n, i, x0, y0, x1: x0 + Math.cos(a) * len, y1: y0 + Math.sin(a) * len,
            ang: a, len, s0: n.s1, s1: n.s1 + len, fate: n.fate, cut: n.cut, h: r(), h2: r(), h3: r(), kids: null, jag, surv: false });
        }
        // the two prunes: our decision cuts the root's lower branch, their move cuts the upper fork's top branch
        if (n.depth === 0) { kids[1].fate = 1; kids[1].cut = kids[1]; }
        if (n === A) { kids[0].fate = 2; kids[0].cut = kids[0]; }
        n.kids = kids;
        return kids;
      }
      // the surviving branch: up at the root, down at the struck fork, then the most level child
      const SURV = [ROOT];
      kidsOf(ROOT); A = ROOT.kids[0];
      for (let d = 0; d < 40; d++) {
        SURV[d].mustSplit = true;
        const ks = kidsOf(SURV[d]);
        let pick;
        if (d === 0) pick = ks[0];
        else if (d === 1) pick = ks[ks.length - 1];
        else { const tgt = d % 2 ? 0.1 : -0.1; pick = ks.reduce((b, c) => (Math.abs(c.ang - tgt) < Math.abs(b.ang - tgt) ? c : b), ks[0]); }
        pick.surv = true;
        SURV.push(pick);
      }
      const B1 = ROOT.kids[1], A2 = A.kids[0];
      const SMAX = (n) => n.s0 + n.len * 3.4;            // ~ farthest path distance in a subtree

      // ============================ camera ============================
      // Opening: the root is pinned at ROOT_S (zoom recoil 1.3 -> 1, then a slow push to 1.12).
      // Flight: the anchor is a point F(c) on a smooth path (quadratic B-spline) through the surviving
      // forks, c = fractional level; zoom keeps the surviving segment at c LREF px long; the camera banks
      // with the path. Fork k passes the focus at c = k - 0.5, on the 8th-note grid from T_GRID.
      const NODES = SURV.map((n) => [n.x1, n.y1]);
      const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      function focusAt(c) {
        const j = clamp(Math.floor(c), 0, NODES.length - 3), u = clamp(c - j, 0, 1);
        const m0 = mid(NODES[j], NODES[j + 1]), m1 = mid(NODES[j + 1], NODES[j + 2]), n1 = NODES[j + 1];
        const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u;
        const tx = 2 * (1 - u) * (n1[0] - m0[0]) + 2 * u * (m1[0] - n1[0]), ty = 2 * (1 - u) * (n1[1] - m0[1]) + 2 * u * (m1[1] - n1[1]);
        return { p: [a * m0[0] + b * n1[0] + d * m1[0], a * m0[1] + b * n1[1] + d * m1[1]], ang: Math.atan2(ty, tx) };
      }
      const lenAt = (c) => { const j = clamp(Math.floor(c), 0, SURV.length - 3), u = clamp(c - j, 0, 1); return Math.exp(lerp(Math.log(SURV[j + 1].len), Math.log(SURV[j + 2].len), u)); };
      function zOpen(t) {
        const zr = 1 + 0.3 * (1 - ez('expo.out')(seg(t, 0, 0.75)));
        const zp = 1 + 0.12 * ez('sine.inOut')(seg(t, 0.55, T_FLY));
        return zr * zp;
      }
      const C0 = 0.15, MC0 = 0.7, K0 = 2, MC1 = 4;     // flight level: from C0 (slope MC0) to K0-0.5 at T_GRID, then 4 / s
      function cAt(t) {
        if (t <= T_FLY) return C0 + (t - T_FLY) * 0.05;
        if (t < T_GRID) {
          const h = T_GRID - T_FLY, u = (t - T_FLY) / h, u2 = u * u, u3 = u2 * u;
          return (2 * u3 - 3 * u2 + 1) * C0 + (u3 - 2 * u2 + u) * h * MC0 + (-2 * u3 + 3 * u2) * (K0 - 0.5) + (u3 - u2) * h * MC1;
        }
        const x = Math.max(0, t - T_RAMP);
        return K0 - 0.5 + (t - T_GRID) * MC1 + 11 * x * x;
      }
      const F0 = focusAt(C0).p;
      const ZF = zOpen(T_FLY);
      const QF = [ZF * (F0[0] - ROOT.x1) + ROOT_S[0], ZF * (F0[1] - ROOT.y1) + ROOT_S[1]];
      function cam(t) {
        const c = cAt(t);
        if (t <= T_FLY) return { P: [ROOT.x1, ROOT.y1], Q: ROOT_S, z: zOpen(t), rot: 0, c };
        const f = focusAt(c);
        const w = ez('power2.inOut')(seg(t, T_FLY, T_FLY + 0.45));
        const z = Math.exp(lerp(Math.log(ZF), Math.log(LREF / lenAt(c)), w));
        const u = ez('power2.inOut')(seg(t, T_FLY, 2.6));
        const Q = [lerp(QF[0], QEND[0], u), lerp(QF[1], QEND[1], u)];
        const rot = -0.8 * f.ang * ez('power2.inOut')(seg(t, T_FLY, 2.4));
        return { P: f.p, Q, z, rot, c };
      }
      // screen mapping for one frame (M) and for the shutter sample (MP, for motion streaks)
      const mkM = (cm) => ({ a: Math.cos(cm.rot) * cm.z, b: Math.sin(cm.rot) * cm.z, px: cm.P[0], py: cm.P[1], qx: cm.Q[0], qy: cm.Q[1], z: cm.z, rot: cm.rot });
      let M = null, MP = null;
      const SX = (x, y) => M.a * (x - M.px) - M.b * (y - M.py) + M.qx;
      const SY = (x, y) => M.b * (x - M.px) + M.a * (y - M.py) + M.qy;
      const PX = (x, y) => MP.a * (x - MP.px) - MP.b * (y - MP.py) + MP.qx;
      const PY = (x, y) => MP.b * (x - MP.px) + MP.a * (y - MP.py) + MP.qy;

      // ============================ growth + fate ============================
      const FMAX = 2300;
      const front = (t) => FMAX * ez('expo.out')(seg(t + 0.05, 0, 0.66));
      function grownP(n, t, c) {
        if (n.depth <= D0) return clamp((front(t) - n.s0) / n.len, 0, 1);
        return clamp(c + AHEAD + 2 - n.depth, 0, 1);
      }
      // returns { col (rgb array) | null, a, w, q (visible fraction of the coloured part), ghost }
      function fateStyle(n, t) {
        if (!n.fate) return null;
        const tp = n.fate === 1 ? T_DEC : T_MOVE;
        if (t < tp) return null;
        const flashC = n.fate === 1 ? C.ink : C.rival, deep = n.fate === 1 ? C.amberDeep : C.rivalDeep;
        const sF = n.cut.s0 + (t - tp) * 9000;
        if (n.s0 > sF) return null;                           // the flash has not reached this branch yet
        const u = seg(t, tp + 0.1, tp + 0.52);
        const R = lerp(SMAX(n.cut), n.cut.s0, ez('power2.in')(u));
        const q = clamp((R - n.s0) / n.len, 0, 1);
        const hot = 1 - seg(t, tp + 0.03, tp + 0.2);
        const k = n.fate === 1 ? clamp((t - tp) / 0.12, 0, 1) : u * 0.6;
        return { col: mixC(flashC, deep, k), hot, a: (n.fate === 1 ? 0.85 : 0.95) - 0.25 * u, q, w: 0.5 + 0.8 * hot };
      }

      // ============================ drawing ============================
      const buckets = new Map();
      function addLine(key, pts) { let b = buckets.get(key); if (!b) { b = []; buckets.set(key, b); } b.push(pts); }
      function flush() {
        for (const [key, list] of buckets) {
          const [col, w] = key.split('|');
          g.strokeStyle = col; g.lineWidth = +w;
          g.beginPath();
          for (const p of list) { g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); }
          g.stroke();
        }
        buckets.clear();
      }
      // screen polyline of n from fraction f0 to f1 (jagged: 6 spans)
      function poly(n, f0, f1, Ls) {
        const dx = n.x1 - n.x0, dy = n.y1 - n.y0, nx = -dy, ny = dx;
        const K = Ls < 26 ? 1 : 6;
        const out = [];
        const at = (f) => {
          let off = 0;
          if (K > 1) { const j = f * 6, i = Math.floor(j), fr = j - i; const o = [0, ...n.jag, 0]; off = i >= 6 ? 0 : lerp(o[i], o[i + 1], fr); }
          const x = n.x0 + dx * f + nx * off, y = n.y0 + dy * f + ny * off;
          out.push(SX(x, y), SY(x, y));
        };
        at(f0);
        for (let k = 1; k < K; k++) { const f = k / K; if (f > f0 && f < f1) at(f); }
        at(f1);
        return out;
      }
      const q2 = (v, s) => (Math.round(v / s) * s).toFixed(2);

      const tips = [], dots = [], survDots = [], leaders = [], dust = [];
      function visit(n, t, cl, lit) {
        const kids = kidsOf(n);
        for (const k of kids) {
          const p = grownP(k, t, cl);
          if (p <= 0) continue;
          const x0 = SX(k.x0, k.y0), y0 = SY(k.x0, k.y0), x1 = SX(k.x1, k.y1), y1 = SY(k.x1, k.y1);
          const Ls = k.len * M.z;
          if (Ls < 2.2) continue;
          // cull the whole subtree (its extent is ~2.4 x its first segment)
          const R = Ls * 2.6 + 30;
          if (Math.max(x0, x1) + R < -40 || Math.min(x0, x1) - R > W + 40 || Math.max(y0, y1) + R < -40 || Math.min(y0, y1) - R > H + 40) continue;
          const fs = fateStyle(k, t);
          const big = clamp((Ls - 16) / 520, 0, 1);
          if (k.surv && k.s0 < lit) {
            // the surviving branch (amber), lit up to path distance `lit`
            const f = clamp((lit - k.s0) / k.len, 0, 1);
            const w = clamp(2.2 + Ls / 260, 2.4, 5);
            const pts = poly(k, 0, Math.min(p, f), Ls);
            addLine(rgba(C.amber, 0.13) + '|' + q2(w * 5, 1), pts);
            addLine(rgba(C.amber, 0.3) + '|' + q2(w * 2.2, 0.5), pts);
            addLine(C.amber + '|' + q2(w, 0.25), pts);
            if (f < 1 && p > f) addLine(rgba(C.bone, 0.7) + '|' + q2(1 + big * 1.4, 0.25), poly(k, f, p, Ls));
          } else if (fs) {
            // pruned: faint ghost + the coloured part collapsing into the cut
            addLine(rgba(C.bone, 0.12) + '|1.00', poly(k, 0, p, Ls));
            const qq = Math.min(p, fs.q);
            if (qq > 0.001) {
              const w = clamp(1.2 + big * 1.6, 1.5, 3) + fs.w;
              if (fs.hot > 0.02) addLine(rgbaA(fs.col, 0.22 * fs.hot) + '|' + q2(w * 4, 1), poly(k, 0, qq, Ls));
              addLine(rgbaA(fs.col, fs.a.toFixed(2)) + '|' + q2(w, 0.25), poly(k, 0, qq, Ls));
            }
          } else {
            const a = clamp(0.3 + 0.55 * clamp(Ls / 260, 0, 1), 0, 0.85);
            addLine(rgba(C.bone, q2(a, 0.05)) + '|' + q2(1 + big * 1.4, 0.25), poly(k, 0, p, Ls));
          }
          // leader tip while a branch is growing (lightning)
          if (p < 1 && !(fs && fs.q < 0.999)) leaders.push([lerp(x0, x1, p), lerp(y0, y1, p), Ls]);
          // nodes
          if (p >= 1) {
            if (k.surv) survDots.push([x1, y1, Ls, k]);
            else if (Ls > 50 && !(fs && fs.q < 1)) dots.push([x1, y1, clamp(Ls / 120, 1.4, 3)]);
          }
          // dust specks (parallax in the flight)
          if (Ls > 24 && Ls < 1600 && p >= 1) {
            const mx = (k.x0 + k.x1) / 2, my = (k.y0 + k.y1) / 2, nn = (k.h3 - 0.5) * 2 * 0.95;
            const wx = mx - (k.y1 - k.y0) * nn, wy = my + (k.x1 - k.x0) * nn;
            if (k.h < 0.22) dust.push([wx, wy, smooth(24, 90, Ls) * (1 - smooth(700, 1600, Ls))]);
          }
          // recurse, and find frontier tips (children not born yet) for the world silhouettes
          const kk = kidsOf(k);
          const kidP = grownP(kk[0], t, cl);
          if (p >= 1 && kidP <= 0 && k.h2 < 0.22 && Ls >= 16 && !(fs && fs.q < 1)) tips.push([x1, y1, Ls, k, fs ? fs.q : 1]);
          else if (p >= 1 && kidP <= 0.6 && kidP > 0 && k.h2 < 0.22 && Ls >= 16 && !fs) tips.push([x1, y1, Ls, k, 1 - kidP / 0.6]);
          if (p >= 1) visit(k, t, cl, lit);
        }
      }

      function silhouette(x, y, size, k, t, a) {
        const rate = 2.8, ph = k.h * 17.3;
        const v = t * rate + ph, i = Math.floor(v), fr = v - i;
        const sa = SHAPES[((i % SHAPES.length) + SHAPES.length) % SHAPES.length], sb = SHAPES[(((i + 1) % SHAPES.length) + SHAPES.length) % SHAPES.length];
        const m = ez('power2.inOut')(seg(fr, 0.62, 1));
        const w = size, h = size * 0.62, x0 = x + size * 0.35, base = y + h * 0.42;
        g.beginPath();
        g.moveTo(x0, base);
        for (let s = 0; s < NS; s++) g.lineTo(x0 + w * s / (NS - 1), base - h * lerp(sa[s], sb[s], m));
        g.lineTo(x0 + w, base);
        g.closePath();
        g.fillStyle = rgba(k.surv ? C.amber : C.bone, (0.7 * a).toFixed(3));
        g.fill();
        g.fillRect(x0 - size * 0.08, base, w + size * 0.16, Math.max(1, size * 0.03));
      }

      // the rival bolt (world space, from beyond the top-right edge to the struck fork)
      const BOLT = (() => {
        const r = ctx.rng(ID + ':bolt');
        const end = [A.x1, A.y1];
        const start = [A.x1 + 1150, A.y1 - 900];
        let pts = [start, end];
        for (let it = 0; it < 6; it++) {
          const out = [pts[0]];
          for (let i = 0; i < pts.length - 1; i++) {
            const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
            const d = Math.hypot(bx - ax, by - ay), o = (r() - 0.5) * d * 0.34;
            out.push([(ax + bx) / 2 - (by - ay) / d * o, (ay + by) / 2 + (bx - ax) / d * o], pts[i + 1]);
          }
          pts = out;
        }
        return pts;
      })();

      // tags (canvas text): scramble on, follow their world anchor
      const TAGS = [
        { text: 'YOUR DECISION', col: C.amber, at: T_DEC + 0.04, icon: 'dia', anchor: () => { const f = 0.24; return [lerp(B1.x0, B1.x1, f), lerp(B1.y0, B1.y1, f)]; }, off: [26, 40] },
        { text: 'THEIR MOVE', col: C.rival, at: T_MOVE + 0.04, icon: 'ring', anchor: () => [A.x1, A.y1], off: [-236, -34] },
      ];
      const TAG_OUT = T_FLY + 0.05;

      function cutMark(n, t, tp, col) {
        if (t < tp) return;
        const f = 0.24, wx = lerp(n.x0, n.x1, f), wy = lerp(n.y0, n.y1, f);
        const x = SX(wx, wy), y = SY(wx, wy);
        const e = ez('expo.out')(seg(t, tp, tp + 0.14));
        const a = 1 - seg(t, T_FLY, T_FLY + 0.35);
        if (a <= 0) return;
        const ang = n.ang + M.rot + 1.15, L = 30 * e;
        g.strokeStyle = rgba(col, a); g.lineWidth = 4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x - Math.cos(ang) * L, y - Math.sin(ang) * L); g.lineTo(x + Math.cos(ang) * L, y + Math.sin(ang) * L); g.stroke();
        // spark burst
        const u = seg(t, tp, tp + 0.32);
        if (u > 0 && u < 1) {
          g.lineWidth = 2;
          for (let i = 0; i < 8; i++) {
            const aa = i * Math.PI / 4 + 0.3, r0 = 10 + 70 * ez('expo.out')(u), r1 = r0 + 22 * (1 - u);
            g.strokeStyle = rgba(i % 2 ? C.ink : col, 0.9 * (1 - u));
            g.beginPath(); g.moveTo(x + Math.cos(aa) * r0, y + Math.sin(aa) * r0); g.lineTo(x + Math.cos(aa) * r1, y + Math.sin(aa) * r1); g.stroke();
          }
        }
      }

      function ringPulse(x, y, r0, r1, u, col, w) {
        if (u <= 0 || u >= 1) return;
        const e = ez('expo.out')(u);
        g.strokeStyle = rgba(col, 0.85 * (1 - u)); g.lineWidth = w || 2;
        g.beginPath(); g.arc(x, y, lerp(r0, r1, e), 0, Math.PI * 2); g.stroke();
      }

      // fork crossings on the grid (for the flight flashes)
      // fork k passes the camera focus at c = k - 0.5 (8th-note grid from T_GRID)
      const tCross = (c) => { let lo = T_FLY, hi = 4.3; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (cAt(m) < c) lo = m; else hi = m; } return (lo + hi) / 2; };
      const CROSS = [];
      for (let k = 1; k <= 16; k++) { const tc = tCross(k - 0.5); if (tc > T_FLY && tc < 4.1) CROSS.push([k, tc]); }

      ctx.onFrame((t) => {
        const cm = cam(t);
        M = mkM(cm); MP = mkM(cam(Math.max(0, t - 1 / 45)));
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
        // a warm pool behind the tree
        const rs = SX(ROOT.x1, ROOT.y1), rsy = SY(ROOT.x1, ROOT.y1);
        const pool = g.createRadialGradient(cm.Q[0], cm.Q[1], 0, cm.Q[0], cm.Q[1], 1100);
        pool.addColorStop(0, 'rgba(26,21,15,0.9)'); pool.addColorStop(1, 'rgba(11,12,14,0)');
        g.fillStyle = pool; g.fillRect(0, 0, W, H);

        // lit length of the surviving branch
        const litA = A.len * ez('power2.out')(seg(t, T_DEC, T_DEC + 0.2));
        const litAll = t < T_LIGHT ? litA : A.s1 + (SURV[40].s1 - A.s1) * ez('power2.inOut')(seg(t, T_LIGHT, T_LIGHT + 0.42));
        tips.length = 0; dots.length = 0; survDots.length = 0; leaders.length = 0; dust.length = 0;
        g.lineCap = 'round'; g.lineJoin = 'round';
        visit(ROOT, t, cm.c, litAll);

        // dust (behind the lines), streaked by the zoom velocity
        const dA = smooth(T_FLY, T_FLY + 0.5, t);
        g.lineCap = 'round';
        if (dA > 0) for (const d of dust) {
          if (d[2] < 0.02) continue;
          const x = SX(d[0], d[1]), y = SY(d[0], d[1]), px = PX(d[0], d[1]), py = PY(d[0], d[1]);
          g.strokeStyle = rgba(C.bone, (0.42 * d[2] * dA).toFixed(3)); g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(px, py); g.lineTo(x + 0.01, y); g.stroke();
        }
        flush();

        // fork dots
        g.fillStyle = rgba(C.bone, 0.75);
        for (const d of dots) { g.beginPath(); g.arc(d[0], d[1], d[2], 0, Math.PI * 2); g.fill(); }
        for (const d of survDots) {
          if (d[3].s1 > litAll) continue;
          const r = clamp(d[2] / 70, 3.5, 11);
          g.fillStyle = C.bg; g.strokeStyle = C.amber; g.lineWidth = clamp(r / 3.5, 1.5, 3);
          g.beginPath(); g.arc(d[0], d[1], r, 0, Math.PI * 2); g.fill(); g.stroke();
          g.fillStyle = C.amberLight; g.beginPath(); g.arc(d[0], d[1], r * 0.45, 0, Math.PI * 2); g.fill();
        }
        // world silhouettes at the frontier tips
        for (const tp of tips) silhouette(tp[0], tp[1], clamp(tp[2] * 0.5, 14, 40), tp[3], t, tp[4] * smooth(0, 0.12, t - 0.25));
        // growing leaders: hot points
        for (const l of leaders) {
          const r = clamp(l[2] / 90, 1.4, 4);
          g.fillStyle = rgba(C.ink, 0.95); g.beginPath(); g.arc(l[0], l[1], r, 0, Math.PI * 2); g.fill();
          g.fillStyle = rgba(C.amberLight, 0.18); g.beginPath(); g.arc(l[0], l[1], r * 4.5, 0, Math.PI * 2); g.fill();
        }

        // the root: a seed node, flashing on the hit
        {
          const fl = 1 - seg(t, 0, 0.3);
          const a = 1 - seg(t, T_FLY, T_FLY + 0.6);
          if (a > 0) {
            if (fl > 0) {
              const gr = g.createRadialGradient(rs, rsy, 0, rs, rsy, 260 * (0.6 + fl * 0.6));
              gr.addColorStop(0, rgba(C.ink, 0.9 * fl)); gr.addColorStop(0.25, rgba(C.amberLight, 0.4 * fl)); gr.addColorStop(1, rgba(C.amber, 0));
              g.fillStyle = gr; g.fillRect(rs - 400, rsy - 400, 800, 800);
            }
            g.globalAlpha = a;
            g.fillStyle = C.bg; g.strokeStyle = C.amber; g.lineWidth = 2;
            g.beginPath(); g.arc(rs, rsy, 13, 0, Math.PI * 2); g.fill(); g.stroke();
            g.fillStyle = C.amberLight; g.beginPath(); g.arc(rs, rsy, 6.5, 0, Math.PI * 2); g.fill();
            g.globalAlpha = 1;
            ringPulse(rs, rsy, 13, 120, seg(t, 0, 0.7), C.amberLight, 2);
          }
        }

        // the decision: amber cut + light running up the chosen branch
        cutMark(B1, t, T_DEC, C.amber);
        // their move: the bolt (0.1 s draw, flicker, fade) + red-orange cut
        if (t >= T_MOVE && t < T_MOVE + 0.32) {
          const u = seg(t, T_MOVE, T_MOVE + 0.07);
          const fade = 1 - seg(t, T_MOVE + 0.12, T_MOVE + 0.32);
          const flick = (Math.floor((t - T_MOVE) * 30) === 2) ? 0.35 : 1;
          const n = Math.max(2, Math.ceil(BOLT.length * u));
          const pts = []; for (let i = 0; i < n; i++) pts.push(SX(BOLT[i][0], BOLT[i][1]), SY(BOLT[i][0], BOLT[i][1]));
          const path = () => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); };
          g.lineJoin = 'round';
          path(); g.strokeStyle = rgba(C.rival, 0.18 * fade * flick); g.lineWidth = 16; g.stroke();
          path(); g.strokeStyle = rgba(C.rival, 0.95 * fade * flick); g.lineWidth = 3.5; g.stroke();
          path(); g.strokeStyle = rgba(C.rivalLight, 0.9 * fade * flick); g.lineWidth = 1.5; g.stroke();
          // frame tint on the strike
          const tint = (1 - seg(t, T_MOVE + 0.03, T_MOVE + 0.2)) * (t >= T_MOVE + 0.03 ? 1 : 0);
          if (tint > 0) { g.fillStyle = rgba(C.rival, 0.07 * tint); g.fillRect(0, 0, W, H); }
        }
        if (t >= T_MOVE + 0.03) cutMark(A2, t, T_MOVE + 0.03, C.rival);
        ringPulse(SX(A.x1, A.y1), SY(A.x1, A.y1), 10, 110, seg(t, T_MOVE + 0.05, T_MOVE + 0.6), C.rival, 2.5);
        ringPulse(SX(ROOT.x1, ROOT.y1), SY(ROOT.x1, ROOT.y1), 14, 140, seg(t, T_DEC, T_DEC + 0.6), C.amber, 2.5);

        // flight: a fork flashes on every 8th note
        for (const [L, tc] of CROSS) {
          const u = (t - tc) / 0.42;
          if (u < 0 || u > 1) continue;
          const n = SURV[Math.min(SURV.length - 1, L)];
          const x = SX(n.x1, n.y1), y = SY(n.x1, n.y1), Ls = n.len * M.z;
          ringPulse(x, y, clamp(Ls / 70, 3.5, 11), clamp(Ls / 70, 3.5, 11) + 70, u, C.amberLight, 2);
          const f = 1 - u;
          const gr = g.createRadialGradient(x, y, 0, x, y, 70);
          gr.addColorStop(0, rgba(C.amberLight, 0.55 * f * f)); gr.addColorStop(1, rgba(C.amber, 0));
          g.fillStyle = gr; g.fillRect(x - 70, y - 70, 140, 140);
        }

        // tags
        g.textBaseline = 'alphabetic';
        g.font = '600 20px "JetBrains Mono Variable"';
        g.letterSpacing = '2.8px';
        for (const tg of TAGS) {
          if (t < tg.at) continue;
          const a = 1 - seg(t, TAG_OUT, TAG_OUT + 0.25);
          if (a <= 0) continue;
          const [wx, wy] = tg.anchor();
          const x = SX(wx, wy) + tg.off[0], y = SY(wx, wy) + tg.off[1];
          const u = seg(t, tg.at, tg.at + 0.32);
          const s = Brand.scrambleFrame('', tg.text, u, { time: (t - tg.at), seed: 7 + tg.text.length });
          g.globalAlpha = a;
          g.fillStyle = tg.col;
          if (tg.icon === 'dia') { g.save(); g.translate(x + 6, y - 7); g.rotate(Math.PI / 4); g.fillRect(-5, -5, 10, 10); g.restore(); }
          else { g.strokeStyle = tg.col; g.lineWidth = 2.2; g.beginPath(); g.arc(x + 6, y - 7, 6, 0, Math.PI * 2); g.stroke(); }
          g.fillText(s, x + 24, y);
          g.globalAlpha = 1;
        }
        g.letterSpacing = '0px';

        // speed ramp into the light
        const ub = seg(t, T_RAMP, 4.0);
        if (ub > 0) {
          const e = ub * ub * ub;
          const R = 40 + 1500 * e;
          const gr = g.createRadialGradient(M.qx, M.qy, 0, M.qx, M.qy, R);
          gr.addColorStop(0, rgba(C.ink, Math.min(1, 0.4 + 0.6 * ub)));
          gr.addColorStop(0.3, rgba(C.ink, 0.9 * e));
          gr.addColorStop(0.62, rgba(C.amberLight, 0.5 * e));
          gr.addColorStop(1, rgba(C.amber, 0));
          g.fillStyle = gr; g.fillRect(0, 0, W, H);
        }
      });
    },
  });
})();
