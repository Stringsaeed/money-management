import { compactAmount, type EnvelopeState } from "@/ui/trove";

import type { EnvelopeLine } from "./home-model";
import { floorWholeMinor } from "./runway";

/** What an `EnvelopeRow` prints for one envelope. */
export interface EnvelopeRowModel {
  readonly sub: string;
  readonly leftLabel: string;
  readonly ofLabel: string;
  readonly progress: number;
  readonly pace: number | null;
  readonly state: EnvelopeState;
  readonly accessibilityLabel: string;
}

export interface EnvelopeRowContext {
  readonly currency: string;
  /** Days to payday, today included. */
  readonly daysLeft: number;
  /** Share of the pay period gone (`periodPace`). */
  readonly pace: number;
  /** The numbers could not be refreshed: print dashes, never an old figure. */
  readonly stale?: boolean;
}

const MINUS = "−";
const share = (part: number, whole: number) =>
  whole > 0 ? Math.min(Math.max(part / whole, 0), 1) : 0;

/**
 * Board phrasing per state: "AED 42 a day" with "588" "of 1,600"; over prints "Over by 175" and
 * "−175"; money only carried from last month prints "From last month" and "rolled over".
 */
export function envelopeRowModel(
  line: EnvelopeLine,
  context: EnvelopeRowContext,
): EnvelopeRowModel {
  const { currency, daysLeft, pace } = context;
  const { envelope, totals } = line;
  const name = envelope.name;
  if (context.stale) {
    return {
      sub: "—",
      leftLabel: "—",
      ofLabel: "",
      progress: 0,
      pace: null,
      state: "unknown",
      accessibilityLabel: `${name}: couldn't load`,
    };
  }
  const left = totals.leftMinor;
  const available = totals.plannedMinor + totals.rolloverMinor;
  const amount = (minor: number) => compactAmount(minor, currency);
  const spoken = (minor: number) => `${amount(minor)} ${currency}`;

  if (left < 0) {
    return {
      sub: `Over by ${amount(-left)}`,
      leftLabel: `${MINUS}${amount(-left)}`,
      ofLabel: `of ${amount(available)}`,
      progress: 1,
      pace,
      state: "over",
      accessibilityLabel: `${name}: over by ${spoken(-left)}, of ${spoken(available)}`,
    };
  }
  if (totals.plannedMinor === 0 && totals.rolloverMinor > 0) {
    return {
      sub: "From last month",
      leftLabel: amount(left),
      ofLabel: "rolled over",
      progress: 1 - share(left, totals.rolloverMinor),
      pace: null,
      state: "rolled",
      accessibilityLabel: `${name}: ${spoken(left)} left, rolled over from last month`,
    };
  }
  if (available <= 0) {
    return {
      sub: "Not planned yet",
      leftLabel: amount(left),
      ofLabel: "",
      progress: 0,
      pace: null,
      state: "ok",
      accessibilityLabel: `${name}: not planned yet`,
    };
  }
  const perDay = floorWholeMinor(Math.floor(left / Math.max(daysLeft, 1)), currency);
  return {
    sub: `${currency} ${amount(perDay)} a day`,
    leftLabel: amount(left),
    ofLabel: `of ${amount(available)}`,
    progress: 1 - share(left, available),
    pace,
    state: "ok",
    accessibilityLabel: `${name}: ${spoken(left)} left of ${spoken(available)}`,
  };
}

/** The Everyday header's right side: "AED 1,612 LEFT", or "AED −120 LEFT". */
export function everydayLeftLabel(lines: readonly EnvelopeLine[], currency: string): string {
  const left = lines.reduce((sum, line) => sum + line.totals.leftMinor, 0);
  return `${currency} ${left < 0 ? MINUS : ""}${compactAmount(left, currency)} LEFT`;
}
