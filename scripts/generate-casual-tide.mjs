// Writes a seamlessly tiling field of tide lines (period 1600px) used as a CSS mask.
// Run: node scripts/generate-casual-tide.mjs public/assets/realms/casual-tide.svg
import { writeFileSync } from 'node:fs';
const W = 1600, H = 560, out = process.argv[2];
const paths = [];
for (let i = 0; i < 22; i++) {
  const y0 = 24 + i * 24;
  const t = i / 21;
  const amp = 5 + 14 * Math.sin(Math.PI * t);           // calmer at the edges, swell in the middle
  const p1 = i * 0.55, p2 = i * 1.3;
  let d = '';
  for (let x = 0; x <= W; x += 20) {
    const y = y0 + amp * Math.sin((2 * Math.PI * x) / 800 + p1) + amp * 0.35 * Math.sin((2 * Math.PI * x) / 320 + p2);
    d += `${x ? 'L' : 'M'}${x} ${y.toFixed(1)}`;
  }
  const w = (0.9 + 0.7 * Math.sin(Math.PI * t)).toFixed(2);
  paths.push(`<path d="${d}" stroke-width="${w}"${i % 4 === 0 ? ' stroke-dasharray="2 9"' : ''}/>`);
}
writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><g fill="none" stroke="#fff" stroke-linecap="round">${paths.join('')}</g></svg>\n`);
