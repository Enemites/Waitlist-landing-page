#!/usr/bin/env python3
"""Build the film's cue sheet (audio/cues.film.json) from the locked music plan in
docs/storyboard.md, plus the picture-synced SFX the scene engineers reported.

  python3 audio/film_cues.py [--vo-dir .work/audio/vo-film] [--sync audio/sync_cues.json]
  python3 audio/synth.py render audio/cues.film.json -o .work/audio/film/mix.wav --stems .work/audio/film/stems

Times are film seconds. 120 BPM: bar index b (0-based) starts at 2*b seconds.
"""
import argparse, json, os

ap = argparse.ArgumentParser()
ap.add_argument('--vo-dir', default='.work/audio/vo-film')
ap.add_argument('--sync', default='audio/sync_cues.json', help='optional picture-synced SFX list')
ap.add_argument('--out', default='audio/cues.film.json')
a = ap.parse_args()

# one chord per bar, bars 1..36 of the plan
CHORDS = ['Dm', 'Dm', 'Dm', 'Dm', 'Bb', 'Gm', 'A', 'Dm(add9)', 'Dm', 'Bb', 'Gm', 'Dm', 'Dm', 'Bb', 'Bb', 'Gm', 'A', 'Dm',
          'Bb', 'Gm', 'A', 'A', 'Asus4', 'Dm', 'Bb', 'Gm', 'A', 'A', 'Dm', 'Bb', 'F', 'Gm', 'Gm', 'A', 'Dm(add9)', 'Dm(add9)']
assert len(CHORDS) == 36

cues = []
def c(type_, **k):
    d = {'type': type_}; d.update(k); cues.append(d); return d
def bar(t): return t / 2.0
def whoosh_peak(T, length=0.8, peak=0.7, **k):
    return c('whoosh', at=round(T - peak * length, 4), length=length, peak=peak, **k)

# ---- Bars 1-2 (0-4): HOOK and FREEZE ---------------------------------------------------
c('ticks', bar=0, bars=2, subdiv=2, accent_every=2, intensity=0.85, gain_db=-3, label='match clock ticks')
c('drone', bar=0, bars=2, note='D2', brightness=0.3, intensity=0.25, gain_db=-8)
c('water_rush', at=0.0, length=4.0, intensity=0.3, bubbles=0.6, gain_db=-20, fade_in=0.05, label='river bed')
c('alert', at=0.5, reps=2, gain_db=-15, label='lift: Vega contesting')
c('tick_one', at=1.0, tone=1.4, gain_db=-6, label='flap 08:16')
c('tick_one', at=2.0, tone=1.4, gain_db=-6, label='flap 08:15')
c('tape_scrub', at=3.07, length=0.93, direction=-1, gain_db=-9, label='rewind')
c('data_chatter', at=3.07, length=0.9, density=24, gain_db=-18)
c('reverse_swell', hit_at=4.0, length=0.93, chord='Dm', gain_db=-11)

# ---- Bars 3-6 (4-12): LEGACY ------------------------------------------------------------
for t in (4.067, 4.133, 4.2, 4.267, 4.5): c('tick_one', at=t, tone=1.2, gain_db=-9, label='odometer flap')
c('pad', bar=2, bars=4, intensity=[0.35, 0.55], gain_db=-8, fx=['lofi'])
c('drone', bar=2, beat=2, bars=3.5, note='D1', brightness=0.35, intensity=0.45, gain_db=-11)
c('ticks', bar=2, bars=4, subdiv=2, accent_every=4, intensity=0.7, gain_db=-7, label='pocket-watch ticks')
for T in (5.0, 7.0, 8.5, 10.0):
    whoosh_peak(T, length=0.8, peak=0.7, weight=0.75, pitch=0.6, gain_db=-17)
    c('ui_blip', at=T, kind='tick', freq=900, gain_db=-15, label='projector shutter')
for t in (5.5, 5.75, 6.0): c('stamp', at=t, weight=0.5, gain_db=-14, label='wooden tap: marker on rake')
for t, f in ((8.6, 1600), (8.733, 1800), (8.867, 2000)): c('ui_blip', at=t, kind='select', freq=f, length=0.18, gain_db=-19, label='telestrator squeak')
c('stamp', at=11.25, weight=1.0, gain_db=-9, label='stamp: red ring on rival boat')

