import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { PUBLIC_PAGES, UNINDEXED_PAGES, SITE_ORIGIN } from "../shared/seo";

const titles = new Set<string>();
for (const page of PUBLIC_PAGES) {
  const html = await readFile(`dist${page.path}.html`, "utf8");
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert(title && !titles.has(title), `Missing or duplicate title: ${page.path}`);
  titles.add(title);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `Duplicate canonical: ${page.path}`);
  assert.equal((html.match(/name="description"/g) || []).length, 1, `Duplicate description: ${page.path}`);
  assert.equal((html.match(/id="site-structured-data"/g) || []).length, 1, `Duplicate schema: ${page.path}`);
  assert(html.includes(`href="${SITE_ORIGIN}${page.path}"`), `Canonical missing: ${page.path}`);
  assert.match(html, /name="description" content="[^"]+"/);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /property="og:image" content="https:\/\/enemites.com\/assets\/enemites-social.jpg"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `Expected one H1: ${page.path}`);
  assert.match(html, /<main[\s>]/, `Content absent without JavaScript: ${page.path}`);
  const schema = JSON.parse(html.match(/<script id="site-structured-data" type="application\/ld\+json">(.*?)<\/script>/s)![1]);
  assert.equal(schema["@graph"][2].url, `${SITE_ORIGIN}${page.path}`);
}
const sitemap = await readFile("dist/sitemap.xml", "utf8");
assert.match(sitemap, /^<\?xml/);
assert.equal((sitemap.match(/<loc>/g) || []).length, PUBLIC_PAGES.length);
for (const page of PUBLIC_PAGES) assert(sitemap.includes(`${SITE_ORIGIN}${page.path}`));
for (const page of UNINDEXED_PAGES) {
  assert(!sitemap.includes(page.path));
  assert.match(await readFile(`dist${page.path}.html`, "utf8"), /name="robots" content="noindex,follow"/);
}
assert(!sitemap.includes("parent-waitlist") && !sitemap.includes("/form/") && !sitemap.includes("/blog"));
assert.match(await readFile("dist/robots.txt", "utf8"), /Sitemap: https:\/\/enemites.com\/sitemap.xml/);
assert.match(await readFile("dist/404.html", "utf8"), /Page not found/);
const privateHtml = await readFile("dist/private.html", "utf8");
assert.match(privateHtml, /name="robots" content="noindex,follow"/);
assert.match(privateHtml, /name="referrer" content="no-referrer"/);
assert(privateHtml.includes('<div id="root"></div>'));
assert((await stat("dist/assets/enemites-social.jpg")).size > 0);
console.log(`SEO build checks passed: ${PUBLIC_PAGES.length} public pages, private shell, sitemap, robots, social image, and 404.`);
