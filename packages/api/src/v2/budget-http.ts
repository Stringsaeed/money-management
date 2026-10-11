import { Cause, Effect, Exit, Layer, Match, Option } from "effect";

import type { BudgetFailure, BudgetStoreError } from "./budget-errors";
import { budgetStoresLayer, type BudgetStores } from "./budget-mutation";
import { BudgetClock, BudgetLedger, BudgetSelection, LedgerDb } from "./budget-services";
import { V2ApiError, type V2LedgerContext } from "./shared";

/** Every service a budget route program may require; `runBudgetRoute` supplies them all. */
export type BudgetServices = BudgetStores | BudgetLedger | BudgetClock | BudgetSelection | LedgerDb;

/**
 * The one boundary between the Hono V2 routes and the budget Effect programs.
 * It supplies the request's ledger, clock, budget selection (`?currency=`),
 * and stores, runs the program, and
 * answers with its value or throws the `V2ApiError` its failure maps to, so the
 * routes' existing error handler renders the same REST error as before. A
 * defect (an unexpected throw) is rethrown as it was, which the handler
 * renders as 500 `internal_error` (or 422 for a request validation error).
 */
export async function runBudgetRoute<A>(
  ledger: V2LedgerContext,
  now: Date,
  program: Effect.Effect<A, BudgetFailure, BudgetServices>,
  currency?: string,
): Promise<A> {
  const services = budgetStoresLayer.pipe(
    Layer.provideMerge(
      Layer.mergeAll(
        Layer.succeed(BudgetLedger, ledger),
        Layer.succeed(LedgerDb, ledger.db),
        BudgetClock.layer(now),
        Layer.succeed(BudgetSelection, { currency }),
      ),
    ),
  );
  const exit = await Effect.runPromiseExit(program.pipe(Effect.provide(services)));
  if (Exit.isSuccess(exit)) return exit.value;
  const failure = Cause.findErrorOption(exit.cause);
  if (Option.isNone(failure)) throw Cause.squash(exit.cause);
  // A database failure is logged by the route handler and answers 500 `internal_error`.
  throw failure.value._tag === "BudgetStoreError"
    ? failure.value.cause
    : httpFailure(failure.value);
}

