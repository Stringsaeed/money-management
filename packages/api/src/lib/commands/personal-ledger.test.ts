import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { ledgerAccount, category, transaction } from "@trove/db/schema/ledger";
import { ledger } from "@trove/db/schema/ledger-scope";
import type { AppliedResult, CommandEnvelope, CommandResult } from "@trove/protocol";
import { personalLedgerId } from "@trove/protocol";

import { applyCommand } from "./pipeline";
import { createTestDb } from "../../test-support/db";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const ALICE = "user-alice";
const BOB = "user-bob";
const HOUSEHOLD_ID = "household-shared";

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
  for (const [id, name] of [
    [ALICE, "Alice"],
    [BOB, "Bob"],
  ] as const) {
    await db.insert(user).values({ id, name, email: `${id}@example.com` });
  }
});

function personalEnvelope(kind: CommandEnvelope["kind"], payload: unknown): CommandEnvelope {
  return {
    commandId: crypto.randomUUID(),
    scope: { type: "personal" },
    kind,
    payload,
  };
}

function applyAs(userId: string, envelope: CommandEnvelope): Promise<CommandResult> {
  return applyCommand({ db, userId, envelope });
}

function expectApplied(result: CommandResult): AppliedResult {
  expect(result.kind).toBe("applied");
  return result as AppliedResult;
}

const accountPayload = (id: string, name = "Wallet") => ({
  id,
  name,
  type: "cash" as const,
  currency: "USD",
  initialBalanceMinor: 0,
});

async function createAccount(userId: string, id: string, name?: string): Promise<AppliedResult> {
  return expectApplied(
    await applyAs(userId, personalEnvelope("account.create", accountPayload(id, name))),
  );
}

describe("personal ledger commands — no Household required", () => {
  it("creates an account on a ledger provisioned by the first write", async () => {
    const applied = await createAccount(ALICE, "acc-alice-1", "Everyday");

    expect(applied.seq).toBe(1);

    const ledgers = await db.select().from(ledger);
    expect(ledgers).toEqual([
      expect.objectContaining({
        id: personalLedgerId(ALICE),
        kind: "personal",
        personalUserId: ALICE,
        organizationId: null,
      }),
    ]);

    const rows = await db.select().from(ledgerAccount);
    expect(rows).toEqual([
      expect.objectContaining({
        id: "acc-alice-1",
        ledgerId: personalLedgerId(ALICE),
        householdId: null,
        createdBy: ALICE,
      }),
    ]);
  });

  it("never creates or joins a Household", async () => {
    await createAccount(ALICE, "acc-alice-1");

    expect(await db.select().from(household)).toEqual([]);
    expect(await db.select().from(membership)).toEqual([]);
  });

  it("carries categories and transactions on the same personal ledger", async () => {
    await createAccount(ALICE, "acc-alice-1");
    expectApplied(
      await applyAs(
        ALICE,
        personalEnvelope("category.create", {
          id: "cat-alice-1",
          name: "Coffee",
          type: "expense",
        }),
      ),
    );
    expectApplied(
      await applyAs(
        ALICE,
        personalEnvelope("transaction.create", {
          id: "txn-alice-1",
          type: "expense",
          amountMinor: 450,
          date: "2026-03-01",
          accountId: "acc-alice-1",
          categoryId: "cat-alice-1",
        }),
      ),
    );

    const [txn] = await db.select().from(transaction);
    expect(txn).toMatchObject({
      id: "txn-alice-1",
      ledgerId: personalLedgerId(ALICE),
      householdId: null,
      amountMinor: 450,
    });
    const [cat] = await db.select().from(category);
    expect(cat).toMatchObject({ ledgerId: personalLedgerId(ALICE), householdId: null });
  });

  it("replays a retried command instead of re-executing it", async () => {
    const envelope = personalEnvelope("account.create", accountPayload("acc-alice-1"));
    const first = expectApplied(await applyAs(ALICE, envelope));
    const retry = expectApplied(await applyAs(ALICE, envelope));

    expect(retry.seq).toBe(first.seq);
    expect(retry.replayed).toBe(true);
    expect(await db.select().from(ledgerAccount)).toHaveLength(1);
  });

  it("projects the WorkOS identity so the first write can attribute itself", async () => {
    const CARLA = "user-carla";
    const applied = await applyCommand({
      db,
      userId: CARLA,
      envelope: personalEnvelope("account.create", accountPayload("acc-carla-1")),
      actor: { id: CARLA, email: "Carla@Example.com ", name: "Carla" },
    });
    expectApplied(applied);

    const rows = await db.select().from(user).where(eq(user.id, CARLA));
    expect(rows[0]).toMatchObject({ id: CARLA, name: "Carla", email: "Carla@Example.com" });
  });

  it("rejects Household-only intents with a typed invalid_intent", async () => {
    const result = await applyAs(
      ALICE,
      personalEnvelope("member.role.change", { userId: BOB, role: "admin" }),
    );

    expect(result).toMatchObject({
      kind: "invalid_intent",
      issues: [expect.objectContaining({ field: "scope" })],
    });
  });

  it("rejects an envelope that names no ledger at all", async () => {
    const result = await applyAs(ALICE, {
      commandId: crypto.randomUUID(),
      kind: "account.create",
      payload: accountPayload("acc-alice-1"),
    });

    expect(result).toMatchObject({
      kind: "invalid_intent",
      issues: [expect.objectContaining({ field: "scope" })],
    });
  });
});

