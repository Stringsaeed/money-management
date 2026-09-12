import { describe, expect, it } from "@jest/globals";

import { ONBOARDING_ENABLED } from "./onboarding";

describe("ONBOARDING_ENABLED", () => {
  it("keeps local-ledger onboarding skipped by default", () => {
    expect(ONBOARDING_ENABLED).toBe(false);
  });
});
