# Storyboard v4: "Worlds" (rebuild)

## Why v4
The client rejected v3: it still used one field (the Floodgate map) and one scenario (Atlas vs Vega at
the gate) from start to end, with clips cut into the middle. v4 is a new film. Each section explains a
different part of Competitive mode in its own visual world. The product truth that makes this honest
comes from the brief: Realms runs on an AI world model that *imagines* worlds and situations ("Worlds
imagined by AI. Shaped by your decisions."). So the film shows many worlds, not one map. Floodgate may
appear once, as one world among many, never as the backbone.

## Spec
74.0 s, 1920x1080, 30 fps, 120 BPM (beat 0.5 s, bar 2 s, bar n starts at 2n s). Every scene boundary is
a HARD CUT on a bar line (the incoming scene owns any flash on its first 1-2 frames). Palette and type as
before (comp/lib/BRAND.md, brand.js): charcoal grounds, amber = us/Atlas, red-orange = rival/Vega, bone,
ink; Manrope + JetBrains Mono. Variety comes from technique, composition, camera, ground and scale, not
from new hues. Full-frame INK (#f2eee7) or AMBER grounds are allowed and wanted in places (light scenes
break the all-dark monotony). No topographic contour map as a background anywhere except one quick world
in the hook. HUD slug/corners (Brand.hud) only where a scene is "product UI"; pure type and abstract
scenes may drop it.

## VO (Kokoro af_heart, rendered: .work/audio/vo-v4/, script audio/vo.v4.json)
| id | film start | dur | text | word starts (relative) |
|---|---|---|---|---|
| w01 | 1.00 | 1.80 | Worlds imagined by AI. | Worlds 0.00, imagined 0.34, by 0.90, AI 1.06 |
| w02 | 4.50 | 1.55 | Shaped by your decisions. | Shaped 0.00, by 0.38, your 0.60, decisions 0.70 |
| w03 | 8.40 | 1.61 | Now, face another team. | Now 0.00, face 0.30, another 0.66, team 0.98 |
| w04 | 12.50 | 1.55 | Realms. Competitive. | Realms 0.00, Competitive 0.50 |
| w05 | 16.40 | 2.19 | Bring friends. Or join a team. | Bring 0, friends .22, Or 1.00, join 1.16, a 1.42, team 1.60 |
| w06 | 20.60 | 2.98 | Share what you see. Decide how you'll work together. | Share 0, what .28, you .48, see .64, Decide 1.42, how 1.78, you'll 1.96, work 2.16, together 2.30 |
| w07 | 26.30 | 3.75 | Two teams. The same starting conditions. One objective. | Two 0, teams .20, The .96, same 1.06, starting 1.32, conditions 1.72, One 2.70, objective 2.92 |
| w08 | 31.40 | 2.35 | The same challenge. Another approach. | The 0, same .16, challenge .40, Another 1.34, approach 1.56 |
| w09 | 36.20 | 2.45 | Meet the other side. Assign your roles. | Meet 0, the .24, other .42, side .56, Assign 1.44, your 1.72, roles 1.88 |
| w10 | 40.30 | 0.94 | Coordinate. | |
| w11 | 44.30 | 0.73 | Commit. | |
| w12 | 48.30 | 0.81 | Adapt. | |
| w13 | 52.20 | 3.29 | Your decisions, and their moves, change what happens next. | Your 0, decisions .18, and .64, their 1.08, moves 1.22, change 1.62, what 2.08, happens 2.30, next 2.60 |
| w14 | 56.30 | 1.70 | Every move, on the record. | Every 0, move .34, on .66, the .94, record 1.04 |
| w15 | 60.30 | 1.67 | See whose strategy holds. | See 0, whose .26, strategy .52, holds .96 |
| w16 | 64.50 | 1.80 | Bring this challenge to your group. | |
| w17 | 68.20 | 1.29 | Get match updates. | |

On-screen type may echo the VO but should not just subtitle it. Copy comes only from the brief
(docs/brief.md) and this file; illustrative labels inside worlds (place names, short notes, team
names) are fine if they make no product claims, numbers of players beyond 3 v 3, prices or dates.

## Music map (procedural score, written after the picture)
0-8 pulse + rising worlds texture | 8-12 build, two-hit split at 8.0 | 12.0 TITLE HIT | 16-26 light
groove (plucks) | 26-36 tension (ticks, sub) | 36-40 riser | 40.0 THE DROP (full groove) 40-52 |
52-56 peak, glitchy | 56-60 rewind / scrub texture | 60.0 PAYOFF hit | 64-74 resolve to silence.

## Scenes (manifest order; local time 0 = film start of the scene)

### c01-imagined, 0.0-8.0: "Worlds imagined"
Black. 0.0-0.5 an amber seed point appears at frame centre and pulses on 0.0 and 0.25.
0.5-6.5: on EVERY beat (12 beats) the seed imagines a different world, which materialises out of the point
in its own generative technique; hard cut on each beat, the point stays at frame centre as the anchor
(each world is composed around it). Fast, crisp, confident. Suggested worlds (each a different look):
1 coastline from a glyph/character field settling into shaded terrain; 2 mountain range as 3D
ridgelines (comp/lib/ridgeline.js); 3 orbital station as a rotating wireframe of rings; 4 archipelago
of extruded voxel islands; 5 dune sea as particle flow-field streamlines; 6 a river valley (the
Floodgate world, comp/lib/floodgate.js, one beat only); 7 forest as a dense field of growing strokes;
8 a canyon as hatching; 9 a city as a dot-matrix night grid; 10 weather fronts as isobar lines; 11 an
ice shelf as cracked polygons; 12 a volcanic island as concentric ring extrusion. Accent changes per
world (amber/bone/red). Two beats may hold a world for 1 s for breath; vary camera (orbit, push, top
down). Type: tiny mono world tags in a corner (e.g. 'WORLD 07 · ARCHIPELAGO') scrambling per cut.
VO w01 at 1.0 and w02 at 4.5: give each a big kinetic word moment ("IMAGINED" around 1.4, "DECISIONS"
around 5.2), large Manrope, layered over the world for 0.5-0.8 s.
6.5-7.75: all worlds snap into a 4x3 grid of tiles (the catalogue of worlds), which then collapses back
into the seed point. 7.75-8.0: black with the point. Last frame: point at centre.

### c02-face, 8.0-12.0: "Face another team"
First bright scene. 8.0: the point SPLITS into two (amber left, red-orange right) on a hit and the frame
flips to an INK ground. The two points pull apart to the edges. Giant kinetic type, synced to w03 (8.4):
'FACE' (8.7), 'ANOTHER' (9.06), 'TEAM.' (9.38), filling the frame, each word slammed in with a different
transform (scale punch, slide on the brand slant, mask wipe). 10.0-11.5: the words break apart; the two
points race back toward each other along the slant. 11.75: they collide at centre, white-hot flash.

### c03-title, 12.0-16.0: Title
12.0 TITLE HIT out of the collision: shockwave ring, then the Enemites mark + 'Realms' (huge) +
'Competitive' (amber) + eyebrow 'TEAM AGAINST TEAM'. New treatment (not the v3 hinge): the title is
assembled from two registrations, the top halves arrive amber from the left and the bottom halves
red-orange from the right, and lock into ink exactly on 12.5 when w04 says 'Realms'. Slow push and a
fine particle drift; 15.75 the title wipes off on the slant.

### c04-team, 16.0-26.0: "Bring friends. Or join a team." / "Share what you see..."
INK (light) product world: crisp product UI on paper-white, like a modern collaboration app.
16.0-18.0 'BRING FRIENDS': an invite card ('Invite to your team'), three avatars pop into the team bar:
Jules (JK), Nora (NC), Emre (EK). 17.5-19.5 'OR JOIN A TEAM': a board of open teams scrolls fast (fictional
team names, open-slot counts like 2/3), one slot fills: '3/3 · READY'. 20.0-26.0 'Share what you see.
Decide how you'll work together.': a shared canvas with three live multiplayer cursors (name flags Jules,
Nora, Emre) dropping notes and sketching on it (short notes such as 'Scout north', 'Hold the bridge',
'Power first'); the notes snap into a plan with three columns (one per player) and three check marks
land: 'AGREED' (25.0). Snappy UI motion (spring, overshoot), cursor paths with intent.

### c05a-match, 26.0-30.0: "Two teams. The same starting conditions. One objective."
Charcoal. A dot-matrix globe (bone dots) turning; two team signals ping (amber, red-orange) on opposite
sides; 26.5 a matchmaking arc draws between them; 'MATCH FOUND' locks (27.0). 27.3-29.0 a challenge
card is dealt (flip): world thumbnail, 'STARTING CONDITIONS' with identical lines, 'OBJECTIVE'. 29.0 the
card duplicates: one copy slides left (amber edge), one right (red edge), syncing 'One objective' (29.0).
Last frame (29.967): the two cards at the edges, the centre opening.

### c05b-split, 30.0-36.0: "The same challenge. Another approach."
SPLIT SCREEN on the brand slant: the same world on both halves, the STORM CITY (isometric city at
night in a storm, comp/lib/worlds.js). 30.0 the seam opens from the centre. Both halves show identical
starting state; 31.4-33.75 (w08) each team draws a different plan on it (left amber: secure the power
plant first; right red-orange: rush the bridges), with labels 'ATLAS · PLAN' / 'VEGA · PLAN'. The camera
moves mirror each other. 35.5-36.0 the seam slams shut.

### c06-lobby, 36.0-40.0: "Meet the other side. Assign your roles."
A versus lobby like a fighting-game select screen, 3 v 3: Atlas roster left (Jules, Nora, Emre), Vega
right (three red-orange silhouettes, roles hidden). 36.2 'Meet the other side': the rosters slam in face
to face. 37.64 'Assign your roles': role chips fly into our players: COORDINATION, POWER SYSTEMS,
CROSSING. 39.0 'PLAN LOCKED' stamp; 39.75 everything collapses to a line for the drop.

### c07a-coordinate, 40.0-44.0: COORDINATE (THE DROP)
ICE STATION world (isometric low-poly research base on an ice shelf; snow; worlds.js). 40.0 drop hit.
Word 'Coordinate.' huge (40.3). The three players leave the base for three sites at once; three timers
run in sync and all three sites light on the same beat (42.0). Camera: crane down from above.

### c07b-commit, 44.0-48.0: COMMIT
DESERT CANYON world (top-down, dune flow-field and canyon hatching; worlds.js). The team route reaches a
fork with three options; 44.3 'Commit.': one route locks with a stamp, the others burn off; the convoy
of three markers accelerates down it. Camera: top-down slide following the route.

### c07c-adapt, 48.0-52.0: ADAPT
STORM CITY at night again (as in c05b), closer. The rival's move: 48.5 a red-orange wave blacks out a
district (lights die block by block). 48.3 'Adapt.': our amber route breaks and redraws around the dark
district; lights come back along our new route. Camera: isometric orbit.

### c08-futures, 52.0-56.0: "Your decisions, and their moves, change what happens next."
Abstract. A branching tree of futures grows out of one node (fine bone lines, fast, like lightning or
river deltas). Our decision (52.4 'decisions', amber) prunes half the tree; their move (53.3 'moves',
red-orange) prunes another part; the surviving branch glows and the camera flies along it as it keeps
splitting (54-56). Tiny world silhouettes at branch tips morph.

### c09-record, 56.0-60.0: "Every move, on the record."
A match replay timeline: thumbnails of moments (stylised mini-frames echoing earlier scenes: the city,
the canyon, the ice) on a long timeline with amber and red event markers; 56.0-57.0 the playhead rewinds
fast (scrub), stops; the event log types on beside it (timestamps like 08:31, short event lines);
57.3 'on the record' locks with a stamp.

### c10-holds, 60.0-64.0: "See whose strategy holds."
PAYOFF. 60.0 hit. The two plans as two ribbons of light (amber and red-orange) racing toward one
objective point through a dark space with speed lines; they reach it on 61.0; a ring burst; freeze.
'See whose strategy holds.' typeset large (holds on 61.26). 62-64 calm drift and a slow pull back; the
objective point becomes the amber seed point again at frame centre by 63.967.

### c11-cta, 64.0-74.0: CTA
The seed point from c10 at centre. Background: the catalogue of world tiles from c01 drifting very dim.
64.5 'Bring this challenge to your group.' ; 66.5 'Make your next move.' (two lines, second amber) ;
67.0 the Enemites mark + 'Realms' / 'Competitive' lockup; button 'Get match updates' with arrow, URL
'enemites.com/realms', 'IN DEVELOPMENT · PRIVATE BETA'. 68.2 w17: the button pulses. The point docks into
the button. 68.5-74 hold, everything settled by 69.0; 73-74 the frame stays (audio fades).
