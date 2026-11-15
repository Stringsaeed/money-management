import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import { AttentionSlot, motion, troveTransition } from "@/ui/trove";

import type { Attention } from "./attention";
import {
  attentionAction,
  attentionLink,
  type AttentionAccess,
  type AttentionTarget,
} from "./attention-action";
import { attentionCopy, attentionSub, type AttentionCopyContext } from "./attention-copy";

interface HomeAttentionSlotProps {
  readonly attention: Attention;
  readonly context: AttentionCopyContext;
  readonly access: AttentionAccess;
  readonly onTarget: (target: AttentionTarget) => void;
}

/** The one thing that needs you, chosen by `pickAttention`; it eases in when it changes. */
export function HomeAttentionSlot({
  attention,
  context,
  access,
  onTarget,
}: HomeAttentionSlotProps) {
  const reducedMotion = useReducedMotion();
  const { top, next } = attention;
  if (!top) return null;
  const copy = attentionCopy(top, context);
  const action = attentionAction(top, access);
  const link = next && attention.moreCount > 0 ? attentionLink(next) : attentionLink(top);
  return (
    <EaseView
      key={top.kind}
      animate={{ opacity: 1, translateY: 0 }}
      initialAnimate={{ opacity: 0, translateY: reducedMotion ? 0 : 6 }}
      transition={troveTransition(reducedMotion, motion.base)}
    >
      <AttentionSlot
        actionLabel={action.label}
        emoji={copy.emoji}
        glyph={copy.glyph}
        onAction={() => onTarget(action.target)}
        onSubPress={() => onTarget(link)}
        sub={attentionSub(attention, context)}
        title={copy.title}
        tone={copy.tone}
      />
    </EaseView>
  );
}
