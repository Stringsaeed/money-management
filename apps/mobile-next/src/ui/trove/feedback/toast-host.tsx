import { useEffect, useSyncExternalStore } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReducedMotion } from "../../motion";
import { motion, space, troveTransition } from "../tokens";
import { Toast } from "./toast";
import { getToast, hideToast, subscribeToast } from "./toast-store";
import { resolveToastAction } from "./utils";

export interface ToastHostProps {
  /** Height of the tab bar (or any chrome) the toast must clear, on top of the safe-area inset. */
  bottomOffset?: number;
}

/** Renders the current Trove toast at the bottom of the screen; mount once at the app root. */
export function ToastHost({ bottomOffset = 0 }: ToastHostProps) {
  const toast = useSyncExternalStore(subscribeToast, getToast);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const toastId = toast?.id;
  const message = toast?.message;

  // iOS ignores live regions, so announce the message explicitly.
  useEffect(() => {
    if (toastId !== undefined && message) AccessibilityInfo.announceForAccessibility(message);
  }, [toastId, message]);

  if (!toast) return null;

  const action = resolveToastAction(toast);
  const onPress = action?.onPress;
  const guardedAction =
    action && onPress
      ? {
          label: action.label,
          onPress: () => {
            onPress();
            hideToast();
          },
        }
      : undefined;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlay,
        {
          bottom: insets.bottom + bottomOffset + space[2],
          left: insets.left + space[5],
          right: insets.right + space[5],
        },
      ]}
    >
      <EaseView
        key={toast.id}
        animate={{ opacity: 1, translateY: 0 }}
        initialAnimate={{ opacity: 0, translateY: space[6] }}
        style={styles.slot}
        transition={troveTransition(reducedMotion, motion.sheet)}
      >
        <Toast
          action={guardedAction}
          emoji={toast.emoji}
          emphasis={toast.emphasis}
          icon={toast.icon}
          message={toast.message}
          onDismiss={hideToast}
        />
      </EaseView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    position: "absolute",
  },
  slot: { maxWidth: 420, width: "100%" },
});
