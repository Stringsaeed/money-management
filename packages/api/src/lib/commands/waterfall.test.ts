import { beforeEach, describe, expect, it } from "vitest";

import { user } from "@trove/db/schema/auth";
import {
  assignment as assignmentTable,
  envelope,
  fundingMembership,
} from "@trove/db/schema/budget";
import { householdChange } from "@trove/db/schema/commands";
import { household, membership } from "@trove/db/schema/household";
import { ledgerAccount, transaction } from "@trove/db/schema/ledger";
import type { AppliedResult, CommandResult } from "@trove/protocol";

import { assignmentCommitHandler } from "./handlers/assignment-commit";
import { applyCommand } from "./pipeline";
import type { CommandPlan, PlanContext } from "./pipeline";
import {
  assertionStatement,
  changeLogStatement,
  executeHouseholdTransaction,
  resultStatement,
  type BatchStatement,
} from "./statements";
import { getBudgetPoolFacts } from "../budget/funding-pool";
import { createTestDb } from "../../test-support/db";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

const OWNER = "user-owner";
const HOUSEHOLD_ID = "household-1";
const PERIOD = "2026-02";

let db: TestDb;

beforeEach(async () => {
  db = await setupHousehold();
});

async function setupHousehold(): Promise<TestDb> {
  const database = await createTestDb();
  await database.insert(user).values({ id: OWNER, name: "Owner", email: `${OWNER}@example.com` });
  await database.insert(household).values({
    id: HOUSEHOLD_ID,
    name: "Waterfall Household",
    createdByUserId: OWNER,
  });
  await database.insert(membership).values({
    id: "membership-owner",
    userId: OWNER,
    householdId: HOUSEHOLD_ID,
    role: "owner",
    version: 0,
  });
  return database;
}

