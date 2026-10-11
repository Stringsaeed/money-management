import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import { attentionText, type Attention } from "./attention";

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** The single most important thing to look at, plus how many others wait behind it. */
export function AttentionLine({ attention }: { readonly attention: Attention }) {
  if (!attention.top) return null;
  const warning = attention.top.kind === "overspend";
  const text = attentionText(attention.top, money);
  const more = attention.moreCount > 0 ? `${attention.moreCount} more` : null;
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${warning ? "Needs attention: " : "Note: "}${text}${more ? `. ${more}` : ""}`}
      style={[styles.line, warning && styles.warning]}
    >
      <Text variant="label" style={styles.kind}>
        {warning ? "Over" : "Heads up"}
      </Text>
      <Text variant="body" style={styles.text}>
        {text}
      </Text>
      {more ? <Text variant="caption">{more}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  warning: { borderColor: colors.terracotta, borderWidth: StyleSheet.hairlineWidth },
  kind: { color: colors.foreground },
  text: { flex: 1 },
});
