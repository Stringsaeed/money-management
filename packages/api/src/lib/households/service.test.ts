import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership, widgetHandoff } from "@trove/db/schema/household";
import { ledgerAccount } from "@trove/db/schema/ledger";
import { ledger } from "@trove/db/schema/ledger-scope";

import { createTestDb } from "../../test-support/db";
import { type FakeDirectory, createFakeDirectory } from "../../test-support/fake-directory";
import { findActiveMembership } from "../membership/access";
import { applyHouseholdEvent } from "../membership/reconcile";
import {
  type HouseholdDeps,
  createHousehold,
  deleteHousehold,
  exchangeWidgetHandoff,
  getHousehold,
  inviteMember,
  leaveHousehold,
  listMyHouseholds,
  removeMember,
  setMemberRole,
  startWidgetHandoff,
} from "./service";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const ALICE = { id: "user_alice", email: "alice@example.com", name: "Alice" };
const BOB = { id: "user_bob", email: "bob@example.com", name: "Bob" };
const CARLA = { id: "user_carla", email: "carla@example.com", name: "Carla" };
const REQUEST = "11111111-1111-4111-8111-111111111111";

let db: TestDb;
let directory: FakeDirectory;
let now: Date;
let deps: HouseholdDeps;

beforeEach(async () => {
  db = await createTestDb({ householdLedgerMirror: false });
  directory = createFakeDirectory();
  now = new Date("2026-09-01T12:00:00.000Z");
  deps = { db, directory, now: () => now };
  for (const person of [ALICE, BOB]) {
    directory.seedUser(person);
  }
});

const advance = (ms: number) => {
  now = new Date(now.getTime() + ms);
};

async function createHome() {
  return createHousehold(deps, { actor: ALICE, name: "Home", requestId: REQUEST });
}

/** Simulates Bob accepting an AuthKit invitation: WorkOS holds the membership, Trove learns of it later. */
function bobJoins(householdId: string, roleSlug = "member") {
  return directory.seedMembership({ organizationId: householdId, userId: BOB.id, roleSlug });
}

describe("createHousehold", () => {
  it("creates one Organization, one ledger, one household and an admin membership", async () => {
    const created = await createHome();

    expect(directory.organizations.get(created.householdId)).toMatchObject({ name: "Home" });
    expect(await db.select().from(ledger).where(eq(ledger.id, created.householdId))).toHaveLength(
      1,
    );
    expect(await db.select().from(household).where(eq(household.id, created.householdId))).toEqual([
      expect.objectContaining({
        name: "Home",
        createRequestId: REQUEST,
        createdByUserId: ALICE.id,
      }),
    ]);
    expect(await findActiveMembership(db, ALICE.id, created.householdId)).toEqual({
      id: expect.stringMatching(/^om_/),
      role: "admin",
    });
  });

  it("retries with the same requestId converge on the same Household", async () => {
    const first = await createHome();
    const second = await createHome();
    expect(second.householdId).toBe(first.householdId);
    expect(directory.organizations.size).toBe(1);
    expect(await db.select().from(household)).toHaveLength(1);
    expect(await db.select().from(membership)).toHaveLength(1);
  });

  it("finishes a create whose membership step failed on the first attempt", async () => {
    directory.failNext("createMembership");
    await expect(createHome()).rejects.toThrow(/createMembership failed/);
    expect(await db.select().from(household)).toHaveLength(1);
    expect(await db.select().from(membership)).toHaveLength(0);

    const retried = await createHome();
    expect(directory.organizations.size).toBe(1);
    expect(await findActiveMembership(db, ALICE.id, retried.householdId)).toMatchObject({
      role: "admin",
    });
  });

  it("finishes a create whose Organization was made but never recorded", async () => {
    directory.failNext("listUserMemberships");
    await expect(createHome()).rejects.toThrow();
    expect(directory.organizations.size).toBe(1);

    const retried = await createHome();
    expect(directory.organizations.size).toBe(1);
    expect(await db.select().from(household)).toEqual([
      expect.objectContaining({ id: retried.householdId }),
    ]);
  });

  it("refuses another User's requestId", async () => {
    await createHome();
    await expect(
      createHousehold(deps, { actor: BOB, name: "Mine", requestId: REQUEST }),
    ).rejects.toThrow(/another User/);
  });
});

