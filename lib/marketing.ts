import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getDatabasePool } from "./database.js";
import { isEligibleAgeGroup, PRIVACY_NOTICE_VERSION } from "../shared/privacy.js";

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
function signingKey() {
  const key = process.env.MARKETING_UNSUBSCRIBE_SECRET;
  if (!key || Buffer.byteLength(key) < 32) throw new Error("Configure a server-only MARKETING_UNSUBSCRIBE_SECRET of at least 32 bytes.");
  return key;
}
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function emailHash(email: string) { return createHash("sha256").update(email.trim().toLowerCase()).digest("hex"); }
export function createUnsubscribeToken(id: string, email: string) {
  if (!uuidPattern.test(id)) throw new Error("Invalid recipient ID.");
  const body = `${id}.${emailHash(email)}`;
  return `${body}.${createHmac("sha256", signingKey()).update(body).digest("hex")}`;
}
export function verifyUnsubscribeToken(token: unknown): { id: string; emailHash: string } | null {
  if (typeof token !== "string" || token.length > 200) return null;
  const [id, hash, signature, extra] = token.split(".");
  if (extra !== undefined || !uuidPattern.test(id || "") || !/^[a-f0-9]{64}$/.test(hash || "") || !/^[a-f0-9]{64}$/.test(signature || "")) return null;
  const expected = createHmac("sha256", signingKey()).update(`${id}.${hash}`).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) return null;
  return { id, emailHash: hash };
}
export async function unsubscribe(token: unknown) {
  const verified = verifyUnsubscribeToken(token);
  if (!verified) return false;
  // One atomic statement: bound to the email at send time, idempotent, no login.
  const result = await getDatabasePool().query(
    `UPDATE public.waitlist SET receive_updates = false,
       unsubscribed_at = COALESCE(unsubscribed_at, NOW())
     WHERE id = $1 AND encode(sha256(convert_to(lower(trim(email)), 'UTF8')), 'hex') = $2
     RETURNING id`, [verified.id, verified.emailHash]);
  return result.rowCount === 1;
}
export interface MarketingContent { subject: string; message: string; }
export function renderMarketingEmail(recipient: { id: string; email: string }, content: MarketingContent) {
  const operator = process.env.MARKETING_OPERATOR_NAME?.trim();
  const address = process.env.MARKETING_POSTAL_ADDRESS?.trim();
  const configuredUrl = process.env.PUBLIC_SITE_URL?.trim();
  if (!operator || !address || !configuredUrl) throw new Error("Marketing is blocked until operator name, valid postal address, and public site URL are configured.");
  const site = new URL(configuredUrl);
  if (site.protocol !== "https:" || site.username || site.password || site.search || site.hash || site.pathname !== "/") throw new Error("PUBLIC_SITE_URL must be an HTTPS origin.");
  if (!content.subject.trim() || /[\r\n]/.test(content.subject)) throw new Error("Use a nonempty, single-line marketing subject.");
  const link = new URL("/api/unsubscribe", site);
  link.searchParams.set("token", createUnsubscribeToken(recipient.id, recipient.email));
  const unsubscribeUrl = link.toString();
  return {
    to: recipient.email,
    subject: content.subject,
    text: `${content.message}\n\nMarketing email from ${operator}.\n${address}\nUnsubscribe: ${unsubscribeUrl}`,
    html: `<p>${escapeHtml(content.message).replace(/\n/g, "<br>")}</p><hr><p>Marketing email from ${escapeHtml(operator)}.</p><p>${escapeHtml(address).replace(/\n/g, "<br>")}</p><p><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe from marketing emails</a></p>`,
    headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}
// Every future sender must call this immediately before each send. No bulk export or
// sender exists here. A footer alone never grants consent or defeats suppression.
export async function prepareMarketingEmail(recipientId: string, content: MarketingContent) {
  const result = await getDatabasePool().query(
    `SELECT id, email, age_group FROM public.waitlist
     WHERE id = $1 AND receive_updates IS TRUE AND unsubscribed_at IS NULL
       AND marketing_consent_at IS NOT NULL AND marketing_consent_version = $2
       AND privacy_notice_version = $2 AND age_group IN ('13-17', '18-20', '20+')`,
    [recipientId, PRIVACY_NOTICE_VERSION]);
  const recipient = result.rows[0];
  if (!recipient || !isEligibleAgeGroup(recipient.age_group)) throw new Error("Recipient has no current, eligible marketing consent.");
  return renderMarketingEmail(recipient, content);
}
