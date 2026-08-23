import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { beforeEach } from "@jest/globals";
import { drizzle } from "drizzle-orm/expo-sqlite";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { CommandEnvelope, CommandResult } from "@trove/protocol";

import {
  countPendingCommands,
  discardRejectedCommand,
  drainOutbox,
  enqueueCommand,
  listRejectedChanges,
  pullDeltas,
  retryRejectedCommand,
} from "@/lib/sync/outbox";
import * as schema from "@/db/schema";
import { createTestSQLiteDatabase, type TestSQLiteDatabase } from "@/tests/test-utils/sqlite";

type LocalDb = ExpoSQLiteDatabase<typeof schema>;

const HOUSEHOLD_ID = "household-1";
const OUTBOX_MIGRATION = "0004_outbox_sync.sql";

const databases: TestSQLiteDatabase[] = [];

async function setupDb(): Promise<LocalDb> {
  const testDatabase = createTestSQLiteDatabase();
  databases.push(testDatabase);
  const source = readFileSync(join(process.cwd(), "db", "migrations", OUTBOX_MIGRATION), "utf8");
  await testDatabase.database.execAsync(source.replaceAll("--> statement-breakpoint", ""));
  return drizzle(testDatabase.database, { schema });
}

afterEach(() => {
  databases.splice(0).forEach(({ close }) => close());
});

let seq = 0;

beforeEach(() => {
  seq = 0;
});

function makeInput(overrides: Partial<Parameters<typeof enqueueCommand>[1]> = {}) {
  seq += 1;
  return {
    commandId: overrides.commandId ?? `cmd-${seq}`,
    householdId: HOUSEHOLD_ID,
    kind: "transaction.create" as const,
    payload: { amountMinor: 1000 + seq },
    ...overrides,
  };
}

/** Send stub that records envelopes and replays scripted results. */
function makeSend(results: CommandResult[]) {
  const sent: CommandEnvelope[] = [];
  const send = async (envelope: CommandEnvelope): Promise<CommandResult> => {
    sent.push(envelope);
    const next = results.shift();
    if (!next) {
      throw new Error("unexpected extra send");
    }
    return next;
  };
  return { send, sent };
}

const applied = (): CommandResult => ({
  kind: "applied",
  seq: 1,
  effects: ["ledger"],
  applied: {},
  replayed: false,
});

describe("enqueueCommand", () => {
  it("stores payload and preconditions as JSON", async () => {
    const db = await setupDb();
    await enqueueCommand(db, {
      commandId: "cmd-1",
      householdId: HOUSEHOLD_ID,
      kind: "transaction.edit",
      payload: { transactionId: "tx-1" },
      preconditions: [{ entityId: "tx-1", expectedVersion: 2 }],
    });

    const rows = await db.select().from(schema.outboxCommands);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      commandId: "cmd-1",
      status: "pending",
      attempts: 0,
    });
    expect(JSON.parse(rows[0].payload)).toEqual({ transactionId: "tx-1" });
    expect(JSON.parse(rows[0].preconditions!)).toEqual([{ entityId: "tx-1", expectedVersion: 2 }]);
  });

  it("ignores duplicate commandIds (idempotency key)", async () => {
    const db = await setupDb();
    const input = makeInput();
    await enqueueCommand(db, input);
    await enqueueCommand(db, input);

    expect(await db.select().from(schema.outboxCommands)).toHaveLength(1);
  });
});