# ---- Bar 7 (12-14): HINGE ---------------------------------------------------------------
c('bass_ostinato', bar=6, bars=1, intensity=0.5, gain_db=-8)
c('taiko', bar=6, bars=1, intensity=0.4, gain_db=-12)
c('water_rush', at=12.5, length=1.8, intensity=0.8, gain_db=-12, fade_in=0.6, label='rising water flood')
for t in (13.0, 13.5, 13.567, 13.633, 13.7): c('tick_one', at=t, tone=1.2, gain_db=-10, label='odometer flap')
c('riser', hit_at=14.0, length=2.0, gain_db=-11)

# ---- Bar 8 (14-16): TITLE ----------------------------------------------------------------
c('gate_clank', at=14.0, size=1.1, latch=True, gain_db=-5, label='TITLE ACCENT latch')
c('stamp', at=14.0, weight=1.2, gain_db=-8)
c('pad', bar=7, bars=1, intensity=[0.45, 0.8], gain_db=-6, label='Dm(add9) swell')

# ---- Bars 9-11 (16-22): ONE WORLD ---------------------------------------------------------
c('pad', bar=8, bars=3, intensity=0.5, gain_db=-8)
c('bass_ostinato', bar=8, bars=3, pattern='R.......R.......', intensity=0.6, gain_db=-7, label='sub pulse 1 and 3')
c('ticks', bar=8, bars=3, subdiv=2, accent_every=4, intensity=0.7, gain_db=-9)
whoosh_peak(17.5, length=0.6, peak=0.6, pitch=1.3, weight=0.3, pan=-0.6, gain_db=-16)
whoosh_peak(18.5, length=0.6, peak=0.6, pitch=1.3, weight=0.3, pan=0.6, gain_db=-16)
c('ui_blip', at=19.5, kind='confirm', freq=880, gain_db=-12, verb={'hall': 0.3}, label='sonar ping')
c('stamp', at=20.0, weight=0.8, gain_db=-11, label='amber banner')
c('stamp', at=20.75, weight=0.8, gain_db=-11, label='red banner')
whoosh_peak(22.0, length=1.0, peak=0.75, weight=0.7, gain_db=-12, label='dive into the ring')

# ---- Bars 12-14 (22-28): 01 FORM YOUR TEAM ---------------------------------------------------
c('plucks', bar=11, bars=3, intensity=0.5, gain_db=-11)
c('bass_ostinato', bar=11, bars=3, intensity=0.7, gain_db=-8)
c('pad', bar=11, bars=3, intensity=0.45, gain_db=-10)
c('ticks', bar=11, bars=3, subdiv=2, accent_every=4, intensity=0.75, gain_db=-9)
for t, f in ((23.5, 1174.66), (24.0, 1318.51), (24.5, 1479.98)): c('ui_blip', at=t, kind='select', freq=f, gain_db=-17)
c('ui_blip', at=26.0, kind='select', freq=587.33, gain_db=-8, verb={'hall': 0.3}, label='LANDING NOTE 1 D5: ATLAS')
c('stamp', at=26.0, weight=0.9, gain_db=-11)
c('gate_clank', at=26.0, size=0.6, gain_db=-15)
for t in (27.0, 27.5, 28.0): c('tick_one', at=t, gain_db=-11)
c('riser', hit_at=28.4, length=2.0, gain_db=-12)

# ---- Bars 15-17 (28-34): 02 FIND YOUR OPPOSITION ---------------------------------------------
c('plucks', bar=14, bars=3, intensity=0.6, gain_db=-11)
c('bass_ostinato', bar=14, bars=3, intensity=0.78, gain_db=-8)
c('pad', bar=14, bars=3, intensity=0.5, gain_db=-10)
c('ticks', bar=14, bars=3, subdiv=2, accent_every=4, intensity=0.8, gain_db=-9)
whoosh_peak(28.4, length=0.9, peak=0.7, weight=0.6, gain_db=-10, label='planned-matchmaking whip')
c('stamp', at=28.75, weight=0.8, gain_db=-12, label='arrival')
c('gate_clank', at=33.0, size=1.0, latch=True, gain_db=-10, label='river becomes the versus line')
c('reverse_cymbal', hit_at=33.0, length=1.5, gain_db=-14)
c('ui_blip', at=34.0, kind='select', freq=698.46, gain_db=-8, verb={'hall': 0.3}, label='LANDING NOTE 2 F5: score pill')

