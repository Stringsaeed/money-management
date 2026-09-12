import { describe, expect, it } from "@jest/globals";

import { READONLY_FIELD_KEYS } from "./payload-fields";

describe("READONLY_FIELD_KEYS", () => {
  it("locks envelope-internal payload keys", () => {
    expect(READONLY_FIELD_KEYS).toEqual(["commandId", "householdId"]);
  });
});