async function seedFundingAccount(id: string, initialBalanceMinor = 0) {
  await db.insert(ledgerAccount).values({
    householdId: HOUSEHOLD_ID,
    id,
    name: `Account ${id}`,
    type: "bank",
    currency: "USD",
    initialBalanceMinor,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

async function seedMembership(accountId: string, effectiveFromPeriod = "2026-01", active = true) {
  await db.insert(fundingMembership).values({
    householdId: HOUSEHOLD_ID,
    accountId,
    currency: "USD",
    active,
    effectiveFromPeriod,
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
    lifecycle: "active" as const,
    sortOrder: 0,
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
}

async function seedTransaction(input: Partial<typeof transaction.$inferInsert>) {
  await db.insert(transaction).values({
    householdId: HOUSEHOLD_ID,
    id: input.id ?? crypto.randomUUID(),
    type: "expense",
    amountMinor: 1000,
    currency: "USD",
    date: "2026-02-10",
    accountId: "acc-1",
    version: 0,
    createdBy: OWNER,
    updatedBy: OWNER,
    ...input,
  });
}

interface CommitOverrides {
  envelopeId: string;
  sourceEnvelopeId?: string | null;
  reversesAssignmentId?: string | null;
  amountMinor?: number;
}

function commitEnvelope(overrides: CommitOverrides): Promise<CommandResult> {
  return applyCommand({
    db,
    userId: OWNER,
    envelope: {
      commandId: crypto.randomUUID(),
      householdId: HOUSEHOLD_ID,
      kind: "assignment.commit",
      payload: {
        destinationEnvelopeId: overrides.envelopeId,
        sourceEnvelopeId: overrides.sourceEnvelopeId ?? null,
        reversesAssignmentId: overrides.reversesAssignmentId ?? null,
        currency: "USD",
        amountMinor: overrides.amountMinor ?? 1000,
        budgetPeriod: PERIOD,
      },
    },
  });
}

interface AppliedPayload {
  envelopeId?: string;
  unassignedAfter?: number;
  availabilityAfter?: number;
  reversalOf?: string;
}

function expectApplied(result: CommandResult): AppliedResult & { applied: AppliedPayload } {
  expect(result.kind).toBe("applied");
  return result as AppliedResult & { applied: AppliedPayload };
}

const planContext = (): PlanContext => ({
  db,
  householdId: HOUSEHOLD_ID,
  actorUserId: OWNER,
  actorRole: "owner",
});

async function planTopUp(envelopeId: string, amountMinor: number): Promise<CommandPlan> {
  const outcome = await assignmentCommitHandler.plan(planContext(), {
    payload: {
      destinationEnvelopeId: envelopeId,
      sourceEnvelopeId: null,
      reversesAssignmentId: null,
      currency: "USD",
      amountMinor,
      budgetPeriod: PERIOD,
    },
    preconditions: [],
  });
  if (!("statements" in outcome)) {
    throw new Error("expected a plan, got a rejection");
  }
  return outcome;
}

/** Mirrors the pipeline's batch assembly so tests can commit stale plans. */
function buildStatements(commandId: string, plan: CommandPlan): BatchStatement[] {
  return [
    ...plan.guards.map((guard) => assertionStatement(db as never, guard)),
    ...plan.statements,
    changeLogStatement(db as never, {
      householdId: HOUSEHOLD_ID,
      userId: OWNER,
      commandId,
      effects: plan.effects,
    }),
    resultStatement(db as never, {
      householdId: HOUSEHOLD_ID,
      commandId,
      result: plan.applied,
    }),
  ];
}

const assignments = () => db.select().from(assignmentTable);

describe("funding pool calculation", () => {
  it("sums initial balances plus activity of period-effective members only", async () => {
    await seedFundingAccount("acc-1", 10_000);
    await seedFundingAccount("acc-2", 5_000);
    // A non-funding sink that must never join the pool.
    await seedFundingAccount("sink", 99_000);
    await seedMembership("acc-1");
    await seedMembership("acc-2");

    await seedTransaction({ id: "tx-out", amountMinor: 2_000, date: "2026-02-05" });
    await seedTransaction({ id: "tx-in", type: "income", amountMinor: 4_000, date: "2026-02-08" });
    // Next-period activity must not count.
    await seedTransaction({ id: "tx-late", amountMinor: 7_000, date: "2026-03-01" });

    const facts = await getBudgetPoolFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.fundingPoolMinor).toBe(17_000);
    expect(facts.unassignedMinor).toBe(17_000);
  });

  it("treats member-to-member transfers as neutral; cross-pool transfers move the pool", async () => {
    await seedFundingAccount("acc-1", 10_000);
    await seedFundingAccount("acc-2", 0);
    await seedFundingAccount("outside", 0);
    await seedMembership("acc-1");
    await seedMembership("acc-2");

    await seedTransaction({
      id: "tx-neutral",
      type: "transfer",
      amountMinor: 6_000,
      date: "2026-02-03",
      accountId: "acc-1",
      toAccountId: "acc-2",
    });
    let facts = await getBudgetPoolFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.fundingPoolMinor).toBe(10_000);

    await seedTransaction({
      id: "tx-exit",
      type: "transfer",
      amountMinor: 3_000,
      date: "2026-02-04",
      accountId: "acc-2",
      toAccountId: "outside",
    });
    facts = await getBudgetPoolFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.fundingPoolMinor).toBe(7_000);
  });

  it("excludes accounts whose membership was tombstoned before the period", async () => {
    await seedFundingAccount("acc-1", 10_000);
    await seedFundingAccount("gone", 50_000);
    await seedMembership("acc-1");
    await seedMembership("gone", "2026-01");
    await seedMembership("gone", "2026-02", false);

    const facts = await getBudgetPoolFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.fundingPoolMinor).toBe(10_000);
  });
});

describe("assignment.commit", () => {
  beforeEach(async () => {
    await seedFundingAccount("acc-1", 10_000);
    await seedMembership("acc-1");
    await seedEnvelope("env-a");
    await seedEnvelope("env-b");
  });

  it("commits a top-up atomically with waterfall routing in the applied payload", async () => {
    const result = expectApplied(await commitEnvelope({ envelopeId: "env-a", amountMinor: 4_000 }));

    expect(result.effects).toEqual(["assignments", "projections", "summaries"]);
    expect(result.applied).toMatchObject({
      envelopeId: "env-a",
      availabilityAfter: 4_000,
      unassignedAfter: 6_000,
    });

    const rows = await assignments();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      destinationEnvelopeId: "env-a",
      sourceEnvelopeId: null,
      amountMinor: 4_000,
    });
  });

  it("rejects a top-up exceeding Unassigned Money without a predicate", async () => {
    const result = await commitEnvelope({ envelopeId: "env-a", amountMinor: 20_000 });
    expect(result.kind).toBe("invalid_intent");
    expect(await assignments()).toHaveLength(0);
  });

  it("accepts the unassigned_money_gte predicate precondition", async () => {
    const result = expectApplied(
      await applyCommand({
        db,
        userId: OWNER,
        envelope: {
          commandId: crypto.randomUUID(),
          householdId: HOUSEHOLD_ID,
          kind: "assignment.commit",
          payload: {
            destinationEnvelopeId: "env-a",
            currency: "USD",
            amountMinor: 4_000,
            budgetPeriod: PERIOD,
          },
          preconditions: [{ predicate: "unassigned_money_gte", args: { minor: 4_000 } }],
        },
      }),
    );
    expect(result.applied).toMatchObject({ unassignedAfter: 6_000 });

    const change = (await db.select().from(householdChange))[0];
    expect(change.effects).toContain("assignments");
  });

  it("returns conflict when a predicate precondition no longer holds", async () => {
    const result = await applyCommand({
      db,
      userId: OWNER,
      envelope: {
        commandId: crypto.randomUUID(),
        householdId: HOUSEHOLD_ID,
        kind: "assignment.commit",
        payload: {
          destinationEnvelopeId: "env-a",
          currency: "USD",
          amountMinor: 4_000,
          budgetPeriod: PERIOD,
        },
        preconditions: [{ predicate: "unassigned_money_gte", args: { minor: 99_000 } }],
      },
    });
    expect(result).toMatchObject({ kind: "conflict", reason: "unassigned_money_changed" });
    expect(await assignments()).toHaveLength(0);
  });

  it("moves between envelopes without consuming Unassigned Money", async () => {
    expectApplied(await commitEnvelope({ envelopeId: "env-a", amountMinor: 5_000 }));
    const result = expectApplied(
      await commitEnvelope({ envelopeId: "env-b", sourceEnvelopeId: "env-a", amountMinor: 2_000 }),
    );
    // Budget-neutral move.
    expect(result.applied.unassignedAfter).toBe(5_000);
  });

  it("reverses an assignment once with a linked opposite-direction row", async () => {
    expectApplied(await commitEnvelope({ envelopeId: "env-a", amountMinor: 4_000 }));
    const original = (await assignments())[0];

    const reversal = expectApplied(
      await applyCommand({
        db,
        userId: OWNER,
        envelope: {
          commandId: crypto.randomUUID(),
          householdId: HOUSEHOLD_ID,
          kind: "assignment.commit",
          payload: {
            destinationEnvelopeId: "env-a",
            currency: "USD",
            amountMinor: original.amountMinor,
            budgetPeriod: PERIOD,
            reversesAssignmentId: original.id,
          },
        },
      }),
    );
    expect(reversal.applied.reversalOf).toBe(original.id);
    // The reversal returns the Money to Unassigned Money.
    expect(reversal.applied.unassignedAfter).toBe(10_000);

    const rows = await assignments();
    const reversingRow = rows.find((r) => r.reversesAssignmentId === original.id);
    expect(reversingRow).toBeDefined();
    expect(reversingRow?.sourceEnvelopeId).toBe("env-a");
    expect(reversingRow?.destinationEnvelopeId).toBeNull();

    // A second reversal of the same original is rejected.
    const again = await applyCommand({
      db,
      userId: OWNER,
      envelope: {
        commandId: crypto.randomUUID(),
        householdId: HOUSEHOLD_ID,
        kind: "assignment.commit",
        payload: {
          destinationEnvelopeId: "env-a",
          currency: "USD",
          amountMinor: original.amountMinor,
          budgetPeriod: PERIOD,
          reversesAssignmentId: original.id,
        },
      },
    });
    expect(again.kind).toBe("invalid_intent");
  });
});

