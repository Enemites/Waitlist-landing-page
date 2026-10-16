import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

// This explicit flag publishes a temporary, unmistakable refresh diagnostic at
// the SAME URLs. Running without the flag restores the branded optical sizes.
const diagnostic = process.argv.includes("--diagnostic");
const diagnosticSvg = diagnostic ? await readFile("design/source-assets/favicon-diagnostic.svg", "utf8") : null;

// Preserve the generated master byte-for-byte. Package separate optical sizes:
// tabs use more of the square; larger discovery icons leave room for circles.
const master = await readFile("design/source-assets/favicon-generated-transparent.png");
const { width, height, hasAlpha } = await sharp(master).metadata();
if (!width || width !== height || !hasAlpha) {
  throw new Error("The favicon master must be a square PNG with an alpha channel.");
}
const { data, info } = await sharp(master).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  if (data[(y * width + x) * info.channels + 3] <= 128) continue;
  minX = Math.min(minX, x); minY = Math.min(minY, y);
  maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
}
const tabSide = Math.max(maxX - minX + 1, maxY - minY + 1) / 0.96;
const tabViewBox = `${(minX + maxX + 1 - tabSide) / 2} ${(minY + maxY + 1 - tabSide) / 2} ${tabSide} ${tabSide}`;
const discoverySide = width / 0.84;
const discoveryViewBox = `${(width - discoverySide) / 2} ${(height - discoverySide) / 2} ${discoverySide} ${discoverySide}`;
const wrap = viewBox => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="${viewBox}"><image width="${width}" height="${height}" href="data:image/png;base64,${master.toString("base64")}" /></svg>`;
const tabSvg = diagnosticSvg ?? wrap(tabViewBox);
const discoverySvg = diagnosticSvg ?? wrap(discoveryViewBox);
const pngs = new Map();
const tabPngs = new Map();
for (const size of [16, 32, 48, 180, 192, 256, 512]) {
  pngs.set(size, await sharp(Buffer.from(discoverySvg)).resize(size, size).png().toBuffer());
  if (size <= 32) tabPngs.set(size, await sharp(Buffer.from(tabSvg)).resize(size, size).png().toBuffer());
}
for (const size of [16, 32]) await writeFile(`public/favicon-tab-${size}x${size}.png`, tabPngs.get(size));

for (const [path, size] of [
  ["favicon.png", 192],
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["favicon-192x192.png", 192],
  ["favicon-512x512.png", 512],
  ["apple-touch-icon.png", 180],
  ["assets/favicon-padded.png", 192],
  ["assets/favicon.png", 192],
  ["assets/favicon-legacy.png", 192],
]) await writeFile(`public/${path}`, pngs.get(size));

await writeFile("public/favicon.svg", discoverySvg);
await writeFile("public/assets/favicon-tab.svg", discoverySvg);

// An ICO directory can contain PNG-compressed images. Publish the common tab
// sizes as individual frames so consumers need not scale a full-bleed fallback.
const sizes = [16, 32, 48, 256];
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
for (const [index, size] of sizes.entries()) {
  const image = (size <= 32 ? tabPngs : pngs).get(size);
  const entry = 6 + index * 16;
  directory.writeUInt8(size === 256 ? 0 : size, entry);
  directory.writeUInt8(size === 256 ? 0 : size, entry + 1);
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += image.length;
}
await writeFile("public/favicon.ico", Buffer.concat([directory, ...sizes.map(size => (size <= 32 ? tabPngs : pngs).get(size))]));
console.log(diagnostic
  ? "TEMPORARY DIAGNOSTIC ACTIVE: magenta square with a white T at every favicon URL. Run without --diagnostic to restore the brand."
  : "Published transparent tab icons and circle-safe discovery icons; preserved the generated master unchanged.");
