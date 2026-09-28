import { addMonths, isAfter, startOfMonth } from "date-fns";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";
import { colors, radii, spacing, typography } from "@/ui/design-tokens";
import { parseDateKey } from "@/utils/date";

import { monthRange, type LedgerDateRange } from "./ledger-filters";

interface MonthNavigatorProps {
  readonly range: LedgerDateRange | null;
  readonly onChange: (range: LedgerDateRange | null) => void;
}

/** Steps the date filter a calendar month at a time; the middle label returns to all time. */
export function MonthNavigator({ range, onChange }: MonthNavigatorProps) {
  const today = new Date();
  const anchor = startOfMonth((range && parseDateKey(range.from)) ?? today);
  const step = (months: number) => onChange(monthRange(range ? addMonths(anchor, months) : today));
  const canGoForward = range !== null && !isAfter(addMonths(anchor, 1), today);
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        hitSlop={8}
        onPress={() => step(-1)}
        style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
      >
        <Icon name="arrow-left" size={18} color={colors.foreground} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={range ? `${range.label}, show all time` : "All time, show this month"}
        onPress={() => onChange(range ? null : monthRange(today))}
        style={styles.center}
      >
        <Text style={styles.label}>{range?.label ?? "All time"}</Text>
        <Text style={styles.hint}>{range ? "Tap for all time" : "Tap for this month"}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next month"
        accessibilityState={{ disabled: !canGoForward }}
        disabled={!canGoForward}
        hitSlop={8}
        onPress={() => step(1)}
        style={({ pressed }) => [
          styles.arrow,
          !canGoForward && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Icon name="arrow-right" size={18} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: spacing[3] },
  arrow: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    height: spacing[10],
    justifyContent: "center",
    width: spacing[10],
  },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.6 },
  center: { alignItems: "center", flex: 1 },
  label: {
    color: colors.foreground,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.textXl,
  },
  hint: {
    color: colors.mutedForeground,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
  },
});
