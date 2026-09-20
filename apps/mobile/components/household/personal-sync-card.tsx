import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { PersonalSyncStatus } from "@/hooks/use-enable-sync";
import { useEnablePersonalSync } from "@/hooks/use-enable-sync";
import { colors, spacing, typography } from "@/lib/design-tokens";

const BUTTON_LABEL = {
  idle: "Sync just for me",
  probing: "Checking cloud…",
  confirm_upload: "Upload once to cloud",
  backing_up: "Backing up…",
  uploading: "Uploading…",
  verifying: "Verifying…",
  connecting: "Connecting…",
  enabled: "Synced",
  error: "Try again",
} as const;

/**
 * Personal Ledger sync (#226 / #229): empty cloud with local rows needs a
 * one-time confirm upload; a populated cloud opens without touching device SQLite.
 *
 * All buttons use the themed RN Button (not Expo UI Host buttons): separate
 * NativeHosts used to collapse the primary host so agent-device taps on confirm
 * hit cancel → idle.
 */
const getIsBusy = (status: PersonalSyncStatus) =>
  status === "probing" ||
  status === "backing_up" ||
  status === "uploading" ||
  status === "verifying" ||
  status === "connecting";

export function PersonalSyncCard({ alreadyEnabled }: { readonly alreadyEnabled: boolean }) {
  const {
    status,
    cloudMode,
    error,
    enablePersonalSync,
    confirmPersonalUpload,
    cancelPersonalUpload,
  } = useEnablePersonalSync();

  if (alreadyEnabled || status === "enabled") {
    return (
      <View style={styles.container}>
        <Text style={styles.successTitle}>🪪 Your personal ledger syncs</Text>
        <Text style={styles.description}>
          Accounts, categories, and transactions follow you to every device you sign in on.
        </Text>
      </View>
    );
  }

  if (status === "confirm_upload") {
    return (
      <View style={styles.confirmContainer}>
        <Text style={styles.heading}>Upload to your cloud? ☁️</Text>
        <Text style={styles.description}>
          Your personal cloud is empty and this device has local accounts and transactions. Confirm
          once to copy them up - sign-in alone never uploads. Your on-device ledger stays here for
          local-only use anytime.
        </Text>
        <Button onPress={confirmPersonalUpload} testID="confirm-personal-upload">
          <Text>{BUTTON_LABEL.confirm_upload}</Text>
        </Button>
        <Button variant="secondary" onPress={cancelPersonalUpload} testID="cancel-personal-upload">
          <Text>Not now</Text>
        </Button>
      </View>
    );
  }

  const busy = getIsBusy(status);

  return (
    <View style={styles.confirmContainer}>
      <Text style={styles.heading}>Sync without a Household 🪪</Text>
      <Text style={styles.description}>
        {cloudMode === "populated"
          ? "Your personal cloud already has data. Opening sync reads that ledger — everything on this device stays on this device, with no merge step."
          : "Keep a personal ledger in the cloud on your own. We check whether the cloud is empty before offering a one-time upload from this device."}
      </Text>
      <Button disabled={busy} onPress={enablePersonalSync} testID="enable-personal-sync">
        <Text>{BUTTON_LABEL[status]}</Text>
      </Button>
      {status === "error" && error ? (
        <Text
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={styles.errorText}
        >
          {error.message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  confirmContainer: {
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  successTitle: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.sage,
  },
  heading: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textLg,
    fontStyle: "italic",
    color: colors.ink,
  },
  description: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  errorText: {
    fontSize: typography.textXs,
    color: colors.destructive,
  },
});
