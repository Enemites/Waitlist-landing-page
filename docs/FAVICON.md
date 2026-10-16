# Transparent favicons for tabs and discovery

## Current state — brand restored

The temporary diagnostic artwork, its source file, and its generator mode have been removed. The declared `/site-icon.png`, all legacy favicon aliases, ICO frames, and the Apple touch icon contain the original Enemites brand artwork. The 16/32 pixel tab declarations are restored. Keep these URLs stable.

The October 16 investigation verified the production files and identified `https://enemites.com/assets/favicon.png` in Google favicon service's `Content-Location` header. Search Console's stored `/home` HTML still had the earlier favicon declarations, so processing of `/site-icon.png` was not yet established. Resend's Add domain preview loaded its logo from `img.logo.dev/enemites.com`; its provider's brand record must be corrected separately through https://www.logo.dev/update. Restoring the origin artwork does not prove either provider has refreshed.

Generate branded icons with `npm run assets:favicon`, then build and deploy the generated files. Brand previews remain available at:

- `/assets/favicon-brand-preview.png`: the transparent circular-use composition.
- `/assets/favicon-brand-tab-preview.png`: the corrected small tab composition.

In Search Console's live-tested HTML, `/site-icon.png` is the observable checkpoint for the new declaration. A live test does not itself establish that Google's separate favicon service has refreshed. Compare the indexed crawl date and the fetched HTML where available to establish whether the updated declaration has been crawled. If a later crawl has the new declaration but the service still shows the earlier mark, investigate the separate favicon-fetch/cache stage. Do not repeatedly change the URL or claim a cache purge occurred.

## Branded configuration

The generated master is `design/source-assets/favicon-generated-transparent.png`. That 1254 pixel source file is preserved unchanged in the repository. All packaged icons remain transparent, with no white plate, badge, or background.

## Optical sizes

Browser tabs display a very small square; discovery interfaces often apply a circular crop. Using the same composition for both made the mark small in tabs and crowded in a circle. `npm run assets:favicon` now packages two compositions from the same generated artwork:

- **Tab icons:** `/favicon-tab-16x16.png` and `/favicon-tab-32x32.png`. The mark occupies approximately 96% of the square width and sits 5% lower than its bounding-box-centered placement to balance its heavier upper strokes. Its alpha-weighted vertical center is near the middle of the canvas. Its complete shape is retained; a circular mask is not the target for these small square icons.
- **Discovery icons:** `/site-icon.png`, `/favicon.png`, `/favicon-16x16.png`, `/favicon-32x32.png`, `/favicon-192x192.png`, `/favicon-512x512.png`, `/favicon.svg`, `/apple-touch-icon.png`, and all legacy `/assets/` favicon aliases (including `/assets/favicon-tab.svg`). The mark occupies approximately 72% of the square width, leaving transparent space for a circular mask. The 512 pixel version remains the Organization schema logo.
- **ICO fallback:** `/favicon.ico` includes tab compositions at 16/32 pixels and discovery compositions at 48/256 pixels.

The script changes the SVG rendering viewport for each use; it does not edit the generated master or deform the logo. Branded HTML declares fixed 16, 32, and 192 pixel PNGs with accurate sizes. It no longer declares an unrestricted SVG or the oversized master as competing candidates for all contexts.

The dedicated tab URLs are new; existing icon URLs continue serving the circle-safe composition so consumers retaining an earlier image URL do not receive an enlarged tab variant.

Icon size declarations let browsers select suitable files, but they do not guarantee which image a third-party crawler chooses. Google and email services control their own caching, icon selection, container, and padding. Verify their actual image before claiming those displays have updated.

## Validation

Run `npm run build`, `npm run seo:check`, and the favicon/browser SEO tests. Tests verify image responses, declared sizes, absence of magenta diagnostic pixels, transparent brand previews, optical vertical centering, larger tab silhouettes, and circle-safe discovery icons. The original official reference remains at `design/source-assets/favicon-logo.png`; page/header/footer logos are unchanged.
