import { StyleSheet, Text as NativeText, View } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import {
  colors,
  DENSE_MAX_FONT_SCALE,
  fonts,
  motion,
  radius,
  space,
  Text,
  troveTransition,
} from "@/ui/trove";

import { homeChartDomain } from "./home-chart-scale";
import { homeFlowSummary } from "./home-flow-summary";
import { HomeChartToggle } from "./home-chart-toggle";
import type { HomeChartView } from "./home-chart-view";
import { HomeFlowBars } from "./home-flow-bars";
import { HomeFlowLegend } from "./home-flow-legend";
import { HomeFlowLines } from "./home-flow-lines";
import { homeChartRangeLabel, homeChartSpanLabel, type HomeMonthFlow } from "./home-summary";

interface HomeFlowCardProps {
  readonly months: readonly HomeMonthFlow[];
  readonly currency: string;
  readonly view: HomeChartView;
  readonly onViewChange: (view: HomeChartView) => void;
}

/** Six months of income against spending, as paired bars or two lines. */
export function HomeFlowCard({ months, currency, view, onViewChange }: HomeFlowCardProps) {
  const reducedMotion = useReducedMotion();
  const domain = homeChartDomain(months);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.stamp}>
            {homeChartRangeLabel(months, currency)}
          </NativeText>
          <Text accessibilityRole="header" style={styles.title}>
            Income vs spending
          </Text>
        </View>
        <HomeChartToggle onChange={onViewChange} value={view} />
      </View>
      <View
        accessibilityLabel={homeFlowSummary(months, currency, view)}
        accessibilityRole="image"
        accessible
        style={styles.plot}
      >
        <EaseView
          animate={{ opacity: 1 }}
          initialAnimate={{ opacity: 0 }}
          key={view}
          transition={troveTransition(reducedMotion, motion.base)}
        >
          {view === "bar" ? (
            <HomeFlowBars domain={domain} months={months} />
          ) : (
            <HomeFlowLines currency={currency} domain={domain} months={months} />
          )}
        </EaseView>
      </View>
      <HomeFlowLegend span={homeChartSpanLabel(months)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: space[4],
    paddingVertical: 14,
  },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  heading: { flex: 1, minWidth: 0 },
  stamp: {
    color: colors.text.tertiary,
    fontFamily: fonts.monoSemibold,
    fontSize: 10,
    letterSpacing: 1.2,
    lineHeight: 13,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 21 },
  // The axis rule sits under the 96pt plot, outside it.
  plot: { borderBottomColor: colors.border.default, borderBottomWidth: 1 },
});
