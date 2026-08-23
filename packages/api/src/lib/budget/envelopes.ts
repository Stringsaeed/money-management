import { asc, eq } from "drizzle-orm";

import { envelope } from "@trove/db/schema/budget";

import type { CommandDatabase } from "../commands/types";
import { requireHouseholdMember, type HouseholdCaller } from "../require-member";

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

/** Lists the household's envelopes; any member role may read (viewer included). */
export async function listEnvelopes(
  db: CommandDatabase,
  caller: HouseholdCaller,
): Promise<EnvelopeSummary[]> {
  await requireHouseholdMember(db, caller.userId, caller.householdId);
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
    .where(eq(envelope.householdId, caller.householdId))
    .orderBy(asc(envelope.sortOrder), asc(envelope.name));
}
