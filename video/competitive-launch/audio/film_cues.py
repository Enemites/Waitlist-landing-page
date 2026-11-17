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
for t, f in ((69.75, 587.33), (70.0, 698.46), (70.25, 880.0)):
    c('ui_blip', at=t, kind='select', freq=f, gain_db=-9, verb={'hall': 0.35}, label='SONIC LOGO (after the last VO line)')
c('resolve_swell', at=68.2, chords=['Dm(add9)'], swell=0.15, hpf=70, trim=4.5, fade_out=2.0, gain_db=-6, label='resolve, rings out to about 72.5')

# ---- Picture-synced SFX (from the scene engineers' reports) ----------------------------------------------------
# c01-imagined 0-8: the seed imagines a world per beat
c('impact', at=0.0, length=0.6, size=0.4, brightness=0.6, sub_hz=55, hpf=40, gain_db=-14, label='seed fires')
c('tick_one', at=0.25, tone=0.8, gain_db=-14, label='second pulse')
c('reverse_cymbal', hit_at=0.5, length=0.35, gain_db=-20, label='field pulled into the point')
WORLD_SFX = [  # (t, generator, params) one texture per world
    (0.5, 'data_chatter', dict(length=0.4, density=22, gain_db=-22, label='w1 coastline: glyph chatter')),
    (1.0, 'impact', dict(length=0.5, size=0.7, brightness=0.2, sub_hz=45, hpf=35, gain_db=-17, label='w2 mountains: rumble')),
    (1.5, 'ui_blip', dict(kind='confirm', freq=1318.5, gain_db=-21, verb={'hall': 0.3}, label='w3 orbit: metallic ring')),
    (2.0, 'stamp', dict(weight=0.35, gain_db=-19, label='w4 archipelago: blocky click')),
    (2.5, 'water_rush', dict(length=0.5, intensity=0.4, bubbles=0.0, hpf=2500, gain_db=-21, label='w5 dunes: sand hiss')),
    (3.0, 'ui_blip', dict(kind='confirm', freq=880, gain_db=-18, verb={'hall': 0.35}, label='w6 floodgate: sonar ping')),
    (3.5, 'tape_scrub', dict(length=0.35, direction=1, gain_db=-24, label='w7 forest: rustle')),
    (4.0, 'glitch', dict(length=0.15, character=0.2, gain_db=-22, label='w8 canyon: etched scratch')),
    (4.5, 'data_chatter', dict(length=0.35, density=30, bits=4, gain_db=-23, label='w9 city: electric crackle')),
    (5.0, 'whoosh', dict(length=0.5, peak=0.4, pitch=0.6, weight=0.5, gain_db=-19, label='w10 weather: gust')),
    (5.5, 'gate_clank', dict(size=0.3, pitch=1.4, latch=False, length=0.5, fade_out=0.25, gain_db=-20, label='w11 ice: crack')),
    (6.0, 'impact', dict(length=0.7, size=1.0, brightness=0.25, sub_hz=40, hpf=30, gain_db=-14, label='w12 volcano: boom')),
]
for t, g, kw in WORLD_SFX: c(g, at=t, **kw)
whoosh_peak(1.38, length=0.3, peak=0.7, pitch=1.3, weight=0.3, gain_db=-19, label='IMAGINED bursts out')
for i in range(9): blip(round(5.08 + 0.033 * i, 3), 'tick', 2600, -26, label='DECISIONS zip-lock')
c('impact', at=6.5, length=0.4, size=0.4, brightness=0.8, sub_hz=70, hpf=80, gain_db=-17, label='catalogue snaps into the grid')
for i in range(11): blip(round(6.5 + 0.03 * i, 3), 'tick', 2000 + 60 * i, -27, label='tile lands')
c('data_chatter', at=6.7, length=0.25, density=16, gain_db=-27, label='tile labels')
c('reverse_cymbal', hit_at=7.7, length=0.45, gain_db=-17, label='tiles sucked into the point')
c('tick_one', at=7.7, tone=0.7, gain_db=-14, label='absorb')
# c02-face 8-12
c('glitch', at=8.0, length=0.08, character=0.8, gain_db=-17, label='split: tear')
for T, pan in ((8.25, -0.5), (8.3, 0.5)): whoosh_peak(T, length=0.3, peak=0.6, pitch=1.2, weight=0.3, pan=pan, gain_db=-20, label='tokens snap to corners')
for T in (8.7, 9.07, 9.40):
    c('stamp', at=T, weight=0.8, gain_db=-12, label='word slams')
    whoosh_peak(T, length=0.2, peak=0.9, pitch=1.1, weight=0.4, gain_db=-21)
