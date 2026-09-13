import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { commandResult, householdChange } from "@trove/db/schema/commands";
import { household, membership } from "@trove/db/schema/household";
import { category } from "@trove/db/schema/ledger";
import type { AppliedResult, CommandEnvelope, CommandKind, CommandResult } from "@trove/protocol";

import { applyCommand } from "../pipeline";
import { createTestDb } from "../../../test-support/db";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const ADMIN = "user-admin";
const SECOND_ADMIN = "user-second-admin";
const MEMBER = "user-member";
const VIEWER = "user-viewer";
const REMOVED = "user-removed";
const PENDING = "user-pending";
const STRANGE_ROLE = "user-strange-role";
const OUTSIDER = "user-outsider";
const HOUSEHOLD_ID = "household-1";

let db: TestDb;

beforeEach(async () => {
  db = await setupHousehold();
});

async function setupHousehold(): Promise<TestDb> {
  const database = await createTestDb();
  const people: readonly (readonly [string, string, "active" | "inactive" | "pending"])[] = [
    [ADMIN, "admin", "active"],
    [SECOND_ADMIN, "admin", "active"],
    [MEMBER, "member", "active"],
    [VIEWER, "viewer", "active"],
    [REMOVED, "admin", "inactive"],
    [PENDING, "admin", "pending"],
    [STRANGE_ROLE, "billing", "active"],
  ];
  await database.insert(user).values(
    [...people.map(([id]) => id), OUTSIDER].map((id) => ({
      id,
      name: id,
      email: `${id}@example.com`,
    })),
  );
  await database.insert(household).values({
    id: HOUSEHOLD_ID,
    name: "Test Household",
    createdByUserId: ADMIN,
  });
  await database.insert(membership).values(
    people.map(([userId, role, status]) => ({
      id: `membership-${userId}`,
      userId,
      householdId: HOUSEHOLD_ID,
      role,
      status,
    })),
  );
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
    kind: overrides.kind ?? "category.create",
    payload: overrides.payload ?? { id: "category-groceries", name: "Groceries", type: "expense" },
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
      requiredCapability: "commands:category.create",
    });
  });

  it("rejects a member who lacks the capability, naming their role", async () => {
    const result = await applyAs(MEMBER, makeEnvelope());
    expect(result).toEqual({
      kind: "forbidden",
      role: "member",
      requiredCapability: "commands:category.create",
    });
  });

  it("rejects a viewer (read-only role) via the capability map", async () => {
    const result = await applyAs(VIEWER, makeEnvelope());
    expect(result.kind).toBe("forbidden");
  });

  it("rejects a removed (inactive) admin exactly like a stranger", async () => {
    const result = await applyAs(REMOVED, makeEnvelope());
    expect(result).toEqual({
      kind: "forbidden",
      role: null,
      requiredCapability: "commands:category.create",
    });
  });

  it("rejects a pending membership before the invitation is accepted", async () => {
    const result = await applyAs(PENDING, makeEnvelope());
    expect(result.kind).toBe("forbidden");
  });

  it("rejects a role slug Trove does not know", async () => {
    const result = await applyAs(STRANGE_ROLE, makeEnvelope());
    expect(result).toEqual({
      kind: "forbidden",
      role: null,
      requiredCapability: "commands:category.create",
    });
  });

  it("appends no change row when authorization fails", async () => {
    await applyAs(MEMBER, makeEnvelope());
    expect(await db.select().from(householdChange)).toHaveLength(0);
  });
});

describe("commands.apply — happy path", () => {
  it("applies atomically and appends exactly one change row", async () => {
    const env = makeEnvelope();
    const result = await applyAs(ADMIN, env);

    const applied = expectApplied(result);
    expect(applied.replayed).toBe(false);
    expect(applied.seq).toBe(1);
    expect(applied.effects).toEqual(["summaries"]);

    const rows = await db.select().from(category).where(eq(category.id, "category-groceries"));
    expect(rows[0]).toMatchObject({ name: "Groceries", householdId: HOUSEHOLD_ID, version: 0 });

    const changes = await db.select().from(householdChange);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      householdId: HOUSEHOLD_ID,
      seq: 1,
      userId: ADMIN,
      commandId: env.commandId,
    });
    expect(changes[0]?.effects).toEqual(["summaries"]);
  });

  it("allocates monotonically increasing per-household seq numbers", async () => {
    const first = expectApplied(await applyAs(ADMIN, makeEnvelope()));
    const second = expectApplied(
      await applyAs(
        SECOND_ADMIN,
        makeEnvelope({ payload: { id: "category-rent", name: "Rent", type: "expense" } }),
      ),
    );
    expect(second.seq).toBe(first.seq + 1);
    expect(await db.select().from(category)).toHaveLength(2);
  });

  it("stores an idempotency record alongside the change row", async () => {
    await applyAs(ADMIN, makeEnvelope());
    const stored = await db.select().from(commandResult);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ householdId: HOUSEHOLD_ID });
  });
});

