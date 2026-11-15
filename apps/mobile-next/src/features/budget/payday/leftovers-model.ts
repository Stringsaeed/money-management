import type {
  V2AssignmentsCreateInput,
  V2Envelope,
  V2EnvelopeTotals,
} from "@trove/api/v2/contracts";

/** The server takes at most this many items in one batch. */
const MAX_BATCH_ITEMS = 50;

/** The part of an envelope line the leftovers maths reads. */
export interface LeftoverSource {
  readonly envelope: Pick<V2Envelope, "id" | "name" | "group">;
  readonly totals: Pick<V2EnvelopeTotals, "rolloverMinor" | "leftMinor">;
}

export type LeftoverChoice =
  /** Default: the money stays in the same envelopes. Nothing is written. */
  | { readonly kind: "keep" }
  /** Everything rolled over goes to one Saving for envelope. */
  | { readonly kind: "saving"; readonly envelopeId: string }
  /** Everything rolled over goes back to Not planned yet, to plan this month. */
  | { readonly kind: "plan" };

export interface LeftoverLine {
  readonly envelopeId: string;
  readonly name: string;
  /** What this envelope can give up: its rollover, but never more than it has Left now. */
  readonly amountMinor: number;
}

/** Sum of the rollover Everyday envelopes carry into this period; C2 is hidden when it is 0. */
export function leftoverTotal(lines: readonly LeftoverSource[]): number {
  return lines
    .filter((line) => line.envelope.group === "everyday")
    .reduce((total, line) => total + Math.max(line.totals.rolloverMinor, 0), 0);
}

/** Per Everyday envelope: its rollover, capped at its Left so a move never takes spent money. */
export function leftoverLines(lines: readonly LeftoverSource[]): LeftoverLine[] {
  return lines.flatMap(({ envelope, totals }) => {
    if (envelope.group !== "everyday") return [];
    const amountMinor = Math.min(Math.max(totals.rolloverMinor, 0), Math.max(totals.leftMinor, 0));
    return amountMinor > 0 ? [{ envelopeId: envelope.id, name: envelope.name, amountMinor }] : [];
  });
}

/** One `leftover` assignment per envelope, from it to the chosen place. `null` when nothing is written. */
export function leftoversInput(
  lines: readonly LeftoverLine[],
  choice: LeftoverChoice,
): V2AssignmentsCreateInput | null {
  if (choice.kind === "keep" || lines.length === 0) return null;
  const to = choice.kind === "saving" ? choice.envelopeId : null;
  return {
    items: lines.slice(0, MAX_BATCH_ITEMS).map((line) => ({
      fromEnvelopeId: line.envelopeId,
      toEnvelopeId: to,
      amountMinor: line.amountMinor,
      reason: "leftover" as const,
    })),
  };
}

export type LeftoverOption = LeftoverChoice["kind"];

/** The picked option as a choice; a Saving for pick with no envelope chosen keeps the money. */
export function leftoverChoice(option: LeftoverOption, savingId: string | null): LeftoverChoice {
  if (option === "saving" && savingId) return { kind: "saving", envelopeId: savingId };
  return option === "plan" ? { kind: "plan" } : { kind: "keep" };
}

export interface LeftoverShare {
  readonly envelopeId: string;
  readonly name: string;
  readonly rolloverMinor: number;
}

/** Each Everyday envelope's part of the leftover total, in envelope order; they add up to it. */
export function leftoverBreakdown(lines: readonly LeftoverSource[]): LeftoverShare[] {
  return lines.flatMap(({ envelope, totals }) =>
    envelope.group === "everyday" && totals.rolloverMinor > 0
      ? [{ envelopeId: envelope.id, name: envelope.name, rolloverMinor: totals.rolloverMinor }]
      : [],
  );
}
