# Film engine: HTML + GSAP to a frame-exact 1920x1080 / 30 fps video

This is a small Remotion-style engine. A film is a list of **scenes**. Each scene is plain browser
JS that builds DOM/SVG/canvas into its own root and puts every movement on its own **paused GSAP
timeline**. `engine/render.mjs` opens `comp/index.html` in headless Chromium, calls
`__film.seek(t)` for every frame, screenshots it (lossless PNG) and pipes the frames into x264.
Rendering is deterministic: the same frame gives the same pixels in every run, in any worker,
whatever was rendered before it (verified bit-for-bit, see the end of this file).

```
comp/index.html            stage + script tags (gsap, plugins, core) -> Film.boot()
comp/lib/base.css          @font-face (Manrope, JetBrains Mono, Bricolage, Instrument Serif), brand tokens
comp/lib/core.js           Film.scene / Film.manifest / ctx API / __film.seek
comp/scenes/manifest.js    scene order + durations + overlaps (the film)
comp/scenes/manifest.demo.js   engine test film (_demo + _demo_outro)
comp/scenes/_demo.js       demo of every feature (SplitText, DrawSVG, MotionPath, ScrambleText, canvas, sequence)
engine/render.mjs          renderer: video / stills / contact sheets / --serve (static preview server)
engine/extract-frames.sh   b-roll clip -> numbered JPEG sequence, optional amber duotone grade
```

npm shortcuts (package.json): `npm run render -- <args>`, `npm run serve`, `npm run demo`,
`npm run frames -- <in> <outdir> [...]`.

## Quick start

```bash
cd video/competitive-launch
# engine test film (10.2 s). The demo b-roll frames live in .work (gitignored); make them once:
engine/extract-frames.sh "../../public/assets/scene/dynamic arena.mp4" .work/engine-test/seq-arena \
  --from 1.5 --to 3.5 --grade amber
node engine/render.mjs --manifest scenes/manifest.demo.js --contact .work/sheets --every 0.5
node engine/render.mjs --manifest scenes/manifest.demo.js --out .work/engine-test/demo.mp4

# the film
node engine/render.mjs --contact .work/sheets --every 0.5          # review sheet(s)
node engine/render.mjs --scene s03-lobby --stills 1,2.5,4 --outdir .work/stills
node engine/render.mjs --out out/realms-competitive.mp4            # final (x264 slow, crf 14)
```

Interactive preview in a desktop browser: `node engine/render.mjs --serve 8090` and open
`http://127.0.0.1:8090/comp/index.html?scene=<id>&t=2.5&guides=1` (see URL params below).

## Authoring a scene

```js
// comp/scenes/s03-lobby.js
Film.scene({
  id: 's03-lobby',
  duration: 6,                       // the manifest value wins if both are given
  build(ctx) {                       // may be async (await image loads, fetch JSON, ...)
    const { root, tl } = ctx;
    ctx.css(`[data-scene="s03-lobby"] .title { position:absolute; left:132px; top:600px;
      font: 600 128px/1 var(--display); letter-spacing: var(--track-display); }`);
    const title = ctx.el('div', 'title', root, 'From the lobby.<br><span class="t-amber">Into the match.</span>');
    const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'ln' });
    tl.from(split.lines, { yPercent: 118, duration: 1.1, ease: 'expo.out', stagger: 0.3 }, 0.4);

    const { g } = ctx.canvas();                  // full-frame 2D canvas
    const noise = ctx.noise3D('lobby');
    ctx.onFrame((t) => { /* draw from t only */ });
  },
});
```

Then list it in `comp/scenes/manifest.js`:

```js
Film.manifest([
  { id: 's01-cold-open', file: 's01-cold-open.js', duration: 5 },
  { id: 's02-world',     file: 's02-world.js',     duration: 7, overlap: 0.6 },
  { id: 's03-lobby',     file: 's03-lobby.js',     duration: 6, overlap: 0.4 },
]);
```

* **`overlap` = seconds THIS scene starts before the PREVIOUS scene ends.** Both scenes render
  during the overlap and the later scene is on top (z-order = manifest order), so the incoming
  scene owns the transition (wipe, mask, crossfade of its own root...). The outgoing scene keeps
  playing its tail underneath; it can time its exit with `ctx.overlapOut`.
