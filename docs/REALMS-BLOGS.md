# Realms blogs

The Realms navbar has a **Blogs** disclosure on desktop and inside the mobile navigation. Clicking it opens the three most recently added articles and a **Blogs Overview** link. This navigation is specific to Realms; `/home` does not show it.

- Overview: `/realms/blogs`
- Article: `/realms/blogs/<slug>`
- Unknown article slugs return the existing 404 page.

## Add an article

Add a `RealmsBlogPost` entry to `shared/realms-blogs.ts` with a unique lowercase, hyphenated slug, title, description, category, `addedAt` date (`YYYY-MM-DD`), existing or new local image and alt text, introduction, and sections. Put the new entry at the start of the list when multiple articles share a date. The list sorts by date, newest first, and preserves entry order for matching dates.

The overview, navbar's latest three articles, article pages, metadata, sitemap, and prerendered HTML all use this source. No additional route declaration or SEO entry is needed per article. Articles are maintained in the repository, and publishing changes requires a build and deployment.

The three initial articles introduce learning simulations, AI mentor reflection, and capability evidence. They describe the product direction and development status rather than claiming released capabilities.

## Verify

```sh
npm run build
npm run seo:check
npm run test:browser -- tests/browser/blogs.spec.ts tests/browser/seo.spec.ts
```
