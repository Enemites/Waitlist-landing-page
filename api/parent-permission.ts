import { inspectParentInvitation, requestParentRegistration } from "../lib/parent-permission.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (req.method !== "POST") { res.statusCode = 405; res.setHeader("Allow", "POST"); res.end(); return; }
  res.setHeader("Content-Type", "application/json");
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (body?.action === "request") {
      const result = await requestParentRegistration(body.parent_email, body.age_group);
      res.statusCode = result.status; res.end(JSON.stringify(result.data)); return;
    }
    if (body?.action === "inspect") {
      const invitation = await inspectParentInvitation(body.token);
      res.statusCode = invitation ? 200 : 400;
      res.end(JSON.stringify(invitation ? { success: true, invitation } : { success: false, message: "This invitation is invalid or expired. Request a new invitation from the waitlist page." })); return;
    }
    res.statusCode = 400; res.end(JSON.stringify({ success: false, message: "Invalid invitation request." }));
  } catch {
    res.statusCode = 503; res.end(JSON.stringify({ success: false, message: "Parent invitations are temporarily unavailable. Please try again later." }));
  }
}
