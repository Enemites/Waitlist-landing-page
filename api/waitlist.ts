import type { IncomingMessage, ServerResponse } from "node:http";
import pg from "pg";

const { Pool } = pg;

const defaultDbUrl =
  "postgresql://postgres.rwfiesbkxxaurdghkfvv:8rpiZ%21MRTfq2kw%2F@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

let pool: pg.Pool | null = null;

function getPool() {
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

export interface WaitlistPayload {
  name: string;
  number: string;
  email: string;
  age_group: string;
  receive_updates?: boolean;
}

export async function handleWaitlistSubmission(payload: WaitlistPayload) {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const phone = typeof payload.number === "string" ? payload.number.trim().replace(/\s+/g, "") : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const ageGroup = typeof payload.age_group === "string" ? payload.age_group.trim() : "";
  const receiveUpdates = Boolean(payload.receive_updates);

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

  const allowedAgeGroups = ["<10", "10-18", "18-20", "20+"];
  if (!ageGroup || !allowedAgeGroups.includes(ageGroup)) {
    return {
      status: 400,
      data: { success: false, message: "Please select an age group." },
    };
  }

  const db = getPool();
  const client = await db.connect();

  try {
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

    // 3. Insert new entry
    const insertResult = await client.query(
      `INSERT INTO public.waitlist (name, phone_number, email, age_group, receive_updates, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, created_at`,
      [name, phone, email, ageGroup, receiveUpdates]
    );

    return {
      status: 201,
      data: {
        success: true,
        message: "You have been successfully added to the waitlist! We'll keep you updated on our launch.",
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

    console.error("Database waitlist error:", error);
    return {
      status: 500,
      data: {
        success: false,
        message: "An error occurred while joining the waitlist. Please try again later.",
      },
    };
  } finally {
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

    const result = await handleWaitlistSubmission(body);
    res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error("Unhandled handler error:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
