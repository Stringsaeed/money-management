import postgres from "postgres";

import {
  buildSchemaVerificationResult,
  readSchemaSnapshot,
} from "./verify-post-cutover-schema-lib.mjs";
import { loadJournalMigrations } from "./run-postgres-migration.mjs";

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

  // The Worker and Hyperdrive use the pooled app connection on 6432. Keep the
  // verifier on that same path and credential set so a deploy cannot pass by
  // checking a different branch or a privileged direct connection.
  const url = new URL(`postgresql://${host}:6432/${database}`);
  url.username = user;
  url.password = password;
  url.searchParams.set("sslmode", "prefer");
  return url.toString();
}

function databaseErrorCode(error) {
  if (!(error instanceof Error)) return "";
  const code = "code" in error ? error.code : undefined;
  return code ? String(code) : "";
}

async function main() {
  let sql;
  try {
    const expectedMigrations = loadJournalMigrations();
    const connectionUrl = new URL(connectionStringFromEnv());
    // sslrootcert is a client-side libpq option and is not accepted by the
    // server. The verifier does not need to inspect or print any URL values.
    connectionUrl.searchParams.delete("sslrootcert");

    sql = postgres(connectionUrl.toString(), { max: 1, ssl: "prefer" });
    const snapshot = await readSchemaSnapshot(sql);
    const result = buildSchemaVerificationResult(snapshot, { expectedMigrations });
    console.log(JSON.stringify(result, null, 2));

    if (!result.ok) {
      console.error(
        `Post-cutover schema verification failed; missing objects: ${result.missing.join(", ")}. Apply the protected Postgres migration workflow before deploying the Worker.`,
      );
      process.exitCode = 1;
    }
  } catch (error) {
    const code = databaseErrorCode(error);
    console.error(
      `Post-cutover schema verification could not complete${code ? ` (database error ${code})` : ""}.`,
    );
    process.exitCode = 1;
  } finally {
    if (sql) await sql.end();
  }
}

await main();
