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
  await page.goto("/realms");
  await expect(page).toHaveTitle("Enemites Realms — AI Learning Simulations & Waitlist");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://enemites.com/realms");
  await page.getByRole("link", { name: "How It Works", exact: true }).first().click();
  await expect(page).toHaveTitle("How Enemites Realms Works — Decisions, Reflection & Proof");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://enemites.com/realms/how-it-works");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", "https://enemites.com/realms/how-it-works");
  await expect(page.locator("#site-structured-data")).toHaveCount(1);
});

test("unknown URLs return 404, render a useful page, and are not indexed", async ({ page }) => {
  const response = await page.goto("/page-that-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.getByRole("link", { name: "Explore Realms" }).click();
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
  await page.goto("/realms");
  await expect(page.locator("video").first()).toHaveAttribute("preload", "none");
  expect(videos).toEqual([]);
  await page.locator(".simulation-sequence").scrollIntoViewIfNeeded();
  await expect.poll(() => videos.length).toBeGreaterThan(0);
  await page.locator("h1").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator("video").evaluateAll(nodes => nodes.every(node => (node as HTMLVideoElement).paused))).toBe(true);
});

test("legacy product URLs redirect permanently and preserve links", async ({ page, request }) => {
  for (const path of ["", "/how-it-works", "/about-us", "/privacy-policy", "/terms-of-service", "/parent-waitlist", "/login"]) {
    const response = await request.get(`/arena${path}?source=legacy`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(`/realms${path}?source=legacy`);
  }
  await page.goto("/arena?source=legacy#join-waitlist");
  await expect(page).toHaveURL(/\/realms\?source=legacy#join-waitlist$/);
  await expect(page.locator("h1")).toHaveText("Realms");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://enemites.com/realms");
});

test("public copy and metadata use Realms", async ({ page }) => {
  for (const route of PUBLIC_PAGES) {
    await page.goto(route.path);
    expect(await page.locator("body").innerText()).not.toMatch(/\barenas?\b/i);
    await expect(page).toHaveTitle(route.title);
    expect(await page.locator('meta[name="description"]').getAttribute("content")).not.toMatch(/\barena\b/i);
    expect(await page.locator('a[href^="/arena"]').count()).toBe(0);
  }
});
