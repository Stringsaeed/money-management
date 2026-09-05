import {
  EFFECT_TAGS,
  type CommandEnvelope,
  type CommandResult,
  type EffectTag,
} from "@trove/protocol";

import { asCommandId, asSeq, transactionIdOf, type ConfirmedCommand } from "./types";

interface AppliedTransactionIdentity {
  readonly transactionId: string;
}

export type AckOutcome =
  | { readonly kind: "confirmed"; readonly confirmed: ConfirmedCommand }
  | { readonly kind: "still_queued" }
  | { readonly kind: "rejected"; readonly reason: string }
  | { readonly kind: "mismatch"; readonly detail: string };

export interface RemoteChange {
  readonly seq: number;
  readonly effects: readonly string[];
}

const EFFECT_TAG_SET: ReadonlySet<string> = new Set(EFFECT_TAGS);

const TRANSACTION_KINDS = new Set([
  "transaction.create",
  "transaction.edit",
  "transaction.remove",
  "refund.link",
]);

export const parseAck = (envelope: CommandEnvelope, result: CommandResult): AckOutcome => {
  if (!TRANSACTION_KINDS.has(envelope.kind)) return { kind: "still_queued" };
  if (result.kind === "local_only") return { kind: "still_queued" };
  if (result.kind !== "applied") return { kind: "rejected", reason: result.kind };

  const expected = transactionIdOf(envelope);
  if (!expected) {
    return { kind: "mismatch", detail: "Command payload did not name a transaction id." };
  }
  // SAFETY: AppliedResult.applied for transaction kinds carries { transactionId }.
  const applied = result.applied as AppliedTransactionIdentity | null | undefined;
  const appliedId = applied?.transactionId;
  if (!appliedId) {
    return { kind: "mismatch", detail: "Applied result did not name a transaction id." };
  }
  if (appliedId !== expected) {
    return {
      kind: "mismatch",
      detail: `Applied transaction ${appliedId} does not match command target ${expected}.`,
    };
  }
  return {
    kind: "confirmed",
    confirmed: {
      commandId: asCommandId(envelope.commandId),
      seq: asSeq(result.seq),
      command: envelope,
    },
  };
};

export const parseEffectTags = (effects: readonly string[]): readonly EffectTag[] =>
  effects.filter((effect): effect is EffectTag => EFFECT_TAG_SET.has(effect));
