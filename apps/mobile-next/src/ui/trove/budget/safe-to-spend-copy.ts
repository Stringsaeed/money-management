import { amountAccessibilityLabel } from "../amount/amount-parts";
import { compactAmount } from "./budget-money";

/** Printed pace chip: `≈ AED 142 A DAY`, or `AED 0 A DAY` once nothing is safe to spend. */
export function paceChipText(safeMinor: number, perDayMinor: number, currency: string): string {
  if (safeMinor <= 0) return `${currency} 0 A DAY`;
  return `≈ ${currency} ${compactAmount(perDayMinor, currency)} A DAY`;
}

/** Spoken pace chip: "about 142 AED a day". */
export function paceChipLabel(safeMinor: number, perDayMinor: number, currency: string): string {
  if (safeMinor <= 0) return `0 ${currency} a day`;
  return `about ${compactAmount(perDayMinor, currency)} ${currency} a day`;
}

/** Runway caption: `14 DAYS`, `1 DAY`. */
export function daysLeftText(daysLeft: number): string {
  return `${daysLeft} ${daysLeft === 1 ? "DAY" : "DAYS"}`;
}

/** Spoken figure: "Safe to spend: minus 240.00 AED". */
export function safeToSpendLabel(safeMinor: number, currency: string): string {
  return `Safe to spend: ${amountAccessibilityLabel(safeMinor, currency)}`;
}
