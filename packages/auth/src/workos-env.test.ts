import { describe, expect, it } from "vitest";

import { resolveWorkOSVerifyEnv } from "./workos-env";

describe("resolveWorkOSVerifyEnv", () => {
  it("defaults audience to client id and issuer to api.workos.com", () => {
    expect(
      resolveWorkOSVerifyEnv({
        WORKOS_API_KEY: " sk_test ",
        WORKOS_CLIENT_ID: " client_1 ",
      }),
    ).toEqual({
      apiKey: "sk_test",
      clientId: "client_1",
      audience: "client_1",
      issuer: "https://api.workos.com",
    });
  });

  it("honors explicit audience and issuer overrides", () => {
    expect(
      resolveWorkOSVerifyEnv({
        WORKOS_API_KEY: "sk_live",
        WORKOS_CLIENT_ID: "client_1",
        WORKOS_TOKEN_AUDIENCE: "aud_custom",
        WORKOS_TOKEN_ISSUER: "https://auth.example.test/",
      }),
    ).toEqual({
      apiKey: "sk_live",
      clientId: "client_1",
      audience: "aud_custom",
      issuer: "https://auth.example.test/",
    });
  });

  it("rejects blank client id or api key after trim", () => {
    expect(() =>
      resolveWorkOSVerifyEnv({ WORKOS_API_KEY: "sk", WORKOS_CLIENT_ID: "  " }),
    ).toThrow(/WORKOS_CLIENT_ID/);
    expect(() =>
      resolveWorkOSVerifyEnv({ WORKOS_API_KEY: " ", WORKOS_CLIENT_ID: "client_1" }),
    ).toThrow(/WORKOS_API_KEY/);
  });

  it("falls back to client id when audience override trims empty", () => {
    expect(
      resolveWorkOSVerifyEnv({
        WORKOS_API_KEY: "sk",
        WORKOS_CLIENT_ID: "client_1",
        WORKOS_TOKEN_AUDIENCE: "   ",
      }).audience,
    ).toBe("client_1");
  });
});
