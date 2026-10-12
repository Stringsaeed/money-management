import { StyleSheet } from "react-native";

import { DENSE_MAX_FONT_SCALE, Text } from "@/ui/trove";

/** Mono caps title over an envelope list, e.g. "THIS MONTH · 9". */
export function SectionTitle({ title }: { readonly title: string }) {
  return (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
      style={styles.title}
      tone="tertiary"
      variant="stamp"
    >
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 2 },
});