* Film length = sum(durations) - sum(overlaps). A scene is visible only while
  `start <= t < start + duration` (it gets `display:none` otherwise). The render log prints the
  computed start/end of every scene.
* A scene's local time runs 0..duration. With `?scene=<id>` / `--scene <id>` the scene plays
  alone and its local time is the master time (it does not have to be listed in the manifest:
  the file `<id>.js` is loaded by name).

### `ctx` API

| member | what it is |
|---|---|
| `ctx.root` | the scene's absolutely positioned 1920x1080 root div (`[data-scene="<id>"]`) |
| `ctx.tl` | the scene's paused `gsap.timeline()`; local time 0..duration. **Everything that moves goes here.** |
| `ctx.onFrame(fn(localT, globalT))` | called on every seek while the scene is visible, after `ctx.tl` is set (so it can read tweened proxies). Must be a pure function of time. |
| `ctx.rng(seed)` | mulberry32 PRNG `r()` in [0,1) plus `r.range(a,b)`, `r.int(a,b)`, `r.pick(arr)`, `r.sign()`, `r.gauss()`. Seed is a number or a string. |
| `ctx.noise2D(seed)` / `ctx.noise3D(seed)` | seeded simplex noise, `n(x,y)` / `n(x,y,z)` in about [-1,1]; `n.fbm(x,y[,z],{octaves,lacunarity,gain})` |
| `ctx.el(tag, className, parent = root, html)` | create an HTML element |
| `ctx.svg(tag, attrs, parent = root)` | create an SVG element (`svg` gets viewBox `0 0 1920 1080`, width/height 1920x1080, overflow visible). attrs: `text`, `html`, `style` (object) are special. |
| `ctx.canvas({ width, height, parent, className, alpha })` | `{ canvas, g }`, full-frame 2D canvas by default |
| `ctx.sequence({...})` | canvas showing frame N of a numbered JPEG/PNG sequence for the current time (see below) |
| `ctx.image(src, className, parent)` | `<img>` that is guaranteed decoded before the first frame |
| `ctx.css(text)` | append a `<style>`; scope rules with `[data-scene="<id>"]` |
| `ctx.duration`, `ctx.start`, `ctx.end`, `ctx.fps`, `ctx.width`, `ctx.height`, `ctx.id` | timing / geometry |
| `ctx.overlapIn`, `ctx.overlapOut` | seconds this scene overlaps the previous / next scene |
| `ctx.frames(n)` / `ctx.seconds(s)` | frames to seconds / seconds to frames |
| `ctx.params` | URL params (strings) |

Globals: `gsap` and every plugin (`SplitText`, `DrawSVGPlugin`, `MorphSVGPlugin`,
`MotionPathPlugin`, `ScrambleTextPlugin`, `CustomEase`, `CustomWiggle`, `CustomBounce`,
`TextPlugin`, `Physics2DPlugin`, EasePack) are loaded and registered. `Film.utils` has the same
helpers for code outside a scene.

CSS tokens (base.css): `--bg --bg-2 --bg-3 --bg-warm --map --amber --amber-light --amber-soft
--amber-deep --amber-line --amber-dark --contour --contour-index --rival --rival-deep --bone
--bone-2 --ink --ink-2 --muted --muted-2 --muted-3 --line`, fonts `--display` (Manrope Variable),
`--mono` (JetBrains Mono Variable), `--grotesk` (Bricolage Grotesque Variable), `--serif`
(Instrument Serif), `--track-display: -0.055em`, `--track-mono: .1em`; helper classes
`.t-display .t-mono .t-amber .t-muted .film-fill`. Direct `svg`/`canvas` children of a scene
root are absolutely positioned at 0,0 (full-frame layers, stacked in DOM order).

### Rules (determinism)

1. **Everything on `ctx.tl` or `ctx.onFrame`.** A tween created outside the scene timeline
   (`gsap.to(...)`, `gsap.from`, `gsap.delayedCall`) fails the boot with an error. `gsap.set` is fine.
2. **No CSS animations or transitions.** They run on the wall clock. base.css forces
   `animation: none !important; transition: none !important` on every element.
