import { useState } from "react";
import { TextInput, View } from "react-native";

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

const RUNNING_STATUSES: readonly EnableSyncStatus[] = [
  "creating_household",
  "backing_up",
  "uploading",
  "verifying",
];

/**
 * The local-to-cloud migration CTA (#98). Uploads this device's existing
 * accounts, categories, transactions, recurring rules, and budgeting facts
 * into a household, then flips to synced mode only once the server's
 * recomputed manifest matches what was sent. Never forced — solo local-only
 * mode stays fully supported until the user taps this.
 */
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
      <View className="gap-1 px-4 py-4">
        <Text className="font-body-semibold text-sm text-sage">☁️ Synced to the cloud</Text>
        <Text className="font-body-normal text-xs text-ink/40">
          {ENABLE_SYNC_MATCHED_DESCRIPTION}
        </Text>
      </View>
    );
  }

  const buttonLabel = isRunning
    ? ENABLE_SYNC_STATUS_LABEL[status]
    : status === "mismatched" || status === "error"
      ? "Try again"
      : "Enable Sync";

  return (
    <View className="gap-3 px-4 py-4">
      <Text className="font-heading-normal italic text-lg text-ink">Enable Sync ☁️</Text>
      <Text className="font-body-normal text-xs text-ink/40">{ENABLE_SYNC_IDLE_DESCRIPTION}</Text>
      {!activeHouseholdId ? (
        <TextInput
          placeholder="Household name (e.g. The Saeeds)"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#9a9896"
          editable={!isRunning}
          className="border border-input rounded-[10px] p-3.5 text-base leading-5 text-foreground"
          style={inputTextStyle}
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
          className="text-destructive text-xs"
        >
          {error.message}
        </Text>
      ) : null}
      {status === "mismatched" && discrepancy ? (
        <Text
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          className="text-destructive text-xs"
        >
          {ENABLE_SYNC_MISMATCH_DESCRIPTION}
        </Text>
      ) : null}
    </View>
  );
}
