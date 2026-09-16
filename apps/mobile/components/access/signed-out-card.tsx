import { StyleSheet, View } from "react-native";

import { Card } from "@/components/settings/card";
import { NativeHost, NativePrimaryButton } from "@/components/native-ui";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

export function SignedOutCard({ onSignIn }: { readonly onSignIn: () => void }) {
  return (
    <Card>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏠</Text>
        <Text style={styles.title}>Profile & household</Text>
        <Text style={styles.body}>
          Sign in to create a household, invite family members, and plan money together. Your ledger
          always stays on this device.
        </Text>
        <NativeHost>
          <NativePrimaryButton
            label="Sign in or create profile"
            onPress={onSignIn}
            testID="profile-sign-in"
          />
        </NativeHost>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[6],
  },
  emoji: {
    fontSize: typography.text4xl,
  },
  title: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
  body: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.4,
  },
});
