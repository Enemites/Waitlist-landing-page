import { createHash, randomBytes } from "node:crypto";
import { getDatabasePool } from "./database.js";
import { escapeHtml } from "./marketing.js";
import { requiresParentRegistration } from "../shared/privacy.js";

export function parentTokenHash(token: unknown): string | null {
  return typeof token === "string" && /^[a-f0-9]{64}$/.test(token)
    ? createHash("sha256").update(token).digest("hex") : null;
}

function emailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.WAITLIST_EMAIL_FROM?.trim();
  const origin = new URL(process.env.PUBLIC_SITE_URL || "https://invalid.invalid");
  if (!apiKey || !from || !process.env.PUBLIC_SITE_URL || origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") {
    throw new Error("Configure RESEND_API_KEY, WAITLIST_EMAIL_FROM, and an HTTPS PUBLIC_SITE_URL.");
  }
  return { apiKey, from, origin };
}

// Only the parent's contact address is collected here, to invite them to register.
// Tokens are opaque, expire after seven days, and are stored only as hashes.
export async function requestParentRegistration(emailValue: unknown, ageGroup: unknown) {
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof ageGroup !== "string" || !requiresParentRegistration(ageGroup)) {
    return { status: 400, data: { success: false, message: "Enter your parent or guardian's email and a supported age group." } };
  }
  let config: ReturnType<typeof emailConfiguration>;
  try { config = emailConfiguration(); }
  catch { return { status: 503, data: { success: false, message: "Parent invitations are temporarily unavailable. Please ask your parent to contact support@enemites.com." } }; }
  const db = getDatabasePool();
  const token = randomBytes(32).toString("hex");
  const hash = parentTokenHash(token)!;
  const recent = await db.query("SELECT count(*)::int AS total FROM public.waitlist_parent_requests WHERE created_at > NOW() - INTERVAL '1 hour'");
  if (recent.rows[0].total >= 60) return { status: 429, data: { success: false, message: "Please try requesting an invitation later." } };
  const reserved = await db.query(
    `INSERT INTO public.waitlist_parent_requests(parent_email, age_group, token_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
     ON CONFLICT (parent_email) DO UPDATE SET age_group = EXCLUDED.age_group, token_hash = EXCLUDED.token_hash,
       created_at = NOW(), expires_at = EXCLUDED.expires_at
     WHERE waitlist_parent_requests.created_at < NOW() - INTERVAL '10 minutes'
     RETURNING id`, [email, ageGroup, hash]);
  // Same response during cooldown, without sending another message or exposing addresses.
  if (!reserved.rows[0]) return { status: 202, data: { success: true, message: "Ask your parent to check their inbox for the invitation. You are added only after they register." } };
  const link = new URL("/arena/parent-waitlist", config.origin);
  link.hash = token;
  const message = `Someone requested an Enemites education waitlist invitation for a learner in the ${ageGroup} age group using your email. No learner name, phone number, or email was collected. If you are their parent or legal guardian and want launch notifications, open the link and register YOUR OWN contact details. This does not create a child account or authorize learning data collection. If you did not expect this request, ignore it; no waitlist entry is created and the request will expire in seven days. Contact support@enemites.com to request deletion. This invitation is not a marketing subscription.`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `parent-invite/${reserved.rows[0].id}/${hash}` },
      body: JSON.stringify({ from: config.from, to: email, subject: "Parent invitation: Enemites education waitlist",
        text: `${message}\n\nRegister as a parent: ${link}\n\nRead our privacy notice: ${config.origin}arena/privacy-policy`,
        html: `<p>${escapeHtml(message)}</p><p><a href="${escapeHtml(link.toString())}">Review and register as a parent</a></p><p><a href="${config.origin}arena/privacy-policy">Privacy notice</a></p>` }),
    });
    if (!response.ok) throw new Error("Email delivery failed");
  } catch {
    await db.query("DELETE FROM public.waitlist_parent_requests WHERE token_hash = $1", [hash]);
    return { status: 503, data: { success: false, message: "We could not send the parent invitation. Please try again later." } };
  }
  return { status: 202, data: { success: true, message: "Ask your parent to check their inbox for the invitation. You are added only after they register." } };
}

export async function inspectParentInvitation(token: unknown) {
  const hash = parentTokenHash(token);
  if (!hash) return null;
  const result = await getDatabasePool().query(
    "SELECT parent_email, age_group FROM public.waitlist_parent_requests WHERE token_hash = $1 AND expires_at > NOW()", [hash]);
  return result.rows[0] || null;
}
