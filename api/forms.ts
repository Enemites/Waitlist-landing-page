import pg from "pg";

const { Pool } = pg;

const defaultDbUrl =
  "postgresql://postgres.rwfiesbkxxaurdghkfvv:8rpiZ%21MRTfq2kw%2F@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

export const ENEMITES_API_KEY =
  process.env.ENEMITES_API_KEY ||
  "enemites_sec_8f94d1b7a2e84c90bc5e8a719d3f562e8490a1bc7e39d481";

let pool: pg.Pool | null = null;

function getConnectionString(): string {
  const envDb = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE || "";
  if (envDb.startsWith("postgres://") || envDb.startsWith("postgresql://")) {
    return envDb;
  }
  return defaultDbUrl;
}

export function getDbPool(): pg.Pool {
  if (!pool) {
    const connectionString = getConnectionString();
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

// Auto-initialize and migrate Enemites tables
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
        expires_at TIMESTAMPTZ NULL,
        metadata JSONB NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_enemites_forms_slug ON public.enemites_forms(slug);
      ALTER TABLE public.enemites_forms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
    `);

    // 2. enemites_form_submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.enemites_form_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id UUID REFERENCES public.enemites_forms(id) ON DELETE CASCADE,
        form_slug VARCHAR(255) NOT NULL,
        responses JSONB NOT NULL DEFAULT '{}'::jsonb,
        respondent_info JSONB NULL DEFAULT '{}'::jsonb,
        ip_address VARCHAR(100),
        country VARCHAR(150),
        city VARCHAR(150),
        region VARCHAR(150),
        device_type VARCHAR(50),
        browser VARCHAR(100),
        os VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE public.enemites_form_submissions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100);
      ALTER TABLE public.enemites_form_submissions ADD COLUMN IF NOT EXISTS country VARCHAR(150);
      ALTER TABLE public.enemites_form_submissions ADD COLUMN IF NOT EXISTS city VARCHAR(150);
      ALTER TABLE public.enemites_form_submissions ADD COLUMN IF NOT EXISTS region VARCHAR(150);
      ALTER TABLE public.enemites_form_submissions ADD COLUMN IF NOT EXISTS device_type VARCHAR(50);
      ALTER TABLE public.enemites_form_submissions ADD COLUMN IF NOT EXISTS browser VARCHAR(100);
      ALTER TABLE public.enemites_form_submissions ADD COLUMN IF NOT EXISTS os VARCHAR(100);

      CREATE INDEX IF NOT EXISTS idx_enemites_submissions_form_slug ON public.enemites_form_submissions(form_slug);
    `);

    schemaInitialized = true;
  } catch (err) {
    console.error("Failed to ensure enemites schema:", err);
  } finally {
    client.release();
  }
}

export interface FormQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "radio" | "checkbox" | "rating" | "select" | "email" | "number" | "phone";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  helperText?: string;
}

export interface CreateFormPayload {
  title: string;
  description?: string;
  slug: string;
  questions: FormQuestion[];
  expires_at?: string | null;
  metadata?: Record<string, any>;
}

export interface SubmitFormPayload {
  responses: Record<string, any>;
  respondent_info?: {
    name?: string;
    email?: string;
    userAgent?: string;
    timezone?: string;
    screenResolution?: string;
    language?: string;
    [key: string]: any;
  };
}

