import { entryLayout } from "@/ui/trove";

/** Whole-part font size; the cents print at half of it. Steps down so a long figure never wraps. */
export type QuickAddWholeSize = 56 | 44 | 34;

export interface QuickAddAmountLayout {
  /** Grouped whole digits, "0" while empty: "1,850". */
  readonly whole: string;
  /** The decimal point and digits typed after it: "" or ".5". */
  readonly typedCents: string;
  /** Faded placeholder for the cents not typed yet: ".00", "0" or "". */
  readonly ghostCents: string;
  readonly empty: boolean;
  readonly size: QuickAddWholeSize;
}

interface LayoutOptions {
  readonly fractionDigits: number;
  readonly decimalSeparator: string;
  readonly groupSeparator: string;
}

const wholeSize = (length: number): QuickAddWholeSize => {
  if (length <= 6) return 56;
  if (length <= 9) return 44;
  return 34;
};

/**
 * Splits the keypad's plain entry ("1850.5") into the board's three runs: the big whole part,
 * the cents already typed, and the faded cents still to come.
 */
export function quickAddAmountLayout(value: string, options: LayoutOptions): QuickAddAmountLayout {
  const { chars, empty } = entryLayout(value, options);
  const firstCents = chars.findIndex((entry) => entry.kind === "point" || entry.kind === "ghost");
  const wholeChars = firstCents === -1 ? chars : chars.slice(0, firstCents);
  const cents = firstCents === -1 ? [] : chars.slice(firstCents);
  const whole = wholeChars.map((entry) => entry.char).join("");
  return {
    whole,
    typedCents: cents
      .filter((entry) => entry.kind !== "ghost")
      .map((entry) => entry.char)
      .join(""),
    ghostCents: cents
      .filter((entry) => entry.kind === "ghost")
      .map((entry) => entry.char)
      .join(""),
    empty,
    size: wholeSize(whole.length),
  };
}
