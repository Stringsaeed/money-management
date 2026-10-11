import { z } from "zod";

const MAX_RECENT_ENVELOPES = 8;

/** What Quick add remembers on this device for one identity and ledger scope. */
export interface QuickAddMemory {
  readonly lastAccountId: string | null;
  /** Most recent first. */
  readonly recentEnvelopeIds: readonly string[];
}

export const EMPTY_QUICK_ADD_MEMORY: QuickAddMemory = {
  lastAccountId: null,
  recentEnvelopeIds: [],
};

export function rememberSpend(
  memory: QuickAddMemory,
  spend: { readonly accountId: string; readonly envelopeId: string },
): QuickAddMemory {
  return {
    lastAccountId: spend.accountId,
    recentEnvelopeIds: [
      spend.envelopeId,
      ...memory.recentEnvelopeIds.filter((id) => id !== spend.envelopeId),
    ].slice(0, MAX_RECENT_ENVELOPES),
  };
}

const memorySchema = z.object({
  lastAccountId: z.string().nullable().catch(null),
  recentEnvelopeIds: z.array(z.string()).catch([]),
});

export function parseQuickAddMemory(raw: string | null): QuickAddMemory {
  if (!raw) return EMPTY_QUICK_ADD_MEMORY;
  try {
    const parsed = memorySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_QUICK_ADD_MEMORY;
  } catch {
    return EMPTY_QUICK_ADD_MEMORY;
  }
}

export const serializeQuickAddMemory = (memory: QuickAddMemory): string => JSON.stringify(memory);
