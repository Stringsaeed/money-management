import { View } from "react-native";

import { NativeHost, NativePrimaryButton } from "@/components/native-ui";
import { Text } from "@/components/ui/text";
import { useEnablePersonalSync } from "@/hooks/use-enable-sync";

const BUTTON_LABEL = {
  idle: "Sync just for me",
  connecting: "Connecting…",
  enabled: "Synced",
  error: "Try again",
} as const;

/**
 * Turns on a Personal Ledger (#226): cloud sync for a signed-in User who has
 * no Household. The cloud ledger starts empty and this device's local rows are
 * left untouched, so nothing is uploaded and nothing is lost.
 */
export function PersonalSyncCard({ alreadyEnabled }: { readonly alreadyEnabled: boolean }) {
  const { status, error, enablePersonalSync } = useEnablePersonalSync();

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

  return (
    <View className="gap-3 px-4 py-4">
      <Text className="font-heading-normal text-lg italic text-ink">
        Sync without a Household 🪪
      </Text>
      <Text className="font-body-normal text-xs text-ink/40">
        Keep a personal ledger in the cloud on your own. It starts empty — everything already on
        this device stays here — and you can still create or join a Household later.
      </Text>
      <NativeHost>
        <NativePrimaryButton
          label={BUTTON_LABEL[status]}
          onPress={enablePersonalSync}
          disabled={status === "connecting"}
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
