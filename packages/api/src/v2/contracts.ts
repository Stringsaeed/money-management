import { format, isValid, parse } from "date-fns";
import { z } from "zod";

/**
 * Identity supplied by the V2 auth seam. Guest sessions and WorkOS users are
 * deliberately separate ownership keys so a guest ledger can be claimed
 * atomically without touching the legacy ledger tables.
 */
export type V2Principal =
  | {
      readonly kind: "user";
      readonly userId: string;
      readonly workosUserId: string;
      readonly email: string;
      readonly name: string;
    }
  | {
      readonly kind: "guest";
      readonly guestSessionId: string;
    };

export type V2LedgerScope =
  | { readonly kind: "personal" }
  | { readonly kind: "household"; readonly householdId: string };

export type V2LedgerOwnerType = "user" | "guest" | "household";

export const MAX_SAFE_MONEY_MINOR = Number.MAX_SAFE_INTEGER;

/** JSON numbers must remain exact when they represent money. */
export const moneyMinorSchema = z
  .number()
  .int("Money must be an integer number of minor units.")
  .refine(Number.isSafeInteger, "Money exceeds JavaScript's safe integer range.")
  .refine(
    (value) => Math.abs(value) <= MAX_SAFE_MONEY_MINOR,
    "Money exceeds the supported minor-unit range.",
  );

export const positiveMoneyMinorSchema = moneyMinorSchema.positive();
export const currencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/, "Currency must be a three-letter uppercase ISO code.");
export const ledgerDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD.")
  .refine((value) => {
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
  }, "Date must be a real calendar date.");

export const accountTypeSchema = z.enum([
  "checking",
  "savings",
  "cash",
  "credit_card",
  "investment",
  "other",
]);
export type V2AccountType = z.infer<typeof accountTypeSchema>;

export const categoryKindSchema = z.enum(["income", "expense"]);
export type V2CategoryKind = z.infer<typeof categoryKindSchema>;

export const transactionKindSchema = z.enum(["income", "expense", "transfer"]);
export type V2TransactionKind = z.infer<typeof transactionKindSchema>;

export const recurringFrequencySchema = z.enum(["day", "week", "month", "year"]);
export type V2RecurringFrequency = z.infer<typeof recurringFrequencySchema>;

export const recurringLifecycleSchema = z.enum(["active", "paused", "completed", "archived"]);
export type V2RecurringLifecycle = z.infer<typeof recurringLifecycleSchema>;

export const recurringHealthSchema = z.enum(["ready", "needs_attention"]);
export type V2RecurringHealth = z.infer<typeof recurringHealthSchema>;
export type V2AttentionReason = Readonly<Record<string, string | number | null>>;

export const v2ScopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("personal") }),
  z.object({ kind: z.literal("household"), householdId: z.string().trim().min(1) }),
]);

export const accountCreateSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  type: accountTypeSchema,
  currency: currencySchema,
  openingBalanceMinor: moneyMinorSchema.default(0),
});

export const accountUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    type: accountTypeSchema.optional(),
    currency: currencySchema.optional(),
    openingBalanceMinor: moneyMinorSchema.optional(),
    archived: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one Account field.");

export const categoryCreateSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  kind: categoryKindSchema,
  color: z.string().trim().min(1).max(32).optional(),
  icon: z.string().trim().min(1).max(64).optional(),
  parentId: z.string().trim().min(1).nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const categoryUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    kind: categoryKindSchema.optional(),
    color: z.string().trim().min(1).max(32).optional(),
    icon: z.string().trim().min(1).max(64).optional(),
    parentId: z.string().trim().min(1).nullable().optional(),
    sortOrder: z.number().int().optional(),
    archived: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one Category field.");

export const transactionCreateSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    accountId: z.string().trim().min(1),
    categoryId: z.string().trim().min(1).nullable().optional(),
    toAccountId: z.string().trim().min(1).nullable().optional(),
    kind: transactionKindSchema,
    amountMinor: positiveMoneyMinorSchema,
    date: ledgerDateSchema,
    note: z.string().max(500).default(""),
  })
  .superRefine((value, context) => {
    if (value.kind === "transfer" && !value.toAccountId) {
      context.addIssue({
        code: "custom",
        path: ["toAccountId"],
        message: "Transfer needs a destination Account.",
      });
    }
    if (value.kind !== "transfer" && value.toAccountId) {
      context.addIssue({
        code: "custom",
        path: ["toAccountId"],
        message: "Only transfers have a destination Account.",
      });
    }
    if (value.toAccountId === value.accountId) {
      context.addIssue({
        code: "custom",
        path: ["toAccountId"],
        message: "Choose a different destination Account.",
      });
    }
  });

