import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { routeCardPayment } from "@trove/domain/card-waterfall";
import { user } from "@trove/db/schema/auth";
import { categoryMapping, envelope, fundingMembership, refundLink } from "@trove/db/schema/budget";
import { household, membership } from "@trove/db/schema/household";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";
import type { AppliedResult, CommandResult } from "@trove/protocol";

import { applyCommand } from "./pipeline";
import type { CommandPlan } from "./pipeline";
import { getReserveFacts } from "../budget/reserve";
import { createTestDb } from "../../test-support/db";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const OWNER = "user-owner";
const MEMBER = "user-member";
const HOUSEHOLD_ID = "household-1";
const PERIOD = "2026-02";

let db: TestDb;

beforeEach(async () => {
  db = await setupHousehold();
});

async function setupHousehold(): Promise<TestDb> {
  const database = await createTestDb();
  await database.insert(user).values([
    { id: OWNER, name: "Owner", email: `${OWNER}@example.com` },
    { id: MEMBER, name: "Member", email: `${MEMBER}@example.com` },
  ]);
  await database.insert(household).values({
    id: HOUSEHOLD_ID,
    name: "Card Household",
    createdByUserId: OWNER,
  });
  await database.insert(membership).values([
    {
      id: `membership-${OWNER}`,
      userId: OWNER,
      householdId: HOUSEHOLD_ID,
      role: "owner",
      version: 0,
    },
    {
      id: `membership-${MEMBER}`,
      userId: MEMBER,
      householdId: HOUSEHOLD_ID,
      role: "member",
      version: 0,
    },
  ]);
  return database;
}

async function seedFundingAccount(id: string, initialBalanceMinor = 0) {
  await seedAccount(id, "bank", initialBalanceMinor);
}

