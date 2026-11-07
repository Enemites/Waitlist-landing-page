# Audio toolkit (VO, sound design, score, mix, checks)

Everything renders offline on CPU. Output is 48 kHz WAV and is deterministic: the same seed
gives the same render. Nobody on the crew can listen, so every step comes with numeric checks.
Work output goes to `.work/audio/` (gitignored). Models go to `.work/models/`.

| file | what it does |
|---|---|
| `tts.py` | Voice-over with Kokoro-82M (kokoro-onnx). Optional Whisper word timings and WER. |
| `voice_test.py` | Renders candidate voices and ranks them by WER clean and in music, pace and pitch range. |
| `synth.py` | Library and CLI: 22 one-shots, 9 musical layers, cue-sheet mixer, mastering. |
| `measure.py` | Measurements: LUFS, true peak, clipping, DC, NaN/denormals, centroid, F0, WER/CER, spectrogram PNGs. |
| `cues.example.json` | The 30 s demo cue sheet (build, drop at 16 s, end hit at 28 s, ducked VO). |
| `vo.example.json` | Example VO lines file. |
| `music-candidates.md` | CC0/PD backup music beds on archive.org, with license evidence. |

## Setup

```bash
pip install --break-system-packages kokoro-onnx soundfile scipy pyloudnorm numba matplotlib faster-whisper
mkdir -p .work/models/kokoro && cd .work/models/kokoro
curl -LO https://huggingface.co/fastrtc/kokoro-onnx/resolve/main/kokoro-v1.0.onnx   # sha256 7d5df8ec...
curl -LO https://huggingface.co/fastrtc/kokoro-onnx/resolve/main/voices-v1.0.bin    # sha256 bca610b8...
cd .. && python3 -c "from huggingface_hub import snapshot_download as s; s('Systran/faster-whisper-small.en', local_dir='whisper-small.en')"
```

These are the official v1.0 release files, mirrored on Hugging Face because github.com is blocked
here. The same sha256 appears on two independent mirrors (fastrtc/kokoro-onnx, rumbleFTW/kokoro-v1.0-onnx).
numba is optional: without it the per-sample filters and dynamics fall back to pure Python, which
gives the same results but runs about 50x slower.

## Voice-over: `tts.py`

```bash
python3 audio/tts.py lines.json [--out .work/audio/vo] [--align] [--force]
python3 audio/tts.py --list-voices
```

`lines.json` is a list of lines:

```json
[{"id": "vo06", "text": "One world. Opposing plans.", "voice": "af_heart", "speed": 0.9}]
```

Optional keys on a line:
- `lang`: `en-us` or `en-gb`. Default comes from the voice prefix.
- `sentence_pause`: default 0.32 s.
- `clause_pause`: default 0.12 s.
- `gain_db`
- `phoneme_replace`: pronunciation fixes, e.g. `{"hˌuːz": "hˈuːz"}` stresses "whose".
- `phonemes`: a full phoneme override.

A voice can be a blend, e.g. `"am_michael:0.6+am_fenrir:0.4"`.

Each line produces `<out>/<id>.wav`: 48 kHz mono 24-bit, 70 Hz HPF, silence trimmed (25 ms
before, 120 ms after), sample peak at -3.0 dBFS. Rendered lines measure about -23 LUFS.

`<out>/vo_manifest.json` lists duration, wpm, LUFS and true peak per id. With `--align` it also
holds the Whisper transcript, WER/CER and word timestamps (`words: [{w, start, end, p}]`), which
the animators can use to sync on-screen type. Lines are cached by a hash of their settings.

**Recommended voice: `af_heart`, speed 0.9.**
- Kokoro grade A, the best quality grade.
- Best composite score.
- Stays intelligible under a dense trailer bed: full-script CER 0.000 at -6 dB and 0.024 at
  -10 dB speech-to-music.
- About 142 wpm, a calm briefing pace.

Male alternative: `am_michael` at 0.9 (about 137 wpm, F0 125 Hz, grade C+). It needs the bed
ducked (it degrades to CER 0.15 at -10 dB). Whisper also hears its "see whose strategy holds" as
"who strategy", even with the stress fix. Full tables are in
`.work/audio/voice-tests/report.md` (re-run with `python3 audio/voice_test.py`).

## Synth: `synth.py`

```bash
python3 audio/synth.py list                                    # every generator with params and defaults
python3 audio/synth.py one braam -p root=D2 -p length=5 -o x.wav --png x.png
python3 audio/synth.py render audio/cues.example.json -o mix.wav --stems stems/ --png mix.png
python3 audio/synth.py check audio/cues.example.json mix.wav --stems stems/   # VO WER in the mix and VO-over-bed LU
python3 audio/synth.py pack -o sfx_pack.wav --dir oneshots/ --png             # every one-shot, 1 s apart, with a report
```

