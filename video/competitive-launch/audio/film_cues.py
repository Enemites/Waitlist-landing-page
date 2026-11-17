#!/usr/bin/env python3
"""Cue sheet for film v4 'Worlds' (docs/storyboard-v4.md): score + picture-synced SFX + VO.

  python3 audio/film_cues.py [--vo-dir .work/audio/vo-v4]
  python3 audio/synth.py render audio/cues.film.json -o .work/final/mix.wav

Times are film seconds. 120 BPM: bar b (0-based) starts at 2*b s. The v3 sheet is audio/film_cues_v3.py.
"""
import argparse, json, os

ap = argparse.ArgumentParser()
ap.add_argument('--vo-dir', default='.work/audio/vo-v4')
ap.add_argument('--out', default='audio/cues.film.json')
a = ap.parse_args()

# one chord per bar, bars 0..36 (74 s)
CHORDS = ['Dm', 'Dm', 'Bb', 'A',                      # 0-8   hook: worlds imagined
          'Gm', 'A',                                  # 8-12  face another team
          'Dm(add9)', 'Dm(add9)',                     # 12-16 title
          'Dm', 'Bb', 'F', 'C', 'Dm',                 # 16-26 team (light groove)
          'Dm', 'Dm', 'Bb', 'Gm', 'A',                # 26-36 match + split (tension)
          'A', 'Asus4',                               # 36-40 lobby riser
          'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb',           # 40-52 THE DROP
          'Gm', 'A',                                  # 52-56 futures (peak)
          'Dm', 'Dm',                                 # 56-60 record (rewind)
          'Bb', 'A',                                  # 60-64 payoff
          'Dm(add9)', 'Bb', 'F', 'Dm(add9)', 'Dm(add9)']  # 64-74 CTA, resolve
assert len(CHORDS) == 37

cues = []
def c(type_, **k):
    d = {'type': type_}; d.update(k); cues.append(d); return d
def whoosh_peak(T, length=0.8, peak=0.7, **k):
    return c('whoosh', at=round(T - peak * length, 4), length=length, peak=peak, **k)
def blip(t, kind='tick', freq=1760, g=-18, **k): return c('ui_blip', at=t, kind=kind, freq=freq, gain_db=g, **k)

# ---- 0-8 HOOK: worlds imagined -----------------------------------------------------------------
c('drone', bar=0, bars=4, note='D2', brightness=0.45, intensity=0.35, gain_db=-9)
c('ticks', bar=0, bars=3.25, subdiv=2, accent_every=2, intensity=0.75, gain_db=-8, label='a world per beat')
c('pad', bar=1, bars=3, intensity=[0.25, 0.55], gain_db=-11)
c('bass_ostinato', bar=2, bars=2, pattern='R.......R.......', intensity=0.5, gain_db=-9)
c('riser', hit_at=6.5, length=1.5, gain_db=-15, label='worlds snap into the catalogue')
c('reverse_swell', hit_at=8.0, length=1.2, chord='Gm', gain_db=-15)

# ---- 8-12 FACE ANOTHER TEAM -------------------------------------------------------------------
c('impact', at=8.0, length=0.9, size=0.6, brightness=0.8, sub_hz=60, hpf=45, gain_db=-8, label='the point splits')
c('drums', bar=4, bars=2, kick='X.......X.......', snare='........X.......', intensity=0.6, gain_db=-11)
c('pad', bar=4, bars=2, intensity=0.45, gain_db=-11)
c('shepard', bar=4, bars=2, intensity=[0.2, 0.7], gain_db=-13)
c('riser', hit_at=11.75, length=1.8, gain_db=-12, label='collision')

