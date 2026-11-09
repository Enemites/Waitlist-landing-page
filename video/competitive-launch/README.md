# Realms Competitive: launch film

`out/realms-competitive-launch.mp4`: 72 s, 1920x1080, 30 fps, H.264 High + AAC 48 kHz, -14 LUFS integrated, true peak -1.4 dBTP measured on the decoded file (mix ceiling -2 dBTP). `render-final.sh` also writes a higher-bitrate master (`out/realms-competitive-launch-master.mp4`, about 85 MB, not committed) for upload to video platforms.

Version 2 applies the fixes from an independent three-lens review panel (craft, brand, sound) whose findings were each verified against the rendered frames.

Version 3 adds variety and tempo. Ten fast inserts in nine new visual languages are cut into 16-64 s as overlay scenes (`at` entries in `comp/scenes/manifest.js`). The Floodgate map world stays underneath, and the VO and music timing do not move. The map scenes also gained harder cuts (s01 two pushes on the beat, s06 zoom landing at 22.0, s10 punches at 49.0 and 51.0, s13 punch onto the gate at 61.0). The delivery encodes use a chroma QP offset so the thin amber linework stays amber in 4:2:0:

| at | insert | look |
|---|---|---|
| 18.25-20.0 | `x05-iso-world` | the Floodgate valley as a rotating 3D island of ridgelines (`comp/lib/ridgeline.js`), both plans as light |
| 20.0-22.0 | `x05-versus` | ATLAS / VEGA versus slabs slamming in on the Enemites slant, 3 V 3 |
| 25.0-26.0 | `x06-player-cards` | Jules, Nora, Emre: three full-frame cards with generative backgrounds |
| 30.5-32.0 | `x07-section` | the valley as a survey cross-section (Atlas summit, the gate, Vega summit) read by a scan line |
| 36.5-38.0 | `x08-roles` | three slanted role panes slam in on the beats (coordination, pump station, crossing) and merge into PLAN AGREED |
| 39.0-40.5 | `x08-gate-schematic` | a blueprint of the floodgate powering up to 62% |
| 41.0-42.25 | `x08-contest` | the rival scan: a red polar radar, five escalating pings, Vega's contacts lock onto the crossing |
| 46.0-48.0 | `x10-formation` | particle streams braid and lock into the team on the low hit |
| 52.5-54.5 | `x11-archive-flash` | archive flashes (chess 1925, the 1937 levee sandbag line) on two montage beats |
| 58.0-59.5 | `x13-iso-plans` | the 3D island again: both plans meet at the gate, the camera cranes into the map |

A motion-graphics launch film for the Competitive mode of Enemites Realms, built entirely in code:
HTML/SVG/canvas + GSAP scenes rendered frame by frame (deterministic) and scored with a procedural
synth. Concept "THE NODE": one amber point (Jules, our coordinator) carries the plan from a live
Floodgate match, back through a century of teams that planned together, into one shared world,
through the match, onto the record and finally onto the "Get match updates" button.

## Structure (docs/storyboard.md has every beat)
| time | scene | |
|---|---|---|
| 0-3 | s01 hook | the live match interface, "Vega is contesting the crossing" |
| 3-5 | s02 freeze/rewind | the clock rolls back to 08:32 |
| 4-12 | s03 every great plan | archive 1943 / 1937 / 1968 / 1904, framed and amber-graded |
| 12-16 | s04 hinge + title | the water rises back into the world; Enemites / Realms / COMPETITIVE |
| 16-22 | s05 one world | "One world. Opposing plans." |
| 22-28 | s06 01 form your team | "Bring friends. Or join a team." |
| 28-34 | s07 02 find your opposition | "The same challenge. Another approach." |
| 34-44 | s08 03 make your move | messages, PLAN AGREED, objective 62%, Vega contests |
| 44-46 | s09 last seen | the breath |
| 46-52 | s10 | "Coordinate. Commit. Adapt." (the one low hit at 46.0) |
| 52-56 | s11 the match | eight beat cuts |
| 56-58 | s12 on the record | the match review timeline |
| 58-64 | s13 | "See whose strategy holds." the world closes into a medallion |
| 64-72 | s14 end card | Realms COMPETITIVE, "Make your next move.", Get match updates, enemites.com/realms, in development / private beta |

## Rebuild
```bash
cd video/competitive-launch
npm install                  # gsap + fonts
broll/fetch.sh               # public-domain archive clips into .work/broll (see broll/catalog.md)
# graded frame sequences used by s03/s04 are extracted with engine/extract-frames.sh (commands in each scene's known issues / broll/catalog.md)
pip install kokoro-onnx faster-whisper pyloudnorm numba scipy soundfile   # audio toolkit (audio/README.md)
python3 audio/tts.py audio/vo.film.json --out .work/audio/vo-film --align
./render-final.sh            # picture + mix + delivery encode -> out/
```
Preview a scene: `node engine/render.mjs --serve 8090` then
`http://127.0.0.1:8090/comp/index.html?scene=s05-one-world&t=1.5&guides=1`.

## Pieces
- `comp/lib/brand.js` design system (terrain, HUD, type, mark, banners, archive window, transitions); `comp/lib/BRAND.md`.
- `comp/lib/floodgate.js` the Floodgate match world + UI, `match.js` the live-match kit, `node.js` THE NODE, `contourflood.js` the drain/flood dissolve.
- `comp/lib/ridgeline.js` the 3D ridgeline renderer used by the v3 island inserts.
- `comp/scenes/s01..s14` the film, `comp/scenes/x05..x13` the v3 inserts; `comp/scenes/manifest.js` order, durations, overlaps and overlay times.
- `audio/vo.film.json` VO (Kokoro af_heart), `audio/film_cues.py` -> `audio/cues.film.json` score + SFX cue sheet, `audio/synth.py` renderer.
- `docs/` brief, references and technique bible, locked storyboard.

## Credits and rights
- Voice: Kokoro-82M (Apache-2.0), voice af_heart. Music and sound design: generated procedurally for this film (audio/synth.py).
- Archival footage (all public domain in the US, via archive.org; amber-graded and framed):
  - Apollo 8 Mission Operations Control Room, 1968. NASA (JSC film scans).
  - Eyes Aloft: Aircraft Warning Service, 1943. US Army Air Forces training film TF 1-3315.
  - The River, 1937-38. Farm Security Administration, dir. Pare Lorentz (National Archives scan). The levee sandbag shot is in the v3 archive flash.
  - Boat Race, 1904. American Mutoscope & Biograph (Library of Congress).
  - Chess Fever (Shakhmatnaya goryachka), 1925, dir. Vsevolod Pudovkin and Nikolai Shpikovsky, with footage of the 1925 Moscow International Chess Tournament. Used in the v3 archive flash.
  Full rights evidence and source URLs: `broll/credits.json`.
- Brand assets, copy and the Floodgate interface concept come from this repository.