describe("listMyHouseholds", () => {
  it("bootstraps memberships WorkOS knows about that Trove has not projected yet", async () => {
    const home = await createHome();
    bobJoins(home.householdId);

    const mine = await listMyHouseholds(deps, BOB);
    expect(mine).toEqual([
      expect.objectContaining({ householdId: home.householdId, name: "Home", role: "member" }),
    ]);
  });

  it("reuses a fresh bootstrap and refreshes a stale one", async () => {
    const home = await createHome();
    await listMyHouseholds(deps, BOB);
    const calls = directory.calls.filter((call) => call === "listUserMemberships").length;

    bobJoins(home.householdId);
    expect(await listMyHouseholds(deps, BOB)).toHaveLength(0);
    expect(directory.calls.filter((call) => call === "listUserMemberships")).toHaveLength(calls);

    advance(61_000);
    expect(await listMyHouseholds(deps, BOB)).toHaveLength(1);
  });

  it("drops a membership WorkOS no longer lists, even when the event was missed", async () => {
    const home = await createHome();
    const bob = bobJoins(home.householdId);
    expect(await listMyHouseholds(deps, BOB)).toHaveLength(1);

    directory.memberships.delete(bob.id);
    advance(61_000);
    expect(await listMyHouseholds(deps, BOB)).toHaveLength(0);
    expect(await findActiveMembership(db, BOB.id, home.householdId)).toBeNull();
  });

  it("ignores Organizations Trove did not create", async () => {
    directory.seedMembership({
      organizationId: "org_elsewhere",
      userId: BOB.id,
      roleSlug: "admin",
    });
    expect(await listMyHouseholds(deps, BOB)).toEqual([]);
    expect(await db.select().from(membership)).toHaveLength(0);
  });

  it("hides memberships with a role slug Trove does not know", async () => {
    const home = await createHome();
    bobJoins(home.householdId, "billing");
    expect(await listMyHouseholds(deps, BOB)).toEqual([]);
  });
});

describe("getHousehold", () => {
  it("lists members and projects Users Trove has never seen", async () => {
    const home = await createHome();
    directory.seedUser(CARLA);
    directory.seedMembership({
      organizationId: home.householdId,
      userId: CARLA.id,
      roleSlug: "viewer",
    });

    const detail = await getHousehold(deps, ALICE.id, home.householdId);
    expect(detail.members.map((member) => [member.userId, member.role])).toEqual([
      [ALICE.id, "admin"],
      [CARLA.id, "viewer"],
    ]);
    expect(detail.adminless).toBe(false);
    expect(await db.select().from(user).where(eq(user.id, CARLA.id))).toEqual([
      expect.objectContaining({ email: CARLA.email, name: CARLA.name }),
    ]);
  });

  it("is invisible to non-members and to removed members", async () => {
    const home = await createHome();
    await expect(getHousehold(deps, BOB.id, home.householdId)).rejects.toThrow(/not a member/);
  });

  it("reports a Household left without an admin by a widget-side change", async () => {
    const home = await createHome();
    const alice = [...directory.memberships.values()].find((row) => row.userId === ALICE.id);
    await directory.setMembershipRole(alice!.id, "member");
    advance(61_000);
    const detail = await getHousehold(deps, ALICE.id, home.householdId);
    expect(detail.adminless).toBe(true);
  });
});