3. **No `Date.now()` / `performance.now()` in visuals.** Calls made while a frame is computed
   are reported as errors (render fails). Use `localT`.
4. **No `Math.random()` for visuals:** use `ctx.rng(seed)`. (As a safety net Math.random is
   seeded: per scene during build, and per frame during a seek, so it cannot flicker between
   runs; but per-frame reseeding means it is not continuous across frames.)
5. **No `repeat: -1`** on anything inside `ctx.tl` (the scene timeline becomes infinite, boot
   fails). Use a finite `repeat`, or `onFrame` for endless loops (pulses, rotations).
6. **Pure `onFrame`:** draw everything from `t` each call (clear the canvas first); never
   accumulate state across calls (frames are rendered out of order by different workers).
7. Images: use `ctx.image()` / `ctx.sequence()` / plain `<img>` (all decoded before capture).
   Avoid CSS `background-image` for anything that must be on screen on its first frame.
8. Fonts are loaded before `build()` runs, so SplitText measures the real faces. Do not use
   SplitText `autoSplit`.

### GSAP notes that bite

* `from()` / `fromTo()` render their from-state **immediately** (at local time 0). That is what
  you want for entrances. For something that must stay as authored until later, pass
  `immediateRender: false`.
* Transforms are 2D by default (`gsap.config({ force3D: false })`): no surprise layer promotion,
  crisp text at the end of tweens. Use `z`/`rotationX` only when you mean 3D.
* SplitText `mask: 'lines'` clips at the line box. Pad the mask so descenders survive:
  `.ln-mask { padding: 0 .06em .16em; margin: 0 -.06em -.16em; }` (mask class = linesClass + `-mask`).
* DrawSVG uses the dash array, so it cannot draw an already dashed stroke. Draw a solid path inside
  a `<mask>` and apply the mask to the dashed path (see `_demo.js`).
* MotionPath on an SVG element without `align` uses the raw path coordinates as x/y. Build the
  moving element around (0,0) and set `transformOrigin` to the point that must sit on the path
  (e.g. `'100% 50%'` for an arrow tip) before using `autoRotate`.
* ScrambleText is patched by core.js so its random characters depend only on (text, tween start,
  time): it is safe. Other plugins have no hidden clock.
* `svgOrigin` is in the coordinate space of the element's parent.

## Image sequences (b-roll)

Video elements are not frame-accurate, so b-roll is pre-extracted to JPEG frames:

```bash
engine/extract-frames.sh <in.mp4> <outdir> [--fps 30] [--from s --to s] [--grade amber|none]
    [--width 1920] [--height H (crop to cover)] [--grain 7] [--contrast 1.15] [--black 0 --white 1]
    [--vignette 1] [--q 2] [--compare before-after.jpg] [--print-filter]
# e.g. archival footage, amber grade, with a before/after check still
engine/extract-frames.sh .work/broll/clips/floodgate-gatun-spillway.mp4 .work/frames/spillway \
  --from 1 --to 3 --grade amber --black 0.06 --white 0.95 --contrast 1.2 --compare .work/frames/spillway-ba.jpg
```

`--grade amber` maps luminance to the brand ramp `#0b0c0e > #5a472f > #a37a42 > #f6d39f` (with
contrast, input levels, an edge vignette and fine luma grain; all pure ffmpeg filters, seeded, so
re-running gives identical frames). It writes `0001.jpg ...` plus `sequence.json` (count, fps, size).
Example: `.work/engine-test/grade-before-after.jpg`.

```js
const cv = ctx.sequence({
  dir: '../.work/frames/spillway', // relative to comp/index.html, or root-absolute '/.work/frames/spillway'
  count: 60,          // frames in the folder (sequence.json has it)
  fps: 30,            // sequence frame rate (default: film fps)
  start: 1.2,         // scene-local second at which frame 1 shows (held before that)
  loop: false,        // loop, or hold the last frame
  fit: 'cover',       // cover | contain | fill
  align: [0.5, 0.5],  // object-position for cover/contain
  rate: 1,            // playback speed; or time: (localT) => sequenceSeconds for ramps
  width: 1920, height: 1080,  // canvas backing size: use the on-screen size of the panel
  parent: someDiv,    // default ctx.root; the canvas has class film-fill (fills its parent)
  // pattern: '%04d', ext: 'jpg', first: 1, offset: 0, preload: 6
});
tl.fromTo(cv, { scale: 1.1 }, { scale: 1, duration: 4, ease: 'power2.out' }, 0);
```

