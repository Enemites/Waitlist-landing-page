/* c09-record (film 56.0-60.0, 4.0 s; local 0 = film 56.0). "Every move, on the record." (w14 at 56.3:
 * every 56.30, move 56.64, on 56.96, the 57.24, record 57.34).
 *
 * INK (paper) ground: a match replay, like a printed record. A film strip of match moments (dark graphic
 * thumbnails echoing the film's worlds: lobby, plan, ice station, canyon, storm city, crossing, objective)
 * runs over a timeline with amber (Atlas, diamond) and red-orange (Vega, ring) event markers, under a
 * fixed playhead. Lower band: a giant timecode (left) and the event log (right).
 *   0.00-1.00  REWIND scrub 12:30 -> 08:31 (back.out: enters at full speed, overshoots, settles), real
 *              motion blur (8 shutter samples), markers pop as they pass the playhead, timecode spins
 *   1.00       stop on 08:31 (Vega blacks out the district): corner brackets snap round the frame
 *   1.00-2.10  the event log types on (07:15 ... 11:52), the 08:31 line highlighted at 1.30
 *   1.30       'ON THE RECORD' stamp lands (57.30, 'record' 57.34), paper shake
 *   3.35-4.00  fast-forward toward the end of the match (accelerating into the 60.0 payoff cut)
 */
