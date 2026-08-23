import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import type { CommandEnvelope } from "@trove/protocol";

import { applyCommand } from "../commands/pipeline";
import { createTestDb } from "../commands/test-db";
import { getDelta } from "./delta";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const OWNER = "user-owner";
const MEMBER = "user-member";
const OUTSIDER = "user-outsider";
const HOUSEHOLD_ID = "household-1";

let db: TestDb;

beforeEach(async () => {
  db = await setupHousehold();
});

async function setupHousehold(): Promise<TestDb> {
  const database = await createTestDb();
  const people: readonly (readonly [string, string])[] = [
    [OWNER, "Owner"],
    [MEMBER, "Member"],
  ];
  for (const [id, name] of people) {
    await database.insert(user).values({ id, name, email: `${id}@example.com` });
  }
  await database.insert(household).values({
    id: HOUSEHOLD_ID,
    name: "Test Household",
    createdByUserId: OWNER,
  });
  await database.insert(membership).values({
    id: `membership-${OWNER}`,
    userId: OWNER,
    householdId: HOUSEHOLD_ID,
    role: "owner",
    version: 0,
  });
  await database.insert(membership).values({
    id: `membership-${MEMBER}`,
    userId: MEMBER,
    householdId: HOUSEHOLD_ID,
    role: "member",
    version: 0,
  });
  return database;
}

function roleChangeEnvelope(commandId: string, targetRole: "admin" | "member"): CommandEnvelope {
  return {
    commandId,
    householdId: HOUSEHOLD_ID,
    kind: "member.role.change",
    payload: { userId: MEMBER, role: targetRole },
  };
}

/** Commits `count` commands through the real pipeline; returns the head seq. */
async function commitCommands(count: number): Promise<number> {
  let head = 0;
  for (let i = 0; i < count; i += 1) {
    const result = await applyCommand({
      db,
      userId: OWNER,
      envelope: roleChangeEnvelope(crypto.randomUUID(), i % 2 === 0 ? "admin" : "member"),
    });
    if (result.kind !== "applied") {
      throw new Error(`seed command ${i} rejected: ${result.kind}`);
    }
    head = result.seq;
  }
  return head;
}

describe("sync.getDelta", () => {
  it("rejects a non-member before reading any change data", async () => {
    await commitCommands(2);
    await expect(
      getDelta({ db, userId: OUTSIDER, householdId: HOUSEHOLD_ID, since: 0 }),
    ).rejects.toThrow(/not a member/);
  });

  it("returns all changes since the watermark in seq order", async () => {
    await commitCommands(3);

    const delta = await getDelta({ db, userId: MEMBER, householdId: HOUSEHOLD_ID, since: 0 });
    expect(delta.seq).toBe(3);
    expect(delta.hasMore).toBe(false);
    expect(delta.changes.map((c) => c.seq)).toEqual([1, 2, 3]);
    expect(delta.changes.every((c) => c.effects.length > 0)).toBe(true);
  });

  it("returns only changes after the watermark and advances it", async () => {
    await commitCommands(2);
    const first = await getDelta({ db, userId: MEMBER, householdId: HOUSEHOLD_ID, since: 0 });
    expect(first.changes.map((c) => c.seq)).toEqual([1, 2]);

    // Nothing new — empty delta, watermark stays put.
    const idle = await getDelta({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      since: first.seq,
    });
    expect(idle.seq).toBe(2);
    expect(idle.changes).toEqual([]);

    // Another member commits; the poller sees only the new change.
    await applyCommand({
      db,
      userId: OWNER,
      envelope: roleChangeEnvelope(crypto.randomUUID(), "member"),
    });
    const next = await getDelta({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      since: first.seq,
    });
    expect(next.seq).toBe(3);
    expect(next.changes.map((c) => c.seq)).toEqual([3]);
  });

  it("carries notification-shaped messages only — no raw row data", async () => {
    await commitCommands(1);
    const delta = await getDelta({ db, userId: MEMBER, householdId: HOUSEHOLD_ID, since: 0 });

    expect(delta.changes).toHaveLength(1);
    const entry = delta.changes[0];
    expect(Object.keys(entry ?? {}).sort()).toEqual(["effects", "seq"]);
    expect(entry?.effects).toEqual(["members"]);
  });

  it("reports hasMore when more changes exist than the limit", async () => {
    await commitCommands(4);

    const page = await getDelta({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      since: 0,
      limit: 2,
    });
    expect(page.hasMore).toBe(true);
    expect(page.changes.map((c) => c.seq)).toEqual([1, 2]);

    const rest = await getDelta({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      since: page.changes[page.changes.length - 1]?.seq ?? 0,
    });
    expect(rest.hasMore).toBe(false);
    expect(rest.changes.map((c) => c.seq)).toEqual([3, 4]);
  });

  it("returns an empty delta with seq 0 for a household with no changes", async () => {
    const delta = await getDelta({ db, userId: MEMBER, householdId: HOUSEHOLD_ID, since: 0 });
    expect(delta).toEqual({ seq: 0, hasMore: false, changes: [] });
  });

  it("caps the limit at MAX_DELTA_LIMIT regardless of input", async () => {
    await commitCommands(6);
    const delta = await getDelta({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      since: 0,
      limit: Number.MAX_SAFE_INTEGER,
    });
    expect(delta.changes.length).toBeLessThanOrEqual(1000);
    expect(delta.changes.map((c) => c.seq)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
