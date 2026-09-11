import { beforeEach, describe, expect, it } from "vitest";

import type { CommandEnvelope, CommandKind, CommandResult } from "@trove/protocol";
import { user } from "@trove/db/schema/auth";
import {
  assignment,
  budgetWorkspace,
  categoryMapping,
  envelope,
  rolloverSetting,
} from "@trove/db/schema/budget";
import { household, membership } from "@trove/db/schema/household";
import { category, ledgerAccount } from "@trove/db/schema/ledger";

import { createTestDb } from "../../test-support/db";
import { applyCommand } from "./pipeline";

const OWNER = "budget-owner";
const HOUSEHOLD = "budget-household";
const ACCOUNT = "budget-account";
const CATEGORY_A = "budget-category-a";
const CATEGORY_B = "budget-category-b";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;
let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values({ id: OWNER, name: "Owner", email: "budget@example.test" });
  await db.insert(household).values({ id: HOUSEHOLD, name: "Budget", createdByUserId: OWNER });
  await db.insert(membership).values({
    id: "budget-membership",
    householdId: HOUSEHOLD,
    userId: OWNER,
    role: "owner",
  });
  await db.insert(ledgerAccount).values({
    id: ACCOUNT,
    ledgerId: HOUSEHOLD,
    householdId: HOUSEHOLD,
    name: "Checking",
    type: "bank",
    currency: "USD",
    initialBalanceMinor: 100_000,
    createdBy: OWNER,
    updatedBy: OWNER,
  });
  await db.insert(category).values([
    {
      id: CATEGORY_A,
      ledgerId: HOUSEHOLD,
      householdId: HOUSEHOLD,
      name: "A",
      type: "expense",
      createdBy: OWNER,
      updatedBy: OWNER,
    },
    {
      id: CATEGORY_B,
      ledgerId: HOUSEHOLD,
      householdId: HOUSEHOLD,
      name: "B",
      type: "expense",
      createdBy: OWNER,
      updatedBy: OWNER,
    },
  ]);
});

describe("budget.configure", () => {
  it("activates a workspace and creates then edits an envelope atomically", async () => {
    expectApplied(
      await apply("workspace", "budget.configure", {
        action: "workspace.activate",
        currency: "USD",
        activationPeriod: "2026-09",
        fundingAccountIds: [ACCOUNT],
      }),
    );
    expectApplied(
      await apply("envelope-create", "budget.configure", {
        action: "envelope.create",
        envelopeId: "envelope-1",
        currency: "USD",
        effectiveFromPeriod: "2026-09",
        name: "Needs",
        icon: "📦",
        color: "#8B9D83",
        categoryIds: [CATEGORY_A],
        positiveRollover: true,
        sortOrder: 0,
      }),
    );
    expectApplied(
      await apply("envelope-update", "budget.configure", {
        action: "envelope.update",
        envelopeId: "envelope-1",
        expectedVersion: 0,
        effectiveFromPeriod: "2026-10",
        name: "Needs updated",
        icon: "🏠",
        color: "#B48A7B",
        categoryIds: [CATEGORY_B],
        changedCategoryIds: [CATEGORY_A, CATEGORY_B],
        positiveRollover: false,
        sortOrder: 1,
      }),
    );

    await expect(db.select().from(budgetWorkspace)).resolves.toHaveLength(1);
    await expect(db.select().from(envelope)).resolves.toEqual([
      expect.objectContaining({ id: "envelope-1", name: "Needs updated", version: 1 }),
    ]);
    await expect(db.select().from(categoryMapping)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: CATEGORY_A, envelopeId: "envelope-1" }),
        expect.objectContaining({ categoryId: CATEGORY_A, envelopeId: null }),
        expect.objectContaining({ categoryId: CATEGORY_B, envelopeId: "envelope-1" }),
      ]),
    );
    await expect(db.select().from(rolloverSetting)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ effectiveFromPeriod: "2026-09", positiveRollover: true }),
        expect.objectContaining({ effectiveFromPeriod: "2026-10", positiveRollover: false }),
      ]),
    );
  });
});

describe("assignment.correct", () => {
  it("reverses and replaces one assignment in a single command", async () => {
    await seedWorkspaceAndEnvelope("envelope-a", CATEGORY_A);
    await seedEnvelope("envelope-b", CATEGORY_B, 1);
    expectApplied(
      await apply("assignment-original", "assignment.commit", {
        assignmentId: "assignment-1",
        destinationEnvelopeId: "envelope-a",
        sourceEnvelopeId: null,
        currency: "USD",
        amountMinor: 1_000,
        budgetPeriod: "2026-09",
        reversesAssignmentId: null,
      }),
    );

    expectApplied(
      await apply("assignment-correct", "assignment.correct", {
        originalAssignmentId: "assignment-1",
        reversalId: "assignment-reversal",
        replacementId: "assignment-replacement",
        currency: "USD",
        budgetPeriod: "2026-09",
        sourceEnvelopeId: null,
        destinationEnvelopeId: "envelope-b",
        amountMinor: 800,
      }),
    );

    await expect(db.select().from(assignment)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "assignment-1", reversesAssignmentId: null }),
        expect.objectContaining({
          id: "assignment-reversal",
          sourceEnvelopeId: "envelope-a",
          destinationEnvelopeId: null,
          reversesAssignmentId: "assignment-1",
        }),
        expect.objectContaining({
          id: "assignment-replacement",
          destinationEnvelopeId: "envelope-b",
          reversesAssignmentId: "assignment-reversal",
        }),
      ]),
    );
  });
});

async function seedWorkspaceAndEnvelope(envelopeId: string, categoryId: string) {
  await apply("workspace", "budget.configure", {
    action: "workspace.activate",
    currency: "USD",
    activationPeriod: "2026-09",
    fundingAccountIds: [ACCOUNT],
  });
  await seedEnvelope(envelopeId, categoryId, 0);
}

async function seedEnvelope(envelopeId: string, categoryId: string, sortOrder: number) {
  await apply(`create-${envelopeId}`, "budget.configure", {
    action: "envelope.create",
    envelopeId,
    currency: "USD",
    effectiveFromPeriod: "2026-09",
    name: envelopeId,
    icon: "📦",
    color: "#8B9D83",
    categoryIds: [categoryId],
    positiveRollover: true,
    sortOrder,
  });
}

const apply = (commandId: string, kind: CommandKind, payload: unknown) =>
  applyCommand({
    db,
    userId: OWNER,
    envelope: { commandId, householdId: HOUSEHOLD, kind, payload } satisfies CommandEnvelope,
  });

const expectApplied = (result: CommandResult) => {
  expect(result.kind).toBe("applied");
  if (result.kind !== "applied") throw new Error(`Expected applied, received ${result.kind}`);
  return result;
};
