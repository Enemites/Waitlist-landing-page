/* c02-face: film 8.0-12.0 (local 0 = film 8.0). 'Face another team' (docs/storyboard-v4.md). First bright scene.
 *
 *   0.00 (8.0)   HIT: the seed point (leaning on the slant on c01's last frames) SPLITS: amber and red-orange
 *                tokens tear apart along the brand slant (34 deg) and the frame flips to an INK ground; a charcoal
 *                ring bursts. The tokens snap to opposite corners (amber lower-left, red-orange upper-right),
 *                drawing the slant seam between them (expo.out, 0.5 s).
 *   0.70 (8.7)   FACE: scale punch (2.6x -> 1 in 4 frames, smear copies), frame jolt, tokens kicked.
 *   1.067 (9.07) ANOTHER: slams in along the slant from the lower left (4 frames, directional smear).
 *   1.40 (9.40)  TEAM.: a red-orange slab wipes across on the slant, the word (red-orange) left behind it.
 *                The three words form one poster, stepped top-left to bottom-right (the X with the tokens'
 *                diagonal); a slow push until the break.
 *   2.00 (10.0)  BREAK: the poster is sliced along the slant into bands that snap sideways (and again 2.25);
 *                2.40-3.30 the bands fly off along the slant, the centre band first (a dark runway opens along
 *                the tokens' line), revealing charcoal.
 *   2.00-2.60    the tokens draw back (anticipation); 2.60-3.75 they race at each other down the runway
 *                (d = 820 (1 - u^4): a speed ramp, light streaks growing with speed).
 *   3.75 (11.75) COLLISION at frame centre: white-hot flash (ink frame), a streak along the slant, the hot core
 *                settles; last frame (11.967) = dark ground + the hot core at centre (c03 opens on its shockwave).
 */
