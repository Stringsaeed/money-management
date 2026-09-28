import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";

interface LedgerTitleProps {
  readonly title?: string;
  readonly accessory?: ReactNode;
}

export function LedgerTitle({ title = "Ledger", accessory }: LedgerTitleProps) {
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: spacing[3] },
  title: {
    flex: 1,
    color: colors.foreground,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.text3xl,
    letterSpacing: typography.trackingTight,
    lineHeight: 36,
  },
  accessory: { flexDirection: "row", gap: spacing[2] },
});
