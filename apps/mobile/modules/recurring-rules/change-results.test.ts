import { changeEffects } from "./change-results";
import { settlementEffects } from "./settlement";

describe("changeEffects", () => {
  it("returns rules+upcoming only when nothing was generated", () => {
    expect(changeEffects(0)).toEqual(["rules", "upcoming"]);
  });

  it("delegates to settlementEffects when generatedCount is positive", () => {
    expect(changeEffects(2)).toEqual(settlementEffects(2));
    expect(changeEffects(2)).toEqual(["rules", "upcoming", "ledger", "balances", "summaries"]);
  });
});
