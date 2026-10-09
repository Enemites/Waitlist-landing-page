import { defineConfig } from "@playwright/test";
const port = process.env.PLAYWRIGHT_PORT || "5173";
export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`, headless: true },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: `npm run dev -- --port ${port}`, url: `http://127.0.0.1:${port}`, reuseExistingServer: !process.env.CI },
});
