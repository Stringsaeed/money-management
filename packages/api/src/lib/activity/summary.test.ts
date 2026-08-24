import { describe, expect, it } from "vitest";

import { EFFECT_TAGS } from "@trove/protocol";

import { describeEffectTag, summarizeEffects } from "./summary";

describe("describeEffectTag", () => {
  it("maps every effect tag onto a human-readable noun", () => {
    for (const tag of EFFECT_TAGS) {
      expect(describeEffectTag(tag)).not.toBe(tag);
      expect(describeEffectTag(tag).length).toBeGreaterThan(0);
    }
  });

  it("falls back to the raw tag for unknown values", () => {
    expect(describeEffectTag("mystery" as never)).toBe("mystery");
  });
});

describe("summarizeEffects", () => {
  it("returns a fallback summary for an empty effects list", () => {
    expect(summarizeEffects([])).toBe("Updated household data");
  });

  it("summarizes a single tag without a conjunction", () => {
    expect(summarizeEffects(["ledger"])).toBe("Updated the ledger");
    expect(summarizeEffects(["members"])).toBe("Updated household members");
  });

  it("joins exactly two tags with 'and'", () => {
    expect(summarizeEffects(["ledger", "balances"])).toBe(
      "Updated the ledger and account balances",
    );
  });

  it("uses an Oxford comma list for three or more tags", () => {
    expect(summarizeEffects(["rules", "upcoming", "projections"])).toBe(
      "Updated recurring rules, upcoming occurrences, and spending projections",
    );
  });
});
