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

## Local review

Run `npm run dev` and open `http://localhost:5173/home` or `http://localhost:5173/arena`.

Production build passes. Browser checks cover six content pages at 360, 390, 768 and 1440 pixels, original copy and links on nine routes, mobile navigation, root redirect, introduction-video navigation, waitlist validation/submission/reset and dynamic questionnaire controls. Additional checks verify pointer parallax, three scroll-selected phases, active-only video playback and reduced-motion behavior. No page errors, broken images or horizontal document overflow were detected.

Captures and reports are stored locally under `output/playwright/` and excluded from Git. Form checks intercept requests and do not write real registrations or responses.
