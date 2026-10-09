import { StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import type { IconName } from "../icon";
import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, elevation, motion, radius, space, troveTransition } from "../tokens";
import { useSwipeToDismiss } from "./use-swipe-to-dismiss";

export interface ToastProps {
  message: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  /** Called after a swipe-down dismissal has finished animating out. */
  onDismiss?: () => void;
}

/**
 * Inverted pill that confirms an action ("Moved $250 to Emergency fund · Undo").
 * Pair with `<ToastHost />`, or place it yourself. Swipe down to dismiss.
 */
export function Toast({ message, icon = "check", actionLabel, onAction, onDismiss }: ToastProps) {
  const reducedMotion = useReducedMotion();
  const swipe = useSwipeToDismiss(() => onDismiss?.());
  const hasAction = Boolean(actionLabel && onAction);

  return (
    <EaseView
      {...swipe.panHandlers}
      animate={{ opacity: swipe.leaving ? 0 : 1, translateY: swipe.translateY }}
      onTransitionEnd={swipe.leaving ? swipe.finishLeaving : undefined}
      transition={swipe.dragging ? { type: "none" } : troveTransition(reducedMotion, motion.fast)}
    >
      <View
        accessibilityLiveRegion="polite"
        style={[styles.pill, hasAction ? styles.pillWithAction : null]}
      >
        <Icon color={colors.chart.tooltipText} name={icon} size={20} />
        <Text numberOfLines={2} style={styles.message} variant="bodyMd">
          {message}
        </Text>
        {hasAction ? (
          <PressableScale
            accessibilityRole="button"
            hitSlop={{ top: 4, bottom: 4 }}
            onPress={onAction}
            style={styles.action}
          >
            <Text style={styles.actionLabel} variant="labelMd">
              {actionLabel}
            </Text>
          </PressableScale>
        ) : null}
      </View>
    </EaseView>
  );
}

const styles = StyleSheet.create({
  pill: {
    ...elevation.level2,
    alignItems: "center",
    backgroundColor: colors.chart.tooltipFill,
    borderCurve: "continuous",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: space[3],
    minHeight: 52,
    paddingHorizontal: space[5],
  },
  pillWithAction: { paddingRight: space[2] },
  message: { color: colors.chart.tooltipText, flex: 1, paddingVertical: space[3] },
  action: {
    alignItems: "center",
    borderRadius: radius.full,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: space[3],
  },
  actionLabel: { color: colors.chart.tooltipText },
});
