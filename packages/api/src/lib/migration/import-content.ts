import type { ImportContentRow } from "@trove/protocol";
import type { category, ledgerAccount, transaction } from "@trove/db/schema/ledger";

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

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