The seek waits until the needed frame is fetched, decoded (`createImageBitmap`) and drawn; the
next frames are prefetched. A missing frame is an HTTP 404 and fails the render.

## Rendering

All modes start a static server rooted at `video/competitive-launch` and drive Chromium
(viewport 1920x1080, DPR 1, `--force-color-profile=srgb --font-render-hinting=none
--disable-lcd-text --disable-gpu --disable-checker-imaging --run-all-compositor-stages-before-draw`
and friends). Any page error, `console.error`, failed request or HTTP >= 400 stops the render with
exit code 1 and prints the messages.

```bash
# video: frames split into N contiguous chunks, one browser per worker, one x264 per chunk,
# then a lossless concat; ffprobe check of size/fps/pix_fmt/colour tags/frame count at the end
node engine/render.mjs --out out/film.mp4 [--from 12 --to 20] [--scene id] [--workers 3]
       [--crf 14] [--preset slow] [--tune animation] [--gop 30] [--hashes frames.sha256.txt]
# quick drafts
node engine/render.mjs --out .work/draft.mp4 --scale 0.5 --preset veryfast --crf 20 --workers 4
# stills (PNG, named by time: t0007.250.png, prefixed with the scene id when --scene is used)
node engine/render.mjs --stills 1.5,3,7.25 --outdir .work/stills [--scene id]
# contact sheets (JPEG, 6 rows per sheet by default; time, frame and active scene burned in)
node engine/render.mjs --contact .work/sheets --every 0.5 [--scene id] [--cols 6] [--width 320] [--rows 6]
# other
--manifest scenes/manifest.demo.js   # another manifest (path relative to comp/)
--guides / --params 'hud=1'          # safe-area guides / time readout burned into the output (previews only)
--encode none                        # capture only (benchmark)   --keep-chunks   --verbose (page console.log)
```

Video output: H.264 High, yuv420p, `bt709` primaries/transfer/matrix, TV range, GOP 30, `+faststart`,
no audio (the mix is muxed later). The PNG -> YUV conversion is done explicitly with the BT.709
matrix (`scale=out_color_matrix=bt709:out_range=tv`), so brand colours survive: `#efbd70` decodes
back to (239,189,112). Frame `n` is sampled at `t = n / fps`; the film has `round(duration * fps)` frames.

URL params of `comp/index.html` (for manual previews): `?scene=<id>` isolate a scene,
`?t=<s>` seek once and stay, `?guides=1` title-safe (90%) / action-safe (93%) guides,
`?hud=1` time/frame/scene readout, `?play=1` rough real-time playback (preview only, not
frame-accurate), `?manifest=scenes/manifest.demo.js`, `?fps=30`.
In the console: `await __film.seek(3.2)`, `__film.scenes`, `__film.stats` (ms spent in the last
seek: compute, per-scene onFrame, decode, paint).

## Performance (measured on this machine: 4 vCPU, shared with other jobs)

Test: the 10.2 s demo (306 frames: full-frame canvas contour field redrawn every frame, SVG
board, SplitText, DrawSVG/MotionPath, a 1080p JPEG sequence). The machine was shared with other
jobs (b-roll downloads), so numbers vary by roughly 30%.

Per frame, one worker: seek ~70 ms (scene compute ~10 ms incl. the contour `onFrame`, layout
<1 ms, decode ~1 ms, style+paint+2 rAF ~55 ms) + lossless capture ~110 ms
(`Page.captureScreenshot` PNG with `optimizeForSpeed`; 260 ms without it). x264 `slow` crf 14
costs ~140 ms CPU per 1080p frame (`medium` ~97 ms).

| workers | capture only (`--encode none`) | full pipeline, run 1 (heavy outside load) | full pipeline, run 2 |
|---|---|---|---|
| 1 | 6.0 fps | 4.9 fps | 5.7 fps |
| 2 | 10.8 fps | 6.9 fps | 8.5 fps |
| 3 | 14.4 fps | 6.3 fps | 10.6 fps |
| 4 | 17.4 fps | 6.5 fps | 10.9 fps |
| 6 | 18.9 to 20.2 fps | 6.5 fps | 10.4 fps |

