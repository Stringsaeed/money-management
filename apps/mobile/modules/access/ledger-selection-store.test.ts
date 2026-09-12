import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as SecureStore from "expo-secure-store";

import {
  clearLedgerSelection,
  decodeLedgerSelection,
  encodeLedgerSelection,
  readLedgerSelection,
  writeLedgerSelection,
} from "./ledger-selection-store";

describe("encodeLedgerSelection / decodeLedgerSelection", () => {
  it("round-trips personal selection", () => {
    expect(encodeLedgerSelection({ kind: "personal" })).toBe("personal");
    expect(decodeLedgerSelection("personal")).toEqual({ kind: "personal" });
  });

  it("round-trips household selection keyed by id", () => {
    expect(encodeLedgerSelection({ kind: "household", householdId: "hh-1" })).toBe(
      "household:hh-1",
    );
    expect(decodeLedgerSelection("household:hh-1")).toEqual({
      kind: "household",
      householdId: "hh-1",
    });
  });

  it("falls back to personal for null, empty, or malformed payloads", () => {
    expect(decodeLedgerSelection(null)).toEqual({ kind: "personal" });
    expect(decodeLedgerSelection("")).toEqual({ kind: "personal" });
    expect(decodeLedgerSelection("household:")).toEqual({ kind: "personal" });
    expect(decodeLedgerSelection("household:   ")).toEqual({ kind: "personal" });
    expect(decodeLedgerSelection("org:hh-1")).toEqual({ kind: "personal" });
  });
});

describe("ledger selection SecureStore seam", () => {
  beforeEach(() => {
    jest.mocked(SecureStore.getItemAsync).mockReset();
    jest.mocked(SecureStore.setItemAsync).mockReset();
    jest.mocked(SecureStore.deleteItemAsync).mockReset();
  });

  it("reads and writes under a per-user key (isolation across identities)", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue("household:hh-a");
    await expect(readLedgerSelection("user-a")).resolves.toEqual({
      kind: "household",
      householdId: "hh-a",
    });
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("trove.ledger-selection.user-a");

    await writeLedgerSelection("user-b", { kind: "personal" });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "trove.ledger-selection.user-b",
      "personal",
    );
  });

  it("clears only the named user's selection key", async () => {
    await clearLedgerSelection("user-a");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("trove.ledger-selection.user-a");
  });

  it("treats SecureStore read failures as personal", async () => {
    jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error("locked"));
    await expect(readLedgerSelection("user-a")).resolves.toEqual({ kind: "personal" });
  });

  it("swallows SecureStore delete failures on clear", async () => {
    jest.mocked(SecureStore.deleteItemAsync).mockRejectedValue(new Error("missing"));
    await expect(clearLedgerSelection("user-a")).resolves.toBeUndefined();
  });
});
