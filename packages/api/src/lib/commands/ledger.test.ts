import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { commandResult } from "@trove/db/schema/commands";
import { household, membership } from "@trove/db/schema/household";
import { fundingMembership, periodProjectionCache } from "@trove/db/schema/budget";
import { ledgerAccount, category, transaction } from "@trove/db/schema/ledger";
import type { AppliedResult, CommandEnvelope, CommandResult } from "@trove/protocol";

import { applyCommand } from "./pipeline";
import { createTestDb } from "../../test-support/db";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const OWNER = "user-owner";
const ADMIN = "user-admin";
const MEMBER = "user-member";
const VIEWER = "user-viewer";
const OUTSIDER = "user-outsider";
const HOUSEHOLD_ID = "household-1";
const OTHER_HOUSEHOLD_ID = "household-2";

let db: TestDb;

beforeEach(async () => {
  db = await setupHousehold();
});

async function setupHousehold(): Promise<TestDb> {
  const database = await createTestDb();
  for (const [id, name] of [
    [OWNER, "Owner"],
    [ADMIN, "Admin"],
    [MEMBER, "Member"],
    [VIEWER, "Viewer"],
    [OUTSIDER, "Outsider"],
  ] as const) {
    await database.insert(user).values({ id, name, email: `${id}@example.com` });
  }
  await database.insert(household).values({
    id: HOUSEHOLD_ID,
    name: "Ledger Household",
    createdByUserId: OWNER,
  });
  await database.insert(household).values({
    id: OTHER_HOUSEHOLD_ID,
    name: "Other Household",
    createdByUserId: OUTSIDER,
  });
  await database.insert(membership).values([
    { id: "membership-owner", userId: OWNER, householdId: HOUSEHOLD_ID, role: "owner", version: 0 },
    { id: "membership-admin", userId: ADMIN, householdId: HOUSEHOLD_ID, role: "admin", version: 0 },
    {
      id: "membership-member",
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      role: "member",
      version: 0,
    },
    {
      id: "membership-viewer",
      userId: VIEWER,
      householdId: HOUSEHOLD_ID,
      role: "viewer",
      version: 0,
    },
    {
      id: "membership-outsider",
      userId: OUTSIDER,
      householdId: OTHER_HOUSEHOLD_ID,
      role: "owner",
      version: 0,
    },
  ]);
  return database;
}

function makeEnvelope(
  kind: CommandEnvelope["kind"],
  payload?: unknown,
  householdId: string = HOUSEHOLD_ID,
): CommandEnvelope {
  return {
    commandId: crypto.randomUUID(),
    householdId,
    kind,
    payload: payload ?? {},
  };
}

function applyAs(userId: string, env: CommandEnvelope): Promise<CommandResult> {
  return applyCommand({ db, userId, envelope: env });
}

function expectApplied(result: CommandResult): AppliedResult {
  expect(result.kind).toBe("applied");
  return result as AppliedResult;
}

/** Seeds one active account directly (bypassing commands) for edit targets. */
async function seedAccount(overrides: Partial<typeof ledgerAccount.$inferInsert> = {}) {
  const row = {
    householdId: HOUSEHOLD_ID,
    id: overrides.id ?? "acc-1",
    name: "Checking",
    type: "bank" as const,
    currency: "USD",
    version: 0,
    ownerUserId: OWNER,
    createdBy: OWNER,
    updatedBy: OWNER,
    ...overrides,
  };
  await db.insert(ledgerAccount).values(row);
  return row;
}

async function seedCategory(overrides: Partial<typeof category.$inferInsert> = {}) {
  const row = {
    householdId: HOUSEHOLD_ID,
    id: overrides.id ?? "cat-1",
    name: "Groceries",
    type: "expense" as const,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
    ...overrides,
  };
  await db.insert(category).values(row);
  return row;
}

async function seedTransaction(overrides: Partial<typeof transaction.$inferInsert> = {}) {
  const row = {
    householdId: HOUSEHOLD_ID,
    id: overrides.id ?? "tx-1",
    type: "expense" as const,
    amountMinor: 2500,
    currency: "USD",
    date: "2026-01-15",
    accountId: overrides.accountId ?? "acc-1",
    categoryId: overrides.categoryId ?? "cat-1",
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
    ...overrides,
  };
  await db.insert(transaction).values(row);
  return row;
}

