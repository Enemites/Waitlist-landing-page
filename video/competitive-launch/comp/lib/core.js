/* Realms film core: a tiny deterministic, Remotion-like frame engine for HTML + GSAP.
 *
 * Load order (see comp/index.html): core.js FIRST (it seeds Math.random before any library
 * runs), then gsap + plugins, then `Film.boot()`. Boot loads the manifest, then every scene
 * file in order, waits for fonts, builds each scene into its own root + paused timeline, and
 * exposes window.__film = { duration, fps, seek(t) -> Promise, ready, scenes, ... }.
 *
 * Rules for scene authors (enforced where possible, see engine/README.md):
 *  - Everything that moves lives on ctx.tl (a paused gsap timeline) or in ctx.onFrame(fn).
 *  - No CSS animations/transitions (base.css forces them off), no Date.now/performance.now
 *    driven visuals (flagged as errors during a seek), no Math.random for visuals: use
 *    ctx.rng(seed) / ctx.noise2D(seed). (Math.random is seeded anyway, as a safety net.)
 *  - No tweens outside ctx.tl (gsap.to(...) on the global timeline is reported as an error).
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------------------
  // Deterministic randomness. Installed before gsap/plugins load so their internal tables
  // (ScrambleText char sets, CustomWiggle) are reproducible too.
  // ---------------------------------------------------------------------------------------
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(str) {
    // FNV-1a 32 bit, then a murmur finaliser for good avalanche.
    let h = 0x811c9dc5;
    str = String(str);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return fmix(h);
  }
  function fmix(h) {
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }
  function seedOf(seed) {
    return typeof seed === 'number' && isFinite(seed) ? fmix((seed * 2654435761) >>> 0 ^ 0x9e3779b9) : hashStr(seed);
  }

  let globalRand = mulberry32(0x5eed1234);
  const nativeRandom = Math.random;
  Math.random = function () { return globalRand(); };
  function reseedGlobal(seed) { globalRand = mulberry32(seedOf(seed)); }

  // Flag wall-clock reads that happen while a frame is being computed.
  let inSeek = false;
  let clockWarned = 0;
  function clockGuard(name, fn, thisArg) {
    return function () {
      if (inSeek && clockWarned < 5) {
        const lines = (new Error().stack || '').split('\n');
        // gsap's own ticker reads the clock when it wakes up; it never drives a paused timeline
        if (lines[2] && /\/gsap(\.min)?\.js:/.test(lines[2]) && /_tick|wake/.test(lines[2] + lines[3])) return fn.apply(thisArg, arguments);
        clockWarned++;
        const stack = lines.slice(2, 5).join(' | ');
        console.error('[film] nondeterministic: ' + name + '() called while computing a frame. Drive visuals from time, not the clock. ' + stack);
      }
      return fn.apply(thisArg, arguments);
    };
  }
  const nowNative = performance.now.bind(performance); // engine-internal timing stats only
  Date.now = clockGuard('Date.now', Date.now, Date);
  if (window.performance && performance.now) performance.now = clockGuard('performance.now', performance.now, performance);

  // ---------------------------------------------------------------------------------------
  // Params + public state
  // ---------------------------------------------------------------------------------------
  const P = new URLSearchParams(location.search);
  const FPS = Number(P.get('fps')) > 0 ? Number(P.get('fps')) : 30;
  const W = 1920, H = 1080;
  const EPS = 1e-6;

  let resolveReady, rejectReady;
  const ready = new Promise((res, rej) => { resolveReady = res; rejectReady = rej; });
  ready.catch(() => {});

  const defs = new Map();      // id -> Film.scene() definition
  let manifest = null;         // array from manifest.js
  const scenes = [];           // runtime scenes
  let duration = 0;
  let stage = null;
  let hud = null;
  let currentTime = -1;
  let pending = [];
  let lastSeqIndex = -1;       // the sequential scene that owns the film's final frame            // decode promises created during the current seek

  const film = {
    fps: FPS, width: W, height: H, duration: 0, frames: 0,
    scenes: [], params: Object.fromEntries(P.entries()),
    ready, error: null, booted: false,
    seek, time: () => currentTime,
  };
  window.__film = film;

  function fail(msg, err) {
    const text = '[film] ' + msg + (err && err.stack ? '\n' + err.stack : err ? ' ' + err : '');
    console.error(text);
    if (!film.error) film.error = text;
    rejectReady(new Error(text));
    try { showError(text); } catch (e) { /* ignore */ }
  }
  window.addEventListener('error', (e) => {
    if (!film.booted) fail('script error: ' + (e.message || e.type) + ' at ' + (e.filename || (e.target && (e.target.src || e.target.href)) || '?') + ':' + (e.lineno || ''), e.error);
  }, true);
  window.addEventListener('unhandledrejection', (e) => {
    if (!film.booted) fail('unhandled rejection', e.reason);
  });

  // ---------------------------------------------------------------------------------------
  // Noise: seeded simplex 2D/3D (Gustavson), output roughly in [-1, 1]
  // ---------------------------------------------------------------------------------------
  const GRAD3 = new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]);
  function permTable(seed) {
    const r = mulberry32(seedOf(seed));
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    const perm = new Uint8Array(512), mod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; mod12[i] = perm[i] % 12; }
    return { perm, mod12 };
  }
  const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6, F3 = 1 / 3, G3 = 1 / 6;
  function noise2D(seed) {
    const { perm, mod12 } = permTable(seed === undefined ? 1 : seed);
    function n2(xin, yin) {
      let n0 = 0, n1 = 0, n2v = 0;
      const s = (xin + yin) * F2;
      const i = Math.floor(xin + s), j = Math.floor(yin + s);
      const t = (i + j) * G2;
      const x0 = xin - (i - t), y0 = yin - (j - t);
      let i1, j1;
      if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
      const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      const ii = i & 255, jj = j & 255;
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) { const g = mod12[ii + perm[jj]] * 3; t0 *= t0; n0 = t0 * t0 * (GRAD3[g] * x0 + GRAD3[g + 1] * y0); }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) { const g = mod12[ii + i1 + perm[jj + j1]] * 3; t1 *= t1; n1 = t1 * t1 * (GRAD3[g] * x1 + GRAD3[g + 1] * y1); }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) { const g = mod12[ii + 1 + perm[jj + 1]] * 3; t2 *= t2; n2v = t2 * t2 * (GRAD3[g] * x2 + GRAD3[g + 1] * y2); }
      return 70 * (n0 + n1 + n2v);
    }
    n2.fbm = function (x, y, o) { return fbm((a, b) => n2(a, b), x, y, o); };
    return n2;
  }
  function noise3D(seed) {
    const { perm, mod12 } = permTable(seed === undefined ? 1 : seed);
    function n3(xin, yin, zin) {
      let n0 = 0, n1 = 0, n2 = 0, n3v = 0;
      const s = (xin + yin + zin) * F3;
      const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
      const t = (i + j + k) * G3;
      const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
      let i1, j1, k1, i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
        else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
      } else {
        if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
        else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
        else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      }
      const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
      const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
      const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
      const ii = i & 255, jj = j & 255, kk = k & 255;
      let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 >= 0) { const g = mod12[ii + perm[jj + perm[kk]]] * 3; t0 *= t0; n0 = t0 * t0 * (GRAD3[g] * x0 + GRAD3[g + 1] * y0 + GRAD3[g + 2] * z0); }
      let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 >= 0) { const g = mod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3; t1 *= t1; n1 = t1 * t1 * (GRAD3[g] * x1 + GRAD3[g + 1] * y1 + GRAD3[g + 2] * z1); }
      let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 >= 0) { const g = mod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3; t2 *= t2; n2 = t2 * t2 * (GRAD3[g] * x2 + GRAD3[g + 1] * y2 + GRAD3[g + 2] * z2); }
      let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 >= 0) { const g = mod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3; t3 *= t3; n3v = t3 * t3 * (GRAD3[g] * x3 + GRAD3[g + 1] * y3 + GRAD3[g + 2] * z3); }
      return 32 * (n0 + n1 + n2 + n3v);
    }
    n3.fbm = function (x, y, z, o) { return fbm((a, b, c) => n3(a, b, c), x, y, o, z); };
    return n3;
  }
  function fbm(fn, x, y, o, z) {
    o = o || {};
    const oct = o.octaves || 4, lac = o.lacunarity || 2, gain = o.gain || 0.5;
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * fn(x * freq, y * freq, z === undefined ? 0 : z * freq + i * 17.13);
      norm += amp; amp *= gain; freq *= lac;
    }
    return sum / norm;
  }

  function rng(seed) {
    const r = mulberry32(seedOf(seed === undefined ? 1 : seed));
    r.range = (a, b) => a + (b - a) * r();
    r.int = (a, b) => Math.floor(a + (b - a + 1) * r());
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.sign = () => (r() < 0.5 ? -1 : 1);
    r.gauss = () => { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    return r;
  }

  // ---------------------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------------------
  const SVGNS = 'http://www.w3.org/2000/svg';
  function el(tag, className, parent, html) {
    const e = document.createElement(tag || 'div');
    if (className) e.className = className;
    if (html !== undefined && html !== null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function svg(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    attrs = attrs || {};
    if (tag === 'svg') {
      if (!('viewBox' in attrs)) e.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      if (!('width' in attrs)) e.setAttribute('width', W);
      if (!('height' in attrs)) e.setAttribute('height', H);
      if (!('overflow' in attrs)) e.setAttribute('overflow', 'visible');
    }
    for (const k in attrs) {
      const v = attrs[k];
      if (v === undefined || v === null || v === false) continue;
      if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v);
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---------------------------------------------------------------------------------------
  // Image sequences (pre-extracted b-roll): canvas that shows frame N for the current time.
  // ---------------------------------------------------------------------------------------
  function pad(n, w) { let s = String(n); while (s.length < w) s = '0' + s; return s; }
  function frameName(pattern, n) {
    return pattern.replace(/%0?(\d*)d/, (m, w) => pad(n, Number(w) || 0));
  }
  function fitRects(fit, sw, sh, dw, dh, ax, ay) {
    if (fit === 'fill') return [0, 0, sw, sh, 0, 0, dw, dh];
    const sr = sw / sh, dr = dw / dh;
    if (fit === 'contain') {
      let w = dw, h = dh;
      if (sr > dr) h = dw / sr; else w = dh * sr;
      return [0, 0, sw, sh, (dw - w) * ax, (dh - h) * ay, w, h];
    }
    // cover
    let cw = sw, ch = sh;
    if (sr > dr) cw = sh * dr; else ch = sw / dr;
    return [(sw - cw) * ax, (sh - ch) * ay, cw, ch, 0, 0, dw, dh];
  }

  function makeSequence(scene, opts) {
    if (!opts || !opts.dir) throw new Error('ctx.sequence: { dir } is required');
    if (!(opts.count > 0)) throw new Error('ctx.sequence: { count } (number of frames) is required');
    const o = Object.assign({
      fps: FPS, start: 0, loop: false, fit: 'cover', pattern: '%04d', ext: 'jpg', first: 1,
      offset: 0, rate: 1, width: W, height: H, preload: 6, align: [0.5, 0.5], time: null,
      className: '', parent: scene.ctx.root, smoothing: 'high',
    }, opts);
    const dir = o.dir.replace(/\/+$/, '') + '/';
    const cv = el('canvas', ('film-fill film-seq ' + o.className).trim(), o.parent);
    cv.width = o.width; cv.height = o.height;
    const g = cv.getContext('2d', { alpha: o.fit === 'contain' });
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = o.smoothing;
    const cache = new Map(); // url -> { bmp, promise, err }
    const maxCache = Math.max(8, o.preload * 2 + 4);
    let drawn = null, wanted = null;

    function urlFor(k) { return dir + frameName(o.pattern, o.first + k) + '.' + o.ext; }
    function indexAt(lt) {
      const st = typeof o.time === 'function' ? o.time(lt) : (lt - o.start) * o.rate;
      let k = Math.floor(st * o.fps + EPS) + o.offset;
      if (o.loop) k = ((k % o.count) + o.count) % o.count;
      else k = Math.min(o.count - 1, Math.max(0, k));
      return k;
    }
    function load(url) {
      let e = cache.get(url);
      if (e) { cache.delete(url); cache.set(url, e); return e; } // LRU touch
      e = { bmp: null, err: null, promise: null };
      e.promise = fetch(url).then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.blob();
      }).then((b) => createImageBitmap(b)).then((bmp) => {
        if (e.evicted) { bmp.close(); return null; }
        e.bmp = bmp; return bmp;
      }, (err) => {
        e.err = err;
        console.error('[film] sequence frame failed to load: ' + url + ' (' + err.message + ')');
      });
      cache.set(url, e);
      if (cache.size > maxCache) {
        for (const [u, old] of cache) {
          if (cache.size <= maxCache) break;
          if (u === wanted || u === drawn || u === url) continue;
          cache.delete(u);
          old.evicted = true;
          if (old.bmp) { old.bmp.close(); old.bmp = null; }
        }
      }
      return e;
    }
    function draw(url, bmp) {
      if (!bmp || url !== wanted) return;
      const r = fitRects(o.fit, bmp.width, bmp.height, cv.width, cv.height, o.align[0], o.align[1]);
      if (o.fit === 'contain') g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(bmp, r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]);
      drawn = url;
    }
    function update(lt) {
      const k = indexAt(lt);
      const url = urlFor(k);
      wanted = url;
      if (drawn !== url) {
        const e = load(url);
        if (e.bmp) draw(url, e.bmp);
        else if (!e.err) pending.push(e.promise.then(() => draw(url, e.bmp)));
      }
      // prefetch ahead (not awaited)
      for (let i = 1; i <= o.preload; i++) {
        let kk = k + i;
        if (o.loop) kk %= o.count; else if (kk >= o.count) break;
        load(urlFor(kk));
      }
    }
    scene.seqFns.push(update);
    cv.__seq = { opts: o, indexAt, urlFor };
    return cv;
  }

  // ---------------------------------------------------------------------------------------
  // Registration API
  // ---------------------------------------------------------------------------------------
  const globalFns = [];
  let overlayEl = null;
  const Film = {
    fps: FPS, width: W, height: H,
    utils: { mulberry32, hashStr, rng, noise2D, noise3D, fbm, el, svg },
    scene(def) {
      if (!def || !def.id || typeof def.build !== 'function') throw new Error('Film.scene({ id, duration, build(ctx) }) needs id and build');
      if (defs.has(def.id)) console.warn('[film] scene registered twice: ' + def.id);
      defs.set(def.id, def);
      return def;
    },
    manifest(list) {
      if (!Array.isArray(list)) throw new Error('Film.manifest([...]) expects an array');
      manifest = list.filter(Boolean);
    },
    // Film-wide layer above every scene (grain, vignette, letterbox). fn(t) runs after all
    // scenes on every seek; same purity rules as ctx.onFrame.
    overlay(fn) { if (typeof fn !== 'function') throw new Error('Film.overlay(fn) needs a function'); globalFns.push(fn); return fn; },
    overlayRoot() {
      if (!overlayEl) { overlayEl = el('div', 'film-overlay', null); overlayEl.id = 'film-overlay'; }
      return overlayEl;
    },
    boot,
  };
  window.Film = Film;

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => res();
      s.onerror = () => rej(new Error('could not load ' + src));
      document.head.appendChild(s);
    });
  }
  function safeRel(p) {
    if (typeof p !== 'string' || /^[a-z]+:/i.test(p) || p.startsWith('//')) throw new Error('only relative script paths are allowed: ' + p);
    return p;
  }

  const FONT_SPECS = [
    '400 32px "Manrope Variable"', '200 32px "Manrope Variable"', '800 32px "Manrope Variable"',
    '400 32px "JetBrains Mono Variable"', 'italic 400 32px "JetBrains Mono Variable"',
    '400 32px "Bricolage Grotesque Variable"',
    '400 32px "Instrument Serif"', 'italic 400 32px "Instrument Serif"',
  ];
  async function loadFonts() {
    // Sample text covers both the latin and latin-ext unicode ranges, so both faces load now
    // and never lazily in the middle of a render.
    await Promise.all(FONT_SPECS.map((f) => document.fonts.load(f, 'Aa0Āā')));
    await document.fonts.ready;
    const bad = [];
    document.fonts.forEach((ff) => { if (ff.status === 'error') bad.push(ff.family + ' ' + ff.style + ' ' + ff.weight); });
    if (bad.length) throw new Error('font faces failed to load: ' + bad.join(', '));
    const missing = FONT_SPECS.filter((f) => !document.fonts.check(f, 'Aa'));
    if (missing.length) throw new Error('fonts not available: ' + missing.join(', '));
    // check() is also true for a family nobody declared, so make sure each one really loaded
    const loaded = new Set();
    document.fonts.forEach((ff) => { if (ff.status === 'loaded') loaded.add(ff.family.replace(/["']/g, '')); });
    const undeclared = [...new Set(FONT_SPECS.map((f) => f.match(/"([^"]+)"/)[1]))].filter((fam) => !loaded.has(fam));
    if (undeclared.length) throw new Error('no loaded @font-face for: ' + undeclared.join(', ') + ' (check comp/lib/base.css)');
    film.fonts = [...loaded];
  }

  function patchScrambleText() {
    // ScrambleText keeps history (prevScrambleTime, setIndex += random) so a frame would depend
    // on which frames were rendered before it. Make the scramble a pure function of
    // (tween text, tween start, quantised tween time).
    const Plugin = window.gsap && gsap.plugins && gsap.plugins.scrambleText;
    if (!Plugin || !Plugin.prototype || Plugin.prototype.__filmPatched) return;
    const orig = Plugin.prototype.render;
    Plugin.prototype.render = function (ratio, data) {
      const tw = data.tween;
      if (data.__filmSeed === undefined) {
        data.__filmSeed = hashStr((data.text || []).join(data.delimiter || '') + '|' + (data.original || []).join('') + '|' + (tw ? tw._start : 0).toFixed(4));
      }
      const time = tw ? tw._time : 0;
      const step = Math.floor(time / data.speed + EPS);
      const idx = fmix((data.__filmSeed ^ Math.imul(step + 1, 0x9e3779b1)) >>> 0) % 20;
      if (data.charSet && data.charSet.sets[idx]) { data.setIndex = idx; data.chars = data.charSet.sets[idx]; }
      data.prevScrambleTime = time;
      return orig.call(this, ratio, data);
    };
    Plugin.prototype.__filmPatched = true;
  }

  // ---------------------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------------------
  async function boot() {
    try {
      if (!window.gsap) throw new Error('gsap is not loaded');
      const plugins = ['SplitText', 'DrawSVGPlugin', 'MorphSVGPlugin', 'MotionPathPlugin', 'ScrambleTextPlugin', 'CustomEase', 'CustomWiggle', 'CustomBounce', 'Physics2DPlugin', 'TextPlugin', 'EasePack']
        .map((n) => window[n]).filter(Boolean);
      gsap.registerPlugin.apply(gsap, plugins);
      gsap.config({ force3D: false, nullTargetWarn: true });
      gsap.ticker.lagSmoothing(0);
      patchScrambleText();

      stage = document.getElementById('stage');
      if (!stage) { stage = el('div', '', document.body); stage.id = 'stage'; }

      const manifestSrc = safeRel(P.get('manifest') || 'scenes/manifest.js');
      await loadScript(manifestSrc);
      if (!manifest) throw new Error(manifestSrc + ' did not call Film.manifest([...])');
      const base = manifestSrc.replace(/[^/]*$/, '');
      let entries = manifest.map((e) => Object.assign({}, e, { file: e.file || e.id + '.js' }));
      const only = P.get('scene');
      if (only) {
        entries = entries.filter((e) => e.id === only);
        if (!entries.length) {
          // allow isolating a scene that is not (or no longer) listed: find its file by id
          entries = [{ id: only, file: only + '.js' }];
        }
      }
      if (!entries.length) throw new Error('the manifest is empty: list at least one scene in ' + manifestSrc);
      for (const e of entries) await loadScript(base + safeRel(e.file));
      if (film.error) throw new Error('a scene file failed to load (see the error above)');

      await loadFonts();

      // timeline layout: entry.overlap = seconds this scene starts BEFORE the previous one ends.
      // OVERLAY entries ({ id, at, duration }) sit on top of the sequence at an absolute film time
      // and do not move the scenes after them (inserts, flashes); they always render above.
      let t = 0;
      let prevSeq = null;
      let overlayEnd = 0;
      entries.forEach((e, i) => {
        const def = defs.get(e.id);
        if (!def) throw new Error('scene "' + e.id + '" (' + e.file + ') did not call Film.scene({ id: "' + e.id + '" })');
        const dur = Number(e.duration != null ? e.duration : def.duration);
        if (!(dur > 0)) throw new Error('scene "' + e.id + '" needs a positive duration');
        if (e.duration != null && def.duration != null && Math.abs(e.duration - def.duration) > EPS) {
          console.warn('[film] scene "' + e.id + '": manifest duration ' + e.duration + 's overrides scene duration ' + def.duration + 's');
        }
        if (e.at != null && !only) {
          const start = Number(e.at);
          if (!(start >= 0)) throw new Error('overlay "' + e.id + '": at must be >= 0');
          const s = { id: e.id, def, index: i, start, duration: dur, end: start + dur, overlapIn: 0, overlapOut: 0, frameFns: [], seqFns: [], on: true, lt: 0, overlay: true };
          scenes.push(s);
          overlayEnd = Math.max(overlayEnd, start + dur);
          return;
        }
        let ov = only || !prevSeq ? 0 : Number(e.overlap || 0);
        const prev = prevSeq;
        if (ov < 0) throw new Error('scene "' + e.id + '": overlap must be >= 0');
        if (prev && ov >= prev.duration) throw new Error('scene "' + e.id + '": overlap ' + ov + 's must be shorter than previous scene (' + prev.duration + 's)');
        if (ov >= dur) throw new Error('scene "' + e.id + '": overlap must be shorter than its duration');
        const start = !prev ? 0 : t - ov;
        const s = { id: e.id, def, index: i, start, duration: dur, end: start + dur, overlapIn: ov, overlapOut: 0, frameFns: [], seqFns: [], on: true, lt: 0 };
        if (prev) prev.overlapOut = ov;
        scenes.push(s);
        prevSeq = s;
        t = start + dur;
      });
      lastSeqIndex = prevSeq ? prevSeq.index : -1;
      if (overlayEnd > t + EPS) throw new Error('an overlay ends at ' + overlayEnd.toFixed(3) + ' s, after the film (' + t.toFixed(3) + ' s)');
      if (only) {
        // keep the authored exit timing when previewing a scene alone
        const full = manifest.map((e) => e.id);
        const idx = full.indexOf(only);
        if (idx >= 0 && idx + 1 < manifest.length) scenes[0].overlapOut = Number(manifest[idx + 1].overlap || 0);
        const me = manifest[idx];
        if (me) scenes[0].overlapIn = Number(me.overlap || 0) * (idx > 0 ? 1 : 0);
      }
      duration = t;

      // build each scene in order, in its own root, with its own paused timeline
      for (const s of scenes) {
        reseedGlobal('build:' + s.id); // build-time randomness independent of other scenes
        const root = el('div', 'film-scene', stage);
        root.dataset.scene = s.id;
        root.style.zIndex = String((s.overlay ? 1000 : 0) + s.index + 1);
        const tl = gsap.timeline({ paused: true });
        s.tl = tl; s.root = root;
        const ctx = {
          id: s.id, root, tl, duration: s.duration, start: s.start, end: s.end, fps: FPS, width: W, height: H,
          overlapIn: s.overlapIn, overlapOut: s.overlapOut, params: film.params, gsap: window.gsap,
          onFrame(fn) { if (typeof fn !== 'function') throw new Error('onFrame(fn) needs a function'); s.frameFns.push(fn); return fn; },
          rng, noise2D, noise3D, fbm, el: (tag, cls, parent, html) => el(tag, cls, parent === undefined ? root : parent, html),
          svg: (tag, attrs, parent) => svg(tag, attrs, parent === undefined ? root : parent),
          canvas(o) {
            o = o || {};
            const c = el('canvas', ('film-fill ' + (o.className || '')).trim(), o.parent === undefined ? root : o.parent);
            c.width = o.width || W; c.height = o.height || H;
            return { canvas: c, g: c.getContext('2d', { alpha: o.alpha !== false }) };
          },
          css(text) { const st = el('style', '', document.head); st.dataset.scene = s.id; st.textContent = text; return st; },
          image(src, cls, parent) { const img = el('img', cls || '', parent === undefined ? root : parent); img.decoding = 'sync'; img.src = src; return img; },
          sequence: (o) => makeSequence(s, o),
          frames: (n) => n / FPS,
          seconds: (sec) => Math.round(sec * FPS),
        };
        s.ctx = ctx;
        const before = new Set(gsap.globalTimeline.getChildren(false, true, true));
        await s.def.build(ctx);
        const strays = gsap.globalTimeline.getChildren(false, true, true)
          .filter((c) => c !== tl && !before.has(c) && !scenes.some((o) => o.tl === c) && c.duration() > 0);
        if (strays.length) {
          throw new Error('scene "' + s.id + '" created ' + strays.length + ' tween(s)/timeline(s) outside ctx.tl (e.g. gsap.to/gsap.from/gsap.delayedCall). Put them on ctx.tl so they follow the film clock.');
        }
        if (!(tl.totalDuration() < 1e5)) {
          throw new Error('scene "' + s.id + '": ctx.tl is (nearly) infinite. Do not use repeat: -1 on the scene timeline; use a finite repeat or ctx.onFrame for loops.');
        }
        if (tl.duration() > s.duration + 1 / FPS) {
          console.warn('[film] scene "' + s.id + '": timeline is ' + tl.duration().toFixed(3) + 's but the scene lasts ' + s.duration + 's; the tail is cut');
        }
        // Pre-roll: initialise every tween (records start values, DrawSVG lengths, MotionPath
        // data, ScrambleText sets) in time order while the root is displayed.
        tl.progress(1, true).progress(0, true);
      }

      // images present in the DOM must be decoded before the first frame
      const imgs = Array.from(document.images);
      await Promise.all(imgs.map((img) => img.decode().catch(() => { throw new Error('image failed to load: ' + img.src); })));
      const svgImgs = Array.from(document.querySelectorAll('svg image'));
      await Promise.all(svgImgs.map((im) => {
        const href = im.getAttribute('href') || im.getAttribute('xlink:href');
        if (!href) return null;
        const pre = new Image(); pre.src = new URL(href, location.href).href;
        return pre.decode().catch(() => { throw new Error('svg <image> failed to load: ' + href); });
      }));

      if (overlayEl) stage.appendChild(overlayEl); // no z-index: its children join the stage stacking context so blend modes see the scenes
      if (P.get('guides') === '1') buildGuides();
      if (P.get('hud') === '1' || P.get('guides') === '1') { hud = el('div', '', stage); hud.id = 'film-hud'; }

      film.duration = duration;
      film.frames = Math.round(duration * FPS);
      film.scenes = scenes.map((s) => ({ overlay: !!s.overlay, id: s.id, start: +s.start.toFixed(6), end: +s.end.toFixed(6), duration: s.duration, overlapIn: s.overlapIn, overlapOut: s.overlapOut }));
      film.isolated = only || null;
      film.manifestSrc = manifestSrc;
      film.booted = true;

      const t0 = P.get('t') != null ? Number(P.get('t')) : 0;
      await seek(isFinite(t0) ? t0 : 0);
      document.documentElement.dataset.filmReady = '1';
      resolveReady(film);
      if (P.get('play') === '1') play();
    } catch (err) {
      fail('boot failed: ' + (err && err.message ? err.message : err), err);
    }
  }

  // ---------------------------------------------------------------------------------------
  // Seek: the only way time moves
  // ---------------------------------------------------------------------------------------
  let chain = Promise.resolve();
  function seek(t) {
    const p = chain.then(() => doSeek(t));
    chain = p.catch(() => {});
    return p;
  }
  function raf() { return new Promise((r) => requestAnimationFrame(() => r())); }

  async function doSeek(tIn) {
    if (!film.booted) throw new Error('film not booted yet; await __film.ready');
    let t = Number(tIn);
    if (!isFinite(t)) throw new Error('seek(t): t must be a number, got ' + tIn);
    t = Math.min(Math.max(t, 0), duration);
    reseedGlobal(Math.round(t * 48000)); // per-frame seed: Math.random in a frame is a function of t
    pending = [];
    const perScene = {};
    const c0 = nowNative();
    inSeek = true;
    try {
      const last = scenes.length - 1;
      for (const s of scenes) {
        const lt = t - s.start;
        const on = lt >= -EPS && (lt < s.duration - EPS || ((s.index === lastSeqIndex || (lastSeqIndex < 0 && s.index === last)) && lt <= s.duration + EPS));
        if (on !== s.on) { s.root.classList.toggle('is-off', !on); s.on = on; }
        if (on) {
          s.lt = Math.min(Math.max(lt, 0), s.duration);
          s.tl.totalTime(Math.min(s.lt, s.tl.duration()), true);
        }
      }
      for (const s of scenes) {
        if (!s.on) continue;
        const a = nowNative();
        for (const fn of s.seqFns) fn(s.lt, t);
        for (const fn of s.frameFns) fn(s.lt, t);
        perScene[s.id] = +(nowNative() - a).toFixed(2);
      }
      if (globalFns.length && P.get('overlay') !== '0') {
        const a = nowNative();
        for (const fn of globalFns) fn(t);
        perScene['@overlay'] = +(nowNative() - a).toFixed(2);
      }
    } finally {
      inSeek = false;
    }
    if (hud) {
      const act = scenes.filter((s) => s.on).map((s) => s.id + '@' + s.lt.toFixed(2)).join(' ');
      hud.textContent = 't ' + t.toFixed(3) + '  f ' + Math.round(t * FPS) + '  ' + act;
    }
    const c1 = nowNative();
    // Force style/layout now so any font load or image fetch the new DOM needs starts now.
    void stage.getBoundingClientRect();
    const c2 = nowNative();
    await document.fonts.ready;
    while (pending.length) { const p = pending; pending = []; await Promise.all(p); }
    const imgs = [];
    for (const img of document.images) if (!img.complete) imgs.push(img.decode().catch(() => console.error('[film] image failed: ' + img.src)));
    if (imgs.length) await Promise.all(imgs);
    const c3 = nowNative();
    await raf();
    await raf();
    if (document.fonts.status !== 'loaded') { await document.fonts.ready; await raf(); await raf(); }
    // timing of the last seek, in ms (diagnostics only; never feeds visuals)
    film.stats = { compute: +(c1 - c0).toFixed(2), onFrame: perScene, layout: +(c2 - c1).toFixed(2), decode: +(c3 - c2).toFixed(2), paint: +(nowNative() - c3).toFixed(2) };
    currentTime = t;
    return t;
  }

  // ---------------------------------------------------------------------------------------
  // Preview helpers: guides, real-time playback (?play=1), error overlay
  // ---------------------------------------------------------------------------------------
  function buildGuides() {
    const g = el('div', '', stage); g.id = 'film-guides';
    el('div', 'g-box g-action', g); el('div', 'g-box g-title', g);
    const l1 = el('div', 'g-line', g); Object.assign(l1.style, { left: '50%', top: '0', width: '1px', height: '100%' });
    const l2 = el('div', 'g-line', g); Object.assign(l2.style, { top: '50%', left: '0', height: '1px', width: '100%' });
    [1, 2].forEach((k) => {
      const v = el('div', 'g-line', g); Object.assign(v.style, { left: (k * 100 / 3) + '%', top: '0', width: '1px', height: '100%', opacity: '0.4' });
      const h = el('div', 'g-line', g); Object.assign(h.style, { top: (k * 100 / 3) + '%', left: '0', height: '1px', width: '100%', opacity: '0.4' });
    });
    const a = el('div', 'g-label', g, 'ACTION SAFE 93%'); Object.assign(a.style, { left: '3.5%', top: 'calc(3.5% - 18px)' });
    const b = el('div', 'g-label', g, 'TITLE SAFE 90%'); Object.assign(b.style, { left: '5%', top: 'calc(5% + 8px)', color: 'rgba(255,60,160,.9)' });
  }
  function play() {
    const clock = performance.now.bind(performance);
    const t0 = clock() - Math.max(0, currentTime) * 1000;
    const loop = async () => {
      const t = ((clock() - t0) / 1000) % duration;
      await seek(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  function showError(text) {
    const box = el('pre', '', document.body, '');
    box.textContent = text;
    Object.assign(box.style, { position: 'absolute', left: '40px', top: '40px', right: '40px', zIndex: 999999, color: '#fff', background: 'rgba(160,20,20,.92)', font: '18px/1.4 monospace', padding: '20px', whiteSpace: 'pre-wrap', margin: 0 });
  }

  film._nativeRandom = nativeRandom;
})();
