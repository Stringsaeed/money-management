import { addDays, format, parseISO } from "date-fns";
import type { V2Category, V2RecurringRule } from "@trove/api/v2/contracts";

import type { UpcomingOccurrence } from "@/data/ledger-schemas";
import { billStatus } from "@/features/budget/bills/bills-model";
import type { ActiveBudgetView } from "@/features/budget/home/home-model";
import { dueInLabel, nextUpcomingIndex } from "@/ui/trove";

import { compactAmount } from "./home-money";
import { signedMinor } from "./home-display";

/** Home shows the nearest few; "See all" opens the full list. */
export const HOME_UPCOMING_LIMIT = 3;

export interface HomeUpcomingItem {
  readonly key: string;
  readonly ruleId: string;
  /** `yyyy-MM-dd`. */
  readonly date: string;
  readonly title: string;
  /** The Category's emoji, printed before the title. */
  readonly emoji: string | null;
  /** Mono caption, e.g. `TODAY · BILLS · READY` or `IN 7 DAYS · SHORT 75`. */
  readonly meta: string;
  /** The bill's envelope holds less than the bill: the caption takes the warning tone. */
  readonly short: boolean;
  /** Signed minor units: bills negative, money in positive. */
  readonly minor: number;
  readonly kind: UpcomingOccurrence["kind"];
  /** The next item due: its date band takes the highlighter. */
  readonly next: boolean;
}

export interface HomeUpcomingInput {
  readonly occurrences: readonly UpcomingOccurrence[];
  readonly rules: readonly V2RecurringRule[];
  readonly categories: readonly V2Category[];
  readonly currency: string;
  readonly today: string;
  /** The active budget, when there is one: bills then read as ready or short. */
  readonly budget: ActiveBudgetView | null;
}

export interface HomeUpcoming {
  readonly items: readonly HomeUpcomingItem[];
  /** Bills (money out) due from today through a week out: the bell's badge. */
  readonly dueThisWeek: number;
}

export function homeUpcoming({
  occurrences,
  rules,
  categories,
  currency,
  today,
  budget,
}: HomeUpcomingInput): HomeUpcoming {
  const ruleById = new Map(rules.map((rule) => [rule.id, rule]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  // The board counts a bill "IN 7 DAYS" as this week, so the window runs through today + 7.
  const weekEnd = format(addDays(parseISO(today), 7), "yyyy-MM-dd");
  // `filter` returns a copy, so sorting in place is safe (Hermes has no Array#toSorted).
  const rows = occurrences
    .filter((occurrence) => occurrence.currency === currency && ruleById.has(occurrence.ruleId))
    .sort((left, right) => left.scheduledDate.localeCompare(right.scheduledDate));
  const dueThisWeek = rows.filter(
    (row) => row.kind === "expense" && row.scheduledDate >= today && row.scheduledDate <= weekEnd,
  ).length;
  const shown = rows.slice(0, HOME_UPCOMING_LIMIT);
  const nextIndex = nextUpcomingIndex(
    shown.map((row) => row.scheduledDate),
    today,
  );
  const items = shown.map((occurrence, index) => {
    const rule = ruleById.get(occurrence.ruleId);
    const category = rule?.categoryId ? categoryById.get(rule.categoryId) : undefined;
    const status = billCaption(occurrence, rule?.categoryId ?? null, budget, currency);
    return {
      key: `${occurrence.ruleId}:${occurrence.scheduledDate}`,
      ruleId: occurrence.ruleId,
      date: occurrence.scheduledDate,
      title: rule?.name ?? "",
      emoji: category?.icon ?? null,
      meta: `${dueInLabel(occurrence.scheduledDate, today)} · ${status.caption}`,
      short: status.short,
      minor: signedMinor(occurrence.kind, occurrence.amountMinor),
      kind: occurrence.kind,
      next: index === nextIndex,
    };
  });
  return { items, dueThisWeek };
}

interface BillCaption {
  readonly caption: string;
  readonly short: boolean;
}

const RECURRING: BillCaption = { caption: "RECURRING", short: false };

/**
 * A bill whose Category feeds a bills envelope reads against that envelope this period:
 * `BILLS · READY`, `BILLS · PAID`, or `SHORT 75` when the envelope holds less than the bill.
 */
function billCaption(
  occurrence: UpcomingOccurrence,
  categoryId: string | null,
  budget: ActiveBudgetView | null,
  currency: string,
): BillCaption {
  const totals = billEnvelopeTotals(occurrence, categoryId, budget);
  if (!totals) return RECURRING;
  const status = billStatus(totals, occurrence.amountMinor);
  switch (status.kind) {
    case "short":
      return { caption: `SHORT ${compactAmount(status.shortMinor, currency)}`, short: true };
    case "paid":
      return { caption: "BILLS · PAID", short: false };
    case "unplanned":
      return { caption: "BILLS · NOT PLANNED", short: false };
    case "ready":
      return { caption: "BILLS · READY", short: false };
  }
}

/** This period's totals for the bills envelope a bill's Category feeds, when it is due this period. */
function billEnvelopeTotals(
  occurrence: UpcomingOccurrence,
  categoryId: string | null,
  budget: ActiveBudgetView | null,
) {
  if (!budget || !categoryId || occurrence.kind !== "expense") return undefined;
  if (occurrence.scheduledDate > budget.current.period.end) return undefined;
  const envelope = budget.envelopes.find(
    (candidate) =>
      candidate.group === "bills" &&
      !candidate.archived &&
      candidate.categoryIds.includes(categoryId),
  );
  return envelope
    ? budget.current.envelopes.find((candidate) => candidate.id === envelope.id)
    : undefined;
}
