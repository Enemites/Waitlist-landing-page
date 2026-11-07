# Enemites visual redesign

The company and product have distinct visual languages. Home and About retain ivory, white and terracotta, with alternating editorial project rows, wide team portraits and a scroll-progress company history. Arena, How It Works, legal pages, questionnaires and existing unavailable states use charcoal, luminous chartreuse and restrained technical details. The original logo is retained.

Arena opens inside a fractured simulation world with pointer parallax and a connected decision field. Benefit stories form an open exhibition of kinetic sculptures. The original three product recordings share one scroll-controlled stage with active phase buttons and a progress line; only the active recording plays. Short viewports use a regular section with direct phase selection. Proof connects decisions to evidence through animated paths. Registration is a separate two-column section with its own artwork. How It Works now presents a sequential decision/consequence/mentor visualization, a four-step learning rail and a before/during/after story.

Reduced-motion preferences stop decorative movement and automatic recordings while keeping phase selection available. Touch devices use static hero artwork instead of continuously rendering the decision canvas. The duplicated desktop/mobile steps in How It Works were consolidated into a single responsive rendering of the same content.

All original text, routes, link destinations, media URLs, form fields, validation rules, API endpoints, and request payloads are preserved. The social link edits present before the redesign are preserved too. No dependency or framework migration was needed.

## Generated artwork

### Benefit-section revision and bespoke waitlist artwork

The three benefits now form an open exhibition of procedural kinetic sculptures instead of illustrated cards. A stack unfolds into a checkpoint path with a hopping traveler; scattered glass blades align into an optical iris; independent traces assemble into a layered evidence record. Each formation follows its section's scroll position and supports subtle pointer rotation. Canvas rendering is capped at 30 fps, pauses outside the viewport and when the page is hidden, and renders a fixed completed formation under reduced-motion preferences. The renderer is loaded as a separate module. The original headings and descriptions remain unchanged.

Registration uses its own invitation sculpture: a smoked-glass threshold and shallow approach steps. It replaces the reused world image and is visible on mobile too.

- Asset: `public/assets/waitlist-threshold.webp` (1536 × 1024, 53,318 bytes).
- Tool: built-in Imagegen, converted to WebP without changing the composition.
- Final prompt:

> Use case: stylized-concept. Asset type: bespoke website waitlist registration artwork, landscape 3:2. Create a quiet, high-end architectural invitation: a single tall, narrow open rectangular doorway made of thick smoked optical glass and matte graphite metal, slightly ajar inner translucent pane, with three offset shallow dark stone stepping platforms leading from the foreground through the aperture. Camera three-quarter front view, sculpture occupies the central 65 percent, generous empty dark space around it. At the threshold, a very thin chartreuse #c4ed6c light line catches selected glass edges and reflects softly on the steps. Beyond the doorway is a soft pale-green diffuse glow suggesting an unexplored place, restrained and welcoming. Background and ground seamless very dark green charcoal #0b1315, studio-like lighting, believable material microtexture, calm and minimal contemporary architectural photography / premium 3D still life. This artwork sits below 'Ready to join?' beside a form: intimate, simple, invitation and access, not a large hero or a planet. Strong clear silhouette at small sizes. No globe, no world sphere, no floating city, no terrain islands, no gaming environment panorama, no computer UI, no letters, no text, no logos, no people, no circuit patterns, no excessive neon bloom, no orange, no purple, no blue. Make this an elegant purpose-built entry sculpture with lots of dark breathing room.

Revision verification compares content and destinations with `.cache/redesign/before-values-revision.json`, captured from the current website before these changes, including the research-domain edits already present. The updated `/arena` composition was checked at 360, 390, 768, 1440 and 1920 pixels. Formation captures show the three sculptures before and after scroll assembly. Existing navigation, video navigation, waitlist validation/submission/reset and questionnaire controls were checked with intercepted APIs; no actual registrations were written.

Product artwork:

