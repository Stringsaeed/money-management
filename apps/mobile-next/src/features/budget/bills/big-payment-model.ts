import { addMonths, format, parseISO } from "date-fns";

import {
  type V2EnvelopeCreateInput,
  type V2EnvelopePayInput,
  type V2EnvelopeRepeat,
  type V2PaydayRule,
} from "@trove/api/v2/contracts";
import { nextPeriodStart, paydaysLeft, savingPerPayday } from "@trove/domain/budget";

import { ApiError } from "@/data/http";
import { parseMoneyMinor } from "@/utils/money";

import { writeErrorMessage } from "../envelope/envelope-model";

export const REPEAT_OPTIONS = [
  "once",
  "every_3_months",
  "every_6_months",
  "yearly",
] as const satisfies readonly V2EnvelopeRepeat[];

export const REPEAT_LABELS = {
  once: "Once",
  every_3_months: "Every 3 months",
  every_6_months: "Every 6 months",
  yearly: "Yearly",
} as const satisfies Record<V2EnvelopeRepeat, string>;

const REPEAT_MONTHS = { every_3_months: 3, every_6_months: 6, yearly: 12 } as const;

/** The due date after paying this one, counted from the old due date; null for a one-off. */
export function nextDueDate(dueDate: string, repeat: V2EnvelopeRepeat | null): string | null {
  if (repeat === null || repeat === "once") return null;
  return format(addMonths(parseISO(dueDate), REPEAT_MONTHS[repeat]), "yyyy-MM-dd");
}

export interface SavingPreview {
  /** The target less what is already set aside, never below zero. */
  readonly stillNeededMinor: number;
  /** What to set aside each payday between now and the due date. */
  readonly perPaydayMinor: number;
  readonly paydaysLeft: number;
  /** The paydays from the next one through the due date (empty when it is due before payday). */
  readonly paydayDates: readonly string[];
  /** The due date falls before the next payday and not enough is set aside. */
  readonly shortBeforePaydayMinor: number | null;
}

/** Longest run of paydays listed; a monthly payday never needs more for a big payment. */
const MAX_PAYDAYS = 120;

/** The paydays from the one after `currentPeriodStart` through `dueDate`, as Ledger Dates. */
export function paydayDates(
  rule: V2PaydayRule,
  currentPeriodStart: string,
  dueDate: string,
): string[] {
  const dates: string[] = [];
  let start = nextPeriodStart(rule, currentPeriodStart);
  while (start <= dueDate && dates.length < MAX_PAYDAYS) {
    dates.push(start);
    start = nextPeriodStart(rule, start);
  }
  return dates;
}

/** The same numbers the server shows on the envelope, worked out before it exists. */
export function savingPreview(input: {
  readonly targetMinor: number;
  readonly setAsideMinor: number;
  readonly dueDate: string;
  readonly rule: V2PaydayRule;
  readonly currentPeriodStart: string;
}): SavingPreview {
  const goal = {
    targetMinor: input.targetMinor,
    setAsideMinor: input.setAsideMinor,
    dueDate: input.dueDate,
    rule: input.rule,
    currentPeriodStart: input.currentPeriodStart,
  };
  const dueBeforePayday = input.dueDate < nextPeriodStart(input.rule, input.currentPeriodStart);
  return {
    stillNeededMinor: Math.max(input.targetMinor - input.setAsideMinor, 0),
    perPaydayMinor: savingPerPayday(goal),
    paydaysLeft: paydaysLeft(goal),
    paydayDates: paydayDates(input.rule, input.currentPeriodStart, input.dueDate),
    shortBeforePaydayMinor:
      dueBeforePayday && input.setAsideMinor < input.targetMinor
        ? input.targetMinor - input.setAsideMinor
        : null,
  };
}

export interface BigPaymentDraft {
  readonly name: string;
  readonly amountText: string;
  readonly setAsideText: string;
  readonly dueDate: string;
  readonly repeat: V2EnvelopeRepeat;
}

/** The per-payday suggestion for what is typed so far, or null until it makes sense. */
export function previewDraft(
  draft: BigPaymentDraft,
  context: {
    readonly currency: string;
    readonly today: string;
    readonly rule: V2PaydayRule;
    readonly currentPeriodStart: string;
  },
): SavingPreview | null {
  const amounts = parseAmounts(draft, context.currency);
  if (!amounts.ok) return null;
  const { targetMinor, setAsideMinor } = amounts;
  if (draft.dueDate < context.today) return null;
  return savingPreview({
    targetMinor,
    setAsideMinor,
    dueDate: draft.dueDate,
    rule: context.rule,
    currentPeriodStart: context.currentPeriodStart,
  });
}

