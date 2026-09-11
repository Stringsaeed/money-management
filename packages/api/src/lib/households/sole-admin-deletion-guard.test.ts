import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";

import { createTestDb } from "../../test-support/db";
import { assertUserDeletionAllowed, listSoleAdminHouseholds } from "./sole-admin-deletion-guard";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const ALICE = "user-alice";
const BOB = "user-bob";

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values([
    { id: ALICE, name: "Alice", email: "alice@example.com" },
    { id: BOB, name: "Bob", email: "bob@example.com" },
  ]);
  await db.insert(household).values([
    { id: "home", name: "Home", createdByUserId: ALICE },
    { id: "club", name: "Club", createdByUserId: BOB },
  ]);
});

describe("sole-admin User deletion guard", () => {
  it("blocks deletion when the User is the only active admin of any Household", async () => {
    await db.insert(membership).values([
      { id: "home-alice", householdId: "home", userId: ALICE, role: "admin" },
      { id: "home-bob", householdId: "home", userId: BOB, role: "member" },
      { id: "club-alice", householdId: "club", userId: ALICE, role: "member" },
      { id: "club-bob", householdId: "club", userId: BOB, role: "admin" },
    ]);

    await expect(listSoleAdminHouseholds(db, ALICE)).resolves.toEqual([{ householdId: "home" }]);
    await expect(assertUserDeletionAllowed(db, ALICE)).rejects.toMatchObject({
      code: "SOLE_ADMIN",
      householdIds: ["home"],
    });
  });

  it("allows deletion after another active admin exists and ignores inactive admins", async () => {
    await db.insert(membership).values([
      { id: "home-alice", householdId: "home", userId: ALICE, role: "admin" },
      {
        id: "home-bob",
        householdId: "home",
        userId: BOB,
        role: "admin",
        status: "inactive",
      },
    ]);
    await expect(assertUserDeletionAllowed(db, ALICE)).rejects.toMatchObject({
      code: "SOLE_ADMIN",
    });

    await db.update(membership).set({ status: "active" }).where(eq(membership.id, "home-bob"));

    await expect(assertUserDeletionAllowed(db, ALICE)).resolves.toBeUndefined();
  });
});
