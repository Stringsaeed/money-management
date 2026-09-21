import { createHash } from "node:crypto";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { serve } from "@hono/node-server";
import { createWorkOSHouseholdDirectory } from "@trove/auth";
import * as schema from "@trove/db/schema/index";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { Hono } from "hono";
import postgres from "postgres";

import { createV2Api } from "../src/v2/app";
import { claimGuestLedgerInTransaction } from "../src/v2/guest-claim";
import { settleV2DueRules } from "../src/v2/recurring";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: resolve(repositoryRoot, "apps/server/.env"), quiet: true });
config({ path: resolve(repositoryRoot, "packages/infra/.env"), quiet: true });
config({ path: resolve(repositoryRoot, "packages/api/.env.next"), quiet: true, override: true });

const dataDirectory = resolve(repositoryRoot, "packages/api/.next-data");
await mkdir(dataDirectory, { recursive: true });
const engine = await PGlite.create(dataDirectory);
await engine.exec(
  "CREATE TABLE IF NOT EXISTS next_dev_migrations (name text PRIMARY KEY, sha256 text NOT NULL)",
);
const migrationDirectory = resolve(repositoryRoot, "packages/db/src/migrations");
const files = (await readdir(migrationDirectory))
  .filter((name) => /^\d+_(v2_|mobile_next)/.test(name) && name.endsWith(".sql"))
  .sort();
for (const name of files) {
  const migration = await readFile(resolve(migrationDirectory, name), "utf8");
  const checksum = createHash("sha256").update(migration).digest("hex");
  const existing = await engine.query<{ sha256: string }>(
    "SELECT sha256 FROM next_dev_migrations WHERE name = $1",
    [name],
  );
  if (existing.rows[0]) {
    if (existing.rows[0].sha256 !== checksum)
      throw new Error(`Local migration ${name} changed after it was applied. Use a new migration.`);
    continue;
  }
  await engine.transaction(async (transaction) => {
    await transaction.exec(migration);
    await transaction.query("INSERT INTO next_dev_migrations (name, sha256) VALUES ($1, $2)", [
      name,
      checksum,
    ]);
  });
}

const socket = new PGLiteSocketServer({ db: engine, host: "127.0.0.1", port: 5412 });
await socket.start();
const client = postgres("postgres://postgres:postgres@127.0.0.1:5412/postgres", {
  max: 1,
  fetch_types: false,
  onnotice: () => undefined,
});
const db = drizzle({ client, schema });
const workos = {
  WORKOS_API_KEY: process.env.WORKOS_API_KEY ?? "",
  WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID ?? "",
  WORKOS_TOKEN_ISSUER: process.env.WORKOS_TOKEN_ISSUER ?? "https://api.workos.com",
  WORKOS_TOKEN_AUDIENCE: process.env.WORKOS_TOKEN_AUDIENCE ?? "",
  WORKOS_AUTH_HOSTNAME: process.env.WORKOS_AUTH_HOSTNAME ?? "auth.trove.ing",
};
const api = new Hono().route(
  "/api/v2",
  createV2Api({
    db,
    guestIssueLimit: 1000,
    workos,
    directory: createWorkOSHouseholdDirectory(workos.WORKOS_API_KEY),
    claimGuestLedger: claimGuestLedgerInTransaction,
    market: {
      keys: {
        stocks: process.env.MARKET_STOCKS_API_KEY ?? "",
        metals: process.env.MARKET_METALS_API_KEY ?? "",
        crypto: process.env.MARKET_CRYPTO_API_KEY ?? "",
      },
    },
  }),
);
const server = serve({ fetch: api.fetch, hostname: "127.0.0.1", port: 3012 });
const settlementTimer = setInterval(() => {
  void settleV2DueRules(db).catch(() =>
    console.error("V2 recurring settlement failed; it will retry on the next interval."),
  );
}, 60_000);
console.log(
  "Trove Next API: http://127.0.0.1:3012/api/v2 (isolated local Postgres; legacy data is not loaded)",
);

const shutdown = async () => {
  clearInterval(settlementTimer);
  server.close();
  await client.end();
  await socket.stop();
  await engine.close();
};
process.once("SIGINT", () => {
  void shutdown();
});
process.once("SIGTERM", () => {
  void shutdown();
});
