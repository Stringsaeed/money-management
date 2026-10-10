import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Amount, decimalAmountAccessibilityLabel } from "../amount";
import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, fonts, layout, space } from "../tokens";
import { MarketChangeBadge } from "./market-change-badge";
import { MarketSparkline } from "./market-sparkline";
import { marketChangeSpoken } from "./utils";

export interface MarketRowProps {
  /** Ticker, set in Plex Mono: "BTC". */
  symbol: string;
  /** Full name: "Bitcoin", "Gold · per oz". */
  name: string;
  /** Decimal string so sub-cent prices never touch a float: "0.00001842". */
  price: string;
  /** Currency the price is quoted in. */
  currency?: string;
  /** Significant digits kept for prices below 1 (default 4). */
  significant?: number;
  /** 24h change in percent (2.4 = +2.4%). Also picks the sparkline and badge tone. */
  changePercent: number;
  /** Recent prices, oldest first, for the 56x24 sparkline. */
  sparkline: readonly number[];
  /** Bottom hairline, for a flat list. Leave off inside a `ListGroup`, which draws its own. */
  divider?: boolean;
  onPress?: () => void;
  testID?: string;
}

/** Quote row: symbol + name, sparkline, price (cents full size, finer digits faded) and 24h change. */
export function MarketRow({
  symbol,
  name,
  price,
  currency = "USD",
  significant,
  changePercent,
  sparkline,
  divider = false,
  onPress,
  testID,
}: MarketRowProps) {
  const priceLabel = decimalAmountAccessibilityLabel(price, currency, significant);
  const change = marketChangeSpoken(changePercent);

  return (
    <RowShell
      accessibilityLabel={`${name}, ${symbol}, ${priceLabel}, ${change}`}
      onPress={onPress}
      style={[styles.row, divider ? styles.divider : null]}
      testID={testID}
    >
      <View style={styles.identity}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.symbol} variant="amountMd">
          {symbol}
        </Text>
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          tone="tertiary"
          variant="bodySm"
        >
          {name}
        </Text>
      </View>
      <MarketSparkline up={changePercent >= 0} values={sparkline} />
      <View style={styles.figures}>
        <Amount currency={currency} significant={significant} value={price} />
        <MarketChangeBadge percent={changePercent} />
      </View>
    </RowShell>
  );
}

interface RowShellProps {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  onPress?: () => void;
  testID?: string;
}

const PRESSED = { backgroundColor: colors.fill.neutral } as const;

/** One spoken label for the whole row; a button (fill-only press) when there is something to open. */
function RowShell({ children, style, accessibilityLabel, onPress, testID }: RowShellProps) {
  if (!onPress) {
    return (
      <View accessibilityLabel={accessibilityLabel} accessible style={style} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      pressedStyle={PRESSED}
      scaleOnPress={false}
      style={style}
      testID={testID}
    >
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3] - 2,
    minHeight: 60,
    paddingHorizontal: layout.cardPadding,
  },
  divider: {
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  identity: { flex: 1, minWidth: 0 },
  symbol: { fontFamily: fonts.monoSemibold, fontSize: 14 },
  figures: { alignItems: "flex-end", gap: 3 },
});
