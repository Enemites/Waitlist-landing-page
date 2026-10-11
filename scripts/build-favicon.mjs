import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// Separate source and output keep every other branding asset unchanged.
// Retain the original artwork; only scale it uniformly within a square canvas.
const size = 192;
const logoSize = 144;
const margin = (size - logoSize) / 2;
await sharp("design/source-assets/favicon-logo.png")
  .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: margin, bottom: margin, left: margin, right: margin, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile("public/assets/favicon-padded.png");
console.log("Built dedicated 192×192 favicon with a 75% logo and transparent padding.");

// A single ICO URL contains separate artwork for different display sizes.
// Browser tabs choose small frames with the original logo size. Larger frames
// retain circular-mask padding for surfaces such as search results.
const sizes = [16, 32, 48, 64, 128, 192, 256];
const frames = await Promise.all(sizes.map(size => sharp(size <= 64
  ? "design/source-assets/favicon-logo.png"
  : "public/assets/favicon-padded.png").resize(size, size).png().toBuffer()));
await writeFile("public/assets/favicon-tab-32.png", frames[1]);
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2); // ICO type
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, index) => {
  const entry = 6 + index * 16;
  header[entry] = size === 256 ? 0 : size;
  header[entry + 1] = size === 256 ? 0 : size;
  header.writeUInt16LE(1, entry + 4); // planes
  header.writeUInt16LE(32, entry + 6); // RGBA
  header.writeUInt32LE(frames[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frames[index].length;
});
await writeFile("public/favicon.ico", Buffer.concat([header, ...frames]));
console.log("Built multi-resolution ICO: original-size tab frames and padded large frames.");