export interface RequestMeta {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

// Device & Geolocation parser (IP, Country, City, Region, OS, Browser, Device Type)
export function parseDeviceAndGeo(payload: SubmitFormPayload, meta?: RequestMeta) {
  const headers = meta?.headers || {};

  // 1. User Agent
  const rawUa =
    (typeof headers["user-agent"] === "string" ? headers["user-agent"] : "") ||
    payload.respondent_info?.userAgent ||
    "";

  let device_type = "Desktop";
  let os = "Unknown OS";
  let browser = "Unknown Browser";

  if (rawUa) {
    // Device Type
    if (/ipad|tablet|(android(?!.*mobile))/i.test(rawUa)) {
      device_type = "Tablet";
    } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(rawUa)) {
      device_type = "Mobile";
    }

    // OS
    if (/iphone|ipad|ipod/i.test(rawUa)) {
      const match = rawUa.match(/OS (\d+[._]\d+)/i);
      os = match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS";
    } else if (/android/i.test(rawUa)) {
      const match = rawUa.match(/Android (\d+(\.\d+)?)/i);
      os = match ? `Android ${match[1]}` : "Android";
    } else if (/windows nt 10\.0/i.test(rawUa)) {
      os = "Windows 10/11";
    } else if (/windows nt 6\.3/i.test(rawUa)) {
      os = "Windows 8.1";
    } else if (/windows nt 6\.1/i.test(rawUa)) {
      os = "Windows 7";
    } else if (/windows/i.test(rawUa)) {
      os = "Windows";
    } else if (/mac os x (\d+[._]\d+)/i.test(rawUa)) {
      const match = rawUa.match(/Mac OS X (\d+[._]\d+)/i);
      os = match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS";
    } else if (/macintosh/i.test(rawUa)) {
      os = "macOS";
    } else if (/cros/i.test(rawUa)) {
      os = "Chrome OS";
    } else if (/linux/i.test(rawUa)) {
      os = "Linux";
    }

    // Browser
    if (/samsungbrowser/i.test(rawUa)) {
      browser = "Samsung Internet";
    } else if (/edg([ea])?/i.test(rawUa)) {
      browser = "Microsoft Edge";
    } else if (/opr|opera/i.test(rawUa)) {
      browser = "Opera";
    } else if (/chrome|crios/i.test(rawUa) && !/edg/i.test(rawUa) && !/opr/i.test(rawUa)) {
      browser = "Google Chrome";
    } else if (/firefox|fxios/i.test(rawUa)) {
      browser = "Mozilla Firefox";
    } else if (/safari/i.test(rawUa) && !/chrome|crios/i.test(rawUa)) {
      browser = "Apple Safari";
    }
  }

  // 2. IP Address
  const forwardedFor =
    (typeof headers["x-forwarded-for"] === "string" ? headers["x-forwarded-for"] : "") ||
    (typeof headers["x-real-ip"] === "string" ? headers["x-real-ip"] : "") ||
    meta?.socket?.remoteAddress ||
    "";

  const ip_address = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

  // 3. Country & City Geolocation (Vercel & Cloudflare Edge Headers)
  const rawCountry =
    (typeof headers["x-vercel-ip-country"] === "string" ? headers["x-vercel-ip-country"] : "") ||
    (typeof headers["cf-ipcountry"] === "string" ? headers["cf-ipcountry"] : "") ||
    "";

  const rawCity =
    typeof headers["x-vercel-ip-city"] === "string" ? headers["x-vercel-ip-city"] : "";
  const rawRegion =
    typeof headers["x-vercel-ip-country-region"] === "string"
      ? headers["x-vercel-ip-country-region"]
      : "";

  let country: string | null = null;
  if (rawCountry) {
    try {
      const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
      const fullName = regionNames.of(rawCountry.toUpperCase());
      country = fullName ? `${fullName} (${rawCountry.toUpperCase()})` : rawCountry.toUpperCase();
    } catch {
      country = rawCountry.toUpperCase();
    }
  } else if (payload.respondent_info?.timezone) {
    country = `Local (${payload.respondent_info.timezone})`;
  }

  let city: string | null = null;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      city = rawCity;
    }
  }

  return {
    ip_address,
    country,
    city,
    region: rawRegion || null,
    device_type,
    browser,
    os,
  };
}

export function checkEnemitesAuth(authHeader?: string | string[]): boolean {
  if (!authHeader) return false;
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const cleanToken = headerValue.replace(/^Bearer\s+/i, "").trim();
  return cleanToken === ENEMITES_API_KEY;
}

