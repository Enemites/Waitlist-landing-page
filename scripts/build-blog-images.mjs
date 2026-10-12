import { mkdir, readdir, stat } from "node:fs/promises";
import sharp from "sharp";

const sourceDirectory = "design/source-assets/blogs";
const outputDirectory = "public/assets/blogs";
await mkdir(outputDirectory, { recursive: true });

for (const filename of (await readdir(sourceDirectory)).filter(name => name.endsWith(".png"))) {
  const source = `${sourceDirectory}/${filename}`;
  const slug = filename.replace(/\.png$/, "");
  const metadata = await sharp(source).metadata();
  if (!metadata.width || metadata.width < 1536) throw new Error(`${source} must be at least 1536px wide.`);
  for (const width of [640, 960, 1536]) {
    const output = `${outputDirectory}/${slug}-${width}.webp`;
    await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 88, effort: 5 }).toFile(output);
    console.log(`${output}: ${Math.round((await stat(output)).size / 1024)} KB`);
    const avifOutput = `${outputDirectory}/${slug}-${width}.avif`;
    await sharp(source).resize({ width, withoutEnlargement: true }).avif({ quality: 70, effort: 4 }).toFile(avifOutput);
    console.log(`${avifOutput}: ${Math.round((await stat(avifOutput)).size / 1024)} KB`);
  }
}
