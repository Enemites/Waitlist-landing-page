import { handleGetFormSubmissions } from "../../forms";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
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
    const parts = url.split("/api/forms/")[1]?.split("/") || [];
    slug = parts[0];
  }

  if (!slug) {
    res.status(400).json({ success: false, message: "Missing form slug parameter." });
    return;
  }

  const authHeader = req.headers["authorization"] || req.headers["x-api-key"];

  try {
    if (req.method === "GET") {
      const result = await handleGetFormSubmissions(slug, authHeader);
      res.status(result.status).json(result.data);
      return;
    }
    res.status(405).json({ success: false, message: "Method not allowed." });
  } catch (err: any) {
    console.error(`Error in /api/forms/${slug}/submissions:`, err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
