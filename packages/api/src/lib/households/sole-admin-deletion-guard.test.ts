import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";

import { createTestDb } from "../../test-support/db";
import { LAST_ADMIN_MESSAGE, canDropAdmin } from "./admin-guard";
import {
  assertUserDeletionAllowed,
  listSoleAdminHouseholds,
} from "./sole-admin-deletion-guard";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const ALICE = "user_alice";
const BOB = "user_bob";
const CARLA = "user_carla";
const HOME = "household_home";
const OTHER = "household_other";

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
  for (const [id, name] of [
    [ALICE, "Alice"],
    [BOB, "Bob"],
    [CARLA, "Carla"],
  ] as const) {
    await db.insert(user).values({ id, name, email: `${id}@example.com` });
  }
  await db.insert(household).values([
    { id: HOME, name: "Home", createdByUserId: ALICE },
    { id: OTHER, name: "Other", createdByUserId: CARLA },
  ]);
});

async function seedMembership(
  id: string,
  userId: string,
  householdId: string,
  role: "admin" | "member" | "viewer",
  status: "active" | "inactive" | "pending" = "active",
) {
  await db.insert(membership).values({ id, userId, householdId, role, status });
}

describe("listSoleAdminHouseholds", () => {
  it("blocks deletion when the User is the sole active admin", async () => {
    await seedMembership("m_alice_home", ALICE, HOME, "admin");
    await seedMembership("m_bob_home", BOB, HOME, "member");
    await seedMembership("m_carla_other", CARLA, OTHER, "admin");

    await expect(listSoleAdminHouseholds(db, ALICE)).resolves.toEqual([{ householdId: HOME }]);
    await expect(listSoleAdminHouseholds(db, BOB)).resolves.toEqual([]);
  });

  it("allows deletion when another active admin remains", async () => {
    await seedMembership("m_alice_home", ALICE, HOME, "admin");
    await seedMembership("m_bob_home", BOB, HOME, "admin");

    await expect(listSoleAdminHouseholds(db, ALICE)).resolves.toEqual([]);
    expect(canDropAdmin([{ userId: ALICE, role: "admin" }, { userId: BOB, role: "admin" }], ALICE)).toBe(
      true,
    );
  });

  it("ignores inactive and pending admins when deciding sole-admin", async () => {
    await seedMembership("m_alice_home", ALICE, HOME, "admin", "active");
    await seedMembership("m_bob_home", BOB, HOME, "admin", "inactive");
    await seedMembership("m_carla_home", CARLA, HOME, "admin", "pending");

    await expect(listSoleAdminHouseholds(db, ALICE)).resolves.toEqual([{ householdId: HOME }]);
  });
});

describe("assertUserDeletionAllowed", () => {
  it("resolves when no sole-admin Households remain", async () => {
    await seedMembership("m_alice_home", ALICE, HOME, "admin");
    await seedMembership("m_bob_home", BOB, HOME, "admin");
    await expect(assertUserDeletionAllowed(db, ALICE)).resolves.toBeUndefined();
  });

  it("throws SOLE_ADMIN with householdIds when deletion would leave a Household adminless", async () => {
    await seedMembership("m_alice_home", ALICE, HOME, "admin");
    await seedMembership("m_alice_other", ALICE, OTHER, "admin");
    await seedMembership("m_carla_other", CARLA, OTHER, "member");

    await expect(assertUserDeletionAllowed(db, ALICE)).rejects.toMatchObject({
      message: LAST_ADMIN_MESSAGE,
      code: "SOLE_ADMIN",
      householdIds: expect.arrayContaining([HOME, OTHER]),
    });
  });
});
