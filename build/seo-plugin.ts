import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { PUBLIC_PAGES, UNINDEXED_PAGES, metadataForPath, metadataHtml, robotsContent, sitemapContent, llmsContent } from "../shared/seo";

export function seoPlugin(): Plugin {
  const staticPaths = new Set([...PUBLIC_PAGES, ...UNINDEXED_PAGES].map(page => page.path));
  const iconPaths = new Set(["/favicon.ico", "/favicon.svg", "/favicon.png", "/favicon-32x32.png", "/favicon-192x192.png", "/favicon-512x512.png", "/apple-touch-icon.png"]);
  const privatePath = (path: string) => path === "/realms/parent-waitlist" || /^\/form\/[^/]+$/.test(path);
  return {
    name: "route-seo",
    transformIndexHtml(html, context) {
      if (!context.server) return html;
      const path = new URL(context.originalUrl || context.path, "http://localhost").pathname;
      return html.replace(/<title>[\s\S]*?<\/title>/, metadataHtml(metadataForPath(path)));
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = new URL(req.url || "/", "http://localhost").pathname.replace(/\/$/, "") || "/";
        if (path === "/realms/blogs/apa-itu-enemites-realms") { res.writeHead(308, { Location: `/realms/blogs/what-is-enemites-realms${new URL(req.url || "/", "http://localhost").search}` }); res.end(); return; }
        if (path === "/arena" || path.startsWith("/arena/")) { res.writeHead(308, { Location: (req.url || path).replace(/^\/arena/, "/realms"), "Referrer-Policy": "no-referrer" }); res.end(); return; }
        if (path === "/") { res.writeHead(308, { Location: "/home" }); res.end(); return; }
        if (path === "/robots.txt" || path === "/sitemap.xml" || path === "/llms.txt") {
          res.setHeader("Content-Type", path === "/sitemap.xml" ? "application/xml; charset=utf-8" : "text/plain; charset=utf-8");
          res.end(path === "/robots.txt" ? robotsContent : path === "/llms.txt" ? llmsContent : sitemapContent); return;
        }
        if (path.startsWith("/api/") || path.startsWith("/@") || path.startsWith("/src/") || path.startsWith("/node_modules/") || path.startsWith("/assets/") || path.startsWith("/licenses/") || path === "/index.html" || iconPaths.has(path) || staticPaths.has(path) || privatePath(path)) { next(); return; }
        if (req.headers.accept?.includes("text/html")) {
          const html = await readFile(resolve(server.config.root, "index.html"), "utf8");
          res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, follow" });
          res.end(await server.transformIndexHtml(path, html)); return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = new URL(req.url || "/", "http://localhost").pathname.replace(/\/$/, "") || "/";
        if (path === "/realms/blogs/apa-itu-enemites-realms") { res.writeHead(308, { Location: `/realms/blogs/what-is-enemites-realms${new URL(req.url || "/", "http://localhost").search}` }); res.end(); return; }
        if (path === "/arena" || path.startsWith("/arena/")) { res.writeHead(308, { Location: (req.url || path).replace(/^\/arena/, "/realms"), "Referrer-Policy": "no-referrer" }); res.end(); return; }
        if (path === "/" || path === "/index.html") { res.writeHead(308, { Location: "/home" }); res.end(); return; }
        if (path.startsWith("/api/")) { next(); return; }
        if (path.startsWith("/assets/") || path.startsWith("/licenses/") || iconPaths.has(path) || path === "/robots.txt" || path === "/sitemap.xml" || path === "/llms.txt") { next(); return; }
        const file = staticPaths.has(path) ? `${path}.html` : privatePath(path) ? "/private.html" : "/404.html";
        try {
          const html = await readFile(resolve(server.config.root, server.config.build.outDir, `.${file}`), "utf8");
          const status = staticPaths.has(path) || privatePath(path) ? 200 : 404;
          res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", ...(!metadataForPath(path).index ? { "X-Robots-Tag": "noindex, follow" } : {}) });
          res.end(html);
        } catch (error) { next(error); }
      });
    },
  };
}
