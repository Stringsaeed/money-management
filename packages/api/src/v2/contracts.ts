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

/** `auto_post` settles on its own each due date; `remind` waits for Mark paid or Skip (#372). */
export const recurringModeSchema = z.enum(["auto_post", "remind"]);
export type V2RecurringMode = z.infer<typeof recurringModeSchema>;
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
    /** Let the categorizer pick a category from the note; ignored for transfers or when categoryId is set. */
    autoCategorize: z.boolean().default(false),
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
  mode: recurringModeSchema.optional(),
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

/** Mark paid with the confirmed values; each override applies to this occurrence only. */
export const recurringPaySchema = z
  .object({
    amountMinor: positiveMoneyMinorSchema.optional(),
    accountId: z.string().trim().min(1).optional(),
    date: ledgerDateSchema.optional(),
  })
  .strict();

/**
 * The currency a setup-facts read or an activation uses when the request names
 * none (the app before #402 always meant AED). Not a gate: a ledger has one
 * budget per ISO currency (#400, ADR-0002).
 */
export const BUDGET_CURRENCY = "AED";

/** An ISO 4217 code the runtime knows, so its minor units are known too. */
export const budgetCurrencySchema = currencySchema.refine(
  (value) => Intl.supportedValuesOf("currency").includes(value),
  "Currency must be an ISO 4217 code.",
);

export const paydayRuleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("day"), day: z.number().int().min(1).max(28) }),
  z.object({ kind: z.literal("last_workday") }),
]);
export type V2PaydayRule = z.infer<typeof paydayRuleSchema>;

export const envelopeGroupSchema = z.enum(["bills", "everyday", "saving"]);
export type V2EnvelopeGroup = z.infer<typeof envelopeGroupSchema>;

export const envelopeRepeatSchema = z.enum(["once", "every_3_months", "every_6_months", "yearly"]);
export type V2EnvelopeRepeat = z.infer<typeof envelopeRepeatSchema>;

const nonNegativeMoneyMinorSchema = moneyMinorSchema.nonnegative();
const entityIdSchema = z.string().trim().min(1);

const envelopeInputFields = {
  name: z.string().trim().min(1).max(120),
  group: envelopeGroupSchema,
  /** An existing expense Category, or `newCategory` to reuse-or-create one by name. */
  categoryId: entityIdSchema.optional(),
  newCategory: z.object({ name: z.string().trim().min(1).max(120) }).optional(),
  targetMinor: positiveMoneyMinorSchema.optional(),
  dueDate: ledgerDateSchema.optional(),
  repeat: envelopeRepeatSchema.optional(),
};

interface EnvelopeRefineInput {
  readonly group: V2EnvelopeGroup;
  readonly categoryId?: string;
  readonly newCategory?: unknown;
  readonly targetMinor?: number;
  readonly dueDate?: string;
  readonly repeat?: V2EnvelopeRepeat;
  readonly setAsideMinor?: number;
}

function refineEnvelope(value: EnvelopeRefineInput, context: z.RefinementCtx): void {
  if ((value.categoryId === undefined) === (value.newCategory === undefined)) {
    context.addIssue({
      code: "custom",
      path: ["categoryId"],
      message: "Give either categoryId or newCategory.",
    });
  }
  const hasSavingFields =
    value.targetMinor !== undefined ||
    value.dueDate !== undefined ||
    value.repeat !== undefined ||
    (value.setAsideMinor ?? 0) > 0;
  if (value.group !== "saving" && hasSavingFields) {
    context.addIssue({
      code: "custom",
      path: ["group"],
      message: "Only Saving-for envelopes have a target, due date, repeat, or set-aside amount.",
    });
  }
}

export const budgetActivateEnvelopeSchema = z
  .object({
    ...envelopeInputFields,
    plannedMinor: nonNegativeMoneyMinorSchema,
    /** Money already set aside for a Saving-for goal; assigned from Not planned yet. */
    setAsideMinor: nonNegativeMoneyMinorSchema.default(0),
  })
  .superRefine(refineEnvelope);

/** `POST /budget/envelopes`: one envelope, optionally funded from Not planned yet. */
export const envelopeCreateSchema = z
  .object({
    ...envelopeInputFields,
    plannedMinor: nonNegativeMoneyMinorSchema.default(0),
  })
  .superRefine(refineEnvelope);

