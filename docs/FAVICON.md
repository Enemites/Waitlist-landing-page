# Favicon and circular logo crops

The original logo is preserved in `design/source-assets/favicon-logo.png`. Generate the public icon files with `npm run assets:favicon`. Each format scales that original square canvas to 75% of its output width and adds transparent padding. The mark stays fully inside a circular crop.

## Public files

- `/favicon.ico`: PNG-compressed 16, 32, 48, and 256 pixel frames.
- `/favicon.svg`: a 512 pixel canvas containing the original artwork with padding.
- `/favicon.png` and `/favicon-192x192.png`: 192 pixel PNGs.
- `/favicon-32x32.png`: a 32 pixel PNG.
- `/favicon-512x512.png`: a 512 pixel PNG, also used by the Organization schema logo.
- `/apple-touch-icon.png`: a 180 pixel PNG.

The previously published `/assets/favicon.png`, `/assets/favicon-legacy.png`, `/assets/favicon-padded.png`, and `/assets/favicon-tab.svg` paths serve padded versions too. Consumers that retain an earlier icon URL can retrieve a corrected image at that URL. Existing page/header/footer logo assets remain unchanged.

The shared HTML template declares the root ICO, PNG, SVG, and Apple touch icons. This changes the primary favicon URLs from the old `/assets/` paths. Vite development and preview pass through these root files as static images, matching Vercel's public-file serving.

## Confirmed issue

Production checks before this correction found that the declared SVG and the legacy PNG contained artwork touching the horizontal edges, while the declared 192 pixel PNG was padded. A circular mask removed visible parts of the unpadded mark. `/favicon.ico`, `/favicon.png`, and `/apple-touch-icon.png` also returned HTML 404 responses, leaving conventional discovery paths unavailable.

## Validation

Run `npm run build`, `npm run seo:check`, and the favicon/browser SEO tests. The favicon tests check HTTP status and image MIME types, decode all public and legacy icon entry points in Chromium, and assert that every visible pixel lies inside a circular mask. The ICO's individual frames can also be inspected with a standard ICO decoder.

An email sender avatar may come from a profile/contact image, provider branding, BIMI, or a favicon service. A screenshot alone does not identify its source. This correction fixes the website's public icon files and logo metadata; it does not change an email account avatar, provider branding setting, or DNS/BIMI configuration. Previously cached third-party images may remain until that provider retrieves the corrected files.