- Asset: `public/assets/arena-world.webp` (1672 × 941, 197,108 bytes).
- Tool: built-in Imagegen; converted to WebP for delivery.
- Prompt:

> Create a premium cinematic brand artwork for a living world simulation and decision-making learning product. Ultra-wide 16:9 composition, black-green charcoal void background #080e10, no text anywhere. One large floating fractured spherical world made of intricate obsidian crystalline islands, sculpted faceted terrain and delicate translucent dark glass architectural structures. A handful of vivid chartreuse lime #c4ed6c luminous pathways connect separated terrain fragments, suggesting choices and consequences. The globe is broken open like a living planetary atlas, not an intact ordinary Earth, no blue continents. Dramatic sculptural depth, highly detailed dark materials, luminous lime edge lighting only in selected areas, realistic film lighting and shadows, cinematic Octane-quality 3D art. Globe occupies right 65 percent of composition, left 35 percent almost black clean negative space for UI overlay. Camera looks at globe from three-quarter perspective. Small floating glass terrain satellites at edges, extremely restrained subtle particles, sharp aesthetic of a cutting-edge simulation laboratory and immersive strategy world. Quiet powerful mysterious intelligent. No typography, no UI, no computer screenshot, no logos, no people, no robots, no chrome torus, no ceramic arches, no cream or orange, no purple or blue, no exaggerated bloom or saturated neon fog.

Company artwork:

- Asset: `public/assets/learning-sculpture.webp` (1536 × 1024, approximately 128 KB).
- Tool: built-in Imagegen. The generated PNG was saved as WebP for delivery.
- Prompt:

> Generate one premium art-directed website brand hero image, landscape 3:2. A physical sculptural architectural model representing a living simulation and learning pathways: three enormous interlocking offset circular arches / concentric open labyrinth loops made of chalk ivory plaster and warm terracotta ceramic, with one small matte dark charcoal sphere suspended inside. The object sits on a warm off-white seamless studio background #f3efe7. Sophisticated contemporary architecture editorial photography, real physical material microtexture, beautifully restrained brutalist forms, broad diffuse natural light from upper left, soft long grounded shadows toward lower right. Strong intentional asymmetric composition, sculpture predominantly center-right, ample clean breathing room at edges, three-quarter isometric camera viewpoint with depth. Muted russet clay accent #b9573a, limestone ivory #eee8dc and charcoal #222823. Minimal, intelligent, tactile, calm, high-end brand identity for a research laboratory. Object fills about 75 percent of image. No text, no labels, no typography, no logos, no UI, no people, no gradients in the background, no metallic chrome, no neon, no black background.

## Realms redesign: terrain and contours (2026-11)

One idea now runs through `/realms`: worlds are terrain, decisions reshape terrain, and contour lines are how terrain is drawn. All original copy, links, media, form behavior and the approved Casual/Competitive artwork are unchanged.

- Hero: generated contour lines spill out from the globe into the empty left side on load, and a single light pass crosses the "Realms" wordmark.
- What is Enemites Realms?: now sits beside `RealmTerrain`, an interactive isometric realm (canvas). Clicking, tapping or pressing Enter makes a choice: a consequence wave crosses the land, terrain rises and falls around it, and the route between earlier choices stays lit. When idle and on screen it makes its own small choices every few seconds. It pauses off screen and when the tab is hidden, and renders a still frame under reduced motion.
- AI Transcendent: the generic checkmark network is replaced by `DecisionTree`, a three-level tree that traces one route at a time; hovering an outcome traces its route.
- Real Proof Of Capability: the off-palette illustration is replaced by `CapabilitySeal`, a deterministic seal whose rings are runs of decisions, with solved problems lit. It draws in once and tilts with the pointer.
- Market band, proof panels and the terrain carry the same contour texture at low opacity.
- Video consent state shows the intro poster instead of a black box.
- Endmark: the logo is a window onto drifting contour relief with a slow light sweep.

