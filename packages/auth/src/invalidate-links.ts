import type { createDb } from "@trove/db";
import { verification } from "@trove/db/schema/auth";
import { and, eq, like, ne, sql } from "drizzle-orm";

type TroveDb = ReturnType<typeof createDb>;

export async function invalidatePriorMagicLinks(
  db: TroveDb,
  email: string,
  keepIdentifier: string,
): Promise<void> {
  await db
    .delete(verification)
    .where(
      and(
        sql`lower(json_extract(${verification.value}, '$.email')) = ${email.toLowerCase()}`,
        ne(verification.identifier, keepIdentifier),
      ),
    );
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
