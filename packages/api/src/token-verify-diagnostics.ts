import { type TokenVerifyFailureCode } from "@trove/auth";
import { decodeJwt } from "jose";
import { z } from "zod";

/** Redacted Worker log fields when access-token verify fails. Never includes token or claim values. */
export type TokenVerifyFailureDiag = {
  readonly code: TokenVerifyFailureCode;
  /** False when the compact JWT payload segment could not be decoded. */
  readonly payloadDecoded: boolean;
  readonly hasAud: boolean;
  readonly hasClientId: boolean;
};

export type ClaimPresenceFlags = {
  readonly payloadDecoded: boolean;
  readonly hasAud: boolean;
  readonly hasClientId: boolean;
};

/**
 * Build a redacted diagnostic for a known verify failure code.
 * Decodes the JWT payload without verifying signature — only boolean claim presence.
 */
export function tokenVerifyFailureDiag(
  code: TokenVerifyFailureCode,
  token: string,
): TokenVerifyFailureDiag {
  return {
    code,
    ...claimPresenceFlags(token),
  };
}

/**
 * Single-string Worker log line. Cloudflare Observability often surfaces only
 * the first console argument's text for Errors/objects — keep code in the string.
 */
export function formatTokenVerifyFailureLog(diag: TokenVerifyFailureDiag): string {
  return (
    `access_token_verify_failed code=${diag.code}` +
    ` hasAud=${diag.hasAud}` +
    ` hasClientId=${diag.hasClientId}` +
    ` payloadDecoded=${diag.payloadDecoded}`
  );
}

export function logTokenVerifyFailure(diag: TokenVerifyFailureDiag): void {
  console.error(formatTokenVerifyFailureLog(diag));
}

export function claimPresenceFlags(token: string): ClaimPresenceFlags {
  try {
    const payload = decodeJwt(token);
    const clientId = z.string().min(1).safeParse(payload.client_id);
    return {
      payloadDecoded: true,
      hasAud: payload.aud !== undefined,
      hasClientId: clientId.success,
    } satisfies ClaimPresenceFlags;
  } catch {
    return {
      payloadDecoded: false,
      hasAud: false,
      hasClientId: false,
    } satisfies ClaimPresenceFlags;
  }
}
