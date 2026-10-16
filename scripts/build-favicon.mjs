import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

// Use the generated transparent composition as-is. Never crop, reframe, flatten,
// or add padding/backgrounds to this master. Only browser compatibility formats
// have their pixel dimensions converted; all retain its complete composition.
const master = await readFile("design/source-assets/favicon-generated-transparent.png");
const { width, height, hasAlpha } = await sharp(master).metadata();
if (!width || width !== height || !hasAlpha) {
  throw new Error("The favicon master must be a square PNG with an alpha channel.");
}
await writeFile("public/favicon.png", master);
const pngs = new Map();
for (const size of [16, 32, 48, 180, 192, 256, 512]) {
  pngs.set(size, await sharp(master).resize(size, size).png().toBuffer());
}

for (const [path, size] of [
  ["favicon-32x32.png", 32],
  ["favicon-192x192.png", 192],
  ["favicon-512x512.png", 512],
  ["apple-touch-icon.png", 180],
  ["assets/favicon-padded.png", 192],
  ["assets/favicon.png", 192],
  ["assets/favicon-legacy.png", 192],
]) await writeFile(`public/${path}`, pngs.get(size));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image width="${width}" height="${height}" href="data:image/png;base64,${master.toString("base64")}" /></svg>`;
await writeFile("public/favicon.svg", svg);
await writeFile("public/assets/favicon-tab.svg", svg);

// An ICO directory can contain PNG-compressed images. Publish the common tab
// sizes as individual frames so consumers need not scale a full-bleed fallback.
const sizes = [16, 32, 48, 256];
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
for (const [index, size] of sizes.entries()) {
  const image = pngs.get(size);
  const entry = 6 + index * 16;
  directory.writeUInt8(size === 256 ? 0 : size, entry);
  directory.writeUInt8(size === 256 ? 0 : size, entry + 1);
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += image.length;
}
await writeFile("public/favicon.ico", Buffer.concat([directory, ...sizes.map(size => pngs.get(size))]));
console.log("Published the unmodified transparent favicon master and matching PNG, SVG, ICO, Apple touch, and legacy formats.");
