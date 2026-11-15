import { Pressable, StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, space, Text } from "@/ui/trove";

import { RoundCheck } from "./round-check";
import type { FundingRowModel } from "./setup-accounts";

interface FundingRowProps {
  readonly row: FundingRowModel;
  readonly onToggle: (accountId: string, ticked: boolean) => void;
}

/**
 * One account under "Money you have right now": round tick, account emoji, name with its note,
 * and the balance. Rows that cannot be ticked sit at half opacity and say why.
 */
export function FundingRow({ row, onToggle }: FundingRowProps) {
  return (
    <Pressable
      accessibilityLabel={[row.name, row.note, row.balance].filter(Boolean).join(", ")}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: row.ticked, disabled: row.disabled }}
      disabled={row.disabled}
      onPress={() => onToggle(row.id, !row.ticked)}
      style={({ pressed }) => [
        styles.row,
        row.note ? styles.tall : styles.short,
        row.disabled ? styles.disabled : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <RoundCheck checked={row.ticked} />
      <NativeText
        importantForAccessibility="no"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.emoji}
      >
        {row.emoji}
      </NativeText>
      <View style={styles.texts}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} numberOfLines={1} variant="labelMd">
          {row.name}
        </Text>
        {row.note ? (
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.note}>
            {row.note}
          </NativeText>
        ) : null}
      </View>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.balance}>
        {row.balance}
      </NativeText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: space[3],
  },
  /** S2 rows carry a note line (50pt); household rows print the name alone (52pt). */
  tall: { minHeight: 50 },
  short: { minHeight: 52 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  emoji: { fontSize: 18, lineHeight: 24 },
  texts: { flex: 1, minWidth: 0 },
  note: { color: colors.text.tertiary, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  balance: {
    color: colors.text.primary,
    fontFamily: fonts.monoMedium,
    fontSize: 14,
    lineHeight: 18,
  },
});