export type BigPaymentCheck =
  | {
      readonly ok: true;
      readonly targetMinor: number;
      readonly setAsideMinor: number;
      readonly input: V2EnvelopeCreateInput;
    }
  /** `message` is empty while the form is only unfinished; it is shown for real mistakes. */
  | { readonly ok: false; readonly message: string };

/** The amount and the set-aside as money, or what is wrong with them. */
function parseAmounts(
  draft: BigPaymentDraft,
  currency: string,
):
  | { readonly ok: true; readonly targetMinor: number; readonly setAsideMinor: number }
  | { readonly ok: false; readonly message: string } {
  const targetMinor = parseMoneyMinor(draft.amountText, currency);
  const setAsideMinor =
    draft.setAsideText.trim() === "" ? 0 : parseMoneyMinor(draft.setAsideText, currency);
  if (targetMinor === null || targetMinor <= 0) {
    return { ok: false, message: "How much needs an amount above zero, like 12000 or 350.50." };
  }
  if (setAsideMinor === null || setAsideMinor < 0) {
    return { ok: false, message: "Already set aside needs an amount like 0 or 2500." };
  }
  if (setAsideMinor > targetMinor) {
    return { ok: false, message: "Already set aside can't be more than the amount." };
  }
  return { ok: true, targetMinor, setAsideMinor };
}

/** B2: turns what was typed into the create request, or says what is missing. */
export function checkBigPayment(
  draft: BigPaymentDraft,
  context: { readonly currency: string; readonly today: string; readonly unassignedMinor: number },
): BigPaymentCheck {
  const name = draft.name.trim();
  if (name === "" || draft.amountText.trim() === "") return { ok: false, message: "" };
  const amounts = parseAmounts(draft, context.currency);
  if (!amounts.ok) return amounts;
  const { targetMinor, setAsideMinor } = amounts;
  if (draft.dueDate < context.today) {
    return { ok: false, message: "Pick a due date from today on." };
  }
  if (setAsideMinor > Math.max(context.unassignedMinor, 0)) {
    return { ok: false, message: "That's more than Not planned yet has. Lower what's set aside." };
  }
  return {
    ok: true,
    targetMinor,
    setAsideMinor,
    input: {
      name,
      group: "saving",
      newCategory: { name },
      plannedMinor: setAsideMinor,
      targetMinor,
      dueDate: draft.dueDate,
      repeat: draft.repeat,
    },
  };
}

/** B2 failure copy. An over-plan 409 says what to lower; the rest is the shared envelope copy. */
export function addBigPaymentErrorMessage(cause: unknown): string {
  if (cause instanceof ApiError && cause.code === "budget_overplanned") {
    return "That sets aside more than Not planned yet has. Nothing was added, so lower what's already set aside.";
  }
  return writeErrorMessage(cause);
}

export type PaymentCheck =
  | { readonly ok: true; readonly input: V2EnvelopePayInput }
  | { readonly ok: false; readonly message: string };

/**
 * B3: the amount, account and date become the pay request. The date stays inside the current
 * period and not after today, so the payment lowers this period's Left exactly as previewed.
 */
export function checkPayment(
  draft: {
    readonly amountText: string;
    readonly accountId: string | null;
    readonly date: string;
  },
  period: { readonly currency: string; readonly start: string; readonly today: string },
): PaymentCheck {
  const amountMinor = parseMoneyMinor(draft.amountText, period.currency);
  if (amountMinor === null || amountMinor <= 0) {
    return { ok: false, message: "Enter the amount you paid, like 12000 or 350.50." };
  }
  if (draft.accountId === null) {
    return { ok: false, message: "Pick the account you paid from." };
  }
  if (draft.date < period.start || draft.date > period.today) {
    return { ok: false, message: "Pick a day in this budget month, up to today." };
  }
  return { ok: true, input: { amountMinor, accountId: draft.accountId, date: draft.date } };
}

/** B3 failure copy. */
export function payErrorMessage(cause: unknown): string {
  if (cause instanceof ApiError) {
    switch (cause.code) {
      case "envelope_category_missing":
        return "This payment has no category to record the expense in. Add one from the envelope's menu. Nothing was saved.";
      case "envelope_not_saving_for":
        return "This envelope is no longer a big payment. Nothing was saved.";
      default:
        break;
    }
  }
  return writeErrorMessage(cause);
}
