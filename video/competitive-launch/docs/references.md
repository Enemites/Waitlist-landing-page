# References and technique bible: Realms Competitive launch film

North star: **a match briefing that comes alive.** The map is the stage. Type, routes and rings are the
actors. The tension comes from a clock, not from loudness. Everything here is buildable in
HTML/SVG/canvas with GSAP 3.13. All the plugins we need are free and already in `node_modules/gsap`:
SplitText, ScrambleText, DrawSVG, MorphSVG, MotionPath, CustomEase, Flip. Source: https://gsap.com/blog/3-13/

---

## 1. Reference board

### A. Game-mode reveals and briefings

| Reference | What to borrow |
|---|---|
| **We Are Royale: VALORANT "Yoru" agent reveal.** Case study: https://weareroyale.com/case-studies/riot-games-valorant-agent-14-reveal-trailer-yoru/. Maxon interview: https://www.maxon.net/en/article/up-your-game | One **overlay system** (glyphs, icons, framing marks) runs over both the CG shots and the gameplay shots, so the two read as one film. For us, the mono labels, register marks and coordinates are that system and appear in every shot. They also used **pixelated hard cuts**; we use a calmer grid-cell version (T5). |
| **We Are Royale: VALORANT Premier** (Riot's team-vs-team competitive mode). https://weareroyale.com/case-studies/valorant-premier/ | The brand **grid and the angle of the logotype** are made "malleable" and used as framing devices and lower thirds. Our A–L/01–08 board grid and the slant of the Enemites mark should do that job too. |
| **Capacity: Call of Duty Black Ops Cold War MP reveal.** https://capacity.gg/project/cod-coldwar-mp-reveal/ | A **library** of segment title cards, map transitions, map interstitials and lower thirds, each with its own contextual layout. Use one system for "01 FORM YOUR TEAM / 02 FIND YOUR OPPOSITION / 03 MAKE YOUR MOVE". |
| **Territory Studio: Black Ops 6 titles.** https://territorystudio.com/project/call-of-duty-bo6/ | "Maps expand in volume as the camera moves through the landscape, dossier content restructures around key information, photos morph into overlay information." This is the model for T10 (UI lift). Their mix of archive footage, ink and tape gives us permission to use archive, kept strictly on-palette. |
| **Battlefield 2042 media-day explainer, built as a mission briefing.** https://www.stevenswanboroughdesign.com/bf2042-media-day-explainer | The whole piece is framed as a briefing that explains modes and map scale, and "clarity and pacing were key". That is our framing device. |
| **Top Gun: Maverick tactical screens (Jayse Hansen).** https://blog.adobe.com/en/publish/2022/09/22/revamped-nostalgia-joseph-kosinskis-top-gun-maverick | Three coloured routes at once "proved to be too distracting". The final shows **one route at a time**. A **Time On Target countdown** makes success or failure readable at a glance. The look is lo-fi flat 2D with no holograms, as the director asked. Rule for us: one active route, a visible clock, flat graphics. |
| **Valve: Counter-Strike 2 reveal set** (Responsive Smokes / Sub-tick / Maps, Mar 2023). https://insider-gaming.com/counter-strike-2-revealed-by-valve/ | **One idea per segment**, shown by demonstration rather than hype. This supports our three-step structure. |
| **Apex Legends Arenas (3v3) gameplay trailer**, Apr 2021. https://wccftech.com/apex-legends-legacy-gameplay-trailer-arenas-mode-3v3-details/ | A 3v3 round-based mode sold through its **round structure**. Borrow the round/score/clock counters as story beats (ROUND 2 · 08:14 · 1–1). |

### B. Premium launch craft (type, UI, studio polish)

| Reference | What to borrow |
|---|---|
| **Figma Config 2025 opening film** (Relay with Figma Brand Studio). https://www.figma.com/blog/how-we-shaped-the-visual-identity-for-config-2025/ | Two type speeds: **expressive** (slower, more personality) and **functional** (fast and plain). The film was stepped from **60 to 15 fps** to feel "tactile and handmade". One glyph shifting "triggers a ripple that transforms an entire composition". Warning from the team: "without intention, the glyphs ... feel decorative". |
| **ManvsMachine: Canva/Affinity hype film.** https://www.stashmedia.tv/?p=119582 | 3D, 2D, kinetic type, hand-drawn work and product demo combined into one **continuous journey**. The UI is one layer among the drawn and typographic layers, not a screen recording dropped in. |
| **Ordinary Folk: "Join the Movement"** (for School of Motion). https://motionographer.com/2019/09/16/join-the-movement/ | **Faux-3D versus real 3D** craft. Flat layers with parallax and shadow, which is exactly what we can do in the DOM. |
| **Vercel Ship identity** (Rauno Freiberg's write-up). https://rauno.me/craft/vercel | A **frame metaphor**, Swiss grids, massive type on black, mono metadata. Draw the grid lines as structure, then let the content snap into them. |
| **Apple event opening films** (e.g. March 2019, One Show). https://www.oneclub.org/awards/theoneshow/-award/37539/opening-film-apple-event-march-2019-launching-apple-tv/. Also Mat Voyce's "Think Different" kinetic study: https://www.abduzeedo.com/mat-voyces-think-different-kinetic-typography-mass | Type with **mass**: it settles with inertia (a long expo tail) instead of the default CSS ease. Huge type, generous negative space, one statement per card. |
| **Saul Bass: North by Northwest titles.** https://artofthetitle.com/title/north-by-northwest | Lines in perspective **build a grid that corrals the title blocks**, then the grid becomes a building facade. That is a match cut from graphic to photo. Ours goes grid → match board → strategy-table photo. |
| **Elastic: Game of Thrones main titles.** https://www.artofthetitle.com/title/game-of-thrones | **One continuous map** that builds itself as the camera arrives at each location, with only a few locations per sequence. Floodgate, Pump station and Crossing should rise out of the terrain as we reach them. |
| **Antfood: CBS sonic branding.** https://magazine.shots.net/news/view/antfood-produces-new-sonic-branding-for-cbs | A **5-note mnemonic** built to be re-orchestrated. We want a 3-note amber motif: it is the tick ostinato's interval, resolved on the logo. |

### C. Maps, tactics, data

| Reference | What to borrow |
|---|---|
| **Johnny Harris / Vox maps** (After Effects + GEOlayers). https://rosetta.to/u/johnnyharris/how-i-make-my-maps | **Mask reveals with a scale change to fake a zoom**, plus paper-like texture. Zoom by scaling the SVG, never by swapping images. |
| **Tifo Football (The Athletic) tactical explainers.** https://rosetta.to/u/tifo/topic/soccer-football/2017 | Minimal animation: the pitch splits into a **grid of zones** that light up, plus telestrator arrows. Use this for "Divide responsibilities": zones light up per role. |
| **F1 broadcast data graphics** (AWS insights such as battle forecast and strategy prediction). https://www.motorsportmagazine.com/articles/single-seaters/f1/formula-1s-tv-graphic-balancing-act | A **two-team forecast bar** and predicted-strategy overlays. Restraint: the graphic supports the race and never covers it. |
| **Generative contour fields** (Framer TerrainLines / Topo Flow). https://www.framer.com/marketplace/components/terrainlines/ | Contours computed from a noise field, then **animated by moving the field**: marching squares, or blur plus threshold. This is the living-terrain backplate and the engine behind T3. |

### D. Sound and editing

| Reference | What to borrow |
|---|---|
| **Dunkirk** (Zimmer/Nolan): Nolan's own pocket watch recorded as the pulse, a Shepard tone for endless rise, effects locked to the music's tempo. https://www.cbc.ca/radio/q/blog/hans-zimmer-explains-the-audio-trickery-that-made-dunkirk-audiences-nauseous-1.4311684 · https://en.wikipedia.org/wiki/Dunkirk_(soundtrack) | The **tick is the tempo** and sets the BPM. A Shepard-style riser through Act 2. UI ticks and whooshes are quantised to the grid. |
| **Interstellar, "Mountains"**: about 1 tick every 1.25 s, widely read as one tick per Earth day. https://www.buzzfeed.com/christopherhudspeth/this-interstellar-easter-egg-is-shocking | The tick can **mean** something. Our ticks are the match clock (08:14 counting down). |
| **BRAAAM** (Inception trailer, contested origin with Zarin and Zimmer). https://en.wikipedia.org/wiki/BRAAAM | A cliché. Use **one** filtered, short low hit at most, on the title reveal, and never a stack of them. |
| **Derek Lieu, "More trailer editing is not better trailer editing."** https://derek-lieu-yrd2.squarespace.com/blog/2023/4/23/more-trailer-editing-is-not-better-trailer-editing | Average shot lengths: Baba Is You 4.25 s, Papers, Please 2.6 s, MWII 1.3 s, Fast X 0.82 s. **Hold wherever the viewer must understand the mechanic.** His wider advice: lows only read as low if there is a high. |
| **Trailer sound-design practice.** https://violetrecording.com/sound-design-for-trailers/ | The riser **peaks exactly on the hit**. Near-silence before an impact makes it feel louder. A hit followed by total silence lets the audience fill the gap. |
| **Reading-speed norms.** Netflix: 20 chars/s, 0.83 s minimum. Biteable: 2–3 words per second. https://biteable.com/blog/video-word-count/ | The basis for the type-timing formula in 3.3. |

Archive sources (reachable): archive.org Prelinger, e.g. *The River* (1937) `RiverThe1937` (rivers, floods, levees, which fits Floodgate), *Destruction of a Dam* `destruction_of_a_dam`, *Teamwork* (1960) `6124_Teamwork_01_00_43_20`.

---

## 2. Pacing

**Tempo: 120 BPM.** At 30 fps one beat is **15 frames** and one 4/4 bar is **60 frames = 2.0 s**, so
timecode in seconds = bar × 2. If the composer wants more drive, the alternative is 128.57 BPM (14 frames
per beat, eighth notes exactly 7 frames). Do not use 124/128 BPM: their beats fall between frames.

| Section | Bars (≈ time) | Shot length | Cuts | What moves |
|---|---|---|---|---|
| Cold open | 1–3 (0–6 s) | one 6 s shot | 0 | Contours draw on the downbeats. Ticks only. Mono label scrambles in. |
| Act 1: "One world. Opposing plans." | 4–9 (6–18 s) | 4–8 s (2–4 bars) | 1 per 2–4 bars | Slow push on the map. Banners meet. Headline. Sub pulse enters. |
| Act 2: three steps | 10–21 (18–42 s) | 2 s (1 bar) | 1 per bar | Accents on beats 1 and 3. Each step = 4 bars: card → UI → map → payoff. Riser across bars 18–21. |
| **Breath** | 22 (42–44 s) | 1 shot | 0 | "LAST SEEN 0:20" ghost. **Music drops out for the last 2 beats** (0.5–1 s of near-silence). |
| Act 3: match montage plus 4 pillars | 23–28 (44–56 s) | 0.5–1 s | every 1–2 beats, at most 8 fast cuts in a row, then a 1-bar hold | Hits on cuts. Pillar cards 1 bar each. |
| Button / CTA | 29–34 (56–68 s) | 6–10 s | 0 | Wordmark. "Make your next move." CTA holds **at least 4 s**. Sonic logo, then tail. |

Rules:
- A **cut lands on the beat's first frame**. Motion peaks (the end of a stroke, a stamp's impact) land on the beat frame or 1 frame after, never before. A whoosh starts 10–14 frames before the cut and peaks on it.
- Something must change **every beat** even inside a long hold: a label, a tick, a ring pulse. A shot without a cut is not a still frame.
- Breathe three times: after the headline (bar 9), at the drop (bar 22), and before the CTA (bar 29). Breathing means holding, not going to black.
- Use **one active route** on screen at a time (the Top Gun rule). The rival's route is drawn only after ours has finished.

---

## 3. Technique bible

### 3.1 House motion vocabulary
- Eases: **enter** `expo.out` 16–24 f (type with mass) · **exit** `power2.in` 8–10 f, or simply cut · **camera** `power3.inOut` · **whip** `expo.inOut` 6–8 f · **HUD** `steps(n)` or no ease. No elastic and no bounce. Overshoot of 1–2 % is allowed only on stamps and markers, never on type.
- Strokes at 1080p: contours 1–1.25 px at about 17 % amber (`#efbd702b`); index contours 2 px at about 31 % (`#efbd704f`); routes 3 px with a 10/8 dash; objective ring 2 px plus a pulse ring that scales 1→2.2 and fades 0.6→0 over 45 f (3 beats); grid 1 px at 8–12 %.
- Hand-drawn layers (telestrator, ink) run **on twos (15 fps)**, as the Config team did. Quantise their time with `Math.floor(f/2)*2`. Everything else runs at 30 fps.
- Determinism: drive one paused master timeline with `tl.seek(frame/30)`. Seed `Math.random` per frame (mulberry32 with the frame index) before ScrambleText or noise runs. Wait for `document.fonts.ready`. Do not use CSS transitions or rAF loops.

### 3.2 Transition recipes (15)
1. **Route mask wipe.** The next shot sits under an SVG `<mask>` whose content is the team route path. DrawSVG draws the route (0→100 %, 20 f) while its `stroke-width` grows from 3 to 2400 px (`power3.in`), so the route "becomes" the frame. Sound: a pencil scratch that rises into a whoosh.
2. **Contour → objective ring match cut.** Push in on the summit's concentric contours in `entry-map.svg` and isolate the innermost ring. MorphSVG turns it into a perfect circle at the exact screen position of the Floodgate objective ring in the next shot, then cut. The pulse ring fires on the cut frame. Sound: a soft sonar ping.
3. **Topographic threshold dissolve (signature, "rising water").** On canvas, take a static value-noise field N(x,y) (a blurred random grid). For threshold t from 0→1: pixels where N < t show shot B and the rest show shot A. Draw a 1.5 px amber iso-line at N≈t. Over 30–45 f, shot B floods in along contour lines. Use it for chapter changes.
4. **Grid-snap reveal.** Draw the A–L × 01–08 board lines (DrawSVG, 12 f, staggered). Then 96 cells clip-reveal the content with `stagger:{grid:[8,12], from:objIndex, each:0.012}` (from = the objective cell index, or `[x,y]` 0–1 ratios). The coordinate labels scramble on.
5. **Grid-cell hard cut.** A restrained version of WAR's pixel cuts. For 2 frames, a checkerboard of board cells shows the next shot, then a full cut. Use it only in Act 3, 2–3 times at most.
6. **Whip pan with directional blur.** Translate both shots 1920 px over 6–8 f (`expo.inOut`) and cut on the frame of maximum velocity. Blur with SVG `feGaussianBlur stdDeviation="v*0.35 0"` (horizontal only, where v = px per frame). Alternatively, use 5 ghost copies offset by v·k/5 at falling opacity. Sound: a whoosh peaking on the cut.
7. **Iris to map.** From the objective ring, `clip-path: circle(r at x y)` grows from 40 px to the screen diagonal (24 f, `power4.inOut`). The 2 px ring rides the edge of the clip and fades out at the end.
8. **Register-mark reframe.** The four corner marks of the current frame slide (`power3.inOut`, 18 f) to frame a sub-region, such as one UI panel. That region scales up to fill the frame and the marks become the new frame. The camera move is motivated by the marks.
9. **Versus banner split.** The amber banner (diamond) wipes in from the left and the red-orange banner (ring) from the right. They meet on a diagonal at the slant angle of the Enemites mark, a hairline splits the frame, and "ATLAS · VEGA" scrambles in. Hold 1 bar. Use it for "Find your opposition".
10. **UI lift (2.5D).** Cut panels out of `competitive-main-2000.webp` (roster, channel, objective, map) as separate layers with `perspective:1600px`. The key panel moves 60–120 px forward in Z with a soft shadow while the rest dims to 30 % and blurs 4 px. This is Territory's "restructure around key information".
11. **Telestrator draw-on (on twos).** Arrows draw with DrawSVG on a slightly wobbled path and the arrowhead pops on the last frame. Circles around players overdraw to 110 %. Bone-grey crosses stamp in with a 2 f overshoot. Sound: a dry marker squeak, then a wooden tap on the stamp.
12. **Scramble HUD labels.** ScrambleText with characters `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/`, revealing at about 2 f per character, uppercase JetBrains Mono, tracking .12em. Every label in the film enters this way, which is the overlay system. Sound: a quiet relay-click burst.
13. **Split-flap / odometer counters.** Digits sit in vertical reels and step with `steps(1)` per digit plus a 3 f settle. Use them for 08:14→08:13, score 0–0→1–1, 62 %, "3 v 3". The 4-frame flap blur is a pre-rendered intermediate glyph. Sound: one flap click per step.
14. **Typographic match cut.** The counter of the "O" in "One world" (or the dot in "·") holds position and scale while the type cuts away and becomes the objective ring or a team marker in the next shot. One element survives the cut and the eye follows it.
15. **Floodgate water-level wipe.** A horizontal "waterline" with a low-amplitude sine wobble (2 px, 0.5 Hz) rises from the bottom over 1 bar, with shot B below it. Pair it with "Restore gate power 62 %" filling to 100 % for a literal payoff.

Supporting move: **photo-to-board lock.** Align the team tokens in `competitive-strategy-table-1536.webp` with the amber circles and bone crosses of the match board. Crossfade over 12 f while both share one transform, then grade from photo to flat.

### 3.3 Kinetic type rules
- **Size at 1080p.** Headlines are Manrope at 600–650 weight, 120–170 px, tracking −0.055em, leading 0.95. Statement cards hold at most 2 lines and 7 words. Eyebrows are JetBrains Mono 22–26 px, uppercase, tracking .10–.13em, muted `#b8afa2`. Nothing goes below 20 px. Margins are 120 px on a 12-column grid, left-aligned.
- **The amber second line.** Line 1 is ink `#f2eee7` and line 2 is amber `#efbd70`. Line 2 enters **one beat (15 f) after** line 1 and holds one beat longer when lines exit. The amber line carries the turn ("Opposing plans.", "Then face another.").
- **Reveal.** Each line sits in an `overflow:hidden` mask and moves `yPercent:110→0`, 18–22 f, `expo.out`, with 3–4 f stagger per word (SplitText words). There is no fade-in on headline type, only the mask. A subtle variable-weight settle (560→620 over 24 f) adds mass. Exits are a 9 f `power2.in` upward or a cut on the beat.
- **Time on screen** after the reveal finishes: **hold ≥ 0.9 s + 0.3 s × words**, rounded up to whole beats. Examples: "One world. Opposing plans." (4 words) needs ≥ 2.1 s, so 5 beats. A 1–2 word card needs at least 1 s (2 beats). Anything over 7 words goes to VO, and the screen shows only the key phrase.
- **VO relation.** On-screen type never transcribes the VO except for the headline. The type lands on the VO's stressed syllable.
- **One idea per card.** Labels (mono) may coexist with a headline. Two headlines never share the screen.
- The **expressive** speed (as above) is for headlines. The **functional** speed (10–12 f, `power3.out`, no stagger) is for UI and HUD text.

### 3.4 Archival b-roll treatment
- **Never full-colour, and never full-bleed for more than 1 s.** Archive is a metaphor (a river, a dam gate, hands on a plan table, a crew pulling together). It is not literal combat.
- **Grade as a gradient map.** Convert to grey, add contrast (+15 %), then apply a 1D LUT running `#0b0c0e` (shadows) → `#3a3127` → `#a37a42` (mids) → `#efbd70` → `#f6d39f` (highlights cap; no pure white). ffmpeg: `format=gray,format=rgb24,lut1d=file=amber.cube`. Generate the .cube with Python and numpy. Lift the blacks to `#0b0c0e`.
- **Texture.** Add `noise=alls=10:allf=t` grain, a slight vignette, and gate weave of ±1 px. Keep the native 18–24 fps cadence by duplicating frames and **do not interpolate**: the judder reads as archive.
- **Halftone variant** for stills and portraits: a 45° dot screen with 6–8 px cells, amber dots on charcoal (Pillow).
- **Frame it.** Scale to 60–80 % of frame inside register marks, with a mono caption (`ARCHIVE · 1937 · REF 02`) and coordinate ticks on the edge. Add a slow 2–4 % push over the shot. The frame can sit as a panel on the map (Territory's archive-in-structure approach).
- **Budget:** at most 15–20 % of runtime. Cut archive on beats like any other shot.

### 3.5 Sound-design cue list (template)

| # | In (frame / bar.beat) | Out | Picture event | Music layer | SFX | VO | Level / notes |
|---|---|---|---|---|---|---|---|
| 01 | 0 / 1.1 | 180 / 4.1 | contours draw, label scramble | pocket-watch tick (8ths), room tone | relay clicks on labels | none | music starts at −30 dB and builds; nothing below 40 Hz |
| 02 | 180 / 4.1 | 540 / 10.1 | banners meet, headline | + sub pulse on 1 and 3, low string drone | soft whoosh into the banner meet, ping on the objective ring | "One world…" | duck music 6 dB under VO |
| 03 | 540 / 10.1 | 1260 / 22.1 | three steps (card, UI, map, payoff) | + ostinato rhythm; Shepard riser bars 18–21 | marker squeaks, flap clicks, whooshes on cuts | step lines | riser peaks on 22.1 |
| 04 | 1260 / 22.1 | 1320 / 23.1 | LAST SEEN ghost | **music drops out from 22.3** | one tick, room tone only | none | 0.5–1 s of near-silence |
| 05 | 1320 / 23.1 | 1680 / 29.1 | match montage, 4 pillars | full ostinato + the one filtered low hit on 23.1 | hits on cuts (wood/metal board impacts), sub drops | pillar lines | peaks at −1 dBTP |
| 06 | 1680 / 29.1 | 2040 / 35.1 | wordmark, CTA | resolve: 3-note amber motif (sonic logo) | tail reverb, final tick stops | "Make your next move." | total silence for the last 12 f |

Delivery: −14 LUFS integrated, −1 dBTP. VO sits 6–8 dB over the music bed. Every SFX is quantised to the 120 BPM grid unless it is synced to a visual event.

### 3.6 Don'ts
Avoid: generic esports glitch, chromatic aberration or lens flares; colours outside amber, red-orange, bone and charcoal (chartreuse only as a nod); more than one moving route; type smaller than 20 px; bouncy eases; stacked braams; full-colour stock; claiming the mode is released (the status is private beta and the CTA is "Get match updates").
