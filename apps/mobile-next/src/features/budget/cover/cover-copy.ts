import type { CoverMode, CoverPlan } from "./cover-move-model";

interface CoverFacts {
  readonly name: string;
  /** The amount the cover is for. */
  readonly amountMinor: number;
  readonly money: (minor: number) => string;
}

export function coverIntro(mode: CoverMode, { name, amountMinor, money }: CoverFacts): string {
  switch (mode) {
    case "over":
      return `${money(amountMinor)} over. Pick where it comes from.`;
    case "short":
      return `${money(amountMinor)} short for ${name}. Pick where it comes from.`;
    case "past":
      return `Last month's ${money(amountMinor)} overspend already came out of Not planned yet. Pick which envelope pays it back.`;
  }
}

export function noSourcesLine(mode: CoverMode): string {
  switch (mode) {
    case "over":
      return "No envelope has money to spare right now. Nothing is moved, and the overspend comes out of next month's money.";
    case "short":
      return "No envelope has money to spare right now. Nothing is moved, and the bill stays short.";
    case "past":
      return "No envelope has money left to pay it back. Nothing is moved, and the overspend stays out of Not planned yet.";
  }
}

/** A partial cover: what is not covered and where that leaves it. */
export function coverRestLine(
  mode: CoverMode,
  restMinor: number,
  money: (minor: number) => string,
): string {
  switch (mode) {
    case "over":
      return `${money(restMinor)} is still over. The rest comes out of next month's money.`;
    case "short":
      return `${money(restMinor)} is not covered. The rest is still short when it's due.`;
    case "past":
      return `${money(restMinor)} is not paid back. The rest stays out of Not planned yet.`;
  }
}

/** Under the receipt: what a partial cover does not reach, or a prompt to pick a source. */
export function coverRestNote(
  mode: CoverMode,
  plan: CoverPlan,
  money: (minor: number) => string,
  hasSources: boolean,
): string | null {
  if (plan.restMinor === 0 || !hasSources) return null;
  return plan.coveredMinor > 0
    ? coverRestLine(mode, plan.restMinor, money)
    : "Pick at least one source to cover it.";
}

export function coverToast(
  mode: CoverMode,
  name: string,
  coveredMinor: number,
  money: (minor: number) => string,
): string {
  return mode === "past"
    ? `Paid back ${money(coveredMinor)} of ${name}'s overspend`
    : `Covered ${money(coveredMinor)} for ${name}`;
}
