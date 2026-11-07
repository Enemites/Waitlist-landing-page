# Brand system for scene authors (`comp/lib/brand.js`)

Every scene uses `window.Brand` so the film reads as one system. Read `engine/README.md` first
(engine rules), then this file, then the header comment and function docs in `brand.js`.
Reference renders: `comp/scenes/_brandtest.js` uses every helper (render it with
`node engine/render.mjs --manifest scenes/manifest.brandtest.js --contact .work/brandtest --every 0.5`).

## Tokens
- `Brand.C`: palette. Ground `bg #0b0c0e`, map `#0f0d0a`; Atlas/us `amber #efbd70` (`amberLight`,
  `amberDeep`, `amberLine`); Vega/rival `rival #dd6248` (`rivalDeep`, `rivalLight`); opposition
  marks `bone #c9c0b2`; text `ink #f2eee7`, `muted #b8afa2`. Nothing outside this palette.
- Tempo: `Brand.BEAT = 0.5 s`, `Brand.BAR = 2 s` (120 BPM, 15 frames per beat). Land motion peaks
  and cuts on beat frames. `Brand.b(n)` / `Brand.bar(n)` convert.
- Eases `Brand.E`: enter `expo.out`, exit `power2.in`, camera `power3.inOut`, whip `expo.inOut`,
  UI `power3.out`. No elastic/bounce on type; `back.out` only on markers and stamps.

## Rules that bite (learned while building the system)
1. **Entrances: use `tl.fromTo(...)` with the default `immediateRender` (true).** That renders
   the from-state at build time, so the element stays hidden until its start. Never pre-hide with
   `tl.set(el, {...}, 0)`: a zero-duration tween at time 0 can revert when the playhead lands on 0.
2. **GSAP callbacks (`onUpdate`, `onComplete`, `call`) never fire** (the engine seeks with
   events suppressed). For anything computed (counters, text, canvas), tween a plain proxy object
   on `ctx.tl` and read it in `ctx.onFrame`, or use `Brand.bindText` / `Brand.counter`.
3. Looping or periodic motion (pulses, sway, flicker) is a pure function of time in `ctx.onFrame`.
4. **SVG layers inside nested divs** must be absolutely positioned. Helpers give their SVGs a
   `brand-*` class, which base.css positions full-frame; give your own full-frame SVGs
   `class: 'brand-svg'` (or `style: 'position:absolute;left:0;top:0'`).
5. Grain and vignette are a film-wide overlay (`Film.overlay`). Do not add your own grain.
6. Prefix every SVG `id` with the scene id (all scenes' DOM exists for the whole film).
7. Keep `onFrame` work under ~15 ms. One `Brand.terrain` per scene is fine (build ~0.3 s, frame
   ~10 ms with light pools). Avoid CSS `filter: blur()` over large areas and `backdrop-filter`.
8. Fonts have no arrows or geometric glyphs. Draw icons in SVG.
9. Type sizes: headlines 110–170 px (Manrope 620, tracking −0.055em); labels ≥ 20 px mono.
   Hold every card ≥ 0.9 s + 0.3 s per word after it lands.

## Helpers (see the function comments in brand.js for every option)
| Helper | What it gives you |
|---|---|
| `Brand.terrain(ctx, o)` | Topographic world (seeded heightfield, hills, river carve), cached tint + contours. `state` (cx, cy, zoom, rot, alpha, reveal, revealX/Y, light, pulse, pulseX/Y/R, flood) is tweenable on `ctx.tl`; `spots` are light pools `{x,y,r,a}`. `T.group(svg)` returns a `<g>` in world coordinates that follows the camera; `T.toScreen(x,y)`; `T.move(at, dur, {zoom, cx, cy})`. |
| `Brand.hud(ctx, o)` | Register corners + edge ticks + slug (bottom-left) + timecode (bottom-right). The overlay system: use in most scenes. |
| `Brand.eyebrow(ctx, o)` | Diamond + scrambled mono label. |
| `Brand.headline(ctx, o)` | Lines in masks; words rise (`expo.out`), accent line(s) amber one beat later; `out` exits upward. Returns `{ el, lines, words, end }`. |
| `Brand.chapter(ctx, o)` | `01 —— STEP 01 / 03` + chapter title. |
| `Brand.label(ctx, o)` | Small mono scramble label anywhere. |
| `Brand.counter(ctx, o)`, `Brand.bindText(ctx, el, fn)` | Stepping numbers/clocks; text from time. |
| `Brand.mark(ctx, o)`, `Brand.lockup(ctx, o)` | Enemites mark as 5 vector bars (`slide` / `draw`), and mark + "Realms" + COMPETITIVE. |
| `Brand.banner(ctx, o)` | Atlas (amber, diamond) / Vega (red-orange, ring) pennants: unroll on `at`, sway forever. |
| `Brand.token`, `Brand.cross`, `Brand.rivalToken`, `Brand.objective`, `Brand.route` | Board marks (numbered amber tokens, bone crosses, rival triangles, objective ring with `pop`/`pulse`/`spin`, dashed route with an arrowhead riding the tip). |
| `Brand.archive(ctx, o)` | Graded archival frame sequence inside a frame with register marks, caption, gate weave, slow push; opens with a wipe/iris/cut, `out` closes it. |
| `Brand.flood(ctx, o)` | Signature "rising water" transition: clips the target (default the scene root) under a noisy waterline with an amber edge. Use on the incoming scene with a manifest `overlap`. |
| `Brand.iris(ctx, o)`, `Brand.whip(ctx, o)` | Circle iris from a point (ring rides the edge); horizontal whip with directional blur. |
| `Brand.panel(ctx, o)` | UI panel matching the Floodgate screen (`design/screen-compositions/competitive.html`). |

## B-roll frames
Archival clips are extracted to graded JPEG sequences under `.work/frames/<slug>/` (see
`broll/catalog.md` for slugs and `engine/extract-frames.sh`). From a scene, the `dir` is
relative to `comp/`: `../.work/frames/<slug>`.