From Python: `import synth; y = synth.render("impact", size=1.3)` returns a float64 array of shape (n, 2).

### Cue sheet

```jsonc
{
  "duration": 72.0, "bpm": 120,                  // 1 bar = 240/bpm s (2 s at 120)
  "chords": ["Dm","Dm","Bb","Bb","Gm","A", ...], // one chord per bar, cycles. Layers take theirs from their bar.
  "buses": {                                     // music, sfx and vo always exist. Add more by naming them in a cue.
    "music": {"duck": {"key": "vo", "depth_db": 9, "attack": 0.06, "release": 0.45, "hold": 0.25}},
    "sfx":   {"duck": {"key": "vo", "depth_db": 4}, "gain_db": 0},
    "vo":    {"chain": "vo", "over_bed_lu": 8}   // VO EQ+comp chain; auto-level the VO 8 LU over the ducked bed
  },
  "master": {"lufs": -14.0, "true_peak": -1.0, "glue": true},  // glue may be a dict: threshold/ratio/attack/release/knee
  "mutes": [{"from": 15.5, "to": 16.0, "buses": ["music"], "fade": 0.004}],  // hard silence windows (pre-drop gap)
  "fade_in": 0, "fade_out": 1.2,
  "cues": [
    {"type": "pad", "bar": 1, "bars": 7, "intensity": [0.25, 0.7], "gain_db": -7},
    {"type": "riser", "hit_at": 15.5, "length": 4},       // hit_at/hit_bar aligns the sync point
    {"type": "impact", "at": 16.0, "size": 1.2},
    {"type": "file", "path": ".work/audio/vo/vo06.wav", "at": 18.2, "bus": "vo"}
  ]
}
```

Cue keys:
- `type`: a generator name, or `file`.
- Timing: `at` (seconds), or `bar` with optional `beat` (0-3, fractions allowed). `hit_at` /
  `hit_bar` place the generator's sync point there instead: the end for `riser`,
  `reverse_swell`, `reverse_cymbal` and `sub_swell`, the start for everything else.
- Level and placement: `gain_db`, `pan` (-1..1), `width` (M/S, 1 = unchanged).
- `bus`: the default is `music` for layers, `sfx` for one-shots and `vo` for files.
- `fade_in`, `fade_out`, `trim` (seconds).
- `verb`: shared reverb sends, as a number (amount sent to the hall) or e.g. `{"hall": 0.2, "huge": 0.1}`.
  Presets: `room`, `plate`, `hall`, `hall_dark`, `huge`, `industrial`.
- `fx`: a list from `radio` (band-passed, driven: good for team-channel chatter), `reverse`, `lofi`.
- Every other key is passed to the generator, or put them in `"params": {...}`.

`intensity` on layers accepts:
- a number;
- `[start, end]`, a linear ramp over the layer;
- `[[bar, value], ...]`, breakpoints in bars from the layer start.

Signal flow:
1. Cues go to their buses. Reverb sends are convolved and returned to the bus they came from.
2. The VO chain runs: HPF 80, -2 dB at 280 Hz, +2.5 dB at 3.5 kHz, +1.5 dB air shelf, 3:1 compression.
3. Bus gain.
4. Sidechain ducking: a gain curve keyed from the VO bus envelope, with hold, attack and release,
   giving exactly `depth_db` of ducking.
5. Auto VO level.
6. Mutes and fades.
7. Master: 22 Hz DC/subsonic HPF, then pre-gain to -18 LUFS, then glue (2:1, threshold -12, 30/250 ms,
   RMS 25 ms), then a 4x-oversampled true-peak lookahead limiter (4 ms lookahead, 80 ms release),
   iterated until integrated loudness is within 0.05 LU of the target (BS.1770 via pyloudnorm).

Stems (`--stems`) are post-bus, pre-limiter, at master gain, written as float WAV. A report JSON
is written next to the mix.

### One-shots

Each one-shot is true-peak normalised to -1 dBTP. LUFS below is the level as rendered, which
tells you how much gain to give each one in a cue.