// 1. Create Form (Agent Only - Auth Required)
export async function handleCreateForm(payload: CreateFormPayload, authHeader?: string | string[]) {
  if (!checkEnemitesAuth(authHeader)) {
    return { status: 401, data: { success: false, message: "Unauthorized. Invalid or missing Enemites API credential." } };
  }

  await ensureEnemitesSchema();

  const title = (payload.title || "").trim();
  let slug = (payload.slug || "").trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
  const description = (payload.description || "").trim();
  const questions = Array.isArray(payload.questions) ? payload.questions : [];
  const expiresAt = payload.expires_at ? new Date(payload.expires_at).toISOString() : null;
  const metadata = payload.metadata || {};

  if (!title) {
    return { status: 400, data: { success: false, message: "Title is required." } };
  }

  if (!slug) {
    slug = title.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 50);
  }

  if (questions.length === 0) {
    return { status: 400, data: { success: false, message: "Form must contain at least one question." } };
  }

  const db = getDbPool();
  const client = await db.connect();

  try {
    const checkSlug = await client.query("SELECT id FROM public.enemites_forms WHERE LOWER(slug) = LOWER($1)", [slug]);
    if (checkSlug.rows.length > 0) {
      return {
        status: 409,
        data: { success: false, message: `A form with slug '${slug}' already exists. Please choose a different slug.` },
      };
    }

    const insertRes = await client.query(
      `INSERT INTO public.enemites_forms (slug, title, description, questions, is_active, expires_at, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, $5, $6, NOW(), NOW())
       RETURNING id, slug, title, description, questions, is_active, expires_at, created_at`,
      [slug, title, description, JSON.stringify(questions), expiresAt, JSON.stringify(metadata)]
    );

    const form = insertRes.rows[0];
    return {
      status: 201,
      data: {
        success: true,
        message: "Enemites form created successfully.",
        form: {
          ...form,
          public_url: `https://enemites.com/form/${form.slug}`,
          is_endless: !form.expires_at,
        },
      },
    };
  } catch (err: any) {
    console.error("Error creating form:", err);
    return { status: 500, data: { success: false, message: err.message || "Failed to create form." } };
  } finally {
    client.release();
  }
}

// 2. Get Form by Slug (Public - Only active non-archived forms)
export async function handleGetFormBySlug(slug: string) {
  await ensureEnemitesSchema();
  const cleanSlug = (slug || "").trim();

  const db = getDbPool();
  const client = await db.connect();

  try {
    const res = await client.query(
      `SELECT id, slug, title, description, questions, is_active, expires_at, deleted_at, created_at
       FROM public.enemites_forms
       WHERE LOWER(slug) = LOWER($1)
       LIMIT 1`,
      [cleanSlug]
    );

    if (res.rows.length === 0) {
      return { status: 404, data: { success: false, message: "Form not found." } };
    }

    const form = res.rows[0];

    // If archived/soft-deleted or inactive, hidden from public
    if (form.deleted_at || !form.is_active) {
      return { status: 404, data: { success: false, message: "Form has been closed or is no longer available." } };
    }

    const now = new Date();
    const isExpired = form.expires_at ? new Date(form.expires_at) < now : false;

    return {
      status: 200,
      data: {
        success: true,
        form: {
          id: form.id,
          slug: form.slug,
          title: form.title,
          description: form.description,
          questions: form.questions,
          is_active: form.is_active,
          expires_at: form.expires_at,
          is_expired: isExpired,
          is_endless: !form.expires_at,
        },
      },
    };
  } catch (err: any) {
    console.error("Error fetching form:", err);
    return { status: 500, data: { success: false, message: "Failed to fetch form." } };
  } finally {
    client.release();
  }
}

