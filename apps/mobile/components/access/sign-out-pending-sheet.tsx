import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NativeHost, NativePrimaryButton, NativeSecondaryButton } from "@/components/native-ui";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

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
  const insets = useSafeAreaInsets();

  return (
    <ModalBottomSheet open={open} onDismiss={onCancel}>
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>Edits still uploading ⏳</Text>
        <Text style={styles.body}>
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
          <Text accessibilityLiveRegion="assertive" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </View>
    </ModalBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[4],
    paddingHorizontal: spacing[4],
  },
  title: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textLg,
    fontStyle: "italic",
    color: colors.ink,
  },
  body: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },
  error: {
    color: colors.destructive,
    fontSize: typography.textXs,
  },
});
