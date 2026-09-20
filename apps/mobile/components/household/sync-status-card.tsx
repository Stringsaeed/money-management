import { StyleSheet, View } from "react-native";

import { ENABLE_SYNC_MATCHED_DESCRIPTION } from "@/components/household/enable-sync-copy";
import { Card } from "@/components/settings/card";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

export function SyncStatusCard() {
  return (
    <Card>
      <View style={styles.container}>
        <Text style={styles.title}>☁️ Synced to the cloud</Text>
        <Text style={styles.description}>{ENABLE_SYNC_MATCHED_DESCRIPTION}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  title: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.sage,
  },
  description: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
});
