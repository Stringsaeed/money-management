import { describe, expect, it } from "vitest";

import { LAST_ADMIN_MESSAGE } from "./admin-guard";

describe("LAST_ADMIN_MESSAGE", () => {
  it("locks the last-admin guard copy", () => {
    expect(LAST_ADMIN_MESSAGE).toBe(
      "This Household would have no admin left. Make another member an admin first, or delete the Household.",
    );
  });
});
