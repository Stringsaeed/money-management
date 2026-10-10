import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { space } from "../tokens";
import { KeypadKeyButton } from "./keypad-key";
import {
  applyKeypadKey,
  KEYPAD_ROWS,
  localeDecimalSeparator,
  type KeypadKey,
} from "./keypad-input";

export interface KeypadProps {
  /** Canonical entry: digits with "." as the decimal point, e.g. "12.5". Empty means nothing typed. */
  value: string;
  onChange: (next: string) => void;
  /** Decimals allowed. 0 hides the decimal key (JPY). Defaults to 2. */
  maxFractionDigits?: number;
  /** Whole digits allowed. Defaults to 9. */
  maxIntegerDigits?: number;
  /** Character drawn on the decimal key. Defaults to the device locale's separator. */
  decimalSeparator?: string;
  /**
   * Fill the height the parent leaves: the pad flexes to 1 and each row shares it (keys never
   * shorter than 48). Keys also wear the surface fill and `keypad.ring`. Off keeps the fixed 64pt keys.
   */
  fill?: boolean;
  /**
   * Holding delete for 600 ms clears the whole entry (ring draws, medium haptic) and calls this.
   * Hold-to-clear is on when this is set or `fill` is on; with `fill` alone it reports `onChange("")`.
   */
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
}

const DEVICE_DECIMAL_SEPARATOR = localeDecimalSeparator();

/**
 * Controlled 3x4 amount keypad. It owns no state: each press runs the entry rules and reports
 * the next canonical value through `onChange` (rejected presses report nothing).
 */
export function Keypad({
  value,
  onChange,
  maxFractionDigits = 2,
  maxIntegerDigits = 9,
  decimalSeparator = DEVICE_DECIMAL_SEPARATOR,
  fill = false,
  onClear,
  style,
}: KeypadProps) {
  const limits = { maxFractionDigits, maxIntegerDigits };

  const handlePress = (key: KeypadKey) => {
    const next = applyKeypadKey(value, key, limits);
    if (next !== value) onChange(next);
  };

  const handleClear = () => {
    if (onClear) onClear();
    else onChange("");
  };
  const holdToClear = fill || onClear !== undefined;

  return (
    <View style={[styles.grid, fill ? styles.fill : null, style]}>
      {KEYPAD_ROWS.map((row) => (
        <View key={row.join("")} style={[styles.row, fill ? styles.fill : null]}>
          {row.map((key) =>
            key === "decimal" && maxFractionDigits === 0 ? (
              <View key={key} style={styles.gap} />
            ) : (
              <KeypadKeyButton
                canClear={value !== ""}
                decimalSeparator={decimalSeparator}
                fill={fill}
                key={key}
                keyName={key}
                onClear={holdToClear ? handleClear : undefined}
                onPress={handlePress}
              />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: space[1],
  },
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: space[1],
  },
  gap: {
    flex: 1,
  },
});
