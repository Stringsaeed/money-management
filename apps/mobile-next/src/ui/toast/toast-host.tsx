import { useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text as NativeText, View } from "react-native";
import { EaseView } from "react-native-ease";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radii, shadows, spacing, typography } from "../design-tokens";
import { motionTransition, STATE_TRANSITION, useReducedMotion } from "../motion";
import { Text } from "../text";

import { getToast, hideToast, subscribeToast } from "./toast-store";

/** Renders the current toast above every screen; mount once at the app root. */
export function ToastHost() {
  const toast = useSyncExternalStore(subscribeToast, getToast);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  if (!toast) return null;

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { top: insets.top + spacing[2] }]}>
      <EaseView
        key={toast.id}
        initialAnimate={{ opacity: 0, translateY: -spacing[3] }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={motionTransition(reducedMotion, STATE_TRANSITION)}
      >
        <Pressable
          accessibilityRole="alert"
          accessibilityLabel={toast.message}
          accessibilityHint="Dismisses this message"
          onPress={hideToast}
          style={styles.toast}
        >
          <NativeText style={styles.emoji}>{toast.emoji}</NativeText>
          <Text numberOfLines={2} style={styles.message}>
            {toast.message}
          </Text>
        </Pressable>
      </EaseView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    left: spacing[4],
    position: "absolute",
    right: spacing[4],
  },
  toast: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: shadows.lg,
    flexDirection: "row",
    gap: spacing[2],
    maxWidth: 420,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  emoji: { fontSize: typography.textBase },
  message: {
    color: colors.foreground,
    flexShrink: 1,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
});