describe("drainOutbox", () => {
  it("drains in FIFO order and deletes applied commands", async () => {
    const db = await setupDb();
    for (const input of [makeInput(), makeInput(), makeInput()]) {
      await enqueueCommand(db, input);
    }
    const { send, sent } = makeSend([applied(), applied(), applied()]);

    const summary = await drainOutbox(db, send);

    expect(summary).toEqual({ applied: 3, rejected: 0, pending: 0 });
    expect(sent.map((e) => e.commandId)).toEqual(["cmd-1", "cmd-2", "cmd-3"]);
    expect(await db.select().from(schema.outboxCommands)).toHaveLength(0);
  });

  it("retains rejected commands with their typed reason and keeps draining later ones", async () => {
    const db = await setupDb();
    // Same-millisecond inserts tie-break on commandId, so name them in
    // queue order.
    await enqueueCommand(db, makeInput({ commandId: "cmd-1-stale" }));
    await enqueueCommand(db, makeInput({ commandId: "cmd-2-ok" }));
    const { send } = makeSend([
      { kind: "stale_version", entityId: "tx-1", expectedVersion: 1, actualVersion: 4 },
      applied(),
    ]);

    const summary = await drainOutbox(db, send);

    expect(summary.applied).toBe(1);
    expect(summary.rejected).toBe(1);

    const rows = await db.select().from(schema.outboxCommands);
    const rejectedRow = rows.find((r) => r.commandId === "cmd-1-stale");
    expect(rejectedRow?.status).toBe("rejected");
    expect(rejectedRow?.rejectionKind).toBe("stale_version");
    expect(JSON.parse(rejectedRow?.rejectionPayload ?? "{}").kind).toBe("stale_version");
    // cmd-2-ok was still drained despite the earlier rejection.
    expect(rows.find((r) => r.commandId === "cmd-2-ok")).toBeUndefined();
  });

  it("stops at a transport error and leaves remaining commands pending in order", async () => {
    const db = await setupDb();
    await enqueueCommand(db, makeInput({ commandId: "cmd-a" }));
    await enqueueCommand(db, makeInput({ commandId: "cmd-b" }));
    let attempts = 0;
    const send = async (): Promise<CommandResult> => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("network unreachable");
      }
      return applied();
    };

    const summary = await drainOutbox(db, send);
    expect(summary.stoppedOnNetworkError).toBe(true);
    expect(attempts).toBe(1);

    // Both rows survive; the failed one is back to pending.
    const rows = await db.select().from(schema.outboxCommands);
    expect(rows.map((r) => [r.commandId, r.status])).toEqual([
      ["cmd-a", "pending"],
      ["cmd-b", "pending"],
    ]);

    // Next pass with healthy transport drains both, FIFO preserved.
    const second = await drainOutbox(db, async () => applied());
    expect(second.applied).toBe(2);
  });

  it("retries a 'sending' row left behind by a crash without double-applying server-side", async () => {
    const db = await setupDb();
    await enqueueCommand(db, makeInput({ commandId: "cmd-crash" }));
    // Simulate the app dying mid-send.
    await db
      .update(schema.outboxCommands)
      .set({ status: "sending", attempts: 1 })
      .where(eq(schema.outboxCommands.commandId, "cmd-crash"));

    const replayedApplied: CommandResult = { ...applied(), replayed: true };
    const summary = await drainOutbox(db, async () => replayedApplied);

    expect(summary.applied).toBe(1);
    expect(await db.select().from(schema.outboxCommands)).toHaveLength(0);
  });
});

describe("pullDeltas", () => {
  it("starts at watermark 0, persists the head, then resumes from there", async () => {
    const db = await setupDb();
    const fetchedSinces: number[] = [];
    const fetch = async ({ since }: { since: number }) => {
      fetchedSinces.push(since);
      return {
        seq: since === 0 ? 5 : 9,
        hasMore: false,
        changes: [{ seq: since + 1, effects: ["ledger"] as const }],
      };
    };

    const first = await pullDeltas(db, fetch, HOUSEHOLD_ID);
    expect(first.seq).toBe(5);
    const second = await pullDeltas(db, fetch, HOUSEHOLD_ID);

    expect(fetchedSinces).toEqual([0, 5]);
    expect(second.changes[0].seq).toBe(6);

    const states = await db.select().from(schema.syncState);
    expect(states).toHaveLength(1);
    expect(states[0].watermark).toBe(9);
  });

  it("keeps per-household watermarks separate", async () => {
    const db = await setupDb();
    await pullDeltas(db, async () => ({ seq: 7, hasMore: false, changes: [] }), HOUSEHOLD_ID);
    await pullDeltas(db, async () => ({ seq: 2, hasMore: false, changes: [] }), "household-2");

    const states = await db.select().from(schema.syncState);
    expect(states.map((s) => [s.householdId, s.watermark])).toEqual([
      [HOUSEHOLD_ID, 7],
      ["household-2", 2],
    ]);
  });
});

describe("rejected changes inbox", () => {
  it("lists, retries, and discards rejected commands", async () => {
    const db = await setupDb();
    await enqueueCommand(db, makeInput({ commandId: "cmd-r1", kind: "transaction.remove" }));
    await enqueueCommand(db, makeInput({ commandId: "cmd-r2", kind: "account.create" }));
    await drainOutbox(
      db,
      async () =>
        ({
          kind: "forbidden",
          role: "viewer",
          requiredCapability: "commands:transaction.remove",
        }) satisfies CommandResult,
    );

    const inbox = await listRejectedChanges(db, HOUSEHOLD_ID);
    expect(inbox.map((r) => r.rejectionKind)).toEqual(["forbidden", "forbidden"]);
    expect(inbox[0].kind).toBe("transaction.remove");

    // Retry puts it back into the queue (server replays if already applied).
    await retryRejectedCommand(db, inbox[0].commandId);
    expect(await countPendingCommands(db, HOUSEHOLD_ID)).toBe(1);
    expect(await listRejectedChanges(db, HOUSEHOLD_ID)).toHaveLength(1);

    // Discard removes it permanently.
    await discardRejectedCommand(db, inbox[1].commandId);
    expect(await listRejectedChanges(db, HOUSEHOLD_ID)).toHaveLength(0);
    expect(await db.select().from(schema.outboxCommands)).toHaveLength(1);
  });
});
