/* c07b-commit (film 44.0-48.0; local 0 = 44.0): COMMIT in the DESERT CANYON. docs/storyboard-v4.md.
 * A dark engraving (scratchboard) world seen straight down: a dune sea of flowing streamlines, a mesa cut by a
 * hachured canyon. Picks up c07a's whip: the world is still sliding left when it cuts in.
 *   0.00  CUT IN MOVING: the camera slides right fast (expo.out) and settles on a fork in the road; the convoy
 *         (amber markers JK / NC / EK, nose to tail) rolls up to it and brakes. Three options fan out from the fork
 *         as dashed lines: A · RIDGE (up onto the mesa), B · CANYON (down the gorge), C · ERG (across the dunes);
 *         a scan pulse runs A, B, C on the 1/16ths: the team is weighing them.
 *   0.30  (44.3, VO 'Commit.') the stamp SLAMS onto route B (LOCKED), B turns solid amber with a light wave racing
 *         down it, the camera takes the hit (shake); 'Commit.' slams in huge (ink, amber full stop).
 *   0.42-1.15  A and C BURN OFF from the fork outward: a white-hot front, sparks, red embers, ash; their labels
 *         are struck out.
 *   1.15  the word docks bottom-left under MAKE YOUR MOVE · 02 / 03.
 *   0.95-4.0  the convoy accelerates down the canyon (speed ramp ~ u^2.6), the camera slides with it top-down,
 *         turning with the gorge; dust plumes; real motion blur grows with the speed.
 *   3.55-3.967  hand-off: the camera pushes in and races ahead (expo.in) into the cut to c07c at 48.0.
 */
