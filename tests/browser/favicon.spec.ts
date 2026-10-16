import { test, expect } from "@playwright/test";

const iconPaths = [
  "/favicon.ico", "/favicon.svg", "/favicon.png", "/favicon-32x32.png",
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
});

test("every icon keeps its complete visible mark inside a circular avatar", async ({ page }) => {
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
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (data[(y * canvas.width + x) * 4 + 3] <= 8) continue;
        visible++;
        if (Math.hypot(x + 0.5 - canvas.width / 2, y + 0.5 - canvas.height / 2) >= canvas.width / 2) clipped++;
      }
      return { width: canvas.width, height: canvas.height, visible, clipped };
    }, path);
    expect(pixels.width, path).toBe(pixels.height);
    expect(pixels.visible, path).toBeGreaterThan(0);
    expect(pixels.clipped, path).toBe(0);
  }
});

test("organization metadata exposes the same square, padded brand mark", async ({ page }) => {
  for (const path of ["/home", "/realms"]) {
    await page.goto(path);
    const graph = JSON.parse((await page.locator("#site-structured-data").textContent())!)["@graph"];
    expect(graph.find((node: { "@type": string }) => node["@type"] === "Organization").logo).toBe("https://enemites.com/favicon-512x512.png");
  }
});