# ---- 12-16 TITLE --------------------------------------------------------------------------------
c('gate_clank', at=12.0, size=1.1, latch=True, gain_db=-9, verb={'hall': 0.12}, label='TITLE HIT')
c('impact', at=12.0, length=1.1, size=0.8, sub_hz=50, punch=1.2, brightness=0.7, gain_db=-6, hpf=35, fade_out=0.5, label='title body')
c('sub_drop', at=12.0, f0=80, f1=30, gain_db=-12)
c('pad', bar=6, bars=2, intensity=[0.5, 0.75], gain_db=-7, label='Dm(add9) swell')
c('drone', bar=6, bars=2, note='D1', intensity=0.4, gain_db=-11)

# ---- 16-26 TEAM: light groove ----------------------------------------------------------------------
c('plucks', bar=8, bars=5, intensity=[0.45, 0.6], gain_db=-11)
c('bass_ostinato', bar=8, bars=5, intensity=0.65, gain_db=-8)
c('pad', bar=8, bars=5, intensity=0.4, gain_db=-11)
c('drums', bar=9, bars=4, kick='X.......X.......', snare='....X.......X...', hats='..X...X...X...X.', intensity=0.55, gain_db=-12)

# ---- 26-36 MATCH + SPLIT: tension ---------------------------------------------------------------------
c('ticks', bar=13, bars=5, subdiv=2, accent_every=4, intensity=0.8, gain_db=-9)
c('bass_ostinato', bar=13, bars=5, intensity=[0.7, 0.85], gain_db=-8)
c('pad', bar=13, bars=5, intensity=0.5, gain_db=-10)
c('taiko', bar=15, bars=3, intensity=[0.4, 0.7], gain_db=-12)
c('plucks', bar=15, bars=3, intensity=0.5, gain_db=-12)

# ---- 36-40 LOBBY: riser into the drop ----------------------------------------------------------------
c('drums', bar=18, bars=2, intensity=[0.6, 0.85], gain_db=-10)
c('shepard', bar=18, bars=2, intensity=[0.3, 1.0], gain_db=-10)
c('pad', bar=18, bars=2, intensity=0.55, gain_db=-10)
c('riser', hit_at=39.95, length=2.5, gain_db=-11, label='into THE DROP')
c('reverse_cymbal', hit_at=40.0, length=1.2, gain_db=-15)

# ---- 40-52 THE DROP -----------------------------------------------------------------------------------
c('impact', at=40.0, size=1.3, brightness=0.35, sub_hz=44, gain_db=-6, label='THE DROP')
c('sub_drop', at=40.0, f0=90, f1=27, gain_db=-10)
c('bass_ostinato', bar=20, bars=6, intensity=0.9, gain_db=-6)
c('drums', bar=20, bars=6, intensity=0.85, gain_db=-8)
c('taiko', bar=20, bars=6, intensity=0.8, gain_db=-10)
c('plucks', bar=20, bars=6, intensity=0.6, gain_db=-11)
c('pad', bar=20, bars=6, intensity=0.5, gain_db=-11)
c('ticks', bar=20, bars=6, subdiv=2, accent_every=4, intensity=0.85, gain_db=-9)
for t in (44.0, 48.0): c('impact', at=t, length=0.6, size=0.6, brightness=0.6, sub_hz=60, hpf=60, gain_db=-12, label='world cut inside the drop')

# ---- 52-56 FUTURES: peak --------------------------------------------------------------------------------
c('bass_ostinato', bar=26, bars=2, intensity=1.0, gain_db=-6, bus='peak')
c('drums', bar=26, bars=2, intensity=0.95, gain_db=-8, bus='peak')
c('taiko', bar=26, bars=2, intensity=0.9, gain_db=-10, bus='peak')
c('plucks', bar=26, bars=2, intensity=0.7, gain_db=-10, bus='peak')
c('pad', bar=26, bars=2, intensity=0.55, gain_db=-10, bus='peak')
c('riser', hit_at=56.0, length=1.5, gain_db=-14)

