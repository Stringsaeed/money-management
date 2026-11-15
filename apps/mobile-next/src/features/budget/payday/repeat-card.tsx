import { Pressable, StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DashedRule, DENSE_MAX_FONT_SCALE, fonts, radius, space, Text } from "@/ui/trove";

import { codeAmount } from "./payday-money";
import { RepeatCardBody } from "./repeat-card-body";
import type { RepeatPlan } from "./repeat-plan-model";
import type { LastMonth } from "./use-plan-month";

interface RepeatCardProps {
  readonly plan: RepeatPlan;
  readonly lastMonth: Exclude<LastMonth, "none">;
  readonly currency: string;
  /** Repeat is the way this month gets planned (the other is Adjust amounts). */
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly onRetry: () => void;
  /** Short: switch to adjusting the amounts by hand. */
  readonly onAdjust: () => void;
}

export const pluralEnvelopes = (count: number) =>
  `${count} ${count === 1 ? "envelope" : "envelopes"}`;

/**
 * Repeat last month's plan as a choice card: a radio and 17pt title, then (indented under the
 * title) what it adds per group and what stays to plan, or "Short AED X" when the money is not
 * there. While last month loads or after it fails to load, it says so instead.
 */
export function RepeatCard({
  plan,
  lastMonth,
  currency,
  selected,
  onSelect,
  onRetry,
  onAdjust,
}: RepeatCardProps) {
  const fits = lastMonth === "ready" && plan.items.length > 0 && plan.shortMinor === 0;
  return (
    <View style={[styles.card, selected ? styles.selected : styles.idle]}>
      <Pressable
        accessibilityLabel="Repeat last month's plan"
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        hitSlop={8}
        onPress={onSelect}
        style={styles.head}
      >
        <View style={[styles.dot, selected ? styles.dotOn : styles.dotOff]} />
        <Text style={styles.title} variant="titleSm">
          Repeat last month&apos;s plan
        </Text>
      </Pressable>
      <View style={styles.indent}>
        <RepeatCardBody
          currency={currency}
          lastMonth={lastMonth}
          onAdjust={onAdjust}
          onRetry={onRetry}
          plan={plan}
        />
      </View>
      {fits ? (
        <View style={[styles.indent, styles.footer]}>
          <DashedRule color={colors.border.default} dash={[3, 3]} thickness={1} />
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.left}>
            {`${codeAmount(plan.availableMinor - plan.totalMinor, currency)} left to plan · counts as safe to spend`}
          </NativeText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderCurve: "continuous", borderRadius: radius.lg, gap: 10 },
  // Board rings are inset shadows; the native border's width comes back off the 16pt padding.
  selected: {
    backgroundColor: colors.accent.subtle,
    borderColor: colors.accent.fill,
    borderWidth: 1.5,
    padding: space[4] - 1.5,
  },
  idle: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderWidth: 1,
    padding: space[4] - 1,
  },
  head: { alignItems: "center", flexDirection: "row", gap: 10 },
  dot: { borderRadius: radius.full, height: 22, width: 22 },
  dotOn: { borderColor: colors.accent.fill, borderWidth: 7 },
  dotOff: { borderColor: colors.border.strong, borderWidth: 1.5 },
  title: { flex: 1 },
  indent: { marginLeft: 32 },
  footer: { gap: space[2] },
  left: { color: colors.accent.text, fontFamily: fonts.extrabold, fontSize: 14, lineHeight: 20 },
});
