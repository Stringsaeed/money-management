import type { V2BudgetActivityItem } from "@trove/api/v2/contracts";

/**
 * Kinds are listed highest priority first: Got paid, overspend, planned more than you have,
 * bills that could not load, due today, not planned, then household activity.
 */
export type AttentionItem =
  | {
      readonly kind: "payday";
      /** The first days of the period have passed with no salary logged. */
      readonly late: boolean;
      /** Today is the first day of the period. */
      readonly today: boolean;
    }
  | {
      readonly kind: "overspend";
      /** The most overspent envelope. */
      readonly id: string;
      readonly name: string;
      /** How many envelopes are below zero. */
      readonly count: number;
      /** Total overspent across those envelopes, positive. */
      readonly overMinor: number;
    }
  | {
      readonly kind: "short";
      /** How far Not planned yet is below zero, positive. */
      readonly shortMinor: number;
    }
  | { readonly kind: "due_error" }
  | {
      readonly kind: "due_today";
      readonly count: number;
      readonly totalMinor: number;
      /** The bill's name when exactly one is due. */
      readonly name: string | null;
    }
  | { readonly kind: "not_planned"; readonly amountMinor: number }
  | {
      readonly kind: "activity";
      /** The latest money move in the household budget today. */
      readonly item: V2BudgetActivityItem;
      /** Other moves made today. */
      readonly moreToday: number;
    };

export interface AttentionInputs {
  /** Every active envelope with its Left this period. */
  readonly envelopes: readonly {
    readonly id: string;
    readonly name: string;
    readonly leftMinor: number;
  }[];
  readonly unassignedMinor: number;
  /** True on or after payday while the salary is unlogged. */
  readonly paydayPending?: boolean;
  /** With `paydayPending`: the salary is late, not just new. */
  readonly paydayLate?: boolean;
  /** With `paydayPending`: today is payday itself. */
  readonly paydayToday?: boolean;
  /** Bills due today plus overdue ones. */
  readonly dueToday?: {
    readonly count: number;
    readonly totalMinor: number;
    readonly name: string | null;
  };
  /** The Due list could not be read: never shown as "nothing due". */
  readonly dueError?: boolean;
  /** Today's household money moves, newest first. Empty in a Personal budget. */
  readonly activityToday?: readonly V2BudgetActivityItem[];
}

export interface Attention {
  readonly top: AttentionItem | null;
  /** The item right behind the top one, named on the slot's "+N more" line. */
  readonly next: AttentionItem | null;
  /** Other attention items beyond the top one. */
  readonly moreCount: number;
}

function overspendItem(envelopes: AttentionInputs["envelopes"]): AttentionItem | null {
  const over = envelopes.filter((envelope) => envelope.leftMinor < 0);
  const worst = over.reduce<(typeof over)[number] | null>(
    (current, envelope) =>
      current === null || envelope.leftMinor < current.leftMinor ? envelope : current,
    null,
  );
  if (!worst) return null;
  return {
    kind: "overspend",
    id: worst.id,
    name: worst.name,
    count: over.length,
    overMinor: over.reduce((total, envelope) => total - envelope.leftMinor, 0),
  };
}

function paydayItem(inputs: AttentionInputs): AttentionItem | null {
  if (!inputs.paydayPending) return null;
  return { kind: "payday", late: inputs.paydayLate ?? false, today: inputs.paydayToday ?? false };
}

function dueItem(inputs: AttentionInputs): AttentionItem | null {
  if (inputs.dueError) return { kind: "due_error" };
  const due = inputs.dueToday;
  if (!due || due.count <= 0) return null;
  return { kind: "due_today", count: due.count, totalMinor: due.totalMinor, name: due.name };
}

function activityItem(items: AttentionInputs["activityToday"]): AttentionItem | null {
  const [latest, ...rest] = items ?? [];
  return latest ? { kind: "activity", item: latest, moreToday: rest.length } : null;
}

/** Every attention item that applies, in priority order. */
export function attentionItems(inputs: AttentionInputs): AttentionItem[] {
  const { unassignedMinor } = inputs;
  const short: AttentionItem | null =
    unassignedMinor < 0 ? { kind: "short", shortMinor: -unassignedMinor } : null;
  const notPlanned: AttentionItem | null =
    unassignedMinor > 0 ? { kind: "not_planned", amountMinor: unassignedMinor } : null;
  return [
    paydayItem(inputs),
    overspendItem(inputs.envelopes),
    short,
    dueItem(inputs),
    notPlanned,
    activityItem(inputs.activityToday),
  ].flatMap((item) => item ?? []);
}

export function pickAttention(inputs: AttentionInputs): Attention {
  const [top = null, next = null, ...rest] = attentionItems(inputs);
  return { top, next, moreCount: (next ? 1 : 0) + rest.length };
}