describe("commands.apply — idempotency", () => {
  it("replays the stored result for a retried command_id without re-executing", async () => {
    const env = makeEnvelope();
    const first = expectApplied(await applyAs(ADMIN, env));
    const retry = expectApplied(await applyAs(ADMIN, env));

    expect(retry.replayed).toBe(true);
    expect(retry.seq).toBe(first.seq);
    expect(retry.effects).toEqual(first.effects);
    expect(retry.applied).toEqual(first.applied);

    expect(await db.select().from(householdChange)).toHaveLength(1);
    expect(await db.select().from(category)).toHaveLength(1);
  });

  it("scopes idempotency per household — the same commandId in another household executes fresh", async () => {
    const env = makeEnvelope();
    const first = expectApplied(await applyAs(ADMIN, env));

    await db.insert(household).values({
      id: "household-2",
      name: "Other Household",
      createdByUserId: ADMIN,
    });
    await db.insert(membership).values({
      id: "membership-h2-admin",
      userId: ADMIN,
      householdId: "household-2",
      role: "admin",
    });

    const other = expectApplied(
      await applyCommand({
        db,
        userId: ADMIN,
        envelope: makeEnvelope({
          commandId: env.commandId,
          householdId: "household-2",
          payload: { id: "category-groceries-h2", name: "Groceries", type: "expense" },
        }),
      }),
    );

    expect(other.replayed).toBe(false);
    expect(other.seq).toBe(1); // independent per-household watermark
    expect(first.seq).toBe(1);
    expect(await db.select().from(category)).toHaveLength(2);
  });
});

describe("commands.apply — precondition validation", () => {
  const update = (preconditions: CommandEnvelope["preconditions"]) =>
    makeEnvelope({
      kind: "category.update",
      payload: { categoryId: "category-groceries", name: "Food" },
      preconditions,
    });

  it("returns stale_version when expectedVersion does not match", async () => {
    expectApplied(await applyAs(ADMIN, makeEnvelope()));
    const result = await applyAs(ADMIN, update([{ expectedVersion: 7 }]));
    expect(result).toEqual({
      kind: "stale_version",
      entityId: "category-groceries",
      expectedVersion: 7,
      actualVersion: 0,
    });
    expect(await db.select().from(householdChange)).toHaveLength(1);
  });

  it("applies when expectedVersion matches current state", async () => {
    expectApplied(await applyAs(ADMIN, makeEnvelope()));
    const result = expectApplied(await applyAs(ADMIN, update([{ expectedVersion: 0 }])));
    expect(result.replayed).toBe(false);
    const rows = await db.select().from(category).where(eq(category.id, "category-groceries"));
    expect(rows[0]).toMatchObject({ name: "Food", version: 1 });
  });
});

describe("commands.apply — intent validation", () => {
  it("rejects malformed payloads as invalid_intent", async () => {
    const result = await applyAs(ADMIN, makeEnvelope({ payload: { name: 42 } }));
    expect(result.kind).toBe("invalid_intent");
    if (result.kind === "invalid_intent") {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });

  it("returns missing_entity for an unknown parent category", async () => {
    const result = await applyAs(
      ADMIN,
      makeEnvelope({
        payload: { id: "category-child", name: "Child", type: "expense", parentId: "nope" },
      }),
    );
    expect(result).toEqual({
      kind: "missing_entity",
      entityType: "category",
      entityId: "nope",
    });
  });

  it("rejects unsupported predicate preconditions instead of silently ignoring them", async () => {
    const result = await applyAs(
      ADMIN,
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

  it("rejects removed or unknown command kinds as invalid_intent", async () => {
    for (const retired of ["card_payment.record", "member.role.change"]) {
      const result = await applyAs(
        ADMIN,
        makeEnvelope({ kind: retired as CommandKind, payload: {} }),
      );
      expect(result).toEqual({
        kind: "invalid_intent",
        issues: [
          {
            field: "kind",
            message: `Unknown or unsupported command kind "${retired}".`,
          },
        ],
      });
    }
    expect(await db.select().from(householdChange)).toHaveLength(0);
  });
});
