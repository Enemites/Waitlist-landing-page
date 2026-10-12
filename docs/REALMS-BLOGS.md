# Realms blogs

The Realms navbar has a text-only **Blogs** button on desktop and inside the mobile navigation. Clicking it opens a two-column panel aligned to the navbar's existing width, with a short fade and slide animation with the three most recently added articles and a **Blogs Overview** link. The navbar keeps its position, size, and margins when the panel opens. Blogs uses the same idle, hover, and current-page styles as other navigation items; opening the menu alone does not mark it active. Mobile uses a stacked, scrollable navigation, and reduced motion disables the panel animation. This navigation is specific to Realms; `/home` does not show it.

- Overview: `/realms/blogs`
- Article: `/realms/blogs/<slug>`
- Unknown article slugs return the existing 404 page.

## Add an article

Add a `RealmsBlogPost` entry to `shared/realms-blogs.ts` with a unique lowercase, hyphenated slug, title, description, category, `addedAt` date (`YYYY-MM-DD`), existing or new local image and alt text, introduction, and sections. Put the new entry at the start of the list when multiple articles share a date. The list sorts by date, newest first, and preserves entry order for matching dates.

The overview, navbar's latest three articles, article pages, metadata, sitemap, and prerendered HTML all use this source. No additional route declaration or SEO entry is needed per article. Articles are maintained in the repository, and publishing changes requires a build and deployment.

Branded introductory guides are maintained in `shared/realms-guides.ts` and included in the same collection. Guides may add `facts`, `faqs`, and `references`; FAQs and source links render visibly and are reflected in structured data. Publish all article content, FAQs, references, and navigation in English. The former translated introduction URL permanently redirects to the English guide. Preserve `addedAt` when editing and set `updatedAt` for substantive updates. See `REALMS-DISCOVERY.md` for the discovery and indexing workflow.

The three initial articles introduce learning simulations, AI mentor reflection, and capability evidence. They describe the product direction and development status rather than claiming released capabilities.

## Visual design and artwork

Overview and article headings are centered. The overview leads with a large featured story and two supporting stories with different proportions. Article text uses a narrower reading column.

Each article has original artwork generated for its subject, using a restrained editorial style: flat dark teal geometry, a small lime accent, and generous negative space on warm paper. Each image expresses one article concept without a scene full of objects, effects, or visual UI. Original 1536×1024 PNGs live in `design/source-assets/blogs/`. Responsive AVIF and WebP versions at 640, 960, and 1536 pixels live in `public/assets/blogs/` and are used by the overview and article pages. Regenerate the web versions from the original sources with:

```sh
node scripts/build-blog-images.mjs
```

New artwork should have one simple conceptual motif, at least 65% negative space, no text, and a centered focal subject, a 3:2 landscape composition, and a source width of at least 1536 pixels. Use the article slug as the source filename and set its `image` field to `/assets/blogs/<slug>-1536.webp`.

## Verify

```sh
npm run build
npm run seo:check
npm run test:browser -- tests/browser/blogs.spec.ts tests/browser/seo.spec.ts
```
