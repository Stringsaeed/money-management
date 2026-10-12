import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, compactAmount, DENSE_MAX_FONT_SCALE, fonts, Text } from "@/ui/trove";

import { GROUP_LABEL } from "./envelope-emoji";
import { codeAmount } from "./payday-money";
import { PaydayPill } from "./payday-pill";
import { repeatGroups, type RepeatPlan } from "./repeat-plan-model";
import type { LastMonth } from "./use-plan-month";

interface RepeatCardBodyProps {
  readonly plan: RepeatPlan;
  readonly lastMonth: Exclude<LastMonth, "none">;
  readonly currency: string;
  readonly onRetry: () => void;
  readonly onAdjust: () => void;
}

/** What Repeat would do: mono group lines, or why it can't run yet. */
export function RepeatCardBody({
  plan,
  lastMonth,
  currency,
  onRetry,
  onAdjust,
}: RepeatCardBodyProps) {
  if (lastMonth === "loading") {
    return (
      <Text accessibilityLiveRegion="polite" tone="secondary" variant="bodySm">
        Loading last month&apos;s plan…
      </Text>
    );
  }
  if (lastMonth === "error") {
    return (
      <View style={styles.problem}>
        <Text accessibilityRole="alert" tone="negative" variant="bodySm">
          Couldn&apos;t load last month&apos;s plan, so it can&apos;t be repeated yet.
        </Text>
        <PaydayPill appearance="outline" label="Retry" onPress={onRetry} size="sm" />
      </View>
    );
  }
  if (plan.items.length === 0) {
    return (
      <Text tone="secondary" variant="bodySm">
        This month already matches last month&apos;s plan.
      </Text>
    );
  }
  if (plan.shortMinor > 0) {
    return (
      <View style={styles.problem}>
        <Text accessibilityRole="alert" tone="negative" variant="labelMd">
          {`Short ${codeAmount(plan.shortMinor, currency)}: lower Everyday or Saving for`}
        </Text>
        <PaydayPill appearance="outline" label="Adjust" onPress={onAdjust} size="sm" />
      </View>
    );
  }
  return (
    <View style={styles.groups}>
      {repeatGroups(plan).map((group) => {
        const label = `${GROUP_LABEL[group.group]}${group.recalculated ? " · recalculated" : ""}`;
        const value = compactAmount(group.amountMinor, currency);
        return (
          <View
            accessibilityLabel={`${label}, ${value}`}
            accessible
            key={group.group}
            style={styles.line}
          >
            <NativeText
              maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
              style={[styles.mono, styles.label]}
            >
              {label}
            </NativeText>
            <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.mono}>
              {value}
            </NativeText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  groups: { gap: 4 },
  line: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  mono: { color: colors.text.primary, fontFamily: fonts.mono, fontSize: 13, lineHeight: 18 },
  label: { color: colors.text.secondary, flexShrink: 1 },
  problem: { alignItems: "flex-start", gap: 8 },
});
