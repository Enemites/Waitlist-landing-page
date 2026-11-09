/* x08-roles: revision v3 round 2 insert (overlay, film 36.5-38.0). Local 0 = 36.5. Spec: docs/revision-v3.md.
 * ROLES: the plan of s08's messages ("Nora, take the pump station. Emre, watch the crossing." Jules
 * coordinates) as three solid amber panes built like the bars of the Enemites mark: horizontal bars whose
 * ends are cut at Brand.SLANT (34 deg), stacked with a 36 px gap on a charcoal ground, one job each:
 *   JULES / Coordination  (the gate holding water: high upstream, low downstream) motif: rings
 *   NORA  / Pump station  (the pump house, impeller, conduit)                    motif: bars charging upward
 *   EMRE  / Crossing      (the bridge over the river)                            motif: crossing hatch
 * Each pane: the member's token (charcoal disc, amber initials), the name (mono 24) over the job
 * (Manrope 650, 104 px), charcoal on amber, and the place as a line pictogram at the pane's right end.
 * The motif burns at 15% charcoal (27% on landing): about 3% under the type, building on both sides of a clear
 * plate around the pictogram (soft 26 px edges) and peaking right of it, so it frames the icon, never crosses it.
 *
 * 0.00 / 0.25 / 0.50 (36.5 / 36.75 / 37.0, on the beats) the panes slam in, alternating from the left, the
 *      right, the left (6 f expo.out, pre-rolled 1 f so the beat frame already shows the pane ~68% in; three
 *      hard amber speed lines trail the cut only while it moves > 400 px/frame, never on the landing frame).
 *      On landing the leading cut edge flashes light and its construction line (the slant extended across the
 *      frame, clipped inside the HUD frame, y 96-960) settles at 8.5%. The type rides in 2 f behind
 *      (parallax inside the pane); the token pops; the pictogram plots left to right (8 f).
 * 0.50-1.25 hold: the motifs keep moving (rings travel out, bars breathe, the hatch flows), panes drift 6 px.
 * 1.25-1.4667 SNAP OUT: on 1.25 (37.75, on the quarter beat) the type, tokens, pictograms and motifs cut out of the
 *      panes on ONE frame (no in-between frame, so no word is ever sliced by its pane mask); the outer panes slam
 *      onto the middle one (power4.in, together on 1.375 = 37.875, a light flash), then the merged bar collapses
 *      (power2.in) onto the mid-line of s08's PLAN AGREED card as it is on its first lifted frame (38.033, measured: x 1117-1623,
 *      centre y 499): on 37.967 it is a light hairline exactly that wide at that height, the card opens out of
 *      it two frames later. Hard cut to s08 at 1.5 (38.0). Three roles, one plan.
 * HUD: s08's corners (inset 72, no ticks) and slug (120,990, .1em) on every frame.
 */
