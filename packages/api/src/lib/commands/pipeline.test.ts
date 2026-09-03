import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { user } from "@trove/db/schema/auth";
import { commandResult, householdChange } from "@trove/db/schema/commands";
import { household, membership } from "@trove/db/schema/household";
import type { AppliedResult, CommandEnvelope, CommandKind, CommandResult } from "@trove/protocol";

import { applyCommand } from "./pipeline";
import { createTestDb } from "./test-db";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const OWNER = "user-owner";
const ADMIN = "user-admin";
const MEMBER = "user-member";
const VIEWER = "user-viewer";
const OUTSIDER = "user-outsider";
const HOUSEHOLD_ID = "household-1";

let db: TestDb;

beforeEach(async () => {
  db = await setupHousehold();
});

async function setupHousehold(): Promise<TestDb> {
  const database = await createTestDb();
  const people: readonly (readonly [string, string, string])[] = [
    [OWNER, "Owner", "owner"],
    [ADMIN, "Admin", "admin"],
    [MEMBER, "Member", "member"],
    [VIEWER, "Viewer", "viewer"],
  ];
  for (const [id, name] of people) {
    await database.insert(user).values({ id, name, email: `${id}@example.com` });
  }
  await database.insert(household).values({
    id: HOUSEHOLD_ID,
    name: "Test Household",
    createdByUserId: OWNER,
  });
  for (const [userId, role] of people.map(([id, , role]) => [id, role] as const)) {
    await database.insert(membership).values({
      id: `membership-${userId}`,
      userId,
      householdId: HOUSEHOLD_ID,
      role,
      version: 0,
    });
  }
  return database;
}

interface EnvelopeOverrides {
  readonly commandId?: string;
  readonly householdId?: string;
  readonly kind?: CommandKind;
  readonly payload?: unknown;
  readonly preconditions?: CommandEnvelope["preconditions"];
}

function makeEnvelope(overrides: EnvelopeOverrides = {}): CommandEnvelope {
  return {
    commandId: overrides.commandId ?? crypto.randomUUID(),
    householdId: overrides.householdId ?? HOUSEHOLD_ID,
    kind: overrides.kind ?? "member.role.change",
    payload: overrides.payload ?? { userId: MEMBER, role: "admin" },
    preconditions: overrides.preconditions,
  };
}

function applyAs(userId: string, env: CommandEnvelope): Promise<CommandResult> {
  return applyCommand({ db, userId, envelope: env });
}

function expectApplied(result: CommandResult): AppliedResult {
  expect(result.kind).toBe("applied");
  return result as AppliedResult;
}

describe("commands.apply — authorization", () => {
  it("rejects a non-member with a null role", async () => {
    const result = await applyAs(OUTSIDER, makeEnvelope());
    expect(result).toEqual({
      kind: "forbidden",
      role: null,
      requiredCapability: "commands:member.role.change",
    });
  });

  it("rejects a member who lacks the capability, naming their role", async () => {
    const result = await applyAs(MEMBER, makeEnvelope());
    expect(result).toEqual({
      kind: "forbidden",
      role: "member",
      requiredCapability: "commands:member.role.change",
    });
  });

  it("rejects a viewer (read-only role) via the capability map", async () => {
    const result = await applyAs(VIEWER, makeEnvelope());
    expect(result.kind).toBe("forbidden");
  });

  it("rejects an admin — only owners may change roles", async () => {
    const result = await applyAs(ADMIN, makeEnvelope());
    expect(result.kind).toBe("forbidden");
  });

  it("appends no change row when authorization fails", async () => {
    await applyAs(MEMBER, makeEnvelope());
    expect(await db.select().from(householdChange)).toHaveLength(0);
  });
});

describe("commands.apply — happy path", () => {
  it("applies atomically and appends exactly one change row", async () => {
    const env = makeEnvelope();
    const result = await applyAs(OWNER, env);

    const applied = expectApplied(result);
    expect(applied.replayed).toBe(false);
    expect(applied.seq).toBe(1);
    expect(applied.effects).toEqual(["members"]);

    const targetRows = await db.select().from(membership).where(eq(membership.userId, MEMBER));
    expect(targetRows[0]).toMatchObject({ role: "admin", version: 1 });

    const changes = await db.select().from(householdChange);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      householdId: HOUSEHOLD_ID,
      seq: 1,
      userId: OWNER,
      commandId: env.commandId,
    });
    expect(changes[0]?.effects).toEqual(["members"]);
  });

  it("publishes the committed notification once, never again for an idempotent replay", async () => {
    const env = makeEnvelope();
    const publications: unknown[] = [];
    const waitUntil = vi.fn();
    const publishChange = async (change: unknown) => {
      publications.push(change);
    };

    const first = expectApplied(
      await applyCommand({ db, userId: OWNER, envelope: env, publishChange, waitUntil }),
    );
    const replay = expectApplied(
      await applyCommand({ db, userId: OWNER, envelope: env, publishChange, waitUntil }),
    );

    expect(replay.replayed).toBe(true);
    expect(publications).toEqual([
      { householdId: HOUSEHOLD_ID, seq: first.seq, effects: first.effects },
    ]);
    expect(waitUntil).toHaveBeenCalledTimes(1);
  });
  it("allocates monotonically increasing per-household seq numbers", async () => {
    const first = expectApplied(await applyAs(OWNER, makeEnvelope()));
    const second = expectApplied(
      await applyAs(OWNER, makeEnvelope({ payload: { userId: MEMBER, role: "member" } })),
    );
    expect(second.seq).toBe(first.seq + 1);

    const targetRows = await db.select().from(membership).where(eq(membership.userId, MEMBER));
    expect(targetRows[0]?.role).toBe("member");
    expect(targetRows[0]?.version).toBe(2);
  });

  it("stores an idempotency record alongside the change row", async () => {
    await applyAs(OWNER, makeEnvelope());
    const stored = await db.select().from(commandResult);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ householdId: HOUSEHOLD_ID });
  });
});