# ---- Bars 18-22 (34-44): 03 MAKE YOUR MOVE --------------------------------------------------
c('drums', bar=17, bars=5, intensity=[0.6, 0.85], gain_db=-9)
c('taiko', bar=18, bars=4, intensity=[0.5, 0.8], gain_db=-11)
c('bass_ostinato', bar=17, bars=5, intensity=[0.75, 0.9], gain_db=-8)
c('plucks', bar=17, bars=5, intensity=[0.5, 0.7], gain_db=-11)
c('pad', bar=17, bars=5, intensity=0.5, gain_db=-10)
c('ticks', bar=17, beat=1, bars=4.75, subdiv=1, accent_every=4, intensity=0.85, gain_db=-7, label='clock: one match-second per beat')
for t in (35.0, 37.5, 41.0): c('ui_blip', at=t, kind='type', gain_db=-13, label='message arrives')
c('ui_blip', at=38.0, kind='select', freq=880.0, gain_db=-8, verb={'hall': 0.3}, label='LANDING NOTE 3 A5: PLAN AGREED')
c('tick', at=39.0, length=1.5, subdiv=4, accent_every=4, gain_db=-4, label='fill ticks')
c('alert', at=42.25, reps=1, gain_db=-16)
c('shepard', bar=19, bars=3, intensity=[0.2, 0.9], gain_db=-10)

# ---- Bar 23 (44-46): BREATH #2, LAST SEEN -----------------------------------------------------
c('pad', bar=22, bars=1, intensity=0.25, gain_db=-14)
c('drone', bar=22, bars=1, note='D1', intensity=0.3, gain_db=-12)
c('tick_one', at=45.0, gain_db=-5, bus='sfx', label='tick in the silence (ghost flicker)')
c('water_rush', at=44.0, length=2.0, intensity=0.2, gain_db=-26, label='faint river')
c('reverse_cymbal', hit_at=46.0, length=1.0, gain_db=-16)

# ---- Bars 24-26 (46-52): THE DROP -------------------------------------------------------------
c('impact', at=46.0, size=1.3, brightness=0.3, sub_hz=44, gain_db=0, label='THE ONE LOW HIT')
c('sub_drop', at=46.0, f0=90, f1=27, gain_db=-5)
c('bass_ostinato', bar=23, bars=3, intensity=0.9, gain_db=-6)
c('drums', bar=23, bars=3, intensity=0.85, gain_db=-7)
c('taiko', bar=23, bars=3, intensity=0.85, gain_db=-9)
c('plucks', bar=23, bars=3, intensity=0.6, gain_db=-10)
c('pad', bar=23, bars=3, intensity=0.5, gain_db=-10)
c('ticks', bar=23, bars=3, subdiv=2, accent_every=4, intensity=0.85, gain_db=-8)
for t in (48.0, 50.0): c('stamp', at=t, weight=1.1, gain_db=-8, label='Commit. / Adapt.')

# ---- Bars 27-28 (52-56): THE MATCH ------------------------------------------------------------
c('bass_ostinato', bar=26, bars=2, intensity=1.0, gain_db=-6)
c('drums', bar=26, bars=2, intensity=0.95, gain_db=-7)
c('taiko', bar=26, bars=2, intensity=0.95, gain_db=-9)
c('plucks', bar=26, bars=2, intensity=0.7, gain_db=-10)
c('pad', bar=26, bars=2, intensity=0.55, gain_db=-10)
c('ticks', bar=26, bars=2, subdiv=2, accent_every=4, intensity=0.9, gain_db=-8)
for i in range(8):
    t = 52.0 + 0.5 * i
    if i % 2 == 0: c('stamp', at=t, weight=0.7, gain_db=-16, label='beat cut')
    else: c('gate_clank', at=t, size=0.5, gain_db=-16, label='beat cut')
for t in (53.0, 55.0): c('ui_blip', at=t, kind='tick', freq=2400, gain_db=-12, label='grid-cell cut')
c('tick_one', at=55.5, gain_db=-10)
c('riser', hit_at=56.0, length=2.0, gain_db=-10)

# ---- Bar 29 (56-58): REVIEW ---------------------------------------------------------------------
c('tape_scrub', at=56.0, length=0.9, direction=-1, gain_db=-17)
c('pad', bar=28, bars=1, intensity=0.35, gain_db=-10)
c('reverse_cymbal', hit_at=58.0, length=1.2, gain_db=-19)

