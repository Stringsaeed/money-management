import { StyleSheet, View } from "react-native";

import { Amount, type AmountSize } from "../amount";
import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, space } from "../tokens";
import { ChartCard } from "./chart-card";
import { DeltaPill } from "./delta-pill";
import { Sparkline } from "./sparkline";
import { formatMoney, presentDelta } from "./utils";

export interface StatTileProps {
  /** `Spent in October`. */
  label: string;
  /** Total in minor units. */
  minor: number;
  currency: string;
  /** Signed change against the comparison period, in percent (-8 is 8% lower). */
  changePercent?: number;
  /** What the change compares to, e.g. `vs Sep`. */
  changeLabel?: string;
  /** For spending, a drop is good (positive tone, down arrow). Pass false for income. */
  lessIsGood?: boolean;
  /** Recent totals, oldest first, for the sparkline. */
  trend?: readonly number[];
  amountSize?: AmountSize;
}

/** Headline number with a meaning-colored change pill and optional sparkline. */
export function StatTile({
  label,
  minor,
  currency,
  changePercent,
  changeLabel = "",
  lessIsGood = true,
  trend = [],
  amountSize = "lg",
}: StatTileProps) {
  const delta = presentDelta(changePercent, changeLabel, lessIsGood);
  const summary = [label, formatMoney(minor, currency), delta?.spoken].filter(Boolean).join(", ");

  return (
    <ChartCard>
      <View accessibilityLabel={summary} accessible style={styles.row}>
        <View style={styles.copy}>
          <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="secondary" variant="bodySm">
            {label}
          </Text>
          <Amount currency={currency} minor={minor} size={amountSize} tone="primary" />
          {delta ? (
            <DeltaPill direction={delta.direction} label={delta.label} tone={delta.tone} />
          ) : null}
        </View>
        {trend.length > 1 ? <Sparkline values={trend} /> : null}
      </View>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: space[4],
    justifyContent: "space-between",
  },
  copy: { flexShrink: 1, gap: space[1] + space[0.5] },
});
