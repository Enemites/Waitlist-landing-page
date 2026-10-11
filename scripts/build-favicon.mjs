import sharp from "sharp";

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
