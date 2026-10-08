import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { handleWaitlistSubmission } from "../api/waitlist";
import { handleSubmitForm } from "../api/forms";
import unsubscribeHandler from "../api/unsubscribe";
import { getDatabasePool } from "../lib/database";
import { createUnsubscribeToken, verifyUnsubscribeToken, renderMarketingEmail, prepareMarketingEmail, unsubscribe } from "../lib/marketing";

process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
process.env.MARKETING_UNSUBSCRIBE_SECRET = "test-only-secret-at-least-thirty-two-bytes";
const pool = getDatabasePool();
const id = "00000000-0000-4000-8000-000000000001";
const payload = { name: "Test Learner", number: "+620000000000", email: "test@example.com", age_group: "13-17", receive_updates: true };

test("waitlist and questionnaire reject under-13, ambiguous legacy, absent and forged age before accessing database", async () => {
  const connect = mock.method(pool, "connect", () => { throw new Error("Database must not be reached"); });
  try {
    for (const age of ["under-13", "<10", "10-18", "", undefined, 13, true, " 13-17", "13-17 ", "adult"]) {
      assert.equal((await handleWaitlistSubmission({ ...payload, age_group: age } as any)).status, 400);
      assert.equal((await handleSubmitForm("survey", { responses: {}, age_group: age } as any)).status, 400);
    }
    assert.equal((await handleWaitlistSubmission(null as any)).status, 400);
    assert.equal((await handleSubmitForm("survey", null as any)).status, 400);
    assert.equal(connect.mock.callCount(), 0);
  } finally { connect.mock.restore(); }
});

test("truthy strings cannot grant marketing consent", async () => {
  const connect = mock.method(pool, "connect", () => { throw new Error("Database must not be reached"); });
  try {
    assert.equal((await handleWaitlistSubmission({ ...payload, receive_updates: "false" } as any)).status, 400);
    assert.equal(connect.mock.callCount(), 0);
  } finally { connect.mock.restore(); }
});

test("accepted waitlist inserts carry explicit consent and ignore supplied device metadata", async () => {
  const calls: { sql: string; values: any[] }[] = [];
  const connect = mock.method(pool, "connect", async () => ({
    query: async (sql: string, values: any[]) => { calls.push({ sql, values }); return { rows: sql.startsWith("SELECT") ? [] : [{ id }] }; },
    release() {},
  }));
  try {
    const result = await handleWaitlistSubmission({ ...payload, client_meta: { userAgent: "sensitive device", timezone: "sensitive location" } }, { headers: { "x-forwarded-for": "192.0.2.1" } });
    assert.equal(result.status, 201);
    assert.deepEqual(calls.at(-1)?.values, [payload.name, payload.number, payload.email, "13-17", true, "2026-10-08"]);
    assert.ok(!JSON.stringify(calls).includes("sensitive"));
    assert.ok(!JSON.stringify(calls).includes("192.0.2.1"));
  } finally { connect.mock.restore(); }
});

test("unsubscribe tokens resist tampering and contain no plaintext email", () => {
  const token = createUnsubscribeToken(id, payload.email);
  assert.equal(verifyUnsubscribeToken(token)?.id, id);
  assert.ok(!token.includes(payload.email));
  assert.equal(verifyUnsubscribeToken(token.slice(0, -1) + (token.endsWith("a") ? "b" : "a")), null);
  assert.equal(verifyUnsubscribeToken(token + ".extra"), null);
  assert.equal(verifyUnsubscribeToken("malformed"), null);
});

test("marketing fails closed without real operator configuration and includes escaped footers in both formats", () => {
  delete process.env.MARKETING_POSTAL_ADDRESS;
  assert.throws(() => renderMarketingEmail({ id, email: payload.email }, { subject: "Launch", message: "News" }), /blocked/);
  process.env.MARKETING_OPERATOR_NAME = "TEST OPERATOR";
  process.env.MARKETING_POSTAL_ADDRESS = "TEST ADDRESS (not a production address)";
  process.env.PUBLIC_SITE_URL = "https://example.com";
  const email = renderMarketingEmail({ id, email: payload.email }, { subject: "Launch", message: "<script>bad</script>" });
  assert.ok(email.text.includes(process.env.MARKETING_POSTAL_ADDRESS));
  assert.ok(email.html.includes(process.env.MARKETING_POSTAL_ADDRESS));
  assert.ok(email.html.includes("&lt;script&gt;"));
  assert.ok(!email.html.includes("<script>"));
  assert.ok(email.headers["List-Unsubscribe"].includes("https://example.com/api/unsubscribe?token="));
  process.env.PUBLIC_SITE_URL = "http://example.com";
  assert.throws(() => renderMarketingEmail({ id, email: payload.email }, { subject: "Launch", message: "News" }), /HTTPS/);
  process.env.PUBLIC_SITE_URL = "https://example.com";
});

test("send preparation refuses missing consent or suppressed recipients", async () => {
  const query = mock.method(pool, "query", async () => ({ rows: [] }));
  try { await assert.rejects(prepareMarketingEmail(id, { subject: "Launch", message: "News" }), /consent/); }
  finally { query.mock.restore(); }
});

test("GET unsubscribe confirmation does not change recipient data; POST suppresses", async () => {
  const query = mock.method(pool, "query", async () => ({ rowCount: 1, rows: [{ id }] }));
  const token = createUnsubscribeToken(id, payload.email);
  const response = () => ({ statusCode: 0, headers: {} as Record<string, string>, body: "", setHeader(k: string, v: string) { this.headers[k] = v; }, end(body: string) { this.body = body; } });
  try {
    const get = response();
    await unsubscribeHandler({ method: "GET", url: `/api/unsubscribe?token=${token}` }, get);
    assert.equal(get.statusCode, 200);
    assert.ok(get.body.includes('method="post"'));
    assert.equal(query.mock.callCount(), 0);
    assert.equal(get.headers["Referrer-Policy"], "no-referrer");
    const post = response();
    await unsubscribeHandler({ method: "POST", url: `/api/unsubscribe?token=${token}` }, post);
    assert.equal(post.statusCode, 200);
    assert.ok(post.body.includes("unsubscribed"));
    assert.equal(query.mock.callCount(), 1);
    assert.equal(await unsubscribe("forged"), false);
    assert.equal(query.mock.callCount(), 1);
  } finally { query.mock.restore(); }
});
