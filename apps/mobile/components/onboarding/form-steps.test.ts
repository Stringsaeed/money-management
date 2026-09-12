import { describe, expect, it } from "@jest/globals";

import { FORM_STEPS } from "./steps";

describe("FORM_STEPS", () => {
  it("locks the three onboarding data-gathering steps", () => {
    expect(FORM_STEPS).toEqual(["name", "balance", "style"]);
  });
});
