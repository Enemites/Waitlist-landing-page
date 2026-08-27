import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "node:url";
import { handleWaitlistSubmission } from "./api/waitlist";

function waitlistApiPlugin(): Plugin {
  return {
    name: "waitlist-api-dev-middleware",
    configureServer(server) {
      server.middlewares.use("/api/waitlist", async (req, res) => {
        if (req.method === "OPTIONS") {
          res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept",
          });
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.writeHead(405, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, message: "Method not allowed" }));
          return;
        }

        let bodyRaw = "";
        req.on("data", (chunk) => {
          bodyRaw += chunk;
        });
        req.on("end", async () => {
          try {
            const parsed = JSON.parse(bodyRaw || "{}");
            const result = await handleWaitlistSubmission(parsed);
            res.writeHead(result.status, {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            });
            res.end(JSON.stringify(result.data));
          } catch (err: any) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, message: err.message || "Internal error" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), waitlistApiPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
