/* c05a-match: v4 'Worlds' (docs/storyboard-v4.md), film 26.0-30.0. Local 0 = 26.0.
 * "Two teams. The same starting conditions. One objective."  (VO w07 at 26.30: Two .30, teams .50,
 *  The 1.26, same 1.36, starting 1.62, conditions 2.02, One 3.00, objective 3.22 local)
 *
 *   0.00        charcoal; a dot-matrix globe (bone land dots, faint ocean dots) turning; 'SEARCHING · 3 V 3'
 *   0.30 / 0.50 the two team signals ping on opposite sides: ATLAS (amber, diamond) / VEGA (red-orange, ring),
 *               leader lines to their labels track the turning globe
 *   0.50-0.98   the matchmaking arc lifts off the surface and draws amber -> red-orange
 *   1.00        'Match found' locks (the arc flashes, the globe brakes)
 *   1.28-1.58   a challenge card is dealt from below, face down; 1.58-1.88 it flips (3D)
 *   1.9-2.6     STARTING CONDITIONS lines land (Power grid / Bridges / Storm), OBJECTIVE (2.5)
 *   3.00        'One objective': the card duplicates, one copy slides left (amber edge, ATLAS tab), one right
 *               (red-orange edge, VEGA tab); identical faces, identical weather on the thumbnails
 *   3.50-3.967  the centre opens: a hairline seam of light grows at frame centre (c05b opens it at 30.0)
 */
