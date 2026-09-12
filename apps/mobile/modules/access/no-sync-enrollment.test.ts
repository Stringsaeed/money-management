import { describe, expect, it } from "@jest/globals";

import { NO_SYNC_ENROLLMENT } from "./access";

describe("NO_SYNC_ENROLLMENT", () => {
  it("locks the empty sync enrollment sentinel", () => {
    expect(NO_SYNC_ENROLLMENT).toEqual({
      migratedHouseholdId: null,
      personalSyncUserId: null,
    });
  });
});