(function () {
  'use strict';
  const ID = 'c02-face';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, CX = 960, CY = 540, FPS = 30;
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const DISPLAY = '"Manrope Variable", sans-serif';
  const sat = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => sat((t - a) / (b - a));
  const sm = (a, b, x) => { const t = seg(x, a, b); return t * t * (3 - 2 * t); };
  const eo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const p2o = (x) => 1 - (1 - x) * (1 - x);
  const p3i = (x) => x * x * x;
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const rgba = (c, a) => { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; };
  function ih(a, b) { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }

  // the brand slant: D runs up to the right, N is its normal (down-right)
  const SL = B.SLANT * DEG, DX = Math.cos(SL), DY = -Math.sin(SL), NX = Math.sin(SL), NY = Math.cos(SL);
  const T_FACE = 0.7, T_ANOTHER = 1.0667, T_TEAM = 1.4, T_BREAK = 2.0, T_BREAK2 = 2.25, T_FLY = 2.4, T_RACE = 2.6, T_HIT = 3.75;
  const D_REST = 760, D_BACK = 820;
  const PAD = 220; // poster margin (ink beyond the frame so sliced bands never show their ends early)

  Film.scene({
    id: ID,
    duration: 4,
    build(ctx) {
      const { root } = ctx;
      ctx.css(`[data-scene="${ID}"] .c2-bg { position:absolute; inset:0; background:${C.bg}; }`);
      ctx.el('div', 'c2-bg', root);
      const { g } = ctx.canvas({ className: 'c2-main' });

      // ---- words, rendered at 2x into their own canvases ----
      const RES = 2;
      function makeWord(text, targetW, color, weight) {
        const m = document.createElement('canvas').getContext('2d');
        m.font = `${weight} 100px ${DISPLAY}`; m.letterSpacing = '-4px';
        const w100 = m.measureText(text).width;
        const size = Math.round(100 * targetW / w100);
        m.font = `${weight} ${size}px ${DISPLAY}`; m.letterSpacing = `${(-0.04 * size).toFixed(1)}px`;
        const mt = m.measureText(text), capH = m.measureText('H').actualBoundingBoxAscent;
        const left = mt.actualBoundingBoxLeft, right = mt.actualBoundingBoxRight, asc = mt.actualBoundingBoxAscent, desc = mt.actualBoundingBoxDescent;
        const pw = Math.ceil(left + right + 40), ph = Math.ceil(asc + desc + 40);
        const cv = document.createElement('canvas'); cv.width = pw * RES; cv.height = ph * RES;
        const cg = cv.getContext('2d'); cg.scale(RES, RES);
        cg.font = m.font; cg.letterSpacing = m.letterSpacing; cg.fillStyle = color; cg.textBaseline = 'alphabetic';
        cg.fillText(text, 20 + left, 20 + asc);
        // ox/oy: canvas px from the canvas origin to the glyph box's left / baseline
        return { cv, pw, ph, ox: 20, oy: 20 + asc, inkW: left + right, capH, size };
      }
      const WFACE = makeWord('FACE', 1090, C.bg, 800);
      const WANOT = makeWord('ANOTHER', 1440, C.bg, 800);
      const WTEAM = makeWord('TEAM.', 1150, C.rival, 800);
      const GAP = 46;
      const totalH = WFACE.capH + WANOT.capH + WTEAM.capH + 2 * GAP;
      const top = CY - totalH / 2 + 6;
      // positions: x of the glyph box's left edge, y of the baseline
      const POS = {
        face: { x: 150, y: top + WFACE.capH },
        another: { x: CX - WANOT.inkW / 2, y: top + WFACE.capH + GAP + WANOT.capH },
        team: { x: 1775 - WTEAM.inkW, y: top + WFACE.capH + GAP + WANOT.capH + GAP + WTEAM.capH },
      };
      function drawWord(gg, Wd, P, dx, dy, s, a) {
        // s scales about the word's centre
        const cx = P.x + Wd.inkW / 2, cy = P.y - Wd.capH / 2;
        gg.save(); gg.globalAlpha = a;
        gg.translate(cx + dx, cy + dy); gg.scale(s, s); gg.translate(-cx, -cy);
        gg.drawImage(Wd.cv, P.x - Wd.ox, P.y - Wd.oy, Wd.pw, Wd.ph);
        gg.restore();
      }
      // the finished poster (ink ground + words), with a margin, for the slice break
      const poster = document.createElement('canvas'); poster.width = W + 2 * PAD; poster.height = H + 2 * PAD;
      const pgc = poster.getContext('2d');
      pgc.fillStyle = C.ink; pgc.fillRect(0, 0, poster.width, poster.height);
      pgc.translate(PAD, PAD);
      drawSeam(pgc, 1, D_REST);
      drawWord(pgc, WFACE, POS.face, 0, 0, 1, 1); drawWord(pgc, WANOT, POS.another, 0, 0, 1, 1); drawWord(pgc, WTEAM, POS.team, 0, 0, 1, 1);

      function drawSeam(gg, a, d, w, al) {
        if (a <= 0 || d <= 1) return;
        gg.strokeStyle = rgba(C.bg, (al == null ? 0.22 : al) * a); gg.lineWidth = w || 2;
        gg.beginPath(); gg.moveTo(CX - DX * d, CY - DY * d); gg.lineTo(CX + DX * d, CY + DY * d); gg.stroke();
      }

      // ---- slices: bands parallel to the slant (offsets along D) ----
      const rs = ctx.rng('c02-slices');
      const edges = [-70, 70];
      for (let e = 70; e < 1100;) { e += rs.range(130, 290); edges.push(e); }
      for (let e = -70; e > -1100;) { e -= rs.range(130, 290); edges.unshift(e); }
      const fixed = [];
      for (let i = 0; i < edges.length - 1; i++) fixed.push({ s0: edges[i], s1: edges[i + 1], runway: edges[i] === -70 });
      fixed.forEach((b, i) => {
        const dist = Math.min(Math.abs(b.s0), Math.abs(b.s1));
        b.g1 = (i % 2 ? 1 : -1) * rs.range(16, 64);          // glitch snap on 2.0
        b.g2 = b.g1 + (i % 2 ? -1 : 1) * rs.range(10, 40);   // second snap on 2.25
        b.dir = b.runway ? 1 : (i % 2 ? 1 : -1);
        b.t0 = b.runway ? T_FLY : T_FLY + 0.1 + dist / 1000 * 0.45 + rs.range(0, 0.06);
        b.dur = rs.range(0.38, 0.5);
      });
      const SLICES = fixed;
      function bandOffset(b, t) {
        if (t < T_BREAK) return 0;
        let o = t < T_BREAK2 ? b.g1 * (1 + 0.15 * (1 - eo(seg(t, T_BREAK, T_BREAK + 0.12)))) : b.g2;
        if (t >= b.t0) o += b.dir * 3200 * p3i(seg(t, b.t0, b.t0 + b.dur));
        return o;
      }
      function bandPoly(gg, b) {
        const L = 2600;
        gg.beginPath();
        gg.moveTo(CX + NX * b.s0 - DX * L, CY + NY * b.s0 - DY * L); gg.lineTo(CX + NX * b.s0 + DX * L, CY + NY * b.s0 + DY * L);
        gg.lineTo(CX + NX * b.s1 + DX * L, CY + NY * b.s1 + DY * L); gg.lineTo(CX + NX * b.s1 - DX * L, CY + NY * b.s1 - DY * L); gg.closePath();
      }

      // ---- the two tokens ----
      const kick = (t, at) => (t >= at ? Math.exp(-(t - at) * 9) * Math.sin(Math.min(Math.PI, (t - at) * 30)) : 0);
      function tokenD(t) {
        if (t < 0.5) return lerp(70, D_REST, eo(t / 0.5));
        if (t < T_BREAK) return D_REST + 26 * (kick(t, T_FACE) + kick(t, T_ANOTHER) + kick(t, T_TEAM));
        if (t < T_RACE) return lerp(D_REST, D_BACK, p2o(seg(t, T_BREAK, T_RACE)));
        if (t < T_HIT) { const u = seg(t, T_RACE, T_HIT); return D_BACK * (1 - Math.pow(u, 4)); }
        return 0;
      }
      function shake(t) {
        let x = 0, y = 0;
        for (const [at, amp] of [[T_FACE, 16], [T_ANOTHER, 10], [T_TEAM, 12], [T_BREAK, 8]]) {
          if (t < at || t > at + 0.25) continue;
          const f = Math.floor((t - at) * FPS), e = Math.exp(-(t - at) * 16) * amp;
          x += (ih(f, at * 100) - 0.5) * 2 * e; y += (ih(f + 9, at * 100) - 0.5) * 2 * e;
        }
        return [x, y];
      }
      function token(x, y, col, onInk, r, glow) {
        if (glow > 0) {
          const gr = g.createRadialGradient(x, y, 0, x, y, 90);
          gr.addColorStop(0, rgba(col, 0.55 * glow)); gr.addColorStop(1, rgba(col, 0));
          g.fillStyle = gr; g.fillRect(x - 90, y - 90, 180, 180);
        }
        if (onInk > 0) { g.fillStyle = rgba(C.bg, onInk); g.beginPath(); g.arc(x, y, r + 5, 0, TAU); g.fill(); }
        g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
      function streak(x, y, ux, uy, len, col, w) {
        if (len < 2) return;
        const lg = g.createLinearGradient(x, y, x - ux * len, y - uy * len);
        lg.addColorStop(0, rgba(col, 0.95)); lg.addColorStop(1, rgba(col, 0));
        g.strokeStyle = lg; g.lineWidth = w; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - ux * len, y - uy * len); g.stroke();
      }

      const rl = ctx.rng('c02-speed');
      const SPEED = Array.from({ length: 70 }, () => ({ s: rl.range(-950, 950), p0: rl.range(-1500, 1500), len: rl.range(160, 620), w: rl.range(1.5, 2.6), a: rl.range(0.12, 0.4), amber: rl() < 0.3 }));
      function speedLines(t) {
        const trav = (D_BACK - tokenD(t)) * 2.4, vis = sm(T_RACE, T_RACE + 0.3, t);
        if (vis <= 0) return;
        g.lineCap = 'round';
        for (const L of SPEED) {
          const sign = L.s < 0 ? -1 : 1;        // upper-left side streams one way, lower-right the other
          let p = L.p0 + sign * trav; p = ((p + 1500) % 3000 + 3000) % 3000 - 1500;
          const x = CX + NX * L.s + DX * p, y = CY + NY * L.s + DY * p;
          g.strokeStyle = rgba(L.amber ? C.amber : C.bone, L.a * vis); g.lineWidth = L.w;
          const ll = L.len * (0.5 + sat((tokenD(t - 1 / FPS) - tokenD(t)) / 60));
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + DX * ll * sign, y + DY * ll * sign); g.stroke();
        }
      }

      ctx.onFrame((t) => {
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
        const [sx, sy] = shake(t);
        const push = 1 + 0.03 * p2o(seg(t, T_TEAM, T_BREAK + 0.6));
        const runwayOpen = SLICES.some((b) => b.runway && t >= b.t0 + 0.05);
        if (t < T_HIT) {
          if (t < T_BREAK) {
            // ---- the poster being built ----
            g.save(); g.translate(sx, sy);
            g.translate(CX, CY); g.scale(push, push); g.translate(-CX, -CY);
            g.fillStyle = C.ink; g.fillRect(-PAD, -PAD, W + 2 * PAD, H + 2 * PAD);
            { const v = eo(seg(t, 0, 0.45)); drawSeam(g, 1, tokenD(Math.min(t, 0.5)), lerp(16, 2, v), lerp(1, 0.22, v)); }
            // FACE: scale punch
            if (t >= 0.5667) {
              const p = seg(t, 0.5667, T_FACE), s = 1 + 1.6 * (1 - p) * (1 - p);
              if (p < 1) { drawWord(g, WFACE, POS.face, 0, 0, s * 1.3, 0.12); drawWord(g, WFACE, POS.face, 0, 0, s * 1.14, 0.25); }
              drawWord(g, WFACE, POS.face, 0, 0, s, 1);
            }
            // ANOTHER: slides in on the slant from the lower left
            if (t >= 0.9333) {
              const p = seg(t, 0.9333, T_ANOTHER), off = 1500 * Math.pow(1 - p, 3);
              if (p < 1) for (const [k, a] of [[1.6, 0.12], [1.25, 0.28]]) drawWord(g, WANOT, POS.another, -DX * off * k, -DY * off * k, 1, a);
              drawWord(g, WANOT, POS.another, -DX * off, -DY * off, 1, 1);
            }
            // TEAM.: revealed behind a red-orange slab sweeping right on the slant
            if (t >= 1.2667) {
              const p = seg(t, 1.2667, T_TEAM + 0.1);
              const yMid = POS.team.y - WTEAM.capH / 2, x0 = POS.team.x - 380, x1 = POS.team.x + WTEAM.inkW + 560;
              const xe = lerp(x0, x1, p2o(p)), SW = 170, hh = WTEAM.capH / 2 + 40, ex = hh * DX / -DY;
              g.save();
              g.beginPath(); g.moveTo(-PAD, yMid - hh); g.lineTo(xe - SW + ex, yMid - hh); g.lineTo(xe - SW - ex, yMid + hh); g.lineTo(-PAD, yMid + hh); g.closePath(); g.clip();
              drawWord(g, WTEAM, POS.team, 0, 0, 1, 1);
              g.restore();
              if (p < 1) {
                g.fillStyle = C.rival; g.beginPath();
                g.moveTo(xe - SW + ex, yMid - hh); g.lineTo(xe + ex, yMid - hh); g.lineTo(xe - ex, yMid + hh); g.lineTo(xe - SW - ex, yMid + hh); g.closePath(); g.fill();
              }
            }
            g.restore();
          } else {
            // ---- the break: bands parallel to the slant snap, then fly off along it ----
            g.save(); g.translate(sx, sy);
            for (const b of SLICES) {
              const o = bandOffset(b, t);
              if (Math.abs(o) > 3000) continue;
              g.save(); bandPoly(g, b); g.clip();
              g.translate(DX * o, DY * o);
              g.translate(CX, CY); g.scale(push, push); g.translate(-CX, -CY);
              g.drawImage(poster, -PAD, -PAD);
              g.restore();
            }
            // fresh cut lines flash on the snaps
            const fl = Math.max(t < T_BREAK + 0.1 ? 1 - seg(t, T_BREAK, T_BREAK + 0.1) : 0, t >= T_BREAK2 && t < T_BREAK2 + 0.1 ? 1 - seg(t, T_BREAK2, T_BREAK2 + 0.1) : 0);
            if (fl > 0) {
              g.strokeStyle = rgba(C.rival, fl); g.lineWidth = 3; g.beginPath();
              for (const b of SLICES) { g.moveTo(CX + NX * b.s0 - DX * 2600, CY + NY * b.s0 - DY * 2600); g.lineTo(CX + NX * b.s0 + DX * 2600, CY + NY * b.s0 + DY * 2600); }
              g.stroke();
            }
            g.restore();
          }
          if (t >= T_RACE) speedLines(t);
          // ---- tokens ----
          const d = tokenD(t);
          const dPrev = tokenD(t - 1 / FPS);
          const speed = Math.abs(dPrev - d) * FPS;            // px/s
          const onInk = runwayOpen ? 0 : 1;
          const glow = runwayOpen ? 0.6 + 0.4 * sat(speed / 3000) : 0;
          const ax = CX - DX * d + sx, ay = CY - DY * d + sy, rx = CX + DX * d + sx, ry = CY + DY * d + sy;
          if (t < 0.5 || t >= T_RACE) {
            const len = t < 0.5 ? Math.min(d, speed * 0.09) : Math.min(D_BACK - d + 40, 30 + speed * 0.11);
            const w = t < 0.5 ? 6 : 5 + 4 * sat(speed / 4000);
            if (runwayOpen) { g.globalAlpha = 0.35; streak(ax, ay, DX, DY, len * 1.25, C.amber, w * 3.2); streak(rx, ry, -DX, -DY, len * 1.25, C.rival, w * 3.2); g.globalAlpha = 1; }
            streak(ax, ay, DX, DY, len, runwayOpen ? C.amberLight : C.amberDeep, w);
            streak(rx, ry, -DX, -DY, len, C.rival, w);
          }
          // split burst on 0.0 (a charcoal ring on the ink)
          if (t < 0.45) {
            const v = t / 0.45;
            g.strokeStyle = rgba(C.bg, (1 - v) * 0.95); g.lineWidth = lerp(22, 1.5, eo(v)); g.beginPath(); g.arc(CX, CY, 110 + 330 * eo(v), 0, TAU); g.stroke();
            g.strokeStyle = rgba(C.bg, (1 - v) * 0.5); g.lineWidth = lerp(5, 1, eo(v)); g.beginPath(); g.arc(CX, CY, 180 + 760 * eo(v * 0.9), 0, TAU); g.stroke();
          }
          // landing pulses on the tokens
          for (const at of [T_FACE, T_ANOTHER, T_TEAM]) {
            const e = t - at; if (e < 0 || e > 0.35) continue; const v = e / 0.35;
            g.strokeStyle = rgba(C.bg, (1 - v) * 0.7); g.lineWidth = 2.5;
            for (const [x, y] of [[ax, ay], [rx, ry]]) { g.beginPath(); g.arc(x, y, 22 + 50 * eo(v), 0, TAU); g.stroke(); }
          }
          const r = 15 + (t >= T_RACE ? 3 * sat(speed / 4000) : 0);
          token(ax, ay, C.amber, onInk, r, glow);
          token(rx, ry, C.rival, onInk, r, glow);
        } else {
          // ---- collision: white-hot flash, a streak on the slant, the hot core settles ----
          const e = t - T_HIT;
          const coreR = lerp(70, 14, eo(sat(e / 0.2)));
          const glowR = lerp(900, 170, eo(sat(e / 0.22)));
          const gr = g.createRadialGradient(CX, CY, 0, CX, CY, glowR);
          gr.addColorStop(0, rgba(C.amberLight, 0.95)); gr.addColorStop(0.25, rgba(C.amber, 0.45)); gr.addColorStop(1, rgba(C.amber, 0));
          g.fillStyle = gr; g.fillRect(CX - glowR, CY - glowR, glowR * 2, glowR * 2);
          const sl = lerp(2400, 300, eo(sat(e / 0.2))), sw = lerp(10, 2, sat(e / 0.2));
          const lg = g.createLinearGradient(CX - DX * sl, CY - DY * sl, CX + DX * sl, CY + DY * sl);
          lg.addColorStop(0, rgba(C.amberLight, 0)); lg.addColorStop(0.5, rgba(C.ink, 0.95)); lg.addColorStop(1, rgba(C.amberLight, 0));
          g.strokeStyle = lg; g.lineWidth = sw; g.beginPath(); g.moveTo(CX - DX * sl, CY - DY * sl); g.lineTo(CX + DX * sl, CY + DY * sl); g.stroke();
          g.fillStyle = C.amberLight; g.beginPath(); g.arc(CX, CY, coreR, 0, TAU); g.fill();
          g.fillStyle = C.ink; g.beginPath(); g.arc(CX, CY, coreR * 0.55, 0, TAU); g.fill();
          const e1 = Math.max(0, e - 1 / FPS);
          const hot = Math.exp(-e1 * 9), hr = lerp(1500, 500, sat(e1 / 0.2));
          const hg = g.createRadialGradient(CX, CY, 0, CX, CY, hr);
          hg.addColorStop(0, rgba(C.ink, 0.9 * hot)); hg.addColorStop(0.18, rgba(C.amberLight, 0.6 * hot)); hg.addColorStop(0.55, rgba(C.amber, 0.18 * hot)); hg.addColorStop(1, rgba(C.amber, 0));
          g.fillStyle = hg; g.fillRect(0, 0, W, H);
          const white = e < 1 / FPS ? 1 : 0.55 * Math.exp(-e1 * 40);
          if (white > 0.003) { g.fillStyle = rgba(C.ink, white); g.fillRect(0, 0, W, H); }
        }
      });
    },
  });
})();
