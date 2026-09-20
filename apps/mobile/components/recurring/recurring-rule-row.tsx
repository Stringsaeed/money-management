import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import { MoneyText } from "@/components/ui/money-text";
import { Text } from "@/components/ui/text";
import { colors, radii, rawColorValues, spacing, typography } from "@/lib/design-tokens";
import type { RecurringRule } from "@/modules/recurring-rules";
import { formatRecurrence } from "@/utils/recurring";

interface RecurringRuleRowProps {
  rule: RecurringRule;
  onPress: VoidFunction;
}

const TYPE_EMOJI = {
  expense: "🧾",
  income: "💰",
  transfer: "🔁",
} as const;

const lifecycleLabel = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
  completed: "Completed",
} satisfies Record<RecurringRule["lifecycle"], string>;

export function RecurringRuleRow({ rule, onPress }: RecurringRuleRowProps) {
  const colorScheme = useColorScheme();
  const surfaceContainerHex =
    colorScheme === "dark"
      ? rawColorValues.dark.surfaceContainer
      : rawColorValues.light.surfaceContainer;
  const subtitle = `${formatRecurrence(rule)} · ${lifecycleLabel[rule.lifecycle]}`;
  const needsAttention = rule.health === "needs_attention";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: false }}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: `${surfaceContainerHex}80` },
      ]}
      onPress={onPress}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.iconEmoji}>{needsAttention ? "⚠️" : TYPE_EMOJI[rule.type]}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {rule.name}
        </Text>
        <Text
          style={[
            styles.subtitle,
            needsAttention ? styles.subtitleAttention : styles.subtitleMuted,
          ]}
          numberOfLines={1}
        >
          {needsAttention ? `${subtitle} · Needs attention` : subtitle}
        </Text>
      </View>
      {rule.amountMinor === null ? (
        <Text style={styles.repair}>Repair</Text>
      ) : (
        <MoneyText
          cents={rule.amountMinor}
          currency={rule.currency}
          sign={rule.type === "income" ? "+" : rule.type === "expense" ? "−" : ""}
          style={[
            styles.amount,
            rule.type === "income" ? styles.amountIncome : styles.amountDefault,
            { fontVariant: ["tabular-nums"] },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3.5],
  },
  iconCircle: {
    width: spacing[10],
    height: spacing[10],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
  },
  iconEmoji: {
    fontSize: typography.textLg,
  },
  body: {
    flex: 1,
    gap: spacing[0.5],
  },
  name: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
  },
  subtitleMuted: {
    color: colors.ink,
    opacity: 0.4,
  },
  subtitleAttention: {
    color: colors.terracotta,
  },
  repair: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    color: colors.terracotta,
  },
  amount: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textBase,
  },
  amountIncome: {
    color: colors.sage,
  },
  amountDefault: {
    color: colors.ink,
  },
});
