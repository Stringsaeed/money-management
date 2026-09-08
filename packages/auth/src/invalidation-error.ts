import { z } from "zod";

type LinkKind = "magic" | "reset";

const databaseErrorSchema = z.object({
  cause: z.unknown().optional(),
  code: z.string().optional(),
});

function sqlStateFrom(error: Error, depth = 0): string {
  if (depth > 3) return "unknown";

  const parsed = databaseErrorSchema.safeParse(error);
  if (!parsed.success) return "unknown";
  if (parsed.data.code) return parsed.data.code;
  return parsed.data.cause instanceof Error
    ? sqlStateFrom(parsed.data.cause, depth + 1)
    : "unknown";
}

export function rethrowInvalidationError(kind: LinkKind, error: Error): never {
  console.error("Auth link invalidation failed", {
    operation: kind,
    sqlState: sqlStateFrom(error),
  });
  throw new Error(`Could not invalidate prior ${kind} links.`, { cause: error });
}