/** `PATCH /budget/envelopes/:id`. `categoryIds` replaces the whole mapping set. */
export const envelopeUpdateSchema = z
  .object({
    name: envelopeInputFields.name.optional(),
    group: envelopeGroupSchema.optional(),
    startFresh: z.boolean().optional(),
    targetMinor: positiveMoneyMinorSchema.nullable().optional(),
    dueDate: ledgerDateSchema.nullable().optional(),
    repeat: envelopeRepeatSchema.nullable().optional(),
    lifecycle: z.literal("archived").optional(),
    categoryIds: z.array(entityIdSchema).min(1).max(20).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one Envelope field.")
  .refine(
    (value) => new Set(value.categoryIds).size === (value.categoryIds?.length ?? 0),
    "Categories must be distinct.",
  );

/** `POST /budget/envelopes/:id/pay`: Mark a big payment paid. */
export const envelopePaySchema = z
  .object({
    amountMinor: positiveMoneyMinorSchema,
    accountId: entityIdSchema,
    date: ledgerDateSchema,
  })
  .strict();

export const assignmentReasonSchema = z.enum(["plan", "cover", "move", "leftover", "repeat"]);
export type V2AssignmentReason = z.infer<typeof assignmentReasonSchema>;

/** A null side is Not planned yet. */
export const assignmentItemSchema = z
  .object({
    fromEnvelopeId: entityIdSchema.nullable(),
    toEnvelopeId: entityIdSchema.nullable(),
    amountMinor: positiveMoneyMinorSchema,
    reason: assignmentReasonSchema,
  })
  .refine((value) => value.fromEnvelopeId !== value.toEnvelopeId, {
    message: "Move money between two different places.",
    path: ["toEnvelopeId"],
  });

/** `POST /budget/assignments`. `periodStart` defaults to the current period start. */
export const assignmentsCreateSchema = z.object({
  periodStart: ledgerDateSchema.optional(),
  items: z.array(assignmentItemSchema).min(1).max(50),
});

export const budgetActivateSchema = z
  .object({
    /** The budget's currency; one budget per currency per ledger. */
    currency: budgetCurrencySchema.default(BUDGET_CURRENCY),
    paydayRule: paydayRuleSchema,
    usualSalaryMinor: positiveMoneyMinorSchema.nullable().optional(),
    paydayReminder: z.boolean().default(true),
    /** Accounts in the budget's currency that hold the money planned with. Exclusive with `openingCashMinor`. */
    fundingAccountIds: z.array(entityIdSchema).min(1).max(20).optional(),
    /** One typed total: activation creates a "My money" cash Account with this opening balance. */
    openingCashMinor: nonNegativeMoneyMinorSchema.optional(),
    /** Must be a funding account; defaults to the first funding account or "My money". */
    defaultAccountId: entityIdSchema.optional(),
    envelopes: z.array(budgetActivateEnvelopeSchema).min(1).max(100),
  })
  .superRefine((value, context) => {
    if ((value.fundingAccountIds === undefined) === (value.openingCashMinor === undefined)) {
      context.addIssue({
        code: "custom",
        path: ["fundingAccountIds"],
        message: "Give either fundingAccountIds or openingCashMinor.",
      });
    }
    if (
      value.fundingAccountIds &&
      new Set(value.fundingAccountIds).size !== value.fundingAccountIds.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["fundingAccountIds"],
        message: "Funding accounts must be distinct.",
      });
    }
    if (
      value.defaultAccountId !== undefined &&
      !value.fundingAccountIds?.includes(value.defaultAccountId)
    ) {
      context.addIssue({
        code: "custom",
        path: ["defaultAccountId"],
        message: "The default account must be one of the funding accounts.",
      });
    }
  });

