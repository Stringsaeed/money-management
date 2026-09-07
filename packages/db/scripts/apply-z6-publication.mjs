import { readFileSync } from "node:fs";

import postgres from "postgres";

if (process.env.Z6_APPLY_PUBLICATION_APPROVED !== "non-production") {
  throw new Error(
    "Refusing to alter a publication without Z6_APPLY_PUBLICATION_APPROVED=non-production.",
  );
}
const databaseUrl = process.env.Z6_DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("Z6_DATABASE_URL is required.");

const sql = postgres(databaseUrl, { max: 1, ssl: "prefer" });
const migration = readFileSync(
  new URL("../src/migrations/0009_expand_powersync_publication.sql", import.meta.url),
  "utf8",
);

try {
  for (const statement of migration.split("--> statement-breakpoint")) {
    const source = statement.trim();
    if (source) await sql.unsafe(source);
  }
  const rows = await sql`
    SELECT schemaname, tablename
    FROM pg_publication_tables
    WHERE pubname = 'powersync'
    ORDER BY schemaname, tablename
  `;
  console.log(JSON.stringify({ publication: "powersync", tables: rows }, null, 2));
} finally {
  await sql.end();
}
