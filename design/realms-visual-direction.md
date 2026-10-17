# Realms visual direction

## Accepted direction

Preserve the approved physical strategy-table image without alteration. The three earlier generated environment photographs were rejected and remain removed from the delivered page and project assets.

The user accepts the current standalone world illustrations and wants them preserved. Add screen artwork in an additional section after the existing non-screen story sections. The user's references explain a static screenshot of software and its layered presentation; they do not request a functional demo or Google's visual theme. The product recordings in Focused establish the distinction between a software screen and an ordinary illustration.

Screen artwork is rendered from fixed HTML artboards into PNG originals and optimized WebP images. The live page contains two image elements with deliberate overlap, tilt, separation, and shadow. There are no working controls, choices, maps, reset buttons, or app navigation inside these images. Label them as illustrated interface concepts: the product is still in development. Each image has software chrome and purposeful UI content, with no repeated opener artwork.

## Illustration meaning

- Casual: preserve the standalone archive and the distinct reserve/consequence illustration. The additional screen composition shows a world library with The Glasshouse, Northbound, and Pressure Drop, with a separate Glasshouse journal screen in front.
- Competitive: preserve the standalone team/crossing illustration and the approved tabletop image with its matchmaking explanation. The additional screen composition shows the Atlas/Vega match lobby with a separate team coordination screen in front.
- Focused: retain the existing content and registration flow.

The standalone illustrations remain in `CasualPath.tsx` and `CompetitivePath.tsx`. The user expressly permits code-built screen artwork. Its sources are `design/screen-compositions/casual.html` and `competitive.html`; run `node scripts/render-realms-screens.mjs` to render the artboards using local fonts. Originals are saved in `design/source-assets/realms/screens/`, and responsive web versions in `public/assets/realms/screens/`. `RealmsScreens.tsx` composes the image layers in a separate section through each path's children slot.

## Three entry identities

- Casual: midnight blue and lilac, lighter type, open spacing, soft story rails and rounded controls. Its transition opens the world through a gentle scale and rising copy.
- Focused: graphite and mint, measured column alignment, flat evidence surfaces and precise rules. Its transition aligns the introductory text through a short reveal.
- Competitive: near-black and amber, firmer type, angular rules and a tactical briefing rhythm. Its text and world enter from opposing sides.

The new gateway selector uses three distinct architectural emblems and retains accessible tab semantics, query-string selection, keyboard focus, and persistent shared registration. Transition animation is limited to the incoming path's introduction and never delays selection. Keyboard changes are immediate; reduced motion removes travel. Shared hero, definition, waitlist form, destinations, and public APIs retain their behavior.

## Preserved approved asset

The approved asset was generated with the built-in image generation tool on 2026-10-17. Its original and web versions remain unchanged:

- `design/source-assets/realms/competitive-strategy-table.png` — SHA-256 `9E2B29D2CBDD655495413595AFABA5D7D86BBE082352B40AB7D1049D5E37C6D2`
- `public/assets/realms/competitive-strategy-table-768.webp` — SHA-256 `3E409B2C32614497D29022729E2F39D827F7830E6E9CB4DB8F62A2F0AED82C30`
- `public/assets/realms/competitive-strategy-table-1536.webp` — SHA-256 `C179D7B50A2813D17ACD26D90CB0C2566E56E52C3FD8A0F180E5376A34F062A2`

### competitive-strategy-table

Source: `design/source-assets/realms/competitive-strategy-table.png`

Web assets: `public/assets/realms/competitive-strategy-table-768.webp`, `public/assets/realms/competitive-strategy-table-1536.webp`.

Prompt:

> Use case: product-mockup. Asset type: exclusive editorial photograph for a premium team strategy simulation website's matchmaking section. Create a horizontal 3:2 editorial studio photograph of a real physical architectural relief model on a dark graphite table. A precisely milled matte charcoal-and-light-grey scale model of a coastal floodgate complex: two land approaches divided by a dark channel, one central crossing, restrained concrete-like dam geometry and a small inset power-station form. This is a tangible model photographed as a beautiful industrial design object, not a glowing hologram or a fake software screenshot. Two small clusters of three simple solid geometric strategy markers sit on opposing approaches, one subdued acid-lime enamel and one muted ivory enamel. Markers are tactile and non-glowing, no letters, no numbers, no figurine bodies, no chess-piece cliché. Broad soft window light from upper left, blackened steel and machined model edges, one long soft shadow, a close low oblique camera angle, sophisticated shallow depth of field with the central crossing sharply legible and background falling gently out of focus. Keep enough model visible to understand the two approaches but crop into the board on the right for a strong editorial composition. Cool neutral grey, graphite black, dark green undertones; the lime is sparse. Image should communicate that several people would gather to plan different approaches around one shared world. No hands, no people, no extra props, no plant, no cup, no notebook, no miniature cars, no writing, no glyphs, no logos, no glass screen, no neon outlines, no HUD, no UI, no pastel clay rendering, no sci-fi cityscape, no purple or blue glow. Professional product photography with tangible and subtly imperfect materials.