describe("ledger commands — accounts", () => {
  it("creates an account with attribution and balances effects", async () => {
    const result = expectApplied(
      await applyAs(OWNER, {
        ...makeEnvelope("account.create"),
        payload: { name: "Savings", type: "cash", currency: "USD", initialBalanceMinor: 10_000 },
      }),
    );

    expect(result.effects).toEqual(["balances", "summaries"]);
    const rows = await db.select().from(ledgerAccount).where(eq(ledgerAccount.name, "Savings"));
    expect(rows).toHaveLength(1);
    expect(rows[0].createdBy).toBe(OWNER);
    expect(rows[0].lifecycle).toBe("active");
  });

  it("updates an account and bumps the version", async () => {
    await seedAccount();
    expectApplied(
      await applyAs(OWNER, {
        ...makeEnvelope("account.update"),
        payload: { accountId: "acc-1", name: "Everyday", visibility: "private" },
      }),
    );

    const rows = await db.select().from(ledgerAccount).where(eq(ledgerAccount.id, "acc-1"));
    expect(rows[0].name).toBe("Everyday");
    expect(rows[0].version).toBe(1);
    expect(rows[0].updatedBy).toBe(OWNER);
    expect(rows[0].visibility).toBe("private");
    expect(rows[0].ownerUserId).toBe(OWNER);
  });

  it("keeps private accounts writable only by their owner", async () => {
    await seedAccount({ ownerUserId: OWNER, visibility: "private" });

    await expect(
      applyAs(ADMIN, {
        ...makeEnvelope("account.update"),
        payload: { accountId: "acc-1", name: "Not yours" },
      }),
    ).resolves.toMatchObject({ kind: "forbidden", requiredCapability: "accounts:private.owner" });

    await expect(
      applyAs(ADMIN, {
        ...makeEnvelope("account.archive"),
        payload: { accountId: "acc-1" },
      }),
    ).resolves.toMatchObject({ kind: "forbidden", requiredCapability: "accounts:private.owner" });
  });

  it("refuses to privatize an account with active Funding Membership", async () => {
    await seedAccount();
    await db.insert(fundingMembership).values({
      householdId: HOUSEHOLD_ID,
      accountId: "acc-1",
      currency: "USD",
      active: true,
      effectiveFromPeriod: "2026-01",
      version: 0,
      createdBy: OWNER,
      updatedBy: OWNER,
    });

    await expect(
      applyAs(OWNER, {
        ...makeEnvelope("account.update"),
        payload: { accountId: "acc-1", visibility: "private" },
      }),
    ).resolves.toMatchObject({ kind: "invalid_intent" });
  });

  it("archives instead of deleting (ADR-0009) and stamps lifecycleChangedAt", async () => {
    await seedAccount();
    expectApplied(
      await applyAs(OWNER, { ...makeEnvelope("account.archive"), payload: { accountId: "acc-1" } }),
    );

    const rows = await db.select().from(ledgerAccount).where(eq(ledgerAccount.id, "acc-1"));
    expect(rows[0].lifecycle).toBe("archived");
    expect(rows[0].lifecycleChangedAt).not.toBeNull();
  });

  it("rejects a stale expectedVersion with stale_version", async () => {
    await seedAccount({ version: 3 });
    const result = await applyAs(OWNER, {
      ...makeEnvelope("account.update"),
      payload: { accountId: "acc-1", name: "Renamed" },
      preconditions: [{ entityId: "acc-1", expectedVersion: 2 }],
    });

    expect(result).toMatchObject({ kind: "stale_version", actualVersion: 3, expectedVersion: 2 });
    // The rename never landed.
    expect((await db.select().from(ledgerAccount))[0].name).toBe("Checking");
  });

  it("returns missing_entity for an unknown account", async () => {
    const result = await applyAs(OWNER, {
      ...makeEnvelope("account.update"),
      payload: { accountId: "nope", name: "X" },
    });
    expect(result).toMatchObject({ kind: "missing_entity", entityType: "account" });
  });

  it("keeps structural writes owner/admin-only", async () => {
    await expect(
      applyAs(MEMBER, {
        ...makeEnvelope("account.create"),
        payload: { name: "Side Account", type: "cash" },
      }),
    ).resolves.toMatchObject({ kind: "forbidden", requiredCapability: "commands:account.create" });
    await expect(
      applyAs(VIEWER, {
        ...makeEnvelope("account.archive"),
        payload: { accountId: "acc-1" },
      }),
    ).resolves.toMatchObject({ kind: "forbidden" });
  });

  it("refuses edits to archived accounts", async () => {
    await seedAccount({ lifecycle: "archived" });
    const result = await applyAs(OWNER, {
      ...makeEnvelope("account.update"),
      payload: { accountId: "acc-1", name: "Zombie" },
    });
    expect(result).toMatchObject({ kind: "invalid_intent" });
  });
});

