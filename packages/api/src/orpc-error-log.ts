import { ORPCError } from "@orpc/server";

/**
 * Single-string Worker log line for oRPC errors.
 * Do not console.error(Error) directly — CF Observability often stores only the
 * stack in message/error with an empty Error.message surface.
 */
export function formatOrpcErrorLog(error: Error): string {
  const code = error instanceof ORPCError ? error.code : "UNKNOWN";
  const message = error.message.trim() || error.name || "empty_error_message";
  return `orpc_error code=${code} message=${message}`;
}
