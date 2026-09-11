import { asc, eq } from "drizzle-orm";

import { envelope } from "@trove/db/schema/budget";

import type { CommandDatabase } from "../commands/types";
import { requireLedgerAccess, type LedgerCaller } from "../require-member";

export interface EnvelopeSummary {
  readonly id: string;
  readonly currency: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly lifecycle: "active" | "archived";
  readonly sortOrder: number;
  readonly version: number;
}

/** Lists the ledger's envelopes; any authorized reader may see them (viewer included). */
export async function listEnvelopes(
  db: CommandDatabase,
  caller: LedgerCaller,
): Promise<EnvelopeSummary[]> {
  await requireLedgerAccess(db, caller.userId, caller.ledgerId);
  return db
    .select({
      id: envelope.id,
      currency: envelope.currency,
      name: envelope.name,
      icon: envelope.icon,
      color: envelope.color,
      lifecycle: envelope.lifecycle,
      sortOrder: envelope.sortOrder,
      version: envelope.version,
    })
    .from(envelope)
    .where(eq(envelope.ledgerId, caller.ledgerId))
    .orderBy(asc(envelope.sortOrder), asc(envelope.name));
}