describe("commands.apply — idempotency", () => {
  it("replays the stored result for a retried command_id without re-executing", async () => {
    const env = makeEnvelope();
    const first = expectApplied(await applyAs(OWNER, env));
    const retry = expectApplied(await applyAs(OWNER, env));

    expect(retry.replayed).toBe(true);
    expect(retry.seq).toBe(first.seq);
    expect(retry.effects).toEqual(first.effects);
    expect(retry.applied).toEqual(first.applied);

    expect(await db.select().from(householdChange)).toHaveLength(1);
    const targetRows = await db.select().from(membership).where(eq(membership.userId, MEMBER));
    expect(targetRows[0]?.version).toBe(1);
  });

  it("scopes idempotency per household — the same commandId in another household executes fresh", async () => {
    const env = makeEnvelope();
    const first = expectApplied(await applyAs(OWNER, env));

    // The owner is also an owner of a second household; MEMBER belongs there too.
    await db.insert(household).values({
      id: "household-2",
      name: "Other Household",
      createdByUserId: OWNER,
    });
    await db.insert(membership).values({
      id: "membership-h2-owner",
      userId: OWNER,
      householdId: "household-2",
      role: "owner",
      version: 0,
    });
    await db.insert(membership).values({
      id: `h2-membership-${MEMBER}`,
      userId: MEMBER,
      householdId: "household-2",
      role: "member",
      version: 0,
    });

    // Same commandId, different household → not a replay: fresh execution.
    const other = expectApplied(
      await applyCommand({
        db,
        userId: OWNER,
        envelope: makeEnvelope({
          commandId: env.commandId,
          householdId: "household-2",
          payload: { userId: MEMBER, role: "viewer" },
        }),
      }),
    );

    expect(other.replayed).toBe(false);
    expect(other.seq).toBe(1); // independent per-household watermark
    expect(other.applied).toMatchObject({ role: "viewer" });
    expect(first.seq).toBe(1);
  });
});

describe("commands.apply — precondition validation", () => {
  it("returns stale_version when expectedVersion does not match", async () => {
    const result = await applyAs(
      OWNER,
      makeEnvelope({
        preconditions: [{ entityId: `membership-${MEMBER}`, expectedVersion: 7 }],
      }),
    );
    expect(result).toEqual({
      kind: "stale_version",
      entityId: `membership-${MEMBER}`,
      expectedVersion: 7,
      actualVersion: 0,
    });
    expect(await db.select().from(householdChange)).toHaveLength(0);
  });

  it("applies when expectedVersion matches current state", async () => {
    const result = expectApplied(
      await applyAs(OWNER, makeEnvelope({ preconditions: [{ expectedVersion: 0 }] })),
    );
    expect(result.replayed).toBe(false);
  });
});

describe("commands.apply — intent validation", () => {
  it("rejects malformed payloads as invalid_intent", async () => {
    const result = await applyAs(OWNER, makeEnvelope({ payload: { userId: 42 } }));
    expect(result.kind).toBe("invalid_intent");
    if (result.kind === "invalid_intent") {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });

  it("blocks changing your own role", async () => {
    const result = await applyAs(
      OWNER,
      makeEnvelope({ payload: { userId: OWNER, role: "member" } }),
    );
    expect(result.kind).toBe("invalid_intent");
  });

  it("blocks granting ownership through a role change", async () => {
    const result = await applyAs(
      OWNER,
      makeEnvelope({ payload: { userId: MEMBER, role: "owner" } }),
    );
    expect(result.kind).toBe("invalid_intent");
  });

  it("returns missing_entity for an unknown target user", async () => {
    const result = await applyAs(
      OWNER,
      makeEnvelope({ payload: { userId: OUTSIDER, role: "admin" } }),
    );
    expect(result).toEqual({
      kind: "missing_entity",
      entityType: "membership",
      entityId: OUTSIDER,
    });
  });

  it("rejects unsupported predicate preconditions instead of silently ignoring them", async () => {
    const result = await applyAs(
      OWNER,
      makeEnvelope({
        preconditions: [{ predicate: "unassigned_money_gte", args: { minor: 5000 } }],
      }),
    );
    expect(result.kind).toBe("invalid_intent");
    if (result.kind === "invalid_intent") {
      expect(result.issues[0]?.field).toBe("preconditions");
    }
    expect(await db.select().from(householdChange)).toHaveLength(0);
  });
});
