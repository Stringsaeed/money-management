import { Text } from "@/components/ui/text";
import { formatCents } from "@/utils/currency";
import type { StyleProp, TextStyle } from "react-native";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface MoneyTextProps {
  cents: number;
  currency?: string;
  /** Leading sign such as "+" or "-". */
  sign?: string;
  style?: StyleProp<TextStyle>;
  /**
   * @deprecated Use `style` prop with design tokens instead.
   * This prop exists for backward compatibility with NativeWind consumers.
   * NativeWind transforms className → style at compile time.
   */
  className?: string;
}

// -----------------------------------------------------------------------------
// MoneyText Component
// -----------------------------------------------------------------------------

/**
 * Renders a currency amount. `cents` is treated as unsigned — pass the sign
 * through the `sign` prop so it stays ahead of the formatted value.
 *
 * @example
 * ```tsx
 * import { MoneyText } from '@/components/ui/money-text';
 * import { colors } from '@/lib/design-tokens';
 *
 * <MoneyText cents={1234} style={{ color: colors.income }} />
 * <MoneyText cents={5678} sign="-" style={{ color: colors.expense }} />
 * ```
 */
export function MoneyText({
  cents,
  currency = "USD",
  sign = "",
  style,
  className: _className,
}: MoneyTextProps) {
  return (
    <Text style={style}>
      {sign}
      {formatCents(cents, currency)}
    </Text>
  );
}

export type { MoneyTextProps };
