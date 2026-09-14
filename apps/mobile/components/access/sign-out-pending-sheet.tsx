import { View } from "react-native";

import { NativeHost, NativePrimaryButton, NativeSecondaryButton } from "@/components/native-ui";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";

interface SignOutPendingSheetProps {
  readonly open: boolean;
  readonly pendingCount: number;
  readonly busy: boolean;
  readonly error: string | null;
  readonly onSyncThenSignOut: () => void;
  readonly onDiscardAndSignOut: () => void;
  readonly onCancel: () => void;
}

export function SignOutPendingSheet({
  open,
  pendingCount,
  busy,
  error,
  onSyncThenSignOut,
  onDiscardAndSignOut,
  onCancel,
}: SignOutPendingSheetProps) {
  return (
    <ModalBottomSheet open={open} onDismiss={onCancel}>
      <View className="gap-4 px-4 pb-safe">
        <Text className="font-heading-normal text-lg italic text-ink">
          Edits still uploading ⏳
        </Text>
        <Text className="font-body-normal text-sm text-ink/60">
          {pendingCount} change{pendingCount === 1 ? "" : "s"} waiting to reach the cloud. Sync
          first, discard them, or stay signed in.
        </Text>
        <NativeHost>
          <NativePrimaryButton
            label={busy ? "Syncing…" : "Sync then sign out"}
            onPress={onSyncThenSignOut}
            disabled={busy}
            testID="sign-out-sync-first"
          />
          <NativeSecondaryButton
            label="Discard and sign out"
            onPress={onDiscardAndSignOut}
            disabled={busy}
            testID="sign-out-discard"
          />
          <NativeSecondaryButton
            label="Cancel"
            onPress={onCancel}
            disabled={busy}
            testID="sign-out-cancel"
          />
        </NativeHost>
        {error ? (
          <Text accessibilityLiveRegion="assertive" className="text-destructive text-xs">
            {error}
          </Text>
        ) : null}
      </View>
    </ModalBottomSheet>
  );
}
