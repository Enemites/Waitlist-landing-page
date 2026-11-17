# Realms Competitive: launch film

`out/realms-competitive-launch.mp4`: 74 s, 1920x1080, 30 fps, H.264 High + AAC 48 kHz, -14 LUFS integrated (mix ceiling -2.5 dBTP, which leaves room for the AAC overshoot). `render-final.sh` also writes a higher-bitrate master (`out/realms-competitive-launch-master.mp4`, not committed) for upload to video platforms.

A motion-graphics launch film for the Competitive mode of Enemites Realms, built entirely in code:
HTML/SVG/canvas + GSAP scenes rendered frame by frame (deterministic) and scored with a procedural
synth.

## Version 4, "Worlds" (current; docs/storyboard-v4.md)
The client rejected v3 because it used one map and one scenario throughout. v4 is a rebuild around the
product truth that Realms imagines worlds: every section explains a different part of Competitive mode in
its own visual world, and an amber seed point ties them together.

| time | scene | world / look |
|---|---|---|
| 0-8 | c01-imagined | the seed imagines a world per beat: 12 worlds in 12 techniques, then a catalogue grid |
| 8-12 | c02-face | "Face another team": giant kinetic type on ink, two points race and collide |
| 12-16 | c03-title | Enemites / Realms / Competitive locked from two colour registrations |
| 16-26 | c04-team | light product UI: invite, open-team board, shared canvas with live cursors, AGREED |
| 26-30 | c05a-match | dot-matrix globe matchmaking, the challenge card dealt to both teams |
| 30-36 | c05b-split | split screen: the same storm city, two different plans |
| 36-40 | c06-lobby | 3 v 3 versus lobby, roles assigned, PLAN LOCKED |
| 40-44 | c07a-coordinate | THE DROP on an ice station: three players, one synchronised beat |
| 44-48 | c07b-commit | desert canyon: the route locks, the others burn off |
| 48-52 | c07c-adapt | storm city at night: the rival blacks out a district, the plan reroutes |
| 52-56 | c08-futures | a branching tree of futures pruned by both teams' moves |
| 56-60 | c09-record | the match record: replay strip, rewind, event log, ON THE RECORD |
| 60-64 | c10-holds | payoff: two ribbons of light meet, "See whose strategy holds." |
| 64-74 | c11-cta | "Bring this challenge to your group." / "Make your next move." / Get match updates |

World renderers: `comp/lib/world-city.js` (storm city), `comp/lib/world-wild.js` (ice station, desert canyon).
VO script `audio/vo.v4.json`, cue sheet `audio/film_cues.py`.

The previous film (v3, 72 s, the Floodgate match with ten inserts) is still renderable:
`node engine/render.mjs --manifest scenes/manifest.v3.js --out ...`, sound from `audio/film_cues_v3.py`.
Its scenes are `comp/scenes/s01..s14` and `x05..x13`; its storyboard is docs/storyboard.md and
docs/revision-v3.md.

## Rebuild
```bash
cd video/competitive-launch
npm install                  # gsap + fonts
broll/fetch.sh               # public-domain archive clips into .work/broll (see broll/catalog.md)
# graded frame sequences used by s03/s04 are extracted with engine/extract-frames.sh (commands in each scene's known issues / broll/catalog.md)
pip install kokoro-onnx faster-whisper pyloudnorm numba scipy soundfile   # audio toolkit (audio/README.md)
python3 audio/tts.py audio/vo.v4.json --out .work/audio/vo-v4 --align   # v3: audio/vo.film.json -> .work/audio/vo-film
./render-final.sh            # picture + mix + delivery encode -> out/
```
Preview a scene: `node engine/render.mjs --serve 8090` then
`http://127.0.0.1:8090/comp/index.html?scene=s05-one-world&t=1.5&guides=1`.

## Pieces
- `comp/lib/brand.js` design system (terrain, HUD, type, mark, banners, archive window, transitions); `comp/lib/BRAND.md`.
- `comp/lib/floodgate.js` the Floodgate match world + UI, `match.js` the live-match kit, `node.js` THE NODE, `contourflood.js` the drain/flood dissolve.
- `comp/lib/ridgeline.js` the 3D ridgeline renderer used by the v3 island inserts.
- `comp/scenes/c01..c11` the v4 film (`manifest.js`); `s01..s14` + `x05..x13` the v3 film (`manifest.v3.js`).
- `comp/lib/world-city.js`, `world-wild.js` the v4 world renderers.
- `audio/vo.film.json` VO (Kokoro af_heart), `audio/film_cues.py` -> `audio/cues.film.json` score + SFX cue sheet, `audio/synth.py` renderer.
- `docs/` brief, references and technique bible, locked storyboard.

## Credits and rights
- Voice: Kokoro-82M (Apache-2.0), voice af_heart. Music and sound design: generated procedurally for this film (audio/synth.py).
- Archival footage (v3 only; v4 uses none. All public domain in the US, via archive.org; amber-graded and framed):
  - Apollo 8 Mission Operations Control Room, 1968. NASA (JSC film scans).
  - Eyes Aloft: Aircraft Warning Service, 1943. US Army Air Forces training film TF 1-3315.
  - The River, 1937-38. Farm Security Administration, dir. Pare Lorentz (National Archives scan). The levee sandbag shot is in the v3 archive flash.
  - Boat Race, 1904. American Mutoscope & Biograph (Library of Congress).
  - Chess Fever (Shakhmatnaya goryachka), 1925, dir. Vsevolod Pudovkin and Nikolai Shpikovsky, with footage of the 1925 Moscow International Chess Tournament. Used in the v3 archive flash.
  Full rights evidence and source URLs: `broll/credits.json`.
- Brand assets, copy and the Floodgate interface concept come from this repository.
