import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";
import { createServer } from "node:net";
import { mkdir, writeFile } from "node:fs/promises";

const origin = process.argv[2] || "http://127.0.0.1:5174";
const label = process.argv[3] || "current";
if (!/^[a-z0-9-]+$/.test(label)) throw new Error("Use a simple label for the report.");
await mkdir("seo-artifacts", { recursive: true });
const socket = createServer();
await new Promise(resolve => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const browser = await chromium.launch({ headless: true, args: [`--remote-debugging-port=${port}`] });
try {
  for (const route of ["/home", "/arena"]) {
    const result = await lighthouse(`${origin}${route}`, { port, output: "json", logLevel: "error", onlyCategories: ["performance", "accessibility", "best-practices", "seo"] });
    await writeFile(`seo-artifacts/${label}-${route.slice(1)}.json`, result.report);
    const audits = result.lhr.audits;
    console.log(JSON.stringify({ label, route, scores: Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])), LCPms: Math.round(audits["largest-contentful-paint"].numericValue), CLS: audits["cumulative-layout-shift"].numericValue, TBTms: Math.round(audits["total-blocking-time"].numericValue), failed: Object.entries(audits).filter(([, audit]) => audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== "informative").map(([id]) => id) }));
  }
} finally { await browser.close(); }
