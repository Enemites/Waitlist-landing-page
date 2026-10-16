# Transparent generated favicon

The active master is `design/source-assets/favicon-generated-transparent.png`, generated from the official Enemites logo reference. It is a 1254 × 1254 PNG with a genuinely transparent background and no white plate, badge, border, or shadow. Its composition already includes the space needed for a circular crop.

The generated master is used as-is. `npm run assets:favicon` copies it byte-for-byte to `/favicon.png` and embeds it without reframing in `/favicon.svg`. The script does not crop, reposition, flatten, add padding, or add a background to the generated composition. The earlier official source is preserved at `design/source-assets/favicon-logo.png`.

## Browser compatibility files

- `/favicon.png`: the unchanged native 1254 pixel master, declared in the shared HTML.
- `/favicon.svg`: the same native composition in a transparent SVG wrapper.
- `/favicon.ico`: PNG-compressed 16, 32, 48, and 256 pixel frames.
- `/favicon-32x32.png`, `/favicon-192x192.png`, `/favicon-512x512.png`: standard raster sizes; the 512 pixel version is also the Organization schema logo.
- `/apple-touch-icon.png`: a 180 pixel PNG with the same transparency.

Compatibility files only convert pixel dimensions for consumers requiring smaller icons. They preserve the full composition and alpha channel. The previously published `/assets/favicon.png`, `/assets/favicon-legacy.png`, `/assets/favicon-padded.png`, and `/assets/favicon-tab.svg` paths serve matching transparent versions. Existing page/header/footer logo assets are unchanged.

## Validation

Run `npm run build`, `npm run seo:check`, and the favicon/browser SEO tests. Tests verify image responses, the byte-for-byte native master, transparent corners, no visible white background pixels, and a substantial complete mark inside a circular mask. The ICO frames can also be inspected with a standard ICO decoder.

A third-party interface controls its own icon container and may retain an earlier image. An email avatar may come from provider branding, a profile/contact image, BIMI, or a favicon service. Publishing these files does not change those services' cached images, UI padding, email account settings, or DNS/BIMI configuration.
