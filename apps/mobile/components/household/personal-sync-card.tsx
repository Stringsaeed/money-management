import { View } from "react-native";

import { Text } from "@/components/ui/text";
import type { PersonalSyncStatus } from "@/hooks/use-enable-sync";
import { useEnablePersonalSync } from "@/hooks/use-enable-sync";
import { Button } from "../ui/button";

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
      <View className="gap-1 px-4 py-4">
        <Text className="font-body-semibold text-sm text-sage">🪪 Your personal ledger syncs</Text>
        <Text className="font-body-normal text-xs text-ink/40">
          Accounts, categories, and transactions follow you to every device you sign in on.
        </Text>
      </View>
    );
  }

  if (status === "confirm_upload") {
    return (
      <View className="gap-3 px-4 py-4">
        <Text className="font-heading-normal text-lg italic text-ink">
          Upload to your cloud? ☁️
        </Text>
        <Text className="font-body-normal text-xs text-ink/40">
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
    <View className="gap-3 px-4 py-4">
      <Text className="font-heading-normal text-lg italic text-ink">
        Sync without a Household 🪪
      </Text>
      <Text className="font-body-normal text-xs text-ink/40">
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
          className="text-destructive text-xs"
        >
          {error.message}
        </Text>
      ) : null}
    </View>
  );
}
