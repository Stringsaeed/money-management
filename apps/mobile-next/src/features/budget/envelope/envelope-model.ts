import { format, parseISO, subDays } from "date-fns";

import type {
  V2AssignmentsCreateInput,
  V2BudgetPeriod,
  V2Category,
  V2PaydayRule,
} from "@trove/api/v2/contracts";
import { periodContaining } from "@trove/domain/budget";

import { ApiError } from "@/data/http";

import type { ActiveBudgetView } from "../home/home-model";

const WHOLE_UNIT_MINOR = 100;

/** "about AED 47.00 a day": what is left spread over the days to go, floored to whole AED. */
export function paceMinor(leftMinor: number, daysLeft: number): number {
  if (leftMinor <= 0 || daysLeft <= 0) return 0;
  return Math.floor(leftMinor / daysLeft / WHOLE_UNIT_MINOR) * WHOLE_UNIT_MINOR;
}

export type PlanChange =
  | { readonly kind: "same" }
  | { readonly kind: "ok"; readonly input: V2AssignmentsCreateInput }
  /** More than Not planned yet can give. */
  | { readonly kind: "over_unplanned"; readonly maxPlannedMinor: number }
  /** Lowering would take back money already spent. */
  | { readonly kind: "below_spent"; readonly minPlannedMinor: number };

interface PlanChangeInput {
  readonly envelopeId: string;
  readonly plannedMinor: number;
  readonly leftMinor: number;
  readonly unassignedMinor: number;
  readonly nextPlannedMinor: number;
}

/**
 * Changing the plan never rewrites history: it moves the difference between the envelope and Not
 * planned yet as one `plan` assignment. The limits are the server's: an envelope gives back at most
 * what is Left, and Not planned yet gives at most what is not planned.
 */
export function planChange(input: PlanChangeInput): PlanChange {
  const { envelopeId, plannedMinor, leftMinor, unassignedMinor, nextPlannedMinor } = input;
  const delta = nextPlannedMinor - plannedMinor;
  if (delta === 0) return { kind: "same" };
  if (delta > 0) {
    const maxPlannedMinor = plannedMinor + Math.max(unassignedMinor, 0);
    if (nextPlannedMinor > maxPlannedMinor) return { kind: "over_unplanned", maxPlannedMinor };
    return {
      kind: "ok",
      input: {
        items: [
          { fromEnvelopeId: null, toEnvelopeId: envelopeId, amountMinor: delta, reason: "plan" },
        ],
      },
    };
  }
  const minPlannedMinor = plannedMinor - Math.max(leftMinor, 0);
  if (nextPlannedMinor < minPlannedMinor) return { kind: "below_spent", minPlannedMinor };
  return {
    kind: "ok",
    input: {
      items: [
        { fromEnvelopeId: envelopeId, toEnvelopeId: null, amountMinor: -delta, reason: "plan" },
      ],
    },
  };
}

const dayBefore = (date: string) => format(subDays(parseISO(date), 1), "yyyy-MM-dd");

const HISTORY_LIMIT = 12;

/**
 * Start dates of the periods before the current one, newest first, down to the activation period.
 * `GET /budget` carries only the current payday rule, so after a payday change an old start may not
 * exist; the server then 404s that one and history leaves it out.
 */
export function historyStarts(
  rule: V2PaydayRule,
  currentStart: string,
  activationStart: string,
): string[] {
  const starts: string[] = [];
  let start = currentStart;
  while (starts.length < HISTORY_LIMIT && start > activationStart) {
    start = periodContaining(rule, dayBefore(start)).start;
    if (start < activationStart) break;
    starts.push(start);
  }
  return starts;
}

const shortDate = (date: string) => format(parseISO(date), "d MMM");

export const periodLabel = (period: V2BudgetPeriod) =>
  `${shortDate(period.start)} – ${shortDate(period.end)}`;

export interface CategoryChoice {
  readonly category: V2Category;
  /** Mapped to this envelope today. */
  readonly mapped: boolean;
}

/** Active expense Categories this envelope has or could take: its own plus those no envelope uses. */
export function categoryChoices(
  view: ActiveBudgetView,
  categories: readonly V2Category[],
  envelopeId: string,
): CategoryChoice[] {
  const own = new Set(view.envelopes.find((item) => item.id === envelopeId)?.categoryIds);
  const taken = new Set(
    view.envelopes.filter((item) => item.id !== envelopeId).flatMap((item) => item.categoryIds),
  );
  return categories
    .filter((category) => category.kind === "expense" && !category.archived)
    .filter((category) => own.has(category.id) || !taken.has(category.id))
    .map((category) => ({ category, mapped: own.has(category.id) }))
    .toSorted((a, b) => a.category.name.localeCompare(b.category.name));
}

/** Plain-language failure copy for envelope writes. Nothing changed when one of these shows. */
export function writeErrorMessage(cause: unknown): string {
  if (cause instanceof ApiError) {
    switch (cause.code) {
      case "network_error":
        return "You're offline. Nothing was changed.";
      case "insufficient_funds":
        return "There isn't enough money there any more. Nothing was changed, so check the numbers and try again.";
      case "budget_overplanned":
        return "That plans more than you have. Nothing was changed.";
      case "category_already_mapped":
        return "Another envelope already uses one of those categories. Nothing was changed.";
      case "version_conflict":
        return "This envelope changed somewhere else. Nothing was changed, so try again.";
      case "envelope_archived":
        return "This envelope was archived. Nothing was changed.";
      default:
        break;
    }
  }
  return "Couldn't save that. Nothing was changed, so try again.";
}