async function seedAccount(id: string, type: "bank" | "cash" | "card", initialBalanceMinor = 0) {
  await db.insert(ledgerAccount).values({
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    id,
    name: `${type} ${id}`,
    type,
    currency: "USD",
    initialBalanceMinor,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

async function seedMembership(accountId: string) {
  await db.insert(fundingMembership).values({
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    accountId,
    currency: "USD",
    active: true,
    effectiveFromPeriod: "2026-01",
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

async function seedEnvelope(id: string) {
  await db.insert(envelope).values({
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    id,
    name: `Envelope ${id}`,
    currency: "USD",
    icon: "🎯",
    color: "#8B9D83",
    lifecycle: "active",
    sortOrder: 0,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

async function seedCategory(categoryId: string) {
  await db.insert(category).values({
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    id: categoryId,
    name: `Category ${categoryId}`,
    type: "expense",
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

async function mapCategory(
  categoryId: string,
  envelopeId: string | null,
  effectiveFromPeriod = "2026-01",
) {
  await seedCategory(categoryId);
  await db.insert(categoryMapping).values({
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    categoryId,
    envelopeId,
    effectiveFromPeriod,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

async function seedExpense(
  id: string,
  accountId: string,
  amountMinor: number,
  categoryId = "cat-groceries",
  date = "2026-02-10",
) {
  await db.insert(transaction).values({
    ledgerId: HOUSEHOLD_ID,
    householdId: HOUSEHOLD_ID,
    id,
    type: "expense",
    amountMinor,
    currency: "USD",
    date,
    accountId,
    categoryId,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

interface RefundOverrides {
  commandId?: string;
  transactionId?: string;
  originalTransactionId: string;
  depositAccountId?: string;
  amountMinor?: number;
  date?: string;
}

function linkRefund(overrides: RefundOverrides, userId = OWNER): Promise<CommandResult> {
  return applyCommand({
    db,
    userId,
    envelope: {
      commandId: overrides.commandId ?? crypto.randomUUID(),
      householdId: HOUSEHOLD_ID,
      kind: "refund.link",
      payload: {
        transactionId: overrides.transactionId,
        originalTransactionId: overrides.originalTransactionId,
        depositAccountId: overrides.depositAccountId ?? "acc-1",
        currency: "USD",
        amountMinor: overrides.amountMinor ?? 1000,
        date: overrides.date ?? "2026-03-05",
      },
    },
  });
}

function expectApplied(
  result: CommandResult,
): AppliedResult & { applied: Record<string, unknown> } {
  expect(result.kind).toBe("applied");
  return result as never;
}

describe("routeCardPayment (pure waterfall)", () => {
  it("consumes reserve first, then unassigned against unfunded debt", () => {
    expect(
      routeCardPayment({
        amountMinor: 1000,
        reserveMinor: 600,
        fundedOpeningDebtMinor: 0,
        unassignedMinor: 5000,
        unfundedCardSpendingMinor: 400,
      }),
    ).toEqual({
      reserveConsumedMinor: 600,
      openingDebtConsumedMinor: 0,
      unassignedConsumedMinor: 400,
      cardCreditMinor: 0,
    });
  });

  it("never pays out of Unassigned when no unfunded spending exists", () => {
    const routing = routeCardPayment({
      amountMinor: 800,
      reserveMinor: 300,
      fundedOpeningDebtMinor: 0,
      unassignedMinor: 9000,
      unfundedCardSpendingMinor: 0,
    });
    expect(routing.reserveConsumedMinor).toBe(300);
    expect(routing.unassignedConsumedMinor).toBe(0);
    expect(routing.cardCreditMinor).toBe(500);
  });

  it("returns excess payment as Card Credit per ADR-0014", () => {
    const routing = routeCardPayment({
      amountMinor: 2_000,
      reserveMinor: 500,
      fundedOpeningDebtMinor: 300,
      unassignedMinor: 400,
      unfundedCardSpendingMinor: 100,
    });
    expect(routing).toEqual({
      reserveConsumedMinor: 500,
      openingDebtConsumedMinor: 300,
      unassignedConsumedMinor: 0,
      cardCreditMinor: 1_200,
    });
  });
});

describe("private account command authorization", () => {
  it("rejects a member refund linked to a private account transaction", async () => {
    await seedFundingAccount("acc-1", 10000);
    await seedCategory("cat-groceries");
    await seedExpense("private-expense", "acc-1", 1000);
    await db
      .update(ledgerAccount)
      .set({ ownerUserId: OWNER, visibility: "private" })
      .where(eq(ledgerAccount.id, "acc-1"));

    await expect(
      linkRefund({ originalTransactionId: "private-expense" }, MEMBER),
    ).resolves.toMatchObject({
      kind: "forbidden",
      requiredCapability: "accounts:private.owner",
    });
  });
});

describe("card payment reserve calculation", () => {
  beforeEach(async () => {
    await seedFundingAccount("acc-1", 50_000);
    await seedAccount("card-1", "card");
    await seedMembership("acc-1");
    await seedEnvelope("env-a");
    await mapCategory("cat-groceries", "env-a");
  });

  async function assignToEnvelope(amountMinor: number) {
    const applied = expectApplied(
      await applyCommand({
        db,
        userId: OWNER,
        envelope: {
          commandId: crypto.randomUUID(),
          householdId: HOUSEHOLD_ID,
          kind: "assignment.commit",
          payload: {
            destinationEnvelopeId: "env-a",
            sourceEnvelopeId: null,
            reversesAssignmentId: null,
            currency: "USD",
            amountMinor,
            budgetPeriod: PERIOD,
          },
        },
      }),
    );
    void applied;
  }

  it("reserves categorized card spending capped by the envelope's assigned money", async () => {
    await assignToEnvelope(3_000);
    await seedExpense("tx-card-1", "card-1", 5_000);

    const facts = await getReserveFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.reserveMinor).toBe(3_000);
  });

  it("nets linked refunds out of the reserve (ADR-0008)", async () => {
    await assignToEnvelope(4_000);
    await seedExpense("tx-card-2", "card-1", 4_000);

    let facts = await getReserveFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.reserveMinor).toBe(4_000);

    expectApplied(await linkRefund({ originalTransactionId: "tx-card-2", amountMinor: 1_500 }));
    facts = await getReserveFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.reserveMinor).toBe(2_500);
  });

  it("ignores unmapped and cash-account spending entirely", async () => {
    await mapCategory("cat-unmapped", null);
    await seedExpense("tx-cash", "acc-1", 7_000, "cat-groceries");
    await seedExpense("tx-nomap", "card-1", 7_000, "cat-unmapped");

    const facts = await getReserveFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.reserveMinor).toBe(0);
  });
});

describe("refund.link", () => {
  beforeEach(async () => {
    await seedFundingAccount("acc-1", 20_000);
    await seedMembership("acc-1");
    await seedAccount("card-1", "card");
    await seedEnvelope("env-a");
    await mapCategory("cat-groceries", "env-a");
    await seedExpense("tx-original", "card-1", 5_000, "cat-groceries", "2026-02-10");
  });

  it("attributes a refund to its own Budget Period (ADR-0008)", async () => {
    const result = expectApplied(
      await linkRefund({
        originalTransactionId: "tx-original",
        amountMinor: 2_000,
        date: "2026-04-20",
      }),
    );
    expect(result.applied.budgetPeriod).toBe("2026-04");

    const links = await db.select().from(refundLink);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ originalTransactionId: "tx-original", amountMinor: 2_000 });

    const refundTx = await db
      .select()
      .from(transaction)
      .where(eq(transaction.id, links[0].refundTransactionId));
    expect(refundTx[0].date).toBe("2026-04-20");
  });

  it("enforces the cumulative cap across multiple refunds", async () => {
    expectApplied(await linkRefund({ originalTransactionId: "tx-original", amountMinor: 3_000 }));
    expectApplied(await linkRefund({ originalTransactionId: "tx-original", amountMinor: 2_000 }));

    const third = await linkRefund({ originalTransactionId: "tx-original", amountMinor: 1_000 });
    expect(third.kind).toBe("invalid_intent");
  });

  it("adopts the client Transaction id and replays the linked Refund exactly once", async () => {
    const input = {
      commandId: "command-refund-replay",
      transactionId: "refund-client-id",
      originalTransactionId: "tx-original",
    };
    expect(expectApplied(await linkRefund(input)).replayed).toBe(false);
    expect(expectApplied(await linkRefund(input)).replayed).toBe(true);

    const rows = await db.select().from(transaction).where(eq(transaction.id, "refund-client-id"));
    expect(rows).toHaveLength(1);
    expect(await db.select().from(refundLink)).toHaveLength(1);
  });

  it("rejects refunds of non-expense transactions", async () => {
    const result = await applyCommand({
      db,
      userId: OWNER,
      envelope: {
        commandId: crypto.randomUUID(),
        householdId: HOUSEHOLD_ID,
        kind: "refund.link",
        payload: {
          originalTransactionId: "nope",
          depositAccountId: "acc-1",
          currency: "USD",
          amountMinor: 500,
          date: "2026-03-05",
        },
      },
    });
    expect(result).toMatchObject({ kind: "missing_entity", entityType: "transaction" });
  });

  it("requires card refunds to return to the original card", async () => {
    await seedAccount("card-2", "card");
    const result = await linkRefund({
      originalTransactionId: "tx-original",
      depositAccountId: "card-2",
    });
    expect(result).toMatchObject({ kind: "invalid_intent" });
  });

  it("aborts an interleaved over-refund through the in-batch cap guard", async () => {
    const { refundCreateHandler } = await import("./handlers/refund-create");
    const { assertionStatement, changeLogStatement, executeLedgerTransaction, resultStatement } =
      await import("./statements");

    const planCtx = {
      db,
      ledgerId: HOUSEHOLD_ID,
      scope: { type: "organization", organizationId: HOUSEHOLD_ID } as const,
      householdId: HOUSEHOLD_ID,
      actorUserId: OWNER,
      actorRole: "owner" as const,
    };
    const makePlan = () =>
      refundCreateHandler.plan(planCtx, {
        payload: {
          originalTransactionId: "tx-original",
          depositAccountId: "acc-1",
          currency: "USD",
          amountMinor: 4_000,
          date: "2026-03-05",
        },
        preconditions: [],
      });

    const planA = await makePlan();
    const planB = await makePlan();
    if (!("statements" in planA) || !("statements" in planB)) {
      throw new Error("expected plans");
    }

    const commit = async (refundPlan: CommandPlan) => {
      const commandId = crypto.randomUUID();
      const statements = [
        ...refundPlan.guards.map((guard) => assertionStatement(db as never, guard)),
        ...refundPlan.statements,
        changeLogStatement(db as never, {
          ledgerId: HOUSEHOLD_ID,
          householdId: HOUSEHOLD_ID,
          userId: OWNER,
          commandId,
          effects: ["ledger"],
        }),
        resultStatement(db as never, {
          ledgerId: HOUSEHOLD_ID,
          householdId: HOUSEHOLD_ID,
          commandId,
          result: {},
        }),
      ];
      await executeLedgerTransaction(db, statements, HOUSEHOLD_ID);
    };

    await commit(planA);
    await expect(commit(planB)).rejects.toThrow();
    expect(await db.select().from(refundLink)).toHaveLength(1);
  });
});
