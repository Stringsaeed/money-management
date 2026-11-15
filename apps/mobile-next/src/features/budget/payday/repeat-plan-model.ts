import type {
  V2AssignmentsCreateInput,
  V2Envelope,
  V2EnvelopeGroup,
  V2EnvelopeTotals,
} from "@trove/api/v2/contracts";

export interface RepeatItem {
  readonly envelopeId: string;
  readonly name: string;
  readonly group: V2EnvelopeGroup;
  /** A Saving for envelope with a target: its per-payday amount, recalculated, not last month's. */
  readonly recalculated: boolean;
  /** What to add this period so the envelope matches last month's plan. */
  readonly amountMinor: number;
}

export interface RepeatPlan {
  readonly items: readonly RepeatItem[];
  readonly totalMinor: number;
  /** Money the batch can draw from: Not planned yet, never negative. */
  readonly availableMinor: number;
  /** How far the batch overshoots `availableMinor`; 0 when it fits. */
  readonly shortMinor: number;
  /** There is something to write and it fits. */
  readonly canRepeat: boolean;
}

type RepeatEnvelope = Pick<
  V2Envelope,
  "id" | "name" | "group" | "targetMinor" | "savingPerPaydayMinor"
>;
type RepeatTotals = Pick<V2EnvelopeTotals, "id" | "budgetedMinor">;

interface RepeatInputs {
  /** Active envelopes. */
  readonly envelopes: readonly RepeatEnvelope[];
  /** This period's totals. */
  readonly current: readonly RepeatTotals[];
  /** The period just ended; empty when there is none. */
  readonly previous: readonly RepeatTotals[];
  readonly unassignedMinor: number;
}

/**
 * Last month's plan again, only for what is missing: each envelope's target is what the plan set
 * in the period just ended (Saving for with a target uses the recalculated per-payday amount), and
 * only the part above what this period's plan already set is added. Both sides are `budgetedMinor`
 * (plan and repeat only), so leftovers, covers and moves are never refilled. Expected income never
 * counts.
 */
export function repeatPlan({
  envelopes,
  current,
  previous,
  unassignedMinor,
}: RepeatInputs): RepeatPlan {
  const plannedNow = new Map(current.map((totals) => [totals.id, totals.budgetedMinor]));
  const plannedBefore = new Map(previous.map((totals) => [totals.id, totals.budgetedMinor]));
  // No finished period means there is no "last month" to repeat.
  const items = (previous.length === 0 ? [] : [...envelopes]).flatMap((envelope) => {
    const recalculated =
      envelope.group === "saving" &&
      envelope.targetMinor !== null &&
      envelope.savingPerPaydayMinor !== undefined;
    const target = recalculated
      ? (envelope.savingPerPaydayMinor ?? 0)
      : (plannedBefore.get(envelope.id) ?? 0);
    const amountMinor = target - (plannedNow.get(envelope.id) ?? 0);
    return amountMinor > 0
      ? [
          {
            envelopeId: envelope.id,
            name: envelope.name,
            group: envelope.group,
            recalculated,
            amountMinor,
          },
        ]
      : [];
  });
  const totalMinor = items.reduce((total, item) => total + item.amountMinor, 0);
  const availableMinor = Math.max(unassignedMinor, 0);
  const shortMinor = Math.max(totalMinor - availableMinor, 0);
  return {
    items,
    totalMinor,
    availableMinor,
    shortMinor,
    canRepeat: totalMinor > 0 && shortMinor === 0,
  };
}

/** One atomic batch: every item comes from Not planned yet. */
export function repeatInput(plan: RepeatPlan): V2AssignmentsCreateInput {
  return {
    items: plan.items.map((item) => ({
      fromEnvelopeId: null,
      toEnvelopeId: item.envelopeId,
      amountMinor: item.amountMinor,
      reason: "repeat" as const,
    })),
  };
}

export interface RepeatGroup {
  readonly group: V2EnvelopeGroup;
  /** What Repeat adds to the group's envelopes. */
  readonly amountMinor: number;
  /** Some of it is a Saving for amount recalculated from its target. */
  readonly recalculated: boolean;
}

/** What Repeat adds per group, Bills, Everyday then Saving for; groups it leaves alone are skipped. */
export function repeatGroups(plan: RepeatPlan): RepeatGroup[] {
  const order: readonly V2EnvelopeGroup[] = ["bills", "everyday", "saving"];
  return order.flatMap((group) => {
    const items = plan.items.filter((item) => item.group === group);
    if (items.length === 0) return [];
    return [
      {
        group,
        amountMinor: items.reduce((total, item) => total + item.amountMinor, 0),
        recalculated: items.some((item) => item.recalculated),
      },
    ];
  });
}
