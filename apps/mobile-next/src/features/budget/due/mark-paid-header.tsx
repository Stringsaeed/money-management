import { StyleSheet, Text as NativeText, View } from "react-native";

import type { V2DueOccurrence } from "@trove/api/v2/contracts";

import { CategoryTile, colors, DENSE_MAX_FONT_SCALE, fonts, space, Text } from "@/ui/trove";

import { markPaidStamp } from "./due-display";

interface MarkPaidHeaderProps {
  readonly item: V2DueOccurrence;
  readonly icon: string | null;
  readonly today: string;
}

/** Tile, the due stamp (warning today, negative when late), and "{bill} paid?". */
export function MarkPaidHeader({ item, icon, today }: MarkPaidHeaderProps) {
  const late = item.overdue || item.scheduledDate < today;
  const now = item.scheduledDate === today;
  return (
    <View style={styles.row}>
      {icon ? <CategoryTile icon={icon} round /> : <CategoryTile kind="expense" />}
      <View style={styles.titles}>
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          tone={late ? "negative" : now ? "warning" : "tertiary"}
          variant="stamp"
        >
          {markPaidStamp(item, today)}
        </Text>
        <NativeText accessibilityRole="header" numberOfLines={2} style={styles.title}>
          {item.name} paid?
        </NativeText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: space[3] },
  titles: { flex: 1, gap: space[0.5] },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.extrabold,
    fontSize: 24,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
});
