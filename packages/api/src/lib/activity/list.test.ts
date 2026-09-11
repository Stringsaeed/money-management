import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import type { EffectTag } from "@trove/protocol";

import { householdChange } from "@trove/db/schema/commands";

import { createTestDb } from "../../test-support/db";
import { getActivity } from "./list";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const OWNER = "user-owner";
const MEMBER = "user-member";
const OUTSIDER = "user-outsider";
const HOUSEHOLD_ID = "household-1";
const OTHER_HOUSEHOLD_ID = "household-2";

let db: TestDb;

/** 2026-08-24 noon UTC plus `minutes`. */
const at = (minutes: number): Date => new Date(Date.UTC(2026, 7, 24, 12, minutes));

beforeEach(async () => {
  db = await setupHousehold();
});

async function setupHousehold(): Promise<TestDb> {
  const database = await createTestDb();
  const people: readonly (readonly [string, string])[] = [
    [OWNER, "Owner"],
    [MEMBER, "Member"],
    ["user-other", "Other Household Owner"],
  ];
  for (const [id, name] of people) {
    await database.insert(user).values({ id, name, email: `${id}@example.com` });
  }
  await database.insert(household).values([
    { id: HOUSEHOLD_ID, name: "Test Household", createdByUserId: OWNER },
    { id: OTHER_HOUSEHOLD_ID, name: "Other Household", createdByUserId: "user-other" },
  ]);
  const memberships: readonly (readonly [string, string, string, "owner" | "member"])[] = [
    [`membership-${HOUSEHOLD_ID}-${OWNER}`, OWNER, HOUSEHOLD_ID, "owner"],
    [`membership-${HOUSEHOLD_ID}-${MEMBER}`, MEMBER, HOUSEHOLD_ID, "member"],
    [`membership-${OTHER_HOUSEHOLD_ID}-other`, "user-other", OTHER_HOUSEHOLD_ID, "owner"],
  ];
  for (const [id, userId, householdId, role] of memberships) {
    await database.insert(membership).values({
      id,
      userId,
      householdId,
      role,
      version: 0,
    });
  }
  return database;
}

interface SeedChange {
  readonly userId: string;
  readonly effects?: readonly EffectTag[];
  /** Minutes offset from the fixture base time; defaults to insertion order. */
  readonly minutes?: number;
}

async function seedChanges(changes: readonly SeedChange[]): Promise<void> {
  let seq = 0;
  for (const change of changes) {
    seq += 1;
    await db.insert(householdChange).values({
      id: crypto.randomUUID(),
      ledgerId: HOUSEHOLD_ID,
      householdId: HOUSEHOLD_ID,
      seq,
      userId: change.userId,
      commandId: crypto.randomUUID(),
      effects: [...(change.effects ?? ["ledger"])],
      createdAt: at(change.minutes ?? seq),
    });
  }
}

