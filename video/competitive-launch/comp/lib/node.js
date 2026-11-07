/* THE NODE: the one amber point that carries the plan through the whole film (storyboard
 * "Concept"). Spec: core r 6 px #f6d39f; ring r 12 px, 1.5 px #efbd70; a 120 px soft glow at 35%;
 * a pulse ring every 3 beats (scale 1 -> 2.2, opacity .6 -> 0, 45 frames); a 1-beat size step
 * (1.0 -> 1.25 -> 1.0) on every cut so the eye finds it again.
 *
 *   const N = NodeMark.create(ctx, { parent: svgOrGroup, x, y })
 *   N.g                     the <g> (translate is driven every frame from N.p)
 *   N.p                     proxy { x, y, s (scale), a (alpha), glow } - tween it on ctx.tl
 *   N.move(at, dur, {x, y}, ease)      tween position
 *   N.along(at, dur, pathEl, ease)     ride an SVG path (MotionPath on the proxy)
 *   N.step(at)              the cut "size step" (1 -> 1.25 -> 1 over one beat)
 *   N.born(at)              appear: scale 0 -> 1 with the first pulse
 *
 * Pulses are a pure function of GLOBAL film time (default every 1.5 s = 3 beats, phase 0), so
 * the rhythm is continuous across cuts. Override with { pulses: [localTimes] } or
 * { pulseEvery: 0 } to disable. Coordinates are in the parent's space (world groups work).
 */
(function () {
  'use strict';
  const C = Brand.C;
  let n = 0;
  function create(ctx, o) {
    o = Object.assign({ x: 960, y: 540, a: 1, s: 1, pulseEvery: 1.5, pulsePhase: 0, pulses: null, pulseDur: 1.5, size: 1, glow: 0.35 }, o || {});
    const id = ctx.id + '-node-' + (++n);
    const parent = o.parent || ctx.svg('svg', { class: 'brand-svg' });
    const defs = ctx.svg('defs', {}, parent);
    const rg = ctx.svg('radialGradient', { id: id + '-glow' }, defs);
    ctx.svg('stop', { offset: '0%', 'stop-color': C.amberLight, 'stop-opacity': 1 }, rg);
    ctx.svg('stop', { offset: '45%', 'stop-color': C.amber, 'stop-opacity': 0.35 }, rg);
    ctx.svg('stop', { offset: '100%', 'stop-color': C.amber, 'stop-opacity': 0 }, rg);
    const g = ctx.svg('g', { class: 'node-mark' }, parent);
    const inner = ctx.svg('g', {}, g);
    const k = o.size;
    const glow = ctx.svg('circle', { r: 60 * k, fill: `url(#${id}-glow)`, opacity: o.glow }, inner);
    const pulse = ctx.svg('circle', { r: 12 * k, fill: 'none', stroke: C.amberLight, 'stroke-width': 1.5, opacity: 0 }, inner);
    const ring = ctx.svg('circle', { r: 12 * k, fill: 'rgba(11,12,14,.55)', stroke: C.amber, 'stroke-width': 1.5 }, inner);
    const core = ctx.svg('circle', { r: 6 * k, fill: C.amberLight }, inner);
    const p = { x: o.x, y: o.y, s: o.s, a: o.a, glow: o.glow, step: 0, pulse: 1 };
    const steps = [];
    ctx.onFrame((lt, gt) => {
      // cut size-step: triangular 1 -> 1.25 -> 1 over 0.5 s after each step time
      let st = 0;
      for (const t0 of steps) { const u = (lt - t0) / 0.5; if (u >= 0 && u <= 1) st = Math.max(st, u < 0.3 ? u / 0.3 : 1 - (u - 0.3) / 0.7); }
      const sc = p.s * (1 + 0.25 * st);
      g.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${sc.toFixed(4)})`);
      g.setAttribute('opacity', String(Math.max(0, Math.min(1, p.a))));
      glow.setAttribute('opacity', String(Math.max(0, p.glow)));
      // pulse ring
      let u = -1;
      if (o.pulses) { for (const t0 of o.pulses) { const v = (lt - t0) / o.pulseDur; if (v >= 0 && v <= 1) u = v; } }
      else if (o.pulseEvery > 0) { const ph = ((gt - o.pulsePhase) % o.pulseEvery + o.pulseEvery) % o.pulseEvery; u = ph / o.pulseDur; if (u > 1) u = -1; }
      if (u < 0 || p.pulse <= 0) { pulse.setAttribute('opacity', '0'); return; }
      const e = 1 - Math.pow(1 - u, 2);
      pulse.setAttribute('r', (12 * k * (1 + 1.2 * e)).toFixed(2));
      pulse.setAttribute('opacity', (0.6 * (1 - u) * p.pulse).toFixed(3));
    });
    const api = {
      g, inner, ring, core, glow, p,
      move(at, dur, to, ease) { ctx.tl.to(p, Object.assign({ duration: dur, ease: ease || 'power3.inOut' }, to), at); return api; },
      along(at, dur, path, ease) { ctx.tl.to(p, { duration: dur, ease: ease || 'power3.inOut', motionPath: { path, autoRotate: false } }, at); return api; },
      step(at) { steps.push(at); return api; },
      born(at) { ctx.tl.fromTo(p, { s: 0 }, { s: o.s, duration: 0.5, ease: 'back.out(2)' }, at); return api; },
    };
    return api;
  }
  window.NodeMark = { create };
})();
