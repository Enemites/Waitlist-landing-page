/* c06-lobby: v4 'Worlds' (docs/storyboard-v4.md), film 36.0-40.0. Local 0 = 36.0.
 * "Meet the other side. Assign your roles."  (VO w09 at 36.20: Meet .20, the .44, other .62, side .76,
 *  Assign 1.64, your 1.92, roles 2.08 local)
 * A 3 v 3 versus lobby built like a fighting-game select screen: three slanted player panels a side.
 *
 *   0.00        the frame opens from a centre line (the incoming hit); headers + seam
 *   0.14-0.36   ATLAS slams in from the left (Jules, Nora, Emre: amber-lit busts, monograms, names)
 *   0.54-0.76   VEGA slams in from the right (three red-orange silhouettes, names + roles hidden) and meets
 *               it face to face on 'side' (0.76): flash on the seam, VS plate, shake
 *   1.50        the role tray rises ('Assign' 1.64); COORDINATION / POWER SYSTEMS / CROSSING fly into our
 *               players and lock (1.94 / 2.12 / 2.30)
 *   3.00        'PLAN LOCKED' stamp slams in (ink-eroded amber stamp), shake
 *   3.75-3.967  everything collapses to a line of light for THE DROP at 40.0
 */
(function () {
  'use strict';
  const ID = 'c06-lobby';
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
  const SP = spring(0.55, 1.4);
  const rgba = B.rgba;

  const PW = 262, PH = 610, SK = 64, GAP = 16, PY = 268;
  const AX = [112, 112 + PW + GAP, 112 + 2 * (PW + GAP)];
  const VX = [W - 112 - 3 * PW - 2 * GAP, W - 112 - 2 * PW - GAP, W - 112 - PW];
  const ATLAS = [
    { name: 'Jules', ini: 'JK', role: 'COORDINATION', hair: 'short' },
    { name: 'Nora', ini: 'NC', role: 'POWER SYSTEMS', hair: 'long' },
    { name: 'Emre', ini: 'EK', role: 'CROSSING', hair: 'cap' },
  ];
  const VEGA = [{ hair: 'hood' }, { hair: 'short' }, { hair: 'long' }];
  const T_A = 0.14, T_V = 0.54, SLAM = 0.22, T_HIT = T_V + SLAM;          // 0.76 on 'side'
  const ROLE_LAND = [1.94, 2.12, 2.3], ROLE_FLY = 0.3;
  const T_STAMP = 3.0, T_COL = 3.75;

  // bust silhouette (origin bottom centre, ~250 wide x 330 tall)
  const BODY = 'M-132 140 L-130 0 C-128 -62 -98 -100 -48 -114 L-30 -118 C-32 -130 -33 -138 -33 -150 L33 -150 C33 -138 32 -130 30 -118 L48 -114 C98 -100 128 -62 130 0 L132 140 Z';
  const HEAD = (k) => `M0 ${-262 * k} C${38 * k} ${-262 * k} ${58 * k} ${-232 * k} ${58 * k} ${-196 * k} C${58 * k} ${-160 * k} ${34 * k} ${-136 * k} 0 ${-136 * k} C${-34 * k} ${-136 * k} ${-58 * k} ${-160 * k} ${-58 * k} ${-196 * k} C${-58 * k} ${-232 * k} ${-38 * k} ${-262 * k} 0 ${-262 * k} Z`;
  const HAIR = {
    short: 'M-60 -200 C-62 -248 -36 -272 2 -272 C40 -272 64 -250 62 -204 C54 -228 34 -240 4 -236 C-26 -240 -50 -228 -60 -200 Z',
    long: 'M-66 -196 C-70 -250 -38 -276 0 -276 C38 -276 70 -250 66 -196 L70 -128 C60 -116 46 -114 40 -120 L44 -190 C30 -232 -30 -232 -44 -190 L-40 -120 C-46 -114 -60 -116 -70 -128 Z',
    cap: 'M-62 -200 C-64 -252 -32 -280 2 -280 C36 -280 66 -252 64 -200 C58 -206 50 -210 40 -212 C10 -218 -22 -216 -44 -210 C-52 -208 -58 -205 -62 -200 Z',
    hood: 'M-84 -170 C-90 -246 -48 -290 0 -290 C48 -290 90 -246 84 -170 L92 -110 L60 -118 L56 -184 C46 -236 -46 -236 -56 -184 L-60 -118 L-92 -110 Z',
  };

  Film.scene({
    id: ID,
    duration: 4,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`
        ${S} { background:${C.bg}; }
        ${S} .c06-abs { position:absolute; }
        ${S} .c06-all { position:absolute; inset:0; transform-origin:960px 540px; }
        ${S} .c06-mono { font:600 20px/1 var(--mono); letter-spacing:.16em; text-transform:uppercase; white-space:pre; }
        ${S} .c06-panel { position:absolute; top:${PY}px; width:${PW}px; height:${PH}px; }
        ${S} .c06-chip { position:absolute; height:48px; padding:0 18px; border-radius:10px; display:flex; align-items:center; justify-content:center; gap:10px; font:700 19px/1 var(--mono); letter-spacing:.12em; white-space:nowrap; box-sizing:border-box; }
      `);
      const all = ctx.el('div', 'c06-all', root);

      // ground: two faint team washes either side of the seam
      const bgsv = ctx.svg('svg', { class: 'brand-svg' }, all);
      const defs = ctx.svg('defs', {}, bgsv);
      const gA = ctx.svg('radialGradient', { id: `${ID}-wa`, cx: 0.3, cy: 0.62, r: 0.7 }, defs);
      ctx.svg('stop', { offset: 0, 'stop-color': C.amber, 'stop-opacity': 0.13 }, gA);
      ctx.svg('stop', { offset: 1, 'stop-color': C.amber, 'stop-opacity': 0 }, gA);
      const gV = ctx.svg('radialGradient', { id: `${ID}-wv`, cx: 0.7, cy: 0.62, r: 0.7 }, defs);
      ctx.svg('stop', { offset: 0, 'stop-color': C.rival, 'stop-opacity': 0.12 }, gV);
      ctx.svg('stop', { offset: 1, 'stop-color': C.rival, 'stop-opacity': 0 }, gV);
      const washA = ctx.svg('rect', { x: 0, y: 0, width: 960, height: H, fill: `url(#${ID}-wa)` }, bgsv);
      const washV = ctx.svg('rect', { x: 960, y: 0, width: 960, height: H, fill: `url(#${ID}-wv)` }, bgsv);
      // fine horizontal scan lines (select-screen texture)
      for (let y = 0; y < H; y += 6) ctx.svg('line', { x1: 0, y1: y, x2: W, y2: y, stroke: rgba(C.bone, 0.025), 'stroke-width': 1 }, bgsv);
      tl.fromTo([washA, washV], { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'none', stagger: 0.4 }, 0.1);

      // headers
      const hdA = ctx.el('div', 'c06-abs', all, `<i style="display:inline-block;width:26px;height:26px;background:${C.amber};transform:rotate(45deg);margin-right:26px;vertical-align:6px"></i>Atlas`);
      Object.assign(hdA.style, { left: '112px', top: '128px', font: '760 76px/1 var(--display)', letterSpacing: '-0.045em', color: C.ink, whiteSpace: 'nowrap' });
      const hdAs = ctx.el('div', 'c06-abs c06-mono', all, 'YOUR TEAM');
      Object.assign(hdAs.style, { left: '166px', top: '214px', color: C.amber, fontSize: '19px' });
      const hdV = ctx.el('div', 'c06-abs', all, `Vega<i style="display:inline-block;width:20px;height:20px;border:5px solid ${C.rival};border-radius:50%;margin-left:26px;vertical-align:6px"></i>`);
      Object.assign(hdV.style, { right: '112px', top: '128px', font: '760 76px/1 var(--display)', letterSpacing: '-0.045em', color: C.ink, whiteSpace: 'nowrap' });
      const hdVs = ctx.el('div', 'c06-abs c06-mono', all, 'OPPOSING TEAM');
      Object.assign(hdVs.style, { right: '168px', top: '214px', color: C.rival, fontSize: '19px' });
      const lob = ctx.el('div', 'c06-abs c06-mono', all, 'LOBBY · TEAM CHALLENGE · 3 V 3');
      Object.assign(lob.style, { left: '960px', top: '96px', transform: 'translateX(-50%)', color: rgba(C.bone, 0.62), fontSize: '18px' });
      tl.fromTo([hdA, hdAs], { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out', stagger: 0.05 }, T_A + 0.1);
      tl.fromTo([hdV, hdVs], { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out', stagger: 0.05 }, T_V + 0.1);
      tl.fromTo(lob, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, 0.05);

      // ---- panels ----
      const polyA = `polygon(${SK}px 0, ${PW}px 0, ${PW - SK}px ${PH}px, 0 ${PH}px)`;   // leans right (/)
      const polyV = `polygon(0 0, ${PW - SK}px 0, ${PW}px ${PH}px, ${SK}px ${PH}px)`;   // leans left (\\)
      function bust(parent, hair, col, rim, rimDx, k = 1) {
        const sv = ctx.svg('svg', { viewBox: '-160 -300 320 440', width: 352, height: 484, style: `position:absolute;left:50%;bottom:0;margin-left:${-176 + (rimDx > 0 ? 10 : -10)}px;overflow:visible` }, parent);
        const gid = `${ID}-bg-${Math.round(rimDx)}-${hair}-${col.slice(1)}`;
        const gd = ctx.svg('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, ctx.svg('defs', {}, sv));
        ctx.svg('stop', { offset: 0, 'stop-color': col, 'stop-opacity': 1 }, gd);
        ctx.svg('stop', { offset: 1, 'stop-color': C.bg, 'stop-opacity': 1 }, gd);
        const rimG = ctx.svg('g', { transform: `translate(${rimDx} -4)`, fill: rim }, sv);
        [BODY, HEAD(1), HAIR[hair]].forEach((d) => ctx.svg('path', { d }, rimG));
        const fillG = ctx.svg('g', { fill: `url(#${gid})` }, sv);
        [BODY, HEAD(1)].forEach((d) => ctx.svg('path', { d }, fillG));
        ctx.svg('path', { d: HAIR[hair], fill: C.bg, 'fill-opacity': 0.75 }, sv);
        return { sv, rimG };
      }
      const LOCK = (col) => `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="${col}"/><path d="M8 10.5V8A4 4 0 0 1 16 8V10.5" stroke="${col}" stroke-width="2.4" fill="none"/></svg>`;

      const panA = ATLAS.map((p, i) => {
        const el = ctx.el('div', 'c06-panel', all);
        el.style.left = AX[i] + 'px';
        const clip = ctx.el('div', 'c06-abs', el);
        Object.assign(clip.style, { inset: '0', clipPath: polyA, background: `linear-gradient(180deg, #17130e 0%, #120f0b 55%, ${rgba(C.amberDeep, 0.55)} 100%)` });
        const mono = ctx.el('div', 'c06-abs', clip, p.ini);
        Object.assign(mono.style, { left: '0', right: '0', top: '18px', textAlign: 'center', font: '800 172px/1 var(--display)', letterSpacing: '-0.07em', color: 'transparent', WebkitTextStroke: `2px ${rgba(C.amber, 0.38)}`, paddingLeft: SK * 0.6 + 'px' });
        const bs = bust(clip, p.hair, C.amberDeep, C.amber, 6);
        const scr = ctx.el('div', 'c06-abs', clip);
        Object.assign(scr.style, { left: '0', right: '0', bottom: '0', height: '300px', background: 'linear-gradient(0deg, rgba(11,12,14,.94) 0%, rgba(11,12,14,.82) 42%, rgba(11,12,14,0) 100%)' });
        const flash = ctx.el('div', 'c06-abs', clip);
        Object.assign(flash.style, { inset: '0', background: C.amberLight, opacity: 0 });
        const num = ctx.el('div', 'c06-abs c06-mono', el, `0${i + 1}`);
        Object.assign(num.style, { left: (SK + 22) + 'px', top: '24px', color: C.amber, fontSize: '18px' });
        const name = ctx.el('div', 'c06-abs', el, p.name);
        Object.assign(name.style, { left: '30px', bottom: '96px', font: '720 54px/1 var(--display)', letterSpacing: '-0.045em', color: C.ink, whiteSpace: 'nowrap' });
        const slot = ctx.el('div', 'c06-chip c06-mono', el, 'ROLE');
        Object.assign(slot.style, { left: '22px', bottom: '28px', width: '206px', border: `2px dashed ${rgba(C.amber, 0.45)}`, color: rgba(C.amber, 0.55), fontSize: '16px' });
        const edge = ctx.svg('svg', { viewBox: `0 0 ${PW} ${PH}`, width: PW, height: PH, style: 'position:absolute;left:0;top:0;overflow:visible' }, el);
        const edgeP = ctx.svg('polygon', { points: `${SK},0 ${PW},0 ${PW - SK},${PH} 0,${PH}`, fill: 'none', stroke: C.amber, 'stroke-width': 2.5, 'stroke-opacity': 0.55 }, edge);
        return { el, clip, mono, bs, flash, num, name, slot, edgeP };
      });
      const panV = VEGA.map((p, i) => {
        const el = ctx.el('div', 'c06-panel', all);
        el.style.left = VX[i] + 'px';
        const clip = ctx.el('div', 'c06-abs', el);
        Object.assign(clip.style, { inset: '0', clipPath: polyV, background: `linear-gradient(180deg, #140f0e 0%, #100c0b 55%, ${rgba(C.rivalDeep, 0.42)} 100%)` });
        // classified hatch where a monogram would be
        const hs = ctx.svg('svg', { viewBox: `0 0 ${PW} ${PH}`, width: PW, height: PH, style: 'position:absolute;left:0;top:0' }, clip);
        for (let k = -12; k < 20; k++) ctx.svg('line', { x1: k * 22, y1: 0, x2: k * 22 + 160, y2: 250, stroke: rgba(C.rival, 0.12), 'stroke-width': 2 }, hs);
        const bs = bust(clip, p.hair, '#2a1714', C.rival, -6);
        const scr = ctx.el('div', 'c06-abs', clip);
        Object.assign(scr.style, { left: '0', right: '0', bottom: '0', height: '300px', background: 'linear-gradient(0deg, rgba(11,12,14,.94) 0%, rgba(11,12,14,.82) 42%, rgba(11,12,14,0) 100%)' });
        const flash = ctx.el('div', 'c06-abs', clip);
        Object.assign(flash.style, { inset: '0', background: C.rivalLight, opacity: 0 });
        const num = ctx.el('div', 'c06-abs c06-mono', el, `0${i + 1}`);
        Object.assign(num.style, { right: (SK + 22) + 'px', top: '24px', color: C.rival, fontSize: '18px' });
        const name = ctx.el('div', 'c06-abs', el, '<i class="sh"></i>');
        Object.assign(name.style, { right: '34px', bottom: '104px', width: [150, 124, 168][i] + 'px', height: '38px', borderRadius: '8px', background: rgba(C.rival, 0.26), overflow: 'hidden' });
        const sh = name.querySelector('.sh');
        Object.assign(sh.style, { position: 'absolute', top: '0', bottom: '0', width: '60px', background: `linear-gradient(90deg, ${rgba(C.rivalLight, 0)}, ${rgba(C.rivalLight, 0.35)}, ${rgba(C.rivalLight, 0)})` });
        name.sh = sh;
        const slot = ctx.el('div', 'c06-chip c06-mono', el, `${LOCK(C.rival)}<span class="t">HIDDEN</span>`);
        Object.assign(slot.style, { right: '22px', bottom: '28px', width: '206px', border: `2px solid ${rgba(C.rival, 0.45)}`, color: C.rival, fontSize: '16px', background: rgba(C.rival, 0.08) });
        const edge = ctx.svg('svg', { viewBox: `0 0 ${PW} ${PH}`, width: PW, height: PH, style: 'position:absolute;left:0;top:0;overflow:visible' }, el);
        const edgeP = ctx.svg('polygon', { points: `0,0 ${PW - SK},0 ${PW},${PH} ${SK},${PH}`, fill: 'none', stroke: C.rival, 'stroke-width': 2.5, 'stroke-opacity': 0.55 }, edge);
        return { el, clip, bs, flash, num, name, slot, edgeP };
      });

      // slams: the panel nearest the seam leads; content rides 2 frames behind (parallax)
      [[panA, -1, T_A], [panV, 1, T_V]].forEach(([set, sd, t0]) => {
        const order = sd < 0 ? [2, 1, 0] : [0, 1, 2];
        order.forEach((pi, k) => {
          const p = set[pi];
          const at = t0 + k * 0.035;
          tl.fromTo(p.el, { x: sd * 1100 }, { x: 0, duration: SLAM, ease: 'expo.out' }, at);
          tl.fromTo(p.bs.sv, { x: sd * 120 }, { x: 0, duration: SLAM + 0.25, ease: 'expo.out' }, at + 0.04);
          p.slamAt = at;
          tl.fromTo(p.name, { opacity: 0, x: sd * 40 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, at + 0.12);
        });
      });
      // Vega names + roles scramble (hidden): never resolve to letters
      // VS plate + seam
      const mid = ctx.svg('svg', { class: 'brand-svg' }, all);
      const seamL = ctx.svg('line', { x1: 960, y1: PY - 10, x2: 960, y2: PY + PH + 10, stroke: C.ink, 'stroke-width': 2, 'stroke-opacity': 0.35 }, mid);
      const fg = ctx.svg('linearGradient', { id: `${ID}-flash`, x1: 0, y1: 0, x2: 1, y2: 0 }, ctx.svg('defs', {}, mid));
      [[0, 0], [0.42, 0.35], [0.5, 1], [0.58, 0.35], [1, 0]].forEach(([o, a]) => ctx.svg('stop', { offset: o, 'stop-color': C.ink, 'stop-opacity': a }, fg));
      const flashBar = ctx.svg('rect', { x: 960 - 60, y: 0, width: 120, height: H, fill: `url(#${ID}-flash)`, opacity: 0 }, mid);
      const vsO = ctx.svg('g', { transform: 'translate(960 572)' }, mid);
      const vsG = ctx.svg('g', {}, vsO);
      ctx.svg('rect', { x: -48, y: -48, width: 96, height: 96, rx: 6, transform: 'rotate(45)', fill: C.bg, stroke: C.ink, 'stroke-width': 2.5 }, vsG);
      ctx.svg('text', { x: 0, y: 14, 'text-anchor': 'middle', fill: C.ink, style: 'font:800 40px "Manrope Variable";letter-spacing:-0.02em', text: 'VS' }, vsG);
      tl.fromTo(seamL, { attr: { 'stroke-opacity': 0 } }, { attr: { 'stroke-opacity': 0.35 }, duration: 0.2, ease: 'none' }, 0.0);
      tl.fromTo(vsG, { scale: 0, rotation: -90, svgOrigin: '0 0' }, { scale: 1, rotation: 0, svgOrigin: '0 0', duration: 0.45, ease: 'back.out(2.2)' }, T_HIT);

      // ---- roles ----
      const tray = ctx.el('div', 'c06-abs', all);
      Object.assign(tray.style, { left: '960px', top: '946px', width: '1000px', height: '78px', marginLeft: '-500px', borderRadius: '18px', background: rgba(C.bone, 0.06), border: `1.5px solid ${rgba(C.bone, 0.16)}`, boxSizing: 'border-box' });
      const trayL = ctx.el('div', 'c06-abs c06-mono', tray, 'ASSIGN ROLES');
      Object.assign(trayL.style, { left: '24px', top: '30px', color: rgba(C.bone, 0.7), fontSize: '17px' });
      tl.fromTo(tray, { y: 140, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'expo.out' }, 1.46);
      tl.to(tray, { y: 140, opacity: 0, duration: 0.3, ease: 'power2.in' }, 2.28);
      const ROLE_ICO = [
        `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="8" fill="none" stroke="${C.bg}" stroke-width="2.4"/><circle cx="12" cy="12" r="3" fill="${C.bg}"/></svg>`,
        `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M13 3L6 13.5H11.5L10.5 21L18 10.5H12.5Z" fill="${C.bg}"/></svg>`,
        `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 15H21M5 15V19M19 15V19M5 15C8 9 16 9 19 15" fill="none" stroke="${C.bg}" stroke-width="2.4" stroke-linecap="round"/></svg>`,
      ];
      const TRAY_X = [800, 1050, 1300];   // chip centres in the tray (screen)
      const chips = ATLAS.map((p, i) => {
        const c = ctx.el('div', 'c06-chip', all, `${ROLE_ICO[i]}<span>${p.role}</span>`);
        Object.assign(c.style, { left: '0', top: '0', width: '226px', background: C.amber, color: C.bg, boxShadow: '0 14px 30px -14px rgba(0,0,0,.8)' });
        return c;
      });
      // slot centre (screen) for Atlas panel i
      const slotC = (i) => [AX[i] + 22 + 103, PY + PH - 28 - 24];
      const chipFrom = (i) => [TRAY_X[i] + 40, 946 + 39];

      // locking bar: fills from the last role lock into the stamp (3.0)
      const lockBar = ctx.el('div', 'c06-abs', all);
      Object.assign(lockBar.style, { left: '560px', top: '962px', width: '800px', height: '40px' });
      const lbL = ctx.el('div', 'c06-abs c06-mono', lockBar, 'LOCKING PLAN');
      Object.assign(lbL.style, { left: '0', top: '0', color: rgba(C.bone, 0.7), fontSize: '17px' });
      const lbR = ctx.el('div', 'c06-abs c06-mono', lockBar, '3/3 ROLES');
      Object.assign(lbR.style, { right: '0', top: '0', color: C.amber, fontSize: '17px' });
      const lbT = ctx.el('div', 'c06-abs', lockBar);
      Object.assign(lbT.style, { left: '0', right: '0', top: '30px', height: '4px', borderRadius: '2px', background: rgba(C.bone, 0.14) });
      const lbF = ctx.el('div', 'c06-abs', lbT);
      Object.assign(lbF.style, { left: '0', top: '0', bottom: '0', width: '100%', borderRadius: '2px', background: C.amber, transformOrigin: '0 50%' });
      tl.fromTo(lockBar, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'expo.out' }, 2.4);
      tl.fromTo(lbF, { scaleX: 0 }, { scaleX: 1, duration: 0.56, ease: 'power2.in' }, 2.44);
      // ---- stamp: PLAN LOCKED, drawn once into a canvas, ink-eroded ----
      const SW = 1180, SH = 300;
      const stampC = ctx.el('canvas', 'c06-abs', all);
      stampC.width = SW; stampC.height = SH;
      Object.assign(stampC.style, { left: (960 - SW / 2) + 'px', top: (566 - SH / 2) + 'px', width: SW + 'px', height: SH + 'px' });
      {
        const g = stampC.getContext('2d');
        g.strokeStyle = C.amber; g.fillStyle = C.amber;
        const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
        g.lineWidth = 12; rr(14, 14, SW - 28, SH - 28, 22); g.stroke();
        g.lineWidth = 3.5; rr(36, 36, SW - 72, SH - 72, 12); g.stroke();
        // lock glyph
        const lx = 118, ly = SH / 2;
        g.fillRect(lx - 40, ly - 8, 80, 64);
        g.lineWidth = 14; g.beginPath(); g.moveTo(lx - 24, ly - 8); g.lineTo(lx - 24, ly - 30); g.arc(lx, ly - 30, 24, Math.PI, 0); g.lineTo(lx + 24, ly - 8); g.stroke();
        g.font = '800 132px "Manrope Variable"'; g.textBaseline = 'middle'; g.textAlign = 'left';
        g.save(); g.translate(196, SH / 2 + 6); g.scale(1, 1);
        g.fillText('PLAN LOCKED', 0, 0); g.restore();
        // erosion: seeded speckles + streaks knocked out
        const r = ctx.rng('c06-stamp');
        g.globalCompositeOperation = 'destination-out';
        const nzE = ctx.noise2D('c06-erode');
        for (let y = 0; y < SH; y += 2) for (let x = 0; x < SW; x += 2) {
          const v = nzE(x * 0.011, y * 0.03) * 0.6 + nzE(x * 0.06, y * 0.09) * 0.4;
          if (v > 0.38) { g.globalAlpha = clamp((v - 0.38) * 5, 0, 1); g.fillRect(x, y, 2, 2); }
        }
        g.globalAlpha = 1;
        for (let k = 0; k < 9000; k++) { const x = r() * SW, y = r() * SH, s = 0.4 + Math.pow(r(), 4) * 1.6; g.globalAlpha = 0.4 + r() * 0.6; g.fillRect(x, y, s * 2, s * 2); }
        g.globalAlpha = 0.35;
        for (let k = 0; k < 26; k++) { const y = r() * SH, x = r() * SW; g.fillRect(x, y, 80 + r() * 260, 1.5 + r() * 2); }
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      }
      const dim = ctx.el('div', 'c06-abs', all);
      Object.assign(dim.style, { inset: '0', background: C.bg, opacity: 0 });
      all.insertBefore(dim, stampC);
      tl.fromTo(dim, { opacity: 0 }, { opacity: 0.4, duration: 0.14, ease: 'power2.out' }, T_STAMP - 0.06);
      tl.fromTo(stampC, { scale: 2.3, rotation: -14, opacity: 0 }, { scale: 1, rotation: -6, opacity: 1, duration: 0.12, ease: 'power3.in' }, T_STAMP - 0.12);
      tl.to(stampC, { scale: 1.03, duration: 0.06, ease: 'power2.out' }, T_STAMP);
      tl.to(stampC, { scale: 1.0, duration: 0.3, ease: 'power2.out' }, T_STAMP + 0.06);
      // dust ring on impact
      const dust = ctx.svg('svg', { class: 'brand-svg' }, all);
      const dr = ctx.rng('c06-dust');
      const motes = Array.from({ length: 46 }, () => {
        const a = dr() * Math.PI * 2;
        const el = ctx.svg('circle', { r: 1.5 + dr() * 3, fill: C.amber, opacity: 0 }, dust);
        return { el, a, v: 160 + dr() * 380, ex: 560 + dr() * 80, ey: 150 + dr() * 40 };
      });

      // the opening seam (first frames): a vertical line of light at frame centre that bursts the frame open
      const open = ctx.svg('svg', { class: 'brand-svg' }, root);
      const openE = [0, 1].map(() => ctx.svg('rect', { x: 958, y: 0, width: 4, height: H, fill: C.ink, opacity: 0 }, open));
      // the line of light (final frames)
      const line = ctx.svg('svg', { class: 'brand-svg' }, root);
      const lineGlow = ctx.svg('rect', { x: 0, y: 540 - 14, width: W, height: 28, fill: C.amber, opacity: 0 }, line);
      const lineCore = ctx.svg('rect', { x: 0, y: 540 - 1.5, width: W, height: 3, fill: C.ink, opacity: 0 }, line);

      // ---------------------------------------------------------------------------------------
      // per frame
      // ---------------------------------------------------------------------------------------
      const nzS = ctx.noise2D('c06-shake');
      const IMPACTS = [[T_A + SLAM, 7], [T_HIT, 16], [T_STAMP, 22]];
      ctx.onFrame((t) => {
        // shake
        let sx = 0, sy = 0;
        for (const [ti, a] of IMPACTS) { const d = t - ti; if (d < 0 || d > 0.5) continue; const k = a * Math.exp(-d * 11); sx += nzS(d * 38, 1.3) * k; sy += nzS(d * 38, 7.1) * k; }
        // collapse
        const cu = seg(t, T_COL, 0.185);
        const ce = Math.pow(cu, 2.2);
        const sY = lerp(1, 0.004, ce), sX = lerp(1, 1.04, ce);
        const push = 1 + 0.035 * io3(seg(t, 3.1, 0.65));
        all.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${(push * sX).toFixed(4)}, ${(push * sY).toFixed(4)})`;
        all.style.filter = cu > 0 ? `brightness(${(1 + 2.5 * ce).toFixed(3)})` : 'none';
        const ou = expoOut(seg(t, 0, 0.34)), half = 960 * ou;
        all.style.clipPath = ou < 1 ? `inset(0px ${(960 - half).toFixed(1)}px 0px ${(960 - half).toFixed(1)}px)` : 'none';
        const oa = clamp(1 - t / 0.24, 0, 1);
        openE.forEach((e, k) => { e.setAttribute('x', (k ? 960 + half - 2 : 960 - half - 2).toFixed(1)); e.setAttribute('opacity', (oa * oa).toFixed(3)); });
        const la = cu > 0 ? clamp((1 - sY) * 1.5, 0, 1) : 0;
        lineCore.setAttribute('opacity', la.toFixed(3));
        lineGlow.setAttribute('opacity', (0.35 * la).toFixed(3));
        const lw = lerp(0.5, 1, expoOut(cu));
        lineCore.setAttribute('x', (960 - 960 * lw).toFixed(1)); lineCore.setAttribute('width', (W * lw).toFixed(1));
        lineGlow.setAttribute('x', (960 - 960 * lw).toFixed(1)); lineGlow.setAttribute('width', (W * lw).toFixed(1));

        // Vega hidden names: redacted bars with a slow shimmer
        panV.forEach((p, i) => { const u = ((t * 0.8 + i * 0.33) % 1.4) / 1.4; p.name.sh.style.left = (-70 + 260 * u).toFixed(1) + 'px'; });
        // role chips: tray -> arc -> slot, spring lock
        chips.forEach((c, i) => {
          const tIn = 1.5 + i * 0.05;
          const f0 = ROLE_LAND[i] - ROLE_FLY;
          if (t < tIn) { c.style.opacity = 0; return; }
          c.style.opacity = 1;
          let x, y, sc = 1, rot = 0;
          const [ax, ay] = chipFrom(i), [bx, by] = slotC(i);
          if (t < f0) {
            const u = SP(seg(t, tIn, 0.4));
            x = ax; y = lerp(ay + 120, ay, u);
          } else {
            const u = seg(t, f0, ROLE_FLY), e = io3(u);
            x = lerp(ax, bx, e); y = lerp(ay, by, e) - Math.sin(Math.PI * e) * 260;
            sc = 1 + 0.16 * Math.sin(Math.PI * e);
            rot = -8 * Math.sin(Math.PI * e);
            if (u >= 1) { const lk = SP(seg(t, ROLE_LAND[i], 0.35)); sc = lerp(1.12, 1, lk) - 0.0; rot = 0; x = bx; y = by; }
          }
          c.style.transform = `translate(${(x - 113).toFixed(2)}px, ${(y - 24).toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
        });
        // panel reactions on role lock
        panA.forEach((p, i) => {
          const d = t - ROLE_LAND[i];
          const f = d >= 0 && d < 0.35 ? (1 - d / 0.35) : 0;
          const ds = t - p.slamAt - SLAM * 0.5, fs = ds >= 0 && ds < 0.3 ? 0.32 * (1 - ds / 0.3) ** 2 : 0;
          p.flash.style.opacity = Math.max(0.4 * f * f, fs).toFixed(3);
          p.edgeP.setAttribute('stroke-opacity', (t >= ROLE_LAND[i] ? 0.95 : 0.55).toFixed(2));
          p.edgeP.setAttribute('stroke-width', t >= ROLE_LAND[i] ? 3.5 : 2.5);
          p.slot.style.opacity = t >= ROLE_LAND[i] ? 0 : 1;
          p.mono.style.webkitTextStroke = `2px ${rgba(C.amber, t >= ROLE_LAND[i] ? 0.6 : 0.38)}`;
        });
        panV.forEach((p) => { const ds = t - p.slamAt - SLAM * 0.5; p.flash.style.opacity = (ds >= 0 && ds < 0.3 ? 0.32 * (1 - ds / 0.3) ** 2 : 0).toFixed(3); });
        { const d = t - T_HIT, u = d / 0.22; if (d >= 0 && u < 1) { const w = lerp(160, 900, o3(u)); flashBar.setAttribute('x', (960 - w / 2).toFixed(1)); flashBar.setAttribute('width', w.toFixed(1)); flashBar.setAttribute('opacity', (0.75 * (1 - u) * (1 - u)).toFixed(3)); } else flashBar.setAttribute('opacity', 0); }
        // stamp dust
        motes.forEach((m) => {
          const d = t - T_STAMP;
          if (d < 0 || d > 0.6) { m.el.setAttribute('opacity', 0); return; }
          const u = d / 0.6, r = o3(u);
          const x = 960 + Math.cos(m.a) * (m.ex + m.v * 0.25 * r) * (0.55 + 0.45 * r);
          const y = 566 + Math.sin(m.a) * (m.ey + m.v * 0.18 * r) * (0.55 + 0.45 * r);
          m.el.setAttribute('cx', x.toFixed(1)); m.el.setAttribute('cy', y.toFixed(1));
          m.el.setAttribute('opacity', (0.9 * (1 - u)).toFixed(3));
        });
      });
    },
  });
})();