// 3. Submit Response (Public - Geolocation and Device Detection)
export async function handleSubmitForm(slug: string, payload: SubmitFormPayload, meta?: RequestMeta) {
  await ensureEnemitesSchema();
  const cleanSlug = (slug || "").trim();

  const db = getDbPool();
  const client = await db.connect();

  try {
    const formRes = await client.query(
      "SELECT id, slug, is_active, expires_at, deleted_at, questions FROM public.enemites_forms WHERE LOWER(slug) = LOWER($1) LIMIT 1",
      [cleanSlug]
    );

    if (formRes.rows.length === 0) {
      return { status: 404, data: { success: false, message: "Form not found." } };
    }

    const form = formRes.rows[0];

    if (!form.is_active || form.deleted_at) {
      return { status: 403, data: { success: false, message: "This form has been closed and is no longer accepting responses." } };
    }

    if (form.expires_at && new Date(form.expires_at) < new Date()) {
      return {
        status: 410,
        data: { success: false, message: "This form has expired and is no longer accepting submissions." },
      };
    }

    const responses = payload.responses || {};
    const geo = parseDeviceAndGeo(payload, meta);

    const respondentInfo = {
      ...(payload.respondent_info || {}),
      ...geo,
    };

    const insertRes = await client.query(
      `INSERT INTO public.enemites_form_submissions 
        (form_id, form_slug, responses, respondent_info, ip_address, country, city, region, device_type, browser, os, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING id, created_at, country, city, device_type`,
      [
        form.id,
        form.slug,
        JSON.stringify(responses),
        JSON.stringify(respondentInfo),
        geo.ip_address,
        geo.country,
        geo.city,
        geo.region,
        geo.device_type,
        geo.browser,
        geo.os,
      ]
    );

    const row = insertRes.rows[0];

    return {
      status: 201,
      data: {
        success: true,
        message: "Thank you! Your response has been submitted successfully.",
        submission_id: row.id,
        submission_meta: {
          country: row.country,
          city: row.city,
          device: row.device_type,
        },
      },
    };
  } catch (err: any) {
    console.error("Error submitting form:", err);
    return { status: 500, data: { success: false, message: "Failed to submit form response." } };
  } finally {
    client.release();
  }
}

// 4. List All Forms (Agent Only - Auth Required)
export async function handleListForms(authHeader?: string | string[]) {
  if (!checkEnemitesAuth(authHeader)) {
    return { status: 401, data: { success: false, message: "Unauthorized." } };
  }

  await ensureEnemitesSchema();

  const db = getDbPool();
  const client = await db.connect();

  try {
    const res = await client.query(`
      SELECT 
        f.id, 
        f.slug, 
        f.title, 
        f.description, 
        f.is_active, 
        f.expires_at, 
        f.deleted_at,
        f.created_at,
        COUNT(s.id)::int AS submission_count
      FROM public.enemites_forms f
      LEFT JOIN public.enemites_form_submissions s ON f.id = s.form_id
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `);

    const now = new Date();
    const forms = res.rows.map((row) => ({
      ...row,
      public_url: `https://enemites.com/form/${row.slug}`,
      is_endless: !row.expires_at,
      is_expired: row.expires_at ? new Date(row.expires_at) < now : false,
      is_archived: Boolean(row.deleted_at || !row.is_active),
    }));

    return { status: 200, data: { success: true, count: forms.length, forms } };
  } catch (err: any) {
    console.error("Error listing forms:", err);
    return { status: 500, data: { success: false, message: "Failed to list forms." } };
  } finally {
    client.release();
  }
}

// 5. Delete Form (Soft Delete / Archive - Preserves Submissions Safely in Supabase)
export async function handleDeleteForm(slug: string, authHeader?: string | string[]) {
  if (!checkEnemitesAuth(authHeader)) {
    return { status: 401, data: { success: false, message: "Unauthorized." } };
  }

  await ensureEnemitesSchema();
  const cleanSlug = (slug || "").trim();

  const db = getDbPool();
  const client = await db.connect();

  try {
    const checkRes = await client.query(
      "SELECT id, slug, title, is_active, deleted_at FROM public.enemites_forms WHERE LOWER(slug) = LOWER($1)",
      [cleanSlug]
    );

    if (checkRes.rows.length === 0) {
      return { status: 404, data: { success: false, message: `Form with slug '${cleanSlug}' not found.` } };
    }

    const form = checkRes.rows[0];

    if (form.deleted_at || !form.is_active) {
      return {
        status: 200,
        data: {
          success: true,
          message: `Form '${form.title}' (${cleanSlug}) is already archived/closed. All past submissions are safely preserved in Supabase.`,
        },
      };
    }

    const updateRes = await client.query(
      "UPDATE public.enemites_forms SET is_active = false, deleted_at = NOW(), updated_at = NOW() WHERE LOWER(slug) = LOWER($1) RETURNING id, slug, title, deleted_at",
      [cleanSlug]
    );

    return {
      status: 200,
      data: {
        success: true,
        message: `Form '${updateRes.rows[0].title}' (${cleanSlug}) has been closed & archived. Public access is disabled, and all submission records remain safely preserved in Supabase.`,
      },
    };
  } catch (err: any) {
    console.error("Error archiving form:", err);
    return { status: 500, data: { success: false, message: "Failed to archive form." } };
  } finally {
    client.release();
  }
}

