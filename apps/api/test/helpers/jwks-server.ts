/**
 * Test helpers: a throwaway JWKS endpoint plus ES256 token signing, mirroring
 * how Supabase publishes keys and issues access tokens (custom access token
 * hook claims included) so the middleware under test exercises real
 * signature/issuer/expiry verification against a remote key set.
 */
import { createServer, type Server } from "node:http";

import { exportJWK, generateKeyPair, SignJWT } from "jose";

import { supabaseIssuer } from "../../src/config.js";

export interface JwksServer {
  supabaseUrl: string;
  issuer: string;
  jwksUrl: string;
  signToken(claims: Record<string, unknown>, overrides?: TokenOverrides): Promise<string>;
  close(): Promise<void>;
}

export interface TokenOverrides {
  subject?: string;
  issuer?: string;
  expiresInSeconds?: number;
}

export async function startJwksServer(): Promise<JwksServer> {
  const pair = await generateKeyPair("ES256", { extractable: true });
  const kid = "test-key-1";
  const publicJwk = { ...(await exportJWK(pair.publicKey)), kid, alg: "ES256", use: "sig" };
  const jwksBody = JSON.stringify({ keys: [publicJwk] });

  const server: Server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(jwksBody);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string")
    throw new Error("Failed to bind JWKS test server.");
  const supabaseUrl = `http://127.0.0.1:${address.port}`;

  return {
    supabaseUrl,
    issuer: supabaseIssuer(supabaseUrl),
    jwksUrl: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
    async signToken(claims, overrides = {}) {
      const builder = new SignJWT({ ...claims }).setProtectedHeader({ alg: "ES256", kid });
      if (!("sub" in claims)) builder.setSubject(overrides.subject ?? "user-123");
      builder
        .setIssuedAt()
        .setIssuer(overrides.issuer ?? supabaseIssuer(supabaseUrl))
        .setExpirationTime(`${overrides.expiresInSeconds ?? 3600}s`);
      return builder.sign(pair.privateKey);
    },
    async close() {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}

/** Claims shape produced by Supabase's custom access token hook. */
export function hookClaims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    household_roles: { "11111111-1111-1111-1111-111111111111": "owner" },
    active_household_id: "11111111-1111-1111-1111-111111111111",
    ...overrides,
  };
}
