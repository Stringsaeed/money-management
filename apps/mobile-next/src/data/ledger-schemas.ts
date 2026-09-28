/* oxlint-disable anti-slop/no-unknown-parameters -- these functions are the explicit untrusted JSON parsing boundary. */

import { z } from "zod";

import {
  accountTypeSchema,
  categoryKindSchema,
  ledgerDateSchema,
  recurringFrequencySchema,
  recurringHealthSchema,
  recurringLifecycleSchema,
  transactionKindSchema,
  type V2Account,
  type V2AutoCategorization,
  type V2Category,
  type V2CreatedTransaction,
  type V2Home,
  type V2Page,
  type V2RecurringRule,
  type V2Transaction,
  type V2TransactionSummary,
} from "@trove/api/v2/contracts";

const money = z.number().int().refine(Number.isSafeInteger);

export const accountSchema = z.object({
  id: z.string(),
  ledgerId: z.string(),
  name: z.string(),
  type: accountTypeSchema,
  currency: z.string(),
  openingBalanceMinor: money,
  balanceMinor: money,
  archived: z.boolean(),
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const accountResponseSchema = accountSchema;

export const categorySchema: z.ZodType<V2Category> = z.object({
  id: z.string(),
  ledgerId: z.string(),
  name: z.string(),
  kind: categoryKindSchema,
  color: z.string(),
  icon: z.string(),
  parentId: z.string().nullable(),
  sortOrder: z.number().int(),
  archived: z.boolean(),
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const transactionSchema: z.ZodType<V2Transaction> = z.object({
  id: z.string(),
  ledgerId: z.string(),
  accountId: z.string(),
  categoryId: z.string().nullable(),
  toAccountId: z.string().nullable(),
  kind: transactionKindSchema,
  amountMinor: money,
  currency: z.string(),
  date: ledgerDateSchema,
  note: z.string(),
  recurringRuleId: z.string().nullable(),
  version: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const recurringRuleSchema: z.ZodType<V2RecurringRule> = z.object({
  id: z.string(),
  ledgerId: z.string(),
  name: z.string(),
  accountId: z.string(),
  categoryId: z.string().nullable(),
  toAccountId: z.string().nullable(),
  kind: transactionKindSchema,
  amountMinor: money,
  currency: z.string(),
  note: z.string(),
  frequency: recurringFrequencySchema,
  intervalCount: z.number().int(),
  startDate: ledgerDateSchema,
  endDate: ledgerDateSchema.nullable(),
  endCount: z.number().int().nullable(),
  timeZone: z.string(),
  lifecycle: recurringLifecycleSchema,
  health: recurringHealthSchema,
  attentionReasons: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
  eligibilityFloor: ledgerDateSchema,
  revision: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const upcomingOccurrenceSchema = z.object({
  ruleId: z.string(),
  scheduledDate: ledgerDateSchema,
  amountMinor: money,
  currency: z.string(),
  kind: z.enum(["income", "expense", "transfer"]),
});

export type UpcomingOccurrence = z.infer<typeof upcomingOccurrenceSchema>;

export const pageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });

export const homeSchema = z.object({
  ledgerId: z.string(),
  accounts: z.array(accountResponseSchema),
  totals: z.array(
    z.object({
      currency: z.string(),
      incomeMinor: money,
      expenseMinor: money,
      netMinor: money,
    }),
  ),
  recentTransactions: z.array(transactionSchema),
});

export const homeOverviewBucketsSchema = z.object({
  openingBalanceMinor: money,
  buckets: z.array(
    z.object({
      date: z.string(),
      deltaMinor: money,
      incomeMinor: money,
      expenseMinor: money,
    }),
  ),
});

export const transactionSummarySchema: z.ZodType<V2TransactionSummary> = z.object({
  count: z.number().int().nonnegative(),
  totals: z.array(
    z.object({
      currency: z.string(),
      count: z.number().int().nonnegative(),
      incomeMinor: money,
      expenseMinor: money,
      netMinor: money,
    }),
  ),
});

export const parsePage = <T>(schema: z.ZodType<T>, payload: unknown): V2Page<T> =>
  z.object({ items: z.array(schema), nextCursor: z.string().nullable() }).parse(payload);

export const parseAccount = (payload: unknown): V2Account => accountResponseSchema.parse(payload);
export const parseCategory = (payload: unknown): V2Category => categorySchema.parse(payload);
export const parseTransaction = (payload: unknown): V2Transaction =>
  transactionSchema.parse(payload);

const autoCategorizationSchema: z.ZodType<V2AutoCategorization> = z.discriminatedUnion("outcome", [
  z.object({
    outcome: z.literal("categorized"),
    source: z.enum(["jev", "research"]),
    category: categorySchema,
  }),
  z.object({ outcome: z.enum(["skipped", "uncategorized", "rate_limited", "unavailable"]) }),
]);

/** A malformed categorization note must never fail a save that already succeeded. */
export const parseCreatedTransaction = (payload: unknown): V2CreatedTransaction => {
  const transaction = transactionSchema.parse(payload);
  const categorization = z
    .object({ autoCategorization: autoCategorizationSchema })
    .safeParse(payload);
  return categorization.success
    ? { ...transaction, autoCategorization: categorization.data.autoCategorization }
    : transaction;
};
export const parseRecurringRule = (payload: unknown): V2RecurringRule =>
  recurringRuleSchema.parse(payload);
export const parseHome = (payload: unknown): V2Home => homeSchema.parse(payload);
export const parseTransactionSummary = (payload: unknown): V2TransactionSummary =>
  transactionSummarySchema.parse(payload);
