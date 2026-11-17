/* c07a-coordinate (film 40.0-44.0; local 0 = 40.0): COORDINATE on the ICE STATION. THE DROP.
 * docs/storyboard-v4.md. A light world (bright ice under a low polar sun) after the dark lobby: the drop hits as
 * a white-out.
 *   0.00  HARD CUT on the drop: white flash (2 frames) over the shelf seen from straight above (the base, three
 *         ringed sites, the black sea in the corner); a shock ring rolls out from the base across the ice; the
 *         camera CRANES DOWN fast (expo.out: pitch 90 -> 60, zoom 0.40 -> 0.70, yaw swings) and keeps craning
 *         slowly through the scene (to pitch 38); driving snow bursts.
 *   0.00-0.30  'Coordinate.' slams in, huge (charcoal, amber full stop), letters punching down from 1.3x;
 *         readable when the VO says it (40.3).
 *   0.45  the three players (amber markers JK / NC / EK) leave the base hub AT ONCE for three sites (relay,
 *         drill, cache); each carries a timer chip counting the same seconds down (00:01.55 -> 00:00.00);
 *         a thin dashed link holds the three together while they run; amber trails draw behind them.
 *   1.25  the word docks bottom-left (120 px) under the eyebrow MAKE YOUR MOVE · 01 / 03; the camera
 *         re-centres on the whole network.
 *   2.00  (42.0) SYNC: all three markers arrive on the same frame; all three sites light together: amber pads
 *         flood, light columns rise, rings roll out, the three sites lock into one amber triangle, the chips
 *         flip to LIVE, the camera punches (zoom +4%), the masts' beacons flash with it.
 *   2.00-3.45  light packets run the triangle on the beat (2.5, 3.0); the columns breathe.
 *   3.45-3.967  hand-off: the camera WHIPS right (expo.in, roll, push), real motion blur; c07b picks the
 *         movement up in the desert at 44.0.
 */
