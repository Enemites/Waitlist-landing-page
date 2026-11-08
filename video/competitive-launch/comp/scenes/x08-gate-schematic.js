/* x08-gate-schematic (film 39.0-40.5): revision v3 insert, BLUEPRINT. Local 0 = 39.0.
 * Hides s08's objective lift (0 -> 62%). Spec: docs/revision-v3.md.
 *
 * Charcoal ground, a 24 px amber grid at 6% (120 px majors). The floodgate as a front elevation:
 * two abutments, four piers, five bays with lift gates, the hoist beam with five motors, the deck,
 * the sill and foundation (hatched), dimension chains (ticks only, no numbers) and centrelines.
 * The conduit runs from the pump station up to a bus over the motors.
 *
 * 0.00 (39.0) hard cut: grid kick, giant counter at 0%, the drawing plots on (power4.out, staggered,
 *      0.00-0.40): ground lines -> towers -> beam/deck -> gate leaves -> details and dimensions.
 * 0.04-0.125 power whips along the conduit to bay 1 (a bright head rides the front, dashes flow).
 * Fill: 12 steps, a speed ramp on the music grid: 8ths at 0.125/0.25/0.375/0.5 (the first four of
 *      s08's own ticks), then 16ths 0.5625 ... 1.0. The bays fill bottom-up one after another; 62% of
 *      the gate is 3.1 bays, so bays 1-3 fill and bay 4 just starts (10%) on the 62% step. Bays power
 *      up (motor + drop + leaf) at 0.125, 0.5, 0.75, 1.0. The counter never shows more than 62.
 * 0.00-1.00 camera: the sheet (drawing + grid, not the counter column) pushes 1.0 -> 1.03 round
 *      (700, 576), expo.out (the gate grows to the right, clear of the counter), and settles to 1.022 in
 *      2 f on the lock (a felt stop).
 * 1.00 (40.0, on the beat) 62% LOCKS: counter flash, a bright rule draws under it, the powered
 *      leaves flash once. Hold 40.0-40.2.
 * 1.20-1.3667 the snap, wipe FIRST: the drawing wipes away left -> right along the conduit (power2.in,
 *      bright front). 1.333-1.4667 THEN the counter collapses (power3.inOut, 4 f) over clean charcoal onto
 *      the exact place, size and colour of the '62%' in s08's lifted objective card (JetBrains Mono 600,
 *      38.4 px, amber, box at 1244.5, 797.6). 1.3667-1.4667 s08's card plots on as blueprint linework at its
 *      exact 40.5 geometry (outline 560,759.2 800x212.2 r18; bar track 606.4,921.8 707.2x12.8; the 62% fill),
 *      so the cut back to s08 at 40.5 is a match cut on the shape AND the number.
 * HUD: s08's corners (inset 72) and slug, in the same place, on every frame.
 */
