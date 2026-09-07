import { SignJWT } from "jose";

import { importPowerSyncPrivateKey, POWERSYNC_JWT_ALGORITHM } from "./key";

const TOKEN_TTL_SECONDS = 30 * 60;

export interface PowerSyncTokenInput {
  readonly audience: string;
  readonly kid: string;
  readonly privateKey: string;
  readonly userId: string;
  readonly now?: Date;
}

export async function signPowerSyncToken(input: PowerSyncTokenInput): Promise<string> {
  assertTokenInput(input);
  const issuedAt = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const key = await importPowerSyncPrivateKey(input.privateKey);
  return new SignJWT({})
    .setProtectedHeader({ alg: POWERSYNC_JWT_ALGORITHM, kid: input.kid, typ: "JWT" })
    .setSubject(input.userId)
    .setAudience(input.audience)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + TOKEN_TTL_SECONDS)
    .sign(key);
}

function assertTokenInput(input: PowerSyncTokenInput): void {
  if (!input.userId.trim()) throw new Error("PowerSync tokens require an authenticated user id.");
  if (!input.kid.trim()) throw new Error("POWERSYNC_JWT_KID must not be empty.");
  const audience = new URL(input.audience);
  if (audience.protocol !== "https:" && audience.hostname !== "localhost") {
    throw new Error("POWERSYNC_URL must use HTTPS outside local development.");
  }
}
