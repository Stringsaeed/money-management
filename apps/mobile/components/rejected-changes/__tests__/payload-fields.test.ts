import { fieldsToPayload, buildEditableFields } from "../payload-fields";

describe("buildEditableFields", () => {
  it("lists top-level scalar fields with stringified values", () => {
    expect(
      buildEditableFields({
        description: "Groceries",
        amountMinor: 1250,
        cleared: true,
        splits: [{ minor: 100 }],
      }),
    ).toEqual([
      { key: "description", kind: "string", value: "Groceries" },
      { key: "amountMinor", kind: "number", value: "1250" },
      { key: "cleared", kind: "boolean", value: "true" },
    ]);
  });

  it("hides envelope-internal keys", () => {
    const fields = buildEditableFields({ commandId: "cmd", householdId: "hh", note: "hi" });
    expect(fields.map((f) => f.key)).toEqual(["note"]);
  });

  it("returns nothing for empty or non-object payloads", () => {
    expect(buildEditableFields(null)).toEqual([]);
    expect(buildEditableFields("nope")).toEqual([]);
    expect(buildEditableFields({ nestedOnly: { a: 1 } })).toEqual([]);
  });
});

describe("fieldsToPayload", () => {
  it("applies edits while preserving untouched and nested entries", () => {
    const original = {
      amountMinor: 1250,
      description: "Groceries",
      splits: [{ minor: 100 }],
    };
    const payload = fieldsToPayload(
      [
        { key: "amountMinor", kind: "number", value: "9900" },
        { key: "description", kind: "string", value: "Farmers market" },
      ],
      original,
    );
    expect(payload).toEqual({
      amountMinor: 9900,
      description: "Farmers market",
      splits: [{ minor: 100 }],
    });
  });

  it("falls back to the original number when the edit is not numeric", () => {
    const payload = fieldsToPayload([{ key: "amountMinor", kind: "number", value: "abc" }], {
      amountMinor: 500,
    });
    expect(payload.amountMinor).toBe(500);
  });

  it("coerces booleans from their text value", () => {
    const payload = fieldsToPayload([{ key: "cleared", kind: "boolean", value: "false" }], {
      cleared: true,
    });
    expect(payload.cleared).toBe(false);
  });

  it("handles non-object originals gracefully", () => {
    expect(fieldsToPayload([], undefined)).toEqual({});
  });
});
