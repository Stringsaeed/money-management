import { useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import { useEnableSync, type EnableSyncStatus } from "@/hooks/use-enable-sync";

const STATUS_LABEL: Record<EnableSyncStatus, string> = {
  idle: "",
  creating_household: "Creating household…",
  backing_up: "Backing up your local data…",
  uploading: "Uploading your budget…",
  verifying: "Verifying…",
  matched: "Synced ☁️",
  mismatched: "Paused — data didn't reconcile",
  error: "Something went wrong",
};

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
          Your budget now backs up automatically and can be shared with your household.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3 px-4 py-4">
      <Text className="font-heading-normal italic text-lg text-ink">Enable Sync ☁️</Text>
      <Text className="font-body-normal text-xs text-ink/40">
        Move your existing accounts, transactions, and budget to the cloud — backed up and ready to
        share. Your local data stays on this device as a backup until you confirm.
      </Text>
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
      <Button onPress={handlePress} disabled={isRunning}>
        {isRunning ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#fff" size="small" />
            <Text className="font-body-semibold text-white">{STATUS_LABEL[status]}</Text>
          </View>
        ) : (
          <Text className="font-body-semibold text-white">
            {status === "mismatched" || status === "error" ? "Try again" : "Enable Sync"}
          </Text>
        )}
      </Button>
      {status === "error" && error ? (
        <Text className="text-destructive text-xs">{error.message}</Text>
      ) : null}
      {status === "mismatched" && discrepancy ? (
        <Text className="text-destructive text-xs">
          The upload didn&apos;t fully reconcile — your local data was not affected and your
          pre-import backup is safe. Check your connection and try again.
        </Text>
      ) : null}
    </View>
  );
}