for T in (10.0, 10.25): c('glitch', at=T, length=0.07, character=0.6, gain_db=-20, label='poster slices')
for i, T in enumerate((10.5, 10.75, 11.0)): whoosh_peak(T, length=0.3, peak=0.6, pitch=1.0 + 0.1 * i, weight=0.3, pan=(-0.4, 0.4, 0.0)[i], gain_db=-21, label='bands fly off')
c('impact', at=11.75, length=0.8, size=0.8, brightness=0.9, sub_hz=55, hpf=45, gain_db=-11, label='collision flash')
# c03-title 12-16
for T, pan in ((12.4, -0.6), (12.42, 0.6)): whoosh_peak(T, length=0.4, peak=0.85, pitch=0.9, weight=0.4, pan=pan, gain_db=-19, label='registrations converge')
c('stamp', at=12.5, weight=0.7, gain_db=-14, label='lock on Realms')
blip(12.5, 'confirm', 1760, -22, verb={'hall': 0.25}, label='glint')
c('stamp', at=13.0, weight=0.45, gain_db=-17, label='Competitive registers')
c('data_chatter', at=13.3, length=0.4, density=14, gain_db=-27, label='TEAM AGAINST TEAM scramble')
whoosh_peak(15.9, length=0.3, peak=0.7, pitch=1.2, weight=0.3, gain_db=-18, label='slant wipe to ink')
# c04-team 16-26 (UI sounds: light, quick)
whoosh_peak(16.05, length=0.25, peak=0.5, pitch=1.5, weight=0.15, gain_db=-22, label='invite card springs up')
for t in (16.15, 16.2, 16.25, 16.3): c('ui_blip', at=t, kind='type', gain_db=-24, label='typing Nora')
blip(16.5, 'select', 1400, -21, length=0.1, label='Invite click')
blip(16.54, 'confirm', 1174.66, -21, label='Invited')
blip(16.78, 'select', 880, -20, length=0.12, label='NC lands in the team bar')
c('whoosh', at=17.38, length=1.1, peak=0.25, pitch=1.4, weight=0.2, gain_db=-22, label='team board scroll')
blip(18.5, 'select', 660, -21, length=0.1, label='board settles')
blip(18.76, 'select', 1400, -21, length=0.1, label='Join click')
blip(18.84, 'select', 987.77, -20, length=0.12, label='EK pops in')
blip(19.0, 'confirm', 1318.51, -17, verb={'hall': 0.25}, label='3/3 READY')
whoosh_peak(19.95, length=0.5, peak=0.85, pitch=1.2, weight=0.3, gain_db=-20, label='row opens into the canvas')
for t, f in ((20.6, 784), (21.08, 880), (21.26, 987.77)): blip(t, 'select', f, -20, length=0.12, label='note drops')
for t, L in ((20.42, 0.56), (20.8, 0.5), (21.32, 0.3)): c('tape_scrub', at=t, length=L, direction=1, gain_db=-27, label='marker scribble')
for t in (22.0, 22.07, 22.14): whoosh_peak(t, length=0.18, peak=0.8, pitch=1.6, weight=0.15, gain_db=-23, label='note dragged to lane')
for t in (22.48, 22.6, 22.72, 22.86, 22.98, 23.1): blip(t, 'tick', 2200, -26, label='task line')
for t, f in ((24.0, 1174.66), (24.25, 1396.91), (24.5, 1760.0)): blip(t, 'confirm', f, -19, label='agree check')
c('stamp', at=25.0, weight=0.6, gain_db=-15, label='AGREED')
blip(25.0, 'confirm', 1174.66, -18, verb={'hall': 0.3}, label='AGREED chime')
# c05a-match 26-30
c('tick_one', at=26.0, tone=0.7, gain_db=-14, label='cut to the globe')
blip(26.3, 'confirm', 880, -18, verb={'hall': 0.35}, label='ATLAS signal')
blip(26.5, 'deny', 659.26, -18, verb={'hall': 0.35}, label='VEGA signal')
c('whoosh', at=26.5, length=0.5, peak=0.9, pitch=1.3, weight=0.25, direction=1, gain_db=-20, label='matchmaking arc draws')
c('impact', at=27.0, length=0.45, size=0.45, brightness=0.7, sub_hz=60, hpf=60, gain_db=-15, label='MATCH FOUND locks')
whoosh_peak(27.5, length=0.35, peak=0.7, pitch=1.6, weight=0.2, gain_db=-21, label='card dealt')
c('tick_one', at=27.77, tone=1.5, gain_db=-18, label='card flips')
for t in (27.86, 27.94, 28.07, 28.2, 28.48): blip(t, 'tick', 2000, -25, label='card rows')
c('gate_clank', at=28.28, size=0.2, pitch=0.6, latch=False, length=0.6, fade_out=0.4, gain_db=-28, label='distant lightning in the thumbnail')
for T, d in ((29.05, -1), (29.05, 1)): c('whoosh', at=28.9, length=0.4, peak=0.4, pitch=1.1, weight=0.35, direction=d, gain_db=-20, label='card duplicates and splits L/R')
c('reverse_cymbal', hit_at=30.0, length=0.5, gain_db=-20, label='seam grows')
c('impact', at=29.62, length=0.9, size=0.6, brightness=0.2, sub_hz=40, hpf=30, gain_db=-22, label='thunder on both cards')
# c05b-split 30-36 (storm city, the same start twice)
c('impact', at=30.0, length=0.9, size=0.6, brightness=0.25, sub_hz=42, hpf=30, gain_db=-15, label='thunder: the seam opens')
c('gate_clank', at=30.0, size=0.25, pitch=1.6, latch=False, length=0.4, fade_out=0.2, gain_db=-22, label='lightning crack')
c('water_rush', at=30.0, length=6.0, intensity=0.3, bubbles=0.3, hpf=1200, fade_in=0.1, gain_db=-28, label='rain bed')
c('data_chatter', at=30.3, length=0.3, density=14, gain_db=-28, label='eyebrows scramble')
blip(30.5, 'select', 1174.66, -22, pan=-0.5, length=0.12, label='Atlas start pillar')
blip(30.52, 'deny', 659.26, -22, pan=0.5, label='Vega start pillar')
blip(30.75, 'confirm', 587.33, -21, verb={'hall': 0.3}, label='objective ring')
c('tape_scrub', at=31.4, length=0.8, direction=1, pan=-0.5, gain_db=-25, label='Atlas route draws')
for i in range(3): whoosh_peak(31.55 + 0.04 * i, length=0.22, peak=0.8, pitch=1.4, weight=0.2, pan=0.5, gain_db=-22, label='Vega rushes the bridges')
for t in (31.82, 31.86, 31.9): blip(t, 'deny', 784, -25, pan=0.5, label='bridge ping')
c('riser', hit_at=32.5, length=0.4, pan=-0.5, gain_db=-22, label='plant powers up')
for d, pan in ((-1, -0.5), (1, 0.5)): c('whoosh', at=32.64, length=0.7, peak=0.15, pitch=1.0, weight=0.35, direction=d, pan=pan, gain_db=-19, label='cameras swing apart on Another')
blip(33.26, 'deny', 659.26, -21, pan=0.5, verb={'hall': 0.25}, label='Vega converges')
blip(33.6, 'confirm', 880, -21, pan=-0.5, verb={'hall': 0.25}, label='Atlas arrives')
c('impact', at=34.5, length=0.8, size=0.5, brightness=0.3, sub_hz=45, hpf=35, gain_db=-19, label='second strike')
c('reverse_cymbal', hit_at=35.93, length=0.45, gain_db=-17, label='seam slams shut')
c('stamp', at=35.93, weight=0.8, gain_db=-13, label='seam slam')
# c06-lobby 36-40
c('glitch', at=36.0, length=0.08, character=0.8, gain_db=-17, label='frame bursts from the seam')
for t in (36.3, 36.33, 36.37): c('stamp', at=t, weight=0.5, gain_db=-17, pan=-0.4, label='Atlas panel')
whoosh_peak(36.66, length=0.3, peak=0.8, pitch=0.9, weight=0.5, direction=-1, pan=0.4, gain_db=-17, label='Vega panels slam in')
c('impact', at=36.76, length=0.6, size=0.7, brightness=0.6, sub_hz=55, hpf=45, gain_db=-12, label='face to face, VS')
whoosh_peak(37.6, length=0.3, peak=0.7, pitch=1.4, weight=0.2, gain_db=-22, label='role tray rises')
for t, f in ((37.94, 1174.66), (38.12, 1396.91), (38.3, 1760.0)): blip(t, 'select', f, -18, length=0.14, label='role chip locks in')
c('riser', hit_at=39.0, length=0.6, gain_db=-20, label='LOCKING PLAN bar')
c('stamp', at=39.0, weight=1.1, gain_db=-11, label='PLAN LOCKED')
c('reverse_cymbal', hit_at=39.95, length=0.25, gain_db=-17, label='collapse to a line')
# c07a-coordinate 40-44 (ice)
c('water_rush', at=40.0, length=4.0, intensity=0.35, bubbles=0.0, hpf=1500, fade_in=0.05, gain_db=-26, label='wind and snow bed')
c('whoosh', at=40.0, length=0.7, peak=0.08, pitch=0.7, weight=0.6, gain_db=-16, label='crane down')
for t, f in ((40.45, 587.33), (40.45, 698.46), (40.45, 880.0)): blip(t, 'select', f, -21, length=0.2, label='three markers leave at once')
c('ticks', bar=20, beat=0.9, bars=0.775, subdiv=4, accel=1.6, tone=1.3, intensity=0.6, gain_db=-17, label='synced timers')
c('data_chatter', at=41.45, length=0.25, density=14, gain_db=-27, label='section label')
c('impact', at=42.0, length=0.8, size=0.9, brightness=0.7, sub_hz=55, hpf=45, gain_db=-11, label='SYNC: all three sites light')
for t, f in ((42.0, 587.33), (42.0, 698.46), (42.0, 880.0)): blip(t, 'confirm', f, -19, verb={'hall': 0.3}, label='sync chord')
for t in (42.5, 43.0): blip(t, 'confirm', 1174.66, -24, verb={'hall': 0.25}, label='ring ping')
whoosh_peak(43.95, length=0.5, peak=0.85, pitch=1.0, weight=0.5, direction=1, gain_db=-16, label='fast pan right into the desert')
# c07b-commit 44-48 (desert)
c('water_rush', at=44.0, length=4.0, intensity=0.3, bubbles=0.0, hpf=3000, fade_in=0.05, gain_db=-27, label='blowing sand')
for t in (44.04, 44.115, 44.19): blip(t, 'tick', 1800, -23, label='scan option')
c('reverse_cymbal', hit_at=44.3, length=0.2, gain_db=-19, label='stamp coming down')
c('stamp', at=44.3, weight=1.2, gain_db=-10, label='LOCKED stamp')
c('gate_clank', at=44.3, size=0.35, latch=True, length=0.6, fade_out=0.3, gain_db=-18, label='lock click')
c('whoosh', at=44.3, length=1.1, peak=0.3, pitch=1.8, weight=0.1, gain_db=-22, label='light wave down the route')
for t in (44.42, 44.5): c('glitch', at=t, length=0.7, character=0.15, gain_db=-26, label='rejected route burns off')
c('riser', hit_at=47.97, length=3.0, gain_db=-17, label='convoy accelerates')
whoosh_peak(47.95, length=0.45, peak=0.85, pitch=0.9, weight=0.5, gain_db=-16, label='push and race into 48.0')
# c07c-adapt 48-52 (storm city, the rival move)
c('water_rush', at=48.0, length=4.0, intensity=0.35, bubbles=0.3, hpf=1200, fade_in=0.05, gain_db=-27, label='rain bed')
c('stamp', at=48.3, weight=0.9, gain_db=-12, label='Adapt. slams in')
blip(48.38, 'deny', 659.26, -20, pan=0.4, label='Vega pillar')
c('riser', hit_at=48.9, length=0.4, gain_db=-20, label='surge sweep')
for i in range(6): c('tick_one', at=round(48.55 + 0.13 * i, 3), tone=0.6, gain_db=-21, label='blocks die')
c('glitch', at=48.78, length=0.18, character=0.9, gain_db=-15, label='route breaks: short circuit')
c('riser', hit_at=49.9, length=0.85, gain_db=-20, label='new route draws')
for i in range(6): blip(round(49.1 + 0.14 * i, 3), 'select', 880 + 80 * i, -24, length=0.08, label='lights come back')
c('data_chatter', at=49.7, length=0.25, density=14, gain_db=-28, label='03 / 03 label')
blip(49.9, 'confirm', 880, -18, verb={'hall': 0.3}, label='route reaches the objective')
c('impact', at=50.5, length=0.8, size=0.5, brightness=0.3, sub_hz=45, hpf=35, gain_db=-19, label='lightning on the landmark')
whoosh_peak(51.97, length=0.5, peak=0.85, pitch=1.0, weight=0.5, gain_db=-15, label='speed-ramp push into the cut')
# c08-futures 52-56
c('glitch', at=52.0, length=0.25, character=0.5, gain_db=-17, label='root flash, lightning leaders')
blip(52.4, 'select', 2400, -18, length=0.08, label='YOUR DECISION snip')
c('tape_scrub', at=52.42, length=0.5, direction=-1, gain_db=-22, label='lower half collapses')
c('impact', at=53.3, length=0.7, size=0.6, brightness=0.9, sub_hz=48, hpf=40, gain_db=-14, label='THEIR MOVE: red bolt')
c('glitch', at=53.3, length=0.12, character=0.9, gain_db=-20)
whoosh_peak(54.1, length=0.6, peak=0.7, pitch=1.1, weight=0.4, gain_db=-19, label='camera dives along the branch')
for t in (54.5, 54.75, 55.0, 55.25, 55.5, 55.72, 55.85, 55.95): blip(t, 'tick', 1900, -23, label='fork flash')
c('reverse_cymbal', hit_at=56.0, length=0.4, gain_db=-17, label='into the white bloom')
# c09-record 56-60 (tape_scrub at 56.0 is in the music section)
for t in (56.04, 56.16, 56.38, 56.44): blip(t, 'tick', 1600, -24, label='marker passes the playhead')
c('tick_one', at=57.0, tone=0.8, gain_db=-14, label='stop: brackets snap')
c('typing', at=57.04, length=0.86, rate=12, gain_db=-21, label='event log types on')
c('stamp', at=57.3, weight=1.2, gain_db=-9, label='ON THE RECORD stamp')
c('tape_scrub', at=59.35, length=0.65, direction=1, gain_db=-18, label='fast-forward')
for t in (59.54, 59.77, 59.89, 59.96): blip(t, 'tick', 1600, -24, label='marker passes')
# c10-holds 60-64 (PAYOFF stamp 60.0 and impact 61.0 are in the music section)
for d, pan in ((1, -0.5), (-1, 0.5)): c('whoosh', at=60.0, length=1.0, peak=0.95, pitch=1.0, weight=0.35, direction=d, pan=pan, gain_db=-17, label='ribbons converge')
blip(61.0, 'confirm', 880, -16, verb={'hall': 0.4}, label='ring shimmer')
blip(61.24, 'confirm', 1174.66, -19, verb={'hall': 0.3}, label='holds: period pulse')
c('reverse_swell', hit_at=63.95, length=1.0, chord='Dm', gain_db=-19, label='point glides to centre')
# c11-cta 64-74
for t in (64.5, 66.0, 67.5): blip(t, 'confirm', 880, -25, verb={'hall': 0.35}, label='node pulse')
c('stamp', at=67.0, weight=0.5, gain_db=-17, label='lockup')
c('data_chatter', at=67.4, length=0.3, density=12, gain_db=-28, label='COMPETITIVE scramble')
whoosh_peak(68.15, length=0.5, peak=0.85, pitch=1.3, weight=0.25, gain_db=-20, label='point flies to the dock')
blip(68.2, 'select', 1400, -18, length=0.1, label='DOCK click')

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
