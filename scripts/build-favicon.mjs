import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

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

// Keep tab artwork separate rather than relying on ICO frame selection.
// Give modern browsers a transparent SVG with the untouched, full-size artwork.
// The embedded PNG is a copy of the original logo, not newly drawn artwork.
const original = await readFile("design/source-assets/favicon-logo.png");
await writeFile("public/assets/favicon-tab.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="572" height="572" viewBox="0 0 572 572"><image width="572" height="572" href="data:image/png;base64,${original.toString("base64")}" /></svg>`);
console.log("Built full-size transparent SVG tab icon from the original artwork.");
