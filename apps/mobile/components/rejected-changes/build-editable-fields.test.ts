import { describe, expect, it } from "@jest/globals";

import { buildEditableFields } from "./payload-fields";

describe("buildEditableFields", () => {
  it("lists top-level scalars and skips readonly or nested entries", () => {
    expect(
      buildEditableFields({
        commandId: "cmd",
        householdId: "hh",
        note: "hi",
        amount: 12,
        active: true,
        nested: { a: 1 },
      }),
    ).toEqual([
      { key: "note", kind: "string", value: "hi" },
      { key: "amount", kind: "number", value: "12" },
      { key: "active", kind: "boolean", value: "true" },
    ]);
  });
});
