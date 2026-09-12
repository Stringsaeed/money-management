import { CasingCache } from "drizzle-orm/casing";
import { describe, expect, it } from "vitest";

import { envelopeAssignedBalanceSql } from "./envelope-balance";

const queryConfig = {
  casing: new CasingCache(),
  escapeName: (name: string) => `"${name}"`,
  escapeParam: (num: number, _value: unknown) => `$${num + 1}`,
  escapeString: (str: string) => `"${str.replaceAll('"', '""')}"`,
};

describe("envelopeAssignedBalanceSql", () => {
  it("binds envelope/ledger/period params for destination-minus-source netting", () => {
    const built = envelopeAssignedBalanceSql("led1", "env1", "2026-09").toQuery(queryConfig);
    expect(built.params).toEqual(["env1", "env1", "led1", "2026-09", "env1", "env1"]);
    expect(built.sql).toContain("FROM assignments g");
    expect(built.sql).toContain("g.destination_envelope_id = $1");
    expect(built.sql).toContain("g.source_envelope_id = $2");
    expect(built.sql).toContain("g.ledger_id = $3");
    expect(built.sql).toContain("g.budget_period <= $4");
  });

  it("COALESCE-wraps the SUM and filters either-side envelope participation", () => {
    const built = envelopeAssignedBalanceSql("ws_b", "env_rent", "2026-12").toQuery(queryConfig);
    expect(built.sql).toContain("COALESCE((");
    expect(built.sql).toContain("SELECT SUM(");
    expect(built.sql).toContain(
      "(g.destination_envelope_id = $5 OR g.source_envelope_id = $6)",
    );
    expect(built.params).toEqual([
      "env_rent",
      "env_rent",
      "ws_b",
      "2026-12",
      "env_rent",
      "env_rent",
    ]);
  });
});
