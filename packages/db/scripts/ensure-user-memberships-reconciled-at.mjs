import postgres from "postgres";

/**
 * Idempotent prod/schema ensure for the WorkOS user projection column added in
 * 0013_workos_households.sql. Drizzle's user insert lists this column; if it is
 * missing, ensureUserProjection fails with PG 42703 before ON CONFLICT runs.
 */
if (process.env.APPROVE_USER_SCHEMA_ENSURE !== "listmine-500") {
  throw new Error("Refusing to alter user schema without APPROVE_USER_SCHEMA_ENSURE=listmine-500.");
}

function connectionStringFromEnv() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const host = process.env.PLANETSCALE_HOST?.trim();
  const database = process.env.PLANETSCALE_DATABASE?.trim() || "postgres";
  const user = process.env.PLANETSCALE_USER?.trim();
  const password = process.env.PLANETSCALE_PASSWORD ?? "";
  if (!host || !user) {
    throw new Error("DATABASE_URL or PLANETSCALE_HOST + PLANETSCALE_USER are required.");
  }
  const url = new URL(`postgresql://${host}:6432/${database}`);
  url.username = user;
  url.password = password;
  url.searchParams.set("sslmode", "prefer");
  return url.toString();
}

const connectionUrl = new URL(connectionStringFromEnv());
connectionUrl.searchParams.delete("sslrootcert");

const sql = postgres(connectionUrl.toString(), { max: 1, ssl: "prefer" });

try {
  await sql.unsafe(
    'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "memberships_reconciled_at" timestamp with time zone',
  );
  const rows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user'
      AND column_name = 'memberships_reconciled_at'
  `;
  console.log(
    JSON.stringify(
      {
        ok: rows.length === 1,
        column: "memberships_reconciled_at",
        present: rows.length === 1,
      },
      null,
      2,
    ),
  );
  if (rows.length !== 1) {
    process.exitCode = 1;
  }
} finally {
  await sql.end();
}
