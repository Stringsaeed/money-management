import { ORPCError } from "@orpc/server";
import { z } from "zod";

/**
 * Single-string Worker log line for oRPC errors.
 * Do not console.error(Error) directly — CF Observability often stores only the
 * stack in message/error with an empty Error.message surface.
 */
export function formatOrpcErrorLog(error: Error): string {
  const code = error instanceof ORPCError ? error.code : "UNKNOWN";
  const message = oneLine(error.message.trim() || error.name || "empty_error_message");
  const cause = formatCause(error.cause);
  return cause
    ? `orpc_error code=${code} message=${message} ${cause}`
    : `orpc_error code=${code} message=${message}`;
}

const pgCauseSchema = z.object({
  code: z.union([z.string(), z.number()]).optional(),
  message: z.string().optional(),
  detail: z.string().optional(),
});

function formatCause(cause: unknown): string | null {
  const parsed = pgCauseSchema.safeParse(cause);
  return parsed.success ? formatParsedCause(parsed.data, cause) : fallbackCause(cause);
}

function formatParsedCause(data: z.infer<typeof pgCauseSchema>, cause: unknown): string | null {
  const parts: string[] = [];
  if (data.code != null) parts.push(`pg_code=${oneLine(String(data.code))}`);
  const message = data.message?.trim() || errorMessage(cause);
  if (message) parts.push(`cause=${oneLine(message)}`);
  if (data.detail?.trim()) parts.push(`detail=${oneLine(data.detail)}`);
  return parts.length > 0 ? parts.join(" ") : null;
}

function fallbackCause(cause: unknown): string | null {
  const message = errorMessage(cause);
  return message ? `cause=${oneLine(message)}` : null;
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message.trim() : "";
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").slice(0, 500);
}
