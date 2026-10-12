import type { AttentionItem } from "./attention";

/** Where an attention slot's pill or link goes. */
export type AttentionTarget =
  | { readonly kind: "got_paid" }
  | { readonly kind: "due" }
  | { readonly kind: "retry_due" }
  | { readonly kind: "cover"; readonly envelopeId: string }
  | { readonly kind: "envelope"; readonly envelopeId: string }
  | { readonly kind: "plan" }
  /** Scroll Budget home to the Everyday envelopes. */
  | { readonly kind: "everyday" }
  /** Scroll Budget home to Recent activity. */
  | { readonly kind: "activity" };

export interface AttentionAccess {
  /** Quick add, Mark paid, Got paid, Cover and Move money. */
  readonly canAddSpending: boolean;
  readonly canEditPlan: boolean;
}

export interface AttentionAction {
  readonly label: string;
  readonly target: AttentionTarget;
}

/**
 * Where the item's second line leads: somewhere to read about it, open to every role. It is
 * also where "+N more · …" goes when the item waits behind the top one.
 */
export function attentionLink(item: AttentionItem): AttentionTarget {
  switch (item.kind) {
    case "payday":
    case "due_error":
    case "due_today":
      return { kind: "due" };
    case "overspend":
      return { kind: "envelope", envelopeId: item.id };
    case "short":
      return { kind: "everyday" };
    case "not_planned":
      return { kind: "plan" };
    case "activity":
      return { kind: "activity" };
  }
}

const VIEW = "View";

interface GatedAction extends AttentionAction {
  /** What the role needs to see this pill; `null` for every role. */
  readonly gate: keyof AttentionAccess | null;
}

function primaryAction(item: AttentionItem): GatedAction {
  switch (item.kind) {
    case "payday":
      return { gate: "canAddSpending", label: "Got paid", target: { kind: "got_paid" } };
    case "overspend":
      return {
        gate: "canAddSpending",
        label: "Cover it",
        target: { kind: "cover", envelopeId: item.id },
      };
    case "short":
      return { gate: "canEditPlan", label: "Adjust", target: { kind: "plan" } };
    case "due_error":
      return { gate: null, label: "Retry", target: { kind: "retry_due" } };
    case "due_today":
      return { gate: "canAddSpending", label: "Mark paid", target: { kind: "due" } };
    case "not_planned":
      return { gate: "canEditPlan", label: "Plan it", target: { kind: "plan" } };
    case "activity":
      return { gate: null, label: "Activity", target: { kind: "activity" } };
  }
}

/** The slot's pill. A role that cannot act gets a View pill to the same place as the link. */
export function attentionAction(item: AttentionItem, access: AttentionAccess): AttentionAction {
  const { gate, label, target } = primaryAction(item);
  return gate === null || access[gate]
    ? { label, target }
    : { label: VIEW, target: attentionLink(item) };
}
