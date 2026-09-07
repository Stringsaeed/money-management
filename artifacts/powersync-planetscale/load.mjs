import assert from "node:assert/strict";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { Worker } from "node:worker_threads";

import { column, Schema, Table } from "@powersync/common";
import { PowerSyncDatabase } from "@powersync/node";
import { importPKCS8, SignJWT } from "jose";

const workerBase = required("Z6_WORKER_URL").replace(/\/$/, "");
const password = required("Z6_TEST_PASSWORD");
const origin = process.env.Z6_ORIGIN ?? "http://localhost:8081";
const count = Number(process.env.Z6_CREATE_COUNT ?? 50);
assert.ok(Number.isSafeInteger(count) && count > 0, "Z6_CREATE_COUNT must be a positive integer");

const runId = `z6-${Date.now()}`;
const clients = [];
const workerUrl = new URL("../../packages/powersync/powersync.worker.mjs", import.meta.url);
const accounts = new Table({ household_id: column.text });
const categories = new Table({ household_id: column.text });
const transactions = new Table({ household_id: column.text });
const schema = new Schema({ accounts, categories, transactions });

try {
  const ownerSession = await signUp(`${runId}-owner@example.com`, "Z6 Owner");
  const memberSession = await signUp(`${runId}-member@example.com`, "Z6 Member");
  const owner = ownerSession.cookie;
  const member = memberSession.cookie;
  const { householdId } = await rpc(owner, "households/create", { name: runId });
  const { code } = await rpc(owner, "households/generateInvite", {
    householdId,
    expiresInDays: 1,
    singleUse: true,
  });
  await rpc(member, "households/acceptInvite", { code });

  const accountId = `${runId}-account`;
  const categoryId = `${runId}-category`;
  await apply(owner, householdId, "account.create", {
    id: accountId,
    name: "Z6 Load",
    type: "bank",
    currency: "USD",
  });
  await apply(owner, householdId, "category.create", {
    id: categoryId,
    name: "Z6 Load",
    type: "expense",
  });

  const [ownerCredentials, memberCredentials] = await Promise.all([
    credentialsFor(ownerSession),
    credentialsFor(memberSession),
  ]);
  assert.equal(ownerCredentials.endpoint, memberCredentials.endpoint);
  const [deviceA, deviceB] = await Promise.all([
    connectClient("device-a", householdId, ownerCredentials),
    connectClient("device-b", householdId, memberCredentials),
  ]);

  const ids = Array.from({ length: count }, (_, index) => `${runId}-transaction-${index}`);
  const startedAt = new Map(ids.map((id) => [id, performance.now()]));
  const visibleAtB = new Map();
  const writes = ids.map((id, index) =>
    apply(index % 2 === 0 ? owner : member, householdId, "transaction.create", {
      id,
      type: "expense",
      amountMinor: 100 + index,
      date: "2026-09-07",
      accountId,
      categoryId,
      description: `Z6 load ${index}`,
    }),
  );
  const observation = observeRows(deviceB.db, ids, visibleAtB);
  const applied = await Promise.all(writes);
  for (const result of applied) assert.equal(result.kind, "applied");
  await observation;
  await Promise.all([waitForRows(deviceA.db, ids), waitForRows(deviceB.db, ids)]);

  const samples = ids.map((id) => Math.round(visibleAtB.get(id) - startedAt.get(id)));
  const p95Ms = percentile(samples, 0.95);
  const report = {
    runId,
    householdId,
    creates: count,
    writers: ["device-a", "device-b"],
    deviceARows: await rowCount(deviceA.db, ids),
    deviceBRows: await rowCount(deviceB.db, ids),
    applyToDeviceBMs: samples,
    p95Ms,
    rule: "p95 < 2000ms",
    result: p95Ms < 2_000 ? "pass" : "fail",
  };
  console.log(JSON.stringify(report, null, 2));
  assert.equal(report.deviceARows, count);
  assert.equal(report.deviceBRows, count);
  assert.ok(p95Ms < 2_000, `apply-to-device-B p95 ${p95Ms}ms exceeds 2000ms`);
} finally {
  for (const client of clients) {
    await client.subscription.unsubscribe();
    await client.db.disconnect();
    await client.db.close();
    if (existsSync(client.path)) unlinkSync(client.path);
  }
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function signUp(email, name) {
  const response = await fetch(`${workerBase}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ email, password, name }),
  });
  const cookie = (response.headers.getSetCookie?.() ?? [])
    .map((value) => value.split(";", 1)[0])
    .filter(Boolean)
    .join("; ");
  const raw = await response.text();
  if (!response.ok || !cookie) throw new Error(`Sign-up failed (${response.status}): ${raw}`);
  const body = JSON.parse(raw);
  const userId = body?.user?.id;
  if (typeof userId !== "string") throw new Error("Sign-up response did not include user.id.");
  return { cookie, userId };
}

async function credentialsFor(session) {
  try {
    return await rpc(session.cookie, "powersync/token");
  } catch {
    const endpoint = required("POWERSYNC_URL");
    const kid = required("POWERSYNC_JWT_KID");
    const keyFile = required("POWERSYNC_JWT_PRIVATE_KEY_FILE");
    const key = await importPKCS8(readFileSync(keyFile, "utf8"), "ES256");
    const issuedAt = Math.floor(Date.now() / 1_000);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid, typ: "JWT" })
      .setSubject(session.userId)
      .setAudience(endpoint)
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + 30 * 60)
      .sign(key);
    return { endpoint, token };
  }
}

async function rpc(cookie, path, body) {
  const response = await fetch(`${workerBase}/rpc/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, origin },
    body: JSON.stringify(body === undefined ? {} : { json: body }),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`${path} failed (${response.status}): ${raw}`);
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" && "json" in parsed ? parsed.json : parsed;
}

