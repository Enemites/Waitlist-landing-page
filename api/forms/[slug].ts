import { handleGetFormBySlug, handleSubmitForm, handleDeleteForm } from "../forms";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-API-Key"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const query = req.query || {};
  let slug = query.slug as string;
  if (!slug) {
    const url = req.url || "";
    slug = (url.split("/api/forms/")[1] || "").split("?")[0].split("/")[0];
  }

  if (!slug) {
    res.status(400).json({ success: false, message: "Missing form slug parameter." });
    return;
  }

  const authHeader = req.headers["authorization"] || req.headers["x-api-key"];

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    if (req.method === "GET") {
      const result = await handleGetFormBySlug(slug);
      res.status(result.status).json(result.data);
      return;
    }

    if (req.method === "POST") {
      const result = await handleSubmitForm(slug, body || {});
      res.status(result.status).json(result.data);
      return;
    }

    if (req.method === "DELETE") {
      const result = await handleDeleteForm(slug, authHeader);
      res.status(result.status).json(result.data);
      return;
    }

    res.status(405).json({ success: false, message: "Method not allowed." });
  } catch (err: any) {
    console.error(`Error in /api/forms/${slug}:`, err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
