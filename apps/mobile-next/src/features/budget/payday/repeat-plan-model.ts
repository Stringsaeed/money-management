import type {
  V2AssignmentsCreateInput,
  V2Envelope,
  V2EnvelopeTotals,
} from "@trove/api/v2/contracts";

export interface RepeatItem {
  readonly envelopeId: string;
  readonly name: string;
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
type RepeatTotals = Pick<V2EnvelopeTotals, "id" | "plannedMinor">;

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
 * Last month's plan again, only for what is missing: each envelope's target is what it planned in
 * the period just ended (Saving for with a target uses the recalculated per-payday amount), and
 * only the part above what this period already has is added. Expected income never counts.
 */
export function repeatPlan({
  envelopes,
  current,
  previous,
  unassignedMinor,
}: RepeatInputs): RepeatPlan {
  const plannedNow = new Map(current.map((totals) => [totals.id, totals.plannedMinor]));
  const plannedBefore = new Map(previous.map((totals) => [totals.id, totals.plannedMinor]));
  // No finished period means there is no "last month" to repeat.
  const items = (previous.length === 0 ? [] : [...envelopes]).flatMap((envelope) => {
    const target =
      envelope.group === "saving" && envelope.targetMinor !== null
        ? (envelope.savingPerPaydayMinor ?? plannedBefore.get(envelope.id) ?? 0)
        : (plannedBefore.get(envelope.id) ?? 0);
    const amountMinor = target - (plannedNow.get(envelope.id) ?? 0);
    return amountMinor > 0 ? [{ envelopeId: envelope.id, name: envelope.name, amountMinor }] : [];
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
