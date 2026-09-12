import { describe, expect, it } from "@jest/globals";

import { PROFILE_HOUSEHOLD_HREF } from "./return-to";

describe("PROFILE_HOUSEHOLD_HREF", () => {
  it("locks the profile household settings href", () => {
    expect(PROFILE_HOUSEHOLD_HREF).toBe("/(tabs)/settings/household");
  });
});
