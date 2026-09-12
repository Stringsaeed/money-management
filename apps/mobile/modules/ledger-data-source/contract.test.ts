import { describe, expect, it } from "@jest/globals";

import { unsupportedSyncedOperation } from "./contract";

describe("unsupportedSyncedOperation", () => {
  it("returns an Error whose message joins operation, impact, and nextAction", () => {
    const error = unsupportedSyncedOperation(
      "Archive Account",
      "The local archive path stays closed.",
      "Archive from the synced household ledger instead.",
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(
      "Archive Account is unavailable for the synced ledger. The local archive path stays closed. Archive from the synced household ledger instead.",
    );
  });

  it("interpolates each argument into the fixed unavailable template", () => {
    const error = unsupportedSyncedOperation("OpA", "ImpactB", "NextC");
    expect(error.message).toContain("OpA is unavailable for the synced ledger.");
    expect(error.message).toContain("ImpactB");
    expect(error.message).toContain("NextC");
  });

  it("does not throw — callers decide whether to throw the returned Error", () => {
    expect(() => unsupportedSyncedOperation("X", "Y", "Z")).not.toThrow();
  });
});
