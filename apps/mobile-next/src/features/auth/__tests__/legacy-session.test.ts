import * as SecureStore from "expo-secure-store";

import { currentRegisteredSession, hydrateAuth } from "../auth-client";

const NEXT_KEY = "trove-next.workos.session";
const LEGACY_KEY = "trove.workos.session";
const LEGACY_PKCE_KEY = "trove.workos.pkce";

function memoryStore(): Map<string, string> {
  const values = new Map<string, string>();
  jest.spyOn(SecureStore, "getItemAsync").mockImplementation(async (key: string) => {
    return values.get(key) ?? null;
  });
  jest.spyOn(SecureStore, "setItemAsync").mockImplementation(async (key: string, value: string) => {
    values.set(key, value);
  });
  jest.spyOn(SecureStore, "deleteItemAsync").mockImplementation(async (key: string) => {
    values.delete(key);
  });
  return values;
}

const expiresAt = Date.now() + 60 * 60 * 1000;

const legacySession = {
  accessToken: "legacy-access",
  refreshToken: "legacy-refresh",
  user: { id: "user_1", email: "ada@example.com", name: "Ada" },
  organizationId: "org_1",
  expiresAt,
};

describe("legacy WorkOS session", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("moves a legacy session onto the Next key once and leaves PKCE in place", async () => {
    const values = memoryStore();
    const pkce = '{"codeVerifier":"keep"}';
    values.set(LEGACY_KEY, JSON.stringify(legacySession));
    values.set(LEGACY_PKCE_KEY, pkce);

    await hydrateAuth();

    expect(values.has(LEGACY_KEY)).toBe(false);
    expect(values.get(LEGACY_PKCE_KEY)).toBe(pkce);
    expect(JSON.parse(values.get(NEXT_KEY) ?? "null")).toEqual({
      principal: {
        kind: "user",
        userId: "user_1",
        workosUserId: "user_1",
        email: "ada@example.com",
        name: "Ada",
      },
      accessToken: "legacy-access",
      refreshToken: "legacy-refresh",
      expiresAt,
    });
    expect(currentRegisteredSession()).toMatchObject({
      accessToken: "legacy-access",
      refreshToken: "legacy-refresh",
      principal: { userId: "user_1", workosUserId: "user_1" },
    });

    await hydrateAuth();

    expect(values.get(LEGACY_PKCE_KEY)).toBe(pkce);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(LEGACY_KEY);
  });

  it("keeps an existing Next session and does not read the legacy key", async () => {
    const values = memoryStore();
    values.set(
      NEXT_KEY,
      JSON.stringify({
        principal: {
          kind: "user",
          userId: "user_next",
          workosUserId: "user_next",
          email: "next@example.com",
          name: "Next",
        },
        accessToken: "next-access",
        refreshToken: "next-refresh",
        expiresAt,
      }),
    );
    values.set(LEGACY_KEY, JSON.stringify(legacySession));

    await hydrateAuth();

    expect(values.get(LEGACY_KEY)).toBe(JSON.stringify(legacySession));
    expect(currentRegisteredSession()?.accessToken).toBe("next-access");
    expect(SecureStore.getItemAsync).not.toHaveBeenCalledWith(LEGACY_KEY);
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});
