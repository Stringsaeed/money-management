import { describe, expect, it } from "@jest/globals";

import { parseSetupAssignment } from "./setup-assignment";

describe("parseSetupAssignment", () => {
  it.each([
    ["", 0],
    ["0", 0],
    ["12", 1200],
    ["12.3", 1230],
    ["12.34", 1234],
  ])("parses %p into integer minor units", (value, amountMinor) => {
    expect(parseSetupAssignment(value)).toEqual({ valid: true, amountMinor });
  });

  it.each(["-1", "1.001", ".50", "money", "1,00"])("rejects invalid value %p", (value) => {
    expect(parseSetupAssignment(value)).toMatchObject({
      valid: false,
      message: expect.stringContaining("positive amount"),
    });
  });
});
