# Realms journal design QA

## Current revision: October 13, 2026

This review follows the user's revised direction: a menu within the navbar's existing width, consistent text-only navigation, an explicit world-model product explanation, and quieter editorial artwork. It supersedes the earlier edge-to-edge menu and architectural illustration direction.

## Reviewed behavior and appearance

- Blogs shares the other links' idle and hover colors in dark and light themes. Its current-page state applies to the blog overview and articles; opening the menu alone does not select it.
- Opening Blogs preserves the navbar's position, width, padding, and radius. The two-column panel aligns to the navbar, rather than the viewport, and enters with a 240ms opacity/vertical animation. Reduced motion disables this animation.
- Mobile retains the stacked disclosure, usable overview link, scrollable menu, keyboard access, and Escape/outside-click dismissal. A short 1024×420 desktop viewport keeps the panel inside the screen.
- Six new 1536×1024 generated source illustrations replace every active article cover. Each uses one flat geometric concept, generous warm-paper negative space, dark teal ink, and a restrained lime accent. The set covers a modeled world, a learning loop, conversation versus simulation, decisions, reflection, and evidence.
- Responsive AVIF/WebP derivatives keep the original composition at 640, 960, and 1536 pixels. Main WebP images are 8–18 KB. Overview, article, related-story, and social images use the replacement artwork and updated English alt text.
- The Realms definition, hero, introductory guides, FAQs, and metadata explain the internal AI world model as the core simulation engine under development. AI imagination means constructing scenarios and exploring possible next states. No training method, model architecture, or released performance is invented.
- Centered overview/article headings and the existing staggered journal layout remain intact. Product definition paragraphs have separate spacing for readability.

## Rendered evidence

All captures use deviceScaleFactor 1. Full-page image heights exceed their CSS viewport height.

| Screenshot | CSS viewport | State |
| --- | --- | --- |
| `/tmp/realms-refined-menu-final.png` | 1440×1000 | Realms, desktop Blogs open |
| `/tmp/realms-refined-mobile-menu-final.png` | 390×844 | Mobile navigation and Blogs open |
| `/tmp/realms-editorial-overview-desktop.png` | 1440×1000 | All six overview covers, full page |
| `/tmp/realms-editorial-overview-mobile.png` | 390×844 | Mobile overview, full page |
| `/tmp/realms-editorial-article-desktop.png` | 1440×1000 | English product introduction, full page |
| `/tmp/realms-world-model-definition.png` | 1440×1000 | Product definition section |

The menu, definition, and overview renders were visually inspected. The generated sources were inspected individually before installation. These are local production-build checks, not verification of a deployed site or search indexing.

## Validation

- `npm run build`: passed.
- `npm run seo:check`: passed for 13 public pages, including visible FAQs, English metadata, product entity identity, references, social images, and crawl files.
- Production Playwright suite with system Chromium: 40 tests passed, including unchanged-navbar geometry, navigation color parity, keyboard dismissal, mobile overflow, reduced motion, article routing, responsive artwork, and metadata after client navigation.

The initial color-comparison check captured a transient hover-out color. It was corrected to compare against the stable idle color, and the full production suite passed.
