import { useFont } from "@shopify/react-native-skia";
import { View } from "react-native";
import { CartesianChart, Line } from "victory-native";

import { TinySproutGraphic } from "@/components/graphics/tiny-sprout";
import { Text } from "@/components/ui/text";
import { useTransactions } from "@/hooks/use-transactions";
import { useUIStore } from "@/stores/ui-store";
import { useTransactionPoints } from "@/hooks/use-chart-data";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fontFile = require("@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf");

export function TransactionTrendChart() {
  const { selectedYear, selectedMonth, activeAccountId, selectedCategoryId } = useUIStore();

  const { data: transactions = [] } = useTransactions({
    year: selectedYear ?? undefined,
    month: selectedMonth ?? undefined,
    accountId: activeAccountId,
    categoryId: selectedCategoryId,
  });

  const data = useTransactionPoints(transactions);
  const font = useFont(fontFile, 10);

  if (data.length < 2) {
    return (
      <View className="h-52 items-center justify-center gap-2">
        <TinySproutGraphic />
        <Text className="font-body-normal text-sm text-ink/40">Need at least 2 transactions</Text>
      </View>
    );
  }

  return (
    <View className="h-52">
      <CartesianChart
        data={data}
        xKey="index"
        yKeys={["amount"]}
        domainPadding={{ left: 16, right: 16, top: 16 }}
        xAxis={{
          font,
          tickCount: Math.min(data.length, 7),
          formatXLabel: (value) => {
            const idx = Math.round(value as number);
            return data[idx]?.label ?? "";
          },
          labelColor: "#9a9896",
        }}
        yAxis={[
          {
            font,
            tickCount: 4,
            formatYLabel: (v) => {
              const value = v as number;
              const abs = Math.abs(value);
              return abs >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
            },
            labelColor: "#9a9896",
          },
        ]}
      >
        {({ points }) => (
          <Line
            points={points.amount}
            color="#8b9d83"
            strokeWidth={2}
            curveType="natural"
            animate={{ type: "timing", duration: 400 }}
          />
        )}
      </CartesianChart>
    </View>
  );
}