# ---- Bars 30-32 (58-64): PAYOFF and MEDALLION ------------------------------------------------------
c('stamp', at=58.0, weight=1.3, gain_db=-6, label='PAYOFF ACCENT')
c('gate_clank', at=58.0, size=1.4, gain_db=-7)
c('pad', bar=29, bars=3, intensity=[0.5, 0.35], gain_db=-8)
c('plucks', bar=29, bars=3, pattern='0...1...2...1...', intensity=0.35, gain_db=-13)
c('ticks', bar=29, bars=3, subdiv=1, accent_every=4, intensity=0.6, gain_db=-12)
c('whoosh', at=62.0, length=1.5, peak=0.95, weight=0.5, pitch=0.9, gain_db=-13, label='world shrinks into the ring')
c('ui_blip', at=63.5, kind='confirm', freq=880, gain_db=-12, verb={'hall': 0.3}, label='sonar ping')

# ---- Bars 33-36 (64-72): CTA ---------------------------------------------------------------------
c('pad', bar=32, bars=2, intensity=[0.35, 0.5], gain_db=-9)
c('ticks', bar=32, bars=2, subdiv=1, accent_every=4, intensity=0.55, gain_db=-12, label='last tick 67.5')
c('reverse_swell', hit_at=64.0, length=1.5, chord='Gm', gain_db=-15)
c('ui_blip', at=67.0, kind='confirm', gain_db=-15, label='button wipes in')
for t, f in ((68.0, 587.33), (68.25, 698.46), (68.5, 880.0)):
    c('ui_blip', at=t, kind='select', freq=f, gain_db=-6, verb={'hall': 0.35}, label='SONIC LOGO')
c('plucks', bar=34, bars=1, pattern='0.1.2...........', intensity=0.3, gain_db=-14, verb={'hall': 0.3})
c('resolve_swell', at=68.0, length=3.5, chords=['Dm(add9)'], gain_db=-6)

# ---- Picture-synced SFX reported by the scene engineers (film seconds) -------------------------
def blip(t, kind='tick', freq=1760, g=-18, **k): return c('ui_blip', at=t, kind=kind, freq=freq, gain_db=g, **k)
# s02 rewind: UI panels exit with small panned whooshes
for T, pan in ((3.67, -0.5), (3.77, 0.6), (3.87, -0.6), (3.97, 0.0)): whoosh_peak(T, length=0.45, peak=0.7, pitch=1.4, weight=0.25, pan=pan, gain_db=-20)
# s03 legacy
c('tape_scrub', at=10.1, length=0.6, direction=1, gain_db=-20, label='course line pencil scratch')
blip(10.7, 'select', 1320, -20, label='chevron pops')
# s04 hinge
whoosh_peak(12.0, length=0.5, peak=0.8, weight=0.6, pitch=0.7, gain_db=-17, label='match cut back to the table')
blip(12.0, 'tick', 900, -15, label='projector shutter')
for t in (12.25, 12.5): c('stamp', at=t, weight=0.45, gain_db=-15, label='team markers 2 and 3')
whoosh_peak(13.5, length=0.6, peak=0.6, pitch=1.1, weight=0.4, gain_db=-19, label='node arcs onto the summit')
# s05 one world: route arrowheads pop
blip(18.25, 'select', 1174.66, -17, pan=-0.4); blip(19.25, 'select', 987.77, -17, pan=0.4)
# s06 form your team
for t in (22.75, 22.82, 22.88): blip(t, 'tick', 2600, -24, label='empty slots')
for t in (23.5, 24.0, 24.5): c('stamp', at=t, weight=0.5, gain_db=-15, label='member snaps into slot')
c('data_chatter', at=25.0, length=0.5, density=18, gain_db=-22, label='triangle lines draw')
# s07 find your opposition
for t in (29.0, 29.25, 29.5): blip(t, 'deny', 660, -16, label='Vega triangle stamps')
c('stamp', at=29.75, weight=0.8, gain_db=-12, label='VEGA stamps')
whoosh_peak(32.9, length=0.6, peak=0.65, weight=0.5, gain_db=-17, label='pull-back to overview')
for pan in (-0.6, 0.6): whoosh_peak(33.9, length=0.4, peak=0.8, pitch=1.3, weight=0.3, pan=pan, gain_db=-19)
# s08 make your move
for t in (34.25, 34.317, 34.383, 34.45): blip(t, 'tick', 2200, -24, label='UI panels enter')
c('typing', at=35.0, length=0.6, rate=12, gain_db=-17, label='Jules types')
blip(35.4, 'confirm', 1046.5, -19, label='zone lights: pump'); blip(35.6, 'confirm', 1174.66, -19, label='zone lights: crossing')
blip(36.5, 'select', 1700, -20, length=0.2, label='NC route squeak')
blip(38.25, 'select', 1900, -20, length=0.2, label='EK route squeak')
for k in range(12): blip(39.125 + 0.125 * k, 'tick', 1500 + 40 * k, -22, label='objective fill step')
whoosh_peak(40.75, length=0.7, peak=0.6, pitch=0.6, weight=0.7, gain_db=-17, label='Vega slides out of the fog')
whoosh_peak(41.6, length=0.6, peak=0.6, pitch=0.7, weight=0.6, gain_db=-18, label='their route draws')
c('glitch', at=41.5, length=0.25, character=0.3, gain_db=-20, label='CONTESTED scramble')
# s09 last seen
c('data_chatter', at=44.25, length=0.4, density=12, gain_db=-26, label='LAST SEEN re-scramble')
# s10 coordinate / commit / adapt
for t in (46.5, 46.633, 46.767, 46.9): blip(t, 'select', 1800, -22, length=0.12, label='telestrator squeak')
c('stamp', at=47.25, weight=0.35, gain_db=-16, label='chevrons pop')
whoosh_peak(48.0, length=0.5, peak=0.8, weight=0.4, gain_db=-17); whoosh_peak(50.0, length=0.5, peak=0.8, weight=0.4, gain_db=-17)
whoosh_peak(48.5, length=0.6, peak=0.6, pitch=1.2, weight=0.3, gain_db=-19, label='commit route pencil')
blip(50.9, 'deny', 520, -16, label='red arrowhead + lunge')
blip(51.1, 'select', 1700, -21, length=0.2, label='reroute squeak'); c('stamp', at=51.75, weight=0.35, gain_db=-15, label='reroute arrowhead')
# s11 montage
whoosh_peak(53.2, length=0.4, peak=0.7, pitch=0.6, weight=0.7, gain_db=-19, label='red triangle lunges')
# s12 review
whoosh_peak(56.4, length=0.5, peak=0.7, pitch=1.2, weight=0.3, gain_db=-21, label='fold into the review window')
for t in (56.733, 56.9, 57.133): blip(t, 'tick', 2200, -21, label='marker pop')
blip(57.5, 'confirm', 880, -16, verb={'hall': 0.25}, label='playhead lands on 08:31')

