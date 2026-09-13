import { afterEach, describe, expect, it, vi } from "vitest";

import {
  claimPresenceFlags,
  formatTokenVerifyFailureLog,
  logTokenVerifyFailure,
  tokenVerifyFailureDiag,
} from "./token-verify-diagnostics";

type JwtFixturePayload = {
  readonly sub: string;
  readonly aud?: string;
  readonly client_id?: string;
};

/** Unsigned compact JWT for presence-flag tests only (header.payload.). */
function unsignedJwt(payload: JwtFixturePayload): string {
  return `${base64UrlJson({ alg: "none", typ: "JWT" })}.${base64UrlJson(payload)}.`;
}

function base64UrlJson(
  value: JwtFixturePayload | { readonly alg: string; readonly typ: string },
): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

describe("tokenVerifyFailureDiag", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("surfaces verify failure code plus redacted claim presence without the token", () => {
    const token = unsignedJwt({
      sub: "user_diag",
      client_id: "client_test",
    });

    const diag = tokenVerifyFailureDiag("claim_aud", token);

    expect(diag).toEqual({
      code: "claim_aud",
      payloadDecoded: true,
      hasAud: false,
      hasClientId: true,
    });

    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logTokenVerifyFailure(diag);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      "access_token_verify_failed code=claim_aud hasAud=false hasClientId=true payloadDecoded=true",
    );

    const serialized = JSON.stringify(spy.mock.calls);
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain("user_diag");
    expect(serialized).not.toContain("client_test");
  });

  it("puts the stable code in the first (and only) console argument string", () => {
    const line = formatTokenVerifyFailureLog({
      code: "missing_token",
      payloadDecoded: false,
      hasAud: false,
      hasClientId: false,
    });
    expect(line).toBe(
      "access_token_verify_failed code=missing_token hasAud=false hasClientId=false payloadDecoded=false",
    );
  });

  it("marks aud present when the unverified payload includes aud", () => {
    const token = unsignedJwt({
      sub: "user_aud",
      aud: "https://api.example.test",
    });
    expect(claimPresenceFlags(token)).toEqual({
      payloadDecoded: true,
      hasAud: true,
      hasClientId: false,
    });
  });

  it("maps verification_unavailable without leaking surrounding messages or the token", () => {
    const token = unsignedJwt({ sub: "user_x", client_id: "client_x" });
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const diag = tokenVerifyFailureDiag("verification_unavailable", token);
    logTokenVerifyFailure(diag);

    expect(diag.code).toBe("verification_unavailable");
    const serialized = JSON.stringify(spy.mock.calls);
    expect(serialized).not.toContain("WORKOS_API_KEY");
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain("client_x");
  });

  it("handles undecodable tokens with payloadDecoded false", () => {
    expect(claimPresenceFlags("not-a-jwt")).toEqual({
      payloadDecoded: false,
      hasAud: false,
      hasClientId: false,
    });
  });
});
