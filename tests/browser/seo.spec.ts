import { test, expect } from "@playwright/test";
import { PUBLIC_PAGES } from "../../shared/seo";

test("crawl files are genuine files and exclude invitation, survey, placeholder, and blog routes", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toMatch(/xml/);
  const xml = await sitemap.text();
  for (const page of PUBLIC_PAGES) expect(xml).toContain(`https://enemites.com${page.path}`);
  expect(xml).not.toMatch(/parent-waitlist|\/form\/|\/blog|\/login|\/pricing/);
  const robots = await request.get("/robots.txt");
  expect(robots.headers()["content-type"]).toMatch(/text\/plain/);
  expect(await robots.text()).toContain("Sitemap: https://enemites.com/sitemap.xml");
});

test("metadata stays correct after client navigation", async ({ page }) => {
  await page.goto("/arena");
  await expect(page).toHaveTitle("Enemites Arena — AI Learning Simulations & Waitlist");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://enemites.com/arena");
  await page.getByRole("link", { name: "How It Works", exact: true }).first().click();
  await expect(page).toHaveTitle("How Enemites Arena Works — Decisions, Reflection & Proof");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://enemites.com/arena/how-it-works");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", "https://enemites.com/arena/how-it-works");
  await expect(page.locator("#site-structured-data")).toHaveCount(1);
});

test("unknown URLs return 404, render a useful page, and are not indexed", async ({ page }) => {
  const response = await page.goto("/page-that-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.getByRole("link", { name: "Explore Arena" }).click();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index,follow");
});

test("public pages preserve headings, hydration, and mobile layout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width: 375, height: 900 });
  for (const route of PUBLIC_PAGES) {
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator("h1")).toHaveCount(1);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  expect(errors).toEqual([]);
});

test("simulation media waits for its viewport and pauses after leaving it", async ({ page }) => {
  const videos: string[] = [];
  page.on("request", request => { if (request.url().endsWith(".mp4")) videos.push(request.url()); });
  await page.goto("/arena");
  await expect(page.locator("video").first()).toHaveAttribute("preload", "none");
  expect(videos).toEqual([]);
  await page.locator(".simulation-sequence").scrollIntoViewIfNeeded();
  await expect.poll(() => videos.length).toBeGreaterThan(0);
  await page.locator("h1").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator("video").evaluateAll(nodes => nodes.every(node => (node as HTMLVideoElement).paused))).toBe(true);
});