(function () {
  'use strict';
  const ID = 'x08-roles';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const SLUG = 'REALMS · COMPETITIVE · INTERFACE CONCEPT';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const expoOut = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
  const p4in = (u) => { u = clamp(u, 0, 1); return u * u * u * u; };
  const p2in = (u) => { u = clamp(u, 0, 1); return u * u; };
  const backOut = (u, s = 1.8) => { u = clamp(u, 0, 1) - 1; return u * u * ((s + 1) * u + s) + 1; };
  const TS = Math.tan((B.SLANT || 34) * Math.PI / 180);

  // ---- panes ----
  const HB = 216, GAP = 36, PITCH = HB + GAP;
  const XL = 270, XR = 1650;                       // slanted ends cross the pane's mid-line here
  const PANES = [
    { tag: 'JULES', job: 'Coordination', tok: 'JK', pict: 'gate', motif: 'rings', cy: 540 - PITCH, at: 0.0, dir: 1 },
    { tag: 'NORA', job: 'Pump station', tok: 'NC', pict: 'pump', motif: 'bars', cy: 540, at: 0.25, dir: -1 },
    { tag: 'EMRE', job: 'Crossing', tok: 'EK', pict: 'cross', motif: 'hatch', cy: 540 + PITCH, at: 0.5, dir: 1 },
  ];
  const SLAM = 6 / FPS, PRE = 1 / FPS, D = 2000;
  const TOK_X = 432, TXT_X = 512, PICT_X = 1388;
  const OUT0 = 1.25, MERGE = 1.375, END = 1.4667;
  // s08's PLAN AGREED lift card on its first visible frame (film 38.033, DOM rect measured in the film): the merged
  // bar collapses onto its mid-line. If s08's lift (match.js lift: at 4.0, scale 1.7, cx 925, top 166) changes,
  // re-measure.
  const CARD = { l: 1117.2, r: 1622.5, cy: 499.4 };

  // pane horizontal offset (slam + hold drift), content lag offset
  const slamU = (t, p) => (t - p.at + PRE) / SLAM;
  const paneX = (t, p) => {
    const u = slamU(t, p);
    if (u <= 0) return -p.dir * D;
    return -p.dir * D * (1 - expoOut(u)) + p.dir * 6 * seg(t, p.at + 0.25, OUT0);
  };
  const textX = (t, p) => { const u = (t - p.at + PRE - 2 / FPS) / (9 / FPS); return u <= 0 ? -p.dir * 520 : -p.dir * 520 * (1 - expoOut(u)); };
  // exit: vertical merge offset, vertical scale, hairline retract
  const mergeY = (t, k) => (k === 1 ? 0 : (k === 0 ? 1 : -1) * PITCH * p4in(seg(t, OUT0, MERGE)));
  const collapse = (t) => p2in(seg(t, MERGE + 0.005, END));
  // pane content cuts out on one frame (a 2 f drop left a frame with every word sliced by its pane mask)
  const contentOut = (t) => (t >= OUT0 ? 1 : 0);

  Film.scene({
    id: ID,
    duration: 1.5,
    build(ctx) {
      const { root } = ctx;
      ctx.css(`
        [data-scene="${ID}"] .x08r-bg { position:absolute; inset:0; background:${C.bg}; }
        [data-scene="${ID}"] .x08r-clip { position:absolute; left:0; top:0; width:${W}px; height:${H}px; }
        [data-scene="${ID}"] .x08r-tag { position:absolute; left:${TXT_X}px; top:0; font: 600 24px/24px var(--mono); letter-spacing:.18em; color:${B.rgba(C.bg, 0.78)}; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .x08r-job { position:absolute; left:${TXT_X - 6}px; top:0; font: 650 104px/1 var(--display); letter-spacing:-0.05em; color:${C.bg}; white-space:pre; }
        [data-scene="${ID}"] .x08r-slug { position:absolute; left:120px; top:990px; font: 500 20px/20px var(--mono); letter-spacing:.1em; color:${C.muted3}; text-transform:uppercase; white-space:pre; }
      `);
      ctx.el('div', 'x08r-bg', root);
      const { g } = ctx.canvas();

      // ---- type (DOM, clipped to each pane) ----
      const baselineTop = (el, base) => {
        const probe = ctx.el('span', '', el); Object.assign(probe.style, { display: 'inline-block', width: '0px', height: '0px', verticalAlign: 'baseline' });
        const o = probe.getBoundingClientRect().top - el.getBoundingClientRect().top; el.removeChild(probe);
        el.style.top = (base - o).toFixed(1) + 'px';
      };
      PANES.forEach((p) => {
        p.clip = ctx.el('div', 'x08r-clip', root);
        p.tagEl = ctx.el('div', 'x08r-tag', p.clip, p.tag);
        p.jobEl = ctx.el('div', 'x08r-job', p.clip, p.job);
        baselineTop(p.tagEl, p.cy - 46);
        baselineTop(p.jobEl, p.cy + 52);
      });
      B.hud(ctx, { inset: 72, tc: false, drawIn: false, slug: '', ticks: false });
      ctx.el('div', 'x08r-slug', root, SLUG);

      // ---- geometry helpers ----
      // pane polygon: mid-line y = cy, half height h, ends through (xl, cy) / (xr, cy) at the slant
      const poly = (c, xl, xr, cy, h) => {
        const r = h / TS;
        c.moveTo(xl + r, cy - h); c.lineTo(xr + r, cy - h); c.lineTo(xr - r, cy + h); c.lineTo(xl - r, cy + h); c.closePath();
      };
      const clipCss = (xl, xr, cy, h) => {
        const r = h / TS, f = (v) => v.toFixed(1) + 'px';
        return `polygon(${f(xl + r)} ${f(cy - h)}, ${f(xr + r)} ${f(cy - h)}, ${f(xr - r)} ${f(cy + h)}, ${f(xl - r)} ${f(cy + h)})`;
      };
      const ink = (a) => B.rgba(C.bg, a);

      // ---- motifs: charcoal straight onto the pane (inside its clip), through a horizontal ramp gradient
      // (k x 0.18 under the type -> k at the right end), so no offscreen layer is needed. Geometry is limited
      // to the pane band (ring arcs, band-length hatch, cell rects) to keep the raster cheap. ----
      const nzB = ctx.noise2D('x08-roles-bars');
      const BARS = Array.from({ length: 90 }, (_, i) => clamp(0.55 + 0.45 * nzB(i * 0.23, 1.7), 0.18, 1));
      // ramp: 0.18 k under the type (from RAMP0), building toward the plate, clear across the plate (the
      // pictogram's centre +/- PLATE, soft PSOFT edges), then full strength from just right of it to the end
      const RAMP0 = 1120, PLATE = 140, PSOFT = 26, RAMPE = 1820;
      function motif(c, p, ox, cy, age, lt, k, pc) {
        const x0 = RAMP0 + ox, x1 = RAMPE + ox, f = (x) => clamp((x - x0) / (x1 - x0), 0, 1);
        const gr = c.createLinearGradient(x0, 0, x1, 0);
        const pl = pc - PLATE, pr = pc + PLATE;
        gr.addColorStop(0, ink(0.18 * k));
        gr.addColorStop(f(pl - PSOFT - 1), ink(0.55 * k));
        gr.addColorStop(f(pl), ink(0));
        gr.addColorStop(f(pr), ink(0));
        gr.addColorStop(f(pr + PSOFT), ink(k));
        gr.addColorStop(1, ink(k));
        c.strokeStyle = gr; c.fillStyle = gr;
        const hb = HB / 2 + 2, xmin = RAMP0 - 260 + ox;
        if (p.motif === 'rings') {
          const cx = PICT_X + ox, sp = 26;
          const ph = sp * 2.4 * expoOut(age / 0.4) + 16 * Math.max(0, age);
          c.lineWidth = 2;
          c.beginPath();
          for (let i = 0; i < 70; i++) {
            const r = 30 + ((i * sp + ph) % (70 * sp));
            if (r > 1500) continue;
            if (r <= hb) { c.moveTo(cx + r, cy); c.arc(cx, cy, r, 0, Math.PI * 2); continue; }
            const a = Math.asin(hb / r);
            c.moveTo(cx + r * Math.cos(-a), cy + r * Math.sin(-a)); c.arc(cx, cy, r, -a, a);
            if (cx - r > xmin) { c.moveTo(cx - r * Math.cos(a), cy + r * Math.sin(a)); c.arc(cx, cy, r, Math.PI - a, Math.PI + a); }
          }
          c.stroke();
        } else if (p.motif === 'bars') {
          const pitch = 22, bw = 9, x0 = XL - 200 + ox, bot = cy + HB / 2, cell = 14, gapc = 4;
          c.beginPath();
          for (let i = 0; i < BARS.length; i++) {
            const x = x0 + i * pitch;
            if (x < xmin) continue;
            const lvl = expoOut((age - i * 0.004) / 0.35) * (0.82 + 0.18 * Math.sin(lt * 9 + i * 0.7));
            const h = HB * BARS[i] * lvl;
            // battery cells counted up from the pane's bottom edge; the top cell is cut at the level
            for (let y = bot; y > bot - h; y -= cell + gapc) { const t = Math.max(bot - h, y - cell); c.rect(x, t, bw, y - t); }
          }
          c.fill();
        } else {
          const cx = PICT_X + ox, sp = 30, run = hb / TS;
          const ph = sp * 2.2 * expoOut(age / 0.35) + 18 * Math.max(0, age);
          c.lineWidth = 2;
          c.beginPath();
          for (let j = -40; j <= 40; j++) {
            // two families at +/- the slant, flowing toward the crossing (pictogram centre)
            const o1 = cx + j * sp + (ph % sp), o2 = cx + j * sp - (ph % sp);
            if (o1 > xmin - run && o1 < XR + ox + 400) { c.moveTo(o1 - run, cy + hb); c.lineTo(o1 + run, cy - hb); }
            if (o2 > xmin - run && o2 < XR + ox + 400) { c.moveTo(o2 - run, cy - hb); c.lineTo(o2 + run, cy + hb); }
          }
          c.stroke();
        }
      }

      // ---- pictograms (local coordinates, centred at 0,0; charcoal line art) ----
      function pict(c, p, lt) {
        c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = C.bg; c.fillStyle = C.bg;
        if (p.pict === 'gate') {
          // the floodgate holding water: deck, three piers, two leaves; upstream (left) the water stands high
          // against the gate, downstream (right) it runs low; the water line is broken at the gate
          c.beginPath();
          c.moveTo(-72, -46); c.lineTo(72, -46); c.moveTo(-72, -34); c.lineTo(72, -34);
          for (const x of [-58, 0, 58]) c.rect(x - 6, -34, 12, 86);
          c.stroke();
          c.fillStyle = ink(0.28);
          for (const x of [-48, 10]) c.fillRect(x, -24, 38, 68);
          c.lineWidth = 3; c.beginPath();
          for (const x of [-48, 10]) c.rect(x, -24, 38, 68);
          c.stroke();
          // water bodies (light charcoal) under each level, then the wave lines
          c.fillStyle = ink(0.14);
          c.fillRect(-124, -2, 58, 54); c.fillRect(66, 42, 58, 10);
          c.lineWidth = 3.5; c.beginPath();
          for (let x = -124; x <= -68; x += 4) { const y = -4 + 3.5 * Math.sin(x * 0.12 + lt * 7); if (x === -124) c.moveTo(x, y); else c.lineTo(x, y); }
          for (let x = 68; x <= 124; x += 4) { const y = 40 + 3 * Math.sin(x * 0.12 + lt * 7); if (x === 68) c.moveTo(x, y); else c.lineTo(x, y); }
          c.stroke();
          c.lineWidth = 4; c.beginPath(); c.moveTo(-124, 54); c.lineTo(124, 54); c.stroke();
        } else if (p.pict === 'pump') {
          // the pump house (gable), an impeller turning inside, the conduit leaving toward the gate
          c.beginPath();
          c.moveTo(-96, -26); c.lineTo(-50, -62); c.lineTo(-4, -26);
          c.rect(-88, -26, 76, 74);
          c.stroke();
          const a0 = lt * 7;
          c.beginPath(); c.arc(-50, 12, 20, 0, Math.PI * 2);
          for (let k = 0; k < 3; k++) { const a = a0 + k * 2.0944; c.moveTo(-50, 12); c.lineTo(-50 + Math.cos(a) * 16, 12 + Math.sin(a) * 16); }
          c.lineWidth = 3.5; c.stroke();
          c.lineWidth = 4; c.beginPath(); c.moveTo(-12, 22); c.lineTo(40, 22); c.lineTo(40, -30); c.lineTo(72, -30); c.stroke();
          c.setLineDash([4, 9]); c.lineDashOffset = -lt * 60;
          c.beginPath(); c.moveTo(72, -30); c.lineTo(112, -30); c.stroke();
          c.setLineDash([]);
          c.beginPath(); c.moveTo(-110, 48); c.lineTo(10, 48); c.stroke();
        } else {
          // the crossing: the river (three water lines) and the bridge over it at the slant, planks between
          c.lineWidth = 3.5;
          for (let r = 0; r < 3; r++) {
            c.beginPath();
            for (let x = -110; x <= 110; x += 4) { const y = -22 + r * 22 + 3.5 * Math.sin(x * 0.1 + lt * 6 + r); if (x === -110) c.moveTo(x, y); else c.lineTo(x, y); }
            c.stroke();
          }
          const ax = -86, ay = 58, bx = 86, by = -58, nx = 0.559, ny = 0.829;   // bridge axis at Brand.SLANT (34 deg) + normal
          c.fillStyle = B.rgba(C.amber, 1);
          c.beginPath(); c.moveTo(ax - nx * 14, ay - ny * 14); c.lineTo(bx - nx * 14, by - ny * 14); c.lineTo(bx + nx * 14, by + ny * 14); c.lineTo(ax + nx * 14, ay + ny * 14); c.closePath(); c.fill();
          c.lineWidth = 4;
          c.beginPath();
          c.moveTo(ax - nx * 14, ay - ny * 14); c.lineTo(bx - nx * 14, by - ny * 14);
          c.moveTo(ax + nx * 14, ay + ny * 14); c.lineTo(bx + nx * 14, by + ny * 14);
          c.stroke();
          c.lineWidth = 2.5; c.beginPath();
          for (let k = 1; k < 9; k++) { const u = k / 9, x = lerp(ax, bx, u), y = lerp(ay, by, u); c.moveTo(x - nx * 14, y - ny * 14); c.lineTo(x + nx * 14, y + ny * 14); }
          c.stroke();
        }
      }

      // ---- the frame ----
      ctx.onFrame((lt) => {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, W, H);
        const co = contentOut(lt), cl = collapse(lt);
        const merged = lt >= MERGE;

        // construction lines: each landed pane's cut edges extended across the frame (8.5%, flash on landing),
        // kept inside the HUD frame (y 96-960) so they never graze the slug
        g.save(); g.beginPath(); g.rect(0, 96, W, 864); g.clip();
        g.lineWidth = 1; g.lineCap = 'butt';
        PANES.forEach((p) => {
          const age = lt - p.at;
          if (age < 1 / FPS || lt >= OUT0) return;
          const a = 0.085 + 0.25 * Math.max(0, 1 - age / 0.2);
          const ox = paneX(lt, p);
          g.strokeStyle = B.rgba(C.amber, a);
          g.beginPath();
          for (const xe of [XL + ox, XR + ox]) { g.moveTo(xe + 700 / TS, p.cy - 700); g.lineTo(xe - 700 / TS, p.cy + 700); }
          g.stroke();
        });
        g.restore();

        // panes: middle first, the outer ones over it (they slide onto it at the exit)
        [1, 0, 2].forEach((k) => {
          const p = PANES[k];
          const u = slamU(lt, p);
          if (u <= 0) { p.clip.style.display = 'none'; return; }
          const ox = paneX(lt, p), oy = mergeY(lt, k);
          // after the merge the bar collapses onto the PLAN AGREED card's mid-line (centre y, both edges)
          const cy = p.cy + oy + (CARD.cy - 540) * cl;
          const h = HB / 2 * Math.max(0.012, 1 - cl);
          const xl = lerp(XL + ox, CARD.l, cl), xr = lerp(XR + ox, CARD.r, cl);
          const vel = Math.abs(paneX(lt, p) - paneX(lt - 1 / FPS, p));
          // speed lines: three hard hairlines along the top edge, the mid-line and the bottom edge, trailing the
          // cut only while the pane is really fast (> 400 px/frame), never on the landing frame
          if (vel > 400) {
            const sm = Math.min(vel * 0.8, 520), r = h / TS, xe = p.dir > 0 ? xl : xr;
            g.strokeStyle = B.rgba(C.amber, 0.7); g.lineWidth = 1.5; g.lineCap = 'butt';
            g.beginPath();
            [[xe + r, cy - h + 0.75, 1], [xe, cy, 0.62], [xe - r, cy + h - 0.75, 0.82]].forEach(([x, y, f]) => { g.moveTo(x, y); g.lineTo(x - p.dir * sm * f, y); });
            g.stroke();
          }
          // fill (light on the merge impact and on the hairline)
          const flash = merged ? Math.max(0, 1 - (lt - MERGE) / (2 / FPS)) : 0;
          g.fillStyle = cl > 0.85 || flash > 0.5 ? C.amberLight : C.amber;
          g.beginPath(); poly(g, xl, xr, cy, h); g.fill();
          if (co >= 1) { p.clip.style.display = 'none'; return; }

          // content inside the pane (clipped)
          g.save();
          g.beginPath(); poly(g, xl, xr, cy, h); g.clip();
          const age = lt - p.at;
          // motif (faint under the type, full at the right end; flares on landing)
          const mk = (0.15 + 0.12 * Math.max(0, 1 - age / 0.15)) * (1 - co);
          // pictogram: plots left to right (8 f), rides the type's parallax; the motif keeps a plate clear around it
          const tx = textX(lt, p);
          if (mk > 0.005) motif(g, p, ox, cy, age, lt, mk, PICT_X + ox + tx * 0.6);
          const pp = expoOut((age - 2 / FPS) / (8 / FPS));
          if (pp > 0 && co < 1) {
            g.save();
            g.translate(PICT_X + ox + tx * 0.6, cy + 200 * co);
            g.beginPath(); g.rect(-130, -100, 260 * pp, 200); g.clip();
            pict(g, p, lt);
            g.restore();
          }
          // token: charcoal disc, amber initials (pops on 2 f)
          const ts = backOut((age - 2 / FPS) / (8 / FPS)) * (1 - co);
          if (ts > 0.01) {
            g.save();
            g.translate(TOK_X + ox + tx, cy); g.scale(ts, ts);
            g.strokeStyle = ink(0.35); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 58, 0, Math.PI * 2); g.stroke();
            g.fillStyle = C.bg; g.beginPath(); g.arc(0, 0, 46, 0, Math.PI * 2); g.fill();
            g.fillStyle = C.amber; g.font = '650 28px "JetBrains Mono Variable"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
            g.fillText(p.tok, 0, 10);
            g.restore();
          }
          // the leading cut edge flashes light on landing
          const ef = Math.max(0, 1 - Math.abs(age - 2 / FPS) / (3 / FPS));
          if (ef > 0) {
            const xe = p.dir > 0 ? xr : xl, r = h / TS;
            g.strokeStyle = B.rgba(C.amberLight, ef); g.lineWidth = 10 * ef + 2;
            g.beginPath(); g.moveTo(xe + r, cy - h); g.lineTo(xe - r, cy + h); g.stroke();
          }
          g.restore();

          // DOM type: clipped to the pane, rides in behind it, drops out on the exit
          p.clip.style.display = '';
          p.clip.style.clipPath = clipCss(xl, xr, cy, h);
          const dy = oy + 200 * co;                       // rides the pane, drops out through its bottom edge
          p.tagEl.style.transform = `translate(${(ox + tx).toFixed(1)}px, ${dy.toFixed(1)}px)`;
          p.jobEl.style.transform = `translate(${(ox + tx * 1.15).toFixed(1)}px, ${dy.toFixed(1)}px)`;
        });
      });
    },
  });
})();
