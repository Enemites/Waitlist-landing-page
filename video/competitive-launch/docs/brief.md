# Creative brief: Realms Competitive launch film

## The product
Enemites Realms is a simulation environment built on Enemites' own AI world model. It imagines
worlds, situations and consequences that respond to your decisions ("Worlds imagined by AI.
Shaped by your decisions."). Realms has three entry paths: Casual ("Follow the unknown"),
Focused ("Pursue a field") and **Competitive ("Face another team")**. This film launches the
Competitive mode only. Status: in development / private beta; the call to action is the waitlist
("Get match updates", enemites.com/realms). Never claim it is already released or show prices.

## Competitive mode: the approved product copy (source: src/components/product/CompetitivePath.tsx,
CompetitiveLegends.tsx, RealmsScreens.tsx, IntroductionPage.tsx)
- Eyebrow: "Competitive / Team against team"
- Headline: "One world. Opposing plans."
- "Bring your team. Match against another. Read the same situation, coordinate your decisions, and see whose strategy holds."
- "Find your team. Then face another."
  1. Form your team: "Bring friends. Or join a team." Start with people you know, or find a team to join. Share observations and decide how you'll work together.
  2. Find your opposition: "The same challenge. Another approach." The planned matchmaking pairs two teams with shared starting conditions and an objective. Each team brings its own strategy.
  3. Make your move: "Coordinate. Commit. Adapt." Divide responsibilities and make the call together. Your decisions and the other team's moves change what happens next.
- "From the lobby. Into the match." Meet the other side. Assign your roles. Take one shared plan into the challenge.
- "Every great plan needed a team." / "Read the field. Take a role. Move before the other side does."
  - "One plan. Every rank behind it." (strategy) / "Many minds. One problem." (teamwork)
  - "Make the call your team can follow." (leadership) / "Every move, on the record." (accountability: the match and its review)
- Invitation: "Bring this challenge to your group." / "Make your next move." / "Get match updates"
- Footer line: "Worlds to explore. Decisions to make. Possibilities to discover."

## The example match (interface concept, design/screen-compositions/competitive.html)
"Floodgate", Team challenge, 3 v 3. Team **Atlas** (yours, amber) vs **Vega** (rival, red-orange).
Round 2, clock 08:14, score 1-1. Atlas roster: Jules (JK, Coordination, Moving), Nora (NC, Power
systems, Restoring), Emre (EK, Crossing, Holding). Team channel: Jules "Nora, take the pump station.
Emre, watch the crossing." / Nora "On it. Call if they commit to the route." / Emre "Two of them by
the crossing. Holding the approach." Pinned: "Plan agreed: Restore gate power first, 3 roles
assigned". Objective 2 of 3 "Restore gate power" 62%. Alert: "Vega is contesting the crossing".
Map: a river through topographic terrain, the Floodgate (objective ring), Pump station, the
contested Crossing, Vega seen as red triangles, one "LAST SEEN 0:20" ghost.
The match board (CompetitiveMatchBoard.tsx) is the same idea as a coach's playbook: grid A-L / 01-08,
river, "OBJ · THE CROSSING", "PUMP · GATE", "FORD", "TEAM A · YOUR PLAN", "TEAM B · THEIR PLAN",
amber numbered circles (us) vs bone-grey crosses (them), routes drawn as arrows.

## Visual identity of Competitive mode (live site, enemites.com/realms?entry=competitive)
- Ground: near-black warm charcoal #0b0c0e / #0d0d0e / #101012 / #121110; map panel #0f0d0a.
- Accent (us / Atlas): amber #efbd70 (hover/light #f6d39f, #f4cc8d; deep #a37a42, line #5a472f, #3a3127).
- Rival (Vega): red-orange #dd6248 (banner #c9503a); opposition marks also bone-grey #c9c0b2 / #a79e90.
- Ink: #f2eee7 / #eee5d7; muted text #b8afa2 / #a89f92 / #a89a85.
- Terrain lines: amber contour lines at low opacity (#efbd702b, index lines #efbd704f), topographic maps.
- Type: Manrope Variable (headlines, weight 500-650, tight tracking -0.055em, two-line headlines where
  the second line is amber), JetBrains Mono Variable (UPPERCASE eyebrows/labels, tracking .06-.13em).
  Brand wordmark "Realms" is huge Manrope. Logo: the slanted Enemites mark (public/assets/logo.png,
  black on transparent; invert for dark) + wordmark "Enemites".
- Graphic language: contour lines, coordinate grids, register/corner marks, dashed routes with arrows,
  pulse rings around objectives, two banners (amber with a diamond = you, red with a ring = rival).
- History illustrations (flat amber leader + dark bronze crowd, graphic-novel ink):
  public/assets/realms/competitive-history-strategy.svg (commander, raised fist, officers),
  competitive-history-teamwork.svg (1945 desert tower, man in pale hat), competitive-symbol-leadership.svg
  (commander pours water from his helmet; cut-out), competitive-symbol-accountability.svg (witness table,
  gallery; cut-out).
- Photo: public/assets/realms/competitive-strategy-table-1536.webp (a dark architectural relief of a
  dam/floodgate on a strategy table with two sets of team tokens).
- UI screenshot: public/assets/realms/screens/competitive-main-2000.webp (the Floodgate match screen).
- Entry map: public/assets/realms/entry-map.svg (topographic contour map; Competitive route ends at a
  contested summit flag, two routes meet there).
- Do NOT use: the chartreuse Focused palette (#c4ed6c) except as a tiny nod, the old white/blue UI
  recordings in public/assets/scene/*.mp4 (reference only), lavender Casual palette.

## Film spec
- 1920x1080, 30 fps, ~60-75 s, H.264 + AAC stereo, loudness about -14 LUFS integrated.
- English on-screen type and voice-over (the site is English).
- Feel: a premium motion-graphics launch film, tactical and tense but intelligent and calm in its
  design (think a match briefing that comes alive), not a loud generic esports hype reel.