describe("ledger commands — categories", () => {
  it("creates, updates, and archives categories", async () => {
    expectApplied(
      await applyAs(OWNER, {
        ...makeEnvelope("category.create"),
        payload: { name: "Dining", type: "expense" },
      }),
    );
    const created = (await db.select().from(category).where(eq(category.name, "Dining")))[0];

    expectApplied(
      await applyAs(OWNER, {
        ...makeEnvelope("category.update"),
        payload: { categoryId: created.id, parentId: null, icon: "🍽️" },
      }),
    );
    let rows = await db.select().from(category).where(eq(category.id, created.id));
    expect(rows[0].icon).toBe("🍽️");
    expect(rows[0].version).toBe(1);

    expectApplied(
      await applyAs(OWNER, {
        ...makeEnvelope("category.archive"),
        payload: { categoryId: created.id },
      }),
    );
    rows = await db.select().from(category).where(eq(category.id, created.id));
    expect(rows[0].lifecycle).toBe("archived");
  });

  it("rejects a parent from outside the household via missing_entity", async () => {
    await db.insert(category).values({
      householdId: OTHER_HOUSEHOLD_ID,
      id: "cat-foreign",
      name: "Foreign Parent",
      type: "expense",
      version: 0,
      createdBy: OUTSIDER,
      updatedBy: OUTSIDER,
    });

    const result = await applyAs(OWNER, {
      ...makeEnvelope("category.create"),
      payload: { name: "Kid", type: "expense", parentId: "cat-foreign" },
    });
    expect(result).toMatchObject({ kind: "missing_entity", entityType: "category" });
    expect(
      await db.select().from(category).where(eq(category.householdId, HOUSEHOLD_ID)),
    ).toHaveLength(0);
  });

  it("keeps category writes owner/admin-only", async () => {
    await expect(
      applyAs(MEMBER, {
        ...makeEnvelope("category.create"),
        payload: { name: "Rogue", type: "income" },
      }),
    ).resolves.toMatchObject({ kind: "forbidden" });
  });
});

