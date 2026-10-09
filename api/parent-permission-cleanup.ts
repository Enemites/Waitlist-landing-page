import { timingSafeEqual } from "node:crypto";
import { getDatabasePool } from "../lib/database.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  const expected = process.env.CRON_SECRET ? Buffer.from(`Bearer ${process.env.CRON_SECRET}`) : null;
  const supplied = Buffer.from(typeof req.headers?.authorization === "string" ? req.headers.authorization : "");
  if (req.method !== "GET" || !expected || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    res.statusCode = 401; res.end(); return;
  }
  try {
    const result = await getDatabasePool().query("DELETE FROM public.waitlist_parent_requests WHERE expires_at <= NOW()");
    res.statusCode = 200; res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ deleted: result.rowCount }));
  } catch { res.statusCode = 503; res.end(); }
}
