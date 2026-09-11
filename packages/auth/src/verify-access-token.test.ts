import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";

import {
  TokenVerifyError,
  jwksUrlForClient,
  readBearerToken,
  verifyAccessToken,
} from "./verify-access-token";
import { decideWidgetToken } from "./widget-contract";

const CLIENT_ID = "client_test_trove_225";
const ISSUER = "https://api.workos.com";
const KID = "test_workos_key_225";

async function testKeys() {
  const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
  const jwk = await exportJWK(publicKey);
  const { createLocalJWKSet } = await import("jose");
  return {
    privateKey,
    jwks: createLocalJWKSet({
      keys: [{ ...jwk, kid: KID, alg: "RS256", use: "sig" }],
    }),
  };
}

async function sign(
  privateKey: CryptoKey,
  claims: Record<string, unknown>,
  options?: { readonly audience?: string; readonly issuer?: string; readonly expired?: boolean },
) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: KID, typ: "JWT" })
    .setIssuer(options?.issuer ?? ISSUER)
    .setAudience(options?.audience ?? CLIENT_ID)
    .setSubject(String(claims.sub))
    .setIssuedAt(now - 5)
    .setExpirationTime(options?.expired ? now - 60 : now + 300)
    .sign(privateKey);
}

describe("verifyAccessToken", () => {
  it("accepts personal tokens without an organization", async () => {
    const { privateKey, jwks } = await testKeys();
    const token = await sign(privateKey, {
      sub: "user_01PERSONAL",
      email: "ada@trove.ing",
      name: "Ada",
    });

    await expect(
      verifyAccessToken(token, {
        clientId: CLIENT_ID,
        audience: CLIENT_ID,
        issuer: ISSUER,
        jwks,
      }),
    ).resolves.toEqual({
      user: { id: "user_01PERSONAL", email: "ada@trove.ing", name: "Ada" },
      organizationId: null,
      sessionId: null,
    });
  });

  it("rejects forged signatures and wrong audiences", async () => {
    const good = await testKeys();
    const other = await testKeys();
    const token = await sign(good.privateKey, {
      sub: "user_01FORGED",
      email: "forged@trove.ing",
    });

    await expect(
      verifyAccessToken(token, {
        clientId: CLIENT_ID,
        audience: CLIENT_ID,
        issuer: ISSUER,
        jwks: other.jwks,
      }),
    ).rejects.toBeInstanceOf(TokenVerifyError);

    const wrongAud = await sign(
      good.privateKey,
      { sub: "user_01AUD", email: "aud@trove.ing" },
      { audience: "not-the-client" },
    );
    await expect(
      verifyAccessToken(wrongAud, {
        clientId: CLIENT_ID,
        audience: CLIENT_ID,
        issuer: ISSUER,
        jwks: good.jwks,
      }),
    ).rejects.toMatchObject({ code: "claim_aud" });
  });

  it("rejects wrong issuer, expiry, and missing subject", async () => {
    const { privateKey, jwks } = await testKeys();

    const wrongIss = await sign(
      privateKey,
      { sub: "user_01ISS", email: "iss@trove.ing" },
      { issuer: "https://evil.example" },
    );
    await expect(
      verifyAccessToken(wrongIss, {
        clientId: CLIENT_ID,
        audience: CLIENT_ID,
        issuer: ISSUER,
        jwks,
      }),
    ).rejects.toMatchObject({ code: "claim_iss" });

    const expired = await sign(
      privateKey,
      { sub: "user_01EXP", email: "exp@trove.ing" },
      { expired: true },
    );
    // clockTolerance is 5s; expire far enough in the past.
    await expect(
      verifyAccessToken(expired, {
        clientId: CLIENT_ID,
        audience: CLIENT_ID,
        issuer: ISSUER,
        jwks,
      }),
    ).rejects.toMatchObject({ code: "expired" });

    const now = Math.floor(Date.now() / 1000);
    const noSub = await new SignJWT({ email: "nosub@trove.ing" })
      .setProtectedHeader({ alg: "RS256", kid: KID, typ: "JWT" })
      .setIssuer(ISSUER)
      .setAudience(CLIENT_ID)
      .setIssuedAt(now)
      .setExpirationTime(now + 60)
      .sign(privateKey);
    await expect(
      verifyAccessToken(noSub, {
        clientId: CLIENT_ID,
        audience: CLIENT_ID,
        issuer: ISSUER,
        jwks,
      }),
    ).rejects.toMatchObject({ code: "claim_sub" });
  });

  it("parses bearer headers and publishes the live JWKS URL shape", () => {
    expect(readBearerToken("Bearer abc.def")).toBe("abc.def");
    expect(readBearerToken(null)).toBeNull();
    expect(jwksUrlForClient(CLIENT_ID).toString()).toBe(
      `https://api.workos.com/sso/jwks/${CLIENT_ID}`,
    );
  });
});

describe("decideWidgetToken", () => {
  it("mints only for organization admins", () => {
    expect(decideWidgetToken({ userId: "user_1", organizationId: "org_1", role: "admin" })).toEqual(
      { kind: "mint", userId: "user_1", organizationId: "org_1" },
    );
    expect(
      decideWidgetToken({ userId: "user_1", organizationId: "org_1", role: "viewer" }),
    ).toEqual({ kind: "deny", reason: "not_admin" });
  });
});
