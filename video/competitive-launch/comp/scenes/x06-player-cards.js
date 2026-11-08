/* x06-player-cards: revision v3 insert (overlay, film 25.0-26.0). Local 0 = 25.0.
 * PLAYER CARDS: the three members s06 has just snapped into the lobby ring, one full-frame card per
 * 10 frames (hard cuts at 25.0 / 25.333 / 25.667), then the hard cut back to s06 at 26.0, exactly on
 * the ATLAS stamp (landing note D5).
 *
 * Every card is the same system, so the eye stays put while the world behind it changes:
 *   - lower-left type block (fixed anchor): 'ATLAS · 0n' tag (mono 22, diamond), the name
 *     (Manrope 650, 180 px, ink), the role (mono 28, amber). The name slides 40 px right-to-left on
 *     a speed ramp (expo.out: most of the move in the first 3 frames, then a slow settle).
 *   - a giant outline monogram (Manrope 700, ~860 px) half off-frame on the right, a different crop
 *     per card; inside the glyph the card's generative pattern burns at full strength, outside it
 *     the same pattern runs at ~15% (pattern-filled type).
 *   - the member's token (amber disc, initials) at the pattern's focus.
 *   - JK sits where s06's lobby ring shows it on the cut in (1162, 662), so the eye stays put across 25.0.
 *   - JULES · rings radiating from the JK token (a fast pulse ring leads them), JK in the J's counter.
 *   - NORA  · segmented vertical bars standing on a floor at y 950 (a 20% amber rule, nothing below it),
 *     pre-charged to 45% on the cut and surging to full by 25.5 (expo.out): the NC glyph fills like a
 *     battery; NC's token rides the tallest bar (the hero bar, a bright spike in the open field left of
 *     the N, so the halo never crosses an outline while it rises).
 *   - EMRE  · a crossing lattice converging on a bridge line (two perspective fans whose vanishing
 *     points sit on the line); the line draws across on the cut; EK stands on it.
 * HUD corners + ticks + slug on every frame. The faint pattern is knocked out of the type block
 * (an elliptical erase plus a feathered rect over x 100-560, y 615-915), so the tag stays legible.
 */