**Default: 3 workers.** With x264 `slow` the machine is CPU bound at 3 workers (93% busy); 4 gains
about 3% and 6 is slower, so 3 keeps the same speed and leaves room for other jobs. Final demo render
with the defaults: 306 frames in 36 s = 8.8 fps. Expect a 70 s film (2100 frames) to take about
3.5 to 6 min at crf 14 / slow. Drafts: `--scale 0.5 --preset veryfast --crf 20 --workers 4` (~12 fps
under load, 960x540). Contact sheet of the 10 s demo: 3 s. Stills: 1 to 2 s including boot.

Budget per frame for scene authors: keep `onFrame` work under ~15 ms (read `__film.stats.onFrame`
in the browser console). Software raster is the cost centre: avoid large `filter: blur()`,
`backdrop-filter`, huge soft `box-shadow`s and full-frame `mix-blend-mode` layers; pre-render
heavy textures to PNG; size sequence canvases to their on-screen size.

## Determinism (verified)

* **Whole film, different workers:** the demo rendered with 3 workers and with 4 workers (different
  chunk boundaries, separate browser processes) gave identical sha256 for all 306 frame PNGs
  (`--hashes`). A 1-worker render of 3.0 to 5.0 s only (first frame rendered = frame 90, with no
  history) matched frames 90-149. The final render, made after later core.js changes, matched all 306 again.
* **Same frame, separate runs:** 7 stills rendered in two separate runs (1 worker vs 3 workers)
  have identical sha256.
* **Stills = video frames:** a still at `t = n / fps` is bit-identical to frame `n` of the video's
  PNG stream (checked frames 121 and 200). Stills at other times differ from every frame, as expected.
* **Encode:** ffprobe of `.work/engine-test/demo.mp4`: h264 High, 1920x1080, 30/1 fps, yuv420p,
  tv range, bt709/bt709/bt709, 306 frames counted, uniform 1/30 s pts steps. Decoded brand colours
  are exact (`#efbd70` -> 239,189,112; `#0b0c0e` -> 10..11,12,14); PSNR vs the PNG frames 43 to 51 dB at crf 14.

What makes it deterministic: Math.random is seeded (at load, per scene build, per frame);
ScrambleText is patched to be a pure function of time; every timeline is pre-rolled once at boot
so tween start values never depend on which frame is rendered first; CSS animations are disabled;
the seek waits for fonts, image decodes and two rAFs; Chromium runs software raster with
`--disable-checker-imaging --disable-partial-raster --run-all-compositor-stages-before-draw`.

Limits: bit-exactness holds for the same machine type, Chromium build (Playwright chromium-1243
here) and fonts. Another CPU (Skia SIMD paths) or Chromium version can move antialiasing by one
level, which is invisible but changes hashes. x264 itself is deterministic for the same settings.

## Caveats for scene authors

* Paths in `ctx.sequence({ dir })`, `ctx.image()` and CSS `url()` are relative to `comp/index.html`
  (`../.work/frames/x`); a leading `/` means the project root (`/.work/frames/x`). The server
  serves `video/competitive-launch/` plus the repo's `public/` folder mounted read-only at
  `/public/` (e.g. `ctx.image('/public/assets/realms/competitive-history-strategy.svg')`,
  `/public/assets/logo.png`). Nothing else outside the project is reachable.
* The font subsets have no arrows or geometric symbols (`→ ← ↗ ◆ ▲ ● №`): those characters would
  fall back to a system font. Draw them in SVG. `· — – × • ’ …` are fine.
* `from()`/`fromTo()` show their from-state from local time 0 (see GSAP notes). `repeat: -1` is
  refused. Tweens outside `ctx.tl` are refused.
* `?play=1` is a rough preview, not frame-accurate; judge timing on renders or contact sheets.
* Keep text inside the 90% title-safe area (`--guides` / `?guides=1`).
* A scene's DOM exists for the whole film (it is only hidden), so ids must be unique across scenes:
  prefix SVG `id`s (masks, gradients) with the scene id.
