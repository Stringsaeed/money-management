import { useFont } from "@shopify/react-native-skia";
import { View } from "react-native";
import { CartesianChart, Line } from "victory-native";

import { Text } from "@/components/ui/text";
import type { MonthlyTrendDatum } from "@/hooks/use-chart-data";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fontFile = require("@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf");

interface Props {
  data: MonthlyTrendDatum[];
}

export function TransactionTrendChart({ data }: Props) {
  const font = useFont(fontFile, 10);

  if (data.length < 2) {
    return (
      <View className="h-52 items-center justify-center">
        <Text className="font-body-normal text-sm text-ink/40">Need at least 2 months of data</Text>
      </View>
    );
  }

  return (
    <View className="h-52">
      <CartesianChart
        data={data}
        xKey="month"
        yKeys={["income", "expense"]}
        domainPadding={{ left: 16, right: 16, top: 16 }}
        xAxis={{
          font,
          tickCount: data.length,
          formatXLabel: (value) => data[Math.round(value as number)]?.label ?? "",
          labelColor: "#9a9896",
        }}
        yAxis={[
          {
            font,
            tickCount: 4,
            formatYLabel: (v) => {
              const value = v as number;
              return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
            },
            labelColor: "#9a9896",
          },
        ]}
      >
        {({ points }) => (
          <>
            <Line
              points={points.income}
              color="#8b9d83"
              strokeWidth={2}
              curveType="natural"
              animate={{ type: "timing", duration: 400 }}
            />
            <Line
              points={points.expense}
              color="#b48a7b"
              strokeWidth={2}
              curveType="natural"
              animate={{ type: "timing", duration: 400 }}
            />
          </>
        )}
      </CartesianChart>

      {/* Legend */}
      <View className="flex-row items-center justify-center gap-5 mt-2">
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-2.5 rounded-full bg-sage" />
          <Text className="font-body-normal text-[11px] text-ink/50">Income</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-2.5 rounded-full bg-terracotta" />
          <Text className="font-body-normal text-[11px] text-ink/50">Expenses</Text>
        </View>
      </View>
    </View>
  );
}
