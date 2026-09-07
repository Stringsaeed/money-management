import { existsSync, unlinkSync } from "node:fs";
import { PowerSyncDatabase } from "@powersync/node";
import { column, Schema, Table } from "@powersync/common";

const url = process.env.POWERSYNC_URL;
const token = process.env.POWERSYNC_TOKEN;
const expectId = process.env.SPIKE_ROW_ID;
const dbPath = process.env.SPIKE_CLIENT_DB ?? "/tmp/z0-spike-client.db";
const timeoutMs = Number(process.env.SPIKE_ROUNDTRIP_TIMEOUT_MS ?? "30000");

if (!url || !token || !expectId) {
  console.error("POWERSYNC_URL, POWERSYNC_TOKEN, and SPIKE_ROW_ID are required");
  process.exit(1);
}

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
}

const transactions = new Table({
  household_id: column.text,
  note: column.text,
});

const membership = new Table({
  user_id: column.text,
  household_id: column.text,
});

const accounts = new Table({
  household_id: column.text,
  name: column.text,
});

const categories = new Table({
  household_id: column.text,
  name: column.text,
});

const db = new PowerSyncDatabase({
  schema: new Schema({ transactions, membership, accounts, categories }),
  database: { dbFilename: dbPath },
});

const started = Date.now();
await db.connect({ endpoint: url, token });
await db.waitForFirstSync();

const deadline = started + timeoutMs;
let found = false;
while (Date.now() < deadline) {
  const rows = await db.getAll("SELECT id FROM transactions WHERE id = ?", [expectId]);
  if (rows.length > 0) {
    found = true;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
}

await db.disconnect();
await db.close();

if (!found) {
  console.error(`row ${expectId} did not arrive in ${timeoutMs}ms`);
  process.exit(1);
}

console.log(
  JSON.stringify({
    id: expectId,
    db: dbPath,
    delay_ms: Date.now() - started,
  }),
);
