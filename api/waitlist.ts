import { isEligibleAgeGroup, requiresParentRegistration, PRIVACY_NOTICE_VERSION } from "../shared/privacy.js";
import { getDatabasePool } from "../lib/database.js";
import { parentTokenHash } from "../lib/parent-permission.js";

export interface WaitlistPayload {
  name: string;
  number: string;
  email: string;
  age_group: string;
  receive_updates?: boolean;
  parent_token?: string;
  parent_permission?: boolean;
  client_meta?: {
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
  };
}

export interface RequestMeta {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

export async function handleWaitlistSubmission(payload: WaitlistPayload, _meta?: RequestMeta) {
  if (!payload || typeof payload !== "object" || !isEligibleAgeGroup(payload.age_group)) {
    return { status: 400, data: { success: false, code: "INVALID_AGE_GROUP", message: "Please select a valid age group." } };
  }
  const parentRegistration = requiresParentRegistration(payload.age_group);
  const parentHash = parentTokenHash(payload.parent_token);
  if (parentRegistration && (!parentHash || payload.parent_permission !== true)) {
    return { status: 400, data: { success: false, code: "PARENT_REGISTRATION_REQUIRED", message: "Your parent or guardian can register for you using the email invitation." } };
  }
  if (payload.receive_updates !== undefined && typeof payload.receive_updates !== "boolean") {
    return { status: 400, data: { success: false, message: "Email consent must be true or false." } };
  }
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const phone = typeof payload.number === "string" ? payload.number.trim().replace(/\s+/g, "") : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const ageGroup = typeof payload.age_group === "string" ? payload.age_group.trim() : "";
  const receiveUpdates = payload.receive_updates === true;

  // Validation
  if (!name || name.length < 2) {
    return {
      status: 400,
      data: { success: false, message: "Please provide a valid name (at least 2 characters)." },
    };
  }

  if (!phone || phone.length < 6) {
    return {
      status: 400,
      data: { success: false, message: "Please provide a valid phone/WhatsApp number." },
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return {
      status: 400,
      data: { success: false, message: "Please provide a valid email address." },
    };
  }

  const db = getDatabasePool();
  const client = await db.connect();
  let transaction = false;

  try {
    if (parentRegistration) {
      await client.query("BEGIN");
      transaction = true;
      const invitation = await client.query(
        "SELECT parent_email, age_group FROM public.waitlist_parent_requests WHERE token_hash = $1 AND expires_at > NOW() FOR UPDATE", [parentHash]);
      if (!invitation.rows[0] || invitation.rows[0].parent_email !== email || invitation.rows[0].age_group !== ageGroup) {
        return { status: 400, data: { success: false, code: "INVALID_PARENT_INVITATION", message: "This invitation is invalid or expired. Use the email address and age group from the invitation." } };
      }
    }
    // 1. Check if email already exists
    const emailCheck = await client.query(
      "SELECT id FROM public.waitlist WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return {
        status: 409,
        data: {
          success: false,
          field: "email",
          code: "EMAIL_ALREADY_REGISTERED",
          message: "This email is already registered on the waitlist.",
        },
      };
    }

    // 2. Check if phone number already exists
    const phoneCheck = await client.query(
      "SELECT id FROM public.waitlist WHERE phone_number = $1 LIMIT 1",
      [phone]
    );

    if (phoneCheck.rows.length > 0) {
      return {
        status: 409,
        data: {
          success: false,
          field: "number",
          code: "PHONE_ALREADY_REGISTERED",
          message: "This phone number is already registered on the waitlist.",
        },
      };
    }

    // Contact fields belong to the parent for parent-led entries. No raw IP is needed
    // in this waitlist; that does not prohibit future purpose-limited security logging.
    const insertResult = await client.query(
      `INSERT INTO public.waitlist (
        name,
        phone_number,
        email,
        age_group,
        receive_updates,
        ip_address,
        country,
        city,
        device_type,
        operating_system,
        browser,
        user_agent,
        created_at,
        privacy_notice_version,
        marketing_consent_at,
        marketing_consent_version,
        launch_requested_at,
        parent_permission_at,
        parent_permission_version,
        registration_actor
      )
      VALUES ($1, $2, $3, $4, $5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), $6, CASE WHEN $5 THEN NOW() ELSE NULL END, CASE WHEN $5 THEN $6 ELSE NULL END,
        NOW(), CASE WHEN $7 THEN NOW() ELSE NULL END, CASE WHEN $7 THEN $6 ELSE NULL END, CASE WHEN $7 THEN 'parent' ELSE 'self' END)
      RETURNING id, created_at, country, device_type, operating_system, browser`,
      [
        name,
        phone,
        email,
        ageGroup,
        receiveUpdates,
        PRIVACY_NOTICE_VERSION,
        parentRegistration,
      ]
    );
    if (parentRegistration) {
      await client.query("DELETE FROM public.waitlist_parent_requests WHERE token_hash = $1", [parentHash]);
      await client.query("COMMIT");
      transaction = false;
    }

    return {
      status: 201,
      data: {
        success: true,
        message: "You have been added to the waitlist for launch notifications. Additional updates follow your checkbox preference.",
        id: insertResult.rows[0].id,
      },
    };
  } catch (error: any) {
    // Check PostgreSQL unique violation error code (23505)
    if (error?.code === "23505") {
      const detail = error?.detail || "";
      if (detail.includes("email") || error?.constraint?.includes("email")) {
        return {
          status: 409,
          data: {
            success: false,
            field: "email",
            code: "EMAIL_ALREADY_REGISTERED",
            message: "This email is already registered on the waitlist.",
          },
        };
      }
      if (detail.includes("phone") || error?.constraint?.includes("phone")) {
        return {
          status: 409,
          data: {
            success: false,
            field: "number",
            code: "PHONE_ALREADY_REGISTERED",
            message: "This phone number is already registered on the waitlist.",
          },
        };
      }
      return {
        status: 409,
        data: {
          success: false,
          code: "ALREADY_REGISTERED",
          message: "This information is already registered on the waitlist.",
        },
      };
    }

    console.error("Database waitlist error", { code: error?.code });
    return {
      status: 500,
      data: {
        success: false,
        message: "An error occurred while joining the waitlist. Please try again later.",
      },
    };
  } finally {
    if (transaction) await client.query("ROLLBACK");
    client.release();
  }
}

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed. Only POST is supported." });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        // keep as is
      }
    }

    if (!body || typeof body !== "object") {
      res.status(400).json({ success: false, message: "Invalid request payload." });
      return;
    }

    const result = await handleWaitlistSubmission(body, {
      headers: req.headers,
      socket: req.socket,
    });

    res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error("Waitlist request failed", { code: err?.code });
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
