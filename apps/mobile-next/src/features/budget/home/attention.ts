/** Kinds are listed highest priority first: Got paid, overspend, due today, not planned. */
export type AttentionItem =
  | {
      readonly kind: "payday";
      /** The first days of the period have passed with no salary logged. */
      readonly late: boolean;
    }
  | {
      readonly kind: "overspend";
      /** The most overspent envelope's name. */
      readonly name: string;
      /** How many envelopes are below zero. */
      readonly count: number;
      /** Total overspent across those envelopes, positive. */
      readonly overMinor: number;
    }
  | { readonly kind: "due_today"; readonly count: number }
  | { readonly kind: "not_planned"; readonly amountMinor: number };

export interface AttentionInputs {
  /** Every active envelope with its Left this period. */
  readonly envelopes: readonly { readonly name: string; readonly leftMinor: number }[];
  readonly unassignedMinor: number;
  /** True on or after payday while the salary is unlogged. */
  readonly paydayPending?: boolean;
  /** With `paydayPending`: the salary is late, not just new. */
  readonly paydayLate?: boolean;
  /** Plugs in with Due & reminders: how many bills are due today. */
  readonly dueTodayCount?: number;
}

export interface Attention {
  readonly top: AttentionItem | null;
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
    name: worst.name,
    count: over.length,
    overMinor: over.reduce((total, envelope) => total - envelope.leftMinor, 0),
  };
}

/** Every attention item that applies, in priority order. */
export function attentionItems(inputs: AttentionInputs): AttentionItem[] {
  const payday: AttentionItem | null = inputs.paydayPending ? { kind: "payday", late: inputs.paydayLate ?? false } : null;
  const dueToday: AttentionItem | null =
    inputs.dueTodayCount && inputs.dueTodayCount > 0
      ? { kind: "due_today", count: inputs.dueTodayCount }
      : null;
  const notPlanned: AttentionItem | null =
    inputs.unassignedMinor > 0
      ? { kind: "not_planned", amountMinor: inputs.unassignedMinor }
      : null;
  return [payday, overspendItem(inputs.envelopes), dueToday, notPlanned].flatMap(
    (item) => item ?? [],
  );
}

export function pickAttention(inputs: AttentionInputs): Attention {
  const [top = null, ...rest] = attentionItems(inputs);
  return { top, moreCount: rest.length };
}

/** Plain-language line for an attention item; `money` formats minor units as AED. */
export function attentionText(item: AttentionItem, money: (minor: number) => string): string {
  switch (item.kind) {
    case "payday":
      return item.late ? "Payday: salary not logged yet" : "Payday: did your salary land?";
    case "overspend":
      return item.count === 1
        ? `${item.name} is ${money(item.overMinor)} over`
        : `${item.count} envelopes are ${money(item.overMinor)} over in total`;
    case "due_today":
      return item.count === 1 ? "1 bill is due today" : `${item.count} bills are due today`;
    case "not_planned":
      return `${money(item.amountMinor)} is not planned yet`;
  }
}
