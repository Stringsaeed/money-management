import type { ImpactTone } from "@/ui/trove";

import { MAX_ADJUST_ITEMS, type AdjustResult } from "./adjust-plan-model";
import { codeAmount } from "./payday-money";

/** What the ImpactLine under Adjust amounts says, and in which tone. */
export interface AdjustImpact {
  readonly tone: ImpactTone;
  readonly text: string;
}

/** The live line under Adjust amounts: what stays to plan, or what has to change first. */
export function adjustImpact(result: AdjustResult, currency: string): AdjustImpact {
  const { problem, leftToPlanMinor } = result;
  if (problem?.kind === "unreadable") {
    return { tone: "over", text: `Enter an amount for ${problem.name}, like 350 or 350.50` };
  }
  if (problem?.kind === "below_spent") {
    return {
      tone: "over",
      text: `${problem.name} has spent more: plan at least ${codeAmount(problem.minPlannedMinor, currency)}`,
    };
  }
  if (problem?.kind === "over_unplanned") {
    return {
      tone: "over",
      text: `${codeAmount(problem.overMinor, currency)} more than you have to plan`,
    };
  }
  if (problem?.kind === "too_many") {
    return { tone: "over", text: `Change up to ${MAX_ADJUST_ITEMS} envelopes at a time` };
  }
  return {
    tone: leftToPlanMinor < 0 ? "over" : "ok",
    text: `${codeAmount(leftToPlanMinor, currency)} left to plan`,
  };
}
