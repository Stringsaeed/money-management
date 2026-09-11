import { describe, expect, it } from "vitest";

import {
  DEFAULT_WORKOS_TOKEN_ISSUER,
  issuerVariants,
  resolveIssuerCandidates,
  resolveWorkOSVerifyEnv,
} from "./workos-env";

describe("resolveIssuerCandidates", () => {
  it("always includes api.workos.com slash twins plus configured issuer", () => {
    expect(resolveIssuerCandidates({ issuer: DEFAULT_WORKOS_TOKEN_ISSUER })).toEqual(
      expect.arrayContaining(["https://api.workos.com", "https://api.workos.com/"]),
    );
  });

  it("adds custom auth hostname issuers used by AuthKit custom domains", () => {
    const issuers = resolveIssuerCandidates({
      issuer: DEFAULT_WORKOS_TOKEN_ISSUER,
      authHostname: "auth.trove.ing",
    });
    expect(issuers).toEqual(
      expect.arrayContaining([
        "https://api.workos.com",
        "https://api.workos.com/",
        "https://auth.trove.ing",
        "https://auth.trove.ing/",
      ]),
    );
  });

  it("adds User Management client issuers seen by AuthKit integrations", () => {
    const issuers = resolveIssuerCandidates({
      issuer: DEFAULT_WORKOS_TOKEN_ISSUER,
      clientId: "client_test_123",
    });
    expect(issuers).toEqual(
      expect.arrayContaining([
        "https://api.workos.com/user_management/client_test_123",
        "https://api.workos.com/user_management/client_test_123/",
      ]),
    );
  });

  it("strips scheme from authHostname if pasted as a URL", () => {
    expect(
      resolveIssuerCandidates({
        issuer: DEFAULT_WORKOS_TOKEN_ISSUER,
        authHostname: "https://auth.trove.ing/",
      }),
    ).toEqual(expect.arrayContaining(["https://auth.trove.ing", "https://auth.trove.ing/"]));
  });
});

describe("issuerVariants", () => {
  it("returns slash twins", () => {
    expect(issuerVariants("https://api.workos.com")).toEqual([
      "https://api.workos.com",
      "https://api.workos.com/",
    ]);
    expect(issuerVariants("https://api.workos.com/")).toEqual([
      "https://api.workos.com/",
      "https://api.workos.com",
    ]);
  });
});

describe("resolveWorkOSVerifyEnv", () => {
  it("passes through WORKOS_AUTH_HOSTNAME", () => {
    expect(
      resolveWorkOSVerifyEnv({
        WORKOS_API_KEY: "sk_test",
        WORKOS_CLIENT_ID: "client_test",
        WORKOS_AUTH_HOSTNAME: "auth.trove.ing",
      }),
    ).toMatchObject({
      issuer: DEFAULT_WORKOS_TOKEN_ISSUER,
      authHostname: "auth.trove.ing",
    });
  });
});
