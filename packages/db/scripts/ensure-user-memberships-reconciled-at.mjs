import postgres from "postgres";

import { isAlterPermissionDenied } from "./ensure-user-memberships-reconciled-at-lib.mjs";

/**
 * Best-effort prod ensure for memberships_reconciled_at (0013_workos_households).
 * PLANETSCALE_* deploy credentials may lack ALTER privilege on "user" (42501).
 * In that case warn and exit 0 so Alchemy deploy still ships Worker code.
 * First-login ensureUserProjection no longer requires this column in its INSERT.
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
  let alterPermissionDenied = false;
  try {
    await sql.unsafe(
      'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "memberships_reconciled_at" timestamp with time zone',
    );
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    if (isAlterPermissionDenied(error)) {
      alterPermissionDenied = true;
      console.warn(
        JSON.stringify({
          warning: "alter_permission_denied",
          code: "42501",
          column: "memberships_reconciled_at",
          message: error.message,
        }),
      );
    } else {
      throw error;
    }
  }

  const rows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user'
      AND column_name = 'memberships_reconciled_at'
  `;
  const present = rows.length === 1;
  console.log(
    JSON.stringify(
      {
        ok: present || alterPermissionDenied,
        column: "memberships_reconciled_at",
        present,
        alter_permission_denied: alterPermissionDenied,
      },
      null,
      2,
    ),
  );
  // Hard-fail only when ALTER was attempted without permission denial yet column is still missing.
  if (!present && !alterPermissionDenied) {
    process.exitCode = 1;
  }
} finally {
  await sql.end();
}
