# Realms Competitive: launch film

`out/realms-competitive-launch.mp4`: 72 s, 1920x1080, 30 fps, H.264 High + AAC 48 kHz, -14 LUFS integrated / -1 dBTP.

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
- `comp/scenes/s01..s14` the film; `comp/scenes/manifest.js` order, durations, overlaps.
- `audio/vo.film.json` VO (Kokoro af_heart), `audio/film_cues.py` -> `audio/cues.film.json` score + SFX cue sheet, `audio/synth.py` renderer.
- `docs/` brief, references and technique bible, locked storyboard.

## Credits and rights
- Voice: Kokoro-82M (Apache-2.0), voice af_heart. Music and sound design: generated procedurally for this film (audio/synth.py).
- Archival footage (all public domain in the US, via archive.org; amber-graded and framed):
  - Apollo 8 Mission Operations Control Room, 1968. NASA (JSC film scans).
  - Eyes Aloft: Aircraft Warning Service, 1943. US Army Air Forces training film TF 1-3315.
  - The River, 1937-38. Farm Security Administration, dir. Pare Lorentz (National Archives scan).
  - Boat Race, 1904. American Mutoscope & Biograph (Library of Congress).
  Full rights evidence and source URLs: `broll/credits.json`.
- Brand assets, copy and the Floodgate interface concept come from this repository.
