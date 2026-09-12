import { describe, expect, it } from "vitest";

import { budgetPeriodOf } from "./handlers/transaction";

describe("budgetPeriodOf", () => {
  it("returns YYYY-MM from a YYYY-MM-DD ledger date", () => {
    expect(budgetPeriodOf("2026-09-12")).toBe("2026-09");
  });

  it("keeps month boundaries intact across years", () => {
    expect(budgetPeriodOf("2025-12-31")).toBe("2025-12");
    expect(budgetPeriodOf("2026-01-01")).toBe("2026-01");
  });

  it("slices the first seven characters even when the input is already a period", () => {
    expect(budgetPeriodOf("2026-09")).toBe("2026-09");
  });
});
