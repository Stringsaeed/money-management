import { describe, expect, it } from "vitest";

import type { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";
import type {
  assignment,
  budgetWorkspace,
  categoryMapping,
  envelope,
  fundingMembership,
  rolloverSetting,
} from "@trove/db/schema/budget";
import type { recurringOccurrence, recurringRule } from "@trove/db/schema/recurring";

import {
  accountContentRow,
  assignmentContentRow,
  budgetWorkspaceContentRow,
  categoryContentRow,
  categoryMappingContentRow,
  envelopeContentRow,
  fundingMembershipContentRow,
  recurringOccurrenceContentRow,
  recurringRuleContentRow,
  rolloverSettingContentRow,
  sha256Hex,
  transactionContentRow,
} from "./import-content";

const createdAt = new Date("2026-09-01T12:00:00.000Z");
const updatedAt = new Date("2026-09-02T12:00:00.000Z");
const lifecycleChangedAt = new Date("2026-09-03T12:00:00.000Z");

describe("accountContentRow", () => {
  it("maps account fields and nulls absent lifecycleChangedAt", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "account-1",
      name: "Checking",
      type: "bank",
      currency: "USD",
      color: "#111111",
      icon: "bank",
      initialBalanceMinor: 1000,
      excludeFromTotal: false,
      sortOrder: 1,
      lifecycle: "active",
      lifecycleChangedAt: null,
      createdAt,
      updatedAt,
    } as typeof ledgerAccount.$inferSelect;

    expect(accountContentRow(row)).toEqual({
      entityType: "account",
      row: {
        id: "account-1",
        name: "Checking",
        type: "bank",
        currency: "USD",
        color: "#111111",
        icon: "bank",
        initialBalanceMinor: 1000,
        excludeFromTotal: false,
        sortOrder: 1,
        lifecycle: "active",
        lifecycleChangedAt: null,
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-02T12:00:00.000Z",
      },
    });
  });
});

describe("categoryContentRow", () => {
  it("serializes lifecycleChangedAt when present", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "category-1",
      name: "Groceries",
      type: "expense",
      color: "#222222",
      icon: "cart",
      parentId: null,
      sortOrder: 0,
      lifecycle: "active",
      lifecycleChangedAt,
      createdAt,
      updatedAt,
    } as typeof category.$inferSelect;

    expect(categoryContentRow(row)).toEqual({
      entityType: "category",
      row: {
        id: "category-1",
        name: "Groceries",
        type: "expense",
        color: "#222222",
        icon: "cart",
        parentId: null,
        sortOrder: 0,
        lifecycle: "active",
        lifecycleChangedAt: "2026-09-03T12:00:00.000Z",
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-02T12:00:00.000Z",
      },
    });
  });
});

describe("transactionContentRow", () => {
  it("preserves money and foreign-key fields as content values", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "txn-1",
      type: "expense",
      amountMinor: 2500,
      currency: "USD",
      originalAmountMinor: null,
      originalCurrency: null,
      exchangeRate: null,
      date: "2026-09-01",
      accountId: "account-1",
      toAccountId: null,
      categoryId: "category-1",
      isRecurring: false,
      recurringRuleId: null,
      description: "Coffee",
      createdAt,
      updatedAt,
    } as typeof transaction.$inferSelect;

    expect(transactionContentRow(row)).toEqual({
      entityType: "transaction",
      row: {
        id: "txn-1",
        type: "expense",
        amountMinor: 2500,
        currency: "USD",
        originalAmountMinor: null,
        originalCurrency: null,
        exchangeRate: null,
        date: "2026-09-01",
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        isRecurring: false,
        recurringRuleId: null,
        description: "Coffee",
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-02T12:00:00.000Z",
      },
    });
  });
});

describe("budgetWorkspaceContentRow", () => {
  it("maps workspace activation period timestamps to ISO", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "ws-1",
      currency: "USD",
      activationPeriod: "2026-09",
      createdAt,
      updatedAt,
    } as typeof budgetWorkspace.$inferSelect;

    expect(budgetWorkspaceContentRow(row)).toEqual({
      entityType: "budget_workspace",
      row: {
        id: "ws-1",
        currency: "USD",
        activationPeriod: "2026-09",
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-02T12:00:00.000Z",
      },
    });
  });
});