describe("interleaving safety — preconditions replace locks", () => {
  /**
   * Mandatory evidence (#90 triage): two clients plan against one snapshot
   * while only one can win. The pipeline's in-batch assertion aborts the
   * loser's batch mid-commit, so over-assignment is structurally impossible.
   */
  it("aborts the second stale batch before it double-spends Unassigned Money", async () => {
    await seedFundingAccount("acc-1", 10_000);
    await seedMembership("acc-1");
    await seedEnvelope("env-a");
    await seedEnvelope("env-b");

    // Both plans read the same 10_000 pool before either commits.
    const planA = (await planTopUp("env-a", 8_000)) satisfies CommandPlan;
    const planB = (await planTopUp("env-b", 8_000)) satisfies CommandPlan;
    expect(planA.guards).toHaveLength(1);
    expect(planB.guards).toHaveLength(1);

    await executeHouseholdTransaction(
      db,
      buildStatements(crypto.randomUUID(), planA),
      HOUSEHOLD_ID,
    );
    await expect(
      executeHouseholdTransaction(db, buildStatements(crypto.randomUUID(), planB), HOUSEHOLD_ID),
    ).rejects.toThrow();

    // Exactly one 8_000 assignment exists — never both.
    const rows = await assignments();
    expect(rows).toHaveLength(1);
    expect(rows[0].destinationEnvelopeId).toBe("env-a");

    const facts = await getBudgetPoolFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(facts.assignedMinor).toBeLessThanOrEqual(facts.fundingPoolMinor);
    expect(facts.unassignedMinor).toBe(2_000);
  });

  it("converges under randomized interleavings — Unassigned Money never goes negative (fuzz)", async () => {
    // Deterministic LCG so failures reproduce.
    let seed = 42;
    const random = () => {
      seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
      return seed / 2_147_483_648;
    };

    await seedFundingAccount("acc-1", 50_000);
    await seedMembership("acc-1");
    for (const id of ["env-a", "env-b", "env-c"]) {
      await seedEnvelope(id);
    }

    let committed = 0;
    for (let round = 0; round < 30; round += 1) {
      const envelopeId = ["env-a", "env-b", "env-c"][Math.floor(random() * 3)];
      const amountMinor = [1_000, 5_000, 9_000, 15_000][Math.floor(random() * 4)];

      const outcome = await assignmentCommitHandler.plan(planContext(), {
        payload: {
          destinationEnvelopeId: envelopeId,
          sourceEnvelopeId: null,
          reversesAssignmentId: null,
          currency: "USD",
          amountMinor,
          budgetPeriod: PERIOD,
        },
        preconditions: [],
      });

      if (!("statements" in outcome)) {
        continue; // Typed rejection at plan time — nothing committed.
      }
      try {
        await executeHouseholdTransaction(
          db,
          buildStatements(crypto.randomUUID(), outcome),
          HOUSEHOLD_ID,
        );
        committed += 1;
      } catch {
        // Guard fired: an interleaved writer consumed the money first.
      }

      // The invariant that must hold after EVERY interleaving step.
      const facts = await getBudgetPoolFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
      expect(facts.unassignedMinor).toBeGreaterThanOrEqual(0);
    }
    expect(committed).toBeGreaterThan(0);
    // And the final state is coherent regardless of the interleaving order.
    const finalFacts = await getBudgetPoolFacts(db, HOUSEHOLD_ID, "USD", PERIOD);
    expect(finalFacts.assignedMinor).toBeLessThanOrEqual(finalFacts.fundingPoolMinor);
  });

  it("re-plans after a guard fire and surfaces the typed rejection to the loser", async () => {
    await seedFundingAccount("acc-1", 10_000);
    await seedMembership("acc-1");
    await seedEnvelope("env-a");

    // Winner commits through the full pipeline.
    expectApplied(await commitEnvelope({ envelopeId: "env-a", amountMinor: 9_000 }));

    // Loser re-plans against the new state via applyCommand: typed rejection,
    // never an internal error.
    const loser = await commitEnvelope({ envelopeId: "env-a", amountMinor: 9_000 });
    expect(loser.kind).toBe("invalid_intent");
    expect(await assignments()).toHaveLength(1);
  });
});
