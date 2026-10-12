import { StyleSheet, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, Icon, Text } from "@/ui/trove";

/** The 🔒 line under the ledger choices: what switching does and who sees what. */
export function ScopeNote({ text }: { readonly text: string }) {
  return (
    <View style={styles.row}>
      <Icon color={colors.text.secondary} name="lock" size={16} />
      <Text
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.text}
        tone="secondary"
        variant="bodySm"
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "flex-start", flexDirection: "row", gap: 8 },
  text: { flex: 1 },
});
