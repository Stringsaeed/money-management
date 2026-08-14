/** The three data-gathering steps between the welcome and the celebration. */
export const FORM_STEPS = ["name", "balance", "style"] as const;

export type FormStep = (typeof FORM_STEPS)[number];

/**
 * Where the garden stands on the welcome screen. Each form step adds one
 * notch, and the celebration lands on GARDEN_STAGES — so the plant reads as a
 * progress bar you actually care about.
 */
export const WELCOME_GARDEN_STAGE = 2;

/** The garden's stage while `stepIndex` is on screen. */
export function gardenStageForStep(stepIndex: number) {
  return WELCOME_GARDEN_STAGE + 1 + stepIndex;
}
