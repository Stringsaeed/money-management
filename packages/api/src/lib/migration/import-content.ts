import type { ImportContentRow } from "@trove/protocol";
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

export function accountContentRow(row: typeof ledgerAccount.$inferSelect): ImportContentRow {
  return {
    entityType: "account",
    row: {
      id: row.id,
      name: row.name,
      type: row.type,
      currency: row.currency,
      color: row.color,
      icon: row.icon,
      initialBalanceMinor: row.initialBalanceMinor,
      excludeFromTotal: row.excludeFromTotal,
      sortOrder: row.sortOrder,
      lifecycle: row.lifecycle,
      lifecycleChangedAt: row.lifecycleChangedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}

export function categoryContentRow(row: typeof category.$inferSelect): ImportContentRow {
  return {
    entityType: "category",
    row: {
      id: row.id,
      name: row.name,
      type: row.type,
      color: row.color,
      icon: row.icon,
      parentId: row.parentId,
      sortOrder: row.sortOrder,
      lifecycle: row.lifecycle,
      lifecycleChangedAt: row.lifecycleChangedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}

export function transactionContentRow(row: typeof transaction.$inferSelect): ImportContentRow {
  return {
    entityType: "transaction",
    row: {
      id: row.id,
      type: row.type,
      amountMinor: row.amountMinor,
      currency: row.currency,
      originalAmountMinor: row.originalAmountMinor,
      originalCurrency: row.originalCurrency,
      exchangeRate: row.exchangeRate,
      date: row.date,
      accountId: row.accountId,
      toAccountId: row.toAccountId,
      categoryId: row.categoryId,
      isRecurring: row.isRecurring,
      recurringRuleId: row.recurringRuleId,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}

export function recurringRuleContentRow(row: typeof recurringRule.$inferSelect): ImportContentRow {
  return {
    entityType: "recurring_rule",
    row: {
      id: row.id,
      name: row.name,
      type: row.type,
      amountMinor: row.amountMinor,
      currency: row.currency,
      accountId: row.accountId,
      toAccountId: row.toAccountId,
      categoryId: row.categoryId,
      description: row.description,
      frequency: row.frequency,
      intervalCount: row.intervalCount,
      startDate: row.startDate,
      endDate: row.endDate,
      endCount: row.endCount,
      timeZone: row.timeZone,
      lifecycle: row.lifecycle,
      health: row.health,
      attentionReasons: row.attentionReasons,
      attentionDetails: row.attentionDetails,
      eligibilityFloor: row.eligibilityFloor,
      revision: row.revision,
      lifecycleChangedAt: row.lifecycleChangedAt?.toISOString() ?? null,
      healthChangedAt: row.healthChangedAt?.toISOString() ?? null,
      lastSettlementAttemptAt: row.lastSettlementAttemptAt?.toISOString() ?? null,
      lastSettlementError: row.lastSettlementError,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}

export function budgetWorkspaceContentRow(
  row: typeof budgetWorkspace.$inferSelect,
): ImportContentRow {
  return {
    entityType: "budget_workspace",
    row: {
      id: row.id,
      currency: row.currency,
      activationPeriod: row.activationPeriod,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}

export function envelopeContentRow(row: typeof envelope.$inferSelect): ImportContentRow {
  return {
    entityType: "envelope",
    row: {
      id: row.id,
      currency: row.currency,
      name: row.name,
      icon: row.icon,
      color: row.color,
      lifecycle: row.lifecycle,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}

export function categoryMappingContentRow(
  row: typeof categoryMapping.$inferSelect,
): ImportContentRow {
  return {
    entityType: "category_mapping",
    row: {
      id: row.id,
      categoryId: row.categoryId,
      envelopeId: row.envelopeId,
      effectiveFromPeriod: row.effectiveFromPeriod,
      createdAt: row.createdAt.toISOString(),
    },
  };
}

export function fundingMembershipContentRow(
  row: typeof fundingMembership.$inferSelect,
): ImportContentRow {
  return {
    entityType: "funding_membership",
    row: {
      id: row.id,
      accountId: row.accountId,
      currency: row.currency,
      active: row.active,
      effectiveFromPeriod: row.effectiveFromPeriod,
      createdAt: row.createdAt.toISOString(),
    },
  };
}

export function rolloverSettingContentRow(
  row: typeof rolloverSetting.$inferSelect,
): ImportContentRow {
  return {
    entityType: "rollover_setting",
    row: {
      id: row.id,
      envelopeId: row.envelopeId,
      effectiveFromPeriod: row.effectiveFromPeriod,
      positiveRollover: row.positiveRollover,
      createdAt: row.createdAt.toISOString(),
    },
  };
}

export function assignmentContentRow(row: typeof assignment.$inferSelect): ImportContentRow {
  return {
    entityType: "assignment",
    row: {
      id: row.id,
      currency: row.currency,
      budgetPeriod: row.budgetPeriod,
      sourceEnvelopeId: row.sourceEnvelopeId,
      destinationEnvelopeId: row.destinationEnvelopeId,
      amountMinor: row.amountMinor,
      reversesAssignmentId: row.reversesAssignmentId,
      createdAt: row.createdAt.toISOString(),
    },
  };
}

export function recurringOccurrenceContentRow(
  row: typeof recurringOccurrence.$inferSelect,
): ImportContentRow {
  return {
    entityType: "recurring_occurrence",
    row: {
      id: row.id,
      ruleId: row.ruleId,
      scheduledDate: row.scheduledDate,
      transactionId: row.transactionId,
      settledAt: row.settledAt.toISOString(),
    },
  };
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