(function () {
  'use strict';
  const ID = 'c07b-commit';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const ease = (n) => gsap.parseEase(n);
  const eo = ease('expo.out'), ei = ease('expo.in'), p2 = ease('power2.inOut'), p2i = ease('power2.in'), p3o = ease('power3.out'), p2o = ease('power2.out');
  const T_HIT = 0.3, T_GO = 0.95, T_DOCK = 1.15, T_PUSH = 3.55;
  const NAMES = ['JK', 'NC', 'EK'];
  const GAP = 54;
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const rgba = (c, a) => B.rgba(c, clamp(a, 0, 1).toFixed(3));

  Film.scene({
    id: ID,
    duration: 4,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`[data-scene="${ID}"] { background: ${C.map}; }
        [data-scene="${ID}"] .c7b-word { position:absolute; left:104px; top:0; font: 620 292px/1 var(--display); letter-spacing:-0.055em; color:${C.ink}; white-space:nowrap; transform-origin: 0 0; }
        [data-scene="${ID}"] .c7b-word .ch { display:inline-block; transform-origin: 50% 80%; }
        [data-scene="${ID}"] .c7b-word .dot { color:${C.amber}; }
        [data-scene="${ID}"] .c7b-opt { position:absolute; left:0; top:0; display:flex; align-items:center; gap:10px; font: 600 20px/1 var(--mono); letter-spacing:.14em; color:${C.bone}; white-space:pre; text-shadow: 0 0 8px rgba(15,13,10,.95), 0 0 18px rgba(15,13,10,.9); }
        [data-scene="${ID}"] .c7b-opt .k { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border:2px solid currentColor; border-radius:50%; font-weight:700; letter-spacing:0; }
        [data-scene="${ID}"] .c7b-opt .x { position:absolute; left:-6px; right:-6px; top:50%; height:3px; background:${C.rival}; transform-origin: 0 50%; }
        [data-scene="${ID}"] .c7b-eb { position:absolute; left:120px; top:836px; display:flex; align-items:center; gap:14px; font: 600 22px/1 var(--mono); letter-spacing:.14em; color:${C.bone}; white-space:pre; }
        [data-scene="${ID}"] .c7b-eb i { width:12px; height:12px; background:${C.amber}; transform: rotate(45deg); display:block; }`);

      const DM = WorldWild.desertModel();
      const R = DM.ROUTES, FORK = DM.FORK;
      // the convoy's road: the inbound road, then the canyon (route B)
      const ROAD = WorldWild.measure(R.inbound.pl.concat(R.b.pl.slice(1)));
      const LIN = R.inbound.len;
      const sLead = (t) => {
        if (t < T_HIT) return lerp(LIN - 330, LIN - 70, eo(seg(t, 0, T_HIT)));
        if (t < T_GO) return LIN - 70;
        const u = (t - T_GO) / (4 - T_GO);
        return LIN - 70 + 4300 * Math.pow(u, 2.6);
      };
      const at = (s) => WorldWild.at(ROAD, s);
      // camera: settle on the fork, then ride with the convoy
      const angAhead = (s) => { let x = 0, y = 0; for (const d of [120, 260, 420, 600]) { const p = at(s + d); x += Math.cos(p[2]); y += Math.sin(p[2]); } return Math.atan2(y, x); };
      const camAt = (t) => {
        const slide = eo(seg(t, 0, 0.42));
        const hold = { cx: FORK[0] + 330 + 40 * seg(t, 0.4, 1.2), cy: FORK[1] + 40, zoom: 0.8, rot: 0 };
        let cx = lerp(hold.cx - 1000, hold.cx, slide), cy = hold.cy, zoom = lerp(0.76, 0.8, slide), rot = lerp(-4, 0, slide);
        const f = p2(seg(t, T_GO + 0.1, T_GO + 0.9));
        if (f > 0) {
          const s = sLead(t);
          const c = at(s + 330);
          const a = angAhead(s);
          cx = lerp(cx, c[0], f); cy = lerp(cy, c[1] + 10, f);
          zoom = lerp(zoom, 0.9, f);
          rot = lerp(rot, -a * 180 / Math.PI * 0.8, f);
        }
        // the stamp hit
        let sx = 0, sy = 0;
        if (t >= T_HIT) { const u = t - T_HIT; sx += 9 * Math.exp(-u * 14) * Math.sin(u * 80); sy += 12 * Math.exp(-u * 14) * Math.sin(u * 67 + 0.7); zoom *= 1 + 0.03 * Math.exp(-u * 9); }
        if (t > T_PUSH) { const w = ei(seg(t, T_PUSH, 4.0)); zoom *= 1 + 0.45 * w; const s = sLead(t), c = at(s + 330 + 900 * w); cx = c[0]; cy = c[1]; }
        return { cx, cy, zoom, rot, sx, sy };
      };
      const D = WorldWild.desert(ctx, { camAt });

      // ---- options: A (ridge), B (canyon, committed), C (erg) ---------------------------------------------
      const OPT = [R.a, R.b, R.c];
      const BURN = { 0: [0.42, 1.1], 2: [0.5, 1.18] };
      const burnS = (i, t) => { const b = BURN[i]; return b ? OPT[i].len * p2i(seg(t, b[0], b[1])) : -1; };
      const burnTime = (i, s) => { const b = BURN[i]; const u = Math.sqrt(clamp(s / OPT[i].len, 0, 1)); return b[0] + (b[1] - b[0]) * u; }; // inverse of power2.in
      const OPT_LEN = [1500, 4300, 1500];

      D.ground((g, lt, W2) => {
        const P = W2.P;
        g.lineJoin = 'round'; g.lineCap = 'round';
        // the inbound road: an engraved double line
        W2.line(g, WorldWild.slice(ROAD, 0, LIN));
        g.strokeStyle = rgba(C.bone, 0.55); g.lineWidth = 7; g.stroke();
        g.strokeStyle = C.map; g.lineWidth = 3.5; g.stroke();
        // options before the commit: dashed, flowing outward; a scan pulse runs A, B, C
        for (let i = 0; i < 3; i++) {
          const Pp = OPT[i];
          const len = Math.min(Pp.len, OPT_LEN[i]);
          if (i === 1 && lt >= T_HIT) continue;
          const bs = i !== 1 ? burnS(i, lt) : -1;
          const s0 = Math.max(0, bs);
          if (s0 >= len) continue;
          const scan = lt < T_HIT ? Math.exp(-(((lt - (0.04 + i * 0.075)) / 0.05) ** 2)) : 0;
          W2.line(g, WorldWild.slice(Pp, s0, len));
          g.setLineDash([12, 10]); g.lineDashOffset = -lt * 120;
          g.strokeStyle = rgba(C.bone, 0.65 + 0.35 * scan); g.lineWidth = 3 + 2.5 * scan; g.stroke();
          g.setLineDash([]);
        }
        // burn: ash and embers behind the front (age along the line), sparks off the front
        for (const i of [0, 2]) {
          const Pp = OPT[i], bs = burnS(i, lt);
          if (bs <= 0) continue;
          const step = 14;
          for (let s = 0; s < bs; s += step) {
            const age = lt - burnTime(i, s + step * 0.5);
            const a = at2(Pp, s), b = at2(Pp, Math.min(bs, s + step));
            const qa = P.pt(a[0], a[1]); const ax = qa[0], ay = qa[1];
            const qb = P.pt(b[0], b[1]);
            let col, alpha, lw;
            if (age < 0.06) { col = C.amberLight; alpha = 1; lw = 6; }
            else if (age < 0.4) { const k = (age - 0.06) / 0.34; col = C.rival; alpha = 1 - 0.55 * k; lw = 5 - 3 * k; }
            else { col = C.bone; alpha = 0.18 * (1 - seg(age, 0.4, 1.1)); lw = 1.5; }
            if (alpha <= 0.01) continue;
            g.strokeStyle = rgba(col, alpha); g.lineWidth = lw;
            g.beginPath(); g.moveTo(ax, ay); g.lineTo(qb[0], qb[1]); g.stroke();
          }
          // the front: a white-hot head with a glow
          if (bs < Pp.len * 0.999) {
            const f = at2(Pp, bs), q = P.pt(f[0], f[1]); const fx = q[0], fy = q[1];
            const gr = g.createRadialGradient(fx, fy, 0, fx, fy, 46);
            gr.addColorStop(0, 'rgba(255,244,222,0.95)'); gr.addColorStop(0.25, rgba(C.amber, 0.6)); gr.addColorStop(1, rgba(C.rival, 0));
            g.fillStyle = gr; g.beginPath(); g.arc(fx, fy, 46, 0, Math.PI * 2); g.fill();
          }
          // sparks: spawned as the front passes, flung sideways
          for (let k = 0; k < 90; k++) {
            const s = (k + 0.5) / 90 * Pp.len;
            if (s > bs) break;
            const age = lt - burnTime(i, s);
            if (age < 0 || age > 0.5) continue;
            const r1 = hash(k, i * 7 + 1), r2 = hash(k, i * 7 + 2);
            const p = at2(Pp, s);
            const side = r1 < 0.5 ? -1 : 1, sp = 120 + 260 * r2;
            const nx = -Math.sin(p[2]) * side, ny = Math.cos(p[2]) * side;
            const d = sp * age * (1 - age * 0.9);
            const x = p[0] + nx * d + Math.cos(p[2]) * 60 * age, y = p[1] + ny * d + Math.sin(p[2]) * 60 * age;
            const q = P.pt(x, y); const qx = q[0], qy = q[1];
            const q2 = P.pt(x - nx * 14, y - ny * 14);
            g.strokeStyle = rgba(age < 0.15 ? C.amberLight : C.rival, 1 - age / 0.5); g.lineWidth = 2;
            g.beginPath(); g.moveTo(qx, qy); g.lineTo(q2[0], q2[1]); g.stroke();
          }
        }
        // the committed route: solid amber from the hit, a light wave racing down it
        if (lt >= T_HIT) {
          const Pb = OPT[1];
          const wave = 4300 * p3o(seg(lt, T_HIT, T_HIT + 1.1));
          W2.line(g, WorldWild.slice(Pb, 0, Math.min(Pb.len, Math.max(60, wave))));
          g.strokeStyle = rgba(C.amber, 0.22); g.lineWidth = 16; g.stroke();
          g.strokeStyle = C.amber; g.lineWidth = 5; g.stroke();
          if (wave < 4300) {
            const f = at2(Pb, wave), q = P.pt(f[0], f[1]); const fx = q[0], fy = q[1];
            const gr = g.createRadialGradient(fx, fy, 0, fx, fy, 34);
            gr.addColorStop(0, 'rgba(255,244,222,0.95)'); gr.addColorStop(1, rgba(C.amber, 0));
            g.fillStyle = gr; g.beginPath(); g.arc(fx, fy, 34, 0, Math.PI * 2); g.fill();
          }
        }
        // the convoy's trail on the road behind it
        const sl = sLead(lt);
        W2.line(g, WorldWild.slice(ROAD, Math.max(0, sl - 2 * GAP - 900), sl - 2 * GAP));
        const tg = g.createLinearGradient(0, 0, 1, 0); void tg;
        g.strokeStyle = rgba(C.amberLight, 0.9); g.lineWidth = 3; g.stroke();
        // dust plumes: puffs spawned on a fixed 1/40 s grid behind each marker, drifting out and fading
        for (let m = 0; m < 3; m++) {
          for (let j = Math.floor((lt - 0.9) * 40); j <= Math.floor(lt * 40); j++) {
            const ts = j / 40; if (ts < 0) continue;
            const age = lt - ts; if (age < 0 || age > 0.9) continue;
            const v = (sLead(ts + 0.02) - sLead(ts)) / 0.02;
            if (v < 80) continue;
            const sp = sLead(ts) - m * GAP - 10;
            const p = at(sp);
            const r1 = hash(j, m * 3 + 11), r2 = hash(j, m * 3 + 12);
            const side = (r1 - 0.5) * 2;
            const spread = (20 + 70 * age) * side;
            const x = p[0] - Math.sin(p[2]) * spread - Math.cos(p[2]) * 40 * age, y = p[1] + Math.cos(p[2]) * spread - Math.sin(p[2]) * 40 * age;
            const q = P.pt(x, y);
            const rad = (6 + 26 * age) * P.zoom * (0.7 + 0.6 * r2);
            g.fillStyle = rgba(C.bone, 0.16 * (1 - age / 0.9) * clamp(v / 900, 0.3, 1));
            g.beginPath(); g.arc(q[0], q[1], rad, 0, Math.PI * 2); g.fill();
          }
        }
      });
      const at2 = (Pp, s) => WorldWild.at(Pp, s);

      // ---- top: stamp, markers ------------------------------------------------------------------------------
      const STAMP_S = 210;
      D.top((g, lt, W2) => {
        const P = W2.P;
        // stamp: comes down from 2.4x, lands on the hit, a dust ring bursts
        const su = seg(lt, T_HIT - 0.1, T_HIT);
        if (su > 0) {
          const p = at2(OPT[1], STAMP_S), q = P.pt(p[0], p[1]); const qx = q[0], qy = q[1] - 70;
          const land = lt >= T_HIT;
          const sc = land ? 1 + 0.08 * Math.exp(-(lt - T_HIT) * 18) * Math.cos((lt - T_HIT) * 50) : lerp(2.6, 1, p2i(su));
          const al = land ? 1 : su;
          if (land) {
            const ru = seg(lt, T_HIT, T_HIT + 0.55);
            if (ru < 1) {
              g.strokeStyle = rgba(C.amber, 0.8 * (1 - ru)); g.lineWidth = 3 * (1 - ru) + 1;
              g.beginPath(); g.ellipse(qx, qy + 10, 130 + 260 * p2o(ru), (130 + 260 * p2o(ru)) * 0.62, 0, 0, Math.PI * 2); g.stroke();
            }
          }
          g.save();
          g.translate(qx, qy); g.rotate(P.rot - 0.12); g.scale(sc, sc);
          g.globalAlpha = al;
          const w = 248, h = 74;
          g.fillStyle = rgba(C.map, 0.82); g.fillRect(-w / 2, -h / 2, w, h);
          g.strokeStyle = C.amber; g.lineWidth = 4; g.strokeRect(-w / 2, -h / 2, w, h);
          g.lineWidth = 1.6; g.strokeRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14);
          g.fillStyle = C.amber; g.font = '800 38px "JetBrains Mono Variable"'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText('LOCKED', 0, 2);
          g.restore();
        }
        // markers: amber discs nose to tail, heading chevron on the lead
        const sl = sLead(lt);
        for (let m = 2; m >= 0; m--) {
          const p = at(sl - m * GAP), q = P.pt(p[0], p[1]); const qx = q[0], qy = q[1];
          const gr = g.createRadialGradient(qx, qy, 0, qx, qy, 46);
          gr.addColorStop(0, rgba(C.amber, 0.35)); gr.addColorStop(1, rgba(C.amber, 0));
          g.fillStyle = gr; g.beginPath(); g.arc(qx, qy, 46, 0, Math.PI * 2); g.fill();
          const r = 17;
          g.fillStyle = C.amber; g.strokeStyle = C.bg; g.lineWidth = 3;
          g.beginPath(); g.arc(qx, qy, r, 0, Math.PI * 2); g.fill(); g.stroke();
          g.fillStyle = C.bg; g.font = '700 14px "JetBrains Mono Variable"'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(NAMES[m], qx, qy + 0.5);
          if (m === 0) {
            const a = p[2] + P.rot;
            g.save(); g.translate(qx, qy); g.rotate(a);
            g.fillStyle = C.amber; g.beginPath(); g.moveTo(r + 18, 0); g.lineTo(r + 6, -9); g.lineTo(r + 9, 0); g.lineTo(r + 6, 9); g.closePath(); g.fill();
            g.restore();
          }
        }
      });

      // ---- option labels (DOM, ride their lines), struck out as they burn -------------------------------------
      const LAB = [['A', 'RIDGE'], ['B', 'CANYON'], ['C', 'ERG']].map(([k, nm], i) => {
        const e = ctx.el('div', 'c7b-opt', root, `<span class="k">${k}</span><span class="n">${nm}</span><span class="x"></span>`);
        return { e, n: e.querySelector('.n'), x: e.querySelector('.x'), s: [300, 330, 300][i] };
      });
      ctx.onFrame((lt) => {
        const P = D.P; if (!P) return;
        LAB.forEach((L, i) => {
          const p = at2(OPT[i], L.s), q = P.pt(p[0], p[1]);
          const off = i === 0 ? [-30, -58] : i === 1 ? [-20, -62] : [-10, 30];
          L.e.style.transform = `translate(${(q[0] + off[0]).toFixed(1)}px, ${(q[1] + off[1]).toFixed(1)}px)`;
          const show = seg(lt, 0.02 + i * 0.05, 0.14 + i * 0.05);
          let op = show;
          if (i !== 1) {
            const bt = burnTime(i, L.s);
            const k = seg(lt, bt - 0.02, bt + 0.08);
            L.x.style.transform = `scaleX(${k.toFixed(3)})`;
            op *= 1 - 0.75 * seg(lt, bt + 0.1, bt + 0.45);
            L.e.style.color = k > 0 ? C.rival : C.bone;
          } else {
            L.x.style.transform = 'scaleX(0)';
            L.e.style.color = lt >= T_HIT ? C.amber : C.bone;
          }
          op *= 1 - seg(lt, T_GO + 0.5, T_GO + 0.8);
          L.e.style.opacity = op.toFixed(3);
        });
      });

      // ---- type -----------------------------------------------------------------------------------------------
      const word = ctx.el('div', 'c7b-word', root, '');
      const chars = 'Commit'.split('').map((ch) => ctx.el('span', 'ch', word, ch));
      const dot = ctx.el('span', 'ch dot', word, '.');
      gsap.set(word, { x: 0, y: 676, scale: 1 });
      tl.fromTo(chars.concat([dot]), { yPercent: -16, scale: 1.34, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'expo.out', stagger: 0.018 }, T_HIT - 0.04);
      tl.to(word, { scale: 120 / 292, x: 16, y: 884, duration: 0.6, ease: 'expo.inOut' }, T_DOCK);
      const eb = ctx.el('div', 'c7b-eb', root, '<i></i><span></span>');
      const ebT = eb.querySelector('span');
      tl.fromTo(eb, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, T_DOCK + 0.4);
      B.scrambleTo(tl, ebT, 'MAKE YOUR MOVE · 02 / 03', T_DOCK + 0.4, 0.5);
      tl.to([word, eb], { x: '-=700', opacity: 0, duration: 0.4, ease: 'expo.in' }, T_PUSH + 0.02);

      B.hud(ctx, { inset: 64, color: C.bone, tc: false, slug: '', drawIn: true, at: 0.05, ticks: true, alpha: 0.55, out: T_PUSH + 0.1 });
    },
  });
})();
