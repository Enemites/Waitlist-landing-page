# Supabase to Neon migration

The landing page APIs use the server-only `DATABASE_URL` environment variable.
Production points to project `floral-flower-85390584`, branch
`br-calm-union-b8tdhpq9`, database `neondb`. Preview and development use an
isolated branch. No database credentials belong in source control or `VITE_`
environment variables.

The migrated application schemas are `public`, `drizzle`, and `graphile_worker`.
The snapshot contains 37 tables and 133 rows, including 21 waitlist registrations.
All table row counts and checksums matched after import. Checksums include every
column, preserve JSON text, and order rows with the PostgreSQL `C` collation.
Column definitions/defaults, primary/unique/foreign/check constraints, indexes,
enum definitions, functions, triggers, and the view also matched. All four
sequence values and `is_called` flags matched. A verification branch was checked
before importing the same snapshot into production.

This copies the application database snapshot. Supabase-managed service schemas
such as Auth, Storage, Realtime, and Vault are outside this migration. Database
ownership uses the Neon owner; the source runs PostgreSQL 17 and Neon runs
PostgreSQL 18. This is not continuous replication of subsequent Supabase writes.

Forms use the existing `is_active` and `updated_at` columns for archival. API
responses retain the `deleted_at` field, calculated from these columns. Request
handlers no longer create or alter database tables, preserving the copied schema.

For local development, set a pooled Neon URL in the ignored `.env.local` file
and launch Vite with the environment loaded:

```sh
node --env-file=.env.local node_modules/vite/bin/vite.js --host 0.0.0.0
```

Database connections enforce certificate verification and use a 10-second
connection timeout. Production build validation runs with `npm run build`.