describe("getActivity", () => {
  it("rejects a non-member before reading any change data", async () => {
    await seedChanges([{ userId: OWNER }]);
    await expect(getActivity({ db, userId: OUTSIDER, householdId: HOUSEHOLD_ID })).rejects.toThrow(
      /not a member/,
    );
  });

  it("returns entries newest-first with user attribution and decoded summaries", async () => {
    await seedChanges([
      { userId: OWNER, effects: ["ledger", "balances"] },
      { userId: MEMBER, effects: ["members"] },
    ]);

    const page = await getActivity({ db, userId: MEMBER, householdId: HOUSEHOLD_ID });
    expect(page.hasMore).toBe(false);
    expect(page.changes).toHaveLength(2);

    const newest = page.changes[0];
    expect(newest?.seq).toBe(2);
    expect(newest?.userName).toBe("Member");
    expect(newest?.userId).toBe(MEMBER);
    expect(newest?.summary).toBe("Updated household members");
    expect(newest?.effects).toEqual(["members"]);
    expect(newest?.createdAt).toBe(at(2).toISOString());

    const oldest = page.changes[1];
    expect(oldest?.seq).toBe(1);
    expect(oldest?.userName).toBe("Owner");
    expect(oldest?.summary).toBe("Updated the ledger and account balances");
  });

  it("paginates by limit/offset and reports hasMore", async () => {
    await seedChanges([
      { userId: OWNER },
      { userId: MEMBER },
      { userId: OWNER },
      { userId: MEMBER },
    ]);

    const firstPage = await getActivity({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      limit: 2,
      offset: 0,
    });
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.changes.map((c) => c.seq)).toEqual([4, 3]);

    // Offset pagination resumes exactly where the previous page ended.
    const secondPage = await getActivity({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      limit: 2,
      offset: 2,
    });
    expect(secondPage.hasMore).toBe(false);
    expect(secondPage.changes.map((c) => c.seq)).toEqual([2, 1]);

    // An offset past the end yields an empty page.
    const emptyPage = await getActivity({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      limit: 2,
      offset: 4,
    });
    expect(emptyPage.changes).toEqual([]);
    expect(emptyPage.hasMore).toBe(false);
  });

  it("filters by user attribution", async () => {
    await seedChanges([{ userId: OWNER }, { userId: MEMBER }, { userId: OWNER }]);

    const page = await getActivity({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      filterUserId: MEMBER,
    });
    expect(page.changes.map((c) => c.userId)).toEqual([MEMBER]);
    expect(page.changes.map((c) => c.userName)).toEqual(["Member"]);
  });

  it("filters to a date range inclusive of both bounds", async () => {
    await seedChanges([
      { userId: OWNER, minutes: -60 }, // 11:00
      { userId: OWNER, minutes: 0 }, // 12:00
      { userId: MEMBER, minutes: 30 }, // 12:30
      { userId: MEMBER, minutes: 120 }, // 14:00
    ]);

    const page = await getActivity({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      from: at(-30),
      to: at(60),
    });
    expect(page.changes.map((c) => c.seq)).toEqual([3, 2]);
  });

  it("combines user and date filters", async () => {
    await seedChanges([
      { userId: MEMBER, minutes: 10 },
      { userId: OWNER, minutes: 20 },
      { userId: MEMBER, minutes: 200 },
    ]);

    const page = await getActivity({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      filterUserId: MEMBER,
      from: at(0),
      to: at(60),
    });
    expect(page.changes.map((c) => c.seq)).toEqual([1]);
  });

  it("never leaks another household's changes", async () => {
    await seedChanges([{ userId: OWNER }, { userId: MEMBER }]);
    await db.insert(householdChange).values({
      id: crypto.randomUUID(),
      ledgerId: OTHER_HOUSEHOLD_ID,
      householdId: OTHER_HOUSEHOLD_ID,
      seq: 1,
      userId: "user-other",
      commandId: crypto.randomUUID(),
      effects: ["ledger"],
      createdAt: at(60),
    });

    const page = await getActivity({ db, userId: MEMBER, householdId: HOUSEHOLD_ID });
    expect(page.changes).toHaveLength(2);
    expect(page.changes.every((c) => c.seq <= 2)).toBe(true);
  });

  it("returns an empty page for a household with no changes", async () => {
    const page = await getActivity({ db, userId: MEMBER, householdId: HOUSEHOLD_ID });
    expect(page).toEqual({ hasMore: false, changes: [] });
  });

  it("caps the limit at MAX_ACTIVITY_LIMIT regardless of input", async () => {
    await seedChanges(Array.from({ length: 6 }, (_, i) => ({ userId: i % 2 ? MEMBER : OWNER })));
    const page = await getActivity({
      db,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      limit: Number.MAX_SAFE_INTEGER,
    });
    expect(page.changes.length).toBeLessThanOrEqual(200);
    expect(page.changes).toHaveLength(6);
  });
});
