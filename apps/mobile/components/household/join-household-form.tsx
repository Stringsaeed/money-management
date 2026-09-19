import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

/**
 * Custom Invite Codes are retired. Joining happens through WorkOS invitation
 * emails and AuthKit; this card explains that so Settings does not look broken.
 */
export function JoinHouseholdForm() {
  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Ask an admin to invite you from Manage members. Open the invitation link, sign in with an
        email code, and your Personal ledger stays private.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  description: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },
});