/** Status, code, message, and details of each budget failure: the REST contract. */
export function httpFailure(error: Exclude<BudgetFailure, BudgetStoreError>): V2ApiError {
  return Match.valueTags(error, {
    BudgetNotFound: ({ currency }) =>
      new V2ApiError(
        404,
        "budget_not_found",
        currency ? `This ledger has no ${currency} budget.` : "This ledger has no budget.",
      ),
    BudgetCurrencyRequired: () =>
      new V2ApiError(
        422,
        "budget_currency_required",
        "This ledger has a budget in more than one currency. Say which one with currency.",
      ),
    BudgetAlreadyActive: ({ currency }) =>
      new V2ApiError(409, "budget_already_active", `This ledger already has a ${currency} budget.`),
    BudgetCurrencyMismatch: ({ accountId, budgetCurrency }) =>
      new V2ApiError(
        422,
        "budget_currency_mismatch",
        `This account is in another currency. Pick a ${budgetCurrency} account for this budget.`,
        { accountId, budgetCurrency },
      ),
    BudgetOverplanned: ({ change, unassignedMinor }) =>
      new V2ApiError(
        409,
        "budget_overplanned",
        change === "activation"
          ? "The plan uses more money than you have. Lower some amounts and try again."
          : "That plan uses more money than is not planned yet. Lower the amount and try again.",
        { unassignedMinor },
      ),
    BudgetFundingInvalid: ({ accountId, reason }) =>
      new V2ApiError(422, "budget_funding_invalid", FUNDING_MESSAGES[reason], { accountId }),
    BudgetDefaultAccountInvalid: ({ accountId }) =>
      new V2ApiError(
        422,
        "budget_default_account_invalid",
        "Pick an active account as the default.",
        { accountId },
      ),
    BudgetCategoryInvalid: ({ categoryId }) =>
      new V2ApiError(
        422,
        "budget_category_invalid",
        "An envelope's Category was not found or is not an active expense Category.",
        { categoryId },
      ),
    BudgetCategoryDuplicate: ({ categoryId }) =>
      new V2ApiError(
        422,
        "budget_category_duplicate",
        "Two envelopes use the same Category. Merge them into one envelope.",
        { categoryId },
      ),
    CategoryAlreadyMapped: ({ categoryId, envelopeId }) =>
      new V2ApiError(
        409,
        "category_already_mapped",
        "That Category already belongs to another envelope. Move it there or pick a different one.",
        { categoryId, envelopeId },
      ),
    BudgetRoleForbidden: () =>
      new V2ApiError(
        403,
        "budget_role_forbidden",
        "Only a household admin can change the budget plan. You can still add spending, move money, and mark bills paid.",
      ),
    BudgetNotSaved: ({ operation }) =>
      new V2ApiError(
        500,
        operation === "activation" ? "budget_activation_failed" : "budget_update_failed",
        "The budget was not saved.",
      ),
    VersionConflict: ({ entityId, expectedVersion, actualVersion }) =>
      new V2ApiError(412, "version_conflict", "The resource changed. Refresh and try again.", {
        entityId,
        expectedVersion,
        actualVersion,
      }),
    EnvelopeNotFound: ({ envelopeId, source }) =>
      source === "item"
        ? new V2ApiError(404, "envelope_not_found", "An envelope was not found.", { envelopeId })
        : new V2ApiError(404, "envelope_not_found", "This envelope was not found."),
    EnvelopeArchived: () => new V2ApiError(409, "envelope_archived", "This envelope is archived."),
    EnvelopeNotSavingFor: () =>
      new V2ApiError(
        422,
        "envelope_not_saving_for",
        "Only Saving-for envelopes can be marked paid.",
      ),
    EnvelopeCategoryMissing: () =>
      new V2ApiError(
        422,
        "envelope_category_missing",
        "This envelope has no Category to record the payment in. Pick one first.",
      ),
    EnvelopeSavingFieldsInvalid: () =>
      new V2ApiError(
        422,
        "envelope_saving_fields_invalid",
        "Only Saving-for envelopes have a target, due date, or repeat.",
      ),
    InsufficientFunds: ({ index, availableMinor }) =>
      new V2ApiError(409, "insufficient_funds", "There isn't enough to move. Lower the amount.", {
        index,
        availableMinor,
      }),
    InvalidFutureSource: ({ index }) =>
      new V2ApiError(
        422,
        "invalid_future_source",
        "An upcoming period can only be planned from Not planned yet.",
        { index },
      ),
    InvalidPeriodStart: ({ periodStart }) =>
      new V2ApiError(422, "invalid_period_start", "Pick the current period or an upcoming one.", {
        periodStart,
      }),
    PeriodNotFound: () =>
      new V2ApiError(404, "period_not_found", "This is not a period of your budget."),
    ActivityLimitInvalid: ({ maxLimit }) =>
      new V2ApiError(400, "invalid_limit", `limit must be between 1 and ${maxLimit}.`),
    RecurringRuleNotFound: () =>
      new V2ApiError(404, "recurring_rule_not_found", "Recurring Rule not found."),
    RecurringRuleAutoPosts: () =>
      new V2ApiError(
        409,
        "recurring_rule_auto_posts",
        "This Recurring Rule posts on its own. Switch it to reminders to mark it paid or skip it.",
      ),
    RecurringRuleInactive: () =>
      new V2ApiError(409, "recurring_rule_inactive", "This Recurring Rule is not active."),
    OccurrenceAlreadyRecorded: ({ status }) =>
      status === "settled"
        ? new V2ApiError(409, "occurrence_already_paid", "This bill is already marked paid.")
        : new V2ApiError(409, "occurrence_already_skipped", "This bill was already skipped."),
    OccurrenceNotScheduled: () =>
      new V2ApiError(
        422,
        "occurrence_not_scheduled",
        "This Recurring Rule has no pending occurrence on that date.",
      ),
    TransferSameAccount: () =>
      new V2ApiError(
        422,
        "transfer_same_account",
        "Pay a transfer from an Account other than its destination.",
      ),
    DueHorizonExceeded: ({ horizonDays }) =>
      new V2ApiError(
        422,
        "due_horizon_exceeded",
        `through must be within ${horizonDays} days of today.`,
      ),
    LedgerRefused: ({ refusal }) => refusal,
  });
}

const FUNDING_MESSAGES = {
  missing: "A funding account was not found.",
  credit_card: "A credit card can't fund a budget. Pick the accounts that hold your money.",
} as const;
