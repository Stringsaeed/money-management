import type { V2AssignmentsCreateInput } from "@trove/api/v2/contracts";

import { parseMoneyMinor } from "@/utils/money";

/** The server takes at most this many items in one batch. */
export const MAX_ADJUST_ITEMS = 50;

/** The part of an envelope line that adjusting its plan reads. */
export interface AdjustLine {
  readonly envelopeId: string;
  readonly name: string;
  /** This period's plan, net of every assignment. */
  readonly plannedMinor: number;
  readonly leftMinor: number;
}

/** Typed amounts by envelope id; an envelope that is not here keeps its plan. */
export type AdjustDraft = Readonly<Record<string, string>>;

export type AdjustProblem =
  /** The amount can't be read as money. */
  | { readonly kind: "unreadable"; readonly name: string }
  /** Lower than what the envelope has already spent from this plan. */
  | { readonly kind: "below_spent"; readonly name: string; readonly minPlannedMinor: number }
  /** The new plans need more than Not planned yet has. */
  | { readonly kind: "over_unplanned"; readonly overMinor: number }
  | { readonly kind: "too_many" };

export interface AdjustResult {
  /** Not planned yet once the readable amounts are saved; may be negative. */
  readonly leftToPlanMinor: number;
  readonly problem: AdjustProblem | null;
  /** The batch to write; `null` when nothing changes or there is a problem. */
  readonly input: V2AssignmentsCreateInput | null;
}

type AdjustItem = V2AssignmentsCreateInput["items"][number];

/** One envelope's typed amount: no change, a problem, or the plan move and how far it moves. */
type LineChange =
  | { readonly kind: "same" }
  | { readonly kind: "problem"; readonly problem: AdjustProblem; readonly deltaMinor: number }
  | { readonly kind: "move"; readonly item: AdjustItem; readonly deltaMinor: number };

type ProblemChange = Extract<LineChange, { kind: "problem" }>;

/** The typed amount; empty reads as 0, unreadable or negative as `null`. */
function typedMinor(text: string, currency: string): number | null {
  const minor = text.trim() === "" ? 0 : parseMoneyMinor(text, currency);
  return minor === null || minor < 0 ? null : minor;
}

/** The rules Change plan uses for one envelope: up from Not planned yet, down to what is spent. */
function lineChange(line: AdjustLine, text: string, currency: string): LineChange {
  const next = typedMinor(text, currency);
  if (next === null) {
    return { kind: "problem", problem: { kind: "unreadable", name: line.name }, deltaMinor: 0 };
  }
  const deltaMinor = next - line.plannedMinor;
  if (deltaMinor === 0) return { kind: "same" };
  if (deltaMinor > 0) {
    const item = { fromEnvelopeId: null, toEnvelopeId: line.envelopeId, amountMinor: deltaMinor };
    return { kind: "move", item: { ...item, reason: "plan" }, deltaMinor };
  }
  const minPlannedMinor = line.plannedMinor - Math.max(line.leftMinor, 0);
  if (next < minPlannedMinor) {
    const problem = { kind: "below_spent", name: line.name, minPlannedMinor } as const;
    return { kind: "problem", problem, deltaMinor };
  }
  const item = { fromEnvelopeId: line.envelopeId, toEnvelopeId: null, amountMinor: -deltaMinor };
  return { kind: "move", item: { ...item, reason: "plan" }, deltaMinor };
}

/** A batch-wide problem once every line reads: more than there is to plan, or too many items. */
function batchProblem(netMinor: number, unassignedMinor: number, count: number) {
  const available = Math.max(unassignedMinor, 0);
  if (netMinor > available) {
    return { kind: "over_unplanned", overMinor: netMinor - available } as const;
  }
  return count > MAX_ADJUST_ITEMS ? ({ kind: "too_many" } as const) : null;
}

/**
 * Several plan changes as one batch, by the rules Change plan uses for one envelope: a plan can't
 * drop below what has been spent from it, and the increases (net of the decreases) can't take more
 * than Not planned yet has. Decreases come first so the money they free is there for the rest.
 */
export function checkAdjust(
  lines: readonly AdjustLine[],
  draft: AdjustDraft,
  currency: string,
  unassignedMinor: number,
): AdjustResult {
  const changes = lines.flatMap((line) => {
    const text = draft[line.envelopeId];
    return text === undefined ? [] : [lineChange(line, text, currency)];
  });
  const netMinor = changes.reduce(
    (total, change) => total + (change.kind === "same" ? 0 : change.deltaMinor),
    0,
  );
  const items = changes.flatMap((change) => (change.kind === "move" ? [change.item] : []));
  const ordered = [
    ...items.filter((item) => item.fromEnvelopeId !== null),
    ...items.filter((item) => item.fromEnvelopeId === null),
  ];
  const lineProblem =
    changes.find((change): change is ProblemChange => change.kind === "problem")?.problem ?? null;
  const problem = lineProblem ?? batchProblem(netMinor, unassignedMinor, ordered.length);
  return {
    leftToPlanMinor: unassignedMinor - netMinor,
    problem,
    input: problem || ordered.length === 0 ? null : { items: ordered },
  };
}
