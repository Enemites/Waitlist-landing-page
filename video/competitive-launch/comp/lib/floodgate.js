/* Floodgate: the example Competitive match (design/screen-compositions/competitive.html and
 * public/assets/realms/screens/competitive-main-2000.webp), rebuilt as a live, animatable world.
 *
 *   const F = Floodgate.world(ctx, { scale: 1.5, state: { zoom: 0.8 } })
 *     F.T            Brand.terrain handle (camera state, spots, toScreen, move)
 *     F.svg, F.g     full-frame SVG + world group (product coordinates x scale, follows camera)
 *     F.P            named points in WORLD coordinates (gate, pump, crossing, nc, jk, ek, vega1, vega2, ghost ...)
 *     F.el           handles: gate, ring (objective progress arc), pump, conduit, crossing, cone,
 *                    tokens { nc, jk, ek }, vega [v1, v2], ghost, labels { ... }
 *     F.progress     proxy { v } 0..1 for the objective ring (tween it; drawn every frame)
 *     F.reveal(at)   default build-on: terrain reveal + marks pop in sequence
 *
 *   Floodgate.ui(ctx, o) builds the screen chrome as DOM, each piece separately animatable:
 *     topbar, score (with live clock), roster (3 members), channel (messages, pinned plan,
 *     compose), objective (progress bar + warning). Returns handles; nothing animates unless
 *     you call the returned helpers (enter(at), typeMessage(i, at), ...).
 *
 * World coordinates: the product composition is 1600x1000; world = product x scale.
 */