Generated assets: `public/assets/realms/contours-field.svg` and `contours-relief.svg`, produced by `node scripts/generate-realms-contours.mjs` (seeded noise, marching squares, smoothed). Styles live in `src/realms-redesign.css`, loaded after the other Realms stylesheets.

## Local review

Run `npm run dev` and open `http://localhost:5173/profile` or `http://localhost:5173/arena`.

Production build passes. Browser checks cover six content pages at 360, 390, 768 and 1440 pixels, original copy and links on nine routes, mobile navigation, root redirect, introduction-video navigation, waitlist validation/submission/reset and dynamic questionnaire controls. Additional checks verify pointer parallax, three scroll-selected phases, active-only video playback and reduced-motion behavior. No page errors, broken images or horizontal document overflow were detected.

Captures and reports are stored locally under `output/playwright/` and excluded from Git. Form checks intercept requests and do not write real registrations or responses.

## Competitive: strategy and teamwork from history (2026-11)

The Competitive path has a section between the match screens and the invitation: "Every great plan needed a team." It is about strategy, teamwork and competition; the two figures are never named. Their identity is carried by the illustrations alone, drawn from public-domain references:

- Strategy (`public/assets/realms/competitive-history-strategy.svg`): André Castaigne, "Alexander addresses his officers before the battle of Issus" (1898–1899). The commander in the crested helmet raises his fist in amber; the armoured officers stand behind him in dark bronze.
- Teamwork (`public/assets/realms/competitive-history-teamwork.svg`): the U.S. government photograph at the Trinity site, September 1945. The man in the pale hat is the only figure in amber; the group around him stays in dark bronze.

Layout: no frames. The scenes are not presented as pictures in boxes; each one dissolves into the page through an inscribed elliptical mask, with a softer spotlight centred on its leader so the group recedes into the dark. The two scenes zigzag (Strategy left with its caption to the right, Teamwork right and pulled up under it with its caption to the left) and bleed slightly past the container. Below 900px they run full bleed and the caption overlaps the faded lower edge. The Strategy canvas is padded with blank paper on the left so the raised fist stays inside the lit area.

Symbols (03 Leadership, 04 Accountability) follow the two scenes and use the same abstraction, but are shown differently: as cut-outs, like the object beside the profile headline, with no frame, no mask and no vignette. Mask R-CNN (torchvision, COCO weights) separates every person and object in the reference; figures that the reference's left, right or top edge cuts through are dropped, so the outline is made of whole figures; what remains is drawn on a transparent ground. The leader is the figure containing a given point (plus the helmet in Leadership) and takes the amber palette. In these cut-outs ink keeps only lines (large dark areas such as a suit keep their tones), and Leadership adds the poured water as a single pale layer found by its low saturation inside the stream's fall. Leadership (a commander before his soldiers) and Review (one man at a witness table before a full gallery) each get their own row, like the profile headline: copy on one side, the figure standing free on the other, alternating sides; below 900px the figure sits above its copy. Their copy is about the product, the match and its review, not about the scenes. Their references (a painting and a film still supplied by the site owner) are not in the repository: place them in `.cache/competitive-history/` as `leadership-reference.jpg` and `accountability-reference.webp` and run `python3 scripts/abstract-competitive-history.py leadership accountability` (the first run also needs CPU `torch` and `torchvision`). About 17 KB and 29 KB gzipped.

Method: flat fills + ink lines, like a printed graphic-novel panel. L0 gradient minimisation flattens each reference into a few large, evenly toned regions with crisp edges (five tones, median-merged so no slivers remain); XDoG draws clean contour lines and drops specks; the leader alone takes the amber palette (with its own tonal range), everyone else dark bronze; every tone and the ink are traced with potrace into compact relative SVG paths. Regenerate with `python3 scripts/abstract-competitive-history.py` (needs `pip install potracer opencv-contrib-python-headless numpy`; references download to `.cache/competitive-history/`). The SVGs are about 61 KB and 46 KB gzipped and load lazily with descriptive alt text.

## Casual and Competitive openings redrawn (2026-11)