(function () {
  'use strict';
  const ID = 'x08-gate-schematic';
  const C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  // ---- fill steps (local s): 4 x 8ths, then 8 x 16ths; the 12th (62%) lands on 1.0 = film 40.0
  const STEPS = [0.125, 0.25, 0.375, 0.5];
  for (let k = 1; k <= 8; k++) STEPS.push(0.5 + 0.0625 * k);
  const stepsAt = (t) => { let n = 0; for (const s of STEPS) if (t >= s - 1e-6) n++; return n; };
  const BAYS_AT_62 = 3.1;                       // 62% of five bays
  const POWER_AT = [0.125, 0.5, 0.75, 1.0];     // bay i starts filling (steps 1, 4, 8, 12)

  // ---- geometry (24 px module)
  const GL = 696, GR = 1752, AB = 72;            // gate outer edges, abutment width
  const BAY_W = 144, PIER_W = 48;
  const bayX = (i) => 768 + 192 * i;             // bay i: x0 .. x0 + 144
  const bayC = (i) => bayX(i) + BAY_W / 2;       // 840, 1032, 1224, 1416, 1608
  const pierX = (j) => 912 + 192 * j;            // pier j: x0 .. x0 + 48
  const Y = { dim: 264, bus: 312, motor: 366, beam0: 384, beam1: 408, rail: 486, deck0: 504, deck1: 528, leaf0: 576, leaf1: 840, found: 864, hatch1: 888, water: 600 };
  const FILL_H = Y.leaf1 - Y.leaf0 - 8;          // 256 px of fill per bay

  // ---- the s08 match target for the counter
  const CNT = { x: 120, y: 168, size: 264 };
  const CNT_W = 3 * 0.6 * CNT.size;              // three mono advances ('62%')
  const TARGET = { x: 1244.5, y: 797.6, size: 38.4 };

  Film.scene({
    id: ID,
    duration: 1.5,
    build(ctx) {
      const tl = ctx.tl, root = ctx.root;
      ctx.css(`
        [data-scene="${ID}"] .x08-ground { position:absolute; left:0; top:0; width:${W}px; height:${H}px;
          background: radial-gradient(120% 95% at 62% 58%, #12100d 0%, #0e0d0b 45%, #0b0c0e 80%); }
        [data-scene="${ID}"] .x08-layer { position:absolute; left:0; top:0; width:${W}px; height:${H}px; }
        [data-scene="${ID}"] .x08-count { position:absolute; left:${CNT.x}px; top:${CNT.y}px; width:${CNT_W}px; height:${CNT.size}px;
          font: 600 ${CNT.size}px/1 var(--mono); letter-spacing: normal; color:${C.amber}; text-align:right; white-space:pre;
          transform-origin: 0 0; }
        [data-scene="${ID}"] .x08-front { position:absolute; top:0; width:3px; height:${H}px; margin-left:-1.5px; background:${C.amberLight}; opacity:0; }
        [data-scene="${ID}"] .x08-front i { position:absolute; top:0; right:3px; width:72px; height:${H}px;
          background: linear-gradient(90deg, rgba(239,189,112,0) 0%, rgba(239,189,112,.13) 100%); }
      `);

      // ---- ground + grid (baked once: 24 px at 6%, 120 px majors at 10%; displayed at 60%, kicked to 100% on the cut)
      ctx.el('div', 'x08-ground', root);
      const { canvas: gridCv, g: gg } = ctx.canvas({ parent: root });
      gg.clearRect(0, 0, W, H);
      const ox = 1224 % 24, oy = Y.found % 24;
      for (let x = ox; x <= W; x += 24) {
        const major = Math.round((x - 1224) / 24) % 5 === 0;
        gg.fillStyle = major ? 'rgba(239,189,112,.165)' : 'rgba(239,189,112,.1)';
        gg.fillRect(Math.round(x), 0, 1, H);
      }
      for (let y = oy; y <= H; y += 24) {
        const major = Math.round((y - Y.found) / 24) % 5 === 0;
        gg.fillStyle = major ? 'rgba(239,189,112,.165)' : 'rgba(239,189,112,.1)';
        gg.fillRect(0, Math.round(y), W, 1);
      }
      tl.fromTo(gridCv, { opacity: 1 }, { opacity: 0.6, duration: 0.3, ease: 'expo.out' }, 0);

      // ---- the drawing layer (wiped at the end): art (pushed by the camera) + side (the counter column, still)
      const draw = ctx.el('div', 'x08-layer', root);
      const art = ctx.el('div', 'x08-layer', draw);
      const side = ctx.el('div', 'x08-layer', draw);
      // push origin left of the gate (700, 576): the conduit stays clear of the counter column, the right dims stay inside the corners
      art.style.transformOrigin = gridCv.style.transformOrigin = '700px 576px';
      // a faint pencil underlay of the whole line art: the cut frame is already composed, the ink plots over it
      const ghost = ctx.svg('svg', { class: 'brand-svg' }, art);
      const sv = ctx.svg('svg', { class: 'brand-svg' }, art);
      const defs = ctx.svg('defs', {}, sv);
      // patterns: foundation hatch, abutment hatch, bay fill scanlines
      const pat = (id, size, body, rot) => {
        const p = ctx.svg('pattern', { id, width: size, height: size, patternUnits: 'userSpaceOnUse', patternTransform: rot ? `rotate(${rot})` : '' }, defs);
        body(p); return `url(#${id})`;
      };
      const hatchF = pat(ID + '-hatch', 12, (p) => ctx.svg('line', { x1: 0, y1: 0, x2: 0, y2: 12, stroke: C.amber, 'stroke-opacity': 0.42, 'stroke-width': 1.2 }, p), 45);
      const hatchA = pat(ID + '-hatcha', 16, (p) => ctx.svg('line', { x1: 0, y1: 0, x2: 0, y2: 16, stroke: C.amber, 'stroke-opacity': 0.2, 'stroke-width': 1 }, p), -45);
      const scan = pat(ID + '-scan', 10, (p) => {
        ctx.svg('rect', { x: 0, y: 0, width: 10, height: 10, fill: C.amber, 'fill-opacity': 0.3 }, p);
        ctx.svg('rect', { x: 0, y: 0, width: 10, height: 1, fill: C.amberLight, 'fill-opacity': 0.5 }, p);
      });
      // soft inner glow for powered leaves (a wide stroke, blurred, clipped to the leaf)
      const glowF = ctx.svg('filter', { id: ID + '-glow', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
      ctx.svg('feGaussianBlur', { stdDeviation: 7 }, glowF);

      const A = (o) => Object.assign({ fill: 'none', stroke: C.amber, 'stroke-linecap': 'square', 'stroke-linejoin': 'miter' }, o);
      const P1 = { 'stroke-width': 2, 'stroke-opacity': 0.92 };        // structure
      const P2 = { 'stroke-width': 1.25, 'stroke-opacity': 0.55 };     // members, cables
      const P3 = { 'stroke-width': 1, 'stroke-opacity': 0.3 };         // guides, extension lines
      const groups = { ground: [], towers: [], beams: [], leaves: [], detail: [] };
      const add = (grp, tag, attrs) => {
        const e = ctx.svg(tag, attrs, sv); groups[grp].push(e);
        const ga = Object.assign({}, attrs, { 'stroke-opacity': ((attrs['stroke-opacity'] != null ? attrs['stroke-opacity'] : 1) * 0.2).toFixed(3) });
        if (ga.fill && ga.fill !== 'none') ga.fill = 'none';
        ctx.svg(tag, ga, ghost);
        return e;
      };

      // centrelines (dash-dot) through the bays, behind everything
      const cls = [];
      for (let i = 0; i < 5; i++) cls.push(ctx.svg('line', A({ x1: bayC(i), y1: 288, x2: bayC(i), y2: 912, 'stroke-width': 1, 'stroke-opacity': 0.16, 'stroke-dasharray': '22 6 3 6' }), sv));

      // ground: foundation line (full width), hatch band, sill, water level (upstream) with its symbol
      add('ground', 'line', A(Object.assign({ x1: 120, y1: Y.found, x2: 1800, y2: Y.found }, P1)));
      const hatchRect = ctx.svg('rect', { x: 120, y: Y.found, width: 1680, height: Y.hatch1 - Y.found, fill: hatchF }, sv);
      add('ground', 'line', A(Object.assign({ x1: 120, y1: Y.hatch1, x2: 1800, y2: Y.hatch1 }, P3)));
      add('ground', 'line', A(Object.assign({ x1: 768, y1: Y.leaf1, x2: 1680, y2: Y.leaf1 }, P2)));
      add('ground', 'line', A({ x1: 432, y1: Y.water, x2: GL - 12, y2: Y.water, 'stroke-width': 1.25, 'stroke-opacity': 0.5, 'stroke-dasharray': '12 8' }));
      add('ground', 'line', A({ x1: GR + 12, y1: Y.water, x2: 1800, y2: Y.water, 'stroke-width': 1.25, 'stroke-opacity': 0.5, 'stroke-dasharray': '12 8' }));
      add('ground', 'path', A({ d: `M508 ${Y.water - 16} L532 ${Y.water - 16} L520 ${Y.water} Z M510 ${Y.water + 8} H530 M514 ${Y.water + 15} H526`, 'stroke-width': 1.5, 'stroke-opacity': 0.8, 'stroke-linejoin': 'round' }));

      // water (drawing convention): staggered short dashes under the level, upstream bank
      let wd = '';
      for (let r = 0; r < 9; r++) {
        const y = Y.water + 24 + r * 24, off = (r % 2) * 18, span = 240 - r * 6;
        for (let x = GL - 24 - span + off; x < GL - 30; x += 36) wd += `M${x} ${y} h${r < 2 ? 20 : 14} `;
      }
      add('ground', 'path', A({ d: wd, 'stroke-width': 1.25, 'stroke-opacity': 0.34, 'stroke-linecap': 'round' }));

      // towers: abutments + piers (front faces), abutment hatch
      const abL = add('towers', 'rect', A(Object.assign({ x: GL, y: Y.beam1, width: AB, height: Y.found - Y.beam1 }, P1)));
      const abR = add('towers', 'rect', A(Object.assign({ x: GR - AB, y: Y.beam1, width: AB, height: Y.found - Y.beam1 }, P1)));
      const abFill = [GL, GR - AB].map((x) => ctx.svg('rect', { x: x + 2, y: Y.beam1 + 2, width: AB - 4, height: Y.found - Y.beam1 - 4, fill: hatchA }, sv));
      for (let j = 0; j < 4; j++) add('towers', 'rect', A(Object.assign({ x: pierX(j), y: Y.beam1, width: PIER_W, height: Y.found - Y.beam1 }, P1)));
      // gate guides (slots) inside each tower face
      let gd = '';
      for (let j = 0; j < 4; j++) { const x = pierX(j); gd += `M${x + 7} ${Y.deck1} V${Y.found} M${x + PIER_W - 7} ${Y.deck1} V${Y.found} `; }
      gd += `M${GL + AB - 7} ${Y.deck1} V${Y.found} M${GR - AB + 7} ${Y.deck1} V${Y.found}`;
      add('detail', 'path', A(Object.assign({ d: gd }, P3)));

      // beams: hoist beam, deck, railing + posts
      add('beams', 'rect', A(Object.assign({ x: GL, y: Y.beam0, width: GR - GL, height: Y.beam1 - Y.beam0 }, P1)));
      add('beams', 'rect', A(Object.assign({ x: GL, y: Y.deck0, width: GR - GL, height: Y.deck1 - Y.deck0 }, P1)));
      add('beams', 'line', A(Object.assign({ x1: GL, y1: Y.rail, x2: GR, y2: Y.rail }, P2)));
      let posts = '';
      for (let x = GL + 12; x < GR; x += 24) posts += `M${x} ${Y.rail} V${Y.deck0} `;
      add('detail', 'path', A(Object.assign({ d: posts }, P3)));

      // leaves: gate leaf outline, ribs, edge girders; the fill + its top edge per bay
      const leaves = [], fills = [], edges = [], motors = [], drops = [], cables = [], glows = [];
      for (let i = 0; i < 5; i++) {
        const x0 = bayX(i);
        const fill = ctx.svg('rect', { x: x0 + 12, y: Y.leaf1 - 4, width: BAY_W - 24, height: 0, fill: scan }, sv);
        fills.push(fill);
        const cp = ctx.svg('clipPath', { id: `${ID}-lc${i}` }, defs);
        ctx.svg('rect', { x: x0 + 9, y: Y.leaf0 + 1, width: BAY_W - 18, height: Y.leaf1 - Y.leaf0 - 2 }, cp);
        const gl = ctx.svg('g', { 'clip-path': `url(#${ID}-lc${i})`, opacity: 0 }, sv);
        ctx.svg('rect', { x: x0 + 8, y: Y.leaf0, width: BAY_W - 16, height: Y.leaf1 - Y.leaf0, fill: 'none', stroke: C.amber, 'stroke-width': 16, 'stroke-opacity': 0.55, filter: `url(#${ID}-glow)` }, gl);
        glows.push(gl);
        leaves.push(add('leaves', 'rect', A(Object.assign({ x: x0 + 8, y: Y.leaf0, width: BAY_W - 16, height: Y.leaf1 - Y.leaf0 }, P1))));
        let rib = '';
        for (let k = 1; k < 6; k++) { const y = Y.leaf0 + (Y.leaf1 - Y.leaf0) * k / 6; rib += `M${x0 + 8} ${y} H${x0 + BAY_W - 8} `; }
        add('leaves', 'path', A(Object.assign({ d: rib }, P2)));
        add('leaves', 'path', A(Object.assign({ d: `M${x0 + 30} ${Y.leaf0} V${Y.leaf1} M${x0 + BAY_W - 30} ${Y.leaf0} V${Y.leaf1}` }, P3)));
        edges.push(ctx.svg('line', { x1: x0 + 12, x2: x0 + BAY_W - 12, y1: 0, y2: 0, stroke: C.amberLight, 'stroke-width': 3, opacity: 0 }, sv));
        // cables (through the deck), motor on the hoist beam, the drop from the bus
        const cx = bayC(i);
        cables.push(add('detail', 'path', A(Object.assign({ d: `M${cx - 30} ${Y.beam1} V${Y.deck0} M${cx + 30} ${Y.beam1} V${Y.deck0} M${cx - 30} ${Y.deck1} V${Y.leaf0} M${cx + 30} ${Y.deck1} V${Y.leaf0}` }, P2))));
        const mg = ctx.svg('g', {}, sv);
        const body = ctx.svg('circle', A(Object.assign({ cx, cy: Y.motor, r: 15, fill: C.bg }, P1)), mg);
        const core = ctx.svg('circle', { cx, cy: Y.motor, r: 6, fill: C.amber, 'fill-opacity': 0.25 }, mg);
        groups.detail.push(body);
        motors.push({ body, core });
        drops.push(add('detail', 'line', A(Object.assign({ x1: cx, y1: Y.bus, x2: cx, y2: Y.motor - 15 }, P2))));
      }

      // dimension chains (ticks only, no figures): overall width over the gate, height at the right
      let dimD = `M${GL} ${Y.dim} H${GR} M${GL} 250 V372 M${GR} 250 V372`;
      let tick = '';
      const tk = (x, y) => `M${x - 8} ${y + 8} L${x + 8} ${y - 8} `;
      [GL, GR].forEach((x) => { tick += tk(x, Y.dim); });
      for (let j = 0; j < 4; j++) { const x = pierX(j) + PIER_W / 2; dimD += ` M${x} ${Y.dim - 10} V${Y.dim + 10}`; tick += tk(x, Y.dim); }
      dimD += ` M1764 ${Y.beam0} H1812 M1764 ${Y.found} H1812 M1800 ${Y.beam0} V${Y.found} M1790 ${Y.deck0} H1810`;
      tick += tk(1800, Y.beam0) + tk(1800, Y.found) + tk(1800, Y.deck0);
      add('detail', 'path', A(Object.assign({ d: dimD }, P2)));
      add('detail', 'path', A({ d: tick, 'stroke-width': 2, 'stroke-opacity': 0.85 }));

      // pump station (P&ID pump symbol on a plinth) + the conduit up to the bus over the motors
      const PX = 312, PY = 812;
      add('ground', 'rect', A(Object.assign({ x: PX - 48, y: Y.found - 22, width: 96, height: 22 }, P2)));
      add('towers', 'circle', A(Object.assign({ cx: PX, cy: PY - 18, r: 30 }, P1)));
      add('detail', 'path', A({ d: `M${PX - 14} ${PY - 40} L${PX + 22} ${PY - 18} L${PX - 14} ${PY + 4}`, 'stroke-width': 1.5, 'stroke-opacity': 0.8, 'stroke-linejoin': 'round' }));
      const CD = `M${PX + 30} ${PY - 18} H600 L624 ${PY - 42} V336 L648 ${Y.bus} H${bayC(4) + 24}`;
      const conduit = add('beams', 'path', A({ d: CD, 'stroke-width': 2, 'stroke-opacity': 0.4 }));
      // power: bright dashes flowing along the conduit, revealed up to the power front (mask)
      const mask = ctx.svg('mask', { id: ID + '-pmask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
      const maskPath = ctx.svg('path', { d: CD, fill: 'none', stroke: '#fff', 'stroke-width': 12, pathLength: 1, 'stroke-dasharray': '0 2' }, mask);
      const power = ctx.svg('path', { d: CD, fill: 'none', stroke: C.amberLight, 'stroke-width': 3, 'stroke-dasharray': '14 10', mask: `url(#${ID}-pmask)` }, sv);
      const head = ctx.svg('g', { opacity: 0 }, sv);
      ctx.svg('circle', { r: 16, fill: C.amber, 'fill-opacity': 0.18 }, head);
      ctx.svg('rect', { x: -5, y: -5, width: 10, height: 10, fill: C.amberLight, transform: 'rotate(45)' }, head);
      const cLen = conduit.getTotalLength();
      const L0 = (600 - (PX + 30)) + Math.hypot(24, 24) + (PY - 42 - 336) + Math.hypot(24, 24);   // conduit length to the bus corner
      const frontAt = (i) => (L0 + (bayC(i) - 648)) / cLen;     // fraction of the conduit at bay i's drop
      // power front (fraction): whip to bay 1 by 0.125, then bay by bay with the fill, never past bay 4's drop
      const FK = [[0.03, 0], [0.125, frontAt(0)], [0.5, frontAt(1)], [0.75, frontAt(2)], [1.0, frontAt(3)]];
      const po3 = gsap.parseEase('power3.out'), p4 = gsap.parseEase('power4.out');
      const frontOf = (t) => {
        if (t <= FK[0][0]) return 0;
        for (let k = 1; k < FK.length; k++) {
          if (t <= FK[k][0]) { const u = (t - FK[k - 1][0]) / (FK[k][0] - FK[k - 1][0]); return FK[k - 1][1] + (FK[k][1] - FK[k - 1][1]) * (k === 1 ? po3(u) : p4(clamp01(u * 2.2))); }
        }
        return FK[FK.length - 1][1];
      };

      // ---- labels (inside the drawing layer so the wipe takes them)
      // short scrambles: every word resolves by the 0.25 half-beat
      Brand.eyebrow(ctx, { text: 'Objective 2 of 3', x: CNT.x + 4, y: 124, at: 0, size: 24, color: C.amber, dur: 0.18, parent: side });
      Brand.label(ctx, { text: 'Restore gate power', x: CNT.x + 2, y: 430, at: 0.04, dur: 0.18, size: 34, color: C.ink, tracking: '.1em', parent: side });
      Brand.label(ctx, { text: 'Floodgate', x: 1224, y: 214, at: 0.06, dur: 0.15, size: 20, color: C.amber, align: 'center', tracking: '.28em', parent: art });
      Brand.label(ctx, { text: 'Pump station', x: PX, y: 740, at: 0.06, dur: 0.15, size: 20, color: C.amber, align: 'center', tracking: '.16em', parent: art });
      // the rule under the counter: a quiet line that a bright stroke runs along when 62% locks
      const ruleSv = ctx.svg('svg', { class: 'brand-svg' }, side);
      const rule0 = ctx.svg('line', { x1: CNT.x, x2: CNT.x + CNT_W, y1: 410, y2: 410, stroke: C.amber, 'stroke-opacity': 0.3, 'stroke-width': 1.5 }, ruleSv);
      const rule1 = ctx.svg('line', { x1: CNT.x, x2: CNT.x + CNT_W, y1: 410, y2: 410, stroke: C.amberLight, 'stroke-width': 3 }, ruleSv);
      tl.fromTo(rule0, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.3, ease: 'power4.out' }, 0.04);
      tl.fromTo(rule1, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.2, ease: 'expo.out' }, 1.0);

      // ---- plot the drawing on: power4.out, staggered by group (frame 0 already shows the ground lines starting)
      const plot = (els, at, dur, each, from) => tl.fromTo(els, { drawSVG: from || '0% 0%' }, { drawSVG: '0% 100%', duration: dur, ease: 'power4.out', stagger: { each, from: 'start' } }, at);
      plot(groups.ground, 0, 0.3, 0.015, '0% 10%');
      plot(cls, 0, 0.26, 0.012, '0% 8%');
      tl.fromTo(hatchRect, { attr: { width: 160 } }, { attr: { width: 1680 }, duration: 0.3, ease: 'power4.out' }, 0);
      plot(groups.towers, 0.02, 0.26, 0.018);
      tl.fromTo(abFill, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' }, 0.12);
      plot(groups.beams, 0.05, 0.28, 0.02);
      plot(groups.leaves, 0.08, 0.28, 0.012);
      plot(groups.detail, 0.11, 0.28, 0.006);

      // ---- camera: push the sheet, settle on the lock
      const push = { s: 1 };
      tl.fromTo(push, { s: 1 }, { s: 1.03, duration: 1.0, ease: 'expo.out' }, 0);
      tl.to(push, { s: 1.022, duration: 2 / FPS, ease: 'power2.out' }, 1.0);

      // ---- s08's lifted objective card as blueprint linework at its exact 40.5 geometry (plots 1.3667-1.4667)
      const CARD = { x: 560, y: 759.2, w: 800, h: 212.2, r: 18 }, TRK = { x: 606.4, y: 921.8, w: 707.2, h: 12.8, r: 4 };
      const rr = (o) => { const { x, y, w, h, r } = o; return `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`; };
      const cardSv = ctx.svg('svg', { class: 'brand-svg' }, root);
      const cardEls = [
        ctx.svg('path', { d: rr(CARD), fill: 'none', stroke: C.amber, 'stroke-opacity': 0.6, 'stroke-width': 1.5 }, cardSv),
        ctx.svg('path', { d: rr(TRK), fill: 'none', stroke: C.amber, 'stroke-opacity': 0.6, 'stroke-width': 1.25 }, cardSv),
        // text slots (baselines of 'OBJECTIVE 2 OF 3' and 'Restore gate power' in the card)
        ctx.svg('path', { d: `M606.4 834.5 H964.8 M606.4 890 H995.5`, fill: 'none', stroke: C.amber, 'stroke-opacity': 0.35, 'stroke-width': 1.25 }, cardSv),
        ctx.svg('line', { x1: TRK.x, y1: TRK.y + TRK.h / 2, x2: TRK.x + TRK.w * 0.62, y2: TRK.y + TRK.h / 2, stroke: C.amber, 'stroke-opacity': 0.9, 'stroke-width': 5, 'stroke-linecap': 'round' }, cardSv),
      ];
      tl.fromTo(cardEls, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 3 / FPS, ease: 'power4.out', stagger: 0 }, 41 / FPS);

      // ---- the counter (above the drawing; collapses onto s08's '62%' at the end)
      const cnt = ctx.el('div', 'x08-count', root, '0%');
      const cntP = { c: 0 };
      tl.fromTo(cntP, { c: 0 }, { c: 1, duration: 0.2, ease: 'power2.out' }, 1.0);   // lock flash decays (amberLight -> amber)
      const sc = TARGET.size / CNT.size;
      tl.fromTo(cnt, { x: 0, y: 0, scale: 1 }, { x: TARGET.x - CNT.x, y: TARGET.y - CNT.y, scale: sc, duration: 4 / FPS, ease: 'power3.inOut', immediateRender: false }, 40 / FPS);

      // ---- the wipe along the conduit (left -> right): clip the drawing behind a bright front
      const front = ctx.el('div', 'x08-front', root, '<i></i>');
      const wipe = { x: -20 };
      tl.fromTo(wipe, { x: -20 }, { x: W + 80, duration: 5 / FPS, ease: 'power2.in' }, 36 / FPS);

      const hud = Brand.hud(ctx, { inset: 72, tc: false, ticks: false, drawIn: false, slug: '' });
      Brand.label(ctx, { text: 'REALMS · COMPETITIVE · INTERFACE CONCEPT', x: 120, y: 990, size: 20, color: C.muted3, scramble: false, tracking: '.1em' });
      void hud;

      const lerpHex = (a, b, u) => { const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(',')})`; };

      ctx.onFrame((t) => {
        const ps = `scale(${push.s.toFixed(5)})`;
        art.style.transform = ps; gridCv.style.transform = ps;
        // fill level (bays) and the counter
        const n = stepsAt(t);
        const L = BAYS_AT_62 * n / 12;
        const pct = Math.round(62 * n / 12);
        const txt = pct + '%';
        if (cnt.textContent !== txt) cnt.textContent = txt;
        cnt.style.color = t >= 1.0 ? lerpHex(C.amberLight, C.amber, cntP.c) : C.amber;
        // time since the last step (for the edge flash)
        let since = 9;
        if (n > 0) since = t - STEPS[n - 1];
        const lockFlash = t >= 1.0 ? Math.max(0, 1 - (t - 1.0) / 0.3) : 0;
        for (let i = 0; i < 5; i++) {
          const f = clamp01(L - i);
          const h = Math.round(FILL_H * f);
          fills[i].setAttribute('y', String(Y.leaf1 - 4 - h));
          fills[i].setAttribute('height', String(h));
          const on = t >= POWER_AT[i] - 1e-6 && i < 4;
          // top edge: bright on the active bay, flashes for 3 frames after each step
          const active = h > 0 && (f < 1 || i === Math.floor(L - 1e-6));
          const fl = since < 0.1 ? 1 - since / 0.1 : 0;
          edges[i].setAttribute('y1', String(Y.leaf1 - 4 - h)); edges[i].setAttribute('y2', String(Y.leaf1 - 4 - h));
          edges[i].setAttribute('opacity', h > 0 ? (active ? (0.75 + 0.25 * fl).toFixed(3) : (0.35 + 0.5 * lockFlash).toFixed(3)) : '0');
          // powered bay: motor lit, drop bright, leaf outline bright
          const pk = on ? Math.max(0, 1 - (t - POWER_AT[i]) / 0.18) : 0;
          motors[i].core.setAttribute('fill-opacity', on ? (0.85 + 0.15 * pk).toFixed(3) : '0.22');
          motors[i].core.setAttribute('r', on ? (6 + 4 * pk).toFixed(2) : '6');
          motors[i].body.setAttribute('stroke', on ? C.amberLight : C.amber);
          drops[i].setAttribute('stroke', on ? C.amberLight : C.amber);
          drops[i].setAttribute('stroke-opacity', on ? '1' : '0.55');
          leaves[i].setAttribute('stroke', on ? C.amberLight : C.amber);
          glows[i].setAttribute('opacity', on ? Math.min(1, 0.75 + 0.6 * Math.max(pk, lockFlash)).toFixed(3) : '0');
          cables[i].setAttribute('stroke-opacity', on ? (0.8 + 0.2 * Math.max(pk, lockFlash)).toFixed(3) : '0.55');
        }
        // power front + flowing dashes (pure function of t)
        const fr = frontOf(t);
        maskPath.setAttribute('stroke-dasharray', `${fr.toFixed(5)} 2`);
        power.setAttribute('stroke-dashoffset', (-t * 520).toFixed(2));
        if (fr > 0.002 && t < 1.2) {
          const pt = conduit.getPointAtLength(fr * cLen);
          const moving = t < 1.0 ? 1 : Math.max(0, 1 - (t - 1.0) / 0.2);
          head.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
          head.setAttribute('opacity', (0.35 + 0.65 * moving).toFixed(3));
        } else head.setAttribute('opacity', '0');
        // the wipe
        const wx = wipe.x;
        if (wx > -10) {
          draw.style.clipPath = `inset(0 0 0 ${Math.max(0, wx).toFixed(1)}px)`;
          front.style.left = wx.toFixed(1) + 'px';
          front.style.opacity = wx < W + 2 ? '1' : '0';
        } else { draw.style.clipPath = ''; front.style.opacity = '0'; }
      });
    },
  });
})();
