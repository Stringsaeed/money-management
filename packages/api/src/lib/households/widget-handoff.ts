import { and, eq, gt, isNull } from "drizzle-orm";

import { household, widgetHandoff } from "@trove/db/schema/household";

import type { CommandDatabase } from "../commands/types";

/** How long a handoff code stays exchangeable. Long enough for a browser to open, no longer. */
export const WIDGET_HANDOFF_TTL_MS = 120_000;

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function generateHandoffCode(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashHandoffCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return base64Url(new Uint8Array(digest));
}

/**
 * Records a one-time handoff for an already authorized admin. The caller has
 * verified the admin role; this only binds the code to that identity and
 * Organization so the exchange can never widen it.
 */
export async function issueWidgetHandoff(
  db: CommandDatabase,
  input: { readonly userId: string; readonly organizationId: string; readonly now: Date },
): Promise<{ readonly code: string; readonly expiresAt: Date }> {
  const code = generateHandoffCode();
  const expiresAt = new Date(input.now.getTime() + WIDGET_HANDOFF_TTL_MS);
  await db.insert(widgetHandoff).values({
    codeHash: await hashHandoffCode(code),
    userId: input.userId,
    organizationId: input.organizationId,
    expiresAt,
  });
  return { code, expiresAt };
}

export interface ConsumedHandoff {
  readonly userId: string;
  readonly organizationId: string;
  readonly householdName: string;
}

/**
 * Consumes a handoff code exactly once. The conditional update is the
 * single-use guarantee: two concurrent exchanges cannot both see an
 * unconsumed row.
 */
export async function consumeWidgetHandoff(
  db: CommandDatabase,
  code: string,
  now: Date,
): Promise<ConsumedHandoff | null> {
  const codeHash = await hashHandoffCode(code);
  const consumed = await db
    .update(widgetHandoff)
    .set({ consumedAt: now })
    .where(
      and(
        eq(widgetHandoff.codeHash, codeHash),
        isNull(widgetHandoff.consumedAt),
        gt(widgetHandoff.expiresAt, now),
      ),
    )
    .returning({ userId: widgetHandoff.userId, organizationId: widgetHandoff.organizationId });
  const row = consumed[0];
  if (!row) return null;
  const households = await db
    .select({ name: household.name })
    .from(household)
    .where(eq(household.id, row.organizationId))
    .limit(1);
  const found = households[0];
  if (!found) return null;
  return { userId: row.userId, organizationId: row.organizationId, householdName: found.name };
}
