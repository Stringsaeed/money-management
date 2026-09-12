import { describe, expect, it } from "@jest/globals";

import { WELCOME_GARDEN_STAGE } from "./steps";

describe("WELCOME_GARDEN_STAGE", () => {
  it("locks the welcome-screen garden stage notch", () => {
    expect(WELCOME_GARDEN_STAGE).toBe(2);
  });
});
