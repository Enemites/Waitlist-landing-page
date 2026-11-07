/* match.js: the SHARED LIVE-MATCH KIT for every live-UI scene (s01, s02, s08, s09, s10, s11, s12).
 * Owned by the s01/s02 engineer. Spec: docs/storyboard.md, s01 build notes (1) + s08/s10 keyframes.
 *
 * ONE world (Floodgate.world, margin 240, shared bake) + ONE chrome (Floodgate.ui, film-safe layout)
 * + ONE clock (split-flap reels) + the HUD, driven by ONE pure state function of the match clock.
 *
 * ---------------------------------------------------------------------------------------------
 * QUICK START
 *   const M = Match.buildMatchScreen(ctx, {
 *     m:      (lt, gt) => 497 - lt,     // match-seconds remaining (512 = 08:32 ... 484 = 08:04).
 *                                        // number or PURE function of local time. Applied every frame.
 *     tau:    (lt, gt, m) => lt,        // ambient phase: river flow, conduit flow, Vega pulse rings
 *     camera: 'MATCH',                  // initial preset (name or {x, y, zoom}); false = drive F.T.state yourself
 *     raise:  ['vega', 'vegaRoutes'],   // world marks drawn ABOVE the LIFT dim (the threat stays lit)
 *   });
 *   M.camera.move(0, 3, 'HOOK', 'power1.inOut');           // log-space zoom, linear centre
 *   M.lift(M.U.warn, { at: 0.5, out: 2.5, scale: 2, cx: 960, top: 792, accent: 'rival' });
 *
 * buildMatchScreen(ctx, opts) -> M
 *   opts: m, tau, camera, ui (true), hud (true), slug (SLUG), raise ([]), zones (false: s08 tifo
 *         cells E4/H4), margin (240), res (1; pass 2 for zoom > ~1.3), pulses ([0.5, 1.5, 2.5] in tau
 *         seconds), clock ((lt, m) => integer seconds shown; default ceil(m)), flow (true)
 *   M.F      Floodgate.world handle (M.F.T camera/terrain, M.F.wg product-space group, M.F.el marks)
 *   M.U      Floodgate.ui handle (film layout): topbar, signal, score, roster, channel, objective,
 *            warn (alert row), msgEls, chips, pinned, compose, clockEl
 *   M.T      = M.F.T
 *   M.L      layers, bottom to top: world (terrain + marks; clip it), chrome (= M.U.root), dim
 *            (the LIFT overlay), hot (world marks above the dim), top (score pill, never dimmed),
 *            lift (lift cards + leaders), then the HUD svg + slug
 *   M.K      state internals: K.R (route samplers), K.routes[name] {g, line, arrow}, K.pos (product
 *            positions of jk/nc/ek/v1/v2/gtri this frame), K.gtri (the resolved ghost triangle)
 *   M.pos    = M.K.pos (read it in M.pre to attach things to tokens, e.g. THE NODE on JK)
 *   M.score  { el, atlas, vega, cell, round, ck, w: {pill, atlas, vega, cell}, left, top }
 *   M.clock  the flap clock on the score pill
 *   M.hud    Brand.hud handle ({ corners, svg }) inset 72, no ticks; M.slug = the slug label
 *            (x 120, top 990, 20 px mono #a89a85, inside title-safe)
 *   M.camera { cut(at, preset), move(at, dur, preset, ease), segs }  evaluated in the pre hook
 *   M.lift(srcEl, o)   LIFT helper (below). Returns { P (proxy p 0..1), wrap, clone }
 *   M.dim    proxy { v } extra dim (0..1 overlay opacity; lifts add their own)
 *   M.pre(fn(lt, gt, m))  run fn every frame AFTER camera + state + ambient and BEFORE every frame
 *            function registered later (THE NODE, your own overlays). Use it to read M.pos.
 *   M.setClip(rect|null)  clip the world (+hot layer) to {x, y, w, h} screen px (s02 window, s12 fold)
 *   World map labels are screen-constant (22 px name / 20 px mono) and fade out over the last 28 px
 *   before they would slide under a visible roster / channel / objective panel (follows the panels'
 *   GSAP x/y/opacity, so exits and entrances re-reveal them).
 *   M.m, M.tau            the values applied this frame
 *
 * ORDER MATTERS: buildMatchScreen registers its pre hook BEFORE the terrain's frame function, so a
 * camera or state computed from time is in place when the terrain, labels and marks draw. Create
 * NodeMark (and anything that reads M.pos) AFTER buildMatchScreen and feed it from M.pre.
 *
 * ---------------------------------------------------------------------------------------------
 * Match.state(F, U, m)   pure: sets every live element from m (called for you every frame).
 *   KEYFRAMES (Match.KEYS; m = match-seconds remaining, the clock runs DOWN):
 *   512            tokens in their lobby slots on hill A (Match.SLOTS); no routes; objective 0;
 *                  chips '—'; channel empty (space reserved); no alert; Vega hidden in the fog
 *   511            Jules's message (types over 1.2 m) + JK MOVING; zones (opts.zones) 510.2 / 509.8
 *   511 -> 505     JK travels JK (route drawn as his trail)
 *   508 -> 507     NC route draws;  507 -> 506 NC travels;  506 NC RESTORING + Nora's message
 *   505            PLAN AGREED stamps (scale 1.06 -> 1)
 *   504.5 -> 503   EK route draws;  504 -> 502.5 EK travels;  502.5 HOLDING + watch cone
 *   503 -> 500     objective 0 -> 62% in steps(12) (ring arc, bar, % text); gate bars glow
 *   500 / 499.5    Vega triangles slide out of the fog (0.8 m expo.out)
 *   499            Emre's message
 *   498.5 -> 497.2 VEGA_CROSSING draws;  498 CONTESTED scrambles in
 *   497.2 -> 497   alert row 'Vega is contesting the crossing'
 *   497.3 -> 497   LAST SEEN ghost + 'LAST SEEN 0:20'.   Everything is FINAL for 494 <= m <= 497.
 *   Past the hook (s10/s11; they assume m = 494 - (t - 46), i.e. continuous m = 494 - lt in s10):
 *   491.75 -> 490.5 JK_COMMIT draws, JK advances to (722,512)   [picture 48.25-49.5]
 *   489.75         ghost resolves into a solid triangle (K.gtri); VEGA_PUMP draws 489.75 -> 489.1
 *   488.9 -> 488.7 JK's forward route fades;  JK_REROUTE draws 488.9 -> 488.25; JK starts along it
 *   489.1 -> 484   the resolved triangle travels VEGA_PUMP (u = 0.6 at 485.5, s11 M6)
 *   488 -> 487.6   both Vega triangles slide ~40 px toward the Crossing (s11 M1)
 *   Atlas routes settle to 32% 1.5 m after their token arrives; red routes stay 100% until a newer
 *   red route starts. Override any of it in your own onFrame (registered after build) or M.pre.
 *   Match.state also works on a bare Floodgate.world (no buildMatchScreen): tokens, Vega, ghost,
 *   labels, cone and objective are set; routes / chrome / pulses need buildMatchScreen.
 *   s01 3.0 == s08 43.5: both are state(494) under HOOK with ambient tau 3.0. For s08, pass
 *   tau: (lt) => lt - 6.5 so its Vega pulses fire at 41.0 / 42.0 / 43.0 and 43.5 matches s01 3.0
 *   pixel for pixel (THE NODE on JK and the slug are the intended differences).
 *
 * Match.ambient(F, tau)  pure: river flow + conduit flow phases, Vega pulse rings (scale 1 -> 1.8,
 *   opacity .6 -> 0, 1.0 s, at opts.pulses in tau seconds). Freeze = hold tau constant.
 *
 * LIFT  M.lift(src, { at, dur (10 f), out, outDur (10 f), scale (2), cx (960), top (792),
 *   leader ('elbow' | 'straight' | false), dim (0.6 = everything else to 40%), accent ('rival'|null),
 *   fit (true: clone shrinks to its content) })
 *   Clones the DOM node (computed styles copied inline, so it stays crisp DOM text) into the lift
 *   layer, grows it from the source position to `scale` with its top at `top`, centred on `cx`
 *   (power3.out), draws a 1 px amber leader back to the source and dims world + chrome under one
 *   #0b0c0e overlay. Returns at `out` (power2.in). No blur, no backdrop-filter. The score pill, the
 *   HUD and 'raise'd world marks are never dimmed.
 *   leader 'side' (s08): from the card's right edge, level with the source row, to a source on its
 *   right (one elbow when the card does not span the row). prep(clone, src, wrap, bg) (s08): called
 *   after cloning and before measuring (hide parts of the clone, grab nodes to update per frame).
 *   top may also be a function (w0, h0, scale) -> top of the measured card (s08 in-place lifts).
 *
 * Match.flapClock(ctx, { el, value: (lt) => seconds, minT: 0 })  split-flap reels mm:ss: each digit
 *   is a vertical reel, steps(1) on change plus a 3-frame settle (overshoot .16, -.06, .02). Counting
 *   down rolls the new digit in from above, counting up from below. value must be a PURE function of
 *   local time (the settle samples the previous frames). Returns { el, reels, colon, digitsAt(lt) }.
 *
 * TABLES (product coordinates; world = (product + 240) x 1.5; zoom = F.T.state.zoom)
 *   Match.CAM      MATCH, HOOK, WINDOW, OVERVIEW, OVERVIEW_WIDE, LOBBY_A, LOBBY_V, GHOST, C1-C3,
 *                  M1-M7, REVIEW, MEDALLION: { x, y, zoom }. MATCH is the storyboard's (800,520) moved
 *                  to (850,520) so both Vega triangles and the ghost clear the film-layout channel.
 *   Match.ROUTES   d strings: OUR_PLAN, THEIR_PLAN, JK, NC, EK, VEGA_CROSSING, JK_COMMIT, VEGA_PUMP,
 *                  JK_REROUTE.  Match.route(name) -> sampler { at(u) -> {x, y, a(deg)}, len, d }
 *   Match.SLOTS / Match.POSTS   lobby slots on hill A / the hook positions of jk, nc, ek
 *   Match.GRID     A-L x 01-08 over the 1600x1000 composition: cellRect(col, row), cellOf(x, y)
 *   Match.screenOf(px, py, cam)  product point -> screen px under a preset (pure, no DOM)
 *   Match.HANDOFF  screen positions at the cuts (stands in for the storyboard's handoffs.js, which is
 *                  not loaded by index.html): HANDOFF['s02-freeze-rewind@4.0'] = { node [607.2, 372],
 *                  nodeRingR, window {440,150,1040,780}, clockCell {x 440, y 84 ('ROUND 2' top),
 *                  digitsTop 112, digitsLine 32}, slug } for s03; HANDOFF['s01-hook-live@3.0'] for s08
 *   To rebuild the s02 4.0 frame pixel-identically (s03 drain): Match.buildMatchScreen(ctx, { m: 512,
 *   tau: -15, camera: 'WINDOW', ui: false, hud: false }) + M.setClip(HANDOFF[...].window).
 *   Match.fmt(sec) 'mm:ss'.  Match.scramble(text, u, seed, mode) deterministic scramble ('in'|'resolve')
 *   Match.SLUG     'REALMS · COMPETITIVE · INTERFACE CONCEPT'
 */
