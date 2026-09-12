import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as SecureStore from "expo-secure-store";

import { claimFromFields, clearClaim, readClaim, writeClaim } from "./claim-store";

const HELD_CLAIM = {
  kind: "held" as const,
  user: { userId: "u1", email: "ada@trove.ing", displayName: "Ada" },
  establishedAt: "2026-03-01T00:00:00.000Z",
};

const USER_ID_KEY = "trove.identity-claim.user-id";
const EMAIL_KEY = "trove.identity-claim.email";
const DISPLAY_NAME_KEY = "trove.identity-claim.display-name";
const ESTABLISHED_AT_KEY = "trove.identity-claim.established-at";

describe("claimFromFields", () => {
  it("reads none when any required field is missing", () => {
    expect(
      claimFromFields({
        userId: null,
        email: "ada@trove.ing",
        displayName: "Ada",
        establishedAt: "t",
      }),
    ).toEqual({ kind: "none" });
    expect(
      claimFromFields({ userId: "u1", email: null, displayName: "Ada", establishedAt: "t" }),
    ).toEqual({ kind: "none" });
  });

  it("reads a held identity claim", () => {
    expect(
      claimFromFields({
        userId: "u1",
        email: "ada@trove.ing",
        displayName: "Ada",
        establishedAt: "2026-03-01T00:00:00.000Z",
      }),
    ).toEqual({
      kind: "held",
      user: { userId: "u1", email: "ada@trove.ing", displayName: "Ada" },
      establishedAt: "2026-03-01T00:00:00.000Z",
    });
  });
});

describe("claim SecureStore seam", () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    jest.mocked(SecureStore.getItemAsync).mockReset();
    jest.mocked(SecureStore.setItemAsync).mockReset();
    jest.mocked(SecureStore.deleteItemAsync).mockReset();
    jest
      .mocked(SecureStore.getItemAsync)
      .mockImplementation(async (key) => memory.get(key) ?? null);
    jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key, value) => {
      memory.set(key, value);
    });
    jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async (key) => {
      memory.delete(key);
    });
  });

  it("writeClaim held round-trips through readClaim", async () => {
    await writeClaim(HELD_CLAIM);
    await expect(readClaim()).resolves.toEqual(HELD_CLAIM);
    expect(memory.get(USER_ID_KEY)).toBe("u1");
    expect(memory.get(EMAIL_KEY)).toBe("ada@trove.ing");
    expect(memory.get(DISPLAY_NAME_KEY)).toBe("Ada");
    expect(memory.get(ESTABLISHED_AT_KEY)).toBe("2026-03-01T00:00:00.000Z");
  });

  it("writeClaim none clears persisted claim", async () => {
    await writeClaim(HELD_CLAIM);
    await writeClaim({ kind: "none" });
    await expect(readClaim()).resolves.toEqual({ kind: "none" });
    expect(memory.has(USER_ID_KEY)).toBe(false);
  });

  it("clearClaim removes all identity claim keys", async () => {
    await writeClaim(HELD_CLAIM);
    jest.mocked(SecureStore.deleteItemAsync).mockClear();
    await clearClaim();
    expect(jest.mocked(SecureStore.deleteItemAsync)).toHaveBeenCalledTimes(4);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(USER_ID_KEY);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(EMAIL_KEY);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(DISPLAY_NAME_KEY);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(ESTABLISHED_AT_KEY);
    await expect(readClaim()).resolves.toEqual({ kind: "none" });
  });

  it("writeClaim skips redundant SecureStore writes when identity is unchanged", async () => {
    await writeClaim(HELD_CLAIM);
    jest.mocked(SecureStore.setItemAsync).mockClear();
    await writeClaim(HELD_CLAIM);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it("writeClaim persists when establishedAt changes for the same user", async () => {
    await writeClaim(HELD_CLAIM);
    jest.mocked(SecureStore.setItemAsync).mockClear();
    const updated = { ...HELD_CLAIM, establishedAt: "2026-03-02T00:00:00.000Z" };
    await writeClaim(updated);
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
    await expect(readClaim()).resolves.toEqual(updated);
  });

  it("readClaim soft-fails to none when SecureStore throws", async () => {
    jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error("locked"));
    await expect(readClaim()).resolves.toEqual({ kind: "none" });
  });
});
