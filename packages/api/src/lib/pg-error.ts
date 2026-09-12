import { z } from "zod";

const pgCodeCarrierSchema = z.object({
  code: z.union([z.string(), z.number()]).optional(),
  cause: z.unknown().optional(),
});

/** Walk drizzle/postgres error chains for a Postgres SQLSTATE. */
export function hasPgCode(error: Error, code: string): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current != null; depth += 1) {
    const parsed = pgCodeCarrierSchema.safeParse(current);
    if (!parsed.success) break;
    if (parsed.data.code != null && String(parsed.data.code) === code) return true;
    current = parsed.data.cause ?? (current instanceof Error ? current.cause : undefined);
  }
  return false;
}
