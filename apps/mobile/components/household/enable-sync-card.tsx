import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import {
  ENABLE_SYNC_IDLE_DESCRIPTION,
  ENABLE_SYNC_MATCHED_DESCRIPTION,
  ENABLE_SYNC_MISMATCH_DESCRIPTION,
  ENABLE_SYNC_STATUS_LABEL,
} from "@/components/household/enable-sync-copy";
import { NativeHost, NativePrimaryButton } from "@/components/native-ui";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import { useEnableSync, type EnableSyncStatus } from "@/hooks/use-enable-sync";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

const RUNNING_STATUSES: readonly EnableSyncStatus[] = [
  "creating_household",
  "backing_up",
  "uploading",
  "verifying",
];

export function EnableSyncCard({ activeHouseholdId }: { activeHouseholdId: string | null }) {
  const [name, setName] = useState("");
  const { status, error, discrepancy, enableSync } = useEnableSync();
  const isRunning = RUNNING_STATUSES.includes(status);

  async function handlePress() {
    await enableSync(
      activeHouseholdId
        ? { householdId: activeHouseholdId }
        : { householdName: name.trim() || "My Household" },
    );
  }

  if (status === "matched") {
    return (
      <View style={styles.matchedContainer}>
        <Text style={styles.matchedTitle}>☁️ Synced to the cloud</Text>
        <Text style={styles.description}>{ENABLE_SYNC_MATCHED_DESCRIPTION}</Text>
      </View>
    );
  }

  const buttonLabel = isRunning
    ? ENABLE_SYNC_STATUS_LABEL[status]
    : status === "mismatched" || status === "error"
      ? "Try again"
      : "Enable Sync";

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Enable Sync ☁️</Text>
      <Text style={styles.description}>{ENABLE_SYNC_IDLE_DESCRIPTION}</Text>
      {!activeHouseholdId ? (
        <TextInput
          placeholder="Household name (e.g. The Saeeds)"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#9a9896"
          editable={!isRunning}
          style={[styles.textInput, inputTextStyle]}
        />
      ) : null}
      <NativeHost>
        <NativePrimaryButton
          label={buttonLabel}
          onPress={handlePress}
          disabled={isRunning}
          testID="enable-sync"
        />
      </NativeHost>
      {status === "error" && error ? (
        <Text
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={styles.errorText}
        >
          {error.message}
        </Text>
      ) : null}
      {status === "mismatched" && discrepancy ? (
        <Text
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={styles.errorText}
        >
          {ENABLE_SYNC_MISMATCH_DESCRIPTION}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  matchedContainer: {
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  heading: {
    fontFamily: typography.fontHeadingNormal,
    fontStyle: "italic",
    fontSize: typography.textLg,
    color: colors.ink,
  },
  matchedTitle: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.sage,
  },
  description: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radii.DEFAULT,
    padding: spacing[3.5],
    fontSize: typography.textBase,
    lineHeight: 20,
    color: colors.foreground,
  },
  errorText: {
    fontSize: typography.textXs,
    color: colors.destructive,
  },
});
