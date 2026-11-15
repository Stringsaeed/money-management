import { compactAmount } from "@/ui/trove";

export const KEEP_TITLE = "Keep it where it is";
export const KEEP_SUB = "Each envelope starts next month with its leftover on top. Default.";
export const SAVE_TITLE = "Save it";
export const PLAN_TITLE = "Add to money to plan";

const SPENT = "You've already spent it this month.";

/** "🛒 64 · ⛽ 40 · Fun 56": each envelope's leftover, by its emoji or else its name. */
export function leftoverShareLine(
  shares: readonly { readonly label: string; readonly rolloverMinor: number }[],
  currency: string,
): string {
  return shares
    .map((share) => `${share.label} ${compactAmount(share.rolloverMinor, currency)}`)
    .join(" · ");
}

interface MoveFacts {
  /** What can move: the leftover not spent since. */
  readonly movableMinor: number;
  readonly totalMinor: number;
  readonly currency: string;
}

/** Save it's sentence, or why it can't be picked. */
export function saveItSub({ movableMinor, totalMinor, currency }: MoveFacts, hasSavings: boolean) {
  if (!hasSavings) return "Add a Saving for envelope first.";
  if (movableMinor === 0) return SPENT;
  const amount = compactAmount(movableMinor, currency);
  return movableMinor >= totalMinor
    ? `Moves all ${amount} into a Saving-for envelope.`
    : `Moves the ${amount} you haven't spent into a Saving-for envelope.`;
}

/** Add to money to plan's sentence, or why it can't be picked. */
export const planItSub = (movableMinor: number): string =>
  movableMinor === 0 ? SPENT : "Gives it a new job in the next step.";
