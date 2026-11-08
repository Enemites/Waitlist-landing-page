# Revision v3: variety and tempo

## The note (from the client)
The film is liked and the Floodgate map world stays: do not remove or replace it. Between 16 s and
64 s, though, almost 48 s plays on the same map with similar slow camera moves. That is too
uniform for a launch edit. Add new animations and new backgrounds that do not come from the site
assets, inside the same film, and vary the tempo: slow where it breathes, sometimes fast, always
with something new. A launch film is an edit, not a single-take film.

## The answer: seven inserts in six new visual languages
Each insert is an OVERLAY scene. It sits on top of the existing film at an absolute time,
`{ id, file, at, duration }` in `comp/scenes/manifest.js`, and the engine renders it above
everything. The scenes underneath keep running, so their timing, the VO and the music do not
move. Each insert is opaque while it is on screen (unless noted) and owns its own entrance and exit.
Inserts open and close on hard cuts that land on beats. The film's grammar still applies: one idea
per insert, the brand palette, Manrope headlines, JetBrains Mono labels, and the node and route
language. The new languages are new LOOKS, not new brands.

The map share drops from about 48 s to about 37 s, and from 16 s on something new arrives every
4-8 s.

| id | at | dur | over (hidden underneath) | VO under it | new visual language |
|---|---|---|---|---|---|
| `x05-iso-world` | 18.25 | 1.75 | s05: the routes draw on the flat map | (breath after v06) | **Ridgeline 3D**: the Floodgate valley as a 3D island of stacked ridgelines |
| `x05-versus` | 20.0 | 2.0 | s05: banners on the map, the dive | v07 "Bring your team. Match against another." (team 20.0, another 21.3) | **Versus slab**: diagonal split, giant type |
| `x06-player-cards` | 25.0 | 1.0 | s06: lobby ring with the three members | v08 "Start with people you know, or find a team to join." | **Player cards**: full-frame cards with generative patterns |
| `x08-gate-schematic` | 39.0 | 1.5 | s08: objective lift card filling to 62% | (none) | **Blueprint**: schematic line art of the gate powering up |
| `x10-formation` | 46.0 | 2.0 | s10: "Coordinate." on the map | (none; the one low hit lands at 46.0) | **Formation**: particle streams locking into the team |
| `x11-archive-flash` | 52.5 | 2.0 | s11 cuts M2 (52.5) and M5 (54.0) only; transparent otherwise | v12 tail | **Archive flash**: full-bleed graded archive on two beats |
| `x13-iso-plans` | 58.0 | 1.5 | s13: payoff accent, plans on the map | v14 starts 58.4 | **Ridgeline 3D** again: both plans meet at the gate |

Durations end exactly where the next existing beat takes over: 20.0 versus, 22.0 the s06 cut,
26.0 the ATLAS stamp, 40.5 Vega slides out of the fog, 48.0 "Commit.", 59.5 "See whose" rises.

## Shared rules for every insert
- Palette only: ground #0b0c0e / #0f0d0a, amber #efbd70 (light #f6d39f, deep #a37a42), rival
  #dd6248, bone #c9c0b2, ink #f2eee7. Atlas is amber; Vega is red-orange. No other hues.
- Copy only from `docs/brief.md` / the storyboard: ATLAS, VEGA, 3 V 3, Jules / Coordination,
  Nora / Power systems, Emre / Crossing, Restore gate power, OBJECTIVE 2 OF 3, 62%, Coordinate.,
  Floodgate. No new claims, numbers or dates. Archive years only where true (1925 chess, 1904 crews).
- The HUD slug 'REALMS · COMPETITIVE · INTERFACE CONCEPT' and the corners stay on every product
  frame (use Brand.hud). The archive flashes use the archive slug style (see s03).
- Tempo: these are the FAST moments. Cuts inside an insert land on beats or half-beats
  (multiples of 0.25 s). Motion is decisive (expo/power4 out, short), with speed ramps, not floaty.
  Hold readable type long enough for its words (one or two words per beat at this tempo).
