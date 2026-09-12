import { describe, expect, it } from "vitest";

import { MEMBERSHIP_STATUSES } from "./household";

describe("MEMBERSHIP_STATUSES", () => {
  it('locks membership status vocabulary to ["active","inactive","pending"]', () => {
    expect(MEMBERSHIP_STATUSES).toEqual(["active", "inactive", "pending"]);
  });
});
