import { amountParts, type SignDisplay } from "@/ui/trove";

/**
 * Figure printed without a currency sign, as on the Ledger's rows, day stamps and totals:
 * `−64.20`, `+12,000.00`. The screen around it names the currency.
 */
export function plainAmount(minor: number, currency: string, signDisplay: SignDisplay = "auto") {
  const parts = amountParts(minor, currency, signDisplay);
  return `${parts.sign}${parts.whole}${parts.fraction}`;
}
