import { CasingCache } from "drizzle-orm/casing";
import { describe, expect, it } from "vitest";

import { periodCeiling } from "./funding-pool";
import { cardPaymentReserveSql, unfundedCardSpendingSql } from "./reserve";

const queryConfig = {
  casing: new CasingCache(),
  escapeName: (name: string) => `"${name}"`,
  escapeParam: (num: number, _value: unknown) => `$${num + 1}`,
  escapeString: (str: string) => `"${str.replaceAll('"', '""')}"`,
};

describe("cardPaymentReserveSql", () => {
  it("binds ledger/currency/period and period ceiling for spend and payment sides", () => {
    const built = cardPaymentReserveSql("led1", "USD", "2026-09").toQuery(queryConfig);
    const ceiling = periodCeiling("2026-09");
    expect(ceiling).toBe("2026-10-01");
    expect(built.params).toEqual([
      "led1",
      "USD",
      "2026-09",
      "led1",
      "USD",
      ceiling,
      "led1",
      "USD",
      ceiling,
    ]);
    expect(built.sql).toContain("GREATEST(");
    expect(built.sql).toContain("LEAST(s.spent_minor, s.available_minor)");
    expect(built.sql).toContain("ca.type = 'card'");
  });

  it("subtracts transfers into cards and floors the reserve at zero", () => {
    const built = cardPaymentReserveSql("ws_b", "EUR", "2026-12").toQuery(queryConfig);
    expect(built.params).toContain(periodCeiling("2026-12"));
    expect(built.sql).toContain("p.type = 'transfer'");
    expect(built.sql).toContain("dest.type = 'card'");
    expect(built.sql).toContain(", 0)");
    expect(built.sql).toContain("refund_links");
    expect(built.sql).toContain("category_mappings");
  });
});

describe("unfundedCardSpendingSql", () => {
  it("binds ledger/currency/period and period ceiling without payment-side params", () => {
    const built = unfundedCardSpendingSql("led1", "USD", "2026-09").toQuery(queryConfig);
    const ceiling = periodCeiling("2026-09");
    expect(ceiling).toBe("2026-10-01");
    expect(built.params).toEqual(["led1", "USD", "2026-09", "led1", "USD", ceiling]);
    expect(built.sql).toContain("GREATEST(s.spent_minor - s.available_minor, 0)");
    expect(built.sql).toContain("ca.type = 'card'");
    expect(built.sql).not.toContain("p.type = 'transfer'");
  });

  it("sums per-envelope overspend only and keeps refund/mapping joins", () => {
    const built = unfundedCardSpendingSql("ws_b", "EUR", "2026-12").toQuery(queryConfig);
    expect(built.params).toEqual([
      "ws_b",
      "EUR",
      "2026-12",
      "ws_b",
      "EUR",
      periodCeiling("2026-12"),
    ]);
    expect(built.sql).toContain("COALESCE(SUM(GREATEST(s.spent_minor - s.available_minor, 0)), 0)");
    expect(built.sql).toContain("refund_links");
    expect(built.sql).toContain("category_mappings");
    expect(built.sql).not.toContain("LEAST(s.spent_minor, s.available_minor)");
  });
});