// 6. Get Form Submissions with Geo Metadata (Agent Only - Auth Required)
export async function handleGetFormSubmissions(slug: string, authHeader?: string | string[]) {
  if (!checkEnemitesAuth(authHeader)) {
    return { status: 401, data: { success: false, message: "Unauthorized." } };
  }

  await ensureEnemitesSchema();
  const cleanSlug = (slug || "").trim();

  const db = getDbPool();
  const client = await db.connect();

  try {
    const formRes = await client.query(
      "SELECT id, slug, title, questions, created_at, expires_at FROM public.enemites_forms WHERE LOWER(slug) = LOWER($1) LIMIT 1",
      [cleanSlug]
    );

    if (formRes.rows.length === 0) {
      return { status: 404, data: { success: false, message: "Form not found." } };
    }

    const form = formRes.rows[0];

    const subsRes = await client.query(
      `SELECT 
        id, 
        responses, 
        respondent_info, 
        ip_address, 
        country, 
        city, 
        region, 
        device_type, 
        browser, 
        os, 
        created_at 
       FROM public.enemites_form_submissions 
       WHERE form_id = $1 
       ORDER BY created_at DESC`,
      [form.id]
    );

    return {
      status: 200,
      data: {
        success: true,
        form: {
          id: form.id,
          slug: form.slug,
          title: form.title,
          questions: form.questions,
        },
        total_submissions: subsRes.rows.length,
        submissions: subsRes.rows,
      },
    };
  } catch (err: any) {
    console.error("Error getting form submissions:", err);
    return { status: 500, data: { success: false, message: "Failed to get submissions." } };
  } finally {
    client.release();
  }
}

// Unified Vercel serverless handler for /api/forms/*
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

  const authHeader = req.headers["authorization"] || req.headers["x-api-key"];
  const url = req.url || "";
  const query = req.query || {};

  let rawSlug = (query.slug as string) || "";
  if (!rawSlug) {
    const afterPrefix = (url.split("/api/forms")[1] || "").split("?")[0].replace(/^\/+/, "");
    rawSlug = afterPrefix;
  }

  const isSubmissions = rawSlug.endsWith("/submissions") || url.includes("/submissions");
  const slug = rawSlug.replace(/\/submissions.*/, "").replace(/^\/+/, "").replace(/\/+$/, "").trim();

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    // 1. Root /api/forms routes
    if (!slug || slug === "index") {
      if (req.method === "POST") {
        const result = await handleCreateForm(body, authHeader);
        res.status(result.status).json(result.data);
        return;
      }
      if (req.method === "GET") {
        const result = await handleListForms(authHeader);
        res.status(result.status).json(result.data);
        return;
      }
      res.status(405).json({ success: false, message: "Method not allowed." });
      return;
    }

    // 2. Submissions route: /api/forms/:slug/submissions
    if (isSubmissions && req.method === "GET") {
      const result = await handleGetFormSubmissions(slug, authHeader);
      res.status(result.status).json(result.data);
      return;
    }

    // 3. Single Form Operations: /api/forms/:slug
    if (req.method === "GET") {
      const result = await handleGetFormBySlug(slug);
      res.status(result.status).json(result.data);
      return;
    }

    if (req.method === "POST") {
      const result = await handleSubmitForm(slug, body, {
        headers: req.headers,
        socket: req.socket,
      });
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
    console.error("Unhandled handler error in /api/forms:", err);
    res.status(500).json({ success: false, message: err?.message || "Internal server error." });
  }
}
