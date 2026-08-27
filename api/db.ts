import pg from "pg";

const { Pool } = pg;

const defaultDbUrl =
  "postgresql://postgres.rwfiesbkxxaurdghkfvv:8rpiZ%21MRTfq2kw%2F@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

export const ENEMITES_API_KEY =
  process.env.ENEMITES_API_KEY ||
  "enemites_sec_8f94d1b7a2e84c90bc5e8a719d3f562e8490a1bc7e39d481";

let pool: pg.Pool | null = null;

export function getDbPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.SUPABASE || defaultDbUrl;
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

// Auto-initialize enemites tables if they do not exist
let schemaInitialized = false;

export async function ensureEnemitesSchema() {
  if (schemaInitialized) return;
  const db = getDbPool();
  const client = await db.connect();
  try {
    // 1. enemites_forms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.enemites_forms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        questions JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT true,
        expires_at TIMESTAMPTZ NULL, -- NULL means endless / never expires
        metadata JSONB NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_enemites_forms_slug ON public.enemites_forms(slug);
    `);

    // 2. enemites_form_submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.enemites_form_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id UUID REFERENCES public.enemites_forms(id) ON DELETE CASCADE,
        form_slug VARCHAR(255) NOT NULL,
        responses JSONB NOT NULL DEFAULT '{}'::jsonb,
        respondent_info JSONB NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_enemites_submissions_form_slug ON public.enemites_form_submissions(form_slug);
    `);

    schemaInitialized = true;
  } catch (err) {
    console.error("Failed to ensure enemites schema:", err);
  } finally {
    client.release();
  }
}
