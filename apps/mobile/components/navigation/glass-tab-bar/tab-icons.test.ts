import { describe, expect, it } from "@jest/globals";

import { hasTabIcon } from "./tab-icons";

describe("hasTabIcon", () => {
  it("returns true for known tab route names", () => {
    expect(hasTabIcon("(home)")).toBe(true);
    expect(hasTabIcon("ledger")).toBe(true);
    expect(hasTabIcon("money-movement")).toBe(true);
    expect(hasTabIcon("inbox")).toBe(true);
    expect(hasTabIcon("envelopes")).toBe(true);
    expect(hasTabIcon("settings")).toBe(true);
  });

  it("returns false for unknown route names", () => {
    expect(hasTabIcon("unknown")).toBe(false);
    expect(hasTabIcon("")).toBe(false);
    expect(hasTabIcon("home")).toBe(false);
  });
});
