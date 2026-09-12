import { describe, expect, it } from "@jest/globals";

import { assertLocalLedgerAuthority, unsupportedSyncedOperation } from "./contract";

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

describe("assertLocalLedgerAuthority", () => {
  it("is a no-op when selection.kind is local", () => {
    expect(() => assertLocalLedgerAuthority({ kind: "local" }, "Create Account")).not.toThrow();
  });

  it("is a no-op for non-synced selection kinds", () => {
    expect(() => assertLocalLedgerAuthority({ kind: "offline" }, "Delete Category")).not.toThrow();
  });

  it("throws via unsupportedSyncedOperation when selection.kind is synced", () => {
    expect(() => assertLocalLedgerAuthority({ kind: "synced" }, "Create Account")).toThrow(
      /Create Account is unavailable for the synced ledger/,
    );
    expect(() => assertLocalLedgerAuthority({ kind: "synced" }, "Create Account")).toThrow(
      /Local Accounts, Categories, and Transactions are not money authority while this device is synced/,
    );
    expect(() => assertLocalLedgerAuthority({ kind: "synced" }, "Create Account")).toThrow(
      /Use the household ledger on the server, or disable sync before using this local-only tool/,
    );
  });
});