(function () {
  'use strict';
  const ID = 'c07a-coordinate';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const ease = (n) => gsap.parseEase(n);
  const eo = ease('expo.out'), ei = ease('expo.in'), p1 = ease('power1.inOut'), p2 = ease('power2.inOut'), p3o = ease('power3.out'), p2o = ease('power2.out');
  const T_GO = 0.45, T_SYNC = 2.0, T_DOCK = 1.05, T_WHIP = 3.45;
  const NAMES = ['JK', 'NC', 'EK'];
  const BGc = C.bg;

  Film.scene({
    id: ID,
    duration: 4,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`[data-scene="${ID}"] { background: ${C.ink}; }
        [data-scene="${ID}"] .c7a-word { position:absolute; left:104px; top:0; font: 620 292px/1 var(--display); letter-spacing:-0.055em; color:${BGc}; white-space:nowrap; transform-origin: 0 0; }
        [data-scene="${ID}"] .c7a-word .ch { display:inline-block; transform-origin: 50% 80%; }
        [data-scene="${ID}"] .c7a-word .dot { color:${C.amber}; }
        [data-scene="${ID}"] .c7a-chip { position:absolute; left:0; top:0; font: 600 20px/1 var(--mono); letter-spacing:.08em; white-space:pre; padding: 7px 10px 6px; border-radius: 3px; background:${BGc}; color:${C.ink}; }
        [data-scene="${ID}"] .c7a-chip b { color:${C.amber}; font-weight:700; }
        [data-scene="${ID}"] .c7a-chip.live { background:${C.amber}; color:${BGc}; }
        [data-scene="${ID}"] .c7a-chip.live b { color:${BGc}; }
        [data-scene="${ID}"] .c7a-site { position:absolute; left:0; top:0; font: 600 20px/1 var(--mono); letter-spacing:.16em; color:${BGc}; white-space:pre; text-shadow: 0 0 6px rgba(242,238,231,.95), 0 0 14px rgba(242,238,231,.9); }
        [data-scene="${ID}"] .c7a-eb { position:absolute; left:120px; top:836px; display:flex; align-items:center; gap:14px; font: 600 22px/1 var(--mono); letter-spacing:.14em; color:${BGc}; white-space:pre; }
        [data-scene="${ID}"] .c7a-eb i { width:12px; height:12px; background:${C.amber}; transform: rotate(45deg); display:block; }`);

      // ---- camera: a pure function of time ------------------------------------------------------------------
      const camAt = (t) => {
        const a = eo(seg(t, 0, 0.66)), b = p1(seg(t, 0.5, T_WHIP));
        let pitch = 90 - 32 * a - 20 * b;
        let zoom = 0.5 + 0.42 * a + 0.2 * b;
        let yaw = 12 - 28 * a - 12 * b;
        let tx = -10 + 10 * b, tz = 70 - 40 * a - 10 * b;
        // the big word sits in the lower third: hold the base high in the frame, then re-centre
        let sy = lerp(-200, 10, p2(seg(t, T_DOCK - 0.05, T_DOCK + 0.8)));
        let sx = lerp(0, 70, p2(seg(t, T_DOCK - 0.05, T_DOCK + 0.8)));
        // drop shake + sync punch
        sx += 16 * Math.exp(-t * 10) * Math.sin(t * 74);
        sy += 10 * Math.exp(-t * 10) * Math.sin(t * 61 + 1);
        if (t >= T_SYNC) { const u = t - T_SYNC; zoom *= 1 + 0.045 * Math.exp(-u * 7); sy += 6 * Math.exp(-u * 12) * Math.sin(u * 70); }
        // hand-off whip: the target races to screen-right, roll and push
        let roll = 0;
        if (t > T_WHIP) {
          const w = ei(seg(t, T_WHIP, 4.0));
          const D = 2100 * w, yr = yaw * Math.PI / 180;
          tx += Math.cos(yr) * D; tz -= Math.sin(yr) * D;
          roll = -7 * w; zoom *= 1 + 0.32 * w; pitch -= 6 * w;
        }
        return { tx, tz, yaw, pitch, zoom, sx, sy, roll };
      };

      const I = WorldWild.ice(ctx, { camAt });
      const S = I.SITES, PATHS = I.PATHS, HUB = I.HUB;
      I.look.snow = 1;

      // drop: flash, snow burst
      tl.fromTo(I.look, { flash: 1 }, { flash: 0, duration: 0.2, ease: 'power2.out' }, 0);
      tl.fromTo(I.look, { snowBoost: 1.2 }, { snowBoost: 0, duration: 0.9, ease: 'power2.out' }, 0);
      tl.to(I.look, { snowBoost: 0.9, duration: 0.05, ease: 'none' }, T_SYNC);
      tl.to(I.look, { snowBoost: 0, duration: 0.7, ease: 'power2.out' }, T_SYNC + 0.05);
      tl.to(I.look, { snowBoost: 1.6, duration: 0.5, ease: 'power2.in' }, T_WHIP);

      // ---- motion helpers ---------------------------------------------------------------------------------
      const runU = (t) => p2(seg(t, T_GO, T_SYNC));                    // shared progress: in sync by construction
      const posOf = (i, t) => { const P = PATHS[i]; return I.at(P, runU(t) * P.len); };
      const litOf = (t) => (t < T_SYNC ? 0 : 1);

      // ---- ground layer: shock ring, trails, planned routes, lit pads, the triangle ---------------------
      I.ground((g, lt, W2) => {
        const P = W2.P;
        // drop shock ring from the base
        const u0 = seg(lt, 0, 1.0);
        if (u0 > 0 && u0 < 1) {
          const e = eo(u0);
          W2.groundCircle(g, HUB[0], HUB[1], 70 + 1700 * e, 96);
          g.strokeStyle = `rgba(11,12,14,${(0.85 * (1 - u0)).toFixed(3)})`; g.lineWidth = 1.5 + 4 * (1 - u0); g.stroke();
          W2.groundCircle(g, HUB[0], HUB[1], 70 + 1150 * e, 96);
          g.strokeStyle = `rgba(239,189,112,${(0.9 * (1 - u0)).toFixed(3)})`; g.lineWidth = 2 + 3 * (1 - u0); g.stroke();
        }
        // planned routes (dashed charcoal) appear just before the run
        const ap = seg(lt, 0.25, 0.55);
        if (ap > 0) {
          g.setLineDash([7, 7]); g.lineDashOffset = -lt * 40;
          for (let i = 0; i < 3; i++) {
            const Pp = PATHS[i];
            const s0 = runU(lt) * Pp.len;
            W2.groundLine(g, I.slice(Pp, s0, Pp.len * p3o(ap)));
            g.strokeStyle = `rgba(11,12,14,${(0.75 * (1 - litOf(lt))).toFixed(3)})`; g.lineWidth = 2; g.stroke();
          }
          g.setLineDash([]);
        }
        // trails: charcoal edge + amber core
        for (let i = 0; i < 3; i++) {
          const Pp = PATHS[i], s1 = runU(lt) * Pp.len;
          if (s1 < 2) continue;
          W2.groundLine(g, I.slice(Pp, 0, s1));
          g.lineJoin = 'round'; g.lineCap = 'round';
          g.strokeStyle = C.bg; g.lineWidth = 7.5; g.stroke();
          g.strokeStyle = C.amber; g.lineWidth = 4.2; g.stroke();
        }
        // lit pads: amber floods the ringed pad at the sync
        const lu = lt >= T_SYNC ? Math.max(0.3, seg(lt, T_SYNC, T_SYNC + 0.35)) : 0;
        if (lu > 0) {
          for (const s of S) {
            W2.groundCircle(g, s.x, s.z, 56 * eo(lu), 40);
            g.fillStyle = `rgba(239,189,112,${(0.92).toFixed(3)})`; g.fill();
            g.strokeStyle = C.bg; g.lineWidth = 2.5; g.stroke();
            // rolling rings
            for (const [k, d] of [[0, 0], [1, 0.5], [2, 1.0]]) {
              const ru = seg(lt, T_SYNC + d, T_SYNC + d + 0.9);
              if (ru <= 0 || ru >= 1) continue;
              W2.groundCircle(g, s.x, s.z, 56 + 260 * p2o(ru) * (k ? 0.7 : 1), 48);
              g.strokeStyle = `rgba(239,189,112,${(0.95 * (1 - ru)).toFixed(3)})`; g.lineWidth = 3.5 * (1 - ru) + 1; g.stroke();
            }
          }
          // the triangle: each edge draws out of both of its sites at once
          const tu = eo(Math.max(0.2, seg(lt, T_SYNC, T_SYNC + 0.32)));
          g.lineCap = 'round';
          for (let i = 0; i < 3; i++) {
            const a = S[i], b = S[(i + 1) % 3];
            const ax = a.x, az = a.z, bx = b.x, bz = b.z;
            const mx = (ax + bx) / 2, mz = (az + bz) / 2;
            for (const [px, pz] of [[ax, az], [bx, bz]]) {
              const ex = lerp(px, mx, tu), ez = lerp(pz, mz, tu);
              const q0 = P.pt(px, 0, pz); const x0 = q0[0], y0 = q0[1];
              const q1 = P.pt(ex, 0, ez);
              g.beginPath(); g.moveTo(x0, y0); g.lineTo(q1[0], q1[1]);
              g.strokeStyle = C.bg; g.lineWidth = 8; g.stroke();
              g.strokeStyle = C.amber; g.lineWidth = 4.5; g.stroke();
            }
            // packets on the beat
            for (const tb of [2.5, 3.0]) {
              const pu = seg(lt, tb, tb + 0.45);
              if (pu <= 0 || pu >= 1) continue;
              const e = p2(pu);
              const q = P.pt(lerp(ax, bx, e), 0, lerp(az, bz, e));
              g.fillStyle = C.amberLight; g.strokeStyle = C.bg; g.lineWidth = 2;
              g.beginPath(); g.arc(q[0], q[1], 6, 0, Math.PI * 2); g.fill(); g.stroke();
            }
          }
        }
      });

      // ---- top layer: light columns, the coordination link, markers ---------------------------------------
      I.top((g, lt, W2) => {
        const P = W2.P;
        const lu = lt >= T_SYNC ? Math.max(0.35, seg(lt, T_SYNC, T_SYNC + 0.14)) : 0;
        if (lu > 0) {
          const u = lt - T_SYNC;
          // the beat: a warm wash over the whole world for a few frames (the columns stay on top of it)
          const wash = 0.42 * Math.exp(-u * 16);
          if (wash > 0.01) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(239,189,112,${wash.toFixed(3)})`; g.fillRect(0, 0, W, H); }
          // columns shoot up wide and hot on the beat, then settle into steady beams that breathe on the beat
          const burst = Math.exp(-u * 5.5);
          const breathe = 0.82 + 0.18 * Math.cos(u * Math.PI * 4);
          for (const s of S) {
            const hgt = 900 * eo(lu);
            const q0 = P.pt(s.x, 0, s.z); const x0 = q0[0], y0 = q0[1];
            const q1 = P.pt(s.x, hgt, s.z); const x1 = q1[0], y1 = q1[1];
            const wdt = Math.max(14, (34 + 70 * burst) * P.zoom);
            const a0 = Math.min(1, (0.75 + 0.25 * burst) * breathe);
            const gr = g.createLinearGradient(x0, y0, x1, y1);
            gr.addColorStop(0, `rgba(239,189,112,${a0.toFixed(3)})`); gr.addColorStop(0.35, `rgba(239,189,112,${(0.45 * a0).toFixed(3)})`); gr.addColorStop(1, 'rgba(239,189,112,0)');
            g.fillStyle = gr;
            g.beginPath(); g.moveTo(x0 - wdt / 2, y0); g.lineTo(x1 - wdt * 0.12, y1); g.lineTo(x1 + wdt * 0.12, y1); g.lineTo(x0 + wdt / 2, y0); g.closePath(); g.fill();
            const gc = g.createLinearGradient(x0, y0, x1, y1);
            gc.addColorStop(0, 'rgba(255,250,240,1)'); gc.addColorStop(0.5, 'rgba(246,211,159,0.8)'); gc.addColorStop(1, 'rgba(246,211,159,0)');
            g.strokeStyle = gc; g.lineWidth = 3 + 5 * burst; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
          }
        }
        // the link: three markers held together by a thin dashed triangle while they run
        const run = seg(lt, T_GO + 0.1, T_GO + 0.3) * (1 - seg(lt, T_SYNC - 0.04, T_SYNC));
        const pos = [0, 1, 2].map((i) => posOf(i, lt));
        const lift = 30 * P.cosP + 8;
        if (run > 0.01) {
          g.setLineDash([3, 6]); g.strokeStyle = `rgba(11,12,14,${(0.6 * run).toFixed(3)})`; g.lineWidth = 1.6;
          g.beginPath();
          pos.forEach((p, i) => { const q = P.pt(p[0], 0, p[1]); if (i) g.lineTo(q[0], q[1] - lift); else g.moveTo(q[0], q[1] - lift); });
          g.closePath(); g.stroke(); g.setLineDash([]);
        }
        // markers (billboards: stem, disc, initials)
        const show = seg(lt, T_GO - 0.02, T_GO + 0.12);
        if (show <= 0) return;
        for (let i = 0; i < 3; i++) {
          const p = pos[i];
          const q = P.pt(p[0], 0, p[1]); const gx = q[0], gy = q[1];
          const sc = (0.6 + 0.4 * eo(show)) * (lt >= T_SYNC ? 1 + 0.25 * Math.exp(-(lt - T_SYNC) * 8) : 1);
          const r = 16 * sc, top = gy - lift * eo(show);
          g.fillStyle = 'rgba(11,12,14,0.28)'; g.beginPath(); g.ellipse(gx + 4, gy + 2, 9 * sc, 9 * sc * Math.max(0.3, P.sinP), 0, 0, Math.PI * 2); g.fill();
          g.strokeStyle = C.bg; g.lineWidth = 2.4; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, top); g.stroke();
          g.fillStyle = C.amber; g.strokeStyle = C.bg; g.lineWidth = 3;
          g.beginPath(); g.arc(gx, top - r, r, 0, Math.PI * 2); g.fill(); g.stroke();
          g.fillStyle = C.bg; g.font = `700 ${Math.round(13 * sc)}px "JetBrains Mono Variable"`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(NAMES[i], gx, top - r + 0.5);
        }
      });

      // ---- DOM: chips (timers), site tags ----------------------------------------------------------------
      const chips = NAMES.map(() => ctx.el('div', 'c7a-chip', root, ''));
      const tags = S.map((s) => { const e = ctx.el('div', 'c7a-site', root, s.name); return e; });
      const fmt = (sec) => { const cs = Math.max(0, Math.round(sec * 100)); return `00:0${Math.floor(cs / 100)}.${String(cs % 100).padStart(2, '0')}`; };
      ctx.onFrame((lt) => {
        const P = I.P; if (!P) return;
        const show = seg(lt, T_GO + 0.05, T_GO + 0.2) * (1 - seg(lt, T_WHIP, T_WHIP + 0.12));
        for (let i = 0; i < 3; i++) {
          const el = chips[i];
          if (show <= 0) { el.style.opacity = '0'; continue; }
          const p = posOf(i, lt);
          const q = P.pt(p[0], 0, p[1]);
          const lift = 30 * P.cosP + 8;
          const live = lt >= T_SYNC;
          const txt = live ? `${NAMES[i]}  <b>LIVE</b>` : `${NAMES[i]}  <b>${fmt(T_SYNC - lt)}</b>`;
          if (el._t !== txt) { el.innerHTML = txt; el._t = txt; }
          el.classList.toggle('live', live);
          el.style.opacity = String(show);
          el.style.transform = `translate(${(q[0] + 24).toFixed(1)}px, ${(q[1] - lift - 44).toFixed(1)}px)`;
        }
        const tshow = seg(lt, 0.7, 0.9) * (1 - seg(lt, T_WHIP, T_WHIP + 0.12));
        S.forEach((s, i) => {
          const el = tags[i];
          const q = P.pt(s.x, 0, s.z);
          el.style.opacity = String(tshow);
          el.style.transform = `translate(${(q[0] - 30).toFixed(1)}px, ${(q[1] + 40).toFixed(1)}px)`;
        });
      });

      // ---- type: the slam, the dock -----------------------------------------------------------------------
      const word = ctx.el('div', 'c7a-word', root, '');
      const chars = 'Coordinate'.split('').map((ch) => ctx.el('span', 'ch', word, ch));
      const dot = ctx.el('span', 'ch dot', word, '.');
      const all = chars.concat([dot]);
      // big state: baseline ~ y 930 (top of the 292 px box at 690)
      gsap.set(word, { x: 0, y: 676, scale: 1 });
      tl.fromTo(all, { yPercent: -18, scale: 1.32, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, duration: 0.42, ease: 'expo.out', stagger: 0.017 }, 0.0);
      // dock: 292 px -> 120 px, bottom-left, under the eyebrow
      tl.to(word, { scale: 120 / 292, x: 16, y: 884, duration: 0.6, ease: 'expo.inOut' }, T_DOCK);
      const eb = ctx.el('div', 'c7a-eb', root, '<i></i><span></span>');
      const ebT = eb.querySelector('span');
      tl.fromTo(eb, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, T_DOCK + 0.4);
      B.scrambleTo(tl, ebT, 'MAKE YOUR MOVE · 01 / 03', T_DOCK + 0.4, 0.5);
      // exit with the whip: slides off to the left, fast
      tl.to([word, eb], { x: '-=700', opacity: 0, duration: 0.42, ease: 'expo.in' }, T_WHIP + 0.05);
      tl.to(chips.concat(tags), { opacity: 0, duration: 0.01, ease: 'none' }, T_WHIP + 0.12);

      // ---- beacons flare with the sync; site lamps ------------------------------------------------------
      tl.fromTo(I.look, { lit: 0 }, { lit: 1, duration: 0.12, ease: 'none' }, T_SYNC);

      // HUD: charcoal register corners on the light world
      B.hud(ctx, { inset: 64, color: C.bg, tc: false, slug: '', drawIn: true, at: 0.05, ticks: true, alpha: 0.75, out: T_WHIP + 0.1 });
    },
  });
})();
