import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { colors, typography } from "@/lib/design-tokens";

export function MarketSourceBadge() {
  return (
    <Badge variant="secondary" style={styles.badge}>
      <Text style={styles.text}>Twelve Data + FreeCryptoAPI</Text>
    </Badge>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderColor: "transparent",
    backgroundColor: colors.muted,
  } satisfies ViewStyle,
  text: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.sage,
  } satisfies TextStyle,
});
