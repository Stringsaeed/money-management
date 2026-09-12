import type { BuildQueryConfig } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { fundingPoolSql, periodCeiling } from "./funding-pool";
import { periodLastDate } from "./reserve";

const sqlDialect = {
  casing: {} as BuildQueryConfig["casing"],
  escapeName: (name: string) => `"${name}"`,
  escapeParam: (index: number, _value: unknown) => `$${index + 1}`,
  escapeString: (value: string) => `'${value.replaceAll("'", "''")}'`,
} satisfies BuildQueryConfig;

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
  it("binds ledger/currency/period ceiling and membership params without a DB", () => {
    const query = fundingPoolSql("led1", "USD", "2026-09").toQuery(sqlDialect);
    expect(query.params).toEqual([
      "led1",
      "USD",
      "2026-10-01",
      "led1",
      "USD",
      "led1",
      "USD",
      "2026-09",
    ]);
    expect(query.sql).toContain("AND t.date < $3");
    expect(query.sql).toContain("funding_memberships");
  });

  it("keeps pool arithmetic shape: member accounts, signed activity, December ceiling", () => {
    const december = fundingPoolSql("workspace_a", "EUR", "2026-12").toQuery(sqlDialect);
    expect(december.params).toContain("2027-01-01");
    expect(december.params).toContain("2026-12");
    expect(december.sql).toContain("initial_balance_minor");
    expect(december.sql).toContain("jsonb_array_elements_text");
    expect(december.sql).toContain("WHEN t.type = 'transfer'");
    expect(december.sql).toContain("WHEN t.type = 'income'");
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
