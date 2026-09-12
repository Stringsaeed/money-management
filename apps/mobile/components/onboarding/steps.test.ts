import { describe, expect, it } from "@jest/globals";

import { FORM_STEPS, WELCOME_GARDEN_STAGE, gardenStageForStep } from "./steps";

describe("gardenStageForStep", () => {
  it("starts one notch above the welcome stage at stepIndex 0", () => {
    expect(gardenStageForStep(0)).toBe(WELCOME_GARDEN_STAGE + 1);
  });

  it("advances one stage per form step index", () => {
    for (let stepIndex = 0; stepIndex < FORM_STEPS.length; stepIndex += 1) {
      expect(gardenStageForStep(stepIndex)).toBe(WELCOME_GARDEN_STAGE + 1 + stepIndex);
    }
    expect(gardenStageForStep(FORM_STEPS.length - 1)).toBe(
      WELCOME_GARDEN_STAGE + FORM_STEPS.length,
    );
  });
});
