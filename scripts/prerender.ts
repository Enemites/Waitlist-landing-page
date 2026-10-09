import { build } from "vite";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import Beasties from "beasties";
import { PUBLIC_PAGES, UNINDEXED_PAGES, metadataForPath, metadataHtml, robotsContent, sitemapContent } from "../shared/seo";

const serverDir = resolve(".prerender");
const clientTemplate = await readFile("dist/index.html", "utf8");
if (!clientTemplate.includes('<div id="root"></div>')) throw new Error("Prerender requires a fresh client build. Run npm run build instead of rerendering generated HTML.");
try {
  await build({ build: { ssr: "src/entry-server.tsx", outDir: serverDir, emptyOutDir: true } });
  const { render } = await import(pathToFileURL(resolve(serverDir, "entry-server.js")).href);
  const primaryFont = (await readdir("dist/assets")).find(file => /^manrope-latin-wght-normal-.*\.woff2$/.test(file));
  if (!primaryFont) throw new Error("Primary bundled font missing from the client build.");
  const template = clientTemplate.replace("</head>", `<link rel="preload" href="/assets/${primaryFont}" as="font" type="font/woff2" crossorigin>\n</head>`);
  const criticalCss = new Beasties({ path: resolve("dist"), preload: "swap", pruneSource: false, inlineFonts: false, logLevel: "warn" });
  const documentFor = (path: string, body: string) => template
    .replace(/<title>[\s\S]*?<\/title>/, metadataHtml(metadataForPath(path)))
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  for (const page of [...PUBLIC_PAGES, ...UNINDEXED_PAGES]) {
    const file = `dist${page.path}.html`;
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, await criticalCss.process(documentFor(page.path, await render(page.path))));
    console.log(`Prerendered ${page.path}`);
  }
  await writeFile("dist/404.html", await criticalCss.process(documentFor("/404", await render("/404"))));
  // Dynamic forms and invitation tokens must never be rendered during the build.
  await writeFile("dist/private.html", documentFor("/arena/parent-waitlist", ""));
  await writeFile("dist/robots.txt", robotsContent);
  await writeFile("dist/sitemap.xml", sitemapContent);
  await writeFile("dist/index.html", await readFile("dist/home.html", "utf8"));
} finally {
  await rm(serverDir, { recursive: true, force: true });
}
