# Transparent favicons for tabs and discovery

The generated master is `design/source-assets/favicon-generated-transparent.png`. That 1254 pixel source file is preserved unchanged in the repository. All packaged icons remain transparent, with no white plate, badge, or background.

## Optical sizes

Browser tabs display a very small square; discovery interfaces often apply a circular crop. Using the same composition for both made the mark small in tabs and crowded in a circle. `npm run assets:favicon` now packages two compositions from the same generated artwork:

- **Tab icons:** `/favicon-tab-16x16.png` and `/favicon-tab-32x32.png`. The visible mark is centered by its bounds and occupies approximately 96% of the square width. Its complete shape is retained; a circular mask is not the target for these small square icons.
- **Discovery icons:** `/favicon.png`, `/favicon-16x16.png`, `/favicon-32x32.png`, `/favicon-192x192.png`, `/favicon-512x512.png`, `/favicon.svg`, `/apple-touch-icon.png`, and all legacy `/assets/` favicon aliases (including `/assets/favicon-tab.svg`). The mark occupies approximately 72% of the square width, leaving transparent space for a circular mask. The 512 pixel version remains the Organization schema logo.
- **ICO fallback:** `/favicon.ico` includes tab compositions at 16/32 pixels and discovery compositions at 48/256 pixels.

The script changes the SVG rendering viewport for each use; it does not edit the generated master or deform the logo. HTML declares fixed 16, 32, and 192 pixel PNGs with accurate sizes. It no longer declares an unrestricted SVG or the oversized master as competing candidates for all contexts.

The dedicated tab URLs are new; existing icon URLs continue serving the circle-safe composition so consumers retaining an earlier image URL do not receive an enlarged tab variant.

Icon size declarations let browsers select suitable files, but they do not guarantee which image a third-party crawler chooses. Google and email services control their own caching, icon selection, container, and padding. Verify their actual image before claiming those displays have updated.

## Validation

Run `npm run build`, `npm run seo:check`, and the favicon/browser SEO tests. Tests verify image responses, declared sizes, transparent corners, no white background pixels, larger tab silhouettes, and circle-safe discovery icons. The original official reference remains at `design/source-assets/favicon-logo.png`; page/header/footer logos are unchanged.
