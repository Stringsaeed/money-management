import { compactAmount } from "@/ui/trove";

/** Money in a Budget home sentence: "AED 1,850", "AED 75.50", "AED −120". */
export function compactMoney(minor: number, currency: string): string {
  return `${currency} ${minor < 0 ? "−" : ""}${compactAmount(minor, currency)}`;
}
