import { isEligibleAgeGroup, PRIVACY_NOTICE_VERSION } from "../shared/privacy.js";
import { getDatabasePool } from "../lib/database.js";

export const ENEMITES_API_KEY = process.env.ENEMITES_API_KEY;

export const getDbPool = getDatabasePool;

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
  age_group: string;
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

// Administrative form operations require the existing server-only credential.
export function checkEnemitesAuth(authHeader?: string | string[]): boolean {
  if (!ENEMITES_API_KEY || !authHeader) return false;
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!headerValue) return false;
  const cleanToken = headerValue.replace(/^Bearer\s+/i, "").trim();
  return cleanToken === ENEMITES_API_KEY;
}

// 1. Create Form (Agent Only - Auth Required)
export async function handleCreateForm(payload: CreateFormPayload, authHeader?: string | string[]) {
  if (!checkEnemitesAuth(authHeader)) {
    return { status: 401, data: { success: false, message: "Unauthorized. Invalid or missing Enemites API credential." } };
  }


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
  const cleanSlug = (slug || "").trim();

  const db = getDbPool();
  const client = await db.connect();

  try {
    const res = await client.query(
      `SELECT id, slug, title, description, questions, is_active, expires_at, CASE WHEN NOT is_active THEN updated_at END AS deleted_at, created_at
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

// 3. Submit Response (Public - eligible ages only, no device/location tracking)
export async function handleSubmitForm(slug: string, payload: SubmitFormPayload, _meta?: RequestMeta) {
  if (!payload || typeof payload !== "object" || !isEligibleAgeGroup(payload.age_group)) {
    return { status: 400, data: { success: false, code: "AGE_NOT_ELIGIBLE", message: "Please complete the age check. We cannot accept responses from anyone under 13." } };
  }
  const cleanSlug = (slug || "").trim();

  const db = getDbPool();
  const client = await db.connect();

  try {
    const formRes = await client.query(
      "SELECT id, slug, is_active, expires_at, CASE WHEN NOT is_active THEN updated_at END AS deleted_at, questions FROM public.enemites_forms WHERE LOWER(slug) = LOWER($1) LIMIT 1",
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
    const respondentInfo = {
      age_group: payload.age_group,
      privacy_notice_version: PRIVACY_NOTICE_VERSION,
    };

    const insertRes = await client.query(
      `INSERT INTO public.enemites_form_submissions 
        (form_id, form_slug, responses, respondent_info, ip_address, country, city, region, device_type, browser, os, created_at)
       VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW())
       RETURNING id, created_at, country, city, device_type`,
      [
        form.id,
        form.slug,
        JSON.stringify(responses),
        JSON.stringify(respondentInfo),
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
        CASE WHEN NOT f.is_active THEN f.updated_at END AS deleted_at,
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

// 5. Delete Form (Soft Delete / Archive - Preserves Submissions Safely in the database)
export async function handleDeleteForm(slug: string, authHeader?: string | string[]) {
  if (!checkEnemitesAuth(authHeader)) {
    return { status: 401, data: { success: false, message: "Unauthorized." } };
  }

  const cleanSlug = (slug || "").trim();

  const db = getDbPool();
  const client = await db.connect();

  try {
    const checkRes = await client.query(
      "SELECT id, slug, title, is_active, CASE WHEN NOT is_active THEN updated_at END AS deleted_at FROM public.enemites_forms WHERE LOWER(slug) = LOWER($1)",
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
          message: `Form '${form.title}' (${cleanSlug}) is already archived/closed. All past submissions are safely preserved in the database.`,
        },
      };
    }

    const updateRes = await client.query(
      "UPDATE public.enemites_forms SET is_active = false, updated_at = NOW() WHERE LOWER(slug) = LOWER($1) RETURNING id, slug, title, updated_at AS deleted_at",
      [cleanSlug]
    );

    return {
      status: 200,
      data: {
        success: true,
        message: `Form '${updateRes.rows[0].title}' (${cleanSlug}) has been closed & archived. Public access is disabled, and all submission records remain safely preserved in the database.`,
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
