import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/ui/text";
import { colors, spacing, typography } from "@/ui/design-tokens";

interface LedgerTitleProps {
  readonly title?: string;
  readonly caption?: string;
  readonly accessory?: ReactNode;
}

export function LedgerTitle({ title = "Ledger", caption, accessory }: LedgerTitleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
      {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: spacing[3] },
  copy: { flex: 1, gap: spacing[0.5] },
  title: {
    color: colors.foreground,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.text3xl,
    letterSpacing: typography.trackingTight,
    lineHeight: 36,
  },
  caption: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    fontVariant: ["tabular-nums"],
  },
  accessory: { flexDirection: "row", gap: spacing[2] },
});
