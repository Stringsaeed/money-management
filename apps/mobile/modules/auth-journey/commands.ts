import {
  completeRecovery,
  createProfile,
  sendAuthLink,
  signInWithPassword,
} from "@/modules/access/actions";

import type { JourneyEffect, JourneyEvent } from "./types";

export async function runEffect(effect: JourneyEffect): Promise<JourneyEvent> {
  if (effect.kind === "send_link") {
    const result = await sendAuthLink(effect.email, effect.operation);
    if (result.kind === "fail") return { type: "attempt_failed", failure: result.failure };
    return {
      type: "link_dispatched",
      operation: effect.operation,
      at: new Date().toISOString(),
    };
  }
  if (effect.kind === "sign_in_with_password") {
    return sessionFrom(await signInWithPassword(effect.email, effect.password));
  }
  if (effect.kind === "create_profile") {
    return sessionFrom(
      await createProfile({
        email: effect.email,
        password: effect.password,
        displayName: effect.displayName,
      }),
    );
  }
  const result = await completeRecovery({
    email: effect.email,
    password: effect.password,
    token: effect.grant.token,
  });
  return sessionFrom(result);
}

function sessionFrom(result: Awaited<ReturnType<typeof signInWithPassword>>): JourneyEvent {
  if (result.kind === "fail") return { type: "attempt_failed", failure: result.failure };
  return { type: "session_established", user: result.value };
}
