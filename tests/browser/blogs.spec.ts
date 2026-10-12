import { test, expect } from "@playwright/test";
import { REALMS_BLOGS, LATEST_REALMS_BLOGS, realmsBlogPath } from "../../shared/realms-blogs";

test("Blogs opens the latest three articles and overview without navigating", async ({ page }) => {
  await page.goto("/realms");
  const trigger = page.getByRole("button", { name: "Blogs", exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(page).toHaveURL(/\/realms$/);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const panel = page.locator(".blogs-dropdown");
  await expect(panel.locator("li a")).toHaveCount(3);
  for (const [index, post] of LATEST_REALMS_BLOGS.entries()) {
    await expect(panel.locator("li a").nth(index)).toHaveAttribute("href", realmsBlogPath(post.slug));
    await expect(panel.locator("li a").nth(index)).toContainText(post.title);
  }
  await panel.getByRole("link", { name: "Blogs Overview" }).click();
  await expect(page).toHaveURL(/\/realms\/blogs$/);
  await expect(page.locator(".blog-card")).toHaveCount(REALMS_BLOGS.length);
  await expect(page.locator(".blogs-dropdown")).toHaveCount(0);
});

test("disclosure supports keyboard navigation, Escape, outside click, and focus leaving", async ({ page }) => {
  await page.goto("/realms/how-it-works");
  const trigger = page.getByRole("button", { name: "Blogs", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.locator(".blogs-dropdown li a").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(10, page.viewportSize()!.height - 10);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Shift+Tab");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`mobile blog navigation works without overflow at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/realms");
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const menu = page.getByRole("navigation", { name: "Mobile navigation" });
    const trigger = menu.getByRole("button", { name: "Blogs", exact: true });
    await trigger.click();
    await expect(menu.locator(".blogs-dropdown li a")).toHaveCount(3);
    await expect(page).toHaveURL(/\/realms$/);
    const last = LATEST_REALMS_BLOGS[LATEST_REALMS_BLOGS.length - 1];
    await menu.locator(".blogs-dropdown li a").last().click();
    await expect(page).toHaveURL(new RegExp(`${realmsBlogPath(last.slug)}$`));
    await expect(page.locator("h1")).toHaveText(last.title);
    await expect(menu).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await menu.getByRole("button", { name: "Blogs", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("button", { name: "Blogs", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await page.getByRole("link", { name: "Blogs Overview", exact: true }).first().click();
    await expect(page.locator(".blog-card")).toHaveCount(REALMS_BLOGS.length);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}

test("all overview cards open readable articles with metadata and direct URLs", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const post of REALMS_BLOGS) {
    await page.goto("/realms/blogs/");
    await page.locator(".blog-card").getByRole("link").filter({ hasText: post.title }).click();
    await expect(page).toHaveURL(new RegExp(`${realmsBlogPath(post.slug)}$`));
    await expect(page.locator("h1")).toHaveText(post.title);
    await expect(page.locator(".blog-article-body section")).toHaveCount(post.sections.length);
    await expect(page).toHaveTitle(`${post.title} — Realms Blog | Enemites`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://enemites.com${realmsBlogPath(post.slug)}`);
    expect((await request.get(`${realmsBlogPath(post.slug)}/`)).status()).toBe(200);
    await page.reload();
    await expect(page.locator("h1")).toHaveText(post.title);
  }
  expect(errors).toEqual([]);
});

test("unknown blog slugs return 404 and are unindexed", async ({ page }) => {
  const response = await page.goto("/realms/blogs/not-a-real-article");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test("Home has no Realms Blogs menu or article links", async ({ page }) => {
  await page.goto("/home");
  await expect(page.getByRole("button", { name: "Blogs", exact: true })).toHaveCount(0);
  await expect(page.locator('a[href^="/realms/blogs"]')).toHaveCount(0);
});

test("Blogs also works in the light Realms navbar", async ({ page }) => {
  await page.goto("/realms/about-us");
  await page.getByRole("button", { name: "Blogs", exact: true }).click();
  await expect(page.locator(".blogs-dropdown")).toBeVisible();
  await page.locator(".blogs-dropdown li a").first().click();
  await expect(page.locator("h1")).toHaveText(LATEST_REALMS_BLOGS[0].title);
});

test("desktop Blogs has no dropdown icon and opens a viewport-wide two-column panel", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/realms");
  const trigger = page.getByRole("button", { name: "Blogs", exact: true });
  await expect(trigger.locator("svg")).toHaveCount(0);
  await trigger.click();
  await expect(page.locator(".site-header")).toHaveAttribute("data-blogs-open", "true");
  const panel = await page.locator(".blogs-dropdown").boundingBox();
  expect(panel!.x).toBeLessThanOrEqual(1);
  expect(panel!.width).toBeGreaterThanOrEqual(1438);
  const stories = await page.locator(".blogs-menu-stories").boundingBox();
  const resources = await page.locator(".blogs-menu-resources").boundingBox();
  expect(resources!.x).toBeGreaterThan(stories!.x + stories!.width);
  await trigger.click();
  await expect(page.locator(".site-header")).toHaveAttribute("data-blogs-open", "false");
});

test("overview and article headings are centered and use dedicated responsive artwork", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/realms/blogs");
    await expect(page.locator("h1")).toHaveCSS("text-align", "center");
    await expect(page.locator(".blog-card img")).toHaveCount(3);
    for (const image of await page.locator(".blog-card img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute("src", /\/assets\/blogs\/.+-1536\.webp$/);
      await expect(image).toHaveAttribute("srcset", /640w.+960w.+1536w/);
      await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await page.locator(".blog-card a").first().click();
    await expect(page.locator("h1")).toHaveCSS("text-align", "center");
    const cover = page.locator(".blog-article-art img");
    await expect(cover).toHaveAttribute("src", /\/assets\/blogs\/learning-through-simulation-1536\.webp$/);
    await expect.poll(() => cover.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});
