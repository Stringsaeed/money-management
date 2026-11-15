import type { SetupStep } from "./setup-types";

const STEP_NUMBER = { payday: 1, items: 2, amounts: 3 } as const satisfies Record<
  Exclude<SetupStep, "review">,
  number
>;

export const SETUP_STEP_COUNT = 3;

export interface StepHeaderModel {
  readonly step?: number;
  readonly of?: number;
  readonly tag: string;
}

/**
 * The step header per board: steps 1 to 3 fill segments and print "n / 3" (the household's first
 * step "🏠 1 / 3"); Review prints "REVIEW" with no bar.
 */
export function stepHeaderProps(step: SetupStep, household: boolean): StepHeaderModel {
  if (step === "review") return { tag: "REVIEW" };
  const number = STEP_NUMBER[step];
  const tag = `${number} / ${SETUP_STEP_COUNT}`;
  return {
    step: number,
    of: SETUP_STEP_COUNT,
    tag: household && step === "payday" ? `🏠 ${tag}` : tag,
  };
}