describe("ledger commands — transactions", () => {
  beforeEach(async () => {
    await seedAccount();
    await seedCategory();
  });

  it("creates an expense and derives the currency from the account", async () => {
    const result = expectApplied(
      await applyAs(MEMBER, {
        ...makeEnvelope("transaction.create"),
        payload: {
          type: "expense",
          amountMinor: 4200,
          date: "2026-02-10",
          accountId: "acc-1",
          categoryId: "cat-1",
          description: "Coffee beans",
        },
      }),
    );

    expect(result.effects).toEqual(["ledger", "balances", "summaries", "projections"]);
    const applied = expectApplied(result);
    const rows = await db
      .select()
      .from(transaction)
      .where(eq(transaction.id, (applied.applied as { transactionId: string }).transactionId));
    expect(rows[0]).toMatchObject({
      currency: "USD",
      amountMinor: 4200,
      createdBy: MEMBER,
    });
  });

  it("rejects a household member writing a private account transaction", async () => {
    await db
      .update(ledgerAccount)
      .set({ ownerUserId: OWNER, visibility: "private" })
      .where(eq(ledgerAccount.id, "acc-1"));
    await seedTransaction({ id: "private-transaction" });
    await seedAccount({ id: "acc-public", name: "Shared Account" });

    await expect(
      applyAs(MEMBER, {
        ...makeEnvelope("transaction.create"),
        payload: {
          type: "expense",
          amountMinor: 4200,
          date: "2026-02-10",
          accountId: "acc-1",
          categoryId: "cat-1",
        },
      }),
    ).resolves.toMatchObject({ kind: "forbidden", requiredCapability: "accounts:private.owner" });

    await expect(
      applyAs(MEMBER, {
        ...makeEnvelope("transaction.remove"),
        payload: { transactionId: "private-transaction" },
      }),
    ).resolves.toMatchObject({ kind: "forbidden", requiredCapability: "accounts:private.owner" });

    await expect(
      applyAs(MEMBER, {
        ...makeEnvelope("transaction.edit"),
        payload: { transactionId: "private-transaction", accountId: "acc-public" },
      }),
    ).resolves.toMatchObject({ kind: "forbidden", requiredCapability: "accounts:private.owner" });
  });

  it("validates transfer shape with typed rejections", async () => {
    await seedAccount({ id: "acc-2", name: "Cash Wallet", type: "cash" });

    const noDestination = await applyAs(MEMBER, {
      ...makeEnvelope("transaction.create"),
      payload: { type: "transfer", amountMinor: 100, date: "2026-02-01", accountId: "acc-1" },
    });
    expect(noDestination).toMatchObject({ kind: "invalid_intent" });

    const sameAccount = await applyAs(MEMBER, {
      ...makeEnvelope("transaction.create"),
      payload: {
        type: "transfer",
        amountMinor: 100,
        date: "2026-02-01",
        accountId: "acc-1",
        toAccountId: "acc-1",
      },
    });
    expect(sameAccount).toMatchObject({ kind: "invalid_intent" });

    expectApplied(
      await applyAs(MEMBER, {
        ...makeEnvelope("transaction.create"),
        payload: {
          type: "transfer",
          amountMinor: 100,
          date: "2026-02-01",
          accountId: "acc-1",
          toAccountId: "acc-2",
        },
      }),
    );
  });

  it("requires a matching-type category", async () => {
    const incomeResult = await applyAs(MEMBER, {
      ...makeEnvelope("transaction.create"),
      payload: {
        type: "expense",
        amountMinor: 500,
        date: "2026-02-01",
        accountId: "acc-1",
        categoryId: "cat-income-mismatch",
      },
    });
    expect(incomeResult).toMatchObject({ kind: "missing_entity", entityType: "category" });

    await seedCategory({ id: "cat-income", name: "Salary", type: "income" });
    const mismatch = await applyAs(MEMBER, {
      ...makeEnvelope("transaction.create"),
      payload: {
        type: "expense",
        amountMinor: 500,
        date: "2026-02-01",
        accountId: "acc-1",
        categoryId: "cat-income",
      },
    });
    expect(mismatch).toMatchObject({ kind: "invalid_intent" });
  });

  it("edits a transaction under optimistic concurrency", async () => {
    await seedTransaction();

    const stale = await applyAs(MEMBER, {
      ...makeEnvelope("transaction.edit"),
      payload: { transactionId: "tx-1", amountMinor: 9999 },
      preconditions: [{ entityId: "tx-1", expectedVersion: 5 }],
    });
    expect(stale).toMatchObject({ kind: "stale_version", actualVersion: 0 });

    expectApplied(
      await applyAs(MEMBER, {
        ...makeEnvelope("transaction.edit"),
        payload: { transactionId: "tx-1", amountMinor: 3100 },
        preconditions: [{ entityId: "tx-1", expectedVersion: 0 }],
      }),
    );

    const rows = await db.select().from(transaction).where(eq(transaction.id, "tx-1"));
    expect(rows[0]).toMatchObject({ amountMinor: 3100, version: 1, updatedBy: MEMBER });
  });

  it("removes a transaction and guards against double removal", async () => {
    await seedTransaction({ version: 2 });

    expectApplied(
      await applyAs(OWNER, {
        ...makeEnvelope("transaction.remove"),
        payload: { transactionId: "tx-1" },
        preconditions: [{ entityId: "tx-1", expectedVersion: 2 }],
      }),
    );
    expect(await db.select().from(transaction)).toHaveLength(0);

    const again = await applyAs(OWNER, {
      ...makeEnvelope("transaction.remove"),
      payload: { transactionId: "tx-1" },
    });
    expect(again).toMatchObject({ kind: "missing_entity", entityType: "transaction" });
  });

  it("invalidates projection cache from the earliest affected period on historical edits (ADR-0005)", async () => {
    await seedTransaction({ date: "2025-11-20" });
    await db.insert(periodProjectionCache).values([
      {
        householdId: HOUSEHOLD_ID,
        currency: "USD",
        budgetPeriod: "2025-10",
        projectionJson: {},
        seqStamped: 1,
      },
      {
        householdId: HOUSEHOLD_ID,
        currency: "USD",
        budgetPeriod: "2025-11",
        projectionJson: {},
        seqStamped: 2,
      },
      {
        householdId: HOUSEHOLD_ID,
        currency: "USD",
        budgetPeriod: "2025-12",
        projectionJson: {},
        seqStamped: 3,
      },
      {
        householdId: HOUSEHOLD_ID,
        currency: "USD",
        budgetPeriod: "2026-01",
        projectionJson: {},
        seqStamped: 4,
      },
    ]);

    // Historical correction moved the entry from Nov into January.
    expectApplied(
      await applyAs(OWNER, {
        ...makeEnvelope("transaction.edit"),
        payload: { transactionId: "tx-1", date: "2026-01-05" },
      }),
    );

    const remaining = await db.select().from(periodProjectionCache);
    expect(remaining.map((r) => r.budgetPeriod)).toEqual(["2025-10"]);
  });

  it("invalidates projections from the removed transaction's period", async () => {
    await seedTransaction({ date: "2026-03-02" });
    await db.insert(periodProjectionCache).values([
      {
        householdId: HOUSEHOLD_ID,
        currency: "USD",
        budgetPeriod: "2026-02",
        projectionJson: {},
        seqStamped: 9,
      },
      {
        householdId: HOUSEHOLD_ID,
        currency: "USD",
        budgetPeriod: "2026-03",
        projectionJson: {},
        seqStamped: 10,
      },
    ]);

    expectApplied(
      await applyAs(OWNER, {
        ...makeEnvelope("transaction.remove"),
        payload: { transactionId: "tx-1" },
      }),
    );

    expect((await db.select().from(periodProjectionCache)).map((r) => r.budgetPeriod)).toEqual([
      "2026-02",
    ]);
  });

  it("scopes every write by the envelope's household — cross-household ids are invisible", async () => {
    await db.insert(ledgerAccount).values({
      householdId: OTHER_HOUSEHOLD_ID,
      id: "acc-foreign",
      name: "Foreign Account",
      type: "bank",
      currency: "USD",
      version: 0,
      createdBy: OUTSIDER,
      updatedBy: OUTSIDER,
    });

    const result = await applyAs(
      MEMBER,
      makeEnvelope(
        "transaction.edit",
        { transactionId: "tx-foreign", amountMinor: 1 },
        OTHER_HOUSEHOLD_ID,
      ),
    );
    // A member of household-1 gets a typed rejection — never household-2 data.
    expect(result).toMatchObject({ kind: "forbidden" });

    const outsiderResult = await applyAs(
      OUTSIDER,
      makeEnvelope("account.update", { accountId: "acc-foreign", name: "Hijack" }, HOUSEHOLD_ID),
    );
    expect(outsiderResult).toMatchObject({ kind: "forbidden", role: null });
  });
});

describe("ledger sync accuracy", () => {
  it("replays the stored result for a retried ledger command without re-executing", async () => {
    await seedAccount();
    await seedCategory();
    const env: CommandEnvelope = {
      commandId: "retry-tx-1",
      householdId: HOUSEHOLD_ID,
      kind: "transaction.create",
      payload: {
        id: "tx-retry",
        type: "expense",
        amountMinor: 1500,
        date: "2026-02-20",
        accountId: "acc-1",
        categoryId: "cat-1",
      },
    };

    const first = expectApplied(await applyAs(MEMBER, env));
    const second = expectApplied(await applyAs(MEMBER, env));

    expect(second).toEqual({ ...first, replayed: true });
    expect(await db.select().from(transaction).where(eq(transaction.id, "tx-retry"))).toHaveLength(
      1,
    );
    // Only one change-log entry despite two submissions.
    expect(
      await db.select().from(commandResult).where(eq(commandResult.commandId, "retry-tx-1")),
    ).toHaveLength(1);
  });
});