export const transactionUpdateSchema = z
  .object({
    accountId: z.string().trim().min(1).optional(),
    categoryId: z.string().trim().min(1).nullable().optional(),
    toAccountId: z.string().trim().min(1).nullable().optional(),
    kind: transactionKindSchema.optional(),
    amountMinor: positiveMoneyMinorSchema.optional(),
    date: ledgerDateSchema.optional(),
    note: z.string().max(500).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one Transaction field.");

const recurringFieldsSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  accountId: z.string().trim().min(1),
  categoryId: z.string().trim().min(1).nullable().optional(),
  toAccountId: z.string().trim().min(1).nullable().optional(),
  kind: transactionKindSchema,
  amountMinor: positiveMoneyMinorSchema,
  currency: currencySchema,
  note: z.string().max(500).default(""),
  frequency: recurringFrequencySchema,
  intervalCount: z.number().int().positive().max(10_000).default(1),
  startDate: ledgerDateSchema,
  endDate: ledgerDateSchema.nullable().optional(),
  endCount: z.number().int().positive().max(1_000_000).nullable().optional(),
  timeZone: z.string().trim().min(1).max(120),
});

function validateRecurringFields(
  value: z.infer<typeof recurringFieldsSchema>,
  context: z.RefinementCtx,
): void {
  if (value.kind === "transfer" && !value.toAccountId) {
    context.addIssue({
      code: "custom",
      path: ["toAccountId"],
      message: "Transfer needs a destination Account.",
    });
  }
  if (value.kind !== "transfer" && value.toAccountId) {
    context.addIssue({
      code: "custom",
      path: ["toAccountId"],
      message: "Only transfers have a destination Account.",
    });
  }
  if (value.toAccountId === value.accountId) {
    context.addIssue({
      code: "custom",
      path: ["toAccountId"],
      message: "Choose a different destination Account.",
    });
  }
  if (value.endDate && value.endDate < value.startDate) {
    context.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date must not precede start date.",
    });
  }
}

export const recurringCreateSchema = recurringFieldsSchema.superRefine(validateRecurringFields);

export const recurringUpdateSchema = recurringFieldsSchema
  .omit({ id: true })
  .partial()
  .extend({ lifecycle: recurringLifecycleSchema.optional() })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one Recurring Rule field.");

export type V2AccountCreateInput = z.input<typeof accountCreateSchema>;
export type V2AccountUpdateInput = z.input<typeof accountUpdateSchema>;
export type V2CategoryCreateInput = z.input<typeof categoryCreateSchema>;
export type V2CategoryUpdateInput = z.input<typeof categoryUpdateSchema>;
export type V2TransactionCreateInput = z.input<typeof transactionCreateSchema>;
export type V2TransactionUpdateInput = z.input<typeof transactionUpdateSchema>;
export type V2RecurringCreateInput = z.input<typeof recurringCreateSchema>;
export type V2RecurringUpdateInput = z.input<typeof recurringUpdateSchema>;

export interface V2Account {
  readonly id: string;
  readonly ledgerId: string;
  readonly name: string;
  readonly type: V2AccountType;
  readonly currency: string;
  readonly openingBalanceMinor: number;
  readonly balanceMinor: number;
  readonly archived: boolean;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface V2Category {
  readonly id: string;
  readonly ledgerId: string;
  readonly name: string;
  readonly kind: V2CategoryKind;
  readonly color: string;
  readonly icon: string;
  readonly parentId: string | null;
  readonly sortOrder: number;
  readonly archived: boolean;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface V2Transaction {
  readonly id: string;
  readonly ledgerId: string;
  readonly accountId: string;
  readonly categoryId: string | null;
  readonly toAccountId: string | null;
  readonly kind: V2TransactionKind;
  readonly amountMinor: number;
  readonly currency: string;
  readonly date: string;
  readonly note: string;
  readonly recurringRuleId: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface V2RecurringRule {
  readonly id: string;
  readonly ledgerId: string;
  readonly name: string;
  readonly accountId: string;
  readonly categoryId: string | null;
  readonly toAccountId: string | null;
  readonly kind: V2TransactionKind;
  readonly amountMinor: number;
  readonly currency: string;
  readonly note: string;
  readonly frequency: V2RecurringFrequency;
  readonly intervalCount: number;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly endCount: number | null;
  readonly timeZone: string;
  readonly lifecycle: V2RecurringLifecycle;
  readonly health: V2RecurringHealth;
  readonly attentionReasons: readonly V2AttentionReason[];
  readonly eligibilityFloor: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface V2Home {
  readonly ledgerId: string;
  readonly accounts: readonly V2Account[];
  readonly totals: readonly {
    readonly currency: string;
    readonly incomeMinor: number;
    readonly expenseMinor: number;
    readonly netMinor: number;
  }[];
  readonly recentTransactions: readonly V2Transaction[];
}

export interface V2Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

export function principalOwner(principal: V2Principal): {
  readonly ownerType: Exclude<V2LedgerOwnerType, "household">;
  readonly ownerId: string;
} {
  return principal.kind === "user"
    ? { ownerType: "user", ownerId: principal.userId }
    : { ownerType: "guest", ownerId: principal.guestSessionId };
}

export function personalLedgerOwner(principal: V2Principal): string {
  const owner = principalOwner(principal);
  return `${owner.ownerType}:${owner.ownerId}`;
}