| name | key params (defaults) | LUFS | centroid |
|---|---|---|---|
| `impact` | length 3, sub_hz 48, punch 1, brightness 0.6, size 1 | -19.5 | 80 Hz |
| `boom` | length 6, hz 34, size 1.4 | -16.7 | 46 Hz |
| `braam` | length 4, root D2, chord m / 5 / "" / sus, brightness 1, open_time 0.45, detune 14 | -9.1 | 362 Hz |
| `riser` (hit=end) | length 4, f0 180, f1 4200, tonal 0.5, curve 2, root D3 | -15.0 | 885 Hz |
| `reverse_swell` (hit=end) | length 2.5, chord Dm, brightness 0.6 | -15.3 | 279 Hz |
| `whoosh` | length 1.2, direction ±1 (L->R), peak 0.55, pitch 1, weight 0.5 | -13.4 | 2.2 kHz |
| `ui_blip` | kind blip/tick/confirm/deny/select/type, freq 1760, length 0.3 | -17.8 | 1.9 kHz |
| `typing` | length 2, rate 9 keys/s | -24.6 | 4.6 kHz |
| `data_chatter` | length 2, density 20/s, bits 6 | -15.2 | 1.9 kHz |
| `glitch` | length 0.8, character 0.5 | -15.0 | 1.0 kHz |
| `sub_drop` | length 2.5, f0 100, f1 27 | -10.7 | 80 Hz |
| `tick` | length 4, bpm 120, subdiv 2, accent_every 4, accel 1 (>1 accelerates), tone 1, tock 0.88 | -29.6 | 2.3 kHz |
| `tick_one` | tone 1 | -26.9 | 1.8 kHz |
| `heartbeat` | length 4, bpm 60 | -16.1 | 70 Hz |
| `gate_clank` | length 3, size 1, pitch 1, rattle 0.6, latch true | -20.3 | 307 Hz |
| `water_rush` | length 5, intensity 0.7, bubbles 1 | -14.6 | 553 Hz |
| `crowd` | length 5, voices 32, excitement 0.3, distance 0.6 | -13.9 | 458 Hz |
| `reverse_cymbal` (hit=end) | length 2.5, brightness 0.7 | -16.5 | 14.5 kHz |
| `sub_swell` (hit=end) | length 2, hz 41, rise 0.15 | -12.3 | 47 Hz |
| `alert` | length 1, f_hi 1174.66 (D6), f_lo 880 (A5), reps 2 | -9.8 | 1.1 kHz |
| `tape_scrub` | length 1.2, direction -1 (rewind) | -11.7 | 1.1 kHz |
| `stamp` | length 1.2, weight 1 | -17.8 | 848 Hz |

Every generator also takes `seed`. Change it to get a different variation of the same sound.

### Musical layers

All layers take `bars`, `bpm` and `intensity`. Patterns use 16 steps per bar; a longer string
spans several bars. Levels are calibrated so each layer alone is about -18 LUFS at intensity 1
(ticks about -24 LUFS). The sound starts on the layer's first downbeat; release and reverb tails
run past `bars`.

| name | params |
|---|---|
| `bass_ostinato` | chords, pattern `RrrRrrRrRrrRrrRr` (r root, o octave, f fifth, uppercase accent, `.` rest), drive 6 |
| `pad` | chords, attack 1.5, release 2.5, motion 0.08 Hz (filter LFO), brightness 0.6 |
| `plucks` | chords, pattern `0121012101210121` (chord-tone index, `x` top+8va, `.` rest), octave_low 62, decay 0.09 |
| `taiko` | pattern (X / x / o / `.`; the default is picked by intensity), pitch 1, ensemble 3 |
| `drums` | kick `X...X...X...X...`, snare `....X.......X...`, clap, hats (`O` = open hat) |
| `shepard` | rate 0.12 oct/s, partials 8, f_low 40, direction ±1, pulse 0..1 (16th-note gating) |
| `resolve_swell` | chords (first chord used, e.g. `Dm(add9)` or `D`), swell 0.45 (fraction of length spent rising) |
| `ticks` | subdiv 2, accent_every 4, accel 1, tone 1 |
| `drone` | note D1, brightness 0.4 |

Chord symbols: a root (`D`, `Bb`, `F#`...) plus a quality: `""`, `m`, `5`, `sus2`, `sus4`, `7`,
`m7`, `maj7`, `add9`, `madd9` / `m(add9)`, `m9`, `dim`, `aug`, `6`, `m6`. Slash bass works, e.g. `Dm/F`.

## Checks to run on any mix

```bash
python3 audio/synth.py render cues.json -o mix.wav --stems stems --png mix.png   # prints LUFS, TP, glue GR, duck depth
python3 audio/synth.py check cues.json mix.wav --stems stems                      # per VO line: WER in the mix, VO over bed (LU)
python3 audio/measure.py mix.wav                                                  # clipping, DC, NaN, denormals, centroid
```

Targets:
- -14.0 ±0.2 LUFS integrated.
- True peak at or below -1.0 dBTP.
- No clip runs, NaN or denormals.
- |DC| below 1e-4.
- VO 6-10 LU over the bed.
- WER in the mix equal to the clean WER.
- Look at the PNG: risers should sweep up, hits should show a broadband onset with a decaying
  tail, and ticks should show as regular vertical lines.
