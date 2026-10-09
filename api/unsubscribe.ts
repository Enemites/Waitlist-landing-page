import { escapeHtml, unsubscribe, verifyUnsubscribeToken } from "../lib/marketing.js";

// Both a human confirmation page (GET) and RFC 8058 one-click unsubscribe (POST).
// GET does not change consent: email scanners may open links automatically.
export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Content-Security-Policy", "default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  const respond = (status: number, message: string, form = "") => {
    res.statusCode = status;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Enemites email preferences</title></head><body><main><h1>Email preferences</h1><p>${escapeHtml(message)}</p>${form}</main></body></html>`);
  };
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    respond(405, "Use the unsubscribe link in your email.");
    return;
  }
  try {
    const url = new URL(req.url || "/", "https://localhost");
    const token = url.searchParams.get("token");
    if (!verifyUnsubscribeToken(token)) { respond(400, "This unsubscribe link is invalid. Use the link in your email or contact support@enemites.com."); return; }
    if (req.method === "GET") {
      respond(200, "Stop Enemites launch notifications and additional marketing emails. No login is required.", `<form method="post" action="/api/unsubscribe?token=${escapeHtml(encodeURIComponent(token!))}"><button type="submit">Unsubscribe</button></form>`);
      return;
    }
    const success = await unsubscribe(token);
    respond(success ? 200 : 400, success ? "You have been unsubscribed from marketing emails." : "This link is no longer valid. Contact support@enemites.com.");
  } catch {
    respond(503, "Email preferences are temporarily unavailable. Please retry or contact support@enemites.com.");
  }
}
