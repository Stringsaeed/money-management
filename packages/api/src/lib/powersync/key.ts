import { importPKCS8 } from "jose";

export const POWERSYNC_JWT_ALGORITHM = "ES256";

export async function importPowerSyncPrivateKey(
  privateKey: string,
  extractable = false,
): Promise<CryptoKey> {
  const normalized = privateKey.trim().replaceAll("\\n", "\n");
  if (!normalized.startsWith("-----BEGIN PRIVATE KEY-----")) {
    throw new Error("POWERSYNC_JWT_PRIVATE_KEY must be a PKCS#8 PEM private key.");
  }
  return importPKCS8(normalized, POWERSYNC_JWT_ALGORITHM, { extractable });
}
