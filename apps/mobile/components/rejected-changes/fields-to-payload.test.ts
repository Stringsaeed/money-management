import { describe, expect, it } from "@jest/globals";

import { fieldsToPayload } from "./payload-fields";

describe("fieldsToPayload", () => {
  it("merges edited fields into the original payload with typed coercion", () => {
    expect(
      fieldsToPayload(
        [
          { key: "note", kind: "string", value: "hello" },
          { key: "amount", kind: "number", value: "12.5" },
          { key: "active", kind: "boolean", value: "true" },
        ],
        { note: "old", amount: 1, active: false, keep: "yes" },
      ),
    ).toEqual({
      note: "hello",
      amount: 12.5,
      active: true,
      keep: "yes",
    });
  });
});
