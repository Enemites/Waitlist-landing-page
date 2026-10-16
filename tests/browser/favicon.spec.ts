import { test, expect } from "@playwright/test";

const iconPaths = [
  "/favicon.ico", "/favicon.svg", "/favicon.png", "/favicon-16x16.png", "/favicon-32x32.png",
  "/favicon-tab-16x16.png", "/favicon-tab-32x32.png",
  "/favicon-192x192.png", "/favicon-512x512.png", "/apple-touch-icon.png",
  "/assets/favicon.png", "/assets/favicon-padded.png",
  "/assets/favicon-legacy.png", "/assets/favicon-tab.svg",
];

test("root, declared, and legacy favicons serve actual images", async ({ page, request }) => {
  await page.goto("/home");
  for (const path of iconPaths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toMatch(/^image\//);
  }
  for (const link of await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').all()) {
    expect(iconPaths).toContain(await link.getAttribute("href"));
  }
  expect(await page.locator('link[rel="icon"]').evaluateAll(links => links.map(link => ({
    href: link.getAttribute("href"), sizes: link.getAttribute("sizes"),
  })))).toEqual([
    { href: "/favicon-192x192.png", sizes: "192x192" },
    { href: "/favicon-tab-32x32.png", sizes: "32x32" },
    { href: "/favicon-tab-16x16.png", sizes: "16x16" },
  ]);
});

test("tab icons fill their square and discovery icons leave circle-safe space", async ({ page }) => {
  await page.goto("/home");
  for (const path of iconPaths) {
    const pixels = await page.evaluate(async source => {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let visible = 0;
      let clipped = 0;
      let white = 0;
      let minX = canvas.width;
      let maxX = -1;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        if (data[offset + 3] <= 8) continue;
        if (Math.min(data[offset], data[offset + 1], data[offset + 2]) > 240) white++;
        visible++;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        if (Math.hypot(x + 0.5 - canvas.width / 2, y + 0.5 - canvas.height / 2) >= canvas.width / 2) clipped++;
      }
      const corners = [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]]
        .map(([x, y]) => data[(y * canvas.width + x) * 4 + 3]);
      return { width: canvas.width, height: canvas.height, visible, clipped, white, corners, markWidth: (maxX - minX + 1) / canvas.width };
    }, path);
    expect(pixels.width, path).toBe(pixels.height);
    expect(pixels.visible, path).toBeGreaterThan(0);
    const tab = ["/favicon-tab-16x16.png", "/favicon-tab-32x32.png"].includes(path);
    if (!tab) expect(pixels.clipped, path).toBe(0);
    expect(pixels.visible / (pixels.width * pixels.height), path).toBeLessThan(0.5);
    expect(pixels.white, path).toBe(0);
    expect(pixels.corners, path).toEqual([0, 0, 0, 0]);
    // Rasterization can move either edge by a pixel at the smallest sizes.
    const pixelTolerance = 2 / pixels.width;
    expect(pixels.markWidth, path).toBeGreaterThanOrEqual(tab ? 0.93 : 0.71 - pixelTolerance);
    expect(pixels.markWidth, path).toBeLessThanOrEqual(tab ? 1 : 0.73 + pixelTolerance);
  }
});

test("organization metadata exposes the same square, padded brand mark", async ({ page }) => {
  for (const path of ["/home", "/realms"]) {
    await page.goto(path);
    const graph = JSON.parse((await page.locator("#site-structured-data").textContent())!)["@graph"];
    expect(graph.find((node: { "@type": string }) => node["@type"] === "Organization").logo).toBe("https://enemites.com/favicon-512x512.png");
  }
});
