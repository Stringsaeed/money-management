import { generateKeyPair, SignJWT } from "jose";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { createJwtVerifier } from "../src/auth/jwt.js";
import { hookClaims, startJwksServer, type JwksServer } from "./helpers/jwks-server.js";

describe("GET /health", () => {
  it("returns 200 with service status without authentication", async () => {
    const jwks = await startJwksServer();
    try {
      const app = createApp({ jwtVerifier: createJwtVerifier(jwks) });
      const response = await app.request("/health");

      expect(response.status).toBe(200);
      const body = (await response.json()) as Record<string, unknown>;
      expect(body.status).toBe("ok");
      expect(body.service).toBe("trove-api");
    } finally {
      await jwks.close();
    }
  });
});

describe("JWT verification middleware", () => {
  let jwks: JwksServer;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    jwks = await startJwksServer();
    app = createApp({ jwtVerifier: createJwtVerifier(jwks) });
  });

  afterAll(async () => {
    await jwks.close();
  });

  async function requestMe(token?: string): Promise<Response> {
    return app.request("/me", token ? { headers: { authorization: `Bearer ${token}` } } : {});
  }

  it("rejects requests without a bearer token with 401", async () => {
    const response = await requestMe();
    expect(response.status).toBe(401);
    expect(((await response.json()) as Record<string, unknown>).error).toBe("unauthorized");
  });

  it("rejects malformed tokens with 401", async () => {
    const response = await requestMe("not-a-jwt");
    expect(response.status).toBe(401);
  });

  it("rejects tokens signed by a key not in the JWKS with 401", async () => {
    // Same `kid` as the published key but a different private key: signature must fail.
    const foreign = await generateKeyPair("ES256", { extractable: true });
    const token = await new SignJWT(hookClaims())
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject("user-123")
      .setIssuedAt()
      .setIssuer(jwks.issuer)
      .setExpirationTime("1h")
      .sign(foreign.privateKey);
    expect((await requestMe(token)).status).toBe(401);
  });

  it("rejects tokens from a foreign issuer with 401", async () => {
    const token = await jwks.signToken(hookClaims(), {
      issuer: "https://evil.example.com/auth/v1",
    });
    expect((await requestMe(token)).status).toBe(401);
  });

  it("rejects expired tokens with 401", async () => {
    const token = await jwks.signToken(hookClaims(), { expiresInSeconds: -10 });
    expect((await requestMe(token)).status).toBe(401);
  });

  it("accepts a valid Supabase-shaped JWT and exposes claims to route handlers", async () => {
    const token = await jwks.signToken(
      hookClaims({
        household_roles: { "22222222-2222-2222-2222-222222222222": "member" },
        active_household_id: "22222222-2222-2222-2222-222222222222",
      }),
    );

    const response = await requestMe(token);
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      userId: string;
      householdRoles: Record<string, string>;
      activeHouseholdId: string | null;
    };
    expect(body.userId).toBe("user-123");
    expect(body.householdRoles).toEqual({ "22222222-2222-2222-2222-222222222222": "member" });
    expect(body.activeHouseholdId).toBe("22222222-2222-2222-2222-222222222222");
  });

  it("treats missing or malformed household claims as an empty role map rather than failing", async () => {
    const token = await jwks.signToken({ household_roles: "garbage" });

    const response = await requestMe(token);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { householdRoles: Record<string, string> };
    expect(body.householdRoles).toEqual({});
  });
});
