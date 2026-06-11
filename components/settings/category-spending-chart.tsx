import { LinearGradient, useFont, vec, matchFont } from "@shopify/react-native-skia";
import { View } from "react-native";
import { CartesianChart, Bar } from "victory-native";

import { TinySproutGraphic } from "@/components/graphics/tiny-sprout";
import { Text } from "@/components/ui/text";
import { useCategorySpending } from "@/hooks/use-chart-data";
import { useNativeVariable } from "react-native-css";
import { useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fontFile = require("@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf");

interface BarDatum {
  x: number;
  amount: number;
  label: string;
  color: string;
  icon: string;
  [key: string]: unknown;
}

const emojiFont = matchFont({
  fontSize: 12,
  fontFamily: "Apple Color Emoji",
  fontStyle: "normal",
  fontWeight: "400",
});

export function CategorySpendingChart() {
  const { selectedYear, selectedMonth, activeAccountId, selectedCategoryId } = useUIStore();

  const { data: transactions = [] } = useTransactions({
    year: selectedYear ?? undefined,
    month: selectedMonth ?? undefined,
    accountId: activeAccountId,
    categoryId: selectedCategoryId,
  });

  const data = useCategorySpending(transactions);

  const font = useFont(fontFile, 10);
  // @ts-expect-error - This is an unstable API and may change in the future
  const colorInk = useNativeVariable("--color-ink");
  // @ts-expect-error - This is an unstable API and may change in the future
  const colorMutedForeground = useNativeVariable("--color-muted-foreground");

  if (data.length === 0) {
    return (
      <View className="h-52 items-center justify-center gap-2">
        <TinySproutGraphic />
        <Text className="font-body-normal text-sm text-ink/40">No expense data yet</Text>
      </View>
    );
  }

  const chartData: BarDatum[] = data.map((d, i) => ({
    x: i,
    amount: d.amount / 100,
    label: d.category,
    color: d.color,
    icon: d.icon,
  }));

  return (
    <View className="h-52 min-w-screen-mx-5">
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={["amount"]}
        domainPadding={{ left: 24, right: 24, top: 16 }}
        xAxis={{
          font: emojiFont,
          tickCount: chartData.length,
          formatXLabel: (value) => chartData[Math.round(value)]?.icon ?? "",
        }}
        yAxis={[
          {
            font,
            tickCount: 5,
            formatYLabel: (v) => {
              const value = v as number;
              return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
            },
            labelColor: colorMutedForeground,
          },
        ]}
      >
        {({ points, chartBounds }) => (
          <Bar
            labels={{ position: "top", font, color: colorInk }}
            points={points.amount}
            barCount={points.amount.length}
            chartBounds={chartBounds}
            roundedCorners={{ topLeft: 5, topRight: 5 }}
            innerPadding={0.4}
            animate={{ type: "spring", duration: 500 }}
          >
            <LinearGradient
              start={vec(0, chartBounds.top)}
              end={vec(0, chartBounds.bottom)}
              colors={[colorInk, colorInk + "30"]}
            />
          </Bar>
        )}
      </CartesianChart>
    </View>
  );
}
