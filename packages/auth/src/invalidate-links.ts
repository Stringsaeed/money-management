import type { createDb } from "@trove/db";
import { verification } from "@trove/db/schema/auth";
import { and, eq, inArray, like, ne } from "drizzle-orm";

import { isPriorMagicVerification } from "./link-policy";

type TroveDb = ReturnType<typeof createDb>;

export async function invalidatePriorMagicLinks(
  db: TroveDb,
  email: string,
  keepIdentifier: string,
): Promise<void> {
  const candidates = await db
    .select({
      id: verification.id,
      identifier: verification.identifier,
      value: verification.value,
    })
    .from(verification);
  const priorIds = candidates
    .filter((row) => isPriorMagicVerification(row, email, keepIdentifier))
    .map(({ id }) => id);

  if (priorIds.length > 0) {
    await db.delete(verification).where(inArray(verification.id, priorIds));
  }
}

export async function invalidatePriorResetLinks(
  db: TroveDb,
  userId: string,
  keepIdentifier: string,
): Promise<void> {
  await db
    .delete(verification)
    .where(
      and(
        like(verification.identifier, "reset-password:%"),
        eq(verification.value, userId),
        ne(verification.identifier, keepIdentifier),
      ),
    );
}