describe("member administration", () => {
  it("lets only admins invite, through WorkOS invitations", async () => {
    const home = await createHome();
    bobJoins(home.householdId);
    await listMyHouseholds(deps, BOB);

    const invitation = await inviteMember(deps, {
      userId: ALICE.id,
      householdId: home.householdId,
      email: "Carla@Example.com",
      role: "viewer",
    });
    expect(invitation.invitationId).toMatch(/^invitation_/);
    expect(directory.invitations).toEqual([
      expect.objectContaining({
        email: "carla@example.com",
        organizationId: home.householdId,
        roleSlug: "viewer",
      }),
    ]);

    await expect(
      inviteMember(deps, {
        userId: BOB.id,
        householdId: home.householdId,
        email: "x@example.com",
        role: "member",
      }),
    ).rejects.toThrow(/admin/);
  });

  it("changes a role in WorkOS first and projects the result", async () => {
    const home = await createHome();
    bobJoins(home.householdId);
    await listMyHouseholds(deps, BOB);

    await setMemberRole(deps, {
      userId: ALICE.id,
      householdId: home.householdId,
      targetUserId: BOB.id,
      role: "admin",
    });
    expect(await findActiveMembership(db, BOB.id, home.householdId)).toMatchObject({
      role: "admin",
    });
    expect([...directory.memberships.values()].find((row) => row.userId === BOB.id)?.roleSlug).toBe(
      "admin",
    );
  });

  it("keeps the last admin in place", async () => {
    const home = await createHome();
    bobJoins(home.householdId);
    await listMyHouseholds(deps, BOB);

    await expect(
      setMemberRole(deps, {
        userId: ALICE.id,
        householdId: home.householdId,
        targetUserId: ALICE.id,
        role: "member",
      }),
    ).rejects.toThrow(/no admin left/);
    await expect(
      leaveHousehold(deps, { userId: ALICE.id, householdId: home.householdId }),
    ).rejects.toThrow(/no admin left/);
    await expect(
      removeMember(deps, {
        userId: ALICE.id,
        householdId: home.householdId,
        targetUserId: ALICE.id,
      }),
    ).rejects.toThrow(/no admin left/);
    expect(await findActiveMembership(db, ALICE.id, home.householdId)).toMatchObject({
      role: "admin",
    });
  });

  it("removes a member: WorkOS deletion plus an immediate local tombstone", async () => {
    const home = await createHome();
    const bob = bobJoins(home.householdId);
    await listMyHouseholds(deps, BOB);

    await removeMember(deps, {
      userId: ALICE.id,
      householdId: home.householdId,
      targetUserId: BOB.id,
    });
    expect(directory.memberships.has(bob.id)).toBe(false);
    expect(await findActiveMembership(db, BOB.id, home.householdId)).toBeNull();

    // The deletion event that follows carries the same fact.
    const outcome = await applyHouseholdEvent(deps, {
      kind: "membership",
      eventId: "event_deleted",
      observedAt: new Date(now.getTime() + 500),
      membership: bob,
      deleted: true,
    });
    expect(outcome).toBe("applied");
    expect(await findActiveMembership(db, BOB.id, home.householdId)).toBeNull();
  });

  it("lets a non-admin leave and an admin leave once another admin exists", async () => {
    const home = await createHome();
    bobJoins(home.householdId, "admin");
    await listMyHouseholds(deps, BOB);

    await leaveHousehold(deps, { userId: ALICE.id, householdId: home.householdId });
    expect(await findActiveMembership(db, ALICE.id, home.householdId)).toBeNull();
    expect(await findActiveMembership(db, BOB.id, home.householdId)).toMatchObject({
      role: "admin",
    });
  });
});

describe("deleteHousehold", () => {
  it("removes the Organization, the Household, and its ledger data; personal data stays", async () => {
    const home = await createHome();
    await db.insert(ledger).values({
      id: `personal:${ALICE.id}`,
      kind: "personal",
      personalUserId: ALICE.id,
    });
    await db.insert(ledgerAccount).values([
      {
        ledgerId: home.householdId,
        householdId: home.householdId,
        id: "acc-shared",
        name: "Shared",
        type: "bank",
        currency: "USD",
        version: 0,
        createdBy: ALICE.id,
        updatedBy: ALICE.id,
      },
      {
        ledgerId: `personal:${ALICE.id}`,
        householdId: null,
        id: "acc-personal",
        name: "Personal",
        type: "bank",
        currency: "USD",
        version: 0,
        createdBy: ALICE.id,
        updatedBy: ALICE.id,
      },
    ]);

    await deleteHousehold(deps, { userId: ALICE.id, householdId: home.householdId });

    expect(directory.organizations.get(home.householdId)?.deleted).toBe(true);
    expect(await db.select().from(household)).toHaveLength(0);
    expect(await db.select().from(ledger)).toEqual([expect.objectContaining({ kind: "personal" })]);
    expect((await db.select().from(ledgerAccount)).map((row) => row.id)).toEqual(["acc-personal"]);
  });

  it("is admin-only", async () => {
    const home = await createHome();
    bobJoins(home.householdId);
    await listMyHouseholds(deps, BOB);
    await expect(
      deleteHousehold(deps, { userId: BOB.id, householdId: home.householdId }),
    ).rejects.toThrow(/admin/);
  });
});

