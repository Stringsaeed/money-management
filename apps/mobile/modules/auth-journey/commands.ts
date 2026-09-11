import { beginHostedSignIn } from "@/modules/access/actions";

import type { JourneyEffect, JourneyEvent } from "./types";

/**
 * AuthKit owns hosted email-code sign-in. Legacy password/magic effects fail closed
 * so old journey screens cannot reintroduce Better Auth.
 */
export async function runEffect(effect: JourneyEffect): Promise<JourneyEvent> {
  if (effect.kind === "open_authkit") {
    const result = await beginHostedSignIn();
    if (result.kind === "cancelled") {
      return { type: "attempt_failed", failure: { kind: "server" } };
    }
    if (result.kind === "fail") return { type: "attempt_failed", failure: result.failure };
    return { type: "session_established", user: result.value };
  }

  return { type: "attempt_failed", failure: { kind: "server" } };
}
