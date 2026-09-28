import { lt, sql } from "drizzle-orm";

import { v2AiUsage } from "@trove/db/schema/v2-ai";

import type { V2DbExecutor } from "./shared";

export interface AiQuotaWindow {
  readonly name: string;
  readonly limit: number;
  readonly durationMs: number;
}

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** Every auto-categorization costs at least one Jev call. Guards bursts and daily volume. */
export const CATEGORIZE_QUOTA: readonly AiQuotaWindow[] = [
  { name: "categorize:minute", limit: 10, durationMs: MINUTE_MS },
  { name: "categorize:day", limit: 200, durationMs: DAY_MS },
];

/** Research runs an LLM with paid web search, so it gets a much tighter daily cap. */
export const RESEARCH_QUOTA: readonly AiQuotaWindow[] = [
  { name: "research:day", limit: 30, durationMs: DAY_MS },
];

/**
 * Counts one use against every window and reports whether all are still within
 * their limit. Fixed windows keep this to one upsert per window.
 */
export async function consumeAiQuota(
  db: V2DbExecutor,
  subject: string,
  windows: readonly AiQuotaWindow[],
  now: Date = new Date(),
): Promise<boolean> {
  let allowed = true;
  for (const window of windows) {
    const start = Math.floor(now.getTime() / window.durationMs) * window.durationMs;
    const rows = await db
      .insert(v2AiUsage)
      .values({
        subject,
        bucket: `${window.name}:${start}`,
        count: 1,
        expiresAt: new Date(start + window.durationMs),
      })
      .onConflictDoUpdate({
        target: [v2AiUsage.subject, v2AiUsage.bucket],
        set: { count: sql`${v2AiUsage.count} + 1` },
      })
      .returning({ count: v2AiUsage.count });
    if ((rows[0]?.count ?? Number.POSITIVE_INFINITY) > window.limit) allowed = false;
  }
  return allowed;
}

export async function pruneAiUsage(db: V2DbExecutor, now: Date = new Date()): Promise<void> {
  await db.delete(v2AiUsage).where(lt(v2AiUsage.expiresAt, now));
}
