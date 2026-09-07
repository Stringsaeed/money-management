import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";

import { applyCommand } from "../../packages/api/src/lib/commands/pipeline.ts";
import { user } from "../../packages/db/src/schema/auth.ts";
import { household, membership } from "../../packages/db/src/schema/household.ts";
import { category, ledgerAccount, transaction } from "../../packages/db/src/schema/ledger.ts";
import { householdChange } from "../../packages/db/src/schema/commands.ts";

const OWNER = "user-z2-owner";
const HOUSEHOLD_ID = "household-z2-live";
const ACCOUNT_ID = "acc-z2-live";
const CATEGORY_ID = "cat-z2-live";

function loadEnv(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eqAt = trimmed.indexOf("=");
    out[trimmed.slice(0, eqAt)] = trimmed.slice(eqAt + 1);
  }
  return out;
}

const env = loadEnv(resolve(import.meta.dirname, "../../.audit/z2-staging.env"));
const host = env.PLANETSCALE_HOST;
const userName = env.PLANETSCALE_USER;
const password = env.PLANETSCALE_PASSWORD;
const database = env.PLANETSCALE_DATABASE ?? "postgres";
if (!host || !userName || !password) {
  throw new Error("missing PLANETSCALE_* in .audit/z2-staging.env");
}

const direct = `postgresql://${encodeURIComponent(userName)}:${encodeURIComponent(password)}@${host}:5432/${database}?sslmode=verify-full`;
const pooled = `postgresql://${encodeURIComponent(userName)}:${encodeURIComponent(password)}@${host}:6432/${database}?sslmode=verify-full`;
const url = process.env.Z2_USE_POOLED === "1" ? pooled : direct;

const client = postgres(url, { max: 1, fetch_types: false, ssl: "prefer" });
const db = drizzle({ client });

const commandId = crypto.randomUUID();

await db
  .insert(user)
  .values({
    id: OWNER,
    name: "Z2 Owner",
    email: "z2-owner@example.com",
    emailVerified: true,
  })
  .onConflictDoNothing();

await db
  .insert(household)
  .values({ id: HOUSEHOLD_ID, name: "Z2 Live", createdByUserId: OWNER })
  .onConflictDoNothing();

await db
  .insert(membership)
  .values({
    id: "membership-z2-live",
    userId: OWNER,
    householdId: HOUSEHOLD_ID,
    role: "owner",
    version: 0,
  })
  .onConflictDoNothing();

await db
  .insert(ledgerAccount)
  .values({
    householdId: HOUSEHOLD_ID,
    id: ACCOUNT_ID,
    name: "Z2 Checking",
    type: "bank",
    currency: "USD",
    version: 0,
    ownerUserId: OWNER,
    createdBy: OWNER,
    updatedBy: OWNER,
  })
  .onConflictDoNothing();

await db
  .insert(category)
  .values({
    householdId: HOUSEHOLD_ID,
    id: CATEGORY_ID,
    name: "Z2 Groceries",
    type: "expense",
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  })
  .onConflictDoNothing();

const envelope = {
  commandId,
  householdId: HOUSEHOLD_ID,
  kind: "transaction.create" as const,
  payload: {
    type: "expense",
    amountMinor: 4200,
    date: "2026-09-07",
    accountId: ACCOUNT_ID,
    categoryId: CATEGORY_ID,
    description: "Z2 live coffee",
  },
};

const first = await applyCommand({ db, userId: OWNER, envelope });
const replay = await applyCommand({ db, userId: OWNER, envelope });

const changes = await db
  .select()
  .from(householdChange)
  .where(eq(householdChange.commandId, commandId));
const txns = await db.select().from(transaction).where(eq(transaction.householdId, HOUSEHOLD_ID));

const report = {
  host,
  port: url.includes(":6432/") ? 6432 : 5432,
  firstKind: first.kind,
  firstReplay: "replayed" in first ? first.replayed : false,
  replayKind: replay.kind,
  replayed: "replayed" in replay ? replay.replayed : false,
  householdChanges: changes.length,
  transactions: txns.length,
  commandId,
};

console.log(JSON.stringify(report, null, 2));
if (first.kind !== "applied" || replay.kind !== "applied" || !("replayed" in replay && replay.replayed) || changes.length !== 1) {
  await client.end();
  throw new Error(`live apply failed: ${JSON.stringify(report)}`);
}

await client.end();
