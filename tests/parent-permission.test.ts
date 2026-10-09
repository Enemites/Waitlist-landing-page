import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { requestParentRegistration, inspectParentInvitation, parentTokenHash } from "../lib/parent-permission";
import { handleWaitlistSubmission } from "../api/waitlist";
import { prepareMarketingEmail } from "../lib/marketing";
import cleanupHandler from "../api/parent-permission-cleanup";
import { getDatabasePool } from "../lib/database";

process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
const pool = getDatabasePool();
const id = "00000000-0000-4000-8000-000000000002";
const token = "a".repeat(64);
const payload = { name: "Test Parent", number: "+620000000000", email: "parent@example.com", age_group: "<13", receive_updates: false, parent_token: token, parent_permission: true };

test("missing email configuration returns an honest error without storing a request", async () => {
  delete process.env.RESEND_API_KEY;
  const query = mock.method(pool, "query", () => { throw new Error("No database access expected"); });
  try {
    assert.equal((await requestParentRegistration(payload.email, "<13")).status, 503);
    assert.equal(query.mock.callCount(), 0);
  } finally { query.mock.restore(); }
});

test("invitation stores only parent contact and a token hash; provider receives a scoped invitation", async () => {
  process.env.RESEND_API_KEY = "test-only-key";
  process.env.WAITLIST_EMAIL_FROM = "TEST Enemites <test@example.invalid>";
  process.env.PUBLIC_SITE_URL = "https://example.com";
  const calls: { sql: string; values?: unknown[] }[] = [];
  const query = mock.method(pool, "query", async (sql: string, values?: unknown[]) => {
    calls.push({ sql, values }); return { rows: sql.startsWith("SELECT") ? [{ total: 0 }] : [{ id }] };
  });
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response("{}", { status: 200 }));
  try {
    assert.equal((await requestParentRegistration(" PARENT@example.com ", "<13")).status, 202);
    const email = JSON.parse(fetchMock.mock.calls[0].arguments[1].body);
    const sentToken = email.text.match(/parent-waitlist#([a-f0-9]{64})/)[1];
    assert.equal(calls[1].values?.[0], payload.email);
    assert.equal(calls[1].values?.[2], parentTokenHash(sentToken));
    assert.ok(!JSON.stringify(calls).includes(sentToken));
    assert.ok(email.text.includes("does not create a child account"));
    assert.ok(email.text.includes("ignore it"));
    assert.ok(!JSON.stringify(calls).includes("ip_address"));
  } finally { query.mock.restore(); fetchMock.mock.restore(); }
});

test("cooldown avoids repeat email and failed delivery removes its pending request", async () => {
  const query = mock.method(pool, "query", async (sql: string) => ({ rows: sql.startsWith("SELECT") ? [{ total: 0 }] : [] }));
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response("{}", { status: 503 }));
  try {
    assert.equal((await requestParentRegistration(payload.email, "<13")).status, 202);
    assert.equal(fetchMock.mock.callCount(), 0);
    query.mock.restore();
    const failureQuery = mock.method(pool, "query", async (sql: string) => ({ rows: sql.startsWith("SELECT") ? [{ total: 0 }] : [{ id }] }));
    try {
      assert.equal((await requestParentRegistration(payload.email, "<13")).status, 503);
      assert.ok(failureQuery.mock.calls.at(-1)?.arguments[0].startsWith("DELETE"));
    } finally { failureQuery.mock.restore(); }
  } finally { query.mock.restore(); fetchMock.mock.restore(); }
});

test("parent registration binds email and cohort, records permission, and consumes invitation atomically", async () => {
  const calls: { sql: string; values?: unknown[] }[] = [];
  let pending = true;
  const connect = mock.method(pool, "connect", async () => ({
    query: async (sql: string, values?: unknown[]) => {
      calls.push({ sql, values });
      if (sql.includes("FOR UPDATE")) return { rows: pending ? [{ parent_email: payload.email, age_group: "<13" }] : [] };
      if (sql.startsWith("SELECT")) return { rows: [] };
      if (sql.startsWith("DELETE")) pending = false;
      return { rows: [{ id }] };
    }, release() {},
  }));
  try {
    assert.equal((await handleWaitlistSubmission({ ...payload, email: "child@example.com" })).status, 400);
    assert.equal(calls.at(-1)?.sql, "ROLLBACK");
    assert.equal((await handleWaitlistSubmission(payload)).status, 201);
    const insert = calls.find((call) => call.sql.includes("INSERT INTO public.waitlist"));
    assert.deepEqual(insert?.values, [payload.name, payload.number, payload.email, "<13", false, "2026-10-09", true]);
    assert.equal(calls.at(-1)?.sql, "COMMIT");
    assert.equal((await handleWaitlistSubmission(payload)).status, 400);
    assert.equal(calls.at(-1)?.sql, "ROLLBACK");
  } finally { connect.mock.restore(); }
});

test("expired invitations and forged tokens cannot reveal parent details or authorize registration", async () => {
  const query = mock.method(pool, "query", async () => ({ rows: [] }));
  try {
    assert.equal(await inspectParentInvitation("forged"), null);
    assert.equal(query.mock.callCount(), 0);
    assert.equal(await inspectParentInvitation(token), null);
    assert.ok(query.mock.calls[0].arguments[0].includes("expires_at > NOW()"));
    assert.equal((await handleWaitlistSubmission({ ...payload, parent_token: "forged" })).status, 400);
    assert.equal((await handleWaitlistSubmission({ ...payload, parent_permission: "true" } as any)).status, 400);
  } finally { query.mock.restore(); }
});

test("launch notifications do not require the beyond-launch checkbox or a new consent version", async () => {
  process.env.MARKETING_OPERATOR_NAME = "TEST OPERATOR";
  process.env.MARKETING_POSTAL_ADDRESS = "TEST ADDRESS";
  process.env.MARKETING_UNSUBSCRIBE_SECRET = "test-only-secret-at-least-thirty-two-bytes";
  const query = mock.method(pool, "query", async () => ({ rows: [{ id, email: payload.email, age_group: "20+" }] }));
  try {
    const email = await prepareMarketingEmail(id, { subject: "Launch", message: "Requested launch notice" }, "launch");
    assert.equal(email.to, payload.email);
    assert.deepEqual(query.mock.calls[0].arguments[1], [id, "launch"]);
    assert.ok(!query.mock.calls[0].arguments[0].includes("marketing_consent_version ="));
    assert.ok(query.mock.calls[0].arguments[0].includes("unsubscribed_at IS NULL"));
    assert.ok(email.text.includes("Unsubscribe:"));
  } finally { query.mock.restore(); }
});

test("scheduled cleanup requires authorization and deletes expired pending invitations only", async () => {
  process.env.CRON_SECRET = "test-only-cron-secret";
  const query = mock.method(pool, "query", async () => ({ rowCount: 2 }));
  const response = () => ({ statusCode: 0, setHeader() {}, end() {} });
  try {
    const unauthorized = response(); await cleanupHandler({ method: "GET", headers: {} }, unauthorized);
    assert.equal(unauthorized.statusCode, 401); assert.equal(query.mock.callCount(), 0);
    const authorized = response(); await cleanupHandler({ method: "GET", headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }, authorized);
    assert.equal(authorized.statusCode, 200);
    assert.equal(query.mock.calls[0].arguments[0], "DELETE FROM public.waitlist_parent_requests WHERE expires_at <= NOW()");
  } finally { query.mock.restore(); }
});
