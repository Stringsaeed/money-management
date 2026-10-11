import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { Icon } from "@/ui/icon";
import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import type { UseDue } from "./use-due";

const noun = (count: number) => (count === 1 ? "bill" : "bills");

/** M1's way into the Due list: today's bills and anything overdue, or the next one coming. */
export function DueTodayRow({ due }: { readonly due: UseDue }) {
  const { count, totalMinor } = due.dueNow;
  if (!due.loaded) return null;
  const next = due.sections.flatMap((section) => section.items)[0];
  if (count === 0 && !next) return null;

  const detail =
    count > 0
      ? `${count} ${noun(count)} · ${formatMoneyMinor(totalMinor, BUDGET_CURRENCY)}`
      : `Nothing today. Next: ${next?.name ?? ""}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Due today, ${detail}`}
      onPress={() => router.push("/budget/due")}
      style={styles.row}
    >
      <View style={styles.text}>
        <Text variant="body">Due today</Text>
        <Text variant="caption">{detail}</Text>
      </View>
      <Icon name="caret-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  text: { flex: 1, gap: spacing[0.5] },
});
