import { StyleSheet, View } from "react-native";

import { Card } from "@/components/settings/card";
import { NativeHost, NativePrimaryButton, NativeSecondaryButton } from "@/components/native-ui";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

interface SessionRevokedCardProps {
  readonly email: string;
  readonly onReauthenticate: () => void;
  readonly onSignOut: () => void;
}

export function SessionRevokedCard({
  email,
  onReauthenticate,
  onSignOut,
}: SessionRevokedCardProps) {
  return (
    <Card>
      <View style={styles.content}>
        <Text style={styles.title}>Signed out remotely</Text>
        <Text style={styles.body}>
          {email} is no longer signed in here. Your local ledger is fully usable.
        </Text>
        <NativeHost>
          <NativePrimaryButton
            label="Sign in again"
            onPress={onReauthenticate}
            testID="profile-reauthenticate"
          />
        </NativeHost>
        <NativeHost>
          <NativeSecondaryButton
            label="Forget this profile"
            onPress={onSignOut}
            testID="profile-forget"
          />
        </NativeHost>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[3],
    padding: spacing[4],
  },
  title: {
    fontFamily: typography.fontBodySemibold,
    color: colors.destructive,
  },
  body: {
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.7,
  },
});
