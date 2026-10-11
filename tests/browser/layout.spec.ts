import { test, expect } from "@playwright/test";

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
];

test("Home footer offers only Research, News, and Contact", async ({ page }) => {
  await page.goto("/home");
  await expect(page.locator("footer a").filter({ hasText: /Research|News|Contact/ })).toHaveCount(3);
  await expect(page.locator('a[href="/arena/about-us"], a[href="/arena/privacy-policy"], a[href="/arena/terms-of-service"]')).toHaveCount(0);
});

test("closing logo fills a screen without cropping on desktop and mobile", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/arena");
    const section = page.locator(".product-endmark");
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator("img")).toBeVisible();
    await section.locator("img").evaluate(image => (image as HTMLImageElement).decode());
    const dimensions = await section.evaluate(node => {
      const area = node.getBoundingClientRect();
      const image = node.querySelector("img")!.getBoundingClientRect();
      return { area: { x: area.x, y: area.y, width: area.width, height: area.height }, image: { x: image.x, y: image.y, width: image.width, height: image.height } };
    });
    expect(dimensions.area.height).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(dimensions.image.x).toBeGreaterThanOrEqual(dimensions.area.x);
    expect(dimensions.image.y).toBeGreaterThanOrEqual(dimensions.area.y);
    expect(dimensions.image.x + dimensions.image.width).toBeLessThanOrEqual(dimensions.area.x + dimensions.area.width);
    expect(dimensions.image.y + dimensions.image.height).toBeLessThanOrEqual(dimensions.area.y + dimensions.area.height);
    expect(dimensions.image.width >= viewport.width * 0.7 || dimensions.image.height >= viewport.height * 0.7).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});

for (const viewport of viewports.slice(0, 3)) {
  test(`native touch scrolling holds the timeline while advancing phases at ${viewport.width}×${viewport.height}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true, reducedMotion: "no-preference", baseURL: test.info().project.use.baseURL });
    const page = await context.newPage();
    await page.goto("/arena");
    const phases = page.locator(".sequence-phase");
    const geometry = await page.locator(".simulation-sequence").evaluate(node => ({ top: node.getBoundingClientRect().top + scrollY, distance: (node as HTMLElement).offsetHeight - innerHeight }));
    await page.evaluate(({ top, distance }) => window.scrollTo(0, top + distance * 0.12), geometry);
    await expect(phases.nth(0)).toHaveAttribute("aria-pressed", "true");
    const initial = await page.locator(".sequence-sticky").boundingBox();
    expect(initial!.y).toBeGreaterThanOrEqual(0);
    expect(initial!.y + initial!.height).toBeLessThanOrEqual(viewport.height + 1);
    const cdp = await context.newCDPSession(page);
    for (const index of [1, 2]) {
      for (let swipe = 0; swipe < 8 && await phases.nth(index).getAttribute("aria-pressed") !== "true"; swipe++) {
        const x = viewport.width / 2;
        const startY = viewport.height * 0.85;
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: startY }] });
        for (let move = 1; move <= 10; move++) {
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: startY - viewport.height * 0.04 * move }] });
          await page.waitForTimeout(40);
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      }
      await expect(phases.nth(index)).toHaveAttribute("aria-pressed", "true");
      const pinned = await page.locator(".sequence-sticky").boundingBox();
      expect(Math.abs(pinned!.y - initial!.y)).toBeLessThan(2);
    }
    await page.evaluate(({ top, distance }) => window.scrollTo(0, top + distance + innerHeight), geometry);
    await expect(page.locator(".product-market")).toBeInViewport();
    await context.close();
  });
}

test("reduced motion keeps the timeline freely scrollable and phases selectable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/arena");
  await expect(page.locator(".sequence-sticky")).toHaveCSS("position", "static");
  const third = page.locator(".sequence-phase").nth(2);
  await third.click();
  await expect(third).toHaveAttribute("aria-pressed", "true");
});
