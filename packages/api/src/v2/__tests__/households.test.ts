import { beforeEach, describe, expect, it } from "vitest";

import { createTestDb } from "../../test-support/db";
import { createFakeDirectory, type FakeDirectory } from "../../test-support/fake-directory";
import {
  createV2Household,
  getV2Household,
  inviteV2Member,
  leaveV2Household,
  listV2Households,
  setV2MemberRole,
  type V2HouseholdDeps,
} from "../households";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const ALICE = {
  id: "user_alice",
  kind: "user",
  userId: "user_alice",
  workosUserId: "user_alice",
  email: "alice@example.com",
  name: "Alice",
} as const;
const BOB = {
  id: "user_bob",
  kind: "user",
  userId: "user_bob",
  workosUserId: "user_bob",
  email: "bob@example.com",
  name: "Bob",
} as const;
const CARLA = {
  id: "user_carla",
  kind: "user",
  userId: "user_carla",
  workosUserId: "user_carla",
  email: "carla@example.com",
  name: "Carla",
} as const;

describe("V2 household isolation and ownership", () => {
  let db: TestDb;
  let directory: FakeDirectory;
  let deps: V2HouseholdDeps;

  beforeEach(async () => {
    db = await createTestDb({ householdLedgerMirror: false });
    directory = createFakeDirectory();
    deps = { db, directory, now: () => new Date("2026-09-21T10:00:00.000Z") };
    directory.seedUser(ALICE);
    directory.seedUser(BOB);
    directory.seedUser(CARLA);
  });

  async function createHome() {
    return createV2Household(deps, {
      actor: ALICE,
      name: "Home",
      requestId: "11111111-1111-4111-8111-111111111111",
    });
  }

  it("denies legacy or unknown organizations before mutating WorkOS", async () => {
    directory.seedMembership({
      organizationId: "org_legacy",
      userId: ALICE.userId,
      roleSlug: "admin",
    });
    directory.calls.splice(0);

    await expect(
      getV2Household(deps, { userId: ALICE.userId, householdId: "org_legacy" }),
    ).rejects.toMatchObject({
      code: "household_not_found",
    });
    await expect(
      inviteV2Member(deps, {
        userId: ALICE.userId,
        householdId: "org_legacy",
        email: "x@example.com",
        role: "member",
      }),
    ).rejects.toMatchObject({
      code: "household_not_found",
    });
    await expect(
      leaveV2Household(deps, { userId: ALICE.userId, householdId: "org_legacy" }),
    ).rejects.toMatchObject({
      code: "household_not_found",
    });
    await expect(
      setV2MemberRole(deps, {
        userId: ALICE.userId,
        householdId: "org_legacy",
        targetUserId: BOB.userId,
        role: "member",
      }),
    ).rejects.toMatchObject({
      code: "household_not_found",
    });
    expect(
      directory.calls.filter((call) =>
        ["sendInvitation", "deleteMembership", "setMembershipRole"].includes(call),
      ),
    ).toEqual([]);
  });

  it("denies a membership deleted in WorkOS even when the local projection is stale", async () => {
    const home = await createHome();
    const membership = [...directory.memberships.values()].find(
      (row) => row.userId === ALICE.userId,
    );
    expect(membership).toBeDefined();
    expect(
      await getV2Household(deps, { userId: ALICE.userId, householdId: home.householdId }),
    ).toMatchObject({ householdId: home.householdId });
    directory.memberships.delete(membership!.id);
    await expect(
      getV2Household(deps, { userId: ALICE.userId, householdId: home.householdId }),
    ).rejects.toMatchObject({
      code: "household_membership_required",
    });
  });

  it("keeps one selected household when WorkOS reports a second V2 membership", async () => {
    const first = await createHome();
    const second = await createV2Household(deps, {
      actor: BOB,
      name: "Bob Home",
      requestId: "22222222-2222-4222-8222-222222222222",
    });
    directory.seedMembership({
      organizationId: second.householdId,
      userId: ALICE.userId,
      roleSlug: "member",
    });

    expect((await listV2Households(deps, ALICE)).map((row) => row.householdId)).toEqual([
      first.householdId,
    ]);
    await expect(
      getV2Household(deps, { userId: ALICE.userId, householdId: second.householdId }),
    ).rejects.toMatchObject({
      code: "household_membership_conflict",
    });
    await expect(
      getV2Household(deps, { userId: ALICE.userId, householdId: first.householdId }),
    ).resolves.toMatchObject({
      householdId: first.householdId,
    });
  });

  it("supports leave and rejoin with a new WorkOS membership id", async () => {
    const home = await createHome();
    directory.seedMembership({
      organizationId: home.householdId,
      userId: BOB.userId,
      roleSlug: "admin",
    });
    await listV2Households(deps, BOB);
    await leaveV2Household(deps, { userId: ALICE.userId, householdId: home.householdId });
    directory.seedMembership({
      organizationId: home.householdId,
      userId: ALICE.userId,
      roleSlug: "member",
      id: "om_rejoined",
    });
    expect(await listV2Households(deps, ALICE)).toEqual([
      expect.objectContaining({ householdId: home.householdId, role: "member" }),
    ]);
    expect(
      await getV2Household(deps, { userId: ALICE.userId, householdId: home.householdId }),
    ).toMatchObject({
      householdId: home.householdId,
    });
  });

  it("replays a create after leave without deleting the organization or another member", async () => {
    const home = await createHome();
    directory.seedMembership({
      organizationId: home.householdId,
      userId: BOB.userId,
      roleSlug: "admin",
    });
    await leaveV2Household(deps, { userId: ALICE.userId, householdId: home.householdId });
    const replay = await createHome();
    expect(replay.householdId).toBe(home.householdId);
    expect(directory.organizations.get(home.householdId)?.deleted).toBe(false);
    expect(directory.memberships.values()).toContainEqual(
      expect.objectContaining({ userId: BOB.userId }),
    );
  });

  it("serializes last-admin demotion and leave so one admin survives", async () => {
    const home = await createHome();
    directory.seedMembership({
      organizationId: home.householdId,
      userId: BOB.userId,
      roleSlug: "admin",
    });
    await listV2Households(deps, BOB);
    const results = await Promise.allSettled([
      setV2MemberRole(deps, {
        userId: ALICE.userId,
        householdId: home.householdId,
        targetUserId: BOB.userId,
        role: "member",
      }),
      leaveV2Household(deps, { userId: ALICE.userId, householdId: home.householdId }),
    ]);
    expect(results.some((result) => result.status === "rejected")).toBe(true);
    expect(
      [...directory.memberships.values()].filter(
        (row) =>
          row.organizationId === home.householdId &&
          row.roleSlug === "admin" &&
          row.status === "active",
      ),
    ).toHaveLength(1);
  });
});
