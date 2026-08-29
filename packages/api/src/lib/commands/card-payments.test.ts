import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { routeCardPayment } from "@trove/domain/card-waterfall";
import { user } from "@trove/db/schema/auth";
import {
  assignment as assignmentTable,
  categoryMapping,
  envelope,
  fundingMembership,
  refundLink,
} from "@trove/db/schema/budget";
import { household, membership } from "@trove/db/schema/household";
import { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";
import type { AppliedResult, CommandResult } from "@trove/protocol";

import { applyCommand } from "./pipeline";
import type { CommandPlan } from "./pipeline";
import type { BatchStatement } from "./statements";
import { getReserveFacts } from "../budget/reserve";
import { getBudgetPoolFacts } from "../budget/funding-pool";
import { createTestDb } from "./test-db";

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

interface CardPaymentOverrides {
  commandId?: string;
  transactionId?: string;
  cardAccountId?: string;
  fundingAccountId?: string;
  amountMinor?: number;
  budgetPeriod?: string;
}

function payCard(overrides: CardPaymentOverrides = {}, userId = OWNER): Promise<CommandResult> {
  return applyCommand({
    db,
    userId,
    envelope: {
      commandId: overrides.commandId ?? crypto.randomUUID(),
      householdId: HOUSEHOLD_ID,
      kind: "card_payment.record",
      payload: {
        transactionId: overrides.transactionId,
        cardAccountId: overrides.cardAccountId ?? "card-1",
        fundingAccountId: overrides.fundingAccountId ?? "acc-1",
        currency: "USD",
        amountMinor: overrides.amountMinor ?? 1000,
        budgetPeriod: overrides.budgetPeriod ?? PERIOD,
      },
    },
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
    // Everything is already reserved; Unassigned must stay untouched.
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
    // The 300 of funded opening debt already over-covers the 100 of
    // unfunded spending, so Unassigned contributes nothing.
    expect(routing).toEqual({
      reserveConsumedMinor: 500,
      openingDebtConsumedMinor: 300,
      unassignedConsumedMinor: 0,
      cardCreditMinor: 1_200,
    });
  });
});

describe("private account command authorization", () => {
  it("rejects a member card payment involving a private account", async () => {
    await seedFundingAccount("acc-1", 10000);
    await seedAccount("card-1", "card");
    await db
      .update(ledgerAccount)
      .set({ ownerUserId: OWNER, visibility: "private" })
      .where(eq(ledgerAccount.id, "card-1"));

    await expect(payCard({}, MEMBER)).resolves.toMatchObject({
      kind: "forbidden",
      requiredCapability: "accounts:private.owner",
    });
  });

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
    // Card purchase of 5_000 on a mapped category: only 3_000 is supported.
    await seedExpense("tx-card-1", "card-1", 5_000);

    const facts = await getReserveFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.reserveMinor).toBe(3_000);
  });

  it("nets linked refunds out of the reserve (ADR-0008)", async () => {
    await assignToEnvelope(4_000);
    await seedExpense("tx-card-2", "card-1", 4_000);

    let facts = await getReserveFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.reserveMinor).toBe(4_000);

    // Refund half — the reserve shrinks without any separate write path.
    expectApplied(await linkRefund({ originalTransactionId: "tx-card-2", amountMinor: 1_500 }));
    facts = await getReserveFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.reserveMinor).toBe(2_500);
  });

  it("ignores unmapped and cash-account spending entirely", async () => {
    await mapCategory("cat-unmapped", null); // tombstone mapping
    await seedExpense("tx-cash", "acc-1", 7_000, "cat-groceries");
    await seedExpense("tx-nomap", "card-1", 7_000, "cat-unmapped");

    const facts = await getReserveFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.reserveMinor).toBe(0);
  });
});

