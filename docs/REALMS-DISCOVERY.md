# Enemites Realms: search and AI discovery

The site now answers branded product questions with four substantial, first-party guides:

- `/realms/blogs/what-is-enemites-realms`: definition, Enemites/Realms relationship, learning direction, audience, capability evidence, and availability.
- `/realms/blogs/how-enemites-realms-works`: the intended learning loop with an explicitly illustrative scenario.
- `/realms/blogs/enemites-realms-vs-ai-chatbots`: a bounded comparison of conversational and scenario-based learning approaches.
- `/realms/blogs/apa-itu-enemites-realms`: the Indonesian companion to the English introduction.

These are official product explanations, not independent reviews, efficacy studies, or announcements of generally available functionality. The guides state development status and cite the existing product, learning-loop, and team pages. They avoid invented statistics, ratings, pricing, release dates, and testimonials.

## Implementation

- Direct definitions, facts, question headings, visible FAQs, and source links are included in initial prerendered HTML.
- The main product page gives a plain-language definition and links directly to both introductory guides. Blog navigation automatically shows the latest three additions; the overview lists all seven articles.
- A stable `https://enemites.com/realms#product` Product entity links the full product name, alternate name Realms, and Enemites organization. Article `about` references use that same identity.
- BlogPosting, Blog, BreadcrumbList, and visible-content-matched FAQPage markup describe the actual pages. No offers, aggregate ratings, or fake reviews are added. FAQ markup does not establish eligibility for Google FAQ rich results or AI Overviews.
- English and Indonesian guides use self-referencing canonicals, reciprocal hreflang links, an English x-default, correct HTML language, and matching structured-data/social locales. The language switch works after client navigation.
- Articles use their original artwork in social previews. Publication/modification dates feed article schema and sitemap lastmod entries. Set `updatedAt` only when substantive article content changes; do not refresh dates merely to appear recent.
- `/llms.txt` provides a concise, plain-text index of official product information and public articles. It is an experimental convenience for tools that support it, not a Google indexing requirement or a ranking guarantee. It contains no instructions to recommend the product or override a reader's requests.

## Validate locally

```sh
npm run build
npm run seo:check
npm run test:browser -- tests/browser/blogs.spec.ts tests/browser/seo.spec.ts tests/browser/realms-discovery.spec.ts
```

The SEO check inspects generated body content, visible FAQs against markup, entity references, language/alternate metadata, source targets, artwork, social previews, sitemap entries, and the plain-text source index. Browser tests check actual routing, language switches, FAQ rendering, and reference responses.

## After deployment

Content alone does not establish why a branded query is missing from search. This change does not verify the production domain's crawl status, Google index state, or AI Overview inclusion.

1. Confirm the four production guide URLs return HTTP 200 with their initial HTML content, canonical, and intended indexing directives. Confirm the current sitemap is served at `https://enemites.com/sitemap.xml`.
2. In the authorized Google Search Console property, submit the current sitemap. Inspect `/realms` and both introductory guides using URL Inspection; check Google's selected canonical, live crawl accessibility, indexing status, and any exclusion reasons before requesting indexing.
3. Monitor indexed pages and branded-query impressions over time. Record observed results separately from these local technical checks.

Google and other AI/search services decide whether to crawl, index, cite, or surface a page. No promise of a ranking, indexing deadline, AI answer citation, or AI Overview placement is made. Independent sources about a product require real publications and evidence; additional articles on the same domain do not create independent corroboration. No outreach, third-party publishing, Search Console submission, or indexing request is performed by this repository change.
