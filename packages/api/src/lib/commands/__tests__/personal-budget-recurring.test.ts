import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import { assignment, budgetWorkspace, envelope, refundLink } from "@trove/db/schema/budget";
import { transaction } from "@trove/db/schema/ledger";
import { recurringOccurrence, recurringRule } from "@trove/db/schema/recurring";
import type { AppliedResult, CommandEnvelope, CommandResult } from "@trove/protocol";
import { personalLedgerId } from "@trove/protocol";

import { applyCommand } from "../pipeline";
import { getProjections } from "../../budget/projections";
import { settleLedgerRules } from "../../recurring/settle-household";
import { createTestDb } from "../../../test-support/db";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const ALICE = "user-alice";
const BOB = "user-bob";

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

function personalEnvelope(
  kind: CommandEnvelope["kind"],
  payload: CommandEnvelope["payload"],
): CommandEnvelope {
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

async function seedPersonalWorkspace(userId: string, prefix: string) {
  expectApplied(
    await applyAs(
      userId,
      personalEnvelope("account.create", {
        id: `${prefix}-acc`,
        name: "Checking",
        type: "bank",
        currency: "USD",
        initialBalanceMinor: 100_000,
      }),
    ),
  );
  expectApplied(
    await applyAs(
      userId,
      personalEnvelope("category.create", {
        id: `${prefix}-cat`,
        name: "Groceries",
        type: "expense",
      }),
    ),
  );
  expectApplied(
    await applyAs(
      userId,
      personalEnvelope("budget.configure", {
        action: "workspace.activate",
        currency: "USD",
        activationPeriod: "2026-09",
        fundingAccountIds: [`${prefix}-acc`],
      }),
    ),
  );
  expectApplied(
    await applyAs(
      userId,
      personalEnvelope("budget.configure", {
        action: "envelope.create",
        envelopeId: `${prefix}-env`,
        currency: "USD",
        effectiveFromPeriod: "2026-09",
        name: "Needs",
        icon: "📦",
        color: "#8B9D83",
        categoryIds: [`${prefix}-cat`],
        positiveRollover: true,
        sortOrder: 0,
      }),
    ),
  );
}

describe("personal budget and recurring — no Household required", () => {
  it("configures a workspace, assigns, refunds, and creates a rule on the personal ledger", async () => {
    await seedPersonalWorkspace(ALICE, "alice");

    expectApplied(
      await applyAs(
        ALICE,
        personalEnvelope("assignment.commit", {
          assignmentId: "alice-asg",
          destinationEnvelopeId: "alice-env",
          sourceEnvelopeId: null,
          currency: "USD",
          amountMinor: 2_500,
          budgetPeriod: "2026-09",
          reversesAssignmentId: null,
        }),
      ),
    );
    expectApplied(
      await applyAs(
        ALICE,
        personalEnvelope("transaction.create", {
          id: "alice-txn",
          type: "expense",
          amountMinor: 800,
          date: "2026-09-08",
          accountId: "alice-acc",
          categoryId: "alice-cat",
        }),
      ),
    );
    expectApplied(
      await applyAs(
        ALICE,
        personalEnvelope("refund.link", {
          transactionId: "alice-refund",
          originalTransactionId: "alice-txn",
          depositAccountId: "alice-acc",
          currency: "USD",
          amountMinor: 200,
          date: "2026-09-09",
        }),
      ),
    );
    expectApplied(
      await applyAs(
        ALICE,
        personalEnvelope("recurring.change", {
          action: "create",
          ruleId: "alice-rule",
          rule: {
            name: "Rent",
            type: "expense",
            amountMinor: 120_000,
            currency: "USD",
            accountId: "alice-acc",
            toAccountId: null,
            categoryId: "alice-cat",
            description: "Monthly rent",
            frequency: "month",
            intervalCount: 1,
            startDate: "2026-10-01",
            endDate: null,
            endCount: null,
            timeZone: "Asia/Dubai",
          },
        }),
      ),
    );

    const ledgerId = personalLedgerId(ALICE);
    expect(await db.select().from(budgetWorkspace)).toEqual([
      expect.objectContaining({ ledgerId, householdId: null, currency: "USD" }),
    ]);
    expect(await db.select().from(envelope)).toEqual([
      expect.objectContaining({ id: "alice-env", ledgerId, householdId: null }),
    ]);
    expect(await db.select().from(assignment)).toEqual([
      expect.objectContaining({ id: "alice-asg", ledgerId, householdId: null }),
    ]);
    expect(await db.select().from(refundLink)).toEqual([
      expect.objectContaining({ ledgerId, householdId: null, amountMinor: 200 }),
    ]);
    expect(await db.select().from(recurringRule)).toEqual([
      expect.objectContaining({ id: "alice-rule", ledgerId, householdId: null }),
    ]);

    const projections = await getProjections(
      db,
      { userId: ALICE, ledgerId },
      { currency: "USD", startPeriod: "2026-09", endPeriod: "2026-09" },
    );
    expect(projections.projections[0]?.assignedMinor).toBe(2_500);
  });

  it("rejects a second user addressing the first user's personal envelope", async () => {
    await seedPersonalWorkspace(ALICE, "alice");
    await seedPersonalWorkspace(BOB, "bob");

    const result = await applyAs(
      BOB,
      personalEnvelope("assignment.commit", {
        assignmentId: "bob-cross",
        destinationEnvelopeId: "alice-env",
        sourceEnvelopeId: null,
        currency: "USD",
        amountMinor: 100,
        budgetPeriod: "2026-09",
        reversesAssignmentId: null,
      }),
    );

    expect(result).toMatchObject({ kind: "missing_entity", entityType: "envelope" });
    expect(await db.select().from(assignment)).toHaveLength(0);
  });

  it("keeps personal budget rows invisible across users", async () => {
    await seedPersonalWorkspace(ALICE, "alice");

    await expect(
      getProjections(
        db,
        { userId: BOB, ledgerId: personalLedgerId(ALICE) },
        { currency: "USD", startPeriod: "2026-09", endPeriod: "2026-09" },
      ),
    ).rejects.toThrow(/do not own this ledger/);
  });

  it("settles a personal rule without a Household and is occurrence-idempotent", async () => {
    await seedPersonalWorkspace(ALICE, "alice");
    expectApplied(
      await applyAs(
        ALICE,
        personalEnvelope("recurring.change", {
          action: "create",
          ruleId: "alice-daily",
          rule: {
            name: "Coffee",
            type: "expense",
            amountMinor: 400,
            currency: "USD",
            accountId: "alice-acc",
            toAccountId: null,
            categoryId: "alice-cat",
            description: "Daily coffee",
            frequency: "day",
            intervalCount: 1,
            startDate: "2026-04-14",
            endDate: null,
            endCount: null,
            timeZone: "UTC",
          },
        }),
      ),
    );

    const first = await settleLedgerRules(
      db,
      { ledgerId: personalLedgerId(ALICE), householdId: null, userId: ALICE },
      { next: () => crypto.randomUUID() },
      "2026-04-15",
      "2026-04-15T08:00:00.000Z",
    );
    expect(first.generatedCount).toBe(2);

    const second = await settleLedgerRules(
      db,
      { ledgerId: personalLedgerId(ALICE), householdId: null, userId: ALICE },
      { next: () => crypto.randomUUID() },
      "2026-04-15",
      "2026-04-15T08:00:00.000Z",
    );
    expect(second.generatedCount).toBe(0);

    const occurrences = await db.select().from(recurringOccurrence);
    expect(occurrences).toHaveLength(2);
    expect(occurrences.every((row) => row.ledgerId === personalLedgerId(ALICE))).toBe(true);
    expect(occurrences.every((row) => row.householdId === null)).toBe(true);

    const generated = (await db.select().from(transaction)).filter(
      (row) => row.recurringRuleId === "alice-daily",
    );
    expect(generated).toHaveLength(2);
    expect(generated.every((row) => row.ledgerId === personalLedgerId(ALICE))).toBe(true);
    expect(generated.every((row) => row.householdId === null)).toBe(true);
  });
});