- Scramble policy: Brand.scrambleTo is letters-only; never scramble digits (the helpers handle it).
- Engine rules: everything on ctx.tl or in ctx.onFrame; entrances with tl.fromTo (default
  immediateRender); no callbacks; no Math.random / Date.now; SVG ids prefixed with the scene id;
  onFrame budget about 15 ms (the ridgeline renderer must stay inside about 25 ms with
  pre-computed geometry).
- Each insert reports its sound cues (local seconds) so the mix can add slams, whooshes and ticks.

## Insert specs

### x05-iso-world (18.25-20.0) and x13-iso-plans (58.0-59.5): Ridgeline 3D
A new renderer, `comp/lib/ridgeline.js` (window.Ridgeline), draws the SAME Floodgate valley
(`Floodgate.productHeight()`: product coordinates 0..1600 x 0..1000, sea level 0.18) as a 3D island
of ridgelines: about 90-140 rows of polylines across the valley, each displaced upward by height,
projected with a perspective camera (yaw, pitch, distance, fov). Draw rows back to front, filling
under each line with the ground colour so nearer ridges occlude farther ones (the classic
"unknown pleasures" look). Lines are amber at 35-90% brightness, brighter on ridges and near the
camera. The river rows dip and read as a dark channel (lines dimmer or a faint teal-black fill
under sea level). The island floats on black with a soft amber rim light and a thin edge.
- Plans as light: a route is a 3D polyline sampled on the terrain plus a small lift, drawn as a
  glowing ribbon (an amber core plus a wider low-alpha glow) with a travelling bright head. Ours
  is amber from the Atlas summit (product ~380,320) via the pump (562,399) to the gate (800,560).
  Theirs is red-orange from the Vega summit (~1260,690) via the crossing (1004,396) to the gate.
  Markers: amber diamond pillar on the Atlas summit, red ring pillar on the Vega summit, a pulsing
  ring at the gate.
- x05-iso-world: cut in at 18.25 on a 3/4 view (pitch about 32 degrees), orbiting about 25 degrees
  over 1.75 s on a speed ramp (fast start, ease into a hold). Our ribbon draws 18.25-19.0, theirs
  19.0-19.6, a gate ring pulse at 19.5 (sonar ping). A mono label 'FLOODGATE · ONE WORLD' or
  'FLOODGATE · TEAM CHALLENGE · 3 V 3' scrambles in at the corner. 19.75-20.0: a fast push toward
  the gate; hard cut to x05-versus at 20.0.
- x13-iso-plans: cut in at 58.0 on the payoff accent on a low, dramatic angle (pitch about 18
  degrees) with both ribbons already drawn and their heads meeting at the gate (a bright flash at
  the meeting point on 58.0). The camera cranes up to near top-down by 59.4 so the hard cut into
  s13's top-down map at 59.5 feels like a match. No headline in this insert (s13 brings "See whose").
- Performance: pre-compute the grid of heights once at build (a module cache shared by both
  scenes); per frame only project and stroke.

### x05-versus (20.0-22.0): Versus slab
A full-frame diagonal split at the Enemites slant (about 34 degrees, Brand.SLANT).
- 20.0 (on VO 'team'): the amber half slams in from the left (6-8 f, expo.out, with a 2-frame
  overshoot on the edge only). Giant 'ATLAS' in Manrope 640 at about 300-380 px, ink on amber or
  amber on charcoal (choose for contrast), plus the Atlas diamond emblem. A fine generative texture
  inside the half (moving hatch or contour lines at 8-12% contrast) keeps it alive.
- 20.75: the red-orange half slams in from the right with 'VEGA' and the ring emblem. Land 'another'
  (21.3) on a hairline flash along the split.
