import { describe, expect, it } from "vitest";

import { commandEnvelopeSchema } from "./schema";

const base = {
  commandId: "33333333-3333-4333-8333-333333333333",
  householdId: "household-1",
  payload: {},
} as const;

describe("commandEnvelopeSchema", () => {
  it("accepts removed command kinds so the pipeline can return invalid_intent", () => {
    const parsed = commandEnvelopeSchema.safeParse({
      ...base,
      kind: "card_payment.record",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.kind).toBe("card_payment.record");
    }
  });

  it("still rejects an empty kind", () => {
    const parsed = commandEnvelopeSchema.safeParse({ ...base, kind: "" });
    expect(parsed.success).toBe(false);
  });
});