(function () {
  'use strict';
  const B = Brand, C = Brand.C;
  const RIVER = [[1640, 60], [1380, 190], [1190, 262], [1030, 372], [900, 460], [800, 560], [690, 636], [530, 680], [360, 770], [140, 830], [-40, 900]];
  const PAL = { low: '#211c15', high: '#4a3c2a', water: '#0b0f10', waterShallow: '#18211f', coast: 'rgba(232,200,138,.72)', seaLine: 'rgba(159,176,162,.15)', line: '#efbd70', bright: '#f6d39f' };

  function world(ctx, o) {
    o = Object.assign({ scale: 1.5, seed: 58, labels: true }, o || {});
    const S = o.scale;
    const n = Film.utils.noise2D(o.seed);
    const height = (X, Y) => {
      const x = X / S, y = Y / S;
      const nn = n.fbm(x / 230, y / 230, 5);
      const d = B.distToPath(x, y, RIVER);
      const river = 0.62 * Math.exp(-((d / (58 + 18 * nn)) ** 2));
      return 0.36 + 0.2 * nn - river
        + B.gauss(x, y, 380, 320, 170, 0.42) + B.gauss(x, y, 1260, 690, 190, 0.48)
        + B.gauss(x, y, 1380, 360, 110, 0.25) + B.gauss(x, y, 300, 760, 120, 0.15);
    };
    const T = B.terrain(ctx, Object.assign({
      seed: 'floodgate-' + o.seed, w: 1600 * S, h: 1000 * S, cell: 5, step: 0.06, sea: 0.18, palette: PAL, height,
      state: Object.assign({ cx: 800 * S, cy: 520 * S, zoom: 1920 / (1600 * S) * 1.0 }, o.state || {}),
    }, o.terrain || {}));
    const p = (x, y) => [x * S, y * S];
    const P = {
      gate: p(800, 560), pump: p(562, 399), crossing: p(1004, 396), nc: p(562, 440), jk: p(684, 484), ek: p(920, 420),
      vega1: p(1118, 342), vega2: p(1140, 524), ghost: p(1060, 640), river: RIVER.map(([x, y]) => p(x, y)),
      atlasBank: p(560, 420), vegaBank: p(1180, 560),
    };

    const svg = ctx.svg('svg', { class: 'brand-svg floodgate-marks' }, o.parent);
    const g = T.group(svg);
    const wg = ctx.svg('g', { transform: `scale(${S})` }, g); // product coordinates inside
    const mono = (sz, w) => `font: ${w || 600} ${sz}px var(--mono); letter-spacing: .08em`;
    const el = { tokens: {}, labels: {} };

    // Fog over the far bank (Vega's side only partly known)
    const fogId = ctx.id + '-fg-fog';
    const fdefs = ctx.svg('defs', {}, wg);
    const rg = ctx.svg('radialGradient', { id: fogId, cx: 0.5, cy: 0.5, r: 0.5 }, fdefs);
    ctx.svg('stop', { offset: '0%', 'stop-color': C.map, 'stop-opacity': 0.82 }, rg);
    ctx.svg('stop', { offset: '100%', 'stop-color': C.map, 'stop-opacity': 0 }, rg);
    el.fog = ctx.svg('ellipse', { cx: 1470, cy: 620, rx: 900, ry: 700, fill: `url(#${fogId})` }, wg);

    // Conduit pump -> gate (dotted)
    el.conduit = ctx.svg('path', { d: 'M594 399C640 420 690 470 760 540', fill: 'none', stroke: C.amber, 'stroke-opacity': 0.6, 'stroke-width': 2, 'stroke-dasharray': '3 6' }, wg);
    // power flows along the conduit toward the gate (dash offset is a pure function of time)
    const flow = { rate: 14 };
    ctx.onFrame((lt) => el.conduit.setAttribute('stroke-dashoffset', (-lt * flow.rate).toFixed(2)));
    // Pump station
    el.pump = ctx.svg('rect', { x: 530, y: 376, width: 64, height: 46, rx: 4, fill: '#2a2219', stroke: C.amber, 'stroke-opacity': 0.8, 'stroke-width': 1.5 }, wg);
    // Floodgate (rotated) + objective ring
    el.gate = ctx.svg('g', { transform: 'rotate(-32 800 560)' }, wg);
    ctx.svg('rect', { x: 742, y: 548, width: 116, height: 24, rx: 3, fill: '#2a2219', stroke: C.amber, 'stroke-width': 1.5 }, el.gate);
    el.gateBars = ctx.svg('path', { d: 'M760 548v24M778 548v24M796 548v24M814 548v24M832 548v24', stroke: C.amber, 'stroke-opacity': 0.5 }, el.gate);
    el.ringTrack = ctx.svg('circle', { cx: 800, cy: 560, r: 64, fill: 'none', stroke: 'rgba(255,255,255,.12)', 'stroke-width': 5 }, wg);
    el.ring = ctx.svg('circle', { cx: 800, cy: 560, r: 64, fill: 'none', stroke: C.amber, 'stroke-width': 5, 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': '0 100', transform: 'rotate(-90 800 560)' }, wg);
    const progress = { v: 0.62, alpha: 1 };
    ctx.onFrame(() => {
      const v = Math.max(0, Math.min(1, progress.v)) * 100;
      el.ring.setAttribute('stroke-dasharray', `${v.toFixed(2)} 100`);
      el.ring.setAttribute('opacity', v < 0.2 ? '0' : String(progress.alpha));
    });
    // Crossing (two lines)
    el.crossing = ctx.svg('path', { d: 'M948 340 1060 440M936 352 1048 452', stroke: '#e6d6b8', 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none' }, wg);
    // Emre's watch cone
    el.cone = ctx.svg('path', { d: 'M920 420 1046 318 1080 372Z', fill: C.amber, 'fill-opacity': 0.12 }, wg);
    // Atlas tokens
    const tok = (key, x, y, txt) => {
      const gg = ctx.svg('g', { transform: `translate(${x} ${y})` }, wg);
      const inner = ctx.svg('g', {}, gg);
      ctx.svg('circle', { r: 17, fill: C.amber }, inner);
      ctx.svg('text', { y: 4, 'text-anchor': 'middle', fill: '#1b140a', style: mono(11), text: txt }, inner);
      el.tokens[key] = gg; el.tokens[key].inner = inner; return gg;
    };
    tok('nc', 562, 440, 'NC'); tok('jk', 684, 484, 'JK'); tok('ek', 920, 420, 'EK');
    // Vega: two seen, one last seen
    const tri = (x, y, op) => { const gg = ctx.svg('g', { transform: `translate(${x} ${y})` }, wg); ctx.svg('path', { d: 'M0 -12l14 24h-28Z', fill: C.rival, 'fill-opacity': op == null ? 1 : op }, gg); return gg; };
    el.vega = [tri(1118, 342), tri(1140, 524)];
    el.ghost = ctx.svg('g', { transform: 'translate(1060 640)' }, wg);
    ctx.svg('circle', { r: 22, fill: 'none', stroke: C.rival, 'stroke-opacity': 0.7, 'stroke-dasharray': '3 5', 'stroke-width': 1.5 }, el.ghost);
    ctx.svg('path', { d: 'M0 -10l9 15h-18Z', fill: C.rival, 'fill-opacity': 0.45 }, el.ghost);
    // Labels (product style: sans label + mono sublabel)
    if (o.labels) {
      const lab = (key, x, y, txt, sub, subAbove) => {
        const gg = ctx.svg('g', {}, wg);
        ctx.svg('text', { x, y, fill: C.ink, style: 'font: 600 15px var(--display); letter-spacing: -0.01em; paint-order: stroke; stroke: #0f0d0a; stroke-width: 4px', text: txt }, gg);
        if (sub) ctx.svg('text', { x, y: subAbove ? y - 18 : y + 18, fill: C.muted2, style: mono(10, 500) + '; paint-order: stroke; stroke: #0f0d0a; stroke-width: 4px', text: sub }, gg);
        el.labels[key] = gg; return gg;
      };
      lab('gate', 760, 476, 'Floodgate', 'OBJECTIVE');
      lab('pump', 512, 362, 'Pump station');
      lab('crossing', 1040, 318, 'Crossing', 'CONTESTED', true);
      el.labels.lastSeen = ctx.svg('text', { x: 1092, y: 684, fill: C.muted2, style: mono(10, 500), text: 'LAST SEEN 0:20' }, wg);
    }

    function reveal(at, opts) {
      opts = Object.assign({ terrain: true }, opts || {});
      const tl = ctx.tl;
      if (opts.terrain) tl.fromTo(T.state, { reveal: 0, revealX: P.gate[0], revealY: P.gate[1] }, { reveal: 1, duration: 1.6, ease: 'power2.inOut' }, at);
      tl.fromTo([el.pump, el.gate, el.crossing], { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'none', stagger: 0.12 }, at + 0.6);
      tl.fromTo(el.conduit, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'none' }, at + 0.9);
      tl.fromTo(progress, { v: 0 }, { v: progress.v, duration: 1.0, ease: 'power3.out' }, at + 1.0);
      tl.fromTo(el.ringTrack, { opacity: 0 }, { opacity: 1, duration: 0.3 }, at + 0.9);
      tl.fromTo(Object.values(el.tokens).map((t) => t.inner), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.45, ease: 'back.out(2)', stagger: 0.1 }, at + 1.1);
      tl.fromTo(el.cone, { opacity: 0 }, { opacity: 1, duration: 0.5 }, at + 1.5);
      tl.fromTo([...el.vega, el.ghost], { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.12 }, at + 1.7);
      if (o.labels) tl.fromTo([...Object.values(el.labels)], { opacity: 0 }, { opacity: 1, duration: 0.35, stagger: 0.06 }, at + 1.2);
      tl.fromTo(el.fog, { opacity: 0 }, { opacity: 1, duration: 1.0 }, at + 0.5);
    }

    return { T, svg, g, wg, P, el, progress, flow, S, reveal, RIVER };
  }

  // ---------------------------------------------------------------------------------------
  // UI chrome (DOM), sized for 1920x1080 (the product shot is 2000x1250; we scale its CSS x1.35
  // so text stays >= 20 px on video). Every piece is absolutely positioned; tweak o.layout.
  // ---------------------------------------------------------------------------------------
  const CSS_ONCE = { done: false };
  function css() {
    if (CSS_ONCE.done) return; CSS_ONCE.done = true;
    const st = document.createElement('style');
    st.textContent = `
      .fg-ui { position:absolute; inset:0; font-family: var(--display); color: ${C.ink}; }
      .fg-ui .mono { font-family: var(--mono); text-transform: uppercase; letter-spacing: .1em; }
      .fg-ui .panel { position:absolute; box-sizing:border-box; background: rgba(13,12,10,.93); border: 1px solid rgba(255,255,255,.09); border-radius: 18px; }
      .fg-topbar { position:absolute; left:48px; top:34px; display:flex; align-items:center; gap:22px; }
      .fg-topbar strong { font: 650 34px/1 var(--display); letter-spacing:-.03em; }
      .fg-topbar i { width:1px; height:30px; background: rgba(255,255,255,.18); }
      .fg-topbar .mono { font-size: 20px; color: ${C.muted2}; }
      .fg-signal { position:absolute; right:48px; top:42px; display:flex; align-items:center; gap:12px; font: 500 20px/1 var(--display); color: ${C.muted2}; }
      .fg-signal i { width:10px; height:10px; border-radius:50%; background: ${C.ok}; }
      .fg-score { position:absolute; left:50%; top:22px; transform: translateX(-50%); display:flex; border:1px solid rgba(255,255,255,.09); border-radius:16px; overflow:hidden; background: rgba(13,12,10,.93); }
      .fg-score .team { display:flex; align-items:center; gap:14px; padding: 14px 26px; font: 600 26px/1 var(--display); }
      .fg-score .team b { font: 600 32px/1 var(--mono); }
      .fg-score .atlas { color:${C.amber}; box-shadow: inset 0 -3px 0 ${C.amber}; }
      .fg-score .vega { color:${C.rival}; box-shadow: inset 0 -3px 0 ${C.rival}; }
      .fg-score .clock { display:grid; place-items:center; padding: 8px 28px; border-inline: 1px solid rgba(255,255,255,.09); }
      .fg-score .clock span { font: 500 15px/1 var(--mono); letter-spacing:.1em; color:${C.muted2}; }
      .fg-score .clock strong { margin-top:5px; font: 600 28px/1 var(--mono); }
      .fg-roster { left:44px; top:150px; width:470px; padding: 28px 30px; }
      .fg-roster h2, .fg-channel h2 { margin:0; display:flex; justify-content:space-between; align-items:center; font: 600 24px/1 var(--display); }
      .fg-roster h2 span, .fg-channel h2 span { font: 500 16px/1 var(--mono); letter-spacing:.1em; color:${C.muted2}; text-transform:uppercase; }
      .fg-member { display:grid; grid-template-columns: 54px 1fr auto; gap: 16px; align-items:center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,.07); }
      .fg-avatar { display:grid; place-items:center; width:54px; height:54px; border-radius:13px; background: rgba(239,189,112,.12); border: 1px solid rgba(239,189,112,.4); color:${C.amber}; font: 600 17px/1 var(--mono); }
      .fg-member strong { display:block; font: 600 22px/1.15 var(--display); }
      .fg-member small { display:block; font: 500 19px/1.3 var(--display); color:${C.muted2}; }
      .fg-state { font: 600 15px/1 var(--mono); letter-spacing:.08em; text-transform:uppercase; padding: 8px 11px; border-radius: 8px; background: rgba(255,255,255,.06); color:${C.ink}; }
      .fg-state.busy { background: rgba(239,189,112,.16); color:${C.amber}; }
      .fg-channel { right:44px; top:150px; width:560px; padding: 28px 30px; }
      .fg-msg { margin-top: 20px; font: 500 21px/1.42 var(--display); }
      .fg-msg b { font-weight: 650; margin-right: 10px; }
      .fg-msg small { font: 500 15px/1 var(--mono); color:${C.muted2}; letter-spacing:.06em; }
      .fg-msg p { margin: 4px 0 0; color: #d8d1c5; }
      .fg-pinned { margin-top: 24px; padding: 18px 22px; border: 1px solid rgba(239,189,112,.36); border-radius: 13px; background: rgba(239,189,112,.06); }
      .fg-pinned .mono { font-size: 15px; color:${C.amber}; }
      .fg-pinned strong { display:block; margin-top: 8px; font: 650 24px/1.2 var(--display); }
      .fg-pinned small { display:block; margin-top: 6px; font: 500 19px/1.2 var(--display); color:${C.muted2}; }
      .fg-compose { display:flex; justify-content:space-between; align-items:center; margin-top: 20px; padding: 15px 20px; border: 1px solid rgba(255,255,255,.08); border-radius: 13px; font: 500 20px/1 var(--display); color:${C.muted2}; }
      .fg-objective { left:50%; bottom: 30px; transform: translateX(-50%); width: 760px; padding: 24px 30px; }
      .fg-objective .row { display:flex; justify-content:space-between; align-items:baseline; }
      .fg-objective .mono { font-size: 16px; color:${C.muted2}; }
      .fg-objective strong { font: 650 26px/1.1 var(--display); }
      .fg-objective b { font: 600 24px/1 var(--mono); color:${C.amber}; }
      .fg-bar { position:relative; height: 8px; margin-top: 16px; border-radius: 4px; background: rgba(255,255,255,.08); overflow:hidden; }
      .fg-bar i { position:absolute; left:0; top:0; bottom:0; width:62%; border-radius:4px; background:${C.amber}; }
      .fg-warn { display:flex; align-items:center; gap: 10px; margin-top: 16px; font: 500 19px/1 var(--display); color: ${C.rivalLight}; }
      .fg-warn i { width: 9px; height: 9px; border-radius: 50%; background: ${C.rival}; }
    `;
    document.head.appendChild(st);
  }

  /**
   * o.parent, o.clock { from: '08:14', at, rate } (counts down from `from` starting at `at`),
   * o.messages (default product messages), o.progress (proxy shared with world.progress)
   */
  function ui(ctx, o) {
    css();
    o = Object.assign({ round: 'ROUND 2', score: [1, 1], clockFrom: 8 * 60 + 14, clockAt: 0, clockRun: true }, o || {});
    const root = ctx.el('div', 'fg-ui', o.parent);
    const topbar = ctx.el('div', 'fg-topbar', root, `<strong>Floodgate</strong><i></i><span class="mono">Team challenge · 3 v 3</span>`);
    const signal = ctx.el('div', 'fg-signal', root, `<i></i>All players connected`);
    const score = ctx.el('div', 'fg-score', root, `<div class="team atlas">Atlas <b class="sa">${o.score[0]}</b></div><div class="clock"><span>${o.round}</span><strong class="ck">08:14</strong></div><div class="team vega"><b class="sv">${o.score[1]}</b> Vega</div>`);
    const clockEl = score.querySelector('.ck');
    const clock = { s: o.clockFrom };
    if (o.clockRun) {
      B.bindText(ctx, clockEl, (lt) => {
        const s = Math.max(0, Math.floor(o.clockFrom - Math.max(0, lt - o.clockAt)));
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      });
    }
    const members = [['JK', 'Jules', 'Coordination', 'Moving', ''], ['NC', 'Nora', 'Power systems', 'Restoring', 'busy'], ['EK', 'Emre', 'Crossing', 'Holding', '']];
    const roster = ctx.el('div', 'panel fg-roster', root, `<h2>Atlas <span>Your team</span></h2>` + members.map((m) =>
      `<div class="fg-member"><span class="fg-avatar">${m[0]}</span><div><strong>${m[1]}</strong><small>${m[2]}</small></div><span class="fg-state ${m[4]}">${m[3]}</span></div>`).join(''));
    const msgs = o.messages || [['Jules', '08:31', 'Nora, take the pump station. Emre, watch the crossing.'], ['Nora', '08:26', 'On it. Call if they commit to the route.'], ['Emre', '08:19', 'Two of them by the crossing. Holding the approach.']];
    const channel = ctx.el('div', 'panel fg-channel', root, `<h2>Team channel <span>Atlas only</span></h2>` + msgs.map((m) =>
      `<div class="fg-msg"><b>${m[0]}</b><small>${m[1]}</small><p>${m[2]}</p></div>`).join('') +
      `<div class="fg-pinned"><span class="mono">Plan agreed</span><strong>Restore gate power first</strong><small>3 roles assigned</small></div><div class="fg-compose">Message your team<span></span></div>`);
    const prog = o.progress || { v: 0.62 };
    const objective = ctx.el('div', 'panel fg-objective', root, `<div class="row"><span class="mono">Objective 2 of 3</span><b class="pc">62%</b></div><div class="row" style="margin-top:8px"><strong>Restore gate power</strong></div><div class="fg-bar"><i></i></div><div class="fg-warn"><i></i>Vega is contesting the crossing</div>`);
    const pc = objective.querySelector('.pc'), barI = objective.querySelector('.fg-bar i');
    ctx.onFrame(() => { const v = Math.round(Math.max(0, Math.min(1, prog.v)) * 100); const s = v + '%'; if (pc.textContent !== s) pc.textContent = s; barI.style.width = v + '%'; });
    const warn = objective.querySelector('.fg-warn');
    const msgEls = Array.from(channel.querySelectorAll('.fg-msg'));
    const memberEls = Array.from(roster.querySelectorAll('.fg-member'));

    const api = {
      root, topbar, signal, score, clockEl, roster, channel, objective, warn, msgEls, memberEls, progress: prog,
      pinned: channel.querySelector('.fg-pinned'), compose: channel.querySelector('.fg-compose'),
      /** panels slide/fade in, functional speed */
      enter(at, which) {
        const list = which || [topbar, score, signal, roster, channel, objective];
        list.forEach((e, i) => {
          const dy = e === objective ? 30 : e === topbar || e === score || e === signal ? -20 : 0;
          const dx = e === roster ? -40 : e === channel ? 40 : 0;
          ctx.tl.fromTo(e, { opacity: 0, x: dx, y: dy }, { opacity: 1, x: 0, y: 0, duration: 0.45, ease: B.E.ui }, at + i * 0.08);
        });
        return api;
      },
      /** reveal chat messages one by one (each with a type-on of its text) */
      typeMessages(at, gap, list) {
        (list || msgEls).forEach((m, i) => {
          const p = m.querySelector('p'); const full = p.textContent;
          const t0 = at + i * (gap || 1.0);
          ctx.tl.fromTo(m, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, ease: B.E.ui }, t0);
          const pr = { n: 0 };
          ctx.tl.fromTo(pr, { n: 0 }, { n: full.length, duration: Math.min(0.9, full.length * 0.018), ease: 'none' }, t0 + 0.1);
          B.bindText(ctx, p, () => full.slice(0, Math.round(pr.n)));
        });
        return api;
      },
      /** set a member state label (e.g. 'Holding' -> 'Moving') at a time */
      setState(i, at, text, busy) {
        const st = memberEls[i].querySelector('.fg-state');
        const before = st.textContent;
        B.bindText(ctx, st, (lt) => (lt >= at ? text : before));
        const wasBusy = st.classList.contains('busy');
        if (busy != null) ctx.onFrame((lt) => st.classList.toggle('busy', lt >= at ? !!busy : wasBusy));
        return api;
      },
    };
    return api;
  }

  window.Floodgate = { world, ui, RIVER, PAL };
})();