describe("recurringOccurrenceContentRow", () => {
  it("maps settledAt to ISO", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "occ-1",
      ruleId: "rule-1",
      scheduledDate: "2026-09-01",
      transactionId: "txn-1",
      settledAt: createdAt,
    } as typeof recurringOccurrence.$inferSelect;

    expect(recurringOccurrenceContentRow(row)).toEqual({
      entityType: "recurring_occurrence",
      row: {
        id: "occ-1",
        ruleId: "rule-1",
        scheduledDate: "2026-09-01",
        transactionId: "txn-1",
        settledAt: "2026-09-01T12:00:00.000Z",
      },
    });
  });
});

describe("envelopeContentRow", () => {
  it("maps envelope display fields and ISO timestamps", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "env-1",
      currency: "USD",
      name: "Groceries",
      icon: "cart",
      color: "#abcdef",
      lifecycle: "active",
      sortOrder: 2,
      createdAt,
      updatedAt,
    } as typeof envelope.$inferSelect;

    expect(envelopeContentRow(row)).toEqual({
      entityType: "envelope",
      row: {
        id: "env-1",
        currency: "USD",
        name: "Groceries",
        icon: "cart",
        color: "#abcdef",
        lifecycle: "active",
        sortOrder: 2,
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-02T12:00:00.000Z",
      },
    });
  });
});

describe("categoryMappingContentRow", () => {
  it("maps category-to-envelope effective period binding", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "map-1",
      categoryId: "category-1",
      envelopeId: "env-1",
      effectiveFromPeriod: "2026-09",
      createdAt,
    } as typeof categoryMapping.$inferSelect;

    expect(categoryMappingContentRow(row)).toEqual({
      entityType: "category_mapping",
      row: {
        id: "map-1",
        categoryId: "category-1",
        envelopeId: "env-1",
        effectiveFromPeriod: "2026-09",
        createdAt: "2026-09-01T12:00:00.000Z",
      },
    });
  });
});

describe("fundingMembershipContentRow", () => {
  it("maps account funding membership period binding", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "fund-1",
      accountId: "account-1",
      currency: "USD",
      active: true,
      effectiveFromPeriod: "2026-09",
      createdAt,
    } as typeof fundingMembership.$inferSelect;

    expect(fundingMembershipContentRow(row)).toEqual({
      entityType: "funding_membership",
      row: {
        id: "fund-1",
        accountId: "account-1",
        currency: "USD",
        active: true,
        effectiveFromPeriod: "2026-09",
        createdAt: "2026-09-01T12:00:00.000Z",
      },
    });
  });
});

describe("rolloverSettingContentRow", () => {
  it("maps envelope rollover setting period binding", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "roll-1",
      envelopeId: "env-1",
      effectiveFromPeriod: "2026-09",
      positiveRollover: true,
      createdAt,
    } as typeof rolloverSetting.$inferSelect;

    expect(rolloverSettingContentRow(row)).toEqual({
      entityType: "rollover_setting",
      row: {
        id: "roll-1",
        envelopeId: "env-1",
        effectiveFromPeriod: "2026-09",
        positiveRollover: true,
        createdAt: "2026-09-01T12:00:00.000Z",
      },
    });
  });
});

describe("assignmentContentRow", () => {
  it("maps assignment fields and nulls absent reversesAssignmentId", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "asg-1",
      currency: "USD",
      budgetPeriod: "2026-09",
      sourceEnvelopeId: "env-source",
      destinationEnvelopeId: "env-dest",
      amountMinor: 2500,
      reversesAssignmentId: null,
      createdAt,
    } as typeof assignment.$inferSelect;

    expect(assignmentContentRow(row)).toEqual({
      entityType: "assignment",
      row: {
        id: "asg-1",
        currency: "USD",
        budgetPeriod: "2026-09",
        sourceEnvelopeId: "env-source",
        destinationEnvelopeId: "env-dest",
        amountMinor: 2500,
        reversesAssignmentId: null,
        createdAt: "2026-09-01T12:00:00.000Z",
      },
    });
  });

  it("preserves a reversing assignment id when present", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "asg-2",
      currency: "USD",
      budgetPeriod: "2026-09",
      sourceEnvelopeId: "env-dest",
      destinationEnvelopeId: "env-source",
      amountMinor: 2500,
      reversesAssignmentId: "asg-1",
      createdAt,
    } as typeof assignment.$inferSelect;

    expect(assignmentContentRow(row).row).toMatchObject({
      id: "asg-2",
      reversesAssignmentId: "asg-1",
    });
  });
});

