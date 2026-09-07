import assert from "node:assert/strict";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { Worker } from "node:worker_threads";

import { column, Schema, Table } from "@powersync/common";
import { PowerSyncDatabase } from "@powersync/node";
import { importPKCS8, SignJWT } from "jose";
import postgres from "postgres";

const endpoint = required("POWERSYNC_URL");
const kid = required("POWERSYNC_JWT_KID");
const privateKeyFile = required("POWERSYNC_JWT_PRIVATE_KEY_FILE");
const databaseUrl = new URL(required("Z3_LIVE_DATABASE_URL"));
databaseUrl.searchParams.delete("sslrootcert");

const runId = `z3-${Date.now()}`;
const householdId = `${runId}-household`;
const userA = `${runId}-user-a`;
const userB = `${runId}-user-b`;
const userC = `${runId}-user-c`;
const publicAccountId = `${runId}-public-account`;
const privateAccountId = `${runId}-private-account`;
const categoryId = `${runId}-category`;
const publicTransactionId = `${runId}-public-transaction`;
const privateTransactionId = `${runId}-private-transaction`;
const sql = postgres(databaseUrl.toString(), { max: 1 });
const clients = [];

const membership = new Table({
  household_id: column.text,
  user_id: column.text,
});
const accounts = new Table({
  household_id: column.text,
  owner_user_id: column.text,
  visibility: column.text,
});
const categories = new Table({ household_id: column.text });
const transactions = new Table({
  account_id: column.text,
  household_id: column.text,
  to_account_id: column.text,
});
const schema = new Schema({ accounts, categories, membership, transactions });
const workerUrl = new URL("./powersync.worker.mjs", import.meta.url);

try {
  await seed();
  const privateKey = await importPKCS8(readFileSync(privateKeyFile, "utf8"), "ES256");
  const [tokenA, tokenB, tokenC] = await Promise.all([
    signToken(privateKey, userA),
    signToken(privateKey, userB),
    signToken(privateKey, userC),
  ]);

  const clientA = await connectClient("a", tokenA);
  const clientB = await connectClient("b", tokenB);
  const clientC = await connectClient("c", tokenC);

  assert.deepEqual(await ids(clientA.db, "membership"), [`${runId}-membership-a`]);
  assert.deepEqual(await ids(clientB.db, "membership"), [`${runId}-membership-b`]);
  assert.deepEqual(await ids(clientC.db, "membership"), []);
  assert.deepEqual(await ids(clientA.db, "accounts"), [privateAccountId, publicAccountId].sort());
  assert.deepEqual(await ids(clientB.db, "accounts"), [publicAccountId]);
  assert.deepEqual(await ids(clientC.db, "accounts"), []);
  assert.deepEqual(await ids(clientA.db, "categories"), [categoryId]);
  assert.deepEqual(await ids(clientB.db, "categories"), [categoryId]);
  assert.deepEqual(await ids(clientC.db, "categories"), []);
  assert.deepEqual(
    await ids(clientA.db, "transactions"),
    [privateTransactionId, publicTransactionId].sort(),
  );
  assert.deepEqual(await ids(clientB.db, "transactions"), [publicTransactionId]);
  assert.deepEqual(await ids(clientC.db, "transactions"), []);

  const warmup = await measureLag(clientA.db, 10, "warmup");
  const samples = await measureLag(clientA.db, 20, "sample");
  const sorted = [...samples].sort((a, b) => a - b);
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];

  console.log(
    JSON.stringify(
      {
        endpoint,
        runId,
        auth: "ES256",
        tenancy: "pass",
        privateAccountIsolation: "pass",
        warmupMs: warmup,
        samplesMs: samples,
        p95Ms: p95,
        rule: "p95 < 2000ms",
        result: p95 < 2_000 ? "pass" : "fail",
        writePath: "direct PlanetScale verification seed; Worker commands.apply pending",
      },
      null,
      2,
    ),
  );
  assert.ok(p95 < 2_000, `PowerSync replication p95 ${p95}ms exceeds 2000ms`);
} finally {
  for (const client of clients) {
    await client.subscription.unsubscribe();
    await client.db.disconnect();
    await client.db.close();
    if (existsSync(client.dbPath)) unlinkSync(client.dbPath);
  }
  await cleanup();
  await sql.end();
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function signToken(privateKey, userId) {
  const issuedAt = Math.floor(Date.now() / 1_000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid, typ: "JWT" })
    .setSubject(userId)
    .setAudience(endpoint)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + 30 * 60)
    .sign(privateKey);
}

