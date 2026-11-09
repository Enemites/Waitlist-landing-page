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
  Floodgate. No new claims, numbers or dates. Archive years only where true (1925 chess, 1904 crews in s03, 1937 The River levee in x11).
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

## Round 2 (after the v3 review panel)
The panel measured the v3 render: the inserts cluster at 18-26 s and 46-59.5 s, and 26.0-39.0 s was still
13 s of map with no hard cut (the stillest stretches of the film at 29.5-32.4 and 35-39). Two more inserts close
that gap, so the longest map-only run drops to about 5.5 s (40.5-46.0, which is the intended LAST SEEN breath):

| id | at | dur | over (hidden underneath) | VO under it | new visual language |
|---|---|---|---|---|---|
| `x07-section` | 30.5 | 1.5 | s07: Vega's ring held under 'The same challenge. / Another approach.' | v09 'Read the same situation.' | **Section**: the valley as one side-on elevation profile, Atlas summit to gate to Vega summit |
| `x08-roles` | 36.5 | 1.5 | s08: the NC and EK routes draw on the dim match UI | v11 'Divide responsibilities and make the call together.' | **Roles**: three slanted panes, one job each, cut back on PLAN AGREED at 38.0 |

### x07-section (30.5-32.0)
Sample `Floodgate.productHeight()` along the polyline Atlas summit (380,320) -> gate (800,560) -> Vega summit
(1260,690) and draw it as a side-on profile (a seismograph / survey section look, new to the film): stacked
parallel offset profiles receding in depth, hatching under the ground line, the river trough at sea level, an
amber pillar and diamond on the left summit, a red-orange ring on the right, the gate on the trough. A scan line
sweeps the section on 31.0. 'The same challenge.' and 'Another approach.' stay exactly where s07 sets them (x 120,
baselines 380 and 510, 120 px, ink and amber) so the headline reads straight across both cuts. Cut back to s07
at 32.0.

### x08-roles (36.5-38.0)
Three slanted panes (Brand.SLANT) slam in on 36.5, 36.75 and 37.0, one per member, each with that member's
token and the place they were sent in the s08 messages: JULES · COORDINATION (the gate), NORA · PUMP STATION
(the pump), EMRE · CROSSING (the crossing), drawn as a small line pictogram of the place. Colour identity only
borrows the x06 card motifs (rings / bars / hatch); the layout must not look like the x06 cards. 37.75-38.0
snap out; hard cut back to s08 at 38.0, where PLAN AGREED lifts.

### Polish from the panel
- ridgeline.js: the island cliffs read as missing (the cliff fill equals the void): give the cliff band its own
  fill and dissolve row ends; x05 starts our plan already drawn (no rewind across the cut).
- x05-versus: the 'another' flash decays as a grey chrome strip: keep it in brand colours, clip the seam off
  the HUD slug, a deeper punch into the diamond at the exit.
- x10-formation: three separate comets, not two clumps; use more of the frame.
- x11-archive-flash: the 1904 crew flash repeated s03's shot: replace it with The River 1937 sandbag team
  (river-levee-sandbag-team), labels resolve faster.
- x08-gate-schematic: drafting errors (pump floats, conduit through the hatching).
- s10: cuts on the half bar after the drop (48-52.5 held two static framings).
- s01: the 3 s hook push in two beat-synced moves instead of one slow push.

### Round 2 outcome
- x07-section and x08-roles are in. The 26-39 s stretch now cuts away from the map at 30.5 and 36.5.
- x11 uses river-levee-sandbag-team, labelled 'ARCHIVE · 1937', instead of the 1904 crews (s03 already shows them).
- s06 lands with an 8-frame zoom (0.88x to 1.0, apex anchored) so the x05 dive carries through the 22.0 cut.
- Sound: audio/film_cues.py has a block per round-2 insert, plus the retimed polish cues.

## Round 3 (after the final review of the round-2 render)
Scores: tempo 7.5, craft 8.5, sound 7.5. Verified findings and their fixes:

| at | change | why |
|---|---|---|
| 41.0-42.25 | new insert `x08-contest`: the rival scan, a full-frame polar radar in Vega red on charcoal | 40.5-46.0 was the longest map run in 16-64 (5.5 s) |
| 61.0-62.0 | s13 punch-in onto the gate where the two plans meet, back to the drift on 62.0 | no cut from 59.5 to 72; the payoff layout restated s05 |
| encode | chroma-qp-offset in the picture render and both delivery encodes; ridgeline stroke floor raised | the amber ridgelines turned grey in the CRF 20 master |
| 22.0 | s06 pump box hidden from the first frame | a clipped box hung on the right edge for 7 frames |
| polish | x11 corner blink, levee plate sharpening, x08-roles sliced type frame, x07 summit markers on the peaks, x05-versus 3 V 3 size and slug clear of the seam, s01 alert/title one-frame overlap | craft nits |
| sound | per-insert material (card flips, metal panes, electrical blueprint kick), 22.0 landing, v12 over the peak bus, limiter load at 14.0 and 46.0, ending decay | one stamp sample on 38 cues; v12 4.4 LU over the bed |

### x08-contest (41.0-42.25)
Hard cut in on the 41.0 beat, out on 42.25 exactly as s08's alert card starts to lift, so the hook
callback (42.25-44.0) and the 43.5 loop-close frame play untouched. Full-frame polar radar: range rings,
a sweep arm, Vega red-orange (Brand rival) on charcoal, amber only for the crossing glyph. Two Vega
triangle contacts converge on the crossing glyph. Mono label 'CONTESTED · CROSSING' scrambling in about
41.5 (do not repeat the 'Vega is contesting the crossing' line; the lift card says it on 42.25). Beat
accents on 41.0, 41.25, 41.5, 41.75, 42.0. HUD slug and corner brackets as every insert. Hidden s08
sounds under it (glitch 41.5, whoosh peaking 41.6) are repurposed for the label and the convergence.

### Round 3 outcome
- x08-contest built (art director 7.8 -> fixes: pings hit on the beat frames, escalate, the lock is the brightest frame).
- s13 punch: gate pinned at screen (1110,500), zoom 1.58 -> 1.70; 60.967 and 62.0 onward unchanged.
- ridgeline: lw 1.3 + 1.25*near, depth fade 0.5 + 0.5*near^0.9; chroma survival in the CRF 20 encode +6-8 points.
- s08's alert pill got the same opaque-ground fix as s01 (42.283 lift, 43.27 drop).
- Sound: per-insert material, x08-contest pings and lock, s13 punch, 22.0 landing, v12 over the peak bus, limiter load at 14.0 / 46.0, the resolve rings out.