# ---- 56-60 RECORD: rewind ----------------------------------------------------------------------------------
c('tape_scrub', at=56.0, length=1.0, direction=-1, gain_db=-14, label='playhead rewinds')
c('pad', bar=28, bars=2, intensity=0.35, gain_db=-11, fx=['lofi'])
c('ticks', bar=28, beat=2, bars=1.5, subdiv=1, accent_every=4, intensity=0.6, gain_db=-11)
c('reverse_cymbal', hit_at=60.0, length=1.3, gain_db=-16)

# ---- 60-64 PAYOFF ------------------------------------------------------------------------------------------
c('stamp', at=60.0, weight=1.2, gain_db=-8, label='PAYOFF')
c('impact', at=61.0, length=1.2, size=1.0, brightness=0.5, sub_hz=50, hpf=40, gain_db=-9, label='ribbons reach the objective')
c('pad', bar=30, bars=2, intensity=[0.55, 0.4], gain_db=-8)
c('plucks', bar=30, bars=2, pattern='0...1...2...1...', intensity=0.35, gain_db=-13)

# ---- 64-74 CTA, resolve ---------------------------------------------------------------------------------------
c('pad', bar=32, bars=3, intensity=[0.4, 0.5], gain_db=-9)
c('ticks', bar=32, bars=2, subdiv=1, accent_every=4, intensity=0.5, gain_db=-13)
c('reverse_swell', hit_at=64.0, length=1.5, chord='Dm', gain_db=-15)
for t, f in ((68.0, 587.33), (68.25, 698.46), (68.5, 880.0)):
    c('ui_blip', at=t, kind='select', freq=f, gain_db=-7, verb={'hall': 0.35}, label='SONIC LOGO')
c('resolve_swell', at=68.0, chords=['Dm(add9)'], swell=0.15, hpf=70, trim=4.5, fade_out=2.0, gain_db=-6, label='resolve, rings out to about 72.5')

# ---- Picture-synced SFX (from the scene engineers' reports) ----------------------------------------------------
# (filled in after the picture is built)

# ---- VO --------------------------------------------------------------------------------------------------------
VO = {'w01': 1.00, 'w02': 4.50, 'w03': 8.40, 'w04': 12.50, 'w05': 16.40, 'w06': 20.60, 'w07': 26.30, 'w08': 31.40,
      'w09': 36.20, 'w10': 40.30, 'w11': 44.30, 'w12': 48.30, 'w13': 52.20, 'w14': 56.30, 'w15': 60.30, 'w16': 64.50,
      'w17': 68.20}
VO_GAIN = {}
for k, t in VO.items():
    cues.append({'type': 'file', 'path': os.path.join(a.vo_dir, k + '.wav'), 'at': t, 'bus': 'vo', 'label': k, 'gain_db': VO_GAIN.get(k, 0)})

sheet = {
    'comment': "Realms Competitive launch film v4 'Worlds', 74 s, 120 BPM, D minor. Generated by audio/film_cues.py.",
    'duration': 74.0, 'bpm': 120, 'chords': CHORDS,
    'buses': {
        'music': {'duck': {'key': 'vo', 'depth_db': 9, 'attack': 0.06, 'release': 0.45, 'hold': 0.25}},
        'sfx': {'duck': {'key': 'vo', 'depth_db': 4}},
        'peak': {'duck': {'key': 'vo', 'depth_db': 8.5, 'attack': 0.06, 'release': 0.45, 'hold': 0.25}},
        'vo': {'chain': 'vo', 'over_bed_lu': 8},
    },
    'master': {'lufs': -14.0, 'true_peak': -2.5, 'glue': True},
    'mutes': [
        {'from': 73.6, 'to': 74.0, 'buses': ['music', 'sfx', 'vo'], 'fade': 0.02},
    ],
    'fade_out': 1.8,
    'cues': cues,
}
json.dump(sheet, open(a.out, 'w'), indent=1)
print(f'wrote {a.out}: {len(cues)} cues')
