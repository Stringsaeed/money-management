import { describe, expect, it } from "vitest";

import { INVITATION_EXPIRES_IN_DAYS } from "./service";

describe("INVITATION_EXPIRES_IN_DAYS", () => {
  it("locks household invitations to a seven-day expiry", () => {
    expect(INVITATION_EXPIRES_IN_DAYS).toBe(7);
  });
});
