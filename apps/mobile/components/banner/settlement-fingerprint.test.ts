import { describe, expect, it } from "@jest/globals";

import { settlementFingerprint } from "./banner-fingerprint";

describe("settlementFingerprint", () => {
  it("returns null when there is nothing unresolved and nothing generated", () => {
    expect(
      settlementFingerprint({
        report: null,
        error: null,
        unresolved: false,
      }),
    ).toBeNull();
  });

  it("builds success and attention fingerprints from settlement reports", () => {
    const report = {
      localDate: "2026-09-12",
      startedAt: "t0",
      finishedAt: "t1",
      generatedCount: 2,
      totalMinor: 100,
      rules: [
        { ruleId: "r1", kind: "settled" as const, generatedCount: 2, totalMinor: 100 },
        { ruleId: "r2", kind: "needs_attention" as const, generatedCount: 0, totalMinor: 0 },
      ],
      effects: [],
    };
    expect(settlementFingerprint({ report, error: null, unresolved: false })).toBe(
      "success:t0:2",
    );
    expect(
      settlementFingerprint({
        report,
        error: new Error("boom"),
        unresolved: true,
      }),
    ).toBe("attention:t0:boom:1");
  });
});
