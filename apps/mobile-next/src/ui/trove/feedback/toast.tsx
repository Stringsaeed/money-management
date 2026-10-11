import { StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import type { IconName } from "../icon";
import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, elevation, fonts, motion, radius, space, troveTransition } from "../tokens";
import { useSwipeToDismiss } from "./use-swipe-to-dismiss";
import { resolveToastAction, splitEmphasis, type ToastAction } from "./utils";

export interface ToastProps {
  message: string;
  /** Decorative emoji in a 40pt tile before the message; replaces the icon. The sentence carries the meaning. */
  emoji?: string;
  icon?: IconName;
  /** Fragment of `message` to set bold. */
  emphasis?: string;
  action?: ToastAction;
  /** Legacy form of `action`. */
  actionLabel?: string;
  onAction?: () => void;
  /** Called after a swipe-down dismissal has finished animating out. */
  onDismiss?: () => void;
}

/**
 * Inverted pill that confirms an action ("Moved $250 to Emergency fund · Undo"), optionally
 * led by an emoji tile ("✨ Filed under Groceries · Change"). Pair with `<ToastHost />`, or
 * place it yourself. Swipe down to dismiss.
 */
export function Toast({
  message,
  emoji,
  icon = "check",
  emphasis,
  action,
  actionLabel,
  onAction,
  onDismiss,
}: ToastProps) {
  const reducedMotion = useReducedMotion();
  const swipe = useSwipeToDismiss(() => onDismiss?.());
  const resolvedAction = resolveToastAction({ action, actionLabel, onAction });

  return (
    <EaseView
      {...swipe.panHandlers}
      animate={{ opacity: swipe.leaving ? 0 : 1, translateY: swipe.translateY }}
      onTransitionEnd={swipe.leaving ? swipe.finishLeaving : undefined}
      transition={swipe.dragging ? { type: "none" } : troveTransition(reducedMotion, motion.fast)}
    >
      <View
        accessibilityLiveRegion="polite"
        style={[
          styles.pill,
          emoji ? styles.pillWithEmoji : styles.pillWithIcon,
          resolvedAction ? styles.pillWithAction : null,
        ]}
      >
        {emoji ? (
          <EmojiTile emoji={emoji} />
        ) : (
          <Icon color={colors.toast.text} name={icon} size={20} />
        )}
        <Text numberOfLines={2} style={styles.message} variant="bodyMd">
          {splitEmphasis(message, emphasis).map((segment, index) =>
            segment.bold ? (
              // oxlint-disable-next-line react/no-array-index-key -- segments are positional and never reorder
              <Text key={index} style={styles.emphasis} variant="bodyMd">
                {segment.text}
              </Text>
            ) : (
              segment.text
            ),
          )}
        </Text>
        {resolvedAction ? (
          <PressableScale
            accessibilityRole="button"
            hitSlop={{ top: 4, bottom: 4 }}
            onPress={resolvedAction.onPress}
            style={styles.action}
          >
            <Text style={styles.actionLabel} variant="labelMd">
              {resolvedAction.label}
            </Text>
          </PressableScale>
        ) : null}
      </View>
    </EaseView>
  );
}

function EmojiTile({ emoji }: { emoji: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.tile}
      testID="toast-emoji-tile"
    >
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    ...elevation.level2,
    alignItems: "center",
    backgroundColor: colors.toast.fill,
    borderCurve: "continuous",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: space[3],
    minHeight: 56,
    paddingRight: space[5],
  },
  pillWithIcon: { paddingLeft: space[5] },
  pillWithEmoji: { paddingLeft: space[2] },
  pillWithAction: { paddingRight: space[2] },
  tile: {
    alignItems: "center",
    backgroundColor: colors.toast.tile,
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  emoji: { fontSize: 20, lineHeight: 24 },
  message: { color: colors.toast.text, flex: 1, paddingVertical: space[3] },
  emphasis: { color: colors.toast.text, fontFamily: fonts.extrabold },
  action: {
    alignItems: "center",
    borderRadius: radius.full,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: space[3],
  },
  actionLabel: { color: colors.toast.action },
});