export const budgetUpdateSchema = z
  .object({
    paydayRule: paydayRuleSchema.optional(),
    usualSalaryMinor: positiveMoneyMinorSchema.nullable().optional(),
    paydayReminder: z.boolean().optional(),
    defaultAccountId: entityIdSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one Budget field.");

export type V2AccountCreateInput = z.input<typeof accountCreateSchema>;
export type V2AccountUpdateInput = z.input<typeof accountUpdateSchema>;
export type V2CategoryCreateInput = z.input<typeof categoryCreateSchema>;
export type V2CategoryUpdateInput = z.input<typeof categoryUpdateSchema>;
export type V2TransactionCreateInput = z.input<typeof transactionCreateSchema>;
export type V2TransactionUpdateInput = z.input<typeof transactionUpdateSchema>;
export type V2RecurringCreateInput = z.input<typeof recurringCreateSchema>;
export type V2RecurringUpdateInput = z.input<typeof recurringUpdateSchema>;
export type V2RecurringPayInput = z.input<typeof recurringPaySchema>;
export type V2BudgetActivateInput = z.input<typeof budgetActivateSchema>;
export type V2BudgetUpdateInput = z.input<typeof budgetUpdateSchema>;
export type V2EnvelopeCreateInput = z.input<typeof envelopeCreateSchema>;
export type V2EnvelopeUpdateInput = z.input<typeof envelopeUpdateSchema>;
export type V2EnvelopePayInput = z.input<typeof envelopePaySchema>;
export type V2AssignmentsCreateInput = z.input<typeof assignmentsCreateSchema>;

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

/** "AI pick" needs a real choice: with fewer categories of a kind there is nothing to decide. */
export const MIN_AUTO_CATEGORIZE_CATEGORIES = 2;

/**
 * Outcome of `autoCategorize` on Transaction create. AI never fails the create:
 * anything other than `categorized` leaves the Transaction uncategorized.
 * `source` says whether Jev decided alone or after researching the note.
 */
export type V2AutoCategorization =
  | {
      readonly outcome: "categorized";
      readonly source: "jev" | "research";
      readonly category: V2Category;
    }
  | {
      readonly outcome: "skipped" | "uncategorized" | "rate_limited" | "unavailable";
    };

export interface V2CreatedTransaction extends V2Transaction {
  /** Present only when the create asked for `autoCategorize`. */
  readonly autoCategorization?: V2AutoCategorization;
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
  readonly mode: V2RecurringMode;
  readonly attentionReasons: readonly V2AttentionReason[];
  readonly eligibilityFloor: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** One pending occurrence of a `remind` rule, from its earliest unpaid date (#372 M3). */
export interface V2DueOccurrence {
  readonly ruleId: string;
  readonly name: string;
  readonly scheduledDate: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly accountId: string;
  readonly categoryId: string | null;
  readonly kind: V2TransactionKind;
  /** Scheduled before today in the rule's time zone, and still neither paid nor skipped. */
  readonly overdue: boolean;
}

export interface V2DueList {
  readonly items: readonly V2DueOccurrence[];
  /** True when more pending occurrences exist than the list returns. */
  readonly truncated: boolean;
}

/** A recorded occurrence: `settled` posted one Generated Transaction, `skipped` posted none. */
export interface V2RecordedOccurrence {
  readonly ruleId: string;
  readonly scheduledDate: string;
  readonly status: "settled" | "skipped";
  readonly transactionId: string | null;
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

export interface V2HomeOverviewBuckets {
  readonly openingBalanceMinor: number;
  readonly buckets: readonly {
    readonly date: string;
    readonly deltaMinor: number;
    readonly incomeMinor: number;
    readonly expenseMinor: number;
  }[];
}

export interface V2Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

export interface V2TransactionCurrencyTotal {
  readonly currency: string;
  readonly count: number;
  readonly incomeMinor: number;
  readonly expenseMinor: number;
  readonly netMinor: number;
}

/** Aggregates over every Transaction matching a list filter, independent of paging. */
export interface V2TransactionSummary {
  readonly count: number;
  readonly totals: readonly V2TransactionCurrencyTotal[];
}

export interface V2Budget {
  readonly id: string;
  readonly ledgerId: string;
  readonly currency: string;
  readonly activationPeriodStart: string;
  /** The Ledger Date (Asia/Dubai) the budget was activated on; may be after `activationPeriodStart`. */
  readonly activatedOn: string;
  readonly usualSalaryMinor: number | null;
  readonly paydayReminder: boolean;
  readonly defaultAccountId: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface V2Envelope {
  readonly id: string;
  readonly name: string;
  readonly group: V2EnvelopeGroup;
  readonly startFresh: boolean;
  readonly targetMinor: number | null;
  readonly dueDate: string | null;
  readonly repeat: V2EnvelopeRepeat | null;
  readonly archived: boolean;
  readonly sortOrder: number;
  readonly categoryIds: readonly string[];
  readonly version: number;
  /**
   * Saving-for envelopes with a target and due date only: what to set aside each
   * payday, counting the envelope's current Left as already set aside, and how
   * many paydays that spreads over.
   */
  readonly savingPerPaydayMinor?: number;
  readonly paydaysLeft?: number;
  /** Present when the due date falls before the next payday and Left < target. */
  readonly shortBeforePaydayMinor?: number;
}

export interface V2BudgetPeriod {
  readonly start: string;
  readonly end: string;
}

export interface V2EnvelopeTotals {
  readonly id: string;
  /** Net of every assignment into the envelope in the period (plan, cover, move, leftover, repeat). */
  readonly plannedMinor: number;
  /** Net of the `plan` and `repeat` assignments only: what the plan set before money moved. */
  readonly budgetedMinor: number;
  readonly spentMinor: number;
  readonly rolloverMinor: number;
  readonly leftMinor: number;
}

export interface V2BudgetCurrent {
  readonly period: V2BudgetPeriod;
  /** Not planned yet (Unassigned Money); may be negative. */
  readonly unassignedMinor: number;
  readonly safeToSpendMinor: number;
  readonly perDayMinor: number;
  readonly daysLeft: number;
  readonly cardReserveMinor: number;
  readonly envelopes: readonly V2EnvelopeTotals[];
}

/** One budget in `GET /budgets`: which currency it plans, and its Safe to spend today. */
export interface V2BudgetSummary {
  readonly id: string;
  readonly currency: string;
  readonly activatedOn: string;
  readonly period: V2BudgetPeriod;
  readonly safeToSpendMinor: number;
}

/** `GET /budgets`: the ledger's budgets, oldest first, bounded. */
export interface V2BudgetList {
  readonly items: readonly V2BudgetSummary[];
  /** True when the ledger has more budgets than the list returns. */
  readonly truncated: boolean;
}

/** `GET /budget`. Envelopes are the active ones, in sort order. */
export type V2BudgetView =
  | { readonly budget: null }
  | {
      readonly budget: V2Budget;
      readonly paydayRule: V2PaydayRule;
      readonly fundingAccountIds: readonly string[];
      readonly envelopes: readonly V2Envelope[];
      readonly current: V2BudgetCurrent;
    };

/** `POST /budget/envelopes`: the refreshed budget plus the new envelope's id. */
export type V2EnvelopeCreated = Extract<V2BudgetView, { readonly budget: object }> & {
  readonly envelopeId: string;
};

/** One recent money move, with who made it (H3 "who" lines). */
export interface V2BudgetActivityItem {
  readonly id: string;
  readonly periodStart: string;
  /** Null side is Not planned yet. */
  readonly fromEnvelopeId: string | null;
  readonly fromName: string | null;
  readonly toEnvelopeId: string | null;
  readonly toName: string | null;
  readonly amountMinor: number;
  readonly reason: V2AssignmentReason;
  /** The person (user id) or guest session that made the move. */
  readonly createdBy: string;
  /** Display name when the person has an identity; null for guests. */
  readonly createdByName: string | null;
  readonly createdAt: string;
}

/** `GET /budget/activity`: newest first, bounded by `limit`. */
export interface V2BudgetActivity {
  readonly items: readonly V2BudgetActivityItem[];
}

/** `POST /budget/envelopes/:id/pay`: the refreshed budget plus the expense Transaction. */
export type V2EnvelopePaid = Extract<V2BudgetView, { readonly budget: object }> & {
  readonly transactionId: string;
};

/** `GET /budget/periods/:start`: per-envelope totals for one period since activation. */
export interface V2BudgetPeriodView {
  readonly period: V2BudgetPeriod;
  readonly envelopes: readonly V2EnvelopeTotals[];
}

/** `GET /budget/setup-facts?currency=`: one currency's facts the setup flow previews the plan with. */
export interface V2BudgetSetupFacts {
  readonly today: string;
  readonly period: V2BudgetPeriod;
  /** Active accounts in the currency, with balances counting transactions dated on or before today. */
  readonly accountBalances: readonly {
    readonly accountId: string;
    readonly balanceMinor: number;
  }[];
  /**
   * Expenses in the currency dated from the period start through today. `onCard` marks credit-card
   * accounts (archived ones included): the engine reserves EVERY card expense, mapped or not.
   */
  readonly spendSincePeriodStart: readonly {
    readonly categoryId: string | null;
    readonly accountId: string;
    readonly amountMinor: number;
    readonly onCard: boolean;
  }[];
  /**
   * What the credit cards in the currency owed just before the period start (never below 0): the engine's
   * `openingCardDebtMinor` if the budget is activated in this period.
   */
  readonly openingCardDebtMinor: number;
  /** Transfers in the currency into credit-card accounts dated from the period start through today. */
  readonly cardPaymentsSincePeriodStart: readonly {
    readonly fromAccountId: string;
    readonly toAccountId: string;
    readonly amountMinor: number;
  }[];
  readonly lastPeriod: V2BudgetPeriod;
  readonly lastPeriodSpend: readonly {
    readonly categoryId: string;
    readonly amountMinor: number;
  }[];
  readonly recurringExpenses: readonly {
    readonly ruleId: string;
    readonly name: string;
    readonly amountMinor: number;
    readonly currency: string;
    readonly categoryId: string | null;
    readonly frequency: V2RecurringFrequency;
    readonly intervalCount: number;
  }[];
  /** Non-archived expense Categories by number of expenses in the last 90 days. */
  readonly topCategories: readonly {
    readonly categoryId: string;
    readonly name: string;
    readonly transactionCount: number;
  }[];
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