describe("recurringRuleContentRow", () => {
  it("maps rule fields and nulls absent change timestamps", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const row = {
      id: "rule-1",
      name: "Rent",
      type: "expense",
      amountMinor: 120_000,
      currency: "USD",
      accountId: "account-1",
      toAccountId: null,
      categoryId: "category-1",
      description: "Monthly rent",
      frequency: "month",
      intervalCount: 1,
      startDate: "2026-01-01",
      endDate: null,
      endCount: null,
      timeZone: "UTC",
      lifecycle: "active",
      health: "ready",
      attentionReasons: "[]",
      attentionDetails: null,
      eligibilityFloor: "2026-01-01",
      revision: 1,
      lifecycleChangedAt: null,
      healthChangedAt: null,
      lastSettlementAttemptAt: null,
      lastSettlementError: null,
      createdAt,
      updatedAt,
    } as typeof recurringRule.$inferSelect;

    expect(recurringRuleContentRow(row)).toEqual({
      entityType: "recurring_rule",
      row: {
        id: "rule-1",
        name: "Rent",
        type: "expense",
        amountMinor: 120_000,
        currency: "USD",
        accountId: "account-1",
        toAccountId: null,
        categoryId: "category-1",
        description: "Monthly rent",
        frequency: "month",
        intervalCount: 1,
        startDate: "2026-01-01",
        endDate: null,
        endCount: null,
        timeZone: "UTC",
        lifecycle: "active",
        health: "ready",
        attentionReasons: "[]",
        attentionDetails: null,
        eligibilityFloor: "2026-01-01",
        revision: 1,
        lifecycleChangedAt: null,
        healthChangedAt: null,
        lastSettlementAttemptAt: null,
        lastSettlementError: null,
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-02T12:00:00.000Z",
      },
    });
  });

  it("serializes lifecycle, health, and settlement attempt timestamps when present", () => {
    // SAFETY: fixture only needs columns the pure content-row mapper reads.
    const healthChangedAt = new Date("2026-09-04T12:00:00.000Z");
    const lastSettlementAttemptAt = new Date("2026-09-05T12:00:00.000Z");
    const row = {
      id: "rule-2",
      name: "Paycheck",
      type: "income",
      amountMinor: 200_000,
      currency: "USD",
      accountId: "account-1",
      toAccountId: null,
      categoryId: null,
      description: "",
      frequency: "month",
      intervalCount: 1,
      startDate: "2026-01-15",
      endDate: "2026-12-15",
      endCount: 12,
      timeZone: "America/New_York",
      lifecycle: "paused",
      health: "needs_attention",
      attentionReasons: '["missing-source-account"]',
      attentionDetails: "account gone",
      eligibilityFloor: "2026-02-15",
      revision: 3,
      lifecycleChangedAt,
      healthChangedAt,
      lastSettlementAttemptAt,
      lastSettlementError: "account missing",
      createdAt,
      updatedAt,
    } as typeof recurringRule.$inferSelect;

    expect(recurringRuleContentRow(row).row).toMatchObject({
      id: "rule-2",
      endDate: "2026-12-15",
      endCount: 12,
      lifecycleChangedAt: "2026-09-03T12:00:00.000Z",
      healthChangedAt: "2026-09-04T12:00:00.000Z",
      lastSettlementAttemptAt: "2026-09-05T12:00:00.000Z",
      lastSettlementError: "account missing",
    });
  });
});

describe("sha256Hex", () => {
  it("returns a stable lowercase hex digest", async () => {
    const first = await sha256Hex("import-content-fixture");
    const second = await sha256Hex("import-content-fixture");
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(await sha256Hex("other")).not.toBe(first);
  });
});
