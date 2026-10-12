import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { PUBLIC_PAGES, UNINDEXED_PAGES, SITE_ORIGIN, REALMS_ENTITY_ID, socialMetadataForPage } from "../shared/seo";
import { REALMS_BLOGS, realmsBlogPath } from "../shared/realms-blogs";

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
  const social = socialMetadataForPage(page);
  assert(html.includes(`property="og:image" content="${social.image}"`), `Social image mismatch: ${page.path}`);
  assert(html.includes(`property="og:type" content="${social.type}"`), `Social type mismatch: ${page.path}`);
  assert.equal(html.match(/<html\b[^>]*\blang="([^"]+)"/)?.[1], page.language ?? "en", `Document language mismatch: ${page.path}`);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `Expected one H1: ${page.path}`);
  assert.match(html, /<main[\s>]/, `Content absent without JavaScript: ${page.path}`);
  const schema = JSON.parse(html.match(/<script id="site-structured-data" type="application\/ld\+json">(.*?)<\/script>/s)![1]);
  assert.equal(schema["@graph"][2].url, `${SITE_ORIGIN}${page.path}`);
  for (const alternate of page.alternates ?? []) {
    assert(html.includes(`hreflang="${alternate.language}" href="${SITE_ORIGIN}${alternate.path}"`), `Alternate missing: ${page.path}`);
    assert(PUBLIC_PAGES.some(candidate => candidate.path === alternate.path), `Alternate points to missing page: ${page.path}`);
  }
  const post = REALMS_BLOGS.find(post => realmsBlogPath(post.slug) === page.path);
  if (post) {
    const body = html.slice(html.indexOf("<body"));
    const article = schema["@graph"].find((node: any) => node["@type"] === "BlogPosting");
    const product = schema["@graph"].find((node: any) => node["@type"] === "Product");
    assert.equal(product.name, "Enemites Realms");
    assert.equal(product["@id"], REALMS_ENTITY_ID);
    assert.equal(article.about["@id"], REALMS_ENTITY_ID);
    assert.equal(article.inLanguage, post.language ?? "en");
    assert.equal(article.dateModified, post.updatedAt ?? post.addedAt);
    assert(body.includes(post.introduction.slice(0, 80)), `Direct answer missing from initial body HTML: ${page.path}`);
    assert(schema["@graph"].some((node: any) => node["@type"] === "BreadcrumbList"), `Breadcrumbs missing: ${page.path}`);
    assert((await stat(`dist${post.image}`)).size > 0, `Article artwork absent: ${page.path}`);
    if (post.faqs?.length) {
      const faq = schema["@graph"].find((node: any) => node["@type"] === "FAQPage");
      assert.equal(faq.mainEntity.length, post.faqs.length);
      assert(body.includes('id="faq"'), `Visible FAQ missing: ${page.path}`);
      for (const [index, entry] of post.faqs.entries()) {
        assert.equal(faq.mainEntity[index].name, entry.question);
        assert.equal(faq.mainEntity[index].acceptedAnswer.text, entry.answer);
        assert(body.includes(entry.question), `FAQ only exists in markup: ${page.path}`);
      }
    }
    for (const reference of post.references ?? []) {
      assert(PUBLIC_PAGES.some(candidate => candidate.path === reference.path), `Broken source link: ${page.path}`);
      assert(body.includes(`href="${reference.path}"`), `Source absent from rendered article: ${page.path}`);
    }
  }
}
const sitemap = await readFile("dist/sitemap.xml", "utf8");
assert.match(sitemap, /^<\?xml/);
assert.equal((sitemap.match(/<loc>/g) || []).length, PUBLIC_PAGES.length);
for (const page of PUBLIC_PAGES) assert(sitemap.includes(`${SITE_ORIGIN}${page.path}`));
for (const page of PUBLIC_PAGES.filter(page => page.lastModified)) assert(sitemap.includes(`<loc>${SITE_ORIGIN}${page.path}</loc><lastmod>${page.lastModified}</lastmod>`));
for (const page of UNINDEXED_PAGES) {
  assert(!sitemap.includes(page.path));
  assert.match(await readFile(`dist${page.path}.html`, "utf8"), /name="robots" content="noindex,follow"/);
}
assert(!sitemap.includes("parent-waitlist") && !sitemap.includes("/form/"));
assert.match(await readFile("dist/robots.txt", "utf8"), /Sitemap: https:\/\/enemites.com\/sitemap.xml/);
assert.match(await readFile("dist/404.html", "utf8"), /Page not found/);
const privateHtml = await readFile("dist/private.html", "utf8");
assert.match(privateHtml, /name="robots" content="noindex,follow"/);
assert.match(privateHtml, /name="referrer" content="no-referrer"/);
assert(privateHtml.includes('<div id="root"></div>'));
assert((await stat("dist/assets/enemites-social.jpg")).size > 0);
const llms = await readFile("dist/llms.txt", "utf8");
assert(llms.startsWith("# Enemites"));
for (const post of REALMS_BLOGS) assert(llms.includes(`${SITE_ORIGIN}${realmsBlogPath(post.slug)}`));
assert(!llms.includes("/form/") && !llms.includes("parent-waitlist"));
console.log(`SEO build checks passed: ${PUBLIC_PAGES.length} public pages, entity-linked articles, visible FAQs, languages, source links, sitemap, robots, llms.txt, private shell, social images, and 404.`);
