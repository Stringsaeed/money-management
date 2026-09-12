import type { JWTPayload } from "jose";
import { describe, expect, it } from "vitest";

import type { WorkOSTokenVerifyConfig } from "./session";
import {
  TokenVerifyError,
  assertTokenBinding,
  sessionFromClaims,
} from "./verify-access-token";

const baseConfig = (): WorkOSTokenVerifyConfig => ({
  clientId: "client_test_trove",
  audience: "client_test_trove",
  issuer: "https://api.workos.com",
});

describe("sessionFromClaims", () => {
  it("maps subject, email, name, org, and session id from claims", () => {
    expect(
      sessionFromClaims({
        sub: "user_01",
        email: "ada@example.com",
        name: "Ada Lovelace",
        org_id: "org_01",
        sid: "session_01",
      }),
    ).toEqual({
      user: { id: "user_01", email: "ada@example.com", name: "Ada Lovelace" },
      organizationId: "org_01",
      sessionId: "session_01",
    });
  });

  it("composes name from first/last and reads organization_id or org.id", () => {
    expect(
      sessionFromClaims({
        sub: "user_02",
        first_name: "Grace",
        last_name: "Hopper",
        organization_id: "org_02",
      }),
    ).toEqual({
      user: { id: "user_02", email: "", name: "Grace Hopper" },
      organizationId: "org_02",
      sessionId: null,
    });

    expect(
      sessionFromClaims({
        sub: "user_03",
        org: { id: "org_03" },
      }),
    ).toMatchObject({ organizationId: "org_03", sessionId: null });
  });

  it("rejects missing subject", () => {
    // SAFETY: empty object is the deliberate missing-sub JWTPayload fixture.
    const emptyPayload: JWTPayload = {};
    expect(() => sessionFromClaims(emptyPayload)).toThrow(TokenVerifyError);
    expect(() => sessionFromClaims({ email: "x@example.com" })).toThrowError(
      expect.objectContaining({ code: "claim_sub" }),
    );
  });
});

describe("assertTokenBinding", () => {
  it("accepts matching audience string or array", () => {
    const config = baseConfig();
    expect(() => assertTokenBinding({ aud: config.audience }, config)).not.toThrow();
    expect(() =>
      assertTokenBinding({ aud: ["other", config.audience] }, config),
    ).not.toThrow();
  });

  it("rejects mismatched audience and missing aud when custom audience is set", () => {
    const config = baseConfig();
    expect(() => assertTokenBinding({ aud: "wrong" }, config)).toThrow(TokenVerifyError);

    const customAudience: WorkOSTokenVerifyConfig = {
      ...config,
      audience: "aud_custom",
    };
    expect(() => assertTokenBinding({ client_id: config.clientId }, customAudience)).toThrow(
      TokenVerifyError,
    );
  });

  it("binds no-aud session tokens via matching client_id", () => {
    const config = baseConfig();
    expect(() =>
      assertTokenBinding({ client_id: config.clientId }, config),
    ).not.toThrow();
    expect(() => assertTokenBinding({ client_id: "other_client" }, config)).toThrow(
      TokenVerifyError,
    );
    expect(() => assertTokenBinding({}, config)).toThrowError(
      expect.objectContaining({ code: "claim_client_id" }),
    );
  });
});
