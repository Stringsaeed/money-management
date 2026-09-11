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
  options?: {
    readonly audience?: string | false;
    readonly issuer?: string;
    readonly expired?: boolean;
  },
) {
  const now = Math.floor(Date.now() / 1000);
  let builder = new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: KID, typ: "JWT" })
    .setIssuer(options?.issuer ?? ISSUER)
    .setSubject(String(claims.sub))
    .setIssuedAt(now - 5)
    .setExpirationTime(options?.expired ? now - 60 : now + 300);

  // WorkOS AuthKit session tokens omit `aud` by default. Only set it when asked.
  if (options?.audience !== false) {
    builder = builder.setAudience(options?.audience ?? CLIENT_ID);
  }

  return builder.sign(privateKey);
}

describe("verifyAccessToken", () => {
  it("accepts personal tokens without an organization", async () => {
    const { privateKey, jwks } = await testKeys();
    const token = await sign(privateKey, {
      sub: "user_01PERSONAL",
      email: "ada@trove.ing",
      name: "Ada",
      client_id: CLIENT_ID,
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

  it("accepts WorkOS-shaped session tokens that omit aud and bind via client_id", async () => {
    const { privateKey, jwks } = await testKeys();
    const token = await sign(
      privateKey,
      {
        sub: "user_01SESSION",
        email: "session@trove.ing",
        name: "Session",
        client_id: CLIENT_ID,
        sid: "session_01TEST",
      },
      { audience: false },
    );

    await expect(
      verifyAccessToken(token, {
        clientId: CLIENT_ID,
        audience: CLIENT_ID,
        issuer: ISSUER,
        jwks,
      }),
    ).resolves.toEqual({
      user: { id: "user_01SESSION", email: "session@trove.ing", name: "Session" },
      organizationId: null,
      sessionId: "session_01TEST",
    });
  });

  it("accepts WorkOS docs-shaped session tokens with client_id and no aud", async () => {
    // https://workos.com/docs/reference/authkit/session-tokens/access-token
    const { privateKey, jwks } = await testKeys();
    const token = await sign(
      privateKey,
      {
        sub: "user_01HBEQKA6K4QJAS93VPE39W1JT",
        client_id: CLIENT_ID,
        org_id: "org_01HRDMC6CM357W30QMHMQ96Q0S",
        role: "member",
        roles: ["member"],
        permissions: ["posts:read"],
        sid: "session_01HQSXZGF8FHF7A9ZZFCW4387R",
        jti: "01HQSXZXPPFPKMDD32RKTFY6PV",
      },
      { audience: false },
    );

    await expect(
      verifyAccessToken(token, {
        clientId: CLIENT_ID,
        audience: CLIENT_ID,
        issuer: ISSUER,
        jwks,
      }),
    ).resolves.toMatchObject({
      user: { id: "user_01HBEQKA6K4QJAS93VPE39W1JT" },
      organizationId: "org_01HRDMC6CM357W30QMHMQ96Q0S",
      sessionId: "session_01HQSXZGF8FHF7A9ZZFCW4387R",
    });
  });

  it("accepts no-aud session tokens that omit client_id after JWKS verify", async () => {
    // Env client ids can match while the JWT still lacks client_id — #242 still 401'd.
    const { privateKey, jwks } = await testKeys();
    const token = await sign(
      privateKey,
      {
        sub: "user_01NOCLIENT",
        email: "noclient@trove.ing",
        sid: "session_01NOCLIENT",
      },
      { audience: false },
    );

    await expect(
      verifyAccessToken(token, {
        clientId: CLIENT_ID,
        audience: CLIENT_ID,
        issuer: ISSUER,
        jwks,
      }),
    ).resolves.toEqual({
      user: { id: "user_01NOCLIENT", email: "noclient@trove.ing", name: "noclient@trove.ing" },
      organizationId: null,
      sessionId: "session_01NOCLIENT",
    });
  });

  it("rejects mismatched client_id on no-aud session tokens", async () => {
    const { privateKey, jwks } = await testKeys();

    const wrongClient = await sign(
      privateKey,
      {
        sub: "user_01WRONGCLIENT",
        email: "wrong@trove.ing",
        client_id: "client_other",
      },
      { audience: false },
    );
    await expect(
      verifyAccessToken(wrongClient, {
        clientId: CLIENT_ID,
        audience: CLIENT_ID,
        issuer: ISSUER,
        jwks,
      }),
    ).rejects.toMatchObject({ code: "claim_client_id" });
  });

  it("rejects no-aud tokens when sticky custom WORKOS_TOKEN_AUDIENCE is set", async () => {
    const { privateKey, jwks } = await testKeys();
    const apiAudience = "https://api.trove.ing";

    const noAud = await sign(
      privateKey,
      {
        sub: "user_01CUSTOMAUD",
        email: "custom@trove.ing",
        client_id: CLIENT_ID,
      },
      { audience: false },
    );
    await expect(
      verifyAccessToken(noAud, {
        clientId: CLIENT_ID,
        audience: apiAudience,
        issuer: ISSUER,
        jwks,
      }),
    ).rejects.toMatchObject({ code: "claim_aud" });

    const withAud = await sign(
      privateKey,
      {
        sub: "user_01CUSTOMAUD",
        email: "custom@trove.ing",
        client_id: CLIENT_ID,
      },
      { audience: apiAudience },
    );
    await expect(
      verifyAccessToken(withAud, {
        clientId: CLIENT_ID,
        audience: apiAudience,
        issuer: ISSUER,
        jwks,
      }),
    ).resolves.toMatchObject({ user: { id: "user_01CUSTOMAUD" } });
  });

  it("rejects forged signatures and wrong audiences", async () => {
    const good = await testKeys();
    const other = await testKeys();
    const token = await sign(good.privateKey, {
      sub: "user_01FORGED",
      email: "forged@trove.ing",
      client_id: CLIENT_ID,
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
      { sub: "user_01AUD", email: "aud@trove.ing", client_id: CLIENT_ID },
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
      { sub: "user_01ISS", email: "iss@trove.ing", client_id: CLIENT_ID },
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
      { sub: "user_01EXP", email: "exp@trove.ing", client_id: CLIENT_ID },
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
    const noSub = await new SignJWT({ email: "nosub@trove.ing", client_id: CLIENT_ID })
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