(function () {
  'use strict';
  const ID = 'x06-player-cards';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, FPS = 30;
  const SLUG = 'REALMS · COMPETITIVE · INTERFACE CONCEPT';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const expoOut = (u) => (u >= 1 ? 1 : u <= 0 ? 0 : 1 - Math.pow(2, -10 * u));
  const p3o = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const MONO_FONT = (px) => `700 ${px}px "Manrope Variable"`;
  const PAD = 140;                                    // mask canvas margin (monogram drift)

  const CARDS = [
    { name: 'Jules', role: 'COORDINATION', n: '01', mono: 'JK', pat: 'rings', mx: 1130, my: 905, ms: 880, tok: [1162, 662] },
    { name: 'Nora', role: 'POWER SYSTEMS', n: '02', mono: 'NC', pat: 'bars', mx: 930, my: 905, ms: 880, tok: [825, 250] },
    // the E whole (all three arms in frame, glyph ~325-1045), the K half off-frame; the bridge line at 540
    // crosses the E's stem between the top and middle arms, EK sits on it centred in the upper counter
    { name: 'Emre', role: 'CROSSING', n: '03', mono: 'EK', pat: 'hatch', mx: 1000, my: 1045, ms: 980, tok: [1336, 540] },
  ];

  Film.scene({
    id: ID,
    duration: 1,
    build(ctx) {
      const { root } = ctx;
      ctx.css(`
        [data-scene="${ID}"] .x06-ground { position:absolute; inset:0; background:${C.bg}; }
        [data-scene="${ID}"] .x06-card { position:absolute; left:0; top:0; width:${W}px; height:${H}px; display:none; }
        [data-scene="${ID}"] .x06-tag { position:absolute; left:122px; top:640px; display:flex; align-items:center; gap:14px; font: 500 22px/22px var(--mono); letter-spacing:.16em; color:${C.muted}; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .x06-tag .dia { width:11px; height:11px; background:${C.amber}; transform:rotate(45deg); flex:none; }
        [data-scene="${ID}"] .x06-name { position:absolute; left:112px; top:652px; font: 650 180px/1 var(--display); letter-spacing:-0.055em; color:${C.ink}; white-space:pre; }
        [data-scene="${ID}"] .x06-role { position:absolute; left:122px; top:880px; font: 500 28px/28px var(--mono); letter-spacing:.16em; color:${C.amber}; text-transform:uppercase; white-space:pre; }
        [data-scene="${ID}"] .x06-slug { position:absolute; left:120px; top:990px; font: 500 20px/20px var(--mono); letter-spacing:.12em; color:${C.muted3}; text-transform:uppercase; white-space:pre; }
      `);
      ctx.el('div', 'x06-ground', root);
      const { canvas, g } = ctx.canvas();
      void canvas;
      const scratch = document.createElement('canvas'); scratch.width = W; scratch.height = H;
      const sg = scratch.getContext('2d');

      // ---- per-card masks: the monogram filled white, once ----
      const masks = CARDS.map((cd) => {
        const m = document.createElement('canvas'); m.width = W + 2 * PAD; m.height = H + 2 * PAD;
        const mg = m.getContext('2d');
        mg.font = MONO_FONT(cd.ms); mg.textBaseline = 'alphabetic'; mg.fillStyle = '#fff';
        mg.fillText(cd.mono, cd.mx + PAD, cd.my + PAD);
        return m;
      });
      // screen box of each monogram (plus the drift), clamped to the frame
      const BOX = CARDS.map((cd) => {
        g.font = MONO_FONT(cd.ms);
        const mt = g.measureText(cd.mono);
        const x0 = Math.max(0, Math.floor(cd.mx - mt.actualBoundingBoxLeft - 40)), x1 = Math.min(W, Math.ceil(cd.mx + mt.actualBoundingBoxRight + 12));
        const y0 = Math.max(0, Math.floor(cd.my - mt.actualBoundingBoxAscent - 12)), y1 = Math.min(H, Math.ceil(cd.my + mt.actualBoundingBoxDescent + 12));
        return [x0, y0, x1 - x0, y1 - y0];
      });

      // ---- tokens + type blocks (DOM/SVG per card) ----
      const sv = ctx.svg('svg', { class: 'brand-svg' });
      const cards = CARDS.map((cd, i) => {
        const el = ctx.el('div', 'x06-card', root);
        const tokG = ctx.svg('g', { style: 'display:none' }, sv);
        const halo = ctx.svg('circle', { r: 50, fill: 'none', stroke: C.amber, 'stroke-opacity': 0.45, 'stroke-width': 2 }, tokG);
        ctx.svg('circle', { r: 36, fill: C.amber }, tokG);
        ctx.svg('text', { y: 9, 'text-anchor': 'middle', fill: '#1b140a', style: 'font: 650 25px "JetBrains Mono Variable"; letter-spacing: .02em', text: cd.mono }, tokG);
        const tag = ctx.el('div', 'x06-tag', el, `<span class="dia"></span><span>ATLAS · ${cd.n}</span>`);
        const name = ctx.el('div', 'x06-name', el, cd.name);
        const role = ctx.el('div', 'x06-role', el, cd.role);
        return { cd, el, tokG, halo, tag, name, role, i };
      });
      // HUD above everything
      B.hud(ctx, { inset: 72, tc: false, drawIn: false, slug: '', ticks: true });
      ctx.el('div', 'x06-slug', root, SLUG);

      // ---- generative patterns: draw(g, u, strength) where u = 0..1 through the card ----
      const amb = (a) => B.rgba(C.amber, a), ambL = (a) => B.rgba(C.amberLight, a);
      // JULES: rings radiating from the token
      // strokes are batched by (alpha, width) bucket: one path per bucket keeps the raster cost low
      function batched(c, items) {
        const groups = new Map();
        for (const it of items) {
          const a = Math.round(it.a * 40) / 40;
          if (a <= 0.004) continue;
          const key = a + '|' + it.w;
          let gr = groups.get(key); if (!gr) { gr = { a, w: it.w, list: [] }; groups.set(key, gr); }
          gr.list.push(it);
        }
        for (const gr of groups.values()) {
          c.strokeStyle = amb(gr.a); c.lineWidth = gr.w;
          c.beginPath();
          for (const it of gr.list) it.path(c);
          c.stroke();
        }
      }
      function rings(c, u, k, cd) {
        const [cx, cy] = cd.tok;
        const sp = 30;
        const ph = sp * 2.2 * expoOut(u * 1.1);               // speed ramp: two spacings in ~4 frames, then a drift
        const rMax = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy)) + 4;
        const items = [];
        for (let i = 0; i < 80; i++) {
          const r = 54 + i * sp + ph;
          if (r > rMax) break;
          const fall = clamp(1.15 - r / 1700, 0.18, 1);
          const idx = (i % 4) === 0;
          items.push({ a: (idx ? 0.95 : 0.55) * fall * k, w: idx ? 2.6 : 1.4, path: (q) => { q.moveTo(cx + r, cy); q.arc(cx, cy, r, 0, Math.PI * 2); } });
        }
        batched(c, items);
        // the leading pulse ring: fast, bright, decaying
        const pr = 60 + 1500 * p3o(u * 1.25);
        c.strokeStyle = ambL(0.9 * k * (1 - clamp(u * 1.1, 0, 1)));
        c.lineWidth = 5;
        c.beginPath(); c.arc(cx, cy, pr, 0, Math.PI * 2); c.stroke();
      }
      // NORA: segmented bars charging upward (left to right)
      const nzB = ctx.noise2D('x06-bars');
      const NB = 64, PITCH = W / NB, BW = 13, SEG = 15, GAPH = 5;
      const FLOOR = 950;                                    // the bars stand here: nothing drawn below it
      const BMAX = 590;                                     // the field tops out at y 360 (glyph ~86% full)
      const BH = Array.from({ length: NB }, (_, i) => {
        const x = i / NB;
        const env = 0.35 + 0.6 * Math.exp(-((x - 0.72) ** 2) / 0.05);   // tallest toward the right, behind NC
        return clamp(env + 0.18 * nzB(i * 0.31, 3.7), 0.12, 0.8) / 0.8 * BMAX;
      });
      // the hero bar: in the open field left of the N (its column never meets an outline as NC rises, which
      // any column inside the N would: the diagonal crosses them all); a spike above the field, NC on its cap
      const tallest = Math.round((CARDS[1].tok[0] - PITCH / 2) / PITCH);
      BH[tallest] = FLOOR - CARDS[1].tok[1] - 50;
      const barX = (i) => i * PITCH + (PITCH - BW) / 2;
      // pre-charged: 45% on the cut, then a surge to full over the first half of the card (25.333-25.5)
      const barLevel = (i, u) => BH[i] * (0.45 + 0.55 * expoOut((u - i * 0.0015) / 0.5));
      function bars(c, u, k) {
        for (let i = 0; i < NB; i++) {
          const h = barLevel(i, u);
          const x = barX(i);
          const hero = i === tallest;
          c.fillStyle = amb(hero ? Math.max(0.85, k) : 0.7 * k);
          c.fillRect(x, FLOOR - h, BW, h);
          c.fillStyle = ambL(hero ? 1 : k);
          c.fillRect(x, FLOOR - h, BW, SEG);               // the charging cap
        }
        // segment gaps: cut horizontal slots (the cells of a battery), counted up from the floor
        c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
        for (let y = FLOOR - SEG; y > -SEG; y -= SEG + GAPH) c.fillRect(0, y - GAPH, W, GAPH);
        c.restore();
        // the floor rule
        c.fillStyle = amb(0.2); c.fillRect(0, FLOOR, W, 1);
      }
      // EMRE: crossing lattice converging on a bridge line
      const YB = 540, VCX = 1380, VA = 420;
      function hatch(c, u, k) {
        const ph = 120 * expoOut(u * 1.15);                   // the lattice flows toward the line
        const S = 96;
        const items = [];
        for (const vx of [VCX - VA, VCX + VA]) {
          for (const edgeY of [H + 40, -40]) {
            for (let j = -30; j <= 30; j++) {
              const xb = VCX + j * S + (edgeY > 0 ? ph : -ph) * (vx > VCX ? 1 : -1);
              const dist = Math.abs(xb - vx);
              const idx = j % 4 === 0;
              const a = clamp(1 - dist / 2600, 0.15, 1) * (idx ? 1 : 0.6);
              // lines stop just short of the bridge line: the fans converge on it without a hot spot
              const x0 = lerp(vx, xb, 0.035), y0 = lerp(YB, edgeY, 0.035);
              items.push({ a: a * k, w: idx ? 2.4 : 1.3, path: (q) => { q.moveTo(x0, y0); q.lineTo(xb, edgeY); } });
            }
          }
        }
        batched(c, items);
      }
      // the bridge line (drawn on top, not masked): shoots out both ways from EK on the cut
      function bridge(c, u, x0) {
        const L = lerp(240, 2100, expoOut(u * 2.6));
        c.save();
        c.strokeStyle = ambL(0.22); c.lineWidth = 14; c.beginPath(); c.moveTo(x0 - L, YB); c.lineTo(x0 + L, YB); c.stroke();
        c.strokeStyle = C.amberLight; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 - L, YB); c.lineTo(x0 + L, YB); c.stroke();
        c.restore();
      }
      const PAT = { rings, bars, hatch };
      // feathered knockout of the type block (x 100-560, y 615-915, ~40 px feather), drawn once
      const KO = document.createElement('canvas'); KO.width = W; KO.height = H;
      { const kg = KO.getContext('2d'); kg.filter = 'blur(12px)'; kg.fillStyle = '#000'; kg.fillRect(80, 595, 500, 340); }
      const SCRIM = g.createRadialGradient(0, 0, 0, 0, 0, 300);
      SCRIM.addColorStop(0, 'rgba(0,0,0,0.88)'); SCRIM.addColorStop(0.6, 'rgba(0,0,0,0.8)'); SCRIM.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.onFrame((lt) => {
        const fr = Math.round(lt * FPS);                       // cards are 10 frames each
        const ci = Math.min(2, Math.floor(fr / 10));
        const u = clamp((lt - ci / 3) * 3, 0, 1);
        const fk = fr - ci * 10;                               // frame inside the card
        const cd = CARDS[ci];
        // card visibility
        cards.forEach((c, i) => {
          const d = i === ci ? 'block' : 'none';
          if (c.el.style.display !== d) c.el.style.display = d;
          c.tokG.style.display = i === ci ? '' : 'none';
        });
        const cur = cards[ci];
        // type block: the name slides 40 px right-to-left on a speed ramp; tag and role trail it by 0.5 / 0.75
        const sl = 40 * (1 - expoOut(u * 1.15));
        cur.name.style.transform = `translateX(${sl.toFixed(2)}px)`;
        cur.tag.style.transform = `translateX(${(sl * 0.5).toFixed(2)}px)`;
        cur.role.style.transform = `translateX(${(sl * 0.75).toFixed(2)}px)`;
        // the monogram drifts the other way (parallax)
        const mdx = -26 * (1 - expoOut(u * 1.15));

        // ---- pattern: faint everywhere, full strength inside the monogram ----
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, W, H);
        const draw = PAT[cd.pat];
        // on each cut the whole pattern flares, then settles to its faint level within 3 frames
        const flare = (cd.pat === 'hatch' ? 0.22 : 0.4) * Math.max(0, 1 - fk / 3);
        draw(g, u, (cd.pat === 'hatch' ? 0.24 : 0.15) + flare, cd);
        // keep the type block clean: a soft elliptical erase of the faint pattern behind it
        g.save();
        g.globalCompositeOperation = 'destination-out';
        g.translate(360, 850); g.scale(1.75, 1);
        g.fillStyle = SCRIM; g.fillRect(-420, -330, 840, 660);
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.drawImage(KO, 0, 0);
        g.restore();
        // full-strength pass only inside the monogram's box, masked by the glyph
        const bb = BOX[ci];
        sg.save();
        sg.beginPath(); sg.rect(bb[0], bb[1], bb[2], bb[3]); sg.clip();
        sg.clearRect(bb[0], bb[1], bb[2], bb[3]);
        draw(sg, u, 0.92, cd);
        sg.globalCompositeOperation = 'destination-in';
        sg.drawImage(masks[ci], bb[0] + PAD - mdx, bb[1] + PAD, bb[2], bb[3], bb[0], bb[1], bb[2], bb[3]);
        sg.restore();
        g.drawImage(scratch, bb[0], bb[1], bb[2], bb[3], bb[0], bb[1], bb[2], bb[3]);
        // outline of the monogram
        g.font = MONO_FONT(cd.ms); g.textBaseline = 'alphabetic';
        g.lineJoin = 'round';
        g.strokeStyle = B.rgba(C.amber, 0.9); g.lineWidth = 2.5;
        g.strokeText(cd.mono, cd.mx + mdx, cd.my);
        if (cd.pat === 'hatch') bridge(g, u, cd.tok[0]);

        // ---- token at the pattern's focus ----
        let tx = cd.tok[0], ty = cd.tok[1];
        if (cd.pat === 'bars') { tx = barX(tallest) + BW / 2; ty = FLOOR - barLevel(tallest, u) - 50; }
        cur.tokG.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)})`);
        cur.halo.setAttribute('r', (50 + 16 * expoOut(u * 1.4)).toFixed(2));
        cur.halo.setAttribute('stroke-opacity', (0.5 * (1 - u * 0.6)).toFixed(3));
      });
    },
  });
})();