describe("card_payment.record", () => {
  beforeEach(async () => {
    await seedFundingAccount("acc-1", 50_000);
    await seedMembership("acc-1");
    await seedAccount("card-1", "card");
    await seedEnvelope("env-a");
    await mapCategory("cat-groceries", "env-a");
  });

  it("records a transfer into the card account with the waterfall in the payload", async () => {
    // Fund env-a with 4_000, then card-spend it: the reserve holds 4_000.
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
          amountMinor: 4_000,
          budgetPeriod: PERIOD,
        },
      },
    });
    await seedExpense("tx-debt", "card-1", 4_000, "cat-groceries");

    const result = expectApplied(await payCard({ amountMinor: 2_500 }));
    expect(result.effects).toEqual(["ledger", "balances", "projections", "summaries"]);
    expect(result.applied.routing).toMatchObject({
      reserveConsumedMinor: 2_500,
      cardCreditMinor: 0,
    });

    const rows = await db.select().from(transaction);
    const payment = rows.find((t) => t.type === "transfer" && t.toAccountId === "card-1");
    expect(payment).toBeDefined();
    expect(payment?.accountId).toBe("acc-1");
  });

  it("drains the reserve so a second payment sees the reduced amount", async () => {
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
          amountMinor: 4_000,
          budgetPeriod: PERIOD,
        },
      },
    });
    await seedExpense("tx-reserved", "card-1", 4_000, "cat-groceries");

    let facts = await getReserveFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.reserveMinor).toBe(4_000);

    expectApplied(await payCard({ amountMinor: 3_000 }));
    facts = await getReserveFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.reserveMinor).toBe(1_000);
  });

  it("returns excess over liability as Card Credit back to Unassigned Money", async () => {
    const result = expectApplied(await payCard({ amountMinor: 1_000 }));
    // No card spending at all: nothing is consumed; everything is credit.
    expect(result.applied.routing).toMatchObject({
      reserveConsumedMinor: 0,
      unassignedConsumedMinor: 0,
      cardCreditMinor: 1_000,
    });
    // The ledger still shows the full transfer (the cash really moved).
    const facts = await getBudgetPoolFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.fundingPoolMinor).toBe(50_000 - 1_000);
  });

  it("rejects payments to non-card accounts with missing_entity", async () => {
    const result = await payCard({ cardAccountId: "acc-1" });
    expect(result).toMatchObject({ kind: "missing_entity", entityType: "card_account" });
  });

  it("aborts a stale payment batch after an interleaved reversal drained the reserve", async () => {
    // Reserve holds 2_000 (card spend capped by the envelope's assignment).
    await assignToEnvelopeDirectly(2_000);
    await seedExpense("tx-reserve-src", "card-1", 2_000, "cat-groceries");

    // Payment planned while the reserve holds 2_000 — it consumes all of it.
    const stalePlan = await planViaHandler(2_000);

    // Interleaved writer reverses the funding assignment: the reserve drops
    // to zero before the payment batch commits.
    const fundingAssignment = (await db.select().from(assignmentTable))[0];
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
          reversesAssignmentId: fundingAssignment.id,
          currency: "USD",
          amountMinor: 2_000,
          budgetPeriod: PERIOD,
        },
      },
    });

    // The stale batch trips the reserve-sufficiency guard and aborts whole.
    await expect(applyPlanned(stalePlan)).rejects.toThrow();
    const transfers = (await db.select().from(transaction)).filter((t) => t.type === "transfer");
    expect(transfers).toHaveLength(0);
  });

  it("adopts the client Transaction id and replays without replacement", async () => {
    const input = { commandId: "command-payment-replay", transactionId: "payment-client-id" };
    expect(expectApplied(await payCard(input)).replayed).toBe(false);
    expect(expectApplied(await payCard(input)).replayed).toBe(true);

    const rows = await db.select().from(transaction).where(eq(transaction.id, "payment-client-id"));
    expect(rows).toHaveLength(1);
  });

  async function assignToEnvelopeDirectly(amountMinor: number) {
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
    });
  }
});

// Helpers kept at module scope so vitest hoisting never surprises us.
async function planViaHandler(amountMinor: number): Promise<CommandPlan> {
  const { paymentCreateHandler } = await import("./handlers/payment-create");
  const outcome = await paymentCreateHandler.plan(
    { db, householdId: HOUSEHOLD_ID, actorUserId: OWNER, actorRole: "owner" },
    {
      payload: {
        cardAccountId: "card-1",
        fundingAccountId: "acc-1",
        currency: "USD",
        amountMinor,
        budgetPeriod: PERIOD,
      },
      preconditions: [],
    },
  );
  if (!("statements" in outcome)) {
    throw new Error("expected a plan");
  }
  return outcome;
}

async function applyPlanned(plan: CommandPlan): Promise<CommandResult> {
  const { assertionStatement, changeLogStatement, executeBatch, resultStatement } =
    await import("./statements");
  const commandId = crypto.randomUUID();
  const statements = [
    ...plan.guards.map((guard) => assertionStatement(db as never, guard)),
    ...(plan.statements as BatchStatement[]),
    changeLogStatement(db as never, {
      householdId: HOUSEHOLD_ID,
      userId: OWNER,
      commandId,
      effects: plan.effects,
    }),
    resultStatement(db as never, { householdId: HOUSEHOLD_ID, commandId, result: plan.applied }),
  ];
  await executeBatch(db, statements);
  return {
    kind: "applied",
    seq: 999,
    effects: plan.effects,
    applied: plan.applied,
    replayed: false,
  };
}

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
    // The refund landed in April and affects April's plan — its own period —
    // while the linkage keeps the original expense visible in February.
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

    // A third refund would push the cumulative total past 5_000.
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
    const { assertionStatement, changeLogStatement, executeBatch, resultStatement } =
      await import("./statements");

    const planCtx = {
      db,
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

    // Both plans read an empty refund sum.
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
          householdId: HOUSEHOLD_ID,
          userId: OWNER,
          commandId,
          effects: ["ledger"],
        }),
        resultStatement(db as never, { householdId: HOUSEHOLD_ID, commandId, result: {} }),
      ];
      await executeBatch(db, statements);
    };

    await commit(planA);
    // The second stale batch trips the cumulative-cap guard: only 4_000 of
    // the 5_000 expense can ever be refunded across interleaved writers.
    await expect(commit(planB)).rejects.toThrow();
    expect(await db.select().from(refundLink)).toHaveLength(1);
  });
});
