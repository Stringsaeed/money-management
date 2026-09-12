import { Pressable, View } from "react-native";

import { NativeHost, NativePrimaryButton } from "@/components/native-ui";
import { Text } from "@/components/ui/text";
import { useEnablePersonalSync } from "@/hooks/use-enable-sync";

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
 * Confirm/cancel use RN Pressable (not Expo UI Host buttons): separate NativeHosts
 * still collapsed the primary host so agent-device taps on confirm hit cancel → idle.
 */
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
          once to copy them up — sign-in alone never uploads. Your on-device ledger stays here for
          local-only use anytime.
        </Text>
        <Pressable
          accessibilityRole="button"
          testID="confirm-personal-upload"
          onPress={confirmPersonalUpload}
          className="min-h-12 items-center justify-center rounded-xl bg-ink px-4 py-3 active:opacity-80"
        >
          <Text className="font-body-semibold text-base text-surface">
            {BUTTON_LABEL.confirm_upload}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="cancel-personal-upload"
          onPress={cancelPersonalUpload}
          className="min-h-12 items-center justify-center rounded-xl px-4 py-3 active:bg-ink/5"
        >
          <Text className="font-body-semibold text-base text-ink/60">Not now</Text>
        </Pressable>
      </View>
    );
  }

  const busy =
    status === "probing" ||
    status === "backing_up" ||
    status === "uploading" ||
    status === "verifying" ||
    status === "connecting";

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
      <NativeHost>
        <NativePrimaryButton
          label={BUTTON_LABEL[status]}
          onPress={enablePersonalSync}
          disabled={busy}
          testID="enable-personal-sync"
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
    </View>
  );
}
