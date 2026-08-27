import type { IncomingMessage } from "node:http";
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

export function parseDeviceAndGeo(payload: WaitlistPayload, meta?: RequestMeta) {
  const headers = meta?.headers || {};
  
  // 1. User Agent extraction
  const rawUa =
    (typeof headers["user-agent"] === "string" ? headers["user-agent"] : "") ||
    payload.client_meta?.userAgent ||
    "";
  
  let device_type = "Desktop";
  let operating_system = "Unknown OS";
  let browser = "Unknown Browser";

  if (rawUa) {
    // Device Type
    if (/ipad|tablet|(android(?!.*mobile))/i.test(rawUa)) {
      device_type = "Tablet";
    } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(rawUa)) {
      device_type = "Mobile";
    }

    // Operating System
    if (/iphone|ipad|ipod/i.test(rawUa)) {
      const match = rawUa.match(/OS (\d+[._]\d+)/i);
      operating_system = match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS";
    } else if (/android/i.test(rawUa)) {
      const match = rawUa.match(/Android (\d+(\.\d+)?)/i);
      operating_system = match ? `Android ${match[1]}` : "Android";
    } else if (/windows nt 10\.0/i.test(rawUa)) {
      operating_system = "Windows 10/11";
    } else if (/windows nt 6\.3/i.test(rawUa)) {
      operating_system = "Windows 8.1";
    } else if (/windows nt 6\.1/i.test(rawUa)) {
      operating_system = "Windows 7";
    } else if (/windows/i.test(rawUa)) {
      operating_system = "Windows";
    } else if (/mac os x (\d+[._]\d+)/i.test(rawUa)) {
      const match = rawUa.match(/Mac OS X (\d+[._]\d+)/i);
      operating_system = match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS";
    } else if (/macintosh/i.test(rawUa)) {
      operating_system = "macOS";
    } else if (/cros/i.test(rawUa)) {
      operating_system = "Chrome OS";
    } else if (/linux/i.test(rawUa)) {
      operating_system = "Linux";
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

  // 2. IP Address extraction
  const forwardedFor =
    (typeof headers["x-forwarded-for"] === "string" ? headers["x-forwarded-for"] : "") ||
    (typeof headers["x-real-ip"] === "string" ? headers["x-real-ip"] : "") ||
    meta?.socket?.remoteAddress ||
    "";
  
  const ip_address = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

  // 3. Country & City Geolocation extraction (Vercel edge headers / Cloudflare headers)
  const rawCountry =
    (typeof headers["x-vercel-ip-country"] === "string" ? headers["x-vercel-ip-country"] : "") ||
    (typeof headers["cf-ipcountry"] === "string" ? headers["cf-ipcountry"] : "") ||
    "";
  
  const rawCity =
    typeof headers["x-vercel-ip-city"] === "string" ? headers["x-vercel-ip-city"] : "";

  let country: string | null = null;
  if (rawCountry) {
    try {
      const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
      const fullName = regionNames.of(rawCountry.toUpperCase());
      country = fullName ? `${fullName} (${rawCountry.toUpperCase()})` : rawCountry.toUpperCase();
    } catch {
      country = rawCountry.toUpperCase();
    }
  } else if (payload.client_meta?.timezone) {
    // If running in development without proxy headers, fallback to client timezone indicator
    country = `Local (${payload.client_meta.timezone})`;
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
    device_type,
    operating_system,
    browser,
    user_agent: rawUa || null,
  };
}

export async function handleWaitlistSubmission(payload: WaitlistPayload, meta?: RequestMeta) {
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

  // Parse IP, Country, and Device Information
  const deviceAndGeo = parseDeviceAndGeo(payload, meta);

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

    // 3. Insert new entry with IP, Country, and Device Info
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
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id, created_at, country, device_type, operating_system, browser`,
      [
        name,
        phone,
        email,
        ageGroup,
        receiveUpdates,
        deviceAndGeo.ip_address,
        deviceAndGeo.country,
        deviceAndGeo.city,
        deviceAndGeo.device_type,
        deviceAndGeo.operating_system,
        deviceAndGeo.browser,
        deviceAndGeo.user_agent,
      ]
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

    const result = await handleWaitlistSubmission(body, {
      headers: req.headers,
      socket: req.socket,
    });

    res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error("Unhandled handler error:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