The pale green isometric dioramas at the top of the Casual and Competitive paths clashed with their panel themes. Both are replaced by inline SVG scenes drawn in each path's own palette. Copy, links and layout are unchanged.

- Competitive (`CompetitiveMatchBoard`): a match briefing drawn as a playbook on one topographic map. A river crosses the board with a single contested crossing at its center (split amber/grey ring). Your team (amber, numbered) plans a route to the crossing and one to the pump gate; the opposition (grey crosses) comes from the far bank and flanks to the ford. Routes draw in on entry, runners travel along them, the river flows and a faint sweep crosses the board. The legend marks match the board (dot, dashed ring, cross).
- Casual (`CasualSignalScene`, since replaced; see below): a nocturne. The archive stands in silhouette against a low lavender moon; its relay sends rings over the water, a moon path shimmers on the sea and the tide laps at the base. Three markers, the relay, the crossing and the lower channel, light up in turn as the first moves the story below explores. The tide overlay that sat behind the old drawing is removed because the scene now draws its own sea.

Both are deterministic (seeded geometry) so prerender and hydration match. All motion is CSS and only runs under `prefers-reduced-motion: no-preference`; otherwise the finished drawing is shown. On phones the board coordinates are hidden and labels are enlarged.

## Casual as a playground (2026-11)

Casual is a place to explore, play and make worlds, with friends. It follows the short-video pages it takes cues from: the interface stays white, black and grey, and colour belongs to the content. Play comes from motion, type and things to do, not from extra colour or decoration.

- Interface: a neutral ground (#0b0b0f), white type, white pill buttons that lift and squash, white decision labels, white HUD, white toasts. Display type is Bricolage Grotesque (800, optical size 96), bundled locally. No stickers, glows or decorative sparkles.
- Content in many moods. Calm worlds stay (the Tidal Archive, the Glass Orchard, the Salt Observatory, the Last Lift, the Lantern Delta) beside livelier ones in `CasualWorldScenes`: Kite Hill (friends flying kites), Rooftop Relay (a chase), Snowball Siege (two teams), Midnight Funfair (spooky fun) and The Deep (a dive under a passing whale). People are pictograms posed by their joints (`casualArt.tsx`).
- Entry: choosing Casual opens the panel as a circle spreading from the selector.
- Portal (`CasualPortal`): "Pick a world. Jump in." beside a feed of five worlds in different moods. Reels lean toward the pointer; hovering one lifts it and dims the rest; clicking one deals it on the World Maker, or starts the Tidal Archive. Scrolling opens the archive into the whole screen and ends on a title card ("Level 01", "Press start").
- Reel feed (`CasualReel`, `#casual-signal`): three playable openings in three moods: the Tidal Archive (mystery), Rooftop Relay (action) and Snowball Siege (a team battle where your team follows your call). Each plays as a 9:16 story with a small HUD; the third beat waits for a move made by tapping a spot in the world; the move lands with a flash, a shake, white sparks and stat chips. Endings are collected per world (9 in all). After an ending, "Challenge a friend" copies a link (`?play=<world>#casual-signal`) that opens the same world.
- World Maker (`CasualWorldMaker`): a slot machine for place, moment and twist (twists include rivals and crews) that deals a white collectible card: the place's art under the moment's weather, a genre, a rarity, a premise and three first moves. "Send to a friend" copies `?world=place.moment.twist#casual-maker`; a friend who opens it sees "A friend sent you this world" and can remix it (place and moment held, new twist).
- Secrets (`CasualGame`): a falling star over the arrived archive, a bottle in the opening's sea, an odd bulb on the machine. The only sign of the hunt is the locked place on the World Maker, with hints behind a disclosure. Finding all three adds the Upside-down Archive and a shine on every card. Progress is saved in this browser only, when something is found.
- Scenes are drawn on a 1200 x 1000 canvas with `slice`, so one drawing serves the wide portal, the 9:16 reel and the 4:3 card. Motion and camera rules live in `casual-scenes.css`; under reduced motion, scenes show their final state.