(function () {
  'use strict';
  const ID = 'c09-record';
  const C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const EZ = {};
  const ez = (n) => EZ[n] || (EZ[n] = gsap.parseEase(n));
  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const rgba = (c, a) => { const [r, g, b] = hexRgb(c); return `rgba(${r},${g},${b},${a})`; };
  const INK = C.bg;                       // dark type on paper
  const PAPER = C.ink;

  // ---- layout ----
  const TW = 448, TH = 252, GAP = 12, SPAN = 70;          // thumbnails every 70 s of match time
  const PPS = (TW + GAP) / SPAN;                          // px per match second
  const PH_X = 960;                                       // the playhead
  const STRIP_Y = 126, TRACK_Y = STRIP_Y + TH + 74;
  const BAND = { y0: STRIP_Y - 30, y1: TRACK_Y + 52 };    // the canvas band (strip + track)
  const MATCH_END = 900;

  // ---- times (local s) ----
  const T_STOP = 1.0, T_STAMP = 1.3, T_FF = 3.35;
  const PH_A = 750, PH_B = 511;                           // 12:30 -> 08:31
  const phAt = (t) => {
    if (t < 0) return PH_A + t * (PH_B - PH_A) * 4.25 / T_STOP; // back.out(1.25) slope at 0: the scrub is at full speed on the cut
    if (t < T_FF) return lerp(PH_A, PH_B, ez('back.out(1.25)')(seg(t, 0, T_STOP)));
    const u = (t - T_FF) / (4.0 - T_FF);
    return PH_B + 330 * Math.pow(u, 2.6);
  };
  const mmss = (s) => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

  // ---- the match record ----
  const THUMBS = ['lobby', 'plan', 'ice', 'iceLit', 'bridges', 'canyon', 'canyonCommit', 'cityDark', 'cityRedraw', 'crossing', 'power', 'cityLit', 'objective'];
  const THUMB_NAMES = { lobby: 'LOBBY', plan: 'SHARED PLAN', ice: 'ICE STATION', iceLit: 'ICE STATION', bridges: 'THE BRIDGES', canyon: 'CANYON', canyonCommit: 'CANYON', cityDark: 'STORM CITY', cityRedraw: 'STORM CITY', crossing: 'THE CROSSING', power: 'POWER PLANT', cityLit: 'STORM CITY', objective: 'OBJECTIVE' };
  const EVENTS = [
    { t: 100, team: 'A', text: 'PLAN LOCKED' },
    { t: 252, team: 'A', text: 'THREE SITES LIT' },
    { t: 302, team: 'V', text: 'BRIDGES RUSHED' },
    { t: 435, team: 'A', text: 'ROUTE COMMITTED' },
    { t: 511, team: 'V', text: 'DISTRICT BLACKED OUT', key: true },
    { t: 524, team: 'A', text: 'ROUTE REDRAWN' },
    { t: 620, team: 'V', text: 'CROSSING CONTESTED' },
    { t: 712, team: 'A', text: 'POWER RESTORED' },
    { t: 790, team: 'V', text: 'GRID CONTESTED' },
    { t: 872, team: 'O', text: 'OBJECTIVE' },
  ];
  const LOG = [3, 4, 5, 6, 7].map((i) => EVENTS[i]);

  Film.scene({
    id: ID,
    duration: 4,
    build(ctx) {
      const { root, tl } = ctx;
      root.style.background = PAPER;
      ctx.css(`
        [data-scene="${ID}"] .c09-wrap { position:absolute; left:0; top:0; width:${W}px; height:${H}px; transform-origin: 960px 540px; }
        [data-scene="${ID}"] .c09-mono { position:absolute; font: 500 20px/1 var(--mono); letter-spacing:.12em; text-transform:uppercase; white-space:pre; color:${INK}; }
        [data-scene="${ID}"] .c09-tc { position:absolute; left:110px; top:0; font: 640 212px/1 var(--display); letter-spacing:-0.045em; color:${INK}; font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; white-space:pre; }
        [data-scene="${ID}"] .c09-row { position:absolute; left:0; height:52px; width:780px; font: 500 25px/52px var(--mono); letter-spacing:.06em; color:${INK}; white-space:pre; }
        [data-scene="${ID}"] .c09-row .hl { position:absolute; left:-18px; top:0; height:52px; width:800px; background:${rgba(C.rival, 0.13)}; transform-origin: 0 50%; }
        [data-scene="${ID}"] .c09-row .hl i { position:absolute; left:0; top:0; bottom:0; width:5px; background:${C.rival}; }
        [data-scene="${ID}"] .c09-row .tx { position:relative; }
        [data-scene="${ID}"] .c09-row .cur { position:absolute; top:12px; width:13px; height:28px; background:${INK}; }
      `);
      const wrap = ctx.el('div', 'c09-wrap', root);

      // ================= thumbnails (dark graphic mini-frames, drawn once) =================
      function thumb(kind, k) {
        const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
        const g = cv.getContext('2d');
        const r = ctx.rng(ID + ':' + kind + ':' + k);
        g.fillStyle = '#0d0c0b'; g.fillRect(0, 0, TW, TH);
        g.lineCap = 'round'; g.lineJoin = 'round';
        const dia = (x, y, s, fill) => { g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = fill; g.fillRect(-s / 2, -s / 2, s, s); g.restore(); };
        const ring = (x, y, rr, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.stroke(); };
        const glow = (x, y, rr, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); };
        const dashed = (pts, col, w, dash) => { g.setLineDash(dash || []); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); g.setLineDash([]); };
        if (kind === 'lobby') {
          g.fillStyle = '#121110'; g.fillRect(0, 0, TW, TH);
          g.strokeStyle = rgba(C.bone, 0.22); g.lineWidth = 1.5; g.beginPath(); g.moveTo(TW / 2 + 40, 0); g.lineTo(TW / 2 - 40, TH); g.stroke();
          ['JK', 'NC', 'EK'].forEach((s, i) => {
            const y = 66 + i * 62;
            g.fillStyle = C.amber; g.beginPath(); g.arc(78, y, 22, 0, Math.PI * 2); g.fill();
            g.fillStyle = INK; g.font = '700 15px "JetBrains Mono Variable"'; g.textAlign = 'center'; g.fillText(s, 78, y + 5);
            g.fillStyle = rgba(C.bone, 0.5); g.fillRect(112, y - 4, 70 - i * 8, 7);
            g.fillStyle = '#1a1512'; g.beginPath(); g.arc(TW - 78, y, 22, 0, Math.PI * 2); g.fill();
            ring(TW - 78, y, 22, C.rival, 3);
            g.fillStyle = rgba(C.rival, 0.45); g.fillRect(TW - 182 + i * 8, y - 4, 70 - i * 8, 7);
          });
          g.fillStyle = C.ink; g.font = '700 38px "Manrope Variable"'; g.textAlign = 'center'; g.fillText('VS', TW / 2, TH / 2 + 13);
        } else if (kind === 'plan' || kind === 'crossing') {
          g.fillStyle = '#15120e'; g.fillRect(0, 0, TW, TH);
          g.strokeStyle = rgba(C.bone, 0.08); g.lineWidth = 1;
          for (let x = 0; x < TW; x += 32) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, TH); g.stroke(); }
          for (let y = 0; y < TH; y += 32) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(TW, y + 0.5); g.stroke(); }
          const riv = (o) => { g.beginPath(); for (let x = -10; x <= TW + 10; x += 8) { const y = (kind === 'plan' ? 150 - x * 0.18 : 128) + 16 * Math.sin(x * 0.025) + o; x < 0 ? g.moveTo(x, y) : g.lineTo(x, y); } };
          riv(0); g.strokeStyle = '#090909'; g.lineWidth = 26; g.stroke();
          riv(-13); g.strokeStyle = rgba(C.bone, 0.3); g.lineWidth = 1.2; g.stroke();
          riv(13); g.stroke();
          if (kind === 'plan') {
            dashed([[30, 222], [90, 196], [150, 180], [214, 122]], C.amber, 3.5, [10, 7]);
            dashed([[424, 228], [360, 214], [300, 150], [236, 122]], C.rival, 3.5, [10, 7]);
            ring(226, 120, 15, C.amber, 2.5); g.fillStyle = C.amber; g.beginPath(); g.arc(226, 120, 4, 0, Math.PI * 2); g.fill();
            [[52, 214], [92, 230], [64, 190]].forEach((p, i) => { g.fillStyle = INK; g.beginPath(); g.arc(p[0], p[1], 10, 0, Math.PI * 2); g.fill(); ring(p[0], p[1], 10, C.amber, 2); });
          } else {
            dashed([[200, 70], [214, 190]], rgba(C.bone, 0.6), 2, [5, 5]);
            [[176, 108], [236, 150]].forEach((p) => { ring(p[0], p[1], 11, C.rival, 3); glow(p[0], p[1], 40, C.rival, 0.25); });
            [[120, 196], [160, 214]].forEach((p) => dia(p[0], p[1], 15, C.amber));
            [[300, 60], [330, 74]].forEach((p) => { g.fillStyle = C.rival; g.beginPath(); g.moveTo(p[0], p[1] - 9); g.lineTo(p[0] + 8, p[1] + 6); g.lineTo(p[0] - 8, p[1] + 6); g.fill(); });
          }
        } else if (kind === 'ice' || kind === 'iceLit') {
          g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, TW, TH);
          // the shelf: a jagged top edge, low-poly facets in bone / ink
          const edge = []; for (let x = -20; x <= TW + 20; x += 34) edge.push([x, 92 + r.range(-16, 16) + (x > 300 ? 18 : 0)]);
          g.save(); g.beginPath(); g.moveTo(edge[0][0], TH + 5); edge.forEach((p) => g.lineTo(p[0], p[1])); g.lineTo(TW + 20, TH + 5); g.closePath(); g.clip();
          const cols = ['#c9c0b2', '#d8d0c3', '#b7ae9f', '#e4ddd1', '#a79e90'];
          for (let y = 70; y < TH + 40; y += 38) for (let x = -40; x < TW + 40; x += 44) {
            const o = (y / 38) % 2 ? 22 : 0;
            const p = [[x + o, y], [x + o + 44, y], [x + o + 22, y + 38], [x + o - 22, y + 38]].map((q) => [q[0] + r.range(-7, 7), q[1] + r.range(-6, 6)]);
            g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.lineTo(p[1][0], p[1][1]); g.lineTo(p[2][0], p[2][1]); g.closePath(); g.fill();
            g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.lineTo(p[2][0], p[2][1]); g.lineTo(p[3][0], p[3][1]); g.closePath(); g.fill();
          }
          g.strokeStyle = 'rgba(20,20,22,0.55)'; g.lineWidth = 1.4;
          for (let i = 0; i < 4; i++) { let x = r.range(40, TW - 40), y = 110; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += r.range(-22, 22); y += r.range(16, 26); g.lineTo(x, y); } g.stroke(); }
          g.restore();
          // the station
          g.fillStyle = '#26221d'; g.fillRect(196, 132, 54, 22); g.fillRect(256, 140, 26, 14); g.beginPath(); g.arc(214, 132, 13, Math.PI, 0); g.fill();
          const sites = [[92, 186], [348, 170], [236, 222]];
          if (kind === 'iceLit') { g.strokeStyle = rgba(C.amber, 0.85); g.lineWidth = 2; sites.forEach((p) => { g.beginPath(); g.moveTo(222, 150); g.lineTo(p[0], p[1]); g.stroke(); }); }
          sites.forEach((p) => {
            if (kind === 'iceLit') glow(p[0], p[1], 46, C.amber, 0.55);
            g.fillStyle = INK; g.beginPath(); g.arc(p[0], p[1], 9, 0, Math.PI * 2); g.fill();
            ring(p[0], p[1], 9, C.amber, 2.5);
            if (kind === 'iceLit') { g.fillStyle = C.amberLight; g.beginPath(); g.arc(p[0], p[1], 4, 0, Math.PI * 2); g.fill(); }
          });
          // snow
          g.fillStyle = 'rgba(242,238,231,0.6)'; for (let i = 0; i < 70; i++) g.fillRect(r() * TW, r() * 110, 1.6, 1.6);
        } else if (kind === 'bridges') {
          g.fillStyle = '#13110e'; g.fillRect(0, 0, TW, TH);
          g.save(); g.translate(TW / 2, TH / 2); g.rotate(-0.42);
          g.fillStyle = '#080809'; g.fillRect(-400, -34, 800, 68);
          g.fillStyle = rgba(C.bone, 0.4); g.fillRect(-400, -35, 800, 1.5); g.fillRect(-400, 34, 800, 1.5);
          [-130, 0, 130].forEach((x) => { g.fillStyle = '#5b554c'; g.fillRect(x - 9, -46, 18, 92); });
          [[-130, -10], [0, 18], [130, -20]].forEach((p, i) => { if (i === 1) return; g.save(); g.translate(p[0], p[1]); g.rotate(0.42); g.fillStyle = C.rival; g.beginPath(); g.moveTo(0, -10); g.lineTo(9, 7); g.lineTo(-9, 7); g.fill(); g.restore(); });
          g.restore();
          for (let i = 0; i < 26; i++) { g.fillStyle = rgba(C.bone, 0.16); g.fillRect(r() * TW, r() * TH, r.range(14, 38), r.range(10, 22)); }
          dashed([[60, 40], [150, 96], [176, 112]], C.rival, 3, [8, 6]);
          dashed([[380, 214], [306, 160], [290, 150]], C.rival, 3, [8, 6]);
        } else if (kind === 'canyon' || kind === 'canyonCommit') {
          g.fillStyle = '#1b150e'; g.fillRect(0, 0, TW, TH);
          const wallA = (x) => 74 + 24 * Math.sin(x * 0.02) + 10 * Math.sin(x * 0.051 + 1);
          const wallB = (x) => 172 + 22 * Math.sin(x * 0.018 + 2) + 9 * Math.sin(x * 0.06);
          g.strokeStyle = rgba(C.amberDeep, 0.85); g.lineWidth = 1.6;
          for (let x = -40; x < TW + 40; x += 6.5) for (let y = -10; y < TH + 20; y += 15) {
            const yy = y + (x * 0.37) % 15;
            if (yy > wallA(x) - 3 && yy < wallB(x) + 3) continue;
            g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 6, yy - 8); g.stroke();
          }
          g.strokeStyle = rgba(C.bone, 0.16); g.lineWidth = 1.2;
          for (let k2 = 0; k2 < 7; k2++) { g.beginPath(); for (let x = 0; x <= TW; x += 6) { const a = wallA(x), b = wallB(x); const y = a + (b - a) * (k2 + 0.5) / 7 + 3 * Math.sin(x * 0.09 + k2); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
          g.strokeStyle = rgba(C.amberLight, 0.5); g.lineWidth = 2;
          g.beginPath(); for (let x = 0; x <= TW; x += 6) { const y = wallA(x); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
          g.beginPath(); for (let x = 0; x <= TW; x += 6) { const y = wallB(x); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
          const fork = [214, 124];
          dashed([[-4, 132], [80, 128], [150, 120], fork], C.amber, 3.5, []);
          const br = [[[300, 96], [430, 92]], [[310, 128], [440, 132]], [[296, 160], [430, 172]]];
          br.forEach((b, i) => {
            const lock = kind === 'canyonCommit' && i === 1;
            dashed([fork, ...b], lock ? C.amber : rgba(C.bone, 0.45), lock ? 3.5 : 2, lock ? [] : [7, 6]);
          });
          if (kind === 'canyonCommit') { g.strokeStyle = C.amber; g.lineWidth = 2.5; g.strokeRect(fork[0] - 13, fork[1] - 13, 26, 26); }
          [[70, 129], [104, 126], [136, 122]].forEach((p) => { g.fillStyle = INK; g.beginPath(); g.arc(p[0], p[1], 7, 0, Math.PI * 2); g.fill(); ring(p[0], p[1], 7, C.amber, 2); });
        } else if (kind === 'cityDark' || kind === 'cityRedraw' || kind === 'cityLit') {
          g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, TW, TH);
          const cell = 9;
          const iso = (i, j) => [TW / 2 + (i - j) * cell, -40 + (i + j) * cell * 0.5];
          const inDist = (i, j) => Math.abs(i - 30) + Math.abs(j - 25) < 9;
          for (let i = 0; i < 60; i++) for (let j = 0; j < 60; j++) {
            const [x, y] = iso(i, j);
            if (x < -6 || x > TW + 6 || y < -6 || y > TH + 6) continue;
            const road = i % 5 === 0 || j % 6 === 0;
            if (road) { g.fillStyle = rgba(C.bone, 0.13); g.fillRect(x - 0.8, y - 0.8, 1.6, 1.6); continue; }
            const dark = kind !== 'cityLit' && inDist(i, j);
            const lit = r() < (dark ? 0.05 : 0.62);
            g.fillStyle = dark ? rgba(C.bone, 0.08) : lit ? rgba(C.amber, 0.55 + 0.4 * r()) : rgba(C.amberDeep, 0.35);
            g.fillRect(x - 1.3, y - 1.3, 2.6, 2.6);
          }
          if (kind !== 'cityLit') {
            const P = [iso(21, 25), iso(30, 16), iso(39, 25), iso(30, 34)];
            g.strokeStyle = C.rival; g.lineWidth = 2.5; g.setLineDash([7, 5]);
            g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.stroke(); g.setLineDash([]);
            glow(P[0][0], P[0][1], 60, C.rival, 0.18);
          }
          if (kind === 'cityRedraw') {
            const R = [iso(10, 25), iso(18, 22), iso(25, 13), iso(33, 11), iso(42, 18), iso(47, 25)];
            g.strokeStyle = rgba(C.amber, 0.25); g.lineWidth = 10; g.beginPath(); R.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
            g.strokeStyle = C.amber; g.lineWidth = 3.5; g.stroke();
            dashed([iso(18, 22), iso(28, 26), iso(42, 18)], rgba(C.bone, 0.35), 2, [5, 6]);
          }
        } else if (kind === 'power') {
          g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, TW, TH);
          const c0 = [220, 130];
          glow(c0[0], c0[1], 150, C.amber, 0.32);
          for (let i = 0; i < 9; i++) {
            const a = i / 9 * Math.PI * 2 + 0.2, L = r.range(140, 230);
            const pts = [c0]; let x = c0[0], y = c0[1];
            for (let s = 1; s <= 3; s++) { x = c0[0] + Math.cos(a + r.range(-0.15, 0.15)) * L * s / 3; y = c0[1] + Math.sin(a + r.range(-0.15, 0.15)) * L * s / 3 * 0.7; pts.push([x, y]); }
            dashed(pts, rgba(C.amber, 0.85), 2, []);
            pts.slice(1).forEach((p) => { g.fillStyle = C.amberLight; g.beginPath(); g.arc(p[0], p[1], 2.6, 0, Math.PI * 2); g.fill(); });
          }
          g.fillStyle = '#2a241c'; g.fillRect(186, 108, 70, 44); g.fillRect(200, 86, 16, 22); g.fillRect(226, 92, 14, 16);
          g.strokeStyle = C.amber; g.lineWidth = 2; g.strokeRect(186, 108, 70, 44);
        } else if (kind === 'objective') {
          g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, TW, TH);
          const o = [252, 126];
          glow(o[0], o[1], 120, C.amber, 0.3);
          dashed([[-10, 200], [80, 180], [160, 150], [o[0] - 20, o[1] + 6]], C.amber, 3.5, []);
          dashed([[TW + 10, 40], [380, 70], [320, 104], [o[0] + 20, o[1] - 4]], C.rival, 3.5, []);
          [44, 30].forEach((rr, i) => { g.setLineDash(i ? [] : [5, 6]); ring(o[0], o[1], rr, C.amber, 2); }); g.setLineDash([]);
          g.fillStyle = C.amberLight; g.beginPath(); g.arc(o[0], o[1], 7, 0, Math.PI * 2); g.fill();
          for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.strokeStyle = rgba(C.amberLight, 0.6); g.lineWidth = 1.6; g.beginPath(); g.moveTo(o[0] + Math.cos(a) * 54, o[1] + Math.sin(a) * 54); g.lineTo(o[0] + Math.cos(a) * 70, o[1] + Math.sin(a) * 70); g.stroke(); }
        }
        // grade: a soft vignette, a fine scanline, rounded corners
        const vg = g.createRadialGradient(TW / 2, TH / 2, TH * 0.35, TW / 2, TH / 2, TW * 0.68);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)');
        g.fillStyle = vg; g.fillRect(0, 0, TW, TH);
        g.globalCompositeOperation = 'destination-in';
        g.fillStyle = '#000'; g.beginPath(); g.roundRect(0, 0, TW, TH, 6); g.fill();
        g.globalCompositeOperation = 'source-over';
        return cv;
      }
      const TH_CV = THUMBS.map((k, i) => thumb(k, i));
      const thumbT = (i) => 35 + i * SPAN;                // centre time of thumbnail i

      // ================= the strip + track band (canvas, motion-blurred) =================
      const band = ctx.canvas({ parent: wrap, width: W, height: BAND.y1 - BAND.y0 });
      Object.assign(band.canvas.style, { position: 'absolute', left: '0px', top: BAND.y0 + 'px', width: W + 'px', height: (BAND.y1 - BAND.y0) + 'px' });
      const bg = band.g;
      const scratch = document.createElement('canvas'); scratch.width = W; scratch.height = BAND.y1 - BAND.y0;
      const sg = scratch.getContext('2d');
      const OY = BAND.y0;
      function drawBand(g, ph, t) {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        g.fillStyle = PAPER; g.fillRect(0, 0, W, BAND.y1 - BAND.y0);
        const X = (s) => PH_X + (s - ph) * PPS;
        // thumbnails + captions
        g.font = '600 17px "JetBrains Mono Variable"'; g.letterSpacing = '1.6px'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
        THUMBS.forEach((k, i) => {
          const cx = X(thumbT(i)), x = cx - TW / 2;
          if (x > W || x + TW < 0) return;
          g.drawImage(TH_CV[i], x, STRIP_Y - OY);
          g.fillStyle = INK; g.fillText(mmss(thumbT(i)), x + 2, STRIP_Y - OY + TH + 27);
          g.fillStyle = rgba(INK, 0.5); g.fillText(THUMB_NAMES[k], x + 78, STRIP_Y - OY + TH + 27);
        });
        // track
        const ty = TRACK_Y - OY;
        const x0 = Math.max(-10, X(0)), x1 = Math.min(W + 10, X(MATCH_END));
        g.fillStyle = INK; g.fillRect(x0, ty - 1, x1 - x0, 2);
        const s0 = Math.max(0, Math.floor((ph - 170) / 10) * 10), s1 = Math.min(MATCH_END, ph + 170);
        g.font = '500 15px "JetBrains Mono Variable"'; g.letterSpacing = '1.2px';
        for (let s = s0; s <= s1; s += 10) {
          const x = X(s), major = s % 60 === 0;
          g.fillStyle = rgba(INK, major ? 0.7 : 0.3);
          g.fillRect(x - 0.75, ty + 4, 1.5, major ? 14 : 7);
          if (major) { g.fillStyle = rgba(INK, 0.55); g.fillText(mmss(s), x + 5, ty + 36); }
        }
        if (X(MATCH_END) < W) { g.fillStyle = INK; g.fillRect(X(MATCH_END) - 2, ty - 12, 4, 24); }
        // event markers (pop as they pass the playhead)
        EVENTS.forEach((e) => {
          const x = X(e.t);
          if (x < -30 || x > W + 30) return;
          const near = Math.exp(-Math.pow((x - PH_X) / 46, 2));
          const pop = t < T_STOP + 0.05 || t > T_FF ? 1 + 0.75 * near : 1;
          const key = e.key && t >= T_STOP ? 1 + 0.35 * ez('back.out(3)')(seg(t, T_STOP, T_STOP + 0.3)) : 1;
          const s = pop * key;
          const y = ty - 22;
          g.fillStyle = rgba(INK, 0.35); g.fillRect(x - 0.75, y + 10, 1.5, 12);
          if (e.team === 'A') {
            g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = C.amber; g.strokeStyle = INK; g.lineWidth = 2;
            const q = 12 * s; g.fillRect(-q / 2, -q / 2, q, q); g.strokeRect(-q / 2, -q / 2, q, q); g.restore();
          } else if (e.team === 'V') {
            g.fillStyle = PAPER; g.strokeStyle = C.rival; g.lineWidth = 3.2;
            g.beginPath(); g.arc(x, y, 7.5 * s, 0, Math.PI * 2); g.fill(); g.stroke();
          } else {
            g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 9 * s, 0, Math.PI * 2); g.stroke();
            g.fillStyle = INK; g.beginPath(); g.arc(x, y, 3.5 * s, 0, Math.PI * 2); g.fill();
          }
        });
        g.letterSpacing = '0px';
      }
      const SHUTTER = 0.5 / FPS;
      ctx.onFrame((t) => {
        const ph = phAt(t), php = phAt(t - SHUTTER);
        const px = Math.abs(ph - php) * PPS;
        if (px < 0.6) { drawBand(bg, ph, t); return; }
        // exact average of NSMP shutter samples (running mean); samples <= ~7 px apart
        const NSMP = clamp(Math.ceil(px / 7) + 1, 4, 26);
        bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalCompositeOperation = 'source-over';
        for (let i = 0; i < NSMP; i++) {
          const ts = t - SHUTTER * (i / (NSMP - 1));
          drawBand(sg, phAt(ts), ts);
          bg.globalAlpha = 1 / (i + 1);
          bg.drawImage(scratch, 0, 0);
        }
        bg.globalAlpha = 1;
      });

      // ================= playhead (fixed) =================
      const sv = ctx.svg('svg', { class: 'brand-svg' }, wrap);
      const phTop = STRIP_Y - 26, phBot = TRACK_Y + 10;
      ctx.svg('line', { x1: PH_X, y1: phTop, x2: PH_X, y2: phBot, stroke: INK, 'stroke-width': 2.5 }, sv);
      ctx.svg('path', { d: `M${PH_X - 11} ${phTop - 14} L${PH_X + 11} ${phTop - 14} L${PH_X} ${phTop + 2}Z`, fill: INK }, sv);
      // the stopped frame: register brackets snap round the thumbnail under the playhead
      const fx = PH_X + (thumbT(7) - PH_B) * PPS - TW / 2, fy = STRIP_Y;
      const BR = 26, P = 12;
      const brackets = [[fx - P, fy - P, 1, 1], [fx + TW + P, fy - P, -1, 1], [fx - P, fy + TH + P, 1, -1], [fx + TW + P, fy + TH + P, -1, -1]].map(([x, y, sx, sy]) =>
        ctx.svg('path', { d: `M${x} ${y + BR * sy} L${x} ${y} L${x + BR * sx} ${y}`, stroke: INK, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'square' }, sv));
      brackets.forEach((b, i) => {
        const dx = (i % 2 ? 1 : -1) * 26, dy = (i < 2 ? -1 : 1) * 18;
        tl.fromTo(b, { x: dx, y: dy, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.28, ease: 'expo.out' }, T_STOP);
        tl.to(b, { x: dx * 0.6, y: dy * 0.6, opacity: 0, duration: 0.18, ease: 'power2.in' }, T_FF);
      });

      // ================= header =================
      const eyebrow = ctx.el('div', 'c09-mono', wrap, '');
      Object.assign(eyebrow.style, { left: '152px', top: '58px', fontSize: '22px', letterSpacing: '.14em', fontWeight: 600 });
      Brand.scrambleTo(tl, eyebrow, 'MATCH REPLAY', 0.05, 0.4);
      ctx.svg('rect', { x: 120, y: 61, width: 14, height: 14, fill: INK, transform: 'rotate(45 127 68)' }, sv);
      const teams = ctx.el('div', 'c09-mono', wrap, `<i class="d"></i><span>ATLAS</span><span class="vs">VS</span><span>VEGA</span><i class="r"></i>`);
      Object.assign(teams.style, { right: '120px', top: '58px', fontSize: '22px', fontWeight: 600, letterSpacing: '.14em', display: 'flex', alignItems: 'center', gap: '16px' });
      Object.assign(teams.querySelector('.vs').style, { color: rgba(INK, 0.45), margin: '0 14px' });
      Object.assign(teams.querySelector('.d').style, { width: '13px', height: '13px', background: C.amber, outline: `2px solid ${INK}`, transform: 'rotate(45deg)', marginRight: '4px' });
      Object.assign(teams.querySelector('.r').style, { width: '12px', height: '12px', borderRadius: '50%', border: `3.2px solid ${C.rival}`, marginLeft: '2px' });
      tl.fromTo(teams, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 0.1);

      // ================= lower band: status + giant timecode =================
      const LB = 572;
      ctx.svg('line', { x1: 120, y1: LB - 20, x2: 1800, y2: LB - 20, stroke: rgba(INK, 0.18), 'stroke-width': 1.5 }, sv);
      const status = ctx.el('div', 'c09-mono', wrap, '');
      Object.assign(status.style, { left: '156px', top: (LB + 14) + 'px', fontWeight: 600, letterSpacing: '.16em' });
      Brand.bindText(ctx, status, (t) => (t < T_STOP ? 'REWIND' : t < T_FF ? 'REVIEW' : 'FAST-FORWARD'));
      // icon: rewind / pause / fast-forward
      const icon = ctx.svg('g', { transform: `translate(132 ${LB + 24})` }, sv);
      const icRw = ctx.svg('path', { d: 'M0 0 L9 -7 L9 7Z M-9 0 L0 -7 L0 7Z', fill: INK, transform: 'translate(2 0)' }, icon);
      const icPa = ctx.svg('path', { d: 'M-6 -7 h4 v14 h-4Z M2 -7 h4 v14 h-4Z', fill: INK }, icon);
      const icFf = ctx.svg('path', { d: 'M0 0 L-9 -7 L-9 7Z M9 0 L0 -7 L0 7Z', fill: INK }, icon);
      ctx.onFrame((t) => {
        const blink = t < T_STOP ? (Math.floor(t * 8) % 2 ? 0.35 : 1) : 1;
        icRw.setAttribute('opacity', t < T_STOP ? blink : 0);
        icPa.setAttribute('opacity', t >= T_STOP && t < T_FF ? 1 : 0);
        icFf.setAttribute('opacity', t >= T_FF ? (Math.floor(t * 8) % 2 ? 0.35 : 1) : 0);
      });
      const tc = ctx.el('div', 'c09-tc', wrap, '08:31');
      tc.style.top = (LB + 50) + 'px';
      Brand.bindText(ctx, tc, (t) => mmss(phAt(t)));

      // ================= event log =================
      const LX = 1050;
      const logHd = ctx.el('div', 'c09-mono', wrap, '');
      Object.assign(logHd.style, { left: LX + 'px', top: (LB + 14) + 'px', fontWeight: 600, letterSpacing: '.16em', color: rgba(INK, 0.55) });
      Brand.scrambleTo(tl, logHd, 'EVENT LOG', T_STOP - 0.15, 0.3);
      const rows = LOG.map((e, i) => {
        const row = ctx.el('div', 'c09-row', wrap, '<div class="hl"><i></i></div><span class="tx"></span><span class="cur"></span>');
        row.style.left = LX + 'px'; row.style.top = (LB + 52 + i * 56) + 'px';
        const hl = row.querySelector('.hl'), tx = row.querySelector('.tx'), cur = row.querySelector('.cur');
        if (!e.key) hl.remove();
        else tl.fromTo(hl, { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'expo.out' }, T_STAMP);
        const team = e.team === 'A' ? 'ATLAS' : 'VEGA ';
        const full = `${mmss(e.t)}     ${team}  ${e.text}`;
        const t0 = T_STOP + 0.04 + i * 0.17, dur = 0.42;
        // team chip at column 7
        const chip = ctx.svg('g', { opacity: 0 }, sv);
        const cx = LX + 7 * 16.6 + 10, cy = LB + 52 + i * 56 + 26;
        if (e.team === 'A') ctx.svg('rect', { x: cx - 7, y: cy - 7, width: 14, height: 14, fill: C.amber, stroke: INK, 'stroke-width': 2, transform: `rotate(45 ${cx} ${cy})` }, chip);
        else ctx.svg('circle', { cx, cy, r: 7.5, fill: 'none', stroke: C.rival, 'stroke-width': 3.2 }, chip);
        ctx.onFrame((t) => {
          const u = seg(t, t0, t0 + dur);
          const n = Math.round(u * full.length);
          const s = full.slice(0, n);
          if (tx.textContent !== s) tx.textContent = s;
          chip.setAttribute('opacity', n >= 7 ? 1 : 0);
          const on = t >= t0 && (u < 1 || (i === LOG.length - 1 && Math.floor((t - t0) * 3) % 2 === 0));
          cur.style.display = on ? '' : 'none';
          cur.style.left = (n * 16.58 + 1).toFixed(1) + 'px';
        });
        return row;
      });
      // ================= the stamp =================
      const ST = { w: 700, h: 152 };
      const stc = document.createElement('canvas'); stc.width = ST.w * 2; stc.height = ST.h * 2;
      {
        const g = stc.getContext('2d'); g.scale(2, 2);
        g.strokeStyle = INK; g.fillStyle = INK;
        g.lineWidth = 6; g.beginPath(); g.roundRect(5, 5, ST.w - 10, ST.h - 10, 10); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.roundRect(17, 17, ST.w - 34, ST.h - 34, 5); g.stroke();
        g.font = '800 62px "JetBrains Mono Variable"'; g.letterSpacing = '6px'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('ON THE RECORD', ST.w / 2 + 4, ST.h / 2 + 3);
        g.save(); g.translate(46, ST.h / 2); g.rotate(Math.PI / 4); g.fillRect(-9, -9, 18, 18); g.restore();
        g.lineWidth = 5; g.beginPath(); g.arc(ST.w - 46, ST.h / 2, 10, 0, Math.PI * 2); g.stroke();
        // worn rubber: speckle + a few soft voids
        const r = ctx.rng(ID + ':stamp');
        g.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 2600; i++) { g.globalAlpha = r.range(0.35, 1); g.beginPath(); g.arc(r() * ST.w, r() * ST.h, r.range(0.3, 1.3), 0, Math.PI * 2); g.fill(); }
        for (let i = 0; i < 14; i++) { const x = r() * ST.w, y = r() * ST.h, rr = r.range(10, 34); const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      }
      Object.assign(stc.style, { position: 'absolute', left: (522 - ST.w / 2) + 'px', top: (LB + 330 - ST.h / 2) + 'px', width: ST.w + 'px', height: ST.h + 'px', transformOrigin: '50% 50%' });
      wrap.appendChild(stc);
      tl.fromTo(stc, { scale: 1.55, rotation: -1, opacity: 0 }, { scale: 1, rotation: -4, opacity: 0.94, duration: 0.1, ease: 'power3.in' }, T_STAMP - 0.1);

      // paper shake on the stamp impact
      ctx.onFrame((t) => {
        const u = t - T_STAMP;
        let dx = 0, dy = 0;
        if (u >= 0 && u < 0.32) { const k = Math.exp(-u * 13); dx = 6 * k * Math.sin(u * 95); dy = 9 * k * Math.cos(u * 80); }
        const push = 1 + 0.02 * ez('sine.inOut')(seg(t, 0, 4));
        wrap.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${push.toFixed(5)})`;
      });
    },
  });
})();
