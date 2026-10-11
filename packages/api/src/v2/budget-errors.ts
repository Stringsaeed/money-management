import { Schema } from "effect";

import { V2ApiError } from "./shared";

/**
 * Expected failures of the budget and bill-reminder programs. Each one names
 * what happened in budget words; `budget-http.ts` is the only place that turns
 * them into REST status codes, error codes, and messages.
 */

export class BudgetNotFound extends Schema.TaggedError<BudgetNotFound>()("BudgetNotFound", {}) {}

export class BudgetAlreadyActive extends Schema.TaggedError<BudgetAlreadyActive>()(
  "BudgetAlreadyActive",
  {},
) {}

/** The written plan would leave Not planned yet below zero; the write rolls back. */
export class BudgetOverplanned extends Schema.TaggedError<BudgetOverplanned>()(
  "BudgetOverplanned",
  {
    change: Schema.Literals(["activation", "envelope"]),
    unassignedMinor: Schema.Number,
  },
) {}

export class BudgetFundingInvalid extends Schema.TaggedError<BudgetFundingInvalid>()(
  "BudgetFundingInvalid",
  {
    accountId: Schema.String,
    reason: Schema.Literals(["missing", "currency", "credit_card"]),
  },
) {}

export class BudgetDefaultAccountInvalid extends Schema.TaggedError<BudgetDefaultAccountInvalid>()(
  "BudgetDefaultAccountInvalid",
  { accountId: Schema.String },
) {}

export class BudgetAccountInvalid extends Schema.TaggedError<BudgetAccountInvalid>()(
  "BudgetAccountInvalid",
  {},
) {}

export class BudgetCategoryInvalid extends Schema.TaggedError<BudgetCategoryInvalid>()(
  "BudgetCategoryInvalid",
  { categoryId: Schema.String },
) {}

export class BudgetCategoryDuplicate extends Schema.TaggedError<BudgetCategoryDuplicate>()(
  "BudgetCategoryDuplicate",
  { categoryId: Schema.String },
) {}

export class CategoryAlreadyMapped extends Schema.TaggedError<CategoryAlreadyMapped>()(
  "CategoryAlreadyMapped",
  { categoryId: Schema.String, envelopeId: Schema.String },
) {}

/** Plan changes belong to household admins (#365 decision 8). */
export class BudgetRoleForbidden extends Schema.TaggedError<BudgetRoleForbidden>()(
  "BudgetRoleForbidden",
  {},
) {}

/** The budget row a write just stored could not be read back. */
export class BudgetNotSaved extends Schema.TaggedError<BudgetNotSaved>()("BudgetNotSaved", {
  operation: Schema.Literals(["activation", "update"]),
}) {}

export class VersionConflict extends Schema.TaggedError<VersionConflict>()("VersionConflict", {
  entityId: Schema.String,
  expectedVersion: Schema.Number,
  actualVersion: Schema.Number,
}) {}

/** `item` is an id named inside an assignment item; `path` is the id in the URL. */
export class EnvelopeNotFound extends Schema.TaggedError<EnvelopeNotFound>()("EnvelopeNotFound", {
  envelopeId: Schema.String,
  source: Schema.Literals(["path", "item"]),
}) {}

export class EnvelopeArchived extends Schema.TaggedError<EnvelopeArchived>()(
  "EnvelopeArchived",
  {},
) {}

export class EnvelopeNotSavingFor extends Schema.TaggedError<EnvelopeNotSavingFor>()(
  "EnvelopeNotSavingFor",
  {},
) {}

export class EnvelopeCategoryMissing extends Schema.TaggedError<EnvelopeCategoryMissing>()(
  "EnvelopeCategoryMissing",
  {},
) {}

export class EnvelopeSavingFieldsInvalid extends Schema.TaggedError<EnvelopeSavingFieldsInvalid>()(
  "EnvelopeSavingFieldsInvalid",
  {},
) {}

export class InsufficientFunds extends Schema.TaggedError<InsufficientFunds>()(
  "InsufficientFunds",
  { index: Schema.Number, availableMinor: Schema.Number },
) {}