describe("personal ledger isolation — one User cannot reach another's ledger", () => {
  beforeEach(async () => {
    await createAccount(ALICE, "acc-alice-1", "Alice Everyday");
    await createAccount(BOB, "acc-bob-1", "Bob Everyday");
  });

  it("keeps each User's rows on their own ledger", async () => {
    const rows = await db.select().from(ledgerAccount);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.ledgerId).sort()).toEqual(
      [personalLedgerId(ALICE), personalLedgerId(BOB)].sort(),
    );
  });

  it("cannot update another User's account — it is invisible, not forbidden", async () => {
    const result = await applyAs(
      BOB,
      personalEnvelope("account.update", { accountId: "acc-alice-1", name: "Hijacked" }),
    );

    expect(result).toMatchObject({ kind: "missing_entity" });
    const rows = await db.select().from(ledgerAccount).where(eq(ledgerAccount.id, "acc-alice-1"));
    expect(rows[0]?.name).toBe("Alice Everyday");
  });

  it("cannot archive another User's account", async () => {
    const result = await applyAs(
      BOB,
      personalEnvelope("account.archive", { accountId: "acc-alice-1" }),
    );

    expect(result).toMatchObject({ kind: "missing_entity" });
  });

  it("cannot book a transaction against another User's account", async () => {
    const result = await applyAs(
      BOB,
      personalEnvelope("transaction.create", {
        id: "txn-cross-1",
        type: "expense",
        amountMinor: 1_000,
        date: "2026-03-01",
        accountId: "acc-alice-1",
      }),
    );

    expect(result).toMatchObject({ kind: "missing_entity" });
    expect(await db.select().from(transaction)).toEqual([]);
  });

  it("cannot link a category from another User's ledger", async () => {
    expectApplied(
      await applyAs(
        ALICE,
        personalEnvelope("category.create", {
          id: "cat-alice-1",
          name: "Coffee",
          type: "expense",
        }),
      ),
    );

    const result = await applyAs(
      BOB,
      personalEnvelope("transaction.create", {
        id: "txn-cross-2",
        type: "expense",
        amountMinor: 1_000,
        date: "2026-03-01",
        accountId: "acc-bob-1",
        categoryId: "cat-alice-1",
      }),
    );

    expect(result).toMatchObject({ kind: "missing_entity" });
    expect(await db.select().from(transaction)).toEqual([]);
  });

  it("allocates change sequences per ledger, not globally", async () => {
    const alice = expectApplied(
      await applyAs(
        ALICE,
        personalEnvelope("category.create", { id: "cat-a", name: "A", type: "expense" }),
      ),
    );
    const bob = expectApplied(
      await applyAs(
        BOB,
        personalEnvelope("category.create", { id: "cat-b", name: "B", type: "expense" }),
      ),
    );

    expect(alice.seq).toBe(2);
    expect(bob.seq).toBe(2);
  });

  it("does not let a personal commandId collide across ledgers", async () => {
    const commandId = crypto.randomUUID();
    expectApplied(
      await applyAs(ALICE, {
        ...personalEnvelope("category.create", { id: "cat-a", name: "A", type: "expense" }),
        commandId,
      }),
    );
    const bob = expectApplied(
      await applyAs(BOB, {
        ...personalEnvelope("category.create", { id: "cat-b", name: "B", type: "expense" }),
        commandId,
      }),
    );

    expect(bob.replayed).toBe(false);
    expect(await db.select().from(category)).toHaveLength(2);
  });
});

describe("organization scope — the Household path is unchanged", () => {
  beforeEach(async () => {
    await db.insert(household).values({ id: HOUSEHOLD_ID, name: "Shared", createdByUserId: ALICE });
    await db.insert(membership).values({
      id: "membership-alice",
      userId: ALICE,
      householdId: HOUSEHOLD_ID,
      role: "owner",
      version: 0,
    });
  });

  it("writes household rows for an explicit organization scope", async () => {
    expectApplied(
      await applyAs(ALICE, {
        commandId: crypto.randomUUID(),
        scope: { type: "organization", organizationId: HOUSEHOLD_ID },
        kind: "account.create",
        payload: accountPayload("acc-shared-1"),
      }),
    );

    const [row] = await db.select().from(ledgerAccount);
    expect(row).toMatchObject({ ledgerId: HOUSEHOLD_ID, householdId: HOUSEHOLD_ID });
  });

  it("still accepts a bare householdId from older clients", async () => {
    expectApplied(
      await applyAs(ALICE, {
        commandId: crypto.randomUUID(),
        householdId: HOUSEHOLD_ID,
        kind: "account.create",
        payload: accountPayload("acc-shared-2"),
      }),
    );

    const [row] = await db.select().from(ledgerAccount);
    expect(row).toMatchObject({ ledgerId: HOUSEHOLD_ID, householdId: HOUSEHOLD_ID });
  });

  it("keeps a personal ledger separate from the Household the same User owns", async () => {
    await createAccount(ALICE, "acc-alice-personal");
    expectApplied(
      await applyAs(ALICE, {
        commandId: crypto.randomUUID(),
        scope: { type: "organization", organizationId: HOUSEHOLD_ID },
        kind: "account.create",
        payload: accountPayload("acc-alice-shared"),
      }),
    );

    const rows = await db.select().from(ledgerAccount);
    expect(rows.map((row) => [row.id, row.ledgerId]).sort()).toEqual(
      [
        ["acc-alice-personal", personalLedgerId(ALICE)],
        ["acc-alice-shared", HOUSEHOLD_ID],
      ].sort(),
    );
  });

  it("rejects a non-member naming the Household as an organization scope", async () => {
    const result = await applyAs(BOB, {
      commandId: crypto.randomUUID(),
      scope: { type: "organization", organizationId: HOUSEHOLD_ID },
      kind: "account.create",
      payload: accountPayload("acc-bob-intrusion"),
    });

    expect(result).toMatchObject({ kind: "forbidden", role: null });
  });
});
