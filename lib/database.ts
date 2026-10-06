import pg from "pg";

let pool: pg.Pool | null = null;

export function getDatabasePool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL must be configured with the Neon PostgreSQL connection string.");
    }

    const url = new URL(connectionString);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
    }
    url.searchParams.set("sslmode", "verify-full");

    pool = new pg.Pool({
      connectionString: url.toString(),
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}