(function () {
  'use strict';
  const ID = 'c05a-match';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080;
  const S = `[data-scene="${ID}"]`;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, t0, d) => clamp((t - t0) / d, 0, 1);
  const o3 = (u) => 1 - Math.pow(1 - u, 3);
  const io3 = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const expoOut = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
  const spring = (z, n) => { const w = 2 * Math.PI * n, k = z * w / Math.sqrt(1 - z * z); return (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.exp(-k * u) * (Math.cos(w * u) + (k / w) * Math.sin(w * u))); };
  const SP = spring(0.62, 1.2);
  const rgba = B.rgba;
  const D2R = Math.PI / 180;
  // the closing seam at frame centre: degrees from vertical (0 = vertical). Match c05b's opening seam here.
  const SEAM_DEG = 0;

  // globe
  const GC = { x: 960, y: 600, r: 340 };
  const TILT = 16 * D2R;
  // rotation (deg) as a pure function of time: steady turn, braking after the match
  const ROT0 = -38;
  const rotAt = (t) => ROT0 + 26 * Math.min(t, 1.0) + 26 * 0.55 * (1 - Math.pow(1 - seg(t, 1.0, 1.1), 2)) * 1.1 + 4 * Math.max(0, t - 2.1);
  const SIG = [
    { lat: 24, lon: -26, col: C.amber, name: 'ATLAS', at: 0.30, lab: [540, 330], side: -1 },
    { lat: -18, lon: 66, col: C.rival, name: 'VEGA', at: 0.50, lab: [1390, 846], side: 1 },
  ];

  Film.scene({
    id: ID,
    duration: 4,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`
        ${S} { background:${C.bg}; }
        ${S} .c05-abs { position:absolute; }
        ${S} .c05-mono { font:600 20px/1 var(--mono); letter-spacing:.16em; text-transform:uppercase; white-space:pre; }
        ${S} .c05-cardwrap { position:absolute; left:960px; top:548px; width:0; height:0; }
        ${S} .c05-card { position:absolute; left:-270px; top:-380px; width:540px; height:760px; transform-style:preserve-3d; }
        ${S} .c05-face, ${S} .c05-back { position:absolute; inset:0; border-radius:28px; box-sizing:border-box; backface-visibility:hidden; -webkit-backface-visibility:hidden; overflow:hidden; }
        ${S} .c05-face { background:#121110; border:1.5px solid ${rgba(C.bone, 0.18)}; box-shadow: inset 0 1.5px 0 ${rgba(C.ink, 0.1)}; }
        ${S} .c05-back { background:${C.map}; border:1.5px solid ${rgba(C.amber, 0.3)}; transform:rotateY(180deg); }
        ${S} .c05-row { position:absolute; left:30px; right:30px; height:44px; display:flex; align-items:center; justify-content:space-between; border-bottom:1.5px solid ${rgba(C.bone, 0.1)}; }
        ${S} .c05-row .k { font:560 25px/1 var(--display); letter-spacing:-0.02em; color:${C.ink}; display:flex; align-items:center; gap:14px; }
        ${S} .c05-row .v { font:600 18px/1 var(--mono); letter-spacing:.14em; color:${C.bone}; }
        ${S} .c05-tab { position:absolute; left:28px; top:-58px; height:46px; padding:0 20px 0 16px; border-radius:12px; display:flex; align-items:center; gap:14px; font:700 22px/1 var(--mono); letter-spacing:.18em; }
      `);

      // ---------------------------------------------------------------------------------------
      // globe (canvas): land + ocean dots on latitude rows (dot-matrix), precomputed unit vectors
      // ---------------------------------------------------------------------------------------
      const { g } = ctx.canvas();
      const nz = ctx.noise3D('c05a-land');
      const LAND = [], SEA = [];
      const STEP = 2.15;
      for (let lat = -88; lat <= 88; lat += STEP) {
        const cl = Math.cos(lat * D2R);
        const n = Math.max(1, Math.round(360 * cl / STEP));
        for (let k = 0; k < n; k++) {
          const lon = k * 360 / n;
          const x = cl * Math.sin(lon * D2R), y = Math.sin(lat * D2R), z = cl * Math.cos(lon * D2R);
          const v = nz(x * 1.35, y * 1.35, z * 1.35) + 0.5 * nz(x * 2.9 + 7, y * 2.9, z * 2.9) + 0.25 * nz(x * 6 - 3, y * 6, z * 6);
          (v > 0.12 - 0.25 * Math.abs(y) * Math.abs(y) ? LAND : SEA).push([x, y, z]);
        }
      }
      const sigVec = SIG.map((s) => { const cl = Math.cos(s.lat * D2R); return [cl * Math.sin(s.lon * D2R), Math.sin(s.lat * D2R), cl * Math.cos(s.lon * D2R)]; });
      function rot(v, phi) {
        const c = Math.cos(phi), s = Math.sin(phi);
        const x1 = v[0] * c + v[2] * s, z1 = -v[0] * s + v[2] * c;
        const ct = Math.cos(TILT), st = Math.sin(TILT);
        const y2 = v[1] * ct - z1 * st, z2 = v[1] * st + z1 * ct;
        return [x1, y2, z2];
      }
      // great-circle arc between the two signals, lifted off the surface
      const slerp = (a, b, u) => {
        const d = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)), s = Math.sin(d);
        const ka = Math.sin((1 - u) * d) / s, kb = Math.sin(u * d) / s;
        return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
      };
      const ARC_N = 90;
      const arcPts = Array.from({ length: ARC_N + 1 }, (_, i) => { const u = i / ARC_N, p = slerp(sigVec[0], sigVec[1], u), h = 1 + 0.36 * Math.sin(Math.PI * u); return [p[0] * h, p[1] * h, p[2] * h]; });

      // globe camera (tweened): scale, y offset, alpha
      const gl = { s: 1, dy: 0, a: 1, arcA: 1 };
      tl.to(gl, { s: 1.75, dy: 260, a: 0.2, arcA: 0, duration: 0.75, ease: 'power3.inOut' }, 1.2);
      tl.to(gl, { s: 1.85, dy: 280, duration: 1.0, ease: 'none' }, 1.95);
      tl.to(gl, { a: 0, s: 2.1, duration: 0.45, ease: 'power2.in' }, 2.95);

      // labels for the signals (HTML), leader lines drawn in the canvas
      const sigLab = SIG.map((s, i) => {
        const el = ctx.el('div', 'c05-abs c05-mono', root, '');
        const emblem = i === 0
          ? `<i style="display:inline-block;width:14px;height:14px;background:${s.col};transform:rotate(45deg);margin-right:16px;vertical-align:1px"></i>`
          : `<i style="display:inline-block;width:12px;height:12px;border:3px solid ${s.col};border-radius:50%;margin-right:16px;vertical-align:-1px"></i>`;
        el.innerHTML = `${emblem}<span class="n" style="color:${s.col}">${s.name}</span><span style="color:${rgba(C.bone, 0.55)};margin-left:16px">· 3 PLAYERS</span>`;
        Object.assign(el.style, { top: (s.lab[1] - 10) + 'px', fontSize: '24px' });
        if (s.side < 0) el.style.right = (W - s.lab[0]) + 'px'; else el.style.left = s.lab[0] + 'px';
        tl.fromTo(el, { opacity: 0, x: -24 * s.side }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, s.at + 0.05);
        tl.to(el, { opacity: 0, duration: 0.3, ease: 'none' }, 1.2);
        return el;
      });

      // status line: SEARCHING -> MATCH FOUND
      const status = ctx.el('div', 'c05-abs c05-mono', root, '');
      Object.assign(status.style, { left: '960px', top: '118px', transform: 'translateX(-50%)', color: rgba(C.bone, 0.75), fontSize: '22px' });
      status.innerHTML = '<span class="sp" style="display:inline-block;width:18px;height:18px;margin-right:16px;vertical-align:-2px"></span><span class="tx">SEARCHING · 3 V 3</span>';
      const spin = ctx.svg('svg', { viewBox: '0 0 24 24', width: 18, height: 18 }, status.querySelector('.sp'));
      const spinArc = ctx.svg('path', { d: 'M12 3 A9 9 0 0 1 21 12', stroke: C.amber, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, spin);
      ctx.svg('circle', { cx: 12, cy: 12, r: 9, stroke: rgba(C.bone, 0.2), 'stroke-width': 3, fill: 'none' }, spin);
      tl.to(status, { opacity: 0, duration: 0.08, ease: 'none' }, 0.98);
      // MATCH FOUND
      const mf = ctx.el('div', 'c05-abs', root, '');
      Object.assign(mf.style, { left: '0', width: W + 'px', top: '92px', textAlign: 'center', whiteSpace: 'nowrap' });
      mf.innerHTML = `<div class="ey c05-mono" style="font-size:22px;color:${rgba(C.bone, 0.7)};margin-bottom:22px"><span style="color:${C.amber}">ATLAS</span>   3 V 3   <span style="color:${C.rival}">VEGA</span></div>`
        + `<div class="hl" style="font:650 104px/1 var(--display);letter-spacing:-0.05em;color:${C.ink}">Match found</div>`;
      const mfHl = mf.querySelector('.hl'), mfEy = mf.querySelector('.ey');
      tl.fromTo(mfHl, { scale: 1.22, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.42, ease: 'expo.out' }, 1.0);
      tl.fromTo(mfEy, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out' }, 1.06);
      tl.to(mf, { y: -60, opacity: 0, duration: 0.32, ease: 'power2.in' }, 1.36);
      // lock brackets around the headline
      const brk = ctx.svg('svg', { class: 'brand-svg' }, root);
      const BR = { x0: 618, x1: 1302, y0: 124, y1: 256 };
      const brackets = [[BR.x0, BR.y0, 1, 1], [BR.x1, BR.y0, -1, 1], [BR.x0, BR.y1, 1, -1], [BR.x1, BR.y1, -1, -1]].map(([x, y, sx, sy]) =>
        ctx.svg('path', { d: `M${x} ${y + 22 * sy} L${x} ${y} L${x + 22 * sx} ${y}`, stroke: C.amber, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'square', opacity: 0 }, brk));

      // ---------------------------------------------------------------------------------------
      // the challenge card (+ two copies for the split)
      // ---------------------------------------------------------------------------------------
      // storm city thumbnail: static city drawn once; rain + lightning per frame (identical on every copy)
      const TW = 480, TH = 262;
      const city = document.createElement('canvas'); city.width = TW * 2; city.height = TH * 2;
      (function drawCity() {
        const c = city.getContext('2d'); c.scale(2, 2);
        const sky = c.createLinearGradient(0, 0, 0, TH);
        sky.addColorStop(0, '#16130f'); sky.addColorStop(1, '#0b0c0e');
        c.fillStyle = sky; c.fillRect(0, 0, TW, TH);
        // storm clouds: soft bands
        const cn = ctx.noise2D('c05a-cloud');
        for (let y = 0; y < 70; y += 2) for (let x = 0; x < TW; x += 2) {
          const v = cn(x * 0.012, y * 0.03) * 0.5 + 0.5;
          c.fillStyle = rgba(C.bone, 0.05 * v * (1 - y / 70)); c.fillRect(x, y, 2, 2);
        }
        const rr = ctx.rng('c05a-city');
        const tw = 38, th = 19, ox = TW / 2 + 6, oy = 70, N = 12;
        const river = (i, j) => Math.abs((i - j) + 0.5) < 1.1;
        const bridgeAt = (i, j) => river(i, j) && (i + j === 9 || i + j === 15);
        const iso = (i, j, h) => [ox + (i - j) * tw / 2, oy + (i + j) * th / 2 - h];
        // ground plate
        { const a = iso(0, 0, 0), b = iso(N, 0, 0), cc = iso(N, N, 0), d = iso(0, N, 0);
          c.fillStyle = '#14120f'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fill(); }
        const cells = [];
        for (let sm = 0; sm <= 2 * (N - 1); sm++) for (let i = 0; i < N; i++) { const j = sm - i; if (j < 0 || j >= N) continue; cells.push([i, j]); }
        const plantC = [3, 8];
        for (const [i, j] of cells) {
          const [x0, y0] = iso(i, j, 0);
          if (river(i, j)) {
            c.fillStyle = '#0b0c0e';
            c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + tw / 2, y0 + th / 2); c.lineTo(x0, y0 + th); c.lineTo(x0 - tw / 2, y0 + th / 2); c.closePath(); c.fill();
            c.strokeStyle = rgba(C.bone, 0.22); c.lineWidth = 1;
            c.beginPath(); c.moveTo(x0 - 9, y0 + th / 2 - 1); c.lineTo(x0 + 3, y0 + th / 2 + 5); c.stroke();
            if (bridgeAt(i, j)) {
              c.strokeStyle = rgba(C.bone, 0.9); c.lineWidth = 3;
              c.beginPath(); c.moveTo(x0 - tw / 2 - 6, y0 + th / 2 - 3); c.lineTo(x0 + tw / 2 + 6, y0 + th / 2 + 3); c.stroke();
            }
            continue;
          }
          const far = (i + j) / (2 * N);
          const plant = i === plantC[0] && j === plantC[1];
          const park = rr() < 0.14;
          const h = plant ? 30 : park ? 0 : 8 + Math.pow(rr(), 1.8) * 70 * (0.55 + 0.6 * (1 - Math.abs(i - j) / N));
          const [tx, ty] = iso(i, j, h);
          const ins = 3;
          const top = [[tx, ty + ins], [tx + tw / 2 - ins * 1.6, ty + th / 2], [tx, ty + th - ins], [tx - tw / 2 + ins * 1.6, ty + th / 2]];
          if (h > 0) {
            c.fillStyle = '#29241e';
            c.beginPath(); c.moveTo(top[3][0], top[3][1]); c.lineTo(top[2][0], top[2][1]); c.lineTo(top[2][0], top[2][1] + h); c.lineTo(top[3][0], top[3][1] + h); c.closePath(); c.fill();
            c.fillStyle = '#1a1714';
            c.beginPath(); c.moveTo(top[2][0], top[2][1]); c.lineTo(top[1][0], top[1][1]); c.lineTo(top[1][0], top[1][1] + h); c.lineTo(top[2][0], top[2][1] + h); c.closePath(); c.fill();
          }
          c.fillStyle = h > 0 ? '#4a4136' : '#1d1a16';
          c.beginPath(); top.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
          c.strokeStyle = rgba(C.bone, 0.2 + 0.12 * (1 - far)); c.lineWidth = 1; c.stroke();
          // windows on the lit (left) face: mostly dark (grid offline), a few amber
          if (h > 16) {
            const rowsW = Math.floor((h - 6) / 8);
            for (let k = 0; k < rowsW; k++) for (let m = 0; m < 2; m++) {
              const lit = rr() < 0.1;
              const fx = lerp(top[3][0], top[2][0], 0.3 + m * 0.4), fy = lerp(top[3][1], top[2][1], 0.3 + m * 0.4) + 6 + k * 8;
              c.fillStyle = lit ? rgba(C.amber, 0.95) : rgba(C.bone, 0.08);
              c.fillRect(fx - 1.5, fy, 3, 3);
            }
          }
          if (plant) {
            // the power plant: two stacks, dark beacons
            [[-7, 40], [6, 52]].forEach(([dx, sh]) => { c.fillStyle = '#3a332a'; c.fillRect(tx + dx - 3, ty + th / 2 - sh, 6, sh); c.strokeStyle = rgba(C.bone, 0.4); c.lineWidth = 1; c.strokeRect(tx + dx - 3, ty + th / 2 - sh, 6, sh); });
          }
        }
      })();
      const nzR = ctx.noise2D('c05a-rain');
      function drawThumb(c, t) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.drawImage(city, 0, 0);
        c.scale(2, 2);
        // rain: slanted streaks, a pure function of t
        c.strokeStyle = rgba(C.bone, 0.22); c.lineWidth = 1;
        c.beginPath();
        for (let k = 0; k < 140; k++) {
          const sx = (k * 97.13) % (TW + 80) - 40, sp = 520 + (k * 37) % 200;
          const y = ((k * 53.7 + t * sp) % (TH + 40)) - 20;
          const x = sx - y * 0.3;
          c.moveTo(x, y); c.lineTo(x - 4, y + 13);
        }
        c.stroke();
        // lightning: two strikes (same instants on every copy)
        const fl = Math.max(0, 1 - Math.abs(t - 2.28) / 0.05) + Math.max(0, 1 - Math.abs(t - 3.62) / 0.06) * 0.9;
        if (fl > 0) {
          c.fillStyle = rgba(C.ink, 0.22 * fl); c.fillRect(0, 0, TW, TH);
          c.strokeStyle = rgba(C.ink, 0.9 * fl); c.lineWidth = 1.6;
          c.beginPath(); let x = 330, y = 0; c.moveTo(x, y);
          for (let k = 0; k < 7; k++) { x += nzR(k * 0.7, 3) * 18; y += 13; c.lineTo(x, y); }
          c.stroke();
        }
        // vignette
        const vg = c.createRadialGradient(TW / 2, TH / 2, TH * 0.3, TW / 2, TH / 2, TW * 0.7);
        vg.addColorStop(0, 'rgba(11,12,14,0)'); vg.addColorStop(1, 'rgba(11,12,14,.55)');
        c.fillStyle = vg; c.fillRect(0, 0, TW, TH);
      }

      const ROWS = [['Power grid', 'OFFLINE'], ['Bridges', '2 OPEN'], ['Storm', 'RISING']];
      const ICO = {
        bolt: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M13 3L6 13.5H11.5L10.5 21L18 10.5H12.5Z" fill="none" stroke="${C.bone}" stroke-width="2" stroke-linejoin="round"/></svg>`,
        bridge: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 15H21M5 15V19M19 15V19M5 15C8 9 16 9 19 15" fill="none" stroke="${C.bone}" stroke-width="2" stroke-linecap="round"/></svg>`,
        storm: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 15H17A4 4 0 0 0 16 7.2A5.5 5.5 0 0 0 5.5 9A3 3 0 0 0 7 15Z" fill="none" stroke="${C.bone}" stroke-width="2" stroke-linejoin="round"/><path d="M9 18L8 20.5M13 18L12 20.5M17 18L16 20.5" stroke="${C.bone}" stroke-width="2" stroke-linecap="round"/></svg>`,
      };
      const ROW_ICO = ['bolt', 'bridge', 'storm'];
      function makeCard(parent, team) {
        const wrap = ctx.el('div', 'c05-cardwrap', parent);
        const card = ctx.el('div', 'c05-card', wrap);
        const face = ctx.el('div', 'c05-face', card);
        const hd = ctx.el('div', 'c05-abs c05-mono', face, `CHALLENGE<span style="float:right">3 V 3</span>`);
        Object.assign(hd.style, { left: '30px', right: '30px', top: '30px', color: rgba(C.bone, 0.62), fontSize: '17px' });
        const thumbWrap = ctx.el('div', 'c05-abs', face);
        Object.assign(thumbWrap.style, { left: '30px', top: '66px', width: TW + 'px', height: TH + 'px', borderRadius: '16px', overflow: 'hidden', boxShadow: `0 0 0 1.5px ${rgba(C.bone, 0.12)}` });
        const cv = ctx.el('canvas', '', thumbWrap); cv.width = TW * 2; cv.height = TH * 2; Object.assign(cv.style, { width: TW + 'px', height: TH + 'px', display: 'block' });
        const tg = cv.getContext('2d');
        const title = ctx.el('div', 'c05-abs', face, 'Storm City');
        Object.assign(title.style, { left: '30px', top: '352px', font: '680 44px/1 var(--display)', letterSpacing: '-0.04em', color: C.ink });
        const sc = ctx.el('div', 'c05-abs c05-mono', face, 'STARTING CONDITIONS');
        Object.assign(sc.style, { left: '30px', top: '424px', color: rgba(C.bone, 0.6), fontSize: '16px' });
        const rows = ROWS.map(([k, v], i) => {
          const r = ctx.el('div', 'c05-row', face, `<span class="k">${ICO[ROW_ICO[i]]}${k}</span><span class="v">${v}</span>`);
          r.style.top = (452 + i * 50) + 'px';
          return r;
        });
        const ob = ctx.el('div', 'c05-abs c05-mono', face, 'OBJECTIVE');
        Object.assign(ob.style, { left: '30px', top: '624px', color: rgba(C.bone, 0.6), fontSize: '16px' });
        const obT = ctx.el('div', 'c05-abs', face, `<svg viewBox="0 0 40 40" width="38" height="38" style="flex:none"><circle cx="20" cy="20" r="15" fill="none" stroke="${C.ink}" stroke-width="2.5"/><circle cx="20" cy="20" r="6" fill="${C.ink}"/></svg><span>Restore power to<br>the city centre</span>`);
        Object.assign(obT.style, { left: '30px', top: '654px', display: 'flex', alignItems: 'flex-start', gap: '18px', font: '650 31px/1.12 var(--display)', letterSpacing: '-0.03em', color: C.ink });
        let back = null, tab = null, edge = null;
        if (!team) {
          back = ctx.el('div', 'c05-back', card);
          const bsv = ctx.svg('svg', { viewBox: '0 0 540 760', width: 540, height: 760, style: 'position:absolute;left:0;top:0' }, back);
          const TS = Math.tan((B.SLANT || 34) * D2R);
          for (let k = -20; k < 40; k++) ctx.svg('line', { x1: k * 28, y1: 0, x2: k * 28 - 760 / TS, y2: 760, stroke: rgba(C.amber, 0.09), 'stroke-width': 2 }, bsv);
          ctx.svg('rect', { x: 22, y: 22, width: 496, height: 716, rx: 18, fill: 'none', stroke: rgba(C.amber, 0.35), 'stroke-width': 2 }, bsv);
          B.mark(ctx, { x: 270 - 572 * (96 / 420) / 2, y: 330, h: 96, color: C.amber, style: 'none', parent: bsv });
          ctx.svg('text', { x: 270, y: 500, 'text-anchor': 'middle', fill: rgba(C.bone, 0.7), style: 'font:600 17px "JetBrains Mono Variable";letter-spacing:.3em', text: 'REALMS · COMPETITIVE' }, bsv);
        } else {
          const col = team === 'atlas' ? C.amber : C.rival;
          edge = ctx.el('div', 'c05-abs', card);
          Object.assign(edge.style, { inset: '-1px', borderRadius: '29px', border: `4px solid ${col}`, boxSizing: 'border-box' });
          tab = ctx.el('div', 'c05-tab', card, team === 'atlas'
            ? `<i style="display:block;width:14px;height:14px;background:${C.bg};transform:rotate(45deg)"></i>ATLAS`
            : `<i style="display:block;width:12px;height:12px;border:3px solid ${C.bg};border-radius:50%"></i>VEGA`);
          Object.assign(tab.style, { background: col, color: C.bg });
          if (team === 'vega') { tab.style.left = 'auto'; tab.style.right = '28px'; }
        }
        return { wrap, card, face, rows, ob, obT, sc, tg, back, tab, edge, title };
      }

      // soft light behind the card (separation from the charcoal ground)
      const halo = ctx.el('div', 'c05-abs', root);
      Object.assign(halo.style, { left: '960px', top: '548px', width: '1300px', height: '1100px', marginLeft: '-650px', marginTop: '-550px', background: `radial-gradient(closest-side, ${rgba(C.bone, 0.075)}, ${rgba(C.bone, 0)})` });
      tl.fromTo(halo, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }, 1.5);
      tl.to(halo, { opacity: 0, duration: 0.3, ease: 'none' }, 3.0);
      const main = makeCard(root, null);
      const CL = makeCard(root, 'atlas');
      const CR = makeCard(root, 'vega');

      // deal (1.28) + flip (1.58)
      tl.fromTo(main.wrap, { x: 340, y: 1180, rotation: 18 }, { x: 0, y: 0, rotation: -2.5, duration: 0.34, ease: 'expo.out' }, 1.26);
      tl.to(main.wrap, { rotation: 0, duration: 0.5, ease: SP }, 1.6);
      tl.fromTo(main.card, { rotationY: -180, transformPerspective: 1800, scale: 1 }, { rotationY: 0, transformPerspective: 1800, duration: 0.42, ease: 'power3.inOut' }, 1.56);
      tl.fromTo(main.card, { scale: 1 }, { scale: 1.06, duration: 0.21, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, 1.56);
      // face content lands after the flip
      tl.fromTo(main.sc, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.3, ease: 'expo.out' }, 1.86);
      main.rows.forEach((r, i) => tl.fromTo(r, { opacity: 0, x: -22 }, { opacity: 1, x: 0, duration: 0.36, ease: 'expo.out' }, 1.94 + i * 0.13));
      tl.fromTo(main.ob, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.3, ease: 'expo.out' }, 2.42);
      tl.fromTo(main.obT, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, 2.48);
      tl.fromTo(main.card, { scale: 1 }, { scale: 1.045, duration: 1.1, ease: 'power1.inOut', immediateRender: false }, 1.98);
      tl.to(main.wrap, { opacity: 0, duration: 0.01, ease: 'none' }, 3.0);

      // the split (3.0): two identical copies slide to the edges
      const XL = -585, XR = 585;
      [[CL, XL, -1], [CR, XR, 1]].forEach(([cp, dx, sd]) => {
        tl.fromTo(cp.wrap, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: 'none' }, 3.0);
        tl.fromTo(cp.wrap, { x: 0, scale: 1.045, rotation: 0 }, { x: dx, scale: 0.94, rotation: 0, duration: 0.5, ease: 'expo.out' }, 3.0);
        tl.fromTo(cp.edge, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: 'none' }, 3.04);
        tl.fromTo(cp.tab, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, ease: SP }, 3.12);
        tl.to(cp.wrap, { x: dx + 26 * sd, duration: 0.5, ease: 'power1.in' }, 3.5);
      });

      // centre seam (3.52-3.967)
      const seam = ctx.svg('svg', { class: 'brand-svg' }, root);
      seam.style.transformOrigin = '960px 540px'; seam.style.transform = `rotate(${SEAM_DEG}deg)`;
      const seamGlow = ctx.svg('line', { x1: 960, y1: 0, x2: 960, y2: H, stroke: rgba(C.ink, 0.16), 'stroke-width': 16 }, seam);
      const seamLine = ctx.svg('line', { x1: 960, y1: 0, x2: 960, y2: H, stroke: C.ink, 'stroke-width': 2.5 }, seam);

      // ---------------------------------------------------------------------------------------
      // per frame
      // ---------------------------------------------------------------------------------------
      const sigProj = (i, phi) => {
        const r = rot(sigVec[i], phi);
        return { x: GC.x + GC.r * gl.s * r[0], y: GC.y + gl.dy - GC.r * gl.s * r[1], z: r[2] };
      };
      ctx.onFrame((t) => {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, W, H);
        const phi = rotAt(t) * D2R;
        const R = GC.r * gl.s, cx = GC.x, cy = GC.y + gl.dy;
        if (gl.a > 0.002) {
          g.globalAlpha = gl.a;
          // body + rim
          const body = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
          body.addColorStop(0, '#16140f'); body.addColorStop(1, '#0d0d0e');
          g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
          g.strokeStyle = rgba(C.bone, 0.16); g.lineWidth = 1.5; g.stroke();
          const atm = g.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.14);
          atm.addColorStop(0, rgba(C.bone, 0.07)); atm.addColorStop(1, rgba(C.bone, 0));
          g.fillStyle = atm; g.beginPath(); g.arc(cx, cy, R * 1.14, 0, Math.PI * 2); g.arc(cx, cy, R * 0.96, 0, Math.PI * 2, true); g.fill();
          // dots: bucketed by depth
          const buckets = [[], [], [], [], []];
          for (const v of LAND) { const r = rot(v, phi); if (r[2] < 0.02) continue; buckets[Math.min(4, Math.floor(r[2] * 5))].push(cx + R * r[0], cy - R * r[1]); }
          for (let b = 0; b < 5; b++) {
            const z = (b + 0.5) / 5, rad = 2.0 * gl.s * (0.62 + 0.45 * z);
            g.fillStyle = rgba(C.bone, 0.28 + 0.62 * z);
            g.beginPath();
            const a = buckets[b];
            for (let k = 0; k < a.length; k += 2) { g.moveTo(a[k] + rad, a[k + 1]); g.arc(a[k], a[k + 1], rad, 0, Math.PI * 2); }
            g.fill();
          }
          g.fillStyle = rgba(C.bone, 0.09);
          g.beginPath();
          for (const v of SEA) { const r = rot(v, phi); if (r[2] < 0.15) continue; const x = cx + R * r[0], y = cy - R * r[1]; g.rect(x - 0.9, y - 0.9, 1.8, 1.8); }
          g.fill();
          // signals
          SIG.forEach((s, i) => {
            if (t < s.at) return;
            const p = sigProj(i, phi);
            const k = expoOut(seg(t, s.at, 0.35));
            const front = clamp(p.z * 4, 0, 1);
            // ping rings (repeat every 0.7 s)
            for (let q = 0; q < 2; q++) {
              const u = ((t - s.at) / 0.7 + q * 0.5) % 1;
              if (t - s.at < q * 0.35) continue;
              g.strokeStyle = rgba(s.col, 0.8 * (1 - u) * front); g.lineWidth = 2.5;
              g.beginPath(); g.ellipse(p.x, p.y, (8 + 62 * o3(u)) * gl.s, (8 + 62 * o3(u)) * gl.s * (0.45 + 0.55 * Math.max(0.2, p.z)), 0, 0, Math.PI * 2); g.stroke();
            }
            g.fillStyle = s.col; g.globalAlpha = gl.a * front;
            g.beginPath(); g.arc(p.x, p.y, 8 * k * gl.s, 0, Math.PI * 2); g.fill();
            g.strokeStyle = C.bg; g.lineWidth = 2.5; g.stroke();
            g.globalAlpha = gl.a;
            // leader line to the label
            const la = clamp(1 - seg(t, 1.12, 0.2), 0, 1) * k;
            if (la > 0) {
              const [lx, ly] = s.lab;
              const ex = lx + (s.side < 0 ? 18 : -18);
              g.strokeStyle = rgba(s.col, 0.75 * la); g.lineWidth = 2;
              g.beginPath(); g.moveTo(p.x, p.y); const mx = lerp(p.x, ex, 0.55); g.lineTo(mx, ly); g.lineTo(ex, ly); g.stroke();
            }
          });
          // the matchmaking arc
          const au = io3(seg(t, 0.5, 0.48));
          if (au > 0 && gl.arcA > 0.01) {
            const pts = arcPts.map((v) => { const r = rot(v, phi); return [cx + R * r[0], cy - R * r[1], r[2]]; });
            { const a0 = pts[0], a1 = pts[ARC_N], dx = a1[0] - a0[0], dy = a1[1] - a0[1], Lc = Math.hypot(dx, dy) || 1;
              let nx = dy / Lc, ny = -dx / Lc; if (ny > 0) { nx = -nx; ny = -ny; }
              pts.forEach((p, i) => { const k = Math.sin(Math.PI * i / ARC_N) * 0.28 * Lc; p[0] += nx * k; p[1] += ny * k; }); }
            const nseg = Math.max(1, Math.floor(au * ARC_N));
            const p0 = pts[0], p1 = pts[ARC_N];
            const grd = g.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
            grd.addColorStop(0, C.amber); grd.addColorStop(1, C.rival);
            const flash = Math.max(0, 1 - Math.abs(t - 1.02) / 0.12);
            g.globalAlpha = gl.a * gl.arcA;
            g.strokeStyle = rgba(C.ink, 0.25 * flash); g.lineWidth = 14; g.lineCap = 'round';
            if (flash > 0) { g.beginPath(); for (let k = 0; k <= nseg; k++) (k ? g.lineTo(pts[k][0], pts[k][1]) : g.moveTo(pts[k][0], pts[k][1])); g.stroke(); }
            g.strokeStyle = grd; g.lineWidth = 3.5;
            g.beginPath(); for (let k = 0; k <= nseg; k++) (k ? g.lineTo(pts[k][0], pts[k][1]) : g.moveTo(pts[k][0], pts[k][1])); g.stroke();
            if (au < 1) {
              const hp = pts[nseg];
              g.fillStyle = C.ink; g.beginPath(); g.arc(hp[0], hp[1], 5, 0, Math.PI * 2); g.fill();
              g.fillStyle = rgba(C.ink, 0.25); g.beginPath(); g.arc(hp[0], hp[1], 14, 0, Math.PI * 2); g.fill();
            }
            g.globalAlpha = gl.a;
          }
          g.globalAlpha = 1;
        }
        // spinner
        spin.setAttribute('transform', '');
        spinArc.setAttribute('transform', `rotate(${(t * 540) % 360} 12 12)`);
        // brackets lock on 1.0
        const bu = seg(t, 1.0, 0.3), bo = t < 1.0 ? 0 : clamp(1 - seg(t, 1.3, 0.12), 0, 1);
        brackets.forEach((b, i) => {
          const sx = i % 2 ? -1 : 1, sy = i < 2 ? -1 : 1;
          const d = 50 * (1 - expoOut(bu));
          b.setAttribute('transform', `translate(${(-sx * d).toFixed(2)} ${(sy * d * 0.5).toFixed(2)})`);
          b.setAttribute('opacity', bo.toFixed(3));
        });
        // thumbnails
        [main, CL, CR].forEach((cp) => drawThumb(cp.tg, t));
        // seam
        const su = expoOut(seg(t, 3.52, 0.42));
        const half = 600 * su / Math.cos(SEAM_DEG * D2R);
        [seamLine, seamGlow].forEach((l) => { l.setAttribute('y1', (540 - half).toFixed(1)); l.setAttribute('y2', (540 + half).toFixed(1)); });
        seam.style.opacity = su > 0 ? 1 : 0;
      });
    },
  });
})();
