import type { V2BudgetPeriodView, V2Envelope, V2EnvelopeGroup } from "@trove/api/v2/contracts";

/** One envelope's numbers for a finished period, with the name and group it has today. */
export interface WrapUpEnvelope {
  readonly id: string;
  readonly name: string;
  readonly group: V2EnvelopeGroup;
  readonly plannedMinor: number;
  readonly spentMinor: number;
  readonly leftMinor: number;
}

/** A finished period's totals joined to the active envelopes; archived ones are left out. */
export function wrapUpEnvelopes(
  period: V2BudgetPeriodView,
  envelopes: readonly V2Envelope[],
): WrapUpEnvelope[] {
  const byId = new Map(envelopes.map((envelope) => [envelope.id, envelope]));
  return period.envelopes.flatMap((totals) => {
    const envelope = byId.get(totals.id);
    return envelope
      ? [
          {
            id: totals.id,
            name: envelope.name,
            group: envelope.group,
            plannedMinor: totals.plannedMinor,
            spentMinor: totals.spentMinor,
            leftMinor: totals.leftMinor,
          },
        ]
      : [];
  });
}

export interface Overspend {
  readonly id: string;
  readonly name: string;
  readonly overMinor: number;
}

export interface WrapUpSummary {
  readonly envelopeCount: number;
  /** Envelopes that ended the period with Left >= 0. */
  readonly onPlanCount: number;
  readonly everyday: { readonly spentMinor: number; readonly plannedMinor: number };
  /** Bills envelopes that had a payment in the period, out of all Bills envelopes. */
  readonly bills: { readonly paid: number; readonly total: number };
  /** Net money moved into Saving for envelopes in the period. */
  readonly savedMinor: number;
  /** Envelopes below zero at period end, worst first. */
  readonly overspent: readonly Overspend[];
}

export function wrapUpSummary(lines: readonly WrapUpEnvelope[]): WrapUpSummary {
  const everyday = lines.filter((line) => line.group === "everyday");
  const bills = lines.filter((line) => line.group === "bills");
  const saving = lines.filter((line) => line.group === "saving");
  const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
  return {
    envelopeCount: lines.length,
    onPlanCount: lines.filter((line) => line.leftMinor >= 0).length,
    everyday: {
      spentMinor: sum(everyday.map((line) => line.spentMinor)),
      plannedMinor: sum(everyday.map((line) => line.plannedMinor)),
    },
    bills: { paid: bills.filter((line) => line.spentMinor > 0).length, total: bills.length },
    savedMinor: sum(saving.map((line) => Math.max(line.plannedMinor, 0))),
    overspent: lines
      .filter((line) => line.leftMinor < 0)
      .map((line) => ({ id: line.id, name: line.name, overMinor: -line.leftMinor }))
      .sort((a, b) => b.overMinor - a.overMinor),
  };
}

/** How many finished periods in a row an Everyday envelope must run over before we suggest more. */
export const RAISE_PERIODS = 3;
/** Suggestions round up to this step: AED 50, in minor units. */
const RAISE_STEP_MINOR = 5_000;

export interface RaiseSuggestion {
  readonly envelopeId: string;
  readonly name: string;
  readonly suggestedMinor: number;
}

/**
 * One suggestion when an Everyday envelope spent more than it planned in each of the last three
 * finished periods: raise it to the most it spent in those periods, rounded up to AED 50.
 * `history` is newest first and must hold exactly `RAISE_PERIODS` periods.
 */
export function raiseSuggestion(
  history: readonly (readonly WrapUpEnvelope[])[],
): RaiseSuggestion | null {
  const [latest, ...older] = history;
  if (!latest || history.length !== RAISE_PERIODS) return null;
  const candidates = latest.flatMap((line) => {
    if (line.group !== "everyday") return [];
    const periods = [line, ...older.map((lines) => lines.find((other) => other.id === line.id))];
    const overEvery = periods.every((period) => period && period.spentMinor > period.plannedMinor);
    if (!overEvery) return [];
    const mostSpent = Math.max(...periods.map((period) => period?.spentMinor ?? 0));
    const suggestedMinor = Math.ceil(mostSpent / RAISE_STEP_MINOR) * RAISE_STEP_MINOR;
    return [
      {
        envelopeId: line.id,
        name: line.name,
        suggestedMinor,
        raiseMinor: suggestedMinor - line.plannedMinor,
      },
    ];
  });
  const [best] = candidates.sort((a, b) => b.raiseMinor - a.raiseMinor);
  return best
    ? { envelopeId: best.envelopeId, name: best.name, suggestedMinor: best.suggestedMinor }
    : null;
}
