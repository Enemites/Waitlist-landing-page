/* c07c-adapt (film 48.0-52.0, local 0 = 48.0): ADAPT, in the middle of the drop.
 * The STORM CITY again (comp/lib/world-city.js, as in c05b-split), closer, north of the river, on an
 * isometric orbit. Our plan (amber) runs from the east bridge up the quay avenue and west to the landmark
 * (the objective). Vega's move: a red-orange wave blacks out the QUAY EAST district block by block; our
 * route breaks where it crossed it, then redraws around it, and the lights come back along the new route.
 *
 *   0.00  hard cut: camera whips in (yaw 4 -> 26, zoom 2.5 -> 1.85, expo.out 0.5 s), the plan already drawn.
 *   0.30  'Adapt.' slams up out of its mask (Manrope 620, 300 px, ink, amber stop).
 *   0.50  the Vega pillar pops; the wave leaves it (900 units/s), killing the district block by block (each
 *         block flashes red-orange, flickers, dies; lamps die with it).
 *   0.78  the front reaches our route: it breaks (red cut marks at both ends, the stretch jitters and dims),
 *         camera shake; the word is sliced on the slant (red ghost) for 0.27 s; label GRID DOWN.
 *   1.05  the word snaps back together; the new route draws around the dark district (power3.inOut,
 *         lands 1.9): every building and lamp along it comes back on with an amber flare. Label REROUTE.
 *   1.90  it reaches the objective: the ring pings; a convoy of three amber lights runs the new route.
 *   2.50  lightning on the landmark (flash + bolt).
 *   3.55-4.0  speed ramp: push in on the landmark crown + orbit (expo.in), the word drops out.
 */
