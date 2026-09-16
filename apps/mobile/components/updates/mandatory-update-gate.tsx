import { Modal, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAppUpdate } from "@/hooks/use-app-update";
import { colors, spacing, typography } from "@/lib/design-tokens";

const handleRequestClose = () => undefined;

export function MandatoryUpdateGate() {
  const { error, isMandatory, progress, retryMandatoryUpdate, status } = useAppUpdate();
  const insets = useSafeAreaInsets();

  if (!isMandatory) {
    return null;
  }

  const progressLabel = `${Math.round((progress ?? 0) * 100)}%`;
  const isFailed = status === "error";

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleRequestClose}
      presentationStyle="fullScreen"
      visible
    >
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🔄</Text>
          <Text style={styles.title}>Update required</Text>
          <Text style={styles.body}>
            {isFailed
              ? error
              : "A required update is being installed to keep Trove working safely."}
          </Text>
          {status === "downloading" ? (
            <Text style={styles.status}>Downloading {progressLabel}</Text>
          ) : null}
          {status === "restarting" ? <Text style={styles.status}>Restarting…</Text> : null}
          {isFailed ? (
            <Button style={styles.retryButton} onPress={retryMandatoryUpdate}>
              <Text>Retry Update</Text>
            </Button>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[8],
  },
  card: {
    width: "100%",
    maxWidth: 448,
    alignItems: "center",
    gap: spacing[4],
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  emoji: {
    fontSize: typography.text4xl,
  },
  title: {
    textAlign: "center",
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.text2xl,
    fontStyle: "italic",
    color: colors.ink,
  },
  body: {
    textAlign: "center",
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    lineHeight: 24,
    color: colors.ink,
    opacity: 0.6,
  },
  status: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  retryButton: {
    marginTop: spacing[2],
    width: "100%",
  },
});
