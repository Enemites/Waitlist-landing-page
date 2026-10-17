import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'design/source-assets/realms/screens');
const webDir = path.join(root, 'public/assets/realms/screens');
await Promise.all([mkdir(sourceDir, { recursive: true }), mkdir(webDir, { recursive: true })]);

// Only source artboards and their local fonts are served to the screenshot renderer.
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const allowed = /^\/design\/screen-compositions\/(casual|competitive)\.html$/.test(pathname)
    || /^\/node_modules\/@fontsource-variable\/(manrope|jetbrains-mono)\/files\/[\w-]+\.woff2$/.test(pathname);
  if (!allowed) { response.writeHead(404).end(); return; }
  try {
    const data = await readFile(path.join(root, pathname));
    response.writeHead(200, { 'Content-Type': pathname.endsWith('.html') ? 'text/html; charset=utf-8' : 'font/woff2' });
    response.end(data);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1500 }, deviceScaleFactor: 1.5 });
  for (const entry of ['casual', 'competitive']) {
    await page.goto(`http://127.0.0.1:${server.address().port}/design/screen-compositions/${entry}.html`);
    await page.evaluate(() => document.fonts.ready);
    for (const layer of ['main', 'detail']) {
      const artboard = page.locator(`.screen-${layer}`);
      const geometry = await artboard.evaluate(el => ({
        width: el.clientWidth, height: el.clientHeight, scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight,
        clippedText: [...el.querySelectorAll('p,h1,h2,h3,span')].filter(node => node.clientWidth && node.scrollWidth > node.clientWidth + 2).map(node => node.textContent.slice(0, 60)),
      }));
      if (geometry.scrollWidth > geometry.width + 2 || geometry.scrollHeight > geometry.height + 2 || geometry.clippedText.length) {
        throw new Error(`${entry}/${layer} overflows: ${JSON.stringify(geometry)}`);
      }
      const filename = path.join(sourceDir, `${entry}-${layer}.png`);
      await artboard.screenshot({ path: filename, omitBackground: true });
      const widths = layer === 'main' ? [900, 1800] : [600, 900];
      for (const width of widths) {
        await sharp(filename).resize({ width }).webp({ quality: 92, effort: 6 }).toFile(path.join(webDir, `${entry}-${layer}-${width}.webp`));
      }
      process.stdout.write(`${entry}/${layer}: ${JSON.stringify(geometry)}\n`);
    }
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