# ---- VO -------------------------------------------------------------------------------------------
VO = {'v01': 4.60, 'v02': 7.25, 'v03': 8.75, 'v04': 10.25, 'v05': 14.30, 'v06': 16.30, 'v07': 20.20, 'v08': 24.30,
      'v09': 30.00, 'v10': 32.60, 'v11': 36.50, 'v12': 50.40, 'v13': 56.10, 'v14': 58.40, 'v15': 63.80, 'v16': 66.70}
vo_override = {}
if a.sync and os.path.exists(a.sync):
    sync = json.load(open(a.sync))
    vo_override = sync.get('vo', {})
    for s in sync.get('sfx', []): cues.append(s)
for k, t in VO.items():
    cues.append({'type': 'file', 'path': os.path.join(a.vo_dir, k + '.wav'), 'at': vo_override.get(k, t), 'bus': 'vo', 'label': k})

sheet = {
    'comment': 'Realms Competitive launch film, 72 s, 120 BPM, D minor. Generated by audio/film_cues.py from the music plan in docs/storyboard.md.',
    'duration': 72.0, 'bpm': 120, 'chords': CHORDS,
    'buses': {
        'music': {'duck': {'key': 'vo', 'depth_db': 9, 'attack': 0.06, 'release': 0.45, 'hold': 0.25}},
        'sfx': {'duck': {'key': 'vo', 'depth_db': 4}},
        'vo': {'chain': 'vo', 'over_bed_lu': 8},
    },
    'master': {'lufs': -14.0, 'true_peak': -1.0, 'glue': True},
    'mutes': [
        {'from': 3.0, 'to': 3.0667, 'buses': ['music', 'sfx', 'vo'], 'fade': 0.003},
        {'from': 45.0, 'to': 46.0, 'buses': ['music'], 'fade': 0.01},
        {'from': 71.6, 'to': 72.0, 'buses': ['music', 'sfx', 'vo'], 'fade': 0.02},
    ],
    'fade_out': 1.2,
    'cues': cues,
}
json.dump(sheet, open(a.out, 'w'), indent=1)
print(f'wrote {a.out}: {len(cues)} cues')
