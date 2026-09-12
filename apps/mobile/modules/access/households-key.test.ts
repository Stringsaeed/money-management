import { describe, expect, it } from "@jest/globals";

import { HOUSEHOLDS_KEY } from "./households-key";

describe("HOUSEHOLDS_KEY", () => {
  it("is the households query-key tuple", () => {
    expect([...HOUSEHOLDS_KEY]).toEqual(["households"]);
  });

  it("does not include other access resource keys", () => {
    expect(HOUSEHOLDS_KEY).not.toContain("memberships");
    expect(HOUSEHOLDS_KEY).not.toContain("session");
  });
});
