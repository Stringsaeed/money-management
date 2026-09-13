import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { deletedIdentity, deletionOperation } from "@trove/db/schema/deletion";
import { household, membership } from "@trove/db/schema/household";
import { ledgerAccount } from "@trove/db/schema/ledger";
import { ledger } from "@trove/db/schema/ledger-scope";
import { personalLedgerId } from "@trove/protocol";

import { createTestDb } from "../../../test-support/db";
import { type FakeDirectory, createFakeDirectory } from "../../../test-support/fake-directory";
import { createHousehold } from "../../households/service";
import { applyHouseholdEvent, reconcileUserMemberships } from "../../membership/reconcile";
import {
  advanceDeletionOperation,
  type DeletionDeps,
  requestHouseholdDeletion,
  requestUserDeletion,
} from "../service";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const ALICE = { id: "user_alice", email: "alice@example.com", name: "Alice" };
const BOB = { id: "user_bob", email: "bob@example.com", name: "Bob" };
const REQUEST = "22222222-2222-4222-8222-222222222222";

let db: TestDb;
let directory: FakeDirectory;
let now: Date;
let deps: DeletionDeps;

beforeEach(async () => {
  db = await createTestDb({ householdLedgerMirror: false });
  directory = createFakeDirectory();
  now = new Date("2026-09-01T12:00:00.000Z");
  deps = { db, directory, now: () => now };
  for (const person of [ALICE, BOB]) {
    directory.seedUser(person);
    await db.insert(user).values(person);
  }
});

function createHome() {
  return createHousehold(deps, { actor: ALICE, name: "Home", requestId: REQUEST });
}

describe("requestHouseholdDeletion", () => {
  it("requires confirmName and rejects non-admins", async () => {
    const home = await createHome();
    directory.seedMembership({
      organizationId: home.householdId,
      userId: BOB.id,
      roleSlug: "member",
    });
    await reconcileUserMemberships(deps, BOB.id);

    await expect(
      requestHouseholdDeletion(deps, {
        userId: ALICE.id,
        householdId: home.householdId,
        confirmName: "Wrong",
      }),
    ).rejects.toThrow(/Confirmation does not match/);

    await expect(
      requestHouseholdDeletion(deps, {
        userId: BOB.id,
        householdId: home.householdId,
        confirmName: "Home",
      }),
    ).rejects.toThrow(/admin/i);
  });

  it("removes shared ledger data, keeps personal ledgers, and tombstones the org", async () => {
    const home = await createHome();
    await db.insert(ledger).values({
      id: personalLedgerId(ALICE.id),
      kind: "personal",
      personalUserId: ALICE.id,
    });
    await db.insert(ledgerAccount).values({
      ledgerId: home.householdId,
      householdId: home.householdId,
      id: "acc-shared",
      name: "Shared",
      type: "bank",
      currency: "USD",
      version: 0,
      createdBy: ALICE.id,
      updatedBy: ALICE.id,
    });

    await requestHouseholdDeletion(deps, {
      userId: ALICE.id,
      householdId: home.householdId,
      confirmName: "Home",
    });

    expect(directory.organizations.get(home.householdId)?.deleted).toBe(true);
    expect(await db.select().from(household)).toHaveLength(0);
    expect(await db.select().from(ledger)).toEqual([
      expect.objectContaining({ id: personalLedgerId(ALICE.id) }),
    ]);
    expect(
      await db.select().from(deletedIdentity).where(eq(deletedIdentity.id, home.householdId)),
    ).toEqual([expect.objectContaining({ kind: "organization" })]);
  });

  it("resumes after a WorkOS failure without duplicating local deletes", async () => {
    const home = await createHome();
    directory.failNext("deleteOrganization", "workos down");

    await expect(
      requestHouseholdDeletion(deps, {
        userId: ALICE.id,
        householdId: home.householdId,
        confirmName: "Home",
      }),
    ).rejects.toThrow(/workos down/);

    const ops = await db.select().from(deletionOperation);
    expect(ops).toEqual([
      expect.objectContaining({
        kind: "household",
        targetId: home.householdId,
        status: "failed",
        cursor: 1,
      }),
    ]);
    expect(await db.select().from(household)).toHaveLength(1);

    await advanceDeletionOperation(deps, ops[0]!.id);
    expect(await db.select().from(household)).toHaveLength(0);
    expect(directory.organizations.get(home.householdId)?.deleted).toBe(true);
  });
});

describe("requestUserDeletion", () => {
  it("blocks sole admins until they appoint another admin or delete the Household", async () => {
    await createHome();
    await expect(requestUserDeletion(deps, { userId: ALICE.id })).rejects.toThrow(/admin/i);
  });

  it("anonymizes attribution, clears personal data, and ignores delayed membership events", async () => {
    const home = await createHome();
    directory.seedMembership({
      organizationId: home.householdId,
      userId: BOB.id,
      roleSlug: "admin",
    });
    await reconcileUserMemberships(deps, BOB.id);

    await db.insert(ledger).values({
      id: personalLedgerId(ALICE.id),
      kind: "personal",
      personalUserId: ALICE.id,
    });
    await db.insert(ledgerAccount).values({
      ledgerId: home.householdId,
      householdId: home.householdId,
      id: "acc-shared",
      name: "Shared",
      type: "bank",
      currency: "USD",
      version: 0,
      createdBy: ALICE.id,
      updatedBy: ALICE.id,
    });

    await requestUserDeletion(deps, { userId: ALICE.id });

    expect(directory.users.has(ALICE.id)).toBe(false);
    expect(
      await db
        .select()
        .from(ledger)
        .where(eq(ledger.id, personalLedgerId(ALICE.id))),
    ).toEqual([]);
    const alice = await db.select().from(user).where(eq(user.id, ALICE.id));
    expect(alice[0]).toMatchObject({
      name: "Deleted User",
      email: expect.stringMatching(/^deleted\+/),
    });
    expect(await db.select().from(ledgerAccount)).toEqual([
      expect.objectContaining({ id: "acc-shared", createdBy: ALICE.id }),
    ]);
    expect(await db.select().from(household)).toHaveLength(1);

    const resurrect = await applyHouseholdEvent(deps, {
      kind: "membership",
      eventId: "evt_stale",
      observedAt: new Date(now.getTime() + 60_000),
      membership: {
        id: "om_stale",
        organizationId: home.householdId,
        userId: ALICE.id,
        roleSlug: "member",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      deleted: false,
    });
    expect(resurrect).toBe("ignored");
    expect(await db.select().from(membership).where(eq(membership.userId, ALICE.id))).toEqual([
      expect.objectContaining({ status: "inactive" }),
    ]);
  });
});
