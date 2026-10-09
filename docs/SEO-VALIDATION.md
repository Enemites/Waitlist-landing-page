# SEO validation results

## Scope

Existing Home, Arena, How It Works, About Us, Privacy, and Terms pages. No blog, keyword article, analytics collector, database change, or new email flow was added. Search Console ownership and external backlink publication are separate work described in `TECHNICAL-SEO.md`.

## Automated checks

- Production client build, Node server-render build, and prerender: passed.
- Built-output checks: six public pages have unique titles/descriptions, one canonical, one schema graph, one H1, content in initial HTML, and social metadata. Sitemap/robots are genuine files; invitations, questionnaires, placeholders, and blog routes are excluded. Private shell contains no user data. Custom 404 and social image exist.
- API/privacy suite: 14 tests passed.
- Production-preview browser suite: 11 tests passed, including existing signup/parent/YouTube behavior, metadata on client navigation, HTTP 404, mobile overflow, hydration errors, and deferred simulation media.
- Development browser checks passed, including the simulation-media check.
- JavaScript-disabled checks confirmed readable headings/content on Home, Arena, How It Works, and Privacy; mobile Home/Arena screenshots had no horizontal overflow.
- `git diff --check`: passed.

## Lighthouse lab comparison

Baseline used the previous main build, copied before modifications. Updated measurements used a fresh production build served locally. Both used Lighthouse 13.5 default mobile simulation. The final audit ran after browser tests completed. Scores fluctuate with CPU/network conditions; these individual lab runs are indicative and are not production field measurements.

| Metric | Home before | Home after | Arena before | Arena after |
|---|---:|---:|---:|---:|
| Performance score | 62 | 92 | 60 | 90 |
| Accessibility score | 92 | 100 | 100 | 100 |
| Best practices score | 100 | 100 | 100 | 100 |
| SEO score | 83 | 100 | 83 | 100 |
| LCP | 8.79 s | 3.04 s | 7.89 s | 3.29 s |
| CLS | 0 | 0.0012 | 0.0012 | 0.0059 |
| TBT | 101 ms | 18 ms | 217 ms | 72 ms |

LCP improved substantially but remains above the 2.5-second good threshold in these throttled lab runs. CLS remains below 0.1 and TBT improved. INP was not measured; TBT must not be presented as INP. Remaining lab opportunities include JavaScript/CSS payload and further image delivery improvements. This change does not claim that production Core Web Vitals or Google indexing are already verified.

Run `npm run seo:audit -- http://127.0.0.1:5174 current` to regenerate ignored reports in `seo-artifacts/`. Avoid simultaneous builds/browser tests when measuring.

## Image examples

- `work.png`: 4.84 MiB original; responsive WebP outputs 14.8 / 39.1 / 67.5 KiB.
- Capability-proof illustration: 1.52 MiB original; WebP outputs 5.3 / 18.2 KiB.
- Project images: roughly 0.62–0.65 MiB originals; 640-wide WebP outputs approximately 21 KiB each.
- Hero artwork has AVIF and WebP sources; small logo variants and explicit dimensions reduce initial downloads and layout uncertainty.

## Deployment checks

Local preview verified the route/status behaviors. After the branch preview deploys, verify its public HTML, sitemap/robots MIME types, root redirect, genuine missing-page 404, private-route noindex headers, social-image response, and existing API route reachability. Vercel configuration explicitly runs `npm run build` and serves `dist`; the cleanup cron is retained. Production verification, Search Console submission, and indexing review follow the eventual merge/deployment.
