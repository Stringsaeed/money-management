import { exportJWK, type JSONWebKeySet } from "jose";

import { importPowerSyncPrivateKey, POWERSYNC_JWT_ALGORITHM } from "./key";

export interface PowerSyncJwksInput {
  readonly kid: string;
  readonly privateKey: string;
}

export async function createPowerSyncJwks(input: PowerSyncJwksInput): Promise<JSONWebKeySet> {
  if (!input.kid.trim()) throw new Error("POWERSYNC_JWT_KID must not be empty.");
  const privateJwk = await exportJWK(await importPowerSyncPrivateKey(input.privateKey, true));
  if (privateJwk.kty !== "EC" || privateJwk.crv !== "P-256" || !privateJwk.x || !privateJwk.y) {
    throw new Error("POWERSYNC_JWT_PRIVATE_KEY must be an ES256 P-256 key.");
  }
  return {
    keys: [
      {
        alg: POWERSYNC_JWT_ALGORITHM,
        crv: "P-256",
        kid: input.kid,
        kty: "EC",
        use: "sig",
        x: privateJwk.x,
        y: privateJwk.y,
      },
    ],
  };
}

export async function createPowerSyncJwksResponse(input: PowerSyncJwksInput): Promise<Response> {
  return Response.json(await createPowerSyncJwks(input), {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
