import { router } from "expo-router";

import { PAYDAY_ROUTES } from "../payday/payday-flow";
import type { AttentionTarget } from "./attention-action";

export interface AttentionHandlers {
  readonly retryDue: () => void;
  readonly cover: (envelopeId: string) => void;
  readonly scrollToEveryday: () => void;
  readonly scrollToActivity: () => void;
}

export const openEnvelope = (id: string) =>
  router.push({ pathname: "/budget/envelope/[id]", params: { id } });

/** Follows an attention slot's pill or link. */
export function navigateAttention(target: AttentionTarget, handlers: AttentionHandlers): void {
  switch (target.kind) {
    case "got_paid":
      router.push(PAYDAY_ROUTES.gotPaid);
      return;
    case "due":
      router.push("/budget/due");
      return;
    case "retry_due":
      handlers.retryDue();
      return;
    case "cover":
      handlers.cover(target.envelopeId);
      return;
    case "envelope":
      openEnvelope(target.envelopeId);
      return;
    case "plan":
      router.push(PAYDAY_ROUTES.plan);
      return;
    case "everyday":
      handlers.scrollToEveryday();
      return;
    case "activity":
      handlers.scrollToActivity();
      return;
  }
}