(function () {
  'use strict';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080, FPS = 30, S = 1.5;
  const SLUG = 'REALMS · COMPETITIVE · INTERFACE CONCEPT';
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  // 0 while m >= a, 1 once m <= b (the match clock runs down)
  const seg = (m, a, b) => clamp01((a - m) / (a - b));
  const EASES = {};
  const ease = (name) => EASES[name] || (EASES[name] = gsap.parseEase(name));
  const fmt = (sec) => { const s = Math.max(0, Math.round(sec)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

  // -------------------------------------------------------------------------------------------
  // Paths: tiny absolute M/L/C/S parser + arc-length sampler (pure JS, no DOM)
  // -------------------------------------------------------------------------------------------
  function parsePath(d) {
    const tk = d.match(/[MLCS]|-?\d*\.?\d+/g);
    const segs = []; let i = 0, cmd = null, x = 0, y = 0, lc = null;
    const num = () => parseFloat(tk[i++]);
    while (i < tk.length) {
      if (/[MLCS]/.test(tk[i])) cmd = tk[i++];
      if (cmd === 'M') { x = num(); y = num(); lc = null; cmd = 'L'; continue; }
      if (cmd === 'L') { const nx = num(), ny = num(); segs.push([x, y, x + (nx - x) / 3, y + (ny - y) / 3, x + 2 * (nx - x) / 3, y + 2 * (ny - y) / 3, nx, ny]); x = nx; y = ny; lc = null; continue; }
      if (cmd === 'C') { const a = num(), b = num(), c2 = num(), d2 = num(), nx = num(), ny = num(); segs.push([x, y, a, b, c2, d2, nx, ny]); lc = [c2, d2]; x = nx; y = ny; continue; }
      if (cmd === 'S') { const c2 = num(), d2 = num(), nx = num(), ny = num(); const a = lc ? 2 * x - lc[0] : x, b = lc ? 2 * y - lc[1] : y; segs.push([x, y, a, b, c2, d2, nx, ny]); lc = [c2, d2]; x = nx; y = ny; continue; }
      i++;
    }
    return segs;
  }
  function sampler(d, per) {
    per = per || 64;
    const segs = parsePath(d), pts = [], cum = [0];
    segs.forEach((s, k) => {
      for (let j = k === 0 ? 0 : 1; j <= per; j++) {
        const t = j / per, u = 1 - t;
        pts.push([u * u * u * s[0] + 3 * u * u * t * s[2] + 3 * u * t * t * s[4] + t * t * t * s[6], u * u * u * s[1] + 3 * u * u * t * s[3] + 3 * u * t * t * s[5] + t * t * t * s[7]]);
      }
    });
    for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const len = cum[cum.length - 1];
    function at(u) {
      u = clamp01(u); const L = u * len;
      let lo = 0, hi = cum.length - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] < L) lo = mid; else hi = mid; }
      const f = cum[hi] > cum[lo] ? (L - cum[lo]) / (cum[hi] - cum[lo]) : 0;
      const x = lerp(pts[lo][0], pts[hi][0], f), y = lerp(pts[lo][1], pts[hi][1], f);
      const a = Math.atan2(pts[hi][1] - pts[lo][1], pts[hi][0] - pts[lo][0]) * 180 / Math.PI;
      return { x, y, a };
    }
    return { d, pts, len, at };
  }

  // -------------------------------------------------------------------------------------------
  // Tables
  // -------------------------------------------------------------------------------------------
  const ROUTES = {
    OUR_PLAN: 'M380 320 C450 330 510 360 562 399 S720 500 784 548',
    THEIR_PLAN: 'M1260 690 C1240 560 1100 440 1004 396 S870 470 818 548',
    JK: 'M380 320 C470 360 600 420 684 484',
    NC: 'M380 320 C440 330 520 380 562 440',
    EK: 'M380 320 C540 300 760 360 920 420',
    VEGA_CROSSING: 'M1140 524 C1110 500 1080 470 1056 448',
    JK_COMMIT: 'M684 484 L760 540',
    VEGA_PUMP: 'M1060 640 C960 640 860 590 816 566 S700 470 612 430',
    JK_REROUTE: 'M722 512 C690 480 650 450 606 436',
  };
  const RIVAL_ROUTES = { THEIR_PLAN: 1, VEGA_CROSSING: 1, VEGA_PUMP: 1 };
  const SAMPLERS = {};
  const route = (name) => SAMPLERS[name] || (SAMPLERS[name] = sampler(ROUTES[name]));
  const SLOTS = { jk: [380, 320], nc: [346, 344], ek: [414, 296] };
  const POSTS = { jk: [684, 484], nc: [562, 440], ek: [920, 420] };
  const VEGA = { v1: [1118, 342], v2: [1140, 524] }, GHOST = [1060, 640];
  const KEYS = {
    jkMsg: 511, jkMoving: 511, zones: [510.2, 509.8], jkTravel: [511, 505], ncDraw: [508, 507], ncTravel: [507, 506],
    ncRestoring: 506, noraMsg: 506, plan: 505, ekDraw: [504.5, 503], ekTravel: [504, 502.5], ekHolding: 502.5, cone: 502.5,
    progress: [503, 500], vega1: 500, vega2: 499.5, emreMsg: 499, vegaCrossing: [498.5, 497.2], contested: 498, alert: 497.2, ghost: 497,
    final: 497, hook: 494, jkCommit: [491.75, 490.5], ghostResolve: 489.75, vegaPump: [489.75, 489.1], jkFwdFade: [488.9, 488.7],
    jkReroute: [488.9, 488.25], jkRerouteTravel: [488.25, 484], vegaPumpTravel: [489.1, 484], vegaSlide: [488, 487.6], min: 484, max: 512,
  };
  const MSG_T = [KEYS.jkMsg, KEYS.noraMsg, KEYS.emreMsg];
  const CHIPS = [['Moving', KEYS.jkMoving, false], ['Restoring', KEYS.ncRestoring, true], ['Holding', KEYS.ekHolding, false]];
  const ROUTE_REST = 0.32;

  const lobby = (px, py, sx, sy, zoom) => ({ x: px - (sx - W / 2) / (zoom * S), y: py - (sy - H / 2) / (zoom * S), zoom });
  const CAM = {
    MATCH: { x: 850, y: 520, zoom: 0.80 },
    HOOK: { x: 900, y: 470, zoom: 0.96 },
    WINDOW: { x: 800, y: 520, zoom: 0.56 },
    OVERVIEW: { x: 820, y: 510, zoom: 0.80 },
    OVERVIEW_WIDE: { x: 820, y: 520, zoom: 0.72 },
    LOBBY_A: lobby(380, 320, 1340, 560, 2.2),
    LOBBY_V: lobby(1260, 690, 1340, 560, 2.2),
    GHOST: { x: 1060, y: 640, zoom: 1.6 },
    C1: { x: 760, y: 500, zoom: 1.3 }, C2: { x: 740, y: 520, zoom: 1.6 }, C3: { x: 840, y: 560, zoom: 1.2 },
    M1: { x: 800, y: 500, zoom: 0.80 }, M2: { x: 920, y: 420, zoom: 2.2 }, M3: { x: 575, y: 420, zoom: 2.2 },
    M4: { x: 700, y: 490, zoom: 2.0 }, M5: { x: 800, y: 560, zoom: 2.2 },
    M6: (() => { const p = route('VEGA_PUMP').at(0.6); return { x: p.x, y: p.y, zoom: 2.4 }; })(),
    M7: { x: 1004, y: 396, zoom: 2.4 },
    REVIEW: { x: 820, y: 500, zoom: 0.6 },
    MEDALLION: lobby(800, 500, 1420, 540, 0.2),
  };
  const GRID = {
    cols: 12, rows: 8, w: 1600, h: 1000, letters: 'ABCDEFGHIJKL',
    cellRect(c, r) { return { x: c * 1600 / 12, y: r * 1000 / 8, w: 1600 / 12, h: 1000 / 8 }; },
    cellOf(x, y) { return [Math.floor(x / (1600 / 12)), Math.floor(y / (1000 / 8))]; },
    name(c, r) { return 'ABCDEFGHIJKL'[c] + String(r + 1).padStart(2, '0'); },
  };
  const camOf = (p) => (typeof p === 'string' ? CAM[p] : p);
  const screenOf = (px, py, cam) => { cam = camOf(cam); return [(px - cam.x) * cam.zoom * S + W / 2, (py - cam.y) * cam.zoom * S + H / 2]; };
  const HANDOFF = {
    's01-hook-live@3.0': { camera: 'HOOK', m: 494, tau: 3.0, clock: '08:14', jk: screenOf(684, 484, 'HOOK') },
    's02-freeze-rewind@4.0': {
      camera: 'WINDOW', m: 512, clock: '08:32',
      node: screenOf(380, 320, 'WINDOW'),            // JK's lobby slot under WINDOW: [607.2, 372]
      nodeRingR: 24 * 0.56 * S,                       // node ring radius in px at the handoff
      window: { x: 440, y: 150, w: 1040, h: 780 },
      clockCell: { x: 440, y: 84, round: 'ROUND 2', roundPx: 20, digitsTop: 112, digitsLine: 32, digitsPx: 28, align: 'left' },
      slug: { x: 120, y: 990, text: 'REWIND', icon: 'M13 3 L3 10 L13 17Z M25 3 L15 10 L25 17Z (34 x 20, #a89a85)' },
    },
  };

  // deterministic scramble. mode 'in': revealed left to right with a scrambled leading edge;
  // 'resolve': every char scrambled, resolving left to right.
  const SCR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/';
  function hash(a, b, c) { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return (h ^ (h >>> 16)) >>> 0; }
  function scramble(text, u, seed, mode) {
    if (u >= 1) return text;
    if (u <= 0) return mode === 'resolve' ? text.replace(/[^ ]/g, (ch, i) => SCR[hash(i, 0, sh(seed)) % SCR.length]) : '';
    const L = text.length, step = Math.floor(u * 24), s0 = sh(seed);
    const rev = Math.floor(u * L);
    let out = '';
    for (let i = 0; i < L; i++) {
      const ch = text[i];
      if (i < rev || ch === ' ') { out += ch; continue; }
      if (mode !== 'resolve' && i > rev + 3) break;
      out += SCR[hash(i, step, s0) % SCR.length];
    }
    return out;
  }
  function sh(s) { s = String(s || ''); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  // -------------------------------------------------------------------------------------------
  // Split-flap clock
  // -------------------------------------------------------------------------------------------
  let CSS_DONE = false;
  function css() {
    if (CSS_DONE) return; CSS_DONE = true;
    const st = document.createElement('style');
    st.textContent = `
      .mx-clock .mx-reel, .mx-clock .mx-colon, .mx-clock .mx-strip, .mx-clock .mx-strip i { font-family: inherit !important; font-size: inherit !important; font-weight: inherit !important; color: inherit !important; letter-spacing: 0 !important; }
      .mx-reel { display:inline-block; position:relative; overflow:hidden; height:1.12em; width:.6em; vertical-align:top; text-align:center; }
      .mx-strip { display:block; position:absolute; left:0; right:0; top:-1.12em; }
      .mx-strip i { display:block; font-style:normal; height:1.12em; line-height:1.12em; }
      .mx-colon { display:inline-block; height:1.12em; line-height:1.12em; vertical-align:top; width:.6em; text-align:center; }
      .mx-lift-card { position:absolute; left:0; top:0; transform-origin: 0 0; box-sizing:border-box; }
      .mx-lift-card > .mx-bg { position:absolute; inset:0; border-radius:9px; background: rgba(13,12,10,.96); border:1px solid rgba(255,255,255,.12); box-shadow: 0 6px 15px rgba(0,0,0,.5); }
      .mx-lift-card > .mx-clone { position:relative; }
      .mx-layer { position:absolute; left:0; top:0; width:1920px; height:1080px; pointer-events:none; }
    `;
    document.head.appendChild(st);
  }
  const SETTLE = [0.16, -0.06, 0.02];
  function flapClock(ctx, o) {
    css();
    o = Object.assign({ minT: 0 }, o);
    const el = o.el;
    el.innerHTML = ''; el.classList.add('mx-clock');
    const mkReel = () => { const r = ctx.el('span', 'mx-reel', el); const s = ctx.el('span', 'mx-strip', r); const ii = [ctx.el('i', '', s), ctx.el('i', '', s), ctx.el('i', '', s)]; return { r, s, ii, last: '' }; };
    const reels = [mkReel(), mkReel()];
    const colon = ctx.el('span', 'mx-colon', el, ':');
    reels.push(mkReel(), mkReel());
    const MOD = [10, 10, 6, 10];
    const digitsOf = (v) => { const s = fmt(v); return [+s[0], +s[1], +s[3], +s[4]]; };
    function update(lt) {
      const v = o.value(lt); const d = digitsOf(v);
      for (let j = 0; j < 4; j++) {
        let k = -1, dir = -1;
        for (let kk = 1; kk <= 3; kk++) {
          const tp = lt - kk / FPS; if (tp < o.minT - 1e-6) break;
          const vp = o.value(tp);
          if (digitsOf(vp)[j] !== d[j]) { k = kk - 1; dir = v > vp ? 1 : -1; break; }
        }
        const off = k >= 0 ? SETTLE[k] : 0;
        const R = reels[j], mod = MOD[j], c = d[j];
        const key = c + '|' + off;
        if (R.last !== key) {
          R.ii[0].textContent = String((c - 1 + mod) % mod); R.ii[1].textContent = String(c); R.ii[2].textContent = String((c + 1) % mod);
          R.s.style.transform = off ? `translateY(${(-dir * off * 1.12).toFixed(3)}em)` : '';
          R.last = key;
        }
      }
    }
    if (!o.manual) ctx.onFrame((lt) => update(lt));
    return { el, reels, colon, update, digitsAt: (lt) => digitsOf(o.value(lt)) };
  }

  // -------------------------------------------------------------------------------------------
  // State + ambient (pure functions of m / tau)
  // -------------------------------------------------------------------------------------------
  const setT = (e, x, y) => e.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  function setOp(e, v) { const s = v >= 0.999 ? '1' : v.toFixed(3); if (e.getAttribute('opacity') !== s) e.setAttribute('opacity', s); }
  function setText(e, s) { if (e && e.textContent !== s) e.textContent = s; }
  function setRoute(r, f, op) {
    if (!r || !r.g) return;
    const on = f > 0.002 && op > 0.002;
    if (!on) { if (r.vis !== false) { r.g.style.display = 'none'; r.vis = false; } return; }
    if (r.vis !== true) { r.g.style.display = ''; r.vis = true; }
    if (f >= 0.999) { if (r.masked) { r.line.removeAttribute('mask'); r.masked = false; } }
    else { if (!r.masked) { r.line.setAttribute('mask', r.maskUrl); r.masked = true; } r.mp.setAttribute('stroke-dasharray', `${f.toFixed(4)} 2`); }
    const t = r.R.at(Math.min(1, f));
    r.arrow.setAttribute('transform', `translate(${t.x.toFixed(2)} ${t.y.toFixed(2)}) rotate(${t.a.toFixed(2)})`);
    setOp(r.g, op);
  }

  // a bare Floodgate.world (no buildMatchScreen) still gets tokens / Vega / labels / objective
  function bareKit(F) {
    const R = {}; Object.keys(ROUTES).forEach((n) => { R[n] = route(n); });
    const none = { g: null };
    const routes = {}; Object.keys(ROUTES).forEach((n) => { routes[n] = none; });
    return { R, routes, pos: {}, flow: [], pulses: [], pulseTimes: [], ui: null, zones: null, gtri: null, bare: true };
  }
  function state(F, U, m) {
    if (!F || !F.el) return;
    const K = F.match || (F.match = bareKit(F));
    const io = ease('power1.inOut'), io2 = ease('power2.inOut'), eo = ease('expo.out'), so = ease('sine.out');
    // ---- Atlas tokens
    const uJ = io(seg(m, 511, 505));
    let jk = K.R.JK.at(uJ);
    if (m < 491.75) jk = K.R.JK_COMMIT.at(0.5 * io2(seg(m, 491.75, 490.5)));
    if (m < 488.25) jk = K.R.JK_REROUTE.at(0.5 * so(seg(m, 488.25, 484)));
    const uN = io(seg(m, 507, 506)), uE = io(seg(m, 504, 502.5));
    const nc = K.R.NC.at(uN), ek = K.R.EK.at(uE);
    const ncx = nc.x + (SLOTS.nc[0] - 380) * (1 - uN), ncy = nc.y + (SLOTS.nc[1] - 320) * (1 - uN);
    const ekx = ek.x + (SLOTS.ek[0] - 380) * (1 - uE), eky = ek.y + (SLOTS.ek[1] - 320) * (1 - uE);
    setT(F.el.tokens.jk, jk.x, jk.y); setT(F.el.tokens.nc, ncx, ncy); setT(F.el.tokens.ek, ekx, eky);
    K.pos.jk = [jk.x, jk.y]; K.pos.nc = [ncx, ncy]; K.pos.ek = [ekx, eky];
    // ---- routes
    const Rt = K.routes;
    setRoute(Rt.JK, uJ, lerp(1, ROUTE_REST, seg(m, 505, 503.5)));
    setRoute(Rt.NC, seg(m, 508, 507), lerp(1, ROUTE_REST, seg(m, 506, 504.5)));
    setRoute(Rt.EK, seg(m, 504.5, 503), lerp(1, ROUTE_REST, seg(m, 502.5, 501)));
    setRoute(Rt.VEGA_CROSSING, seg(m, 498.5, 497.2), lerp(1, 0.6, seg(m, 489.75, 489.25)));
    setRoute(Rt.JK_COMMIT, seg(m, 491.75, 490.5), 1 - seg(m, 488.9, 488.7));
    setRoute(Rt.VEGA_PUMP, seg(m, 489.75, 489.1), 1);
    setRoute(Rt.JK_REROUTE, seg(m, 488.9, 488.25), 1);
    setRoute(Rt.OUR_PLAN, 0, 0); setRoute(Rt.THEIR_PLAN, 0, 0);
    // ---- Vega
    const e1 = eo(seg(m, 500, 499.2)), e2 = eo(seg(m, 499.5, 498.7)), sl = eo(seg(m, 488, 487.6));
    const v1x = VEGA.v1[0] + 70 * (1 - e1) - 30 * sl, v1y = VEGA.v1[1] + 16 * (1 - e1) + 14 * sl;
    const v2x = VEGA.v2[0] + 70 * (1 - e2) - 24 * sl, v2y = VEGA.v2[1] + 16 * (1 - e2) - 23 * sl;
    setT(F.el.vega[0], v1x, v1y); setOp(F.el.vega[0], clamp01(e1 * 1.5));
    setT(F.el.vega[1], v2x, v2y); setOp(F.el.vega[1], clamp01(e2 * 1.5));
    K.pos.v1 = [v1x, v1y]; K.pos.v2 = [v2x, v2y];
    setOp(F.el.ghost, seg(m, 497.3, 497) * (1 - seg(m, 489.75, 489.5)));
    const gu = Math.min(0.85, Math.max(0, (489.1 - m) / 6));
    const gp = K.R.VEGA_PUMP.at(gu);
    if (K.gtri) { setT(K.gtri, gp.x, gp.y); setOp(K.gtri, seg(m, 489.75, 489.55)); } K.pos.gtri = [gp.x, gp.y];
    // ---- world labels, cone, objective
    const lb = F.el.labels || {};
    if (lb.crossing && lb.crossing.sub) setText(lb.crossing.sub, m > 498 ? '' : scramble('CONTESTED', seg(m, 498, 497.6), 'contested'));
    if (lb.lastSeen) { setOp(lb.lastSeen, seg(m, 497.3, 497)); setText(lb.lastSeen.name || lb.lastSeen, scramble('LAST SEEN 0:20', seg(m, 497.3, 497), 'lastseen')); }
    setOp(F.el.cone, seg(m, 502.5, 502.1));
    F.progress.v = 0.62 * Math.floor(12 * seg(m, 503, 500) + 1e-6) / 12;
    F.el.gateBars.setAttribute('stroke-opacity', (0.5 + 0.42 * (seg(m, 503, 502.8) - seg(m, 500, 499.4))).toFixed(3));
    if (K.zones) K.zones.forEach((z, i) => { const t = KEYS.zones[i]; setOp(z, 0.12 * (seg(m, t, t - 0.2) - seg(m, t - 2.2, t - 3.2))); });
    // ---- chrome
    if (U && K.ui) {
      K.ui.msgs.forEach((mm, i) => {
        const t = MSG_T[i], vis = seg(m, t, t - 0.25);
        const so2 = vis >= 0.999 ? '1' : vis.toFixed(3);
        if (mm.el.style.opacity !== so2) mm.el.style.opacity = so2;
        mm.el.style.transform = vis >= 0.999 ? '' : `translateY(${((1 - vis) * 10).toFixed(2)}px)`;
        const n = Math.round(mm.full.length * seg(m, t - 0.05, t - 1.25));
        if (n !== mm.n) { mm.ty.textContent = mm.full.slice(0, n); mm.rs.textContent = mm.full.slice(n); mm.n = n; }
      });
      K.ui.chips.forEach((ch, i) => {
        const [txt, t, busy] = CHIPS[i]; const on = m <= t;
        setText(ch, on ? txt : '—');
        ch.classList.toggle('busy', on && busy);
        const dd = Math.abs(m - t); ch.style.transform = dd < 0.12 ? `scaleY(${(dd / 0.12).toFixed(3)})` : '';
      });
      const u = seg(m, 505, 504.6), pin = U.pinned;
      pin.style.opacity = clamp01(u * 3).toFixed(3);
      const sc = u < 0.5 ? lerp(1.06, 0.985, u / 0.5) : lerp(0.985, 1, (u - 0.5) / 0.5);
      pin.style.transform = u >= 1 ? '' : `scale(${sc.toFixed(4)})`;
      const a = seg(m, 497.2, 497);
      U.warn.style.opacity = a.toFixed(3);
      U.warn.style.transform = a >= 1 ? '' : `translateY(${((1 - a) * 8).toFixed(2)}px)`;
    }
  }

  function ambient(F, tau) {
    const K = F && F.match; if (!K) return;
    F.flow.time = tau;
    for (const fl of K.flow) fl.el.setAttribute('stroke-dashoffset', (-tau * fl.speed).toFixed(2));
    const po = ease('power2.out');
    for (const ring of K.pulses) {
      let u = -1;
      for (const t0 of K.pulseTimes) { const v = tau - t0; if (v >= 0 && v <= 1) u = v; }
      if (u < 0) { if (ring.getAttribute('opacity') !== '0') ring.setAttribute('opacity', '0'); continue; }
      ring.setAttribute('r', (18 * (1 + 0.8 * po(u))).toFixed(2));
      ring.setAttribute('opacity', (0.6 * (1 - u)).toFixed(3));
    }
  }

  // -------------------------------------------------------------------------------------------
  // helpers for buildMatchScreen
  // -------------------------------------------------------------------------------------------
  function rectOf(el, root) {
    let x = 0, y = 0, e = el;
    while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }
  const COPY = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'color', 'display', 'gap', 'align-items',
    'justify-content', 'flex-direction', 'white-space', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom',
    'padding-left', 'background-color', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius', 'box-sizing', 'width', 'height', 'box-shadow', 'text-align'];
  function styledClone(src) {
    const cl = src.cloneNode(true);
    const a = [src, ...src.querySelectorAll('*')], b = [cl, ...cl.querySelectorAll('*')];
    a.forEach((e, i) => {
      const cs = getComputedStyle(e);
      b[i].removeAttribute('class');
      b[i].style.cssText = COPY.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
    });
    return cl;
  }
  function smoothPath(pts) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }
  function offsetPoly(pts, off) {
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [p[0] - dy / l * off, p[1] + dx / l * off];
    });
  }

  // -------------------------------------------------------------------------------------------
  // buildMatchScreen
  // -------------------------------------------------------------------------------------------
  function buildMatchScreen(ctx, o) {
    css();
    o = Object.assign({ m: 497, tau: null, camera: 'MATCH', ui: true, hud: true, slug: SLUG, raise: [], zones: false, margin: 240, res: 1, clock: null, pulses: [0.5, 1.5, 2.5], flow: true }, o || {});
    const mOf = typeof o.m === 'function' ? o.m : () => o.m;
    const tauOf = typeof o.tau === 'function' ? o.tau : o.tau == null ? (lt) => lt : () => o.tau;
    const M = { ctx, opts: o, pres: [], lifts: [], dim: { v: 0 }, m: mOf(0, ctx.start), tau: 0, clipRect: null };
    const camSegs = [];
    let ready = false;
    const L = {};
    const lay = (cls) => ctx.el('div', 'mx-layer ' + cls, ctx.root);
    function applyCam(lt) {
      if (o.camera === false) return;
      let cur = camOf(o.camera);
      for (const s of camSegs) {
        if (lt < s.at - 1e-9) break;
        const to = camOf(s.to);
        if (s.dur <= 0 || lt >= s.at + s.dur) { cur = to; continue; }
        const u = ease(s.ease)((lt - s.at) / s.dur);
        cur = { x: lerp(cur.x, to.x, u), y: lerp(cur.y, to.y, u), zoom: Math.exp(lerp(Math.log(cur.zoom), Math.log(to.zoom), u)) };
        break;
      }
      const st = M.F.T.state; st.cx = (cur.x + M.F.M) * S; st.cy = (cur.y + M.F.M) * S; st.zoom = cur.zoom;
      M.cam = cur;
    }
    function applyClip() {
      const r = M.clipRect;
      const v = r ? `inset(${r.y.toFixed(2)}px ${(W - r.x - r.w).toFixed(2)}px ${(H - r.y - r.h).toFixed(2)}px ${r.x.toFixed(2)}px)` : '';
      if (L.world.style.clipPath !== v) { L.world.style.clipPath = v; L.hot.style.clipPath = v; }
    }
    // world labels fade out over the last 28 px before they would slide under a visible panel
    function applyOcclusion() {
      const O = M.K && M.K.occl; if (!O) return;
      const act = O.panels.map((P) => {
        const op = +gsap.getProperty(P.el, 'opacity'), x = +gsap.getProperty(P.el, 'x') || 0, y = +gsap.getProperty(P.el, 'y') || 0;
        return { on: op > 0.3, x0: P.r.x + x - 6, x1: P.r.x + P.r.w + x + 6, y0: P.r.y + y - 6, y1: P.r.y + P.r.h + y + 6 };
      });
      for (const lb of O.labs) {
        const [sx, sy] = M.F.toScreen(lb.anchor[0], lb.anchor[1]);
        const x0 = sx + lb.bb.x, x1 = x0 + lb.bb.width, y0 = sy + lb.bb.y, y1 = y0 + lb.bb.height;
        let vis = 1;
        for (const P of act) { if (!P.on) continue; const gap = Math.max(P.x0 - x1, x0 - P.x1, P.y0 - y1, y0 - P.y1); vis = Math.min(vis, clamp01(gap / 28)); }
        const s = vis >= 0.999 ? '' : vis.toFixed(3);
        for (const k of lb.kids) if (k.style.opacity !== s) k.style.opacity = s;
      }
    }
    // PRE hook: registered before every other frame function of this screen
    ctx.onFrame((lt, gt) => {
      if (!ready) return;
      applyCam(lt);
      const m = mOf(lt, gt); M.m = m;
      state(M.F, M.U, m);
      const tau = tauOf(lt, gt, m); M.tau = tau;
      ambient(M.F, tau);
      applyOcclusion();
      for (const f of M.pres) f(lt, gt, m);
      let d = M.dim.v; for (const lf of M.lifts) d = Math.max(d, lf.P.p * lf.o.dim);
      const ds = d > 0.001 ? d.toFixed(3) : '0';
      if (L.dim.style.opacity !== ds) { L.dim.style.opacity = ds; L.dim.style.display = d > 0.001 ? '' : 'none'; }
      applyClip();
    });

    // ---- world
    L.world = lay('mx-world');
    const c0 = camOf(o.camera || 'MATCH');
    const F = Floodgate.world(ctx, { scale: S, margin: o.margin, film: true, parent: L.world, terrain: { res: o.res }, state: { cx: (c0.x + o.margin) * S, cy: (c0.y + o.margin) * S, zoom: c0.zoom } });
    M.F = F; M.T = F.T;
    const K = { R: {}, routes: {}, pos: {}, flow: [], pulses: [], pulseTimes: o.pulses.slice(), ui: null, zones: null };
    F.match = K; M.K = K; M.pos = K.pos;
    // river flow (ambient): sparse slow glints along the channel
    if (o.flow) {
      const rp = o.margin > 0 ? Floodgate.RIVER_EXT : Floodgate.RIVER;
      [[0, '7 38', 15, 0.24], [-17, '5 52', 10, 0.16], [17, '9 34', 12, 0.16]].forEach(([off, dash, speed, op], i) => {
        const el = ctx.svg('path', { d: smoothPath(off ? offsetPoly(rp, off) : rp), fill: 'none', stroke: '#9fb0a2', 'stroke-opacity': op, 'stroke-width': 1.2, 'stroke-dasharray': dash, 'stroke-linecap': 'round', 'stroke-dashoffset': i * 9 }, F.el.baseG);
        K.flow.push({ el, speed });
      });
    }
    // zones (s08 tifo cells): E4 around the pump station, H4 around the crossing
    if (o.zones) {
      K.zones = [[4, 3], [7, 3]].map(([c, r]) => { const R = GRID.cellRect(c, r); return ctx.svg('rect', { x: R.x, y: R.y, width: R.w, height: R.h, fill: C.amber, opacity: 0 }, F.el.routesG); });
    }
    // routes (dashed, revealed by a solid mask path; arrowhead chevron rides the tip)
    Object.keys(ROUTES).forEach((name) => {
      const R = route(name); K.R[name] = R;
      const col = RIVAL_ROUTES[name] ? C.rival : C.amber;
      const g = ctx.svg('g', { class: 'mx-route', style: 'display:none' }, F.el.routesG);
      const id = `${ctx.id}-mx-route-${name}`;
      const defs = ctx.svg('defs', {}, g);
      const mask = ctx.svg('mask', { id, maskUnits: 'userSpaceOnUse', x: -1000, y: -1000, width: 4000, height: 3000 }, defs);
      const mp = ctx.svg('path', { d: R.d, fill: 'none', stroke: '#fff', 'stroke-width': 16, pathLength: 1, 'stroke-dasharray': '0 2' }, mask);
      const line = ctx.svg('path', { d: R.d, fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-dasharray': '8.4 6.6', 'stroke-linecap': 'round' }, g);
      const arrow = ctx.svg('path', { d: 'M-8.5 -6 L0 0 L-8.5 6', fill: 'none', stroke: col, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      K.routes[name] = { name, R, g, line, mp, arrow, maskUrl: `url(#${id})`, masked: false, vis: false, rival: !!RIVAL_ROUTES[name] };
    });
    // Vega pulse rings (inside each triangle group, behind the triangle)
    F.el.vega.forEach((tri) => {
      const ring = ctx.svg('circle', { r: 18, fill: 'none', stroke: C.rival, 'stroke-width': 1.6, opacity: 0 }, tri);
      tri.insertBefore(ring, tri.firstChild);
      K.pulses.push(ring);
    });
    // the resolved ghost (solid triangle; s10 'their move')
    K.gtri = ctx.svg('g', { opacity: 0 }, F.wg);
    ctx.svg('path', { d: 'M0 -12l14 24h-28Z', fill: C.rival }, K.gtri);
    F.wg.insertBefore(K.gtri, F.el.labels && F.el.labels.gate ? F.el.labels.gate : null);

    // ---- chrome
    const U = o.ui ? Floodgate.ui(ctx, { parent: ctx.root, layout: 'film', progress: F.progress, clockRun: false }) : null;
    M.U = U; L.chrome = U ? U.root : null;
    L.dim = lay('mx-dim'); Object.assign(L.dim.style, { background: C.bg, opacity: '0', display: 'none' });
    L.hot = lay('mx-hot');
    const hotSvg = ctx.svg('svg', { class: 'brand-svg mx-hot-svg' }, L.hot);
    const hotWg = ctx.svg('g', { transform: F.wg.getAttribute('transform') }, F.T.group(hotSvg));
    L.hotWg = hotWg;
    L.top = ctx.el('div', 'fg-ui fg-film mx-layer mx-top', ctx.root);
    L.lift = ctx.el('div', 'fg-ui fg-film mx-layer mx-lift', ctx.root);
    L.liftSvg = ctx.svg('svg', { class: 'brand-svg mx-leaders' }, L.lift);
    M.L = L;
    // raise world marks above the dim
    const raise = new Set(o.raise || []);
    if (raise.has('vega')) F.el.vega.forEach((t) => hotWg.appendChild(t));
    if (raise.has('vegaRoutes')) ['VEGA_CROSSING', 'VEGA_PUMP', 'THEIR_PLAN'].forEach((n) => hotWg.insertBefore(K.routes[n].g, hotWg.firstChild));
    if (raise.has('ghost')) { hotWg.appendChild(F.el.ghost); hotWg.appendChild(K.gtri); }
    if (raise.has('tokens')) Object.values(F.el.tokens).forEach((t) => hotWg.appendChild(t));

    if (U) {
      // UI state hooks: typed message spans (layout reserved), chips, score pill on the top layer
      K.ui = {
        msgs: U.msgEls.map((el) => { const p = el.querySelector('p'); const full = p.textContent; p.innerHTML = ''; const ty = ctx.el('span', 'ty', p, ''), rs = ctx.el('span', 'rs', p, full); rs.style.visibility = 'hidden'; return { el, ty, rs, full, n: 0 }; }),
        chips: U.chips,
      };
      U.chips.forEach((c) => { c.style.transformOrigin = '50% 50%'; c.style.display = 'inline-block'; });
      L.top.appendChild(U.score);
      const sc = U.score, atlas = sc.querySelector('.atlas'), vega = sc.querySelector('.vega'), cell = sc.querySelector('.clock');
      const round = cell.querySelector('span'), ck = cell.querySelector('.ck');
      M.clock = flapClock(ctx, { el: ck, value: o.clock ? (lt) => o.clock(lt, mOf(lt, lt + ctx.start)) : (lt) => Math.ceil(mOf(lt, lt + ctx.start) - 1e-6), minT: 0 });
      const wPill = sc.offsetWidth;
      sc.style.left = (W / 2 - wPill / 2).toFixed(1) + 'px';
      K.occl = {
        panels: [U.roster, U.channel, U.objective].map((el) => ({ el, r: rectOf(el, ctx.root) })),
        labs: Object.values(F.el.labels || {}).filter((g) => g.anchor).map((g) => ({ g, kids: [g.name, g.sub].filter(Boolean), bb: g.getBBox(), anchor: g.anchor })),
      };
      M.score = { el: sc, atlas, vega, cell, round, ck, w: { pill: wPill, atlas: atlas.offsetWidth, vega: vega.offsetWidth, cell: cell.offsetWidth }, left: W / 2 - wPill / 2, top: sc.offsetTop };
    }

    // ---- HUD (register corners + slug inside title-safe)
    if (o.hud) {
      M.hud = B.hud(ctx, { inset: 72, tc: false, ticks: false, drawIn: false, slug: '' });
      M.slug = o.slug ? B.label(ctx, { text: o.slug, x: 120, y: 990, size: 20, color: C.muted3, scramble: false, tracking: '.1em' }) : null;
    }

    // ---- API
    M.pre = (fn) => { M.pres.push(fn); return M; };
    M.setClip = (r) => { M.clipRect = r; };
    M.camera = {
      segs: camSegs,
      cut(at, preset) { camSegs.push({ at, dur: 0, to: preset, ease: 'none' }); camSegs.sort((a, b) => a.at - b.at); return M.camera; },
      move(at, dur, preset, e) { camSegs.push({ at, dur, to: preset, ease: e || B.E.camera }); camSegs.sort((a, b) => a.at - b.at); return M.camera; },
    };
    M.state = (m) => state(F, U, m);
    M.lift = (src, lo) => lift(ctx, M, src, lo);
    ready = true;
    // apply the first frame now so build-time measurements (e.g. a later lift) see real content
    state(F, U, mOf(0, ctx.start)); ambient(F, tauOf(0, ctx.start, mOf(0, ctx.start)));
    return M;
  }

  // -------------------------------------------------------------------------------------------
  // LIFT
  // -------------------------------------------------------------------------------------------
  function lift(ctx, M, src, lo) {
    lo = Object.assign({ at: 0, dur: 10 / FPS, out: null, outDur: 10 / FPS, scale: 2, cx: W / 2, top: 792, leader: 'elbow', dim: 0.6, pad: [9, 14], accent: null, fit: true }, lo);
    const L = M.L;
    const r = rectOf(src, ctx.root);
    const wrap = ctx.el('div', 'mx-lift-card', L.lift);
    const bg = ctx.el('div', 'mx-bg', wrap);
    if (lo.accent === 'rival') bg.style.borderColor = 'rgba(221,98,72,.42)';
    else if (lo.accent === 'amber') bg.style.borderColor = 'rgba(239,189,112,.45)';
    const clone = styledClone(src);
    clone.classList.add('mx-clone');
    clone.style.opacity = '1'; clone.style.transform = 'none'; clone.style.margin = '0';
    wrap.appendChild(clone);
    const [py, px] = lo.pad;
    wrap.style.padding = `${py}px ${px}px`;
    if (lo.fit) clone.style.width = 'max-content';
    if (lo.prep) lo.prep(clone, src, wrap, bg);       // (s08) adjust the clone before it is measured
    const cw = clone.offsetWidth, chh = clone.offsetHeight;
    const w0 = cw + 2 * px, h0 = chh + 2 * py;
    const x0 = r.x - px, y0 = r.y - py;
    // top may be a function of the measured card size (s08: bottom-anchored in-place lifts)
    const wf = w0 * lo.scale, xf = lo.cx - wf / 2, yf = typeof lo.top === 'function' ? lo.top(w0, h0, lo.scale) : lo.top;
    const P = { p: 0 };
    ctx.tl.fromTo(P, { p: 0 }, { p: 1, duration: lo.dur, ease: 'power3.out' }, lo.at);
    if (lo.out != null) ctx.tl.to(P, { p: 0, duration: lo.outDur, ease: 'power2.in' }, lo.out);
    let leader = null, ldot = null;
    if (lo.leader) {
      leader = ctx.svg('path', { fill: 'none', stroke: C.amber, 'stroke-width': 1, 'stroke-opacity': 0.9, pathLength: 1, 'stroke-dasharray': '0 2' }, L.liftSvg);
      ldot = ctx.svg('circle', { r: 2.5, fill: C.amber, opacity: 0 }, L.liftSvg);
    }
    const sx = r.x - 7, sy = r.y + r.h / 2;
    ctx.onFrame(() => {
      const p = P.p;
      if (p <= 0.0005) {
        if (wrap.style.display !== 'none') { wrap.style.display = 'none'; if (leader) { leader.style.display = 'none'; ldot.style.display = 'none'; } }
        return;
      }
      wrap.style.display = ''; if (leader) { leader.style.display = ''; ldot.style.display = ''; }
      const s = lerp(1, lo.scale, p), x = lerp(x0, xf, p), y = lerp(y0, yf, p);
      wrap.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
      bg.style.opacity = clamp01(p * 1.6).toFixed(3);
      if (leader) {
        const cb = y + h0 * s;                       // card bottom
        let d;
        if (lo.leader === 'elbow') { const xe = Math.max(x + 18 * s, r.x - 40); d = `M${xe.toFixed(1)} ${cb.toFixed(1)} V${sy.toFixed(1)} H${sx.toFixed(1)}`; }
        else if (lo.leader === 'side') {
          // (s08) from the card edge that faces a source lying to its right, level with the source
          // row when the card spans it, else with one elbow at the midpoint of the gap
          const cr = x + w0 * s, yy = Math.min(Math.max(sy, y + 14 * s), cb - 14 * s);
          if (Math.abs(yy - sy) < 0.5) d = `M${cr.toFixed(1)} ${sy.toFixed(1)} H${sx.toFixed(1)}`;
          else { const xm = (cr + sx) / 2; d = `M${cr.toFixed(1)} ${yy.toFixed(1)} H${xm.toFixed(1)} V${sy.toFixed(1)} H${sx.toFixed(1)}`; }
        }
        else d = `M${(x + w0 * s / 2).toFixed(1)} ${cb.toFixed(1)} L${sx.toFixed(1)} ${sy.toFixed(1)}`;
        leader.setAttribute('d', d);
        const f = clamp01((p - 0.2) / 0.8);
        leader.setAttribute('stroke-dasharray', `${f.toFixed(4)} 2`);
        ldot.setAttribute('cx', sx.toFixed(1)); ldot.setAttribute('cy', sy.toFixed(1)); ldot.setAttribute('opacity', (f >= 0.98 ? 1 : 0).toString());
      }
    });
    const rec = { P, o: lo, wrap, clone, bg, leader, rect: r, target: { x: xf, y: yf, w: wf, h: h0 * lo.scale } };
    M.lifts.push(rec);
    return rec;
  }

  window.Match = {
    buildMatchScreen, state, ambient, flapClock, lift,
    ROUTES, route, sampler, SLOTS, POSTS, VEGA, GHOST, KEYS, CAM, GRID, HANDOFF, SLUG,
    screenOf, fmt, scramble, seg, S,
  };
})();