(function () {
  'use strict';
  const ID = 'c07c-adapt';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const MONO = '"JetBrains Mono Variable", monospace';
  const T_WORD = 0.3, T_WAVE = 0.5, T_BREAK = 0.78, T_RE = 1.05, T_DOCK = 1.3, T_ARRIVE = 1.9, T_STRIKE = 2.5, T_OUT = 3.55;

  Film.scene({
    id: ID,
    duration: 4,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`[data-scene="${ID}"] { background: ${C.bg}; }
        [data-scene="${ID}"] .c7-word { position:absolute; left:104px; top:0; width:1100px; height:330px; transform-origin: 0 0; }
        [data-scene="${ID}"] .c7-l { position:absolute; left:0; top:0; font: 620 292px/1 var(--display); letter-spacing:-0.055em; color:${C.ink}; white-space:nowrap; text-shadow: 0 0 40px rgba(11,12,14,.55); }
        [data-scene="${ID}"] .c7-l .ch { display:inline-block; transform-origin: 50% 80%; }
        [data-scene="${ID}"] .c7-l .st { color:${C.amber}; }
        [data-scene="${ID}"] .c7-l.ghost { color:${C.rival}; text-shadow:none; }
        [data-scene="${ID}"] .c7-l.ghost .st { color:${C.rival}; }
        [data-scene="${ID}"] .c7-eb { position:absolute; left:120px; top:836px; display:flex; align-items:center; gap:14px; font: 600 22px/1 var(--mono); letter-spacing:.14em; color:${C.bone}; white-space:pre; text-shadow: 0 0 8px rgba(11,12,14,.95), 0 0 18px rgba(11,12,14,.9); }
        [data-scene="${ID}"] .c7-eb i { width:12px; height:12px; background:${C.amber}; transform: rotate(45deg); display:block; }`);

      const city = WorldCity.create(ctx, {
        cam: { tx: 90, ty: -96, zoom: 1.85, yaw: 26, pitch: 41 },
        strikes: [{ t: T_STRIKE, x: -80, y: -202, z: 440, k: 1.1 }],
        look: { rain: 1.35, fog: 0.45, power: 0.6 },
        rainSeed: 'c07c',
      });
      const M = city.M, sx = M.streetX, sy = M.streetY, OB = M.POINTS.objective;
      city.district('farnorth').lit = 0.5;

      // ---- camera: whip in, orbit, speed-ramp push at the end ----
      tl.fromTo(city.cam, { yaw: 4, zoom: 2.5, tx: 150 }, { yaw: 26, zoom: 1.85, tx: 90, duration: 0.5, ease: 'expo.out' }, 0);
      tl.to(city.cam, { yaw: 44, zoom: 1.95, tx: 60, ty: -110, duration: T_OUT - 0.5, ease: 'none' }, 0.5);
      tl.to(city.cam, { yaw: 60, zoom: 3.4, tx: OB[0] + 10, ty: OB[1] + 10, sy: 260, duration: 4 - T_OUT, ease: 'expo.in' }, T_OUT);
      tl.fromTo(city.cam, { shake: 0 }, { shake: 7, duration: 0.04, ease: 'none', immediateRender: false }, T_BREAK);
      tl.to(city.cam, { shake: 0, duration: 0.3, ease: 'power2.out' }, T_BREAK + 0.04);
      tl.fromTo(city.cam, { pitch: 41 }, { pitch: 46, duration: 4, ease: 'sine.inOut' }, 0);

      // ---- our plan (already drawn on the cut) ----
      const bridgeN = M.riverY(sx(11)) - 64;
      const plan = city.route({ color: C.amber, light: C.amberLight, width: 4.5, pts: [[sx(11), sy(11) - 10], [sx(11), sy(8)], [sx(9), sy(8)], [sx(9), OB[1]]] });
      plan.p.draw = 1;
      // the stretch inside QUAY EAST: from the bridge's north end to where the route leaves the district
      const dq = M.DISTRICTS.findIndex((d) => d.name === 'quay-east');
      const inQ = (x, y) => { const c = M.cellAt(clamp(Math.floor((x - M.ORG) / M.P), 0, M.N - 1), clamp(Math.floor((y - M.ORG) / M.P), 0, M.N - 1)); return c.district === dq; };
      let u0 = -1, u1 = -1;
      plan.pts.forEach((p, i) => { if (p[1] < bridgeN && inQ(p[0], p[1])) { const u = plan.cum[i] / plan.L; if (u0 < 0) u0 = u; u1 = u; } });
      u0 = Math.max(0, u0 - 0.01); u1 = Math.min(1, u1 + 0.03);
      plan.p.cut0 = u0; plan.p.cut1 = u1;
      tl.fromTo(plan.p, { cutA: 0 }, { cutA: 1, duration: 0.22, ease: 'power2.out' }, T_BREAK);
      tl.to(plan.p, { head: 0.4, duration: 0.3, ease: 'power2.out' }, T_BREAK);
      // the new route: from the break, west along the quay, north on the avenue, into the objective
      const p0 = plan.at(u0);
      const detour = city.route({ color: C.amber, light: C.amberLight, width: 4.5, round: 20, pts: [p0, [sx(11), sy(9)], [sx(9), sy(9)], [sx(9), sy(8) - 30], [sx(9), OB[1]]] });
      tl.fromTo(detour.p, { draw: 0 }, { draw: 1, duration: T_ARRIVE - T_RE, ease: 'power3.inOut' }, T_RE);
      city.relight(detour, { radius: 62 });
      // the old route's tail beyond the cut (to the objective) fades: the new route owns the arrival
      tl.to(plan.p, { arrowA: 0, duration: 0.15, ease: 'none' }, T_BREAK);
      tl.to(plan.p, { draw: u1, duration: 0.45, ease: 'power2.in' }, T_RE + 0.2);

      // ---- Vega's move: the wave ----
      const VX = 590, VY = -150;
      const vm = city.marker({ kind: 'vega', x: VX, y: VY, h: 80 });
      const vr = city.marker({ kind: 'start', x: VX, y: VY, r: 20, color: C.rival });
      tl.fromTo(vm, { grow: 0, a: 0 }, { grow: 1, a: 1, duration: 0.3, ease: 'expo.out' }, T_WAVE - 0.12);
      tl.fromTo(vr, { ring: 0, a: 0 }, { ring: 1, a: 1, duration: 0.3, ease: 'back.out(2)' }, T_WAVE - 0.12);
      tl.fromTo(vr, { pulse: 0 }, { pulse: 1, duration: 0.6, ease: 'none' }, T_WAVE);
      city.wave({ district: 'quay-east', x: VX, y: VY, t0: T_WAVE, speed: 900, color: C.rival });

      // ---- objective ----
      const ob = city.marker({ kind: 'objective', x: OB[0], y: OB[1], r: 36, h: 0, color: C.bone });
      tl.fromTo(ob, { pulse: 0 }, { pulse: 1, duration: 0.9, ease: 'none', immediateRender: false }, T_ARRIVE);

      // ---- convoy (three amber lights running the new route) + labels, drawn into the city canvas ----
      const conv = { u: 0, a: 0 };
      tl.fromTo(conv, { u: 0, a: 0 }, { u: 0.92, a: 1, duration: 4 - T_ARRIVE + 0.2, ease: 'power1.inOut' }, T_ARRIVE - 0.2);
      const lab = { grid: 0, re: 0 };
      tl.fromTo(lab, { grid: 0 }, { grid: 1, duration: 0.35, ease: 'power2.out' }, T_BREAK + 0.05);
      tl.fromTo(lab, { re: 0 }, { re: 1, duration: 0.4, ease: 'power2.out' }, T_RE + 0.25);
      tl.to(lab, { grid: 0, re: 0, duration: 0.2, ease: 'none' }, T_OUT);
      const label = (g, text, x, y, col, u, alignRight) => {
        if (u <= 0.001) return;
        const s = B.scrambleFrame('', text, clamp(u * 1.3, 0, 1), { time: u * 0.4 });
        g.font = `500 22px ${MONO}`; g.letterSpacing = '2.8px';
        const tw = g.measureText(text).width, tx = alignRight ? x - tw : x;
        g.globalAlpha = clamp(u * 2, 0, 1);
        g.fillStyle = 'rgba(11,12,14,0.75)'; g.fillRect(tx - 10, y - 24, tw + 20, 34);
        g.fillStyle = col; g.fillRect(tx - 10, y - 24, 3, 34);
        g.fillText(s, tx, y);
        g.globalAlpha = 1;
      };
      city.draw((g, lt) => {
        g.setTransform(1, 0, 0, 1, 0, 0);
        if (conv.a > 0.01) {
          g.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 3; k++) {
            const u = conv.u - k * 0.06; if (u <= 0.005) continue;
            const [x, y] = detour.at(u), [px, py] = city.toScreen(x, y, 3);
            const R = 26, gr = g.createRadialGradient(px, py, 0, px, py, R);
            gr.addColorStop(0, B.rgba(C.amberLight, 0.9 * conv.a)); gr.addColorStop(0.3, B.rgba(C.amber, 0.35 * conv.a)); gr.addColorStop(1, B.rgba(C.amber, 0));
            g.fillStyle = gr; g.fillRect(px - R, py - R, 2 * R, 2 * R);
          }
          g.globalCompositeOperation = 'source-over';
          for (let k = 0; k < 3; k++) {
            const u = conv.u - k * 0.06; if (u <= 0.005) continue;
            const [x, y] = detour.at(u), [px, py] = city.toScreen(x, y, 3);
            g.beginPath(); g.arc(px, py, 4.2, 0, Math.PI * 2); g.fillStyle = B.rgba(C.ink, conv.a); g.fill();
          }
        }
        const [gx, gy] = city.toScreen(sx(11) + 150, sy(9) - 150, 0);
        label(g, 'GRID DOWN · QUAY EAST', gx, gy, C.rival, lab.grid, false);
        const [rx, ry] = city.toScreen(sx(9), sy(9), 0);
        label(g, 'REROUTE', rx - 40, ry + 70, C.amber, lab.re, true);
      });

      // ---- the word (the MAKE YOUR MOVE set, as c07a / c07b: 292 px slam, docks to 120 px under the label) ----
      const word = ctx.el('div', 'c7-word', root);
      const layer = (cls) => { const el = ctx.el('div', cls, word); const chs = 'Adapt'.split('').map((c) => ctx.el('span', 'ch', el, c)); chs.push(ctx.el('span', 'ch st', el, '.')); return { el, chs }; };
      const ghost = layer('c7-l ghost'), top = layer('c7-l'), bot = layer('c7-l');
      gsap.set(word, { x: 0, y: 676, scale: 1 });
      for (const Ly of [ghost, top, bot]) tl.fromTo(Ly.chs, { yPercent: -16, scale: 1.34, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'expo.out', stagger: 0.018 }, T_WORD - 0.04);
      tl.to(word, { scale: 120 / 292, x: 16, y: 884, duration: 0.6, ease: 'expo.inOut' }, T_DOCK);
      const eb = ctx.el('div', 'c7-eb', root, '<i></i><span></span>');
      tl.fromTo(eb, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, T_DOCK + 0.4);
      B.scrambleTo(tl, eb.querySelector('span'), 'MAKE YOUR MOVE · 03 / 03', T_DOCK + 0.4, 0.5);
      tl.to([word, eb], { x: '-=700', opacity: 0, duration: 0.4, ease: 'expo.in' }, T_OUT + 0.02);
      B.hud(ctx, { inset: 64, color: C.bone, tc: false, slug: '', drawIn: true, at: 0.05, ticks: true, alpha: 0.55, out: T_OUT + 0.1 });
      // the hit: the word is sliced on the brand slant (top piece left, bottom piece right, a red-orange ghost),
      // then snaps back together as the new route starts
      const TS = Math.tan((B.SLANT || 34) * Math.PI / 180);
      const cutY = (x) => 178 - (x - 400) * TS * 0.42;
      const poly = (above) => {
        const pts = [-40, 1200].map((x) => `${x}px ${cutY(x).toFixed(1)}px`);
        return above ? `polygon(-40px -60px, 1200px -60px, ${pts[1]}, ${pts[0]})` : `polygon(${pts[0]}, ${pts[1]}, 1200px 420px, -40px 420px)`;
      };
      const gl = { k: 0 };
      tl.fromTo(gl, { k: 0 }, { k: 1, duration: 0.05, ease: 'none', immediateRender: false }, T_BREAK);
      tl.to(gl, { k: 0, duration: 0.22, ease: 'expo.out' }, T_RE);
      ctx.onFrame((lt) => {
        const k = gl.k, on = k > 0.002;
        // whole word in one layer when not sliced (no seam between the pieces)
        top.el.style.clipPath = on ? poly(true) : 'none';
        bot.el.style.display = on ? '' : 'none';
        const f = Math.floor(lt * 30);
        const j = on ? (((f * 7919) % 13) / 13 - 0.5) * 10 * k : 0;
        top.el.style.transform = on ? `translate(${(-30 * k + j).toFixed(1)}px, ${(-6 * k).toFixed(1)}px)` : '';
        bot.el.style.clipPath = poly(false);
        bot.el.style.transform = on ? `translate(${(22 * k - j * 0.5).toFixed(1)}px, ${(4 * k).toFixed(1)}px)` : '';
        ghost.el.style.display = on ? '' : 'none';
        ghost.el.style.opacity = (0.85 * k).toFixed(3);
        ghost.el.style.transform = `translate(${(14 * k + j).toFixed(1)}px, 0px)`;
      });
    },
  });
})();
