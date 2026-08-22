/**
 * Client-side invite code helpers: normalization, format validation, and
 * expiry display. Mirrors the server alphabet in
 * packages/api/src/lib/household-rules.ts — keep them in sync.
 */

export const INVITE_CODE_LENGTH = 8;
export const INVITE_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Trims surrounding space and uppercases a user-typed invite code. */
export function normalizeInviteCode(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidInviteCodeFormat(code: string): boolean {
  if (code.length !== INVITE_CODE_LENGTH) return false;
  return [...code].every((char) => INVITE_CODE_ALPHABET.includes(char));
}

/** Human-friendly countdown shown under an active invite code. */
export function formatInviteExpiry(expiresAt: Date, now: Date = new Date()): string {
  const msLeft = expiresAt.getTime() - now.getTime();
  if (msLeft <= 0) return "Expired";
  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  if (daysLeft <= 1) return "Expires today";
  return `Expires in ${daysLeft} days`;
}
