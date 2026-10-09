# Technical SEO implementation

This change implements the technical SEO checklist for the existing Enemites website. Blog pages and keyword articles are outside this change and require separate editorial review. No analytics collector, email preference, waitlist API, parental-permission rule, or database schema is changed.

## Build and routing

`npm run build` builds the client, temporarily compiles a server renderer, and prerenders the six public routes from `shared/seo.ts`. React renders the existing page components; no second copy of page content is maintained. The temporary server bundle is removed after the build and is not deployed. The build does not fetch questionnaires, inspect invitation tokens, access the database, or send email.

Public HTML includes content, unique titles and descriptions, canonical URLs, Open Graph/Twitter metadata, and Organization/WebSite/WebPage JSON-LD before JavaScript runs. Critical CSS is inlined; the complete stylesheet loads with a no-JavaScript fallback, and the primary local font is preloaded. The client hydrates public HTML and updates metadata on navigation. Content stays visible during hydration, then honors the visitor's reduced-motion preference. Legal pages remain readable without JavaScript.

`vercel.json` uses clean URLs and explicit rewrites for questionnaire APIs and dynamic app routes. It redirects `/` to `/home`, preserving the existing home location. Existing API functions and the expiry-cleanup cron remain in place. Removing the global rewrite lets Vercel return a genuine 404 using `404.html` for missing URLs. Unknown client routes also render a useful Not Found page. Vite development/preview routing supports the same principal behaviors for local checks.

Parent invitations, questionnaires, and unavailable Contact/Login/Pricing pages have `noindex` and are excluded from the sitemap. Crawlers may read their noindex directives; robots.txt is not used as an access-control mechanism. A private app shell is generated without user data; the parent route also sends a no-referrer policy. The six public pages are crawlable. Canonicals and sitemap entries point to the production HTTPS domain, `https://enemites.com`.

## Images, headings, and links

Large images used on the site have responsive WebP versions; hero images also have AVIF sources with WebP fallbacks. Image dimensions reserve layout space, and small logo files replace oversized header/footer downloads. Originals moved out of `public/` are retained in `design/source-assets/` for reproducibility. To regenerate assets, run `npm run assets:optimize` (Sharp). The generated social image is 1200×630 and uses existing branding/copy; its SVG source is in `design/social-image.svg`.

Simulation clips use no initial preload, play when their section is visible, and pause when it leaves the viewport. Kinetic canvas modules mount only near the viewport. These changes reduce initial media/JavaScript work while retaining the existing interactive illustrations.

Each public page retains one H1 and its section hierarchy. Decorative images retain empty alt text; informative images retain descriptions. The Home footer links to About Us, Privacy, and Terms to improve discovery. Small-text contrast on Home was adjusted based on Lighthouse findings. External Research and News links were retained because the audit environment's proxy rejection does not establish that those sites are broken.

## Verification

```sh
npm ci
npm run build
npm run seo:check
npm test
npx playwright install chromium
npm run test:browser
npm run preview -- --port 5174
# In another terminal:
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5174 npm run test:browser
npm run seo:audit -- http://127.0.0.1:5174 current
```

`seo:check` inspects the built HTML, sitemap, robots, private shell, 404, and social image. Browser tests cover metadata after navigation, actual HTTP statuses, hydration errors, mobile overflow, and the existing privacy/signup flows. Lighthouse writes ignored JSON reports to `seo-artifacts/` for Home and Arena. Run performance audits without other browser/build workloads. The audit tool requires Node >=22.19 and an installed Playwright Chromium.

Lighthouse is a simulated mobile lab check. LCP/CLS/TBT in its reports are not production field Core Web Vitals, and TBT is not INP. Recheck production after deployment; Search Console's field report requires sufficient real-user data. See `SEO-VALIDATION.md` for the recorded implementation results.

## Search Console: remaining external setup

Verification status is unknown; missing HTML verification tags do not prove a domain is unverified. Check the existing Google Search Console account first.

1. Open or add the domain property `enemites.com` in Search Console using an account authorized for the domain.
2. If already verified, use that property. Otherwise obtain Google's specific TXT record and add it at the domain's DNS provider, then verify. Do not fabricate a token or replace unrelated DNS records.
3. After this branch is deployed to production, submit `https://enemites.com/sitemap.xml`.
4. Inspect `/home`, `/arena`, and `/arena/how-it-works`; confirm successful crawling, rendered content, and the intended canonical. Request indexing if appropriate and review the indexing report.

Search Console ownership cannot be verified from repository code alone. No verification token, DNS change, sitemap submission, or indexing request was made by this patch.

## Backlink strategy: review before publication

Backlinks are external publishing and relationship work, not a technical software requirement. The proposed approach uses existing material rather than adding a blog:

- Identify current research or product-demonstration pages useful to education/simulation communities, with accurate supporting evidence.
- Select a small set of relevant campus, research, or education partners that could link to that material in their own resources.
- Review the material and outreach text before any publication or contact. No outreach or third-party post is sent by this change.
- Track resulting referring pages and relevant organic traffic using available reports; avoid adding an analytics collector solely for this patch.

Actual publishing and outreach remain pending separate authorization and approved material.
