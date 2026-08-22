import type { TextStyle } from "react-native";

import { Text } from "@/components/ui/text";
import { formatCents } from "@/utils/currency";

interface MoneyTextProps {
  cents: number;
  currency?: string;
  /** Leading sign such as "+" or "-". */
  sign?: string;
  className?: string;
  style?: TextStyle;
}

/**
 * Renders a currency amount. `cents` is treated as unsigned — pass the sign
 * through the `sign` prop so it stays ahead of the formatted value.
 */
export function MoneyText({
  cents,
  currency = "USD",
  sign = "",
  className,
  style,
}: MoneyTextProps) {
  return (
    <Text className={className} style={style}>
      {sign}
      {formatCents(cents, currency)}
    </Text>
  );
}
