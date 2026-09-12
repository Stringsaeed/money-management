import { describe, expect, it } from "vitest";

import { settlementEffects } from "@trove/domain/settlement";

describe("settlementEffects", () => {
  it("returns the full ledger effect set when any occurrence was generated", () => {
    expect(settlementEffects(1)).toEqual([
      "rules",
      "upcoming",
      "ledger",
      "balances",
      "summaries",
    ]);
    expect(settlementEffects(3)).toEqual([
      "rules",
      "upcoming",
      "ledger",
      "balances",
      "summaries",
    ]);
  });

  it("returns only rules when nothing was generated", () => {
    expect(settlementEffects(0)).toEqual(["rules"]);
  });
});
