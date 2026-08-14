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
      <Text
        className="font-heading-normal text-4xl leading-none tabular-nums text-ink"
        style={{ includeFontPadding: false }}
      >
        {currencySymbol}
      </Text>
      {/* The integer uses a larger size than the currency/decimal/fraction. NumberFlow
          positions its baseline at (box bottom − descent), and the row is bottom-aligned,
          so the larger descent lifts the integer's baseline above the rest. Nudge it back
          down onto the shared baseline. */}
      <View style={{ transform: [{ translateY: 3 }] }}>
        <NumberFlow
          className="font-heading-normal text-5xl tabular-nums text-ink"
          value={integralPart}
          format={{ maximumFractionDigits: 0, useGrouping: false }}
        />
      </View>
      <Text
        className={cn(
          "font-heading-normal text-4xl leading-none tabular-nums",
          numPadConfig.isDecimal ? "text-ink" : "text-muted-foreground/75",
        )}
        style={{ includeFontPadding: false }}
      >
        .
      </Text>
      <NumberFlow
        className={cn(
          "font-heading-normal text-4xl tabular-nums",
          fractionalPart ? "text-ink" : "text-muted-foreground/75",
        )}
        value={fractionalPart}
        format={{ minimumIntegerDigits: 2, maximumFractionDigits: 0, useGrouping: false }}
      />
    </View>
  );
}