async function apply(cookie, householdId, kind, payload) {
  return rpc(cookie, "commands/apply", {
    commandId: crypto.randomUUID(),
    householdId,
    kind,
    issuedAt: new Date().toISOString(),
    payload,
  });
}

async function connectClient(label, householdId, credentials) {
  const path = `/private/tmp/${runId}-${label}.db`;
  if (existsSync(path)) unlinkSync(path);
  const db = new PowerSyncDatabase({
    schema,
    database: {
      dbFilename: path,
      openWorker: (_options, workerOptions) => new Worker(workerUrl, workerOptions),
    },
  });
  await db.connect({
    fetchCredentials: async () => credentials,
    uploadData: async () => {
      throw new Error("The Z6 load harness writes through commands.apply only.");
    },
  });
  const subscription = await db
    .syncStream("household_ledger", { household_id: householdId })
    .subscribe();
  await subscription.waitForFirstSync();
  const client = { db, path, subscription };
  clients.push(client);
  return client;
}

async function observeRows(db, ids, visibleAt) {
  const waiting = new Set(ids);
  const deadline = Date.now() + 30_000;
  while (waiting.size > 0 && Date.now() < deadline) {
    const placeholders = [...waiting].map(() => "?").join(",");
    const rows = await db.getAll(`SELECT id FROM transactions WHERE id IN (${placeholders})`, [
      ...waiting,
    ]);
    const now = performance.now();
    for (const row of rows) {
      visibleAt.set(row.id, now);
      waiting.delete(row.id);
    }
    if (waiting.size > 0) await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.equal(waiting.size, 0, `${waiting.size} transactions did not reach device B`);
}

async function waitForRows(db, ids) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if ((await rowCount(db, ids)) === ids.length) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.equal(await rowCount(db, ids), ids.length, "not every transaction converged");
}

async function rowCount(db, ids) {
  const placeholders = ids.map(() => "?").join(",");
  const rows = await db.getAll(
    `SELECT COUNT(*) AS count FROM transactions WHERE id IN (${placeholders})`,
    ids,
  );
  return Number(rows[0]?.count ?? 0);
}

function percentile(values, quantile) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * quantile) - 1];
}
