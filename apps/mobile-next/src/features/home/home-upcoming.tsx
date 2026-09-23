import { format, parseISO } from "date-fns";
import { Pressable, StyleSheet, View } from "react-native";
import type { UpcomingOccurrence } from "@/data/ledger-schemas";
import { Text } from "@/ui/text";
import { Icon } from "@/ui/icon";
import { colors, spacing, typography } from "@/ui/design-tokens";
import { tileColors } from "@/ui/tiled-garden/tile-tokens";
import { formatMoneyMinor } from "@/utils/money";

interface HomeUpcomingProps {
  readonly items: readonly (UpcomingOccurrence & { readonly name: string })[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly onOpen: (id: string) => void;
  readonly onViewAll: () => void;
}

export function HomeUpcoming({ items, loading, failed, onOpen, onViewAll }: HomeUpcomingProps) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text variant="title" style={styles.title}>
            Upcoming transactions
          </Text>
          <Text variant="caption">Due now and in the next month</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View recurring transactions"
          onPress={onViewAll}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <Icon name="arrow-right" color={tileColors.ink} />
        </Pressable>
      </View>
      {loading ? (
        <Text style={styles.empty}>Loading upcoming transactions…</Text>
      ) : failed ? (
        <Text style={styles.empty}>
          Upcoming transactions are unavailable. Pull down to try again.
        </Text>
      ) : items.length === 0 ? (
        <Text style={styles.empty}>Nothing scheduled. A little breathing room.</Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={`${item.ruleId}:${item.scheduledDate}`}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.name}`}
            onPress={() => onOpen(item.ruleId)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.calendar}>
              <Text style={styles.month}>
                {format(parseISO(item.scheduledDate), "MMM").toUpperCase()}
              </Text>
              <Text style={styles.day}>{format(parseISO(item.scheduledDate), "dd")}</Text>
            </View>
            <Text numberOfLines={2} style={styles.name}>
              {item.name}
            </Text>
            <Text style={styles.amount}>{formatMoneyMinor(item.amountMinor, item.currency)}</Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[2] },
  heading: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  copy: { flex: 1 },
  title: { fontFamily: typography.fontBodyBold, fontSize: typography.textLg },
  link: {
    alignItems: "center",
    backgroundColor: tileColors.pink,
    borderColor: tileColors.grout,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  calendar: {
    width: 46,
    minHeight: 50,
    backgroundColor: colors.muted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  month: {
    color: colors.foreground,
    fontSize: 9,
    fontFamily: typography.fontBodyBold,
    letterSpacing: 1,
  },
  day: {
    color: colors.foreground,
    fontSize: typography.textLg,
    fontFamily: typography.fontBodyBold,
  },
  name: { flex: 1, fontFamily: typography.fontBodySemibold },
  amount: { fontFamily: typography.fontBodyBold, fontVariant: ["tabular-nums"] },
  empty: { color: colors.mutedForeground, paddingVertical: spacing[4] },
  pressed: { opacity: 0.68 },
});
