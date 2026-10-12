import { compactAmount } from "@/ui/trove";
import { currencyFractionDigits } from "@/utils/money";

import { receiptFigure } from "../envelope/envelope-figures";

import { safeToSpendAfter, safeToSpendDelta, type AfterLine } from "./cover-display";
import type { Place } from "./cover-move-model";

const caps = (name: string) => name.toUpperCase();

/** The AFTER receipt of a move: both ends, the receiving end ticked once it is no longer over. */
export function moveAfterLines(
  from: Place,
  to: Place,
  amountMinor: number,
  now: { readonly safeToSpendMinor: number; readonly currency: string },
): AfterLine[] {
  const { currency } = now;
  const toAfter = to.availableMinor + amountMinor;
  const covered = to.availableMinor < 0 && toAfter >= 0;
  return [
    { label: caps(from.name), value: receiptFigure(from.availableMinor - amountMinor, currency) },
    { label: caps(to.name), value: `${receiptFigure(toAfter, currency)}${covered ? " ✓" : ""}` },
    {
      label: "SAFE TO SPEND",
      value: safeToSpendAfter(
        now.safeToSpendMinor,
        safeToSpendDelta(from.kind, to.kind, amountMinor),
        currency,
      ),
      total: true,
    },
  ];
}

export interface QuickPick {
  readonly key: string;
  readonly label: string;
  readonly amountMinor: number;
}

const ROUND_UNITS = [1000, 500, 200, 100, 50, 20, 10] as const;

/**
 * Amount chips under Move money: cover the receiving envelope's overspend, a round figure, and
 * everything the source has. Each fits what the source has, and none repeats another.
 */
export function moveQuickPicks(
  to: Place | undefined,
  capMinor: number,
  currency: string,
): QuickPick[] {
  if (capMinor <= 0) return [];
  const unit = 10 ** currencyFractionDigits(currency);
  const picks: QuickPick[] = [];
  const overMinor = to && to.availableMinor < 0 ? -to.availableMinor : 0;
  if (overMinor > 0 && overMinor <= capMinor)
    picks.push({
      key: "cover",
      label: `Cover ${compactAmount(overMinor, currency)}`,
      amountMinor: overMinor,
    });
  // Below the cover when there is one (175 → 100), else below everything (282 → 200).
  const ceiling = overMinor > 0 ? Math.min(overMinor, capMinor) : capMinor;
  const round = ROUND_UNITS.map((units) => units * unit).find((minor) => minor < ceiling);
  if (round !== undefined)
    picks.push({ key: "round", label: compactAmount(round, currency), amountMinor: round });
  if (capMinor !== overMinor)
    picks.push({
      key: "all",
      label: `All ${compactAmount(capMinor, currency)}`,
      amountMinor: capMinor,
    });
  return picks;
}
