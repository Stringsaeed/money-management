import {
  createLocalJWKSet,
  decodeJwt,
  decodeProtectedHeader,
  exportPKCS8,
  generateKeyPair,
  jwtVerify,
} from "jose";
import { describe, expect, it } from "vitest";

import { createPowerSyncJwks, createPowerSyncJwksResponse } from "./jwks";
import { signPowerSyncToken } from "./token";

const AUDIENCE = "https://example.powersync.journeyapps.com";
const KID = "trove-powersync-2026-09";
const USER_ID = "user-1";
const NOW = new Date("2026-09-07T12:00:00.000Z");

async function privateKeyPem(): Promise<string> {
  const { privateKey } = await generateKeyPair("ES256", { extractable: true });
  return exportPKCS8(privateKey);
}

describe("PowerSync JWT", () => {
  it("signs the required ES256 claims for exactly 30 minutes", async () => {
    const privateKey = await privateKeyPem();
    const token = await signPowerSyncToken({
      audience: AUDIENCE,
      kid: KID,
      privateKey,
      userId: USER_ID,
      now: NOW,
    });

    expect(decodeProtectedHeader(token)).toEqual({ alg: "ES256", kid: KID, typ: "JWT" });
    const payload = decodeJwt(token);
    expect(payload.sub).toBe(USER_ID);
    expect(payload.aud).toBe(AUDIENCE);
    expect(payload.iat).toBe(Math.floor(NOW.getTime() / 1000));
    expect(payload.exp).toBe(payload.iat! + 30 * 60);
  });

  it("publishes only the matching P-256 public key and verifies the token", async () => {
    const privateKey = await privateKeyPem();
    const jwks = await createPowerSyncJwks({ kid: KID, privateKey });
    const token = await signPowerSyncToken({
      audience: AUDIENCE,
      kid: KID,
      privateKey,
      userId: USER_ID,
      now: NOW,
    });

    expect(jwks).toMatchObject({
      keys: [{ alg: "ES256", crv: "P-256", kid: KID, kty: "EC", use: "sig" }],
    });
    expect(jwks.keys[0]).not.toHaveProperty("d");
    await expect(
      jwtVerify(token, createLocalJWKSet(jwks), { audience: AUDIENCE, currentDate: NOW }),
    ).resolves.toHaveProperty("payload.sub", USER_ID);
  });

  it("serves a cacheable public JWKS without private coordinates", async () => {
    const response = await createPowerSyncJwksResponse({
      kid: KID,
      privateKey: await privateKeyPem(),
    });

    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
    const body = await response.json();
    expect(body).toMatchObject({ keys: [{ kid: KID, kty: "EC", use: "sig" }] });
    expect(body.keys[0]).not.toHaveProperty("d");
  });

  it("rejects non-HTTPS cloud audiences", async () => {
    await expect(
      signPowerSyncToken({
        audience: "http://powersync.example.test",
        kid: KID,
        privateKey: await privateKeyPem(),
        userId: USER_ID,
        now: NOW,
      }),
    ).rejects.toThrow("POWERSYNC_URL must use HTTPS outside local development.");
  });
});