async function connectClient(label, token) {
  const dbPath = `/private/tmp/${runId}-${label}.db`;
  if (existsSync(dbPath)) unlinkSync(dbPath);
  const db = new PowerSyncDatabase({
    schema,
    database: {
      dbFilename: dbPath,
      openWorker: (_options, workerOptions) => new Worker(workerUrl, workerOptions),
    },
  });
  await db.connect({
    fetchCredentials: async () => ({ endpoint, token }),
    uploadData: async () => {
      throw new Error("The Z3 verification client must not upload local writes.");
    },
  });
  const subscription = await db
    .syncStream("household_ledger", { household_id: householdId })
    .subscribe();
  await subscription.waitForFirstSync();
  const client = { db, dbPath, subscription };
  clients.push(client);
  return client;
}

async function ids(db, table) {
  const rows = await db.getAll(`SELECT id FROM ${table} ORDER BY id`);
  return rows.map((row) => row.id);
}

async function measureLag(db, count, phase) {
  const samples = [];
  for (let index = 0; index < count; index += 1) {
    const id = `${runId}-${phase}-${index}`;
    const started = performance.now();
    await insertTransaction(id);
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const rows = await db.getAll("SELECT id FROM transactions WHERE id = ?", [id]);
      if (rows.length > 0) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    const rows = await db.getAll("SELECT id FROM transactions WHERE id = ?", [id]);
    assert.equal(rows.length, 1, `${id} did not reach PowerSync within 30 seconds`);
    samples.push(Math.round(performance.now() - started));
  }
  return samples;
}

async function seed() {
  await sql`
    INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
    VALUES
      (${userA}, 'Z3 User A', ${`${userA}@example.test`}, true, now(), now()),
      (${userB}, 'Z3 User B', ${`${userB}@example.test`}, true, now(), now()),
      (${userC}, 'Z3 User C', ${`${userC}@example.test`}, true, now(), now())
  `;
  await sql`
    INSERT INTO household (id, name, created_by_user_id, created_at, updated_at)
    VALUES (${householdId}, 'Z3 verification', ${userA}, now(), now())
  `;
  await sql`
    INSERT INTO membership (id, user_id, household_id, role, version, is_active, created_at)
    VALUES
      (${`${runId}-membership-a`}, ${userA}, ${householdId}, 'owner', 0, true, now()),
      (${`${runId}-membership-b`}, ${userB}, ${householdId}, 'member', 0, true, now())
  `;
  await sql`
    INSERT INTO accounts (
      id, household_id, name, type, currency, color, icon, initial_balance_minor,
      exclude_from_total, sort_order, lifecycle, visibility, owner_user_id, version,
      created_by, updated_by, created_at, updated_at
    ) VALUES
      (${publicAccountId}, ${householdId}, 'Shared', 'bank', 'USD', '#4A90D9', 'banknote.fill', 0, false, 0, 'active', 'public', null, 0, ${userA}, ${userA}, now(), now()),
      (${privateAccountId}, ${householdId}, 'Private', 'bank', 'USD', '#4A90D9', 'banknote.fill', 0, false, 1, 'active', 'private', ${userA}, 0, ${userA}, ${userA}, now(), now())
  `;
  await sql`
    INSERT INTO categories (
      id, household_id, name, type, color, icon, sort_order, lifecycle, version,
      created_by, updated_by, created_at, updated_at
    ) VALUES (${categoryId}, ${householdId}, 'Z3 category', 'expense', '#FF6B6B', 'tag', 0, 'active', 0, ${userA}, ${userA}, now(), now())
  `;
  await insertTransaction(publicTransactionId, publicAccountId);
  await insertTransaction(privateTransactionId, privateAccountId);
}

async function insertTransaction(id, accountId = publicAccountId) {
  await sql`
    INSERT INTO transactions (
      id, household_id, type, amount_minor, currency, date, account_id, category_id,
      is_recurring, description, version, created_by, updated_by, created_at, updated_at
    ) VALUES (
      ${id}, ${householdId}, 'expense', 100, 'USD', '2026-09-07', ${accountId}, ${categoryId},
      false, 'Z3 verification', 0, ${userA}, ${userA}, now(), now()
    )
  `;
}

async function cleanup() {
  await sql`DELETE FROM transactions WHERE household_id = ${householdId}`;
  await sql`DELETE FROM categories WHERE household_id = ${householdId}`;
  await sql`DELETE FROM accounts WHERE household_id = ${householdId}`;
  await sql`DELETE FROM membership WHERE household_id = ${householdId}`;
  await sql`DELETE FROM household WHERE id = ${householdId}`;
  await sql`DELETE FROM "user" WHERE id IN (${userA}, ${userB}, ${userC})`;
}
