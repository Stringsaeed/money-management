import { useState } from "react";
import { StyleSheet, Text as NativeText, View, type LayoutChangeEvent } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "@/ui/trove";

import {
  homeGridValues,
  homeLineLabelTops,
  homeLineY,
  HOME_LINE_LABEL_HEIGHT,
  HOME_PLOT_HEIGHT,
} from "./home-chart-scale";
import { wholeAmount } from "./home-money";
import type { HomeMonthFlow } from "./home-summary";

interface HomeFlowLinesProps {
  readonly months: readonly HomeMonthFlow[];
  readonly domain: number;
  readonly currency: string;
}

const STROKE = 2.5;

/**
 * Income and spending as two lines through each month's centre. The current month's spending
 * is still being written, so its last segment is dashed and labelled "so far".
 */
export function HomeFlowLines({ months, domain, currency }: HomeFlowLinesProps) {
  const [width, setWidth] = useState(0);
  const cell = months.length > 0 ? width / months.length : 0;
  const x = (index: number) => cell * (index + 0.5);
  const point = (index: number, value: number) => `${x(index)} ${homeLineY(value, domain)}`;
  const path = (values: readonly number[]) =>
    values.map((value, index) => `${index ? "L" : "M"}${point(index, value)}`).join(" ");
  const income = months.map((month) => month.incomeMinor);
  const spend = months.map((month) => month.expenseMinor);
  const last = months.length - 1;
  const lastIncome = income[last] ?? 0;
  const lastSpend = spend[last] ?? 0;
  const labelTops = homeLineLabelTops(homeLineY(lastIncome, domain), homeLineY(lastSpend, domain));
  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(Math.round(event.nativeEvent.layout.width));

  return (
    <View onLayout={onLayout} style={styles.plot}>
      {width > 0 && last >= 0 ? (
        <>
          <Svg height={HOME_PLOT_HEIGHT} style={styles.svg} width={width}>
            {homeGridValues(domain).map((value) => (
              <Line
                key={value}
                stroke={colors.border.subtle}
                strokeDasharray="3 3"
                strokeWidth={1}
                x1={0}
                x2={width}
                y1={homeLineY(value, domain) + 0.5}
                y2={homeLineY(value, domain) + 0.5}
              />
            ))}
            <Path
              d={path(income)}
              fill="none"
              stroke={colors.positive.text}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={STROKE}
            />
            {last > 0 ? (
              <Path
                d={path(spend.slice(0, last))}
                fill="none"
                stroke={colors.chartSpend}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={STROKE}
              />
            ) : null}
            <Path
              d={`M${point(Math.max(last - 1, 0), spend[Math.max(last - 1, 0)] ?? 0)} L${point(last, lastSpend)}`}
              fill="none"
              stroke={colors.chartSpend}
              strokeDasharray="3 4"
              strokeLinecap="round"
              strokeWidth={STROKE}
            />
          </Svg>
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={[styles.label, styles.incomeLabel, { top: labelTops.income }]}
          >
            {wholeAmount(lastIncome, currency)}
          </NativeText>
          <NativeText
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={[styles.label, styles.spendLabel, { top: labelTops.spend }]}
          >
            {`${wholeAmount(lastSpend, currency)} SO FAR`}
          </NativeText>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { height: HOME_PLOT_HEIGHT },
  svg: { left: 0, overflow: "visible", position: "absolute", top: 0 },
  label: {
    backgroundColor: colors.surface.default,
    borderRadius: radius.xs,
    fontFamily: fonts.monoSemibold,
    fontSize: 10,
    lineHeight: HOME_LINE_LABEL_HEIGHT,
    overflow: "hidden",
    paddingHorizontal: 4,
    position: "absolute",
    right: -4,
  },
  incomeLabel: { color: colors.positive.text },
  spendLabel: { color: colors.text.secondary },
});
