import { readFileSync } from "node:fs";

import postgres from "postgres";

if (process.env.Z6_APPLY_PUBLICATION_APPROVED !== "non-production") {
  throw new Error(
    "Refusing to alter a publication without Z6_APPLY_PUBLICATION_APPROVED=non-production.",
  );
}
const databaseUrl = process.env.Z6_DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("Z6_DATABASE_URL is required.");
const connectionUrl = new URL(databaseUrl);
connectionUrl.searchParams.delete("sslrootcert");

const sql = postgres(connectionUrl.toString(), { max: 1, ssl: "prefer" });
const migrations = ["0009_expand_powersync_publication.sql", "0010_concurrent_change_sequence.sql"];

try {
  for (const name of migrations) {
    const migration = readFileSync(new URL(`../src/migrations/${name}`, import.meta.url), "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) {
      const source = statement.trim();
      if (source) await sql.unsafe(source);
    }
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