describe("widget handoff", () => {
  it("issues a single-use code to admins only and exchanges it for a bound token", async () => {
    const home = await createHome();
    bobJoins(home.householdId);
    await listMyHouseholds(deps, BOB);

    await expect(
      startWidgetHandoff(deps, { userId: BOB.id, householdId: home.householdId }),
    ).rejects.toThrow(/admin/);

    const handoff = await startWidgetHandoff(deps, {
      userId: ALICE.id,
      householdId: home.householdId,
    });
    expect(handoff.code).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    const stored = await db.select().from(widgetHandoff);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.codeHash).not.toBe(handoff.code);

    const session = await exchangeWidgetHandoff(deps, handoff.code);
    expect(session).toEqual({
      token: `widget-token:${ALICE.id}:${home.householdId}`,
      organizationId: home.householdId,
      householdName: "Home",
    });
    expect(await exchangeWidgetHandoff(deps, handoff.code)).toBeNull();
  });

  it("rejects expired codes and codes whose admin was demoted in the meantime", async () => {
    const home = await createHome();
    const expired = await startWidgetHandoff(deps, {
      userId: ALICE.id,
      householdId: home.householdId,
    });
    advance(121_000);
    expect(await exchangeWidgetHandoff(deps, expired.code)).toBeNull();

    const fresh = await startWidgetHandoff(deps, {
      userId: ALICE.id,
      householdId: home.householdId,
    });
    await db.update(membership).set({ role: "member" }).where(eq(membership.userId, ALICE.id));
    expect(await exchangeWidgetHandoff(deps, fresh.code)).toBeNull();
    expect(await exchangeWidgetHandoff(deps, "not-a-real-code-at-all")).toBeNull();
  });
});

describe("applyHouseholdEvent", () => {
  it("projects a created membership for a User Trove has never seen", async () => {
    const home = await createHome();
    directory.seedUser(CARLA);
    const carla = directory.seedMembership({
      organizationId: home.householdId,
      userId: CARLA.id,
      roleSlug: "member",
    });
    const outcome = await applyHouseholdEvent(deps, {
      kind: "membership",
      eventId: "event_created",
      observedAt: carla.updatedAt,
      membership: carla,
      deleted: false,
    });
    expect(outcome).toBe("applied");
    expect(await findActiveMembership(db, CARLA.id, home.householdId)).toMatchObject({
      role: "member",
    });
  });

  it("denies everyone when the Organization is deleted, keeping the data", async () => {
    const home = await createHome();
    const outcome = await applyHouseholdEvent(deps, {
      kind: "organization_deleted",
      eventId: "event_org_deleted",
      observedAt: new Date(now.getTime() + 1_000),
      organizationId: home.householdId,
    });
    expect(outcome).toBe("tombstoned");
    expect(await findActiveMembership(db, ALICE.id, home.householdId)).toBeNull();
    expect(await db.select().from(household)).toHaveLength(1);
  });

  it("ignores events for Organizations Trove does not know", async () => {
    const stranger = directory.seedMembership({
      organizationId: "org_elsewhere",
      userId: BOB.id,
      roleSlug: "admin",
    });
    const outcome = await applyHouseholdEvent(deps, {
      kind: "membership",
      eventId: "event_x",
      observedAt: stranger.updatedAt,
      membership: stranger,
      deleted: false,
    });
    expect(outcome).toBe("unknown_household");
  });
});
