import { Modal, Pressable, StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "../../motion";
import { Text } from "../text";
import { colors, elevation, motion, radius, space, troveTransition } from "../tokens";
import { ActionButton } from "./action-button";

export interface DialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Solid negative fill on the confirm button — only inside a confirm dialog. */
  destructive?: boolean;
  onConfirm: () => void;
  /** Cancel button, scrim tap and Android back. */
  onCancel: () => void;
}

/** Centered confirm dialog over a scrim. Reads as a single modal to assistive tech. */
export function Dialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: DialogProps) {
  const reducedMotion = useReducedMotion();
  const transition = troveTransition(reducedMotion, motion.base);

  return (
    <Modal
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <EaseView
        animate={{ opacity: 1 }}
        initialAnimate={{ opacity: 0 }}
        style={styles.scrim}
        transition={transition}
      >
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <EaseView
          accessibilityLabel={title}
          accessibilityViewIsModal
          animate={{ opacity: 1, scale: 1 }}
          initialAnimate={{ opacity: reducedMotion ? 1 : 0, scale: reducedMotion ? 1 : 0.96 }}
          role="alertdialog"
          style={styles.dialog}
          transition={transition}
        >
          <View style={styles.copy}>
            <Text accessibilityRole="header" style={styles.centered} variant="titleMd">
              {title}
            </Text>
            {message ? (
              <Text style={styles.centered} tone="secondary" variant="bodyMd">
                {message}
              </Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            <ActionButton
              label={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? "destructive" : "primary"}
            />
            <ActionButton label={cancelLabel} onPress={onCancel} variant="ghost" />
          </View>
        </EaseView>
      </EaseView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    alignItems: "center",
    backgroundColor: colors.scrim,
    flex: 1,
    justifyContent: "center",
    padding: space[5],
  },
  dialog: {
    ...elevation.level3,
    backgroundColor: colors.surface.raised,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    gap: space[5],
    maxWidth: 320,
    paddingBottom: space[5],
    paddingHorizontal: space[5],
    paddingTop: space[6],
    width: "100%",
  },
  copy: { gap: 6 },
  centered: { textAlign: "center" },
  actions: { gap: space[2] },
});