/** A future period is funded from Not planned yet only. */
export class InvalidFutureSource extends Schema.TaggedError<InvalidFutureSource>()(
  "InvalidFutureSource",
  { index: Schema.Number },
) {}

export class InvalidPeriodStart extends Schema.TaggedError<InvalidPeriodStart>()(
  "InvalidPeriodStart",
  { periodStart: Schema.String },
) {}

export class PeriodNotFound extends Schema.TaggedError<PeriodNotFound>()("PeriodNotFound", {}) {}

export class ActivityLimitInvalid extends Schema.TaggedError<ActivityLimitInvalid>()(
  "ActivityLimitInvalid",
  { maxLimit: Schema.Number },
) {}

export class RecurringRuleNotFound extends Schema.TaggedError<RecurringRuleNotFound>()(
  "RecurringRuleNotFound",
  {},
) {}

/** Mark paid and Skip apply to `remind` rules only (#372). */
export class RecurringRuleAutoPosts extends Schema.TaggedError<RecurringRuleAutoPosts>()(
  "RecurringRuleAutoPosts",
  {},
) {}

export class RecurringRuleInactive extends Schema.TaggedError<RecurringRuleInactive>()(
  "RecurringRuleInactive",
  {},
) {}

export class OccurrenceAlreadyRecorded extends Schema.TaggedError<OccurrenceAlreadyRecorded>()(
  "OccurrenceAlreadyRecorded",
  { status: Schema.Literals(["settled", "skipped"]) },
) {}

export class OccurrenceNotScheduled extends Schema.TaggedError<OccurrenceNotScheduled>()(
  "OccurrenceNotScheduled",
  {},
) {}

export class TransferSameAccount extends Schema.TaggedError<TransferSameAccount>()(
  "TransferSameAccount",
  {},
) {}

export class DueHorizonExceeded extends Schema.TaggedError<DueHorizonExceeded>()(
  "DueHorizonExceeded",
  { horizonDays: Schema.Number },
) {}

/**
 * A rule of the Hono V2 ledger code the budget reuses (ledger mutation
 * preflight, Transaction and Recurring Rule validation, money range) refused
 * the request. Its own status, code, and message pass through unchanged.
 */
export class LedgerRefused extends Schema.TaggedError<LedgerRefused>()("LedgerRefused", {
  refusal: Schema.instanceOf(V2ApiError),
}) {}

/** The database failed a budget read or write; the request answers 500. */
export class BudgetStoreError extends Schema.TaggedError<BudgetStoreError>()("BudgetStoreError", {
  operation: Schema.String,
  cause: Schema.Defect(),
}) {}

/** Maps a failure of wrapped V2 code: its own refusals pass through, the rest is a store failure. */
export function storeFailure(operation: string) {
  return (cause: unknown): LedgerRefused | BudgetStoreError =>
    cause instanceof V2ApiError
      ? new LedgerRefused({ refusal: cause })
      : new BudgetStoreError({ operation, cause });
}

export type BudgetFailure =
  | BudgetNotFound
  | BudgetAlreadyActive
  | BudgetOverplanned
  | BudgetFundingInvalid
  | BudgetDefaultAccountInvalid
  | BudgetAccountInvalid
  | BudgetCategoryInvalid
  | BudgetCategoryDuplicate
  | CategoryAlreadyMapped
  | BudgetRoleForbidden
  | BudgetNotSaved
  | VersionConflict
  | EnvelopeNotFound
  | EnvelopeArchived
  | EnvelopeNotSavingFor
  | EnvelopeCategoryMissing
  | EnvelopeSavingFieldsInvalid
  | InsufficientFunds
  | InvalidFutureSource
  | InvalidPeriodStart
  | PeriodNotFound
  | ActivityLimitInvalid
  | RecurringRuleNotFound
  | RecurringRuleAutoPosts
  | RecurringRuleInactive
  | OccurrenceAlreadyRecorded
  | OccurrenceNotScheduled
  | TransferSameAccount
  | DueHorizonExceeded
  | LedgerRefused
  | BudgetStoreError;
