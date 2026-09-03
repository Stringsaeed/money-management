import { z } from "zod";

export const LINK_TTL_SECONDS = 15 * 60;
export const AUTH_PUBLIC_URL = "https://auth.trove.ing";

export interface VerificationRow {
  readonly id: string;
  readonly identifier: string;
  readonly value: string;
}

const magicVerificationValueSchema = z.object({
  email: z.string(),
});

export function emailFromMagicVerificationValue(value: string): string | null {
  try {
    const parsed = magicVerificationValueSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function isPriorMagicVerification(
  row: VerificationRow,
  email: string,
  keepIdentifier: string,
): boolean {
  if (row.identifier === keepIdentifier) return false;
  return emailFromMagicVerificationValue(row.value) === email.toLowerCase();
}

export function isPriorResetVerification(
  row: VerificationRow,
  userId: string,
  keepIdentifier: string,
): boolean {
  if (row.identifier === keepIdentifier) return false;
  return row.identifier.startsWith("reset-password:") && row.value === userId;
}
