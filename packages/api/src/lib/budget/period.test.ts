import { CasingCache } from "drizzle-orm/casing";
import { describe, expect, it } from "vitest";

import {
  assignedThroughPeriodSql,
  fundingPoolSql,
  periodCeiling,
} from "./funding-pool";
import { periodLastDate } from "./reserve";

const queryConfig = {
  casing: new CasingCache(),
  escapeName: (name: string) => `"${name}"`,
  escapeParam: (num: number, _value: unknown) => `$${num + 1}`,
  escapeString: (str: string) => `"${str.replaceAll('"', '""')}"`,
};

describe("periodCeiling", () => {
  it("returns the first day of the following month", () => {
    expect(periodCeiling("2026-09")).toBe("2026-10-01");
    expect(periodCeiling("2026-01")).toBe("2026-02-01");
  });

  it("rolls December into the next year", () => {
    expect(periodCeiling("2026-12")).toBe("2027-01-01");
  });
});

describe("fundingPoolSql", () => {
  it("binds ledger/currency/ceiling params and keeps pool SUM shape without a DB", () => {
    const built = fundingPoolSql("led1", "USD", "2026-09").toQuery(queryConfig);
    expect(built.sql).toContain("COALESCE(SUM(account_balance)");
    expect(built.params).toEqual([
      "led1",
      "USD",
      periodCeiling("2026-09"),
      "led1",
      "USD",
      "led1",
      "USD",
      "2026-09",
    ]);
    expect(periodCeiling("2026-09")).toBe("2026-10-01");
    expect(built.sql).toContain("funding_memberships");
  });

  it("keeps signed activity and December ceiling in the embeddable fragment", () => {
    const december = fundingPoolSql("workspace_a", "EUR", "2026-12").toQuery(queryConfig);
    expect(december.params).toContain("2027-01-01");
    expect(december.params).toContain("2026-12");
    expect(december.sql).toContain("initial_balance_minor");
    expect(december.sql).toContain("jsonb_array_elements_text");
    expect(december.sql).toContain("WHEN t.type = 'transfer'");
    expect(december.sql).toContain("WHEN t.type = 'income'");
  });
});

describe("assignedThroughPeriodSql", () => {
  it("binds ledger/currency/period and nets destination minus source assignments", () => {
    const built = assignedThroughPeriodSql("led1", "USD", "2026-09").toQuery(queryConfig);
    expect(built.params).toEqual(["led1", "USD", "2026-09"]);
    expect(built.sql).toContain("FROM assignments g");
    expect(built.sql).toContain("destination_envelope_id");
    expect(built.sql).toContain("source_envelope_id");
    expect(built.sql).toContain("g.budget_period <= $3");
  });

  it("COALESCE-wraps the assignment SUM so empty ledgers read as zero", () => {
    const built = assignedThroughPeriodSql("ws_b", "EUR", "2026-12").toQuery(queryConfig);
    expect(built.sql).toContain("COALESCE((");
    expect(built.sql).toContain("SELECT SUM(");
    expect(built.params).toEqual(["ws_b", "EUR", "2026-12"]);
  });
});

describe("periodLastDate", () => {
  it("returns the inclusive last calendar day of the period", () => {
    expect(periodLastDate("2026-09")).toBe("2026-09-30");
    expect(periodLastDate("2026-02")).toBe("2026-02-28");
    expect(periodLastDate("2024-02")).toBe("2024-02-29");
  });

  it("handles year-boundary December periods", () => {
    expect(periodLastDate("2026-12")).toBe("2026-12-31");
  });
});