- 21.25: a small centred mono '3 V 3' types on in the hairline gap. Both halves drift apart 1-2%.
- 21.75-22.0: a fast punch-in (scale 1 -> 1.6, power4.in) into the amber diamond, then a hard cut to
  s06's lobby ring at 22.0.

### x06-player-cards (25.0-26.0): Player cards
Three full-frame cards, about 0.33 s each, hard cuts at 25.0 / 25.333 / 25.667, then a hard cut back
to s06 at 26.0 exactly on the ATLAS stamp (landing note D5).
- Each card: giant monogram initials (JK / NC / EK) as an outline glyph at 600-800 px, half off-frame;
  the name in Manrope 650 at about 180 px ('Jules', 'Nora', 'Emre'); the role in mono 28 px amber
  ('COORDINATION', 'POWER SYSTEMS', 'CROSSING'); and a small 'ATLAS · 01/02/03' tag.
- Each card has its own generative background, always in the palette:
  - Jules: concentric rings radiating from the token.
  - Nora: vertical bars charging upward (power).
  - Emre: diagonal crossing hatch converging on a bridge line.
- Inside each 0.33 s, something moves fast: the name slides 40 px on a speed ramp and the pattern
  animates. Keep the type crisp and readable at a glance (one name per card).

### x08-gate-schematic (39.0-40.5): Blueprint
Charcoal ground with a fine 24 px amber grid at 6%. The floodgate is drawn as schematic line art
(orthographic front elevation or a clean isometric): five bays, piers, the conduit from the pump,
and dimension ticks. It draws on fast (DrawSVG, 0.3 s, staggered). Power flows along the conduit as
moving dashes; the five bays fill bottom-up one after another, synced to the existing 12 tick steps
(39.125 + 0.125 k). A big mono counter steps 0% -> 62% (never above 62), with 'RESTORE GATE POWER'
and 'OBJECTIVE 2 OF 3' labels. At 40.3-40.5 the drawing snaps away (or wipes along the conduit),
and the cut back to s08 lands at 40.5.

### x10-formation (46.0-48.0): Formation
This is the drop: the film's one low hit lands at 46.0. On frame 46.0, a black field (faint grid).
Three streams of amber particles (deterministic seeds, a few hundred each, motion-blurred trails)
shoot in from three edges toward centre-right, braid around each other and lock at about 46.9
into a triangle of three nodes (JK, NC, EK tokens) joined by hairlines, with a ring pulse at the
lock. 'Coordinate.' (Manrope, the same size and position as s10's word cards: x 120, around 140 px,
ink) rises with the lock. Hold the formation, breathing slightly, with small particle drift
inside. At 47.75-48.0 the formation snaps toward the frame centre; hard cut to s10's 'Commit.' at 48.0.

### x11-archive-flash (52.5-54.5; visible only 52.5-53.0 and 54.0-54.5)
Two full-bleed archive flashes replace two of the eight montage beats. In both, a 2-frame
grid-cell checker reveals the shot and a 2-frame checker hides it.
- 52.5-53.0: chess-1925-move-piece, the hand moving a piece (frames in
  .work/frames/chess-1925-move-piece, 24 fps).
- 54.0-54.5: sport-crew-race-1904 (or sport-two-crews-1904-hc), oars driving together (24 fps).

Amber grade (already in the frames), a slow 3% push, gate weave, register corners and a small mono
corner label ('ARCHIVE · 1925', 'ARCHIVE · 1904'). The scene is fully transparent outside these
two windows.

## Build split
1. **Ridgeline engineer**: `comp/lib/ridgeline.js`, `x05-iso-world`, `x13-iso-plans`.
2. **Graphic engineer**: `x05-versus`, `x06-player-cards`, `x11-archive-flash`.
3. **Motion engineer**: `x08-gate-schematic`, `x10-formation`.

Every engineer renders their inserts in place in the full film (the manifest lists them) and checks
the frames around each entrance and exit cut. Then a review panel runs, fixes follow, and the film
is rendered.
