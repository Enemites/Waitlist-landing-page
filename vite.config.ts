import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "node:url";
import { handleWaitlistSubmission } from "./api/waitlist";
import {
  handleCreateForm,
  handleGetFormBySlug,
  handleSubmitForm,
  handleListForms,
  handleDeleteForm,
  handleGetFormSubmissions,
} from "./api/forms";

function apiDevMiddleware(): Plugin {
  return {
    name: "api-dev-middleware",
    configureServer(server) {
      // 1. Waitlist API
      server.middlewares.use("/api/waitlist", async (req, res) => {
        if (req.method === "OPTIONS") {
          res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
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
            const result = await handleWaitlistSubmission(parsed, {
              headers: req.headers,
              socket: req.socket,
            });
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

      // 2. Enemites Forms API
      server.middlewares.use("/api/forms", async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization, X-API-Key");

        if (req.method === "OPTIONS") {
          res.writeHead(200);
          res.end();
          return;
        }

        const authHeader = (req.headers["authorization"] || req.headers["x-api-key"]) as string | undefined;
        const url = req.url || "";
        const cleanPath = url.split("?")[0].replace(/^\/+/, "");
        const pathSegments = cleanPath.split("/").filter(Boolean);

        let bodyRaw = "";
        req.on("data", (chunk) => {
          bodyRaw += chunk;
        });

        req.on("end", async () => {
          let body: any = {};
          if (bodyRaw) {
            try {
              body = JSON.parse(bodyRaw);
            } catch {}
          }

          try {
            // POST /api/forms -> Create Form
            if (req.method === "POST" && pathSegments.length === 0) {
              const result = await handleCreateForm(body, authHeader);
              res.writeHead(result.status, { "Content-Type": "application/json" });
              res.end(JSON.stringify(result.data));
              return;
            }

            // GET /api/forms -> List Forms
            if (req.method === "GET" && pathSegments.length === 0) {
              const result = await handleListForms(authHeader);
              res.writeHead(result.status, { "Content-Type": "application/json" });
              res.end(JSON.stringify(result.data));
              return;
            }

            // Submissions query: GET /api/forms/:slug/submissions
            if (req.method === "GET" && pathSegments.length === 2 && pathSegments[1] === "submissions") {
              const slug = pathSegments[0];
              const result = await handleGetFormSubmissions(slug, authHeader);
              res.writeHead(result.status, { "Content-Type": "application/json" });
              res.end(JSON.stringify(result.data));
              return;
            }

            // Single Form routes: /api/forms/:slug
            if (pathSegments.length === 1) {
              const slug = pathSegments[0];

              if (req.method === "GET") {
                const result = await handleGetFormBySlug(slug);
                res.writeHead(result.status, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result.data));
                return;
              }

              if (req.method === "POST") {
                const result = await handleSubmitForm(slug, body);
                res.writeHead(result.status, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result.data));
                return;
              }

              if (req.method === "DELETE") {
                const result = await handleDeleteForm(slug, authHeader);
                res.writeHead(result.status, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result.data));
                return;
              }
            }

            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, message: "API route not found." }));
          } catch (err: any) {
            console.error("Vite Dev Server API Error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, message: err.message || "Internal server error" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevMiddleware()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
