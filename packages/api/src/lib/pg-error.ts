import { z } from "zod";

const pgCodeCarrierSchema = z.object({
  code: z.union([z.string(), z.number()]).optional(),
  cause: z.unknown().optional(),
  message: z.string().optional(),
});

type PgCodeCarrier = z.infer<typeof pgCodeCarrierSchema>;

/** True when `message` carries the SQLSTATE or PG's name for undefined_column. */
function messageHasPgCode(message: string, code: string): boolean {
  if (message.includes(code)) return true;
  // postgres.js / drivers sometimes surface only the condition name.
  return code === "42703" && message.includes("undefined_column");
}

function carrierMatches(carrier: PgCodeCarrier, code: string): boolean {
  if (carrier.code != null && String(carrier.code) === code) return true;
  return carrier.message != null && messageHasPgCode(carrier.message, code);
}

/**
 * Walk drizzle/postgres error chains for a Postgres SQLSTATE.
 *
 * Zod property reads still see non-enumerable `code` on postgres.js errors.
 * Message fallback covers proxies that strip `code` but leave `42703` /
 * `undefined_column` text.
 */
export function hasPgCode(error: Error, code: string): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current != null; depth += 1) {
    const parsed = pgCodeCarrierSchema.safeParse(current);
    if (!parsed.success) {
      if (!(current instanceof Error)) break;
      if (messageHasPgCode(current.message, code)) return true;
      current = current.cause;
      continue;
    }
    if (carrierMatches(parsed.data, code)) return true;
    current = parsed.data.cause ?? (current instanceof Error ? current.cause : undefined);
  }
  return false;
}
