/* ENGINE DEMO SCENE (not part of the film). Exercises every engine feature:
 *  - SplitText masked line reveal ("One world." / "Opposing plans." in amber)
 *  - DrawSVG route (dashed, revealed through a drawn mask) + arrowhead riding the tip and a
 *    runner dot via MotionPath, leaving a solid trail
 *  - ScrambleText mono labels (made deterministic by core.js)
 *  - canvas contour field from 3D simplex noise, drawn in ctx.onFrame, slowly evolving
 *  - a graded b-roll image sequence (ctx.sequence)
 *  - an onFrame text readout (time code) and a tweened proxy read inside onFrame
 * Sequence frames: engine/extract-frames.sh "../../public/assets/scene/dynamic arena.mp4" \
 *   .work/engine-test/seq-arena --from 1.5 --to 3.5 --grade amber   (60 frames)
 */
Film.scene({
  id: '_demo',
  duration: 8,
  build(ctx) {
    const { root, tl } = ctx;
    const W = ctx.width, H = ctx.height;

    ctx.css(`
      [data-scene="_demo"] { background: var(--bg); }
      [data-scene="_demo"] .vignette { position:absolute; inset:0; pointer-events:none;
        background: radial-gradient(120% 90% at 38% 55%, transparent 40%, rgba(5,5,6,.78) 100%); }
      [data-scene="_demo"] .board text { font-family: var(--mono); font-size: 13px; letter-spacing: .12em; fill: var(--muted-3); }
      [data-scene="_demo"] .tag { position:absolute; font: 500 14px/1 var(--mono); letter-spacing: .13em; text-transform: uppercase; color: var(--muted-3); }
      [data-scene="_demo"] .eyebrow { position:absolute; left:132px; top:548px; display:flex; align-items:center; gap:16px;
        font: 500 21px/1 var(--mono); letter-spacing: .13em; text-transform: uppercase; color: var(--amber); white-space: pre; }
      [data-scene="_demo"] .eyebrow .dia { width:12px; height:12px; background: var(--amber); transform: rotate(45deg); }
      [data-scene="_demo"] .head { position:absolute; left:124px; top:590px; width: 1100px;
        font-family: var(--display); font-weight: 600; font-size: 128px; line-height: 1.0; letter-spacing: -0.055em; color: var(--ink); }
      [data-scene="_demo"] .head .amber { color: var(--amber); }
      /* masks clip at the line box: pad them so descenders (p, g) are not cut */
      [data-scene="_demo"] .hl-mask { padding: 0 .06em .16em; margin: 0 -.06em -.16em; }
      [data-scene="_demo"] .panel { position:absolute; left:1196px; top:150px; width:584px; height:328px;
        background: var(--map); outline: 1px solid rgba(239,189,112,.42); overflow:hidden; }
      [data-scene="_demo"] .panel .bar { position:absolute; top:0; bottom:0; width:6px; left:0; background: var(--amber); }
      [data-scene="_demo"] .caption { position:absolute; left:1196px; top:494px; font: 500 14px/1 var(--mono);
        letter-spacing: .13em; text-transform: uppercase; color: var(--muted); white-space: pre; }
      [data-scene="_demo"] .objlabel { position:absolute; left:1626px; top:700px; font: 600 15px/1 var(--mono);
        letter-spacing: .12em; text-transform: uppercase; color: var(--amber-light); white-space: pre; }
      [data-scene="_demo"] .ghostlabel { position:absolute; left:1700px; top:902px; font: 500 12px/1 var(--mono);
        letter-spacing: .12em; text-transform: uppercase; color: var(--rival); white-space: pre; }
    `);

    // ---------------------------------------------------------------- contour field (canvas)
    const { canvas: fieldCv, g } = ctx.canvas({ className: 'field' });
    const noise = ctx.noise3D('realms-terrain');
    const field = { reveal: 0, glow: 0 };            // proxies tweened on tl, read in onFrame
    const CELL = 15, NX = Math.ceil(W / CELL) + 1, NY = Math.ceil(H / CELL) + 1;
    const vals = new Float32Array(NX * NY);
    const LEVELS = [];
    for (let v = -0.84; v <= 0.84 + 1e-9; v += 0.07) LEVELS.push(+v.toFixed(3));
    const OBJ = { x: 1590, y: 760 };

    function contour(level) {
      // marching squares with linear interpolation, appended to the current path
      for (let j = 0; j < NY - 1; j++) {
        for (let i = 0; i < NX - 1; i++) {
          const a = vals[j * NX + i], b = vals[j * NX + i + 1], c = vals[(j + 1) * NX + i + 1], d = vals[(j + 1) * NX + i];
          const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          const x = i * CELL, y = j * CELL;
          const top = () => [x + CELL * (level - a) / (b - a), y];
          const right = () => [x + CELL, y + CELL * (level - b) / (c - b)];
          const bottom = () => [x + CELL * (level - d) / (c - d), y + CELL];
          const left = () => [x, y + CELL * (level - a) / (d - a)];
          let s1, s2, s3, s4;
          switch (idx) {
            case 1: case 14: s1 = left(); s2 = bottom(); break;
            case 2: case 13: s1 = bottom(); s2 = right(); break;
            case 3: case 12: s1 = left(); s2 = right(); break;
            case 4: case 11: s1 = top(); s2 = right(); break;
            case 5: s1 = left(); s2 = top(); s3 = bottom(); s4 = right(); break;
            case 6: case 9: s1 = top(); s2 = bottom(); break;
            case 7: case 8: s1 = left(); s2 = top(); break;
            case 10: s1 = top(); s2 = right(); s3 = left(); s4 = bottom(); break;
          }
          g.moveTo(s1[0], s1[1]); g.lineTo(s2[0], s2[1]);
          if (s3) { g.moveTo(s3[0], s3[1]); g.lineTo(s4[0], s4[1]); }
        }
      }
    }

    ctx.onFrame((t) => {
      const z = 0.045 * t;                     // slow evolution of the terrain
      const dx = 0.012 * t;                    // and a gentle drift
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const x = i * CELL * 0.00135 + dx, y = j * CELL * 0.00135;
          vals[j * NX + i] = 0.72 * noise(x, y, z) + 0.28 * noise(x * 2.3 + 11.7, y * 2.3 - 3.1, z * 1.6);
        }
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, W, H);
      g.lineJoin = 'round'; g.lineCap = 'round';
      // a warm hot-spot around the objective, brighter as `glow` rises
      const grad = g.createRadialGradient(OBJ.x, OBJ.y, 0, OBJ.x, OBJ.y, 900);
      grad.addColorStop(0, `rgba(246,211,159,${0.30 + 0.25 * field.glow})`);
      grad.addColorStop(0.45, 'rgba(239,189,112,0.20)');
      grad.addColorStop(1, 'rgba(239,189,112,0.12)');
      LEVELS.forEach((lv, k) => {
        const index = k % 4 === 0;
        g.beginPath();
        contour(lv);
        g.strokeStyle = grad;
        g.globalAlpha = index ? 1 : 0.55;
        g.lineWidth = index ? 1.6 : 1.1;
        g.stroke();
      });
      g.globalAlpha = 1;
      if (field.reveal < 1) {
        // radial wipe-in from the left third
        const r = field.reveal * 2300;
        const m = g.createRadialGradient(560, 620, Math.max(0, r - 520), 560, 620, r + 1);
        m.addColorStop(0, 'rgba(0,0,0,1)');
        m.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalCompositeOperation = 'destination-in';
        g.fillStyle = m;
        g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'source-over';
      }
    });
    tl.to(field, { reveal: 1, duration: 2.0, ease: 'power2.inOut' }, 0);
    tl.fromTo(fieldCv, { scale: 1.06, transformOrigin: '40% 60%' }, { scale: 1.0, duration: 8, ease: 'none' }, 0);
    ctx.el('div', 'vignette');

    // ---------------------------------------------------------------- board grid + register marks
    const board = ctx.svg('svg', { class: 'board' });
    const cols = 'ABCDEFGHIJKL'.split('');
    const gx0 = 160, gx1 = 1760, gy0 = 140, gy1 = 940;
    const gridLines = [];
    for (let i = 0; i <= 12; i++) {
      const x = gx0 + (gx1 - gx0) * i / 12;
      gridLines.push(ctx.svg('line', { x1: x, y1: gy0, x2: x, y2: gy1, stroke: '#efbd70', 'stroke-opacity': 0.07, 'stroke-width': 1 }, board));
    }
    for (let j = 0; j <= 8; j++) {
      const y = gy0 + (gy1 - gy0) * j / 8;
      gridLines.push(ctx.svg('line', { x1: gx0, y1: y, x2: gx1, y2: y, stroke: '#efbd70', 'stroke-opacity': 0.07, 'stroke-width': 1 }, board));
    }
    const labels = [];
    cols.forEach((c, i) => labels.push(ctx.svg('text', { x: gx0 + (gx1 - gx0) * (i + 0.5) / 12, y: gy0 - 16, 'text-anchor': 'middle', text: c }, board)));
    for (let j = 0; j < 8; j++) labels.push(ctx.svg('text', { x: gx0 - 18, y: gy0 + (gy1 - gy0) * (j + 0.5) / 8 + 4, 'text-anchor': 'end', text: String(j + 1).padStart(2, '0') }, board));
    const corners = [[64, 64, 1, 1], [1856, 64, -1, 1], [64, 1016, 1, -1], [1856, 1016, -1, -1]].map(([x, y, sx, sy]) =>
      ctx.svg('path', { d: `M${x} ${y + 34 * sy} L${x} ${y} L${x + 34 * sx} ${y}`, stroke: '#efbd70', 'stroke-width': 2, fill: 'none', 'stroke-opacity': 0.8 }, board));
    tl.from(corners, { drawSVG: '0%', duration: 0.7, ease: 'power3.out', stagger: 0.07 }, 0.1);
    tl.from(gridLines, { drawSVG: '50% 50%', duration: 1.2, ease: 'power3.inOut', stagger: { each: 0.025, from: 'center' } }, 0.2);
    tl.from(labels, { opacity: 0, duration: 0.4, ease: 'none', stagger: 0.025 }, 0.5);

    const tag = ctx.el('div', 'tag', root, 'Engine test · _demo');
    Object.assign(tag.style, { left: '112px', top: '992px' });
    const clock = ctx.el('div', 'tag', root, '');
    Object.assign(clock.style, { right: '112px', top: '992px', color: 'var(--amber)' });
    ctx.onFrame((t) => {
      const f = Math.round(t * ctx.fps);
      const s = Math.floor(t), cs = Math.floor((t - s) * 100 + 1e-6);
      clock.textContent = `T+0:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')} · F ${String(f).padStart(3, '0')}`;
    });

    // ---------------------------------------------------------------- headline (SplitText masks)
    const eyebrow = ctx.el('div', 'eyebrow', root, '<span class="dia"></span><span class="txt"></span>');
    const head = ctx.el('div', 'head', root, '<div class="l1">One world.</div><div class="l2 amber">Opposing plans.</div>');
    const split = SplitText.create(head.querySelectorAll('.l1, .l2'), { type: 'lines', linesClass: 'hl', mask: 'lines' });
    tl.from(eyebrow.querySelector('.dia'), { scale: 0, rotation: -135, duration: 0.6, ease: 'back.out(2)' }, 0.55);
    tl.to(eyebrow.querySelector('.txt'), {
      duration: 1.3, ease: 'none',
      scrambleText: { text: 'Competitive / Team against team'.toUpperCase(), chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/', revealDelay: 0.35, speed: 0.7 },
    }, 0.6);
    tl.from(split.lines, { yPercent: 118, duration: 1.15, ease: 'expo.out', stagger: 0.34 }, 0.95);
    // exit: lines rise out of their masks
    tl.to(split.lines, { yPercent: -118, duration: 0.7, ease: 'power3.in', stagger: 0.08 }, 6.9);
    tl.to(eyebrow, { opacity: 0, duration: 0.4, ease: 'none' }, 6.9);

    // ---------------------------------------------------------------- route (DrawSVG + MotionPath)
    const map = ctx.svg('svg', {});
    const ROUTE = 'M1000,960 C1120,955 1150,870 1265,855 C1370,842 1420,880 1480,820 C1515,786 1530,772 1560,768';
    const defs = ctx.svg('defs', {}, map);
    const mask = ctx.svg('mask', { id: 'demo-route-mask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
    const maskPath = ctx.svg('path', { d: ROUTE, fill: 'none', stroke: '#fff', 'stroke-width': 16, 'stroke-linecap': 'round' }, mask);
    ctx.svg('path', { d: ROUTE, fill: 'none', stroke: '#efbd70', 'stroke-width': 3, 'stroke-dasharray': '10 9', 'stroke-linecap': 'round', mask: 'url(#demo-route-mask)' }, map);
    const trail = ctx.svg('path', { d: ROUTE, fill: 'none', stroke: '#f6d39f', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, map);
    const routePath = ctx.svg('path', { d: ROUTE, fill: 'none', stroke: 'none' }, map); // motion guide
    const arrow = ctx.svg('path', { d: 'M-15,-10 L0,0 L-15,10', fill: 'none', stroke: '#efbd70', 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, map);
    const runner = ctx.svg('g', {}, map);
    ctx.svg('circle', { r: 17, fill: 'none', stroke: '#efbd70', 'stroke-opacity': 0.45, 'stroke-width': 1.5 }, runner);
    ctx.svg('circle', { r: 7, fill: '#f6d39f' }, runner);
    const way = [[1000, 960, '1'], [1265, 855, '2']].map(([x, y, n]) => {
      const gg = ctx.svg('g', { transform: `translate(${x},${y})` }, map);
      ctx.svg('circle', { r: 17, fill: '#0b0c0e', stroke: '#efbd70', 'stroke-width': 2 }, gg);
      ctx.svg('text', { y: 5.5, 'text-anchor': 'middle', fill: '#efbd70', style: 'font: 700 15px var(--mono)', text: n }, gg);
      return gg;
    });

    const DRAW_AT = 2.2, DRAW_DUR = 1.5;
    gsap.set(arrow, { transformOrigin: '100% 50%' });
    tl.fromTo(maskPath, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: DRAW_DUR, ease: 'power2.inOut' }, DRAW_AT);
    tl.fromTo(arrow, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'none' }, DRAW_AT);
    tl.to(arrow, { duration: DRAW_DUR, ease: 'power2.inOut', motionPath: { path: routePath, autoRotate: true } }, DRAW_AT);
    tl.from(way.map((w) => w.querySelector('circle')), { attr: { r: 0 }, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.55 }, DRAW_AT - 0.1);
    tl.from(way.map((w) => w.querySelector('text')), { opacity: 0, duration: 0.3, stagger: 0.55 }, DRAW_AT + 0.1);

    const RUN_AT = 4.0, RUN_DUR = 2.6;
    tl.fromTo(runner, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, RUN_AT - 0.15);
    tl.to(runner, { duration: RUN_DUR, ease: 'power1.inOut', motionPath: { path: routePath } }, RUN_AT);
    tl.fromTo(trail, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: RUN_DUR, ease: 'power1.inOut' }, RUN_AT);
    gsap.set(runner, { x: 1000, y: 960 });

    // ---------------------------------------------------------------- objective + rivals
    const obj = ctx.svg('g', { transform: `translate(${OBJ.x},${OBJ.y})` }, map);
    const ringOuter = ctx.svg('circle', { r: 46, fill: 'none', stroke: '#efbd70', 'stroke-width': 1.5, 'stroke-dasharray': '4 7', 'stroke-opacity': 0.8 }, obj);
    const ring = ctx.svg('circle', { r: 26, fill: 'rgba(239,189,112,.08)', stroke: '#efbd70', 'stroke-width': 2.2 }, obj);
    const core = ctx.svg('circle', { r: 6, fill: '#efbd70' }, obj);
    const pulses = [0, 1].map(() => ctx.svg('circle', { r: 26, fill: 'none', stroke: '#f6d39f', 'stroke-width': 1.5, opacity: 0 }, obj));
    tl.from([ring, core], { attr: { r: 0 }, duration: 0.6, ease: 'back.out(1.8)', stagger: 0.08 }, 3.45);
    tl.from(ringOuter, { attr: { r: 0 }, opacity: 0, duration: 0.8, ease: 'expo.out' }, 3.55);
    tl.fromTo(ringOuter, { rotation: 0, svgOrigin: '0 0' }, { rotation: 120, svgOrigin: '0 0', duration: 4.5, ease: 'none' }, 3.5);
    pulses.forEach((p, i) => {
      // finite repeats only: repeat: -1 would make the scene timeline infinite.
      // immediateRender: false, or the from-state (opacity .9) would show from local time 0.
      tl.fromTo(p, { attr: { r: 26 }, opacity: 0.9 }, { attr: { r: 96 }, opacity: 0, duration: 1.1, ease: 'power2.out', repeat: 2, repeatDelay: 0, immediateRender: false }, 3.9 + i * 0.6);
    });
    tl.to(field, { glow: 1, duration: 1.2, ease: 'power2.out' }, 3.6);
    const objLabel = ctx.el('div', 'objlabel', root, '');
    tl.to(objLabel, { duration: 0.9, ease: 'none', scrambleText: { text: 'OBJ · THE CROSSING', chars: '01', speed: 0.6 } }, 3.7);

    const rivals = ctx.svg('g', {}, map);
    const tri = (x, y, s, ghost) => ctx.svg('path', {
      d: `M${x},${y - s} L${x + s * 0.92},${y + s * 0.62} L${x - s * 0.92},${y + s * 0.62} Z`,
      fill: ghost ? 'none' : '#dd6248', stroke: '#dd6248', 'stroke-width': ghost ? 1.6 : 0, 'stroke-dasharray': ghost ? '4 4' : null,
    }, rivals);
    const cross = (x, y) => ctx.svg('path', { d: `M${x - 9},${y - 9} L${x + 9},${y + 9} M${x + 9},${y - 9} L${x - 9},${y + 9}`, stroke: '#c9c0b2', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, rivals);
    const marks = [tri(1712, 842, 15), tri(1772, 792, 15), cross(1668, 892), cross(1500, 700)];
    const ghost = tri(1712, 930, 13, true);
    const ghostLabel = ctx.el('div', 'ghostlabel', root, '');
    tl.from(marks, { scale: 0, transformOrigin: '50% 50%', duration: 0.45, ease: 'back.out(2.4)', stagger: 0.12 }, 5.3);
    tl.from(ghost, { opacity: 0, duration: 0.2, repeat: 3, yoyo: true, ease: 'steps(1)' }, 5.9);
    tl.to(ghostLabel, { duration: 0.6, ease: 'none', scrambleText: { text: 'LAST SEEN 0:20', chars: '0123456789:', speed: 0.5 } }, 6.0);

    // ---------------------------------------------------------------- b-roll panel (sequence)
    const panel = ctx.el('div', 'panel', root);
    const seq = ctx.sequence({ dir: '../.work/engine-test/seq-arena', count: 60, fps: 30, start: 3.0, loop: true, fit: 'cover', width: 584, height: 328, parent: panel, align: [0.5, 0.5] });
    const bar = ctx.el('div', 'bar', panel);
    const caption = ctx.el('div', 'caption', root, '');
    tl.fromTo(panel, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' }, 2.9);
    tl.fromTo(bar, { x: 0 }, { x: 578, duration: 0.9, ease: 'expo.inOut' }, 2.9);
    tl.to(bar, { opacity: 0, duration: 0.25, ease: 'none' }, 3.75);
    tl.fromTo(seq, { scale: 1.12 }, { scale: 1.0, duration: 5, ease: 'power2.out' }, 2.9);
    tl.to(caption, { duration: 0.8, ease: 'none', scrambleText: { text: 'FEED 02 · ARCHIVE · AMBER GRADE', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', speed: 0.6 } }, 3.4);
  },
});
