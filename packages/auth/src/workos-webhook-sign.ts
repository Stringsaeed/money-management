import { createHmac } from "node:crypto";

/**
 * Builds a WorkOS-compatible `WorkOS-Signature` header value for a raw JSON body.
 * Matches `@workos-inc/node` webhook verification: HMAC-SHA256 hex over
 * `${timestampMs}.${payload}` with the webhook secret as a UTF-8 string.
 * Timestamp is unix **milliseconds** (SDK compares against `Date.now()`).
 */
export function signWorkOSWebhookPayload(input: {
  readonly payload: string;
  readonly secret: string;
  /** Unix milliseconds; defaults to now. */
  readonly timestampMs?: number;
}): string {
  const timestampMs = input.timestampMs ?? Date.now();
  const signedPayload = `${timestampMs}.${input.payload}`;
  const signatureHash = createHmac("sha256", input.secret)
    .update(signedPayload, "utf8")
    .digest("hex");
  return `t=${timestampMs},v1=${signatureHash}`;
}
