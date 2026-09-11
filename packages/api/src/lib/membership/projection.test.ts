import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";

import { createTestDb } from "../../test-support/db";
import { findActiveMembership } from "./access";
import {
  type MembershipObservation,
  projectMembership,
  tombstoneHousehold,
  tombstoneUnlistedUserMemberships,
} from "./projection";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const ORG = "org_household";
const ALICE = "user_alice";
const T0 = new Date("2026-09-01T10:00:00.000Z");
const at = (seconds: number) => new Date(T0.getTime() + seconds * 1_000);

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb({ householdLedgerMirror: false });
  await db.insert(user).values({ id: ALICE, name: "Alice", email: "alice@example.com" });
  await db.insert(household).values({ id: ORG, name: "Home", createdByUserId: ALICE });
});

function observe(overrides: Partial<MembershipObservation> = {}): MembershipObservation {
  return {
    membershipId: "om_1",
    organizationId: ORG,
    userId: ALICE,
    roleSlug: "member",
    status: "active",
    observedAt: at(10),
    eventId: "event_10",
    createdAt: at(10),
    ...overrides,
  };
}

async function projected() {
  const rows = await db.select().from(membership).where(eq(membership.userId, ALICE));
  return rows[0];
}

describe("projectMembership ordering rule", () => {
  it("projects a first observation and grants access", async () => {
    expect(await projectMembership(db, observe())).toBe("applied");
    expect(await findActiveMembership(db, ALICE, ORG)).toEqual({ id: "om_1", role: "member" });
  });

  it("applies the same event twice without changing anything", async () => {
    await projectMembership(db, observe());
    expect(await projectMembership(db, observe())).toBe("applied");
    expect(await projected()).toMatchObject({ role: "member", status: "active" });
  });

  it("ignores an older observation that arrives after a newer one", async () => {
    await projectMembership(db, observe({ roleSlug: "admin", observedAt: at(20), eventId: "e20" }));
    expect(
      await projectMembership(
        db,
        observe({ roleSlug: "member", observedAt: at(10), eventId: "e10" }),
      ),
    ).toBe("ignored");
    expect(await projected()).toMatchObject({ role: "admin", observedEventId: "e20" });
  });

  it("lets a delayed newer observation win over an older one already applied", async () => {
    await projectMembership(db, observe({ roleSlug: "member", observedAt: at(10) }));
    expect(
      await projectMembership(
        db,
        observe({ roleSlug: "viewer", observedAt: at(30), eventId: "e30" }),
      ),
    ).toBe("applied");
    expect(await findActiveMembership(db, ALICE, ORG)).toEqual({ id: "om_1", role: "viewer" });
  });

  it("keeps a deletion tombstone ahead of a stale created event", async () => {
    await projectMembership(db, observe({ observedAt: at(10) }));
    await projectMembership(
      db,
      observe({ status: "inactive", observedAt: at(40), eventId: "e40" }),
    );
    expect(await findActiveMembership(db, ALICE, ORG)).toBeNull();

    // The original `created` event, delivered late and out of order.
    expect(
      await projectMembership(
        db,
        observe({ status: "active", observedAt: at(10), eventId: "e10" }),
      ),
    ).toBe("ignored");
    expect(await findActiveMembership(db, ALICE, ORG)).toBeNull();
  });

  it("re-admits a User through a genuinely newer membership under a new id", async () => {
    await projectMembership(db, observe({ observedAt: at(10) }));
    await projectMembership(db, observe({ status: "inactive", observedAt: at(40) }));
    expect(
      await projectMembership(
        db,
        observe({ membershipId: "om_2", roleSlug: "admin", observedAt: at(50), eventId: "e50" }),
      ),
    ).toBe("applied");
    expect(await findActiveMembership(db, ALICE, ORG)).toEqual({ id: "om_2", role: "admin" });
    expect(await db.select().from(membership)).toHaveLength(1);
  });

  it("does not resolve two distinct events at the same instant in favor of the later arrival", async () => {
    await projectMembership(db, observe({ roleSlug: "admin", observedAt: at(10), eventId: "eA" }));
    expect(
      await projectMembership(
        db,
        observe({ roleSlug: "member", observedAt: at(10), eventId: "eB" }),
      ),
    ).toBe("ignored");
    expect(await projected()).toMatchObject({ role: "admin" });
  });

  it("refuses to write for Households or Users Trove does not know", async () => {
    expect(await projectMembership(db, observe({ organizationId: "org_unknown" }))).toBe(
      "unknown_household",
    );
    expect(await projectMembership(db, observe({ userId: "user_unknown" }))).toBe("unknown_user");
    expect(await db.select().from(membership)).toHaveLength(0);
  });
});

describe("access decisions", () => {
  it("denies pending and unknown-role memberships", async () => {
    await projectMembership(db, observe({ status: "pending" }));
    expect(await findActiveMembership(db, ALICE, ORG)).toBeNull();
    await projectMembership(
      db,
      observe({ status: "active", roleSlug: "billing", observedAt: at(11) }),
    );
    expect(await findActiveMembership(db, ALICE, ORG)).toBeNull();
  });
});

describe("bootstrap tombstones", () => {
  it("tombstones memberships missing from the authoritative list, dated at the list request", async () => {
    await projectMembership(db, observe({ observedAt: at(10) }));
    expect(await tombstoneUnlistedUserMemberships(db, ALICE, [], at(60))).toBe(1);
    expect(await projected()).toMatchObject({ status: "inactive", observedAt: at(60) });
    // A `created` event from before the list cannot resurrect it.
    expect(await projectMembership(db, observe({ observedAt: at(10) }))).toBe("ignored");
  });

  it("leaves a membership created after the list was requested untouched", async () => {
    await projectMembership(db, observe({ observedAt: at(70), eventId: "e70" }));
    expect(await tombstoneUnlistedUserMemberships(db, ALICE, [], at(60))).toBe(0);
    expect(await findActiveMembership(db, ALICE, ORG)).not.toBeNull();
  });

  it("keeps listed memberships", async () => {
    await projectMembership(db, observe({ observedAt: at(10) }));
    expect(await tombstoneUnlistedUserMemberships(db, ALICE, [ORG], at(60))).toBe(0);
  });

  it("tombstones every member when the Organization is deleted", async () => {
    await projectMembership(db, observe({ observedAt: at(10) }));
    expect(await tombstoneHousehold(db, ORG, at(90))).toBe(1);
    expect(await findActiveMembership(db, ALICE, ORG)).toBeNull();
    expect(await db.select().from(household)).toHaveLength(1);
  });
});
