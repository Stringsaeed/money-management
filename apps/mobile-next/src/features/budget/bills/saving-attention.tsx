import { router } from "expo-router";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import { AttentionSlot, motion, troveTransition } from "@/ui/trove";

import { savingAttention } from "./bills-copy";
import type { SavingRow } from "./bills-model";

interface SavingAttentionProps {
  readonly row: SavingRow;
  readonly currency: string;
  readonly today: string;
  /** The envelope's Category emoji; "!" when it has none. */
  readonly emoji: string | null;
  readonly canEditPlan: boolean;
  /** Tops the payment up by what it is short; absent when the person may not move money. */
  readonly onCover?: (envelopeId: string, shortMinor: number) => void;
}

/**
 * The big payment that needs you, over the "Next 12 months" list: short before payday (Cover
 * it) or not planned this payday (Plan it, on the envelope). Fades in when it appears.
 */
export function SavingAttention({
  row,
  currency,
  today,
  emoji,
  canEditPlan,
  onCover,
}: SavingAttentionProps) {
  const reducedMotion = useReducedMotion();
  const { envelope } = row.line;
  const copy = savingAttention(row, today, currency);
  const openEnvelope = () =>
    router.push({ pathname: "/budget/envelope/[id]", params: { id: envelope.id } });
  const short = row.warnings.find((warning) => warning.kind === "short_before_payday");
  const action =
    short?.kind === "short_before_payday" && onCover
      ? { label: "Cover it", run: () => onCover(envelope.id, short.shortMinor) }
      : !short && canEditPlan
        ? { label: "Plan it", run: openEnvelope }
        : { label: "Open", run: openEnvelope };
  return (
    <EaseView
      animate={{ opacity: 1, translateY: 0 }}
      initialAnimate={{ opacity: 0, translateY: 6 }}
      transition={troveTransition(reducedMotion, motion.base)}
    >
      <AttentionSlot
        actionLabel={action.label}
        emoji={emoji ?? undefined}
        glyph={emoji ? undefined : "!"}
        onAction={action.run}
        sub={copy.sub}
        title={copy.title}
        tone="warn"
      />
    </EaseView>
  );
}
