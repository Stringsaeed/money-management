import { beforeEach, describe, expect, it } from "vitest";

import type { CommandEnvelope, CommandResult } from "@trove/protocol";
import { user } from "@trove/db/schema/auth";
import { household, membership } from "@trove/db/schema/household";
import { category, ledgerAccount } from "@trove/db/schema/ledger";
import { recurringRule } from "@trove/db/schema/recurring";

import { createTestDb } from "../../test-support/db";
import { applyCommand } from "./pipeline";

const OWNER = "recurring-owner";
const HOUSEHOLD = "recurring-household";
const ACCOUNT = "recurring-account";
const CATEGORY = "recurring-category";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;
let db: TestDb;

const draft = {
  name: "Rent",
  type: "expense" as const,
  amountMinor: 120_000,
  currency: "USD",
  accountId: ACCOUNT,
  toAccountId: null,
  categoryId: CATEGORY,
  description: "Monthly rent",
  frequency: "month" as const,
  intervalCount: 1,
  startDate: "2026-09-10",
  endDate: null,
  endCount: null,
  timeZone: "Asia/Dubai",
};

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values({ id: OWNER, name: "Owner", email: "recurring@example.test" });
  await db.insert(household).values({ id: HOUSEHOLD, name: "Recurring", createdByUserId: OWNER });
  await db.insert(membership).values({
    id: "recurring-membership",
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
    createdBy: OWNER,
    updatedBy: OWNER,
  });
  await db.insert(category).values({
    id: CATEGORY,
    ledgerId: HOUSEHOLD,
    householdId: HOUSEHOLD,
    name: "Housing",
    type: "expense",
    createdBy: OWNER,
    updatedBy: OWNER,
  });
});

describe("recurring.change", () => {
  it("creates and edits a recurring rule through the atomic command pipeline", async () => {
    const created = expectApplied(
      await apply("recurring-create", {
        action: "create",
        ruleId: "rule-1",
        rule: draft,
      }),
    );
    expect(created.applied).toEqual({ ruleId: "rule-1", revision: 1 });

    const edited = expectApplied(
      await apply("recurring-edit", {
        action: "edit",
        ruleId: "rule-1",
        expectedRevision: 1,
        rule: { ...draft, name: "Rent updated" },
      }),
    );
    expect(edited.applied).toEqual({ ruleId: "rule-1", revision: 2 });
    await expect(db.select().from(recurringRule)).resolves.toEqual([
      expect.objectContaining({ id: "rule-1", name: "Rent updated", revision: 2 }),
    ]);
  });

  it("returns a typed stale result instead of overwriting a newer revision", async () => {
    await apply("recurring-create", { action: "create", ruleId: "rule-1", rule: draft });
    await apply("recurring-edit", {
      action: "edit",
      ruleId: "rule-1",
      expectedRevision: 1,
      rule: { ...draft, name: "Newest" },
    });

    await expect(
      apply("recurring-stale", {
        action: "pause",
        ruleId: "rule-1",
        expectedRevision: 1,
      }),
    ).resolves.toMatchObject({
      kind: "stale_version",
      entityId: "rule-1",
      expectedVersion: 1,
      actualVersion: 2,
    });
  });
});

const apply = (commandId: string, payload: unknown) =>
  applyCommand({
    db,
    userId: OWNER,
    envelope: {
      commandId,
      householdId: HOUSEHOLD,
      kind: "recurring.change",
      payload,
    } satisfies CommandEnvelope,
  });

const expectApplied = (result: CommandResult): Extract<CommandResult, { kind: "applied" }> => {
  expect(result.kind).toBe("applied");
  if (result.kind !== "applied") throw new Error(`Expected applied, received ${result.kind}`);
  return result;
};
