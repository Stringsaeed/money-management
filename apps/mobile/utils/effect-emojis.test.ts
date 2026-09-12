import { describe, expect, it } from "@jest/globals";

import { EFFECT_EMOJIS } from "./activity";

describe("EFFECT_EMOJIS", () => {
  it("locks known activity effect emoji vocabulary", () => {
    expect(EFFECT_EMOJIS).toEqual({
      rules: "🔁",
      upcoming: "📅",
      ledger: "🧾",
      balances: "⚖️",
      summaries: "🏷️",
      envelopes: "✉️",
      assignments: "📌",
      projections: "📈",
      members: "👥",
    });
  });
});
