import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

// Keep the original artwork intact and leave the same circular-crop safe area
// in every format, including root fallbacks and previously published icon URLs.
const original = await readFile("design/source-assets/favicon-logo.png");
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const pngs = new Map();
for (const size of [16, 32, 48, 180, 192, 256, 512]) {
  const logoSize = Math.round(size * 0.75);
  const before = Math.floor((size - logoSize) / 2);
  const after = size - logoSize - before;
  pngs.set(size, await sharp(original)
    .resize(logoSize, logoSize, { fit: "contain", background: transparent })
    .extend({ top: before, bottom: after, left: before, right: after, background: transparent })
    .png().toBuffer());
}

for (const [path, size] of [
  ["favicon.png", 192],
  ["favicon-32x32.png", 32],
  ["favicon-192x192.png", 192],
  ["favicon-512x512.png", 512],
  ["apple-touch-icon.png", 180],
  ["assets/favicon-padded.png", 192],
  ["assets/favicon.png", 192],
  ["assets/favicon-legacy.png", 192],
]) await writeFile(`public/${path}`, pngs.get(size));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><image x="64" y="64" width="384" height="384" href="data:image/png;base64,${original.toString("base64")}" /></svg>`;
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
console.log("Built circle-safe PNG, SVG, ICO, Apple touch icons, and legacy aliases from the unchanged original logo.");
