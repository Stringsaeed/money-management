import { StyleSheet, View } from "react-native";

import { colors, spacing } from "@/lib/design-tokens";

export function Divider() {
  return <View style={styles.line} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.ledgerOutline,
    marginLeft: spacing[4],
  },
});
