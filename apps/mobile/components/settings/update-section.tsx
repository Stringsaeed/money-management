import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAppUpdate } from "@/hooks/use-app-update";
import { colors, spacing, typography } from "@/lib/design-tokens";

import { Card } from "./card";
import { SectionHeader } from "./section-header";

const STATUS_COPY = {
  disabled: {
    title: "Updates unavailable",
    subtitle: "Update checks are available in native release builds.",
  },
  idle: { title: "Ready to check", subtitle: "Check for the latest compatible update." },
  checking: { title: "Checking for updates…", subtitle: "This should only take a moment." },
  current: { title: "Trove is up to date", subtitle: "You have the latest compatible update." },
  available: { title: "Update available", subtitle: "Download the latest update and restart." },
  downloading: { title: "Downloading update…", subtitle: "Keep Trove open while it downloads." },
  restarting: { title: "Restarting Trove…", subtitle: "The new update is ready to launch." },
  error: { title: "Update check failed", subtitle: "Try again when you are connected." },
} as const;

export function UpdateSection() {
  const { checkForUpdate, error, installUpdate, progress, status } = useAppUpdate();
  const copy = STATUS_COPY[status];
  const isBusy = status === "checking" || status === "downloading" || status === "restarting";
  const progressLabel = `${Math.round((progress ?? 0) * 100)}%`;

  return (
    <>
      <SectionHeader title="Software Update 🔄" />
      <Card animated>
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          layout={layoutTransition}
          style={styles.contentContainer}
        >
          <View style={styles.statusRow}>
            <Text style={styles.emoji}>📦</Text>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>{copy.title}</Text>
              <Text style={styles.statusSubtitle}>
                {status === "downloading" ? `${copy.subtitle} ${progressLabel}` : copy.subtitle}
              </Text>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {status !== "disabled" ? (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              layout={layoutTransition}
              style={styles.buttonRow}
            >
              <Button
                style={styles.button}
                variant="outline"
                disabled={isBusy}
                onPress={checkForUpdate}
              >
                <Text>{status === "checking" ? "Checking…" : "Check for Update"}</Text>
              </Button>
              {status === "available" ? (
                <Button style={styles.button} onPress={installUpdate}>
                  <Text>Update Now</Text>
                </Button>
              ) : null}
            </Animated.View>
          ) : null}
        </Animated.View>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  emoji: {
    width: 28,
    textAlign: "center",
    fontSize: typography.textXl,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  statusSubtitle: {
    marginTop: spacing[0.5],
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  errorText: {
    marginTop: spacing[2],
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    lineHeight: typography.textXs * typography.lineHeightBase,
    color: colors.destructive,
  },
  buttonRow: {
    marginTop: spacing[3],
    flexDirection: "row",
    gap: spacing[2],
  },
  button: {
    flex: 1,
  },
});
