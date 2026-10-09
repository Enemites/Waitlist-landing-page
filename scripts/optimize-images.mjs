import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const sources = [
  ["work.png", "work", [640, 1280, 1920]],
  ["capability-proof-abstract.png", "capability-proof", [640, 1280]],
  ["arena-infrastructure.jpg", "arena-infrastructure", [640, 960]],
  ["world-model.jpg", "world-model", [640, 960]],
  ["feedback-loop-sculpture.jpg", "feedback-loop-sculpture", [640, 896]],
];
await mkdir("public/assets", { recursive: true });
for (const [file, name, widths] of sources) {
  for (const width of widths) {
    const info = await sharp(`design/source-assets/${file}`).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`public/assets/${name}-${width}.webp`);
    console.log(`${name}-${width}.webp: ${info.width}×${info.height}, ${(info.size / 1024).toFixed(1)} KiB`);
  }
}
for (const [file, widths] of [["learning-sculpture.webp", [640, 960]], ["arena-world.webp", [960, 1672]], ["logo.png", [128, 384]]]) {
  const name = file.replace(/\.[^.]+$/, "");
  for (const width of widths) {
    await sharp(`public/assets/${file}`).resize({ width }).webp({ quality: 80 }).toFile(`public/assets/${name}-${width}.webp`);
    if (file !== "logo.png") await sharp(`public/assets/${file}`).resize({ width }).avif({ quality: 50, effort: 4 }).toFile(`public/assets/${name}-${width}.avif`);
  }
}
// Reuse existing branding and copy; no new editorial or keyword content.
const logo = (await readFile("public/assets/logo.png")).toString("base64");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#0d1517"/><circle cx="1040" cy="335" r="260" fill="#152622"/>
<circle cx="1040" cy="335" r="185" fill="none" stroke="#c4ed6c" stroke-opacity="0.35"/>
<circle cx="1040" cy="335" r="110" fill="none" stroke="#c4ed6c" stroke-opacity="0.35"/>
<rect x="72" y="72" width="76" height="76" rx="18" fill="#edf1ef"/>
<image href="data:image/png;base64,${logo}" x="86" y="88" width="48" height="44"/>
<text x="72" y="298" font-family="sans-serif" font-size="102" font-weight="600" fill="#edf1ef">Enemites</text>
<text x="76" y="377" font-family="sans-serif" font-size="34" fill="#c4ed6c">Research &amp; Learning Simulations</text>
<text x="76" y="550" font-family="sans-serif" font-size="25" fill="#afbab6">enemites.com</text>
</svg>`;
await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile("public/assets/enemites-social.jpg");
await writeFile("design/social-image.svg", svg);
