import { View } from "react-native";

import { NumberFlow } from "@/components/ui/number-flow";
import { Text } from "@/components/ui/text";
import type useNumPadNumber from "@/hooks/use-num-pad-number";
import { cn } from "@/lib/utils";

interface AmountDisplayProps {
  currencySymbol: string;
  numPadConfig: ReturnType<typeof useNumPadNumber>;
}

export function AmountDisplay({ currencySymbol, numPadConfig }: AmountDisplayProps) {
  const integralPart = Math.floor(numPadConfig.value);
  const fractionalPart = Math.round((numPadConfig.value - integralPart) * 100);

  return (
    <View className="h-15 w-full flex-row items-end justify-center">
      <Text className="font-heading-normal text-4xl tabular-nums text-ink">{currencySymbol}</Text>
      <NumberFlow
        className="font-heading-normal text-5xl tabular-nums text-ink"
        value={integralPart}
        format={{ maximumFractionDigits: 0, useGrouping: false }}
      />
      <Text
        className={cn(
          "font-heading-normal text-4xl tabular-nums",
          numPadConfig.isDecimal ? "text-ink" : "text-muted-foreground",
        )}
      >
        .
      </Text>
      <NumberFlow
        className={cn(
          "font-heading-normal text-4xl tabular-nums",
          fractionalPart ? "text-ink" : "text-muted-foreground",
        )}
        value={fractionalPart}
        format={{ minimumIntegerDigits: 2, maximumFractionDigits: 0, useGrouping: false }}
      />
    </View>
  );
}
