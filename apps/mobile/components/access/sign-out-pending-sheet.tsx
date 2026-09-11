import { useEffect, useState } from "react";
import { View } from "react-native";
import { ModalBottomSheet } from "@swmansion/react-native-bottom-sheet";

import { NativeHost, NativePrimaryButton, NativeSecondaryButton } from "@/components/native-ui";
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
  const [sheetIndex, setSheetIndex] = useState(0);

  useEffect(() => {
    setSheetIndex(open ? 1 : 0);
  }, [open]);

  return (
    <ModalBottomSheet
      index={sheetIndex}
      onIndexChange={(index) => {
        setSheetIndex(index);
        if (index === 0) onCancel();
      }}
      scrimColor="rgba(0, 0, 0, 0.5)"
      surface={<View className="absolute inset-0 rounded-t-3xl bg-background" />}
    >
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
