import { StyleSheet, View } from "react-native";

import { colors, spacing, typography } from "@/ui/design-tokens";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";

import { usePadHeight } from "../editor/use-pad-height";

import type { AmountKey } from "./amount-entry";
import { NumPadKey } from "./num-pad-key";

interface NumPadProps {
  readonly allowDecimal: boolean;
  readonly onKey: (key: AmountKey) => void;
  readonly onClear: () => void;
}

const ROWS: readonly (readonly AmountKey[])[] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "delete"],
];

export function NumPad({ allowDecimal, onKey, onClear }: NumPadProps) {
  const height = usePadHeight();

  return (
    <View style={[styles.pad, { height }]} testID="transaction-num-pad">
      {ROWS.map((row) => (
        <View key={row.join("")} style={styles.row}>
          {row.map((key) =>
            key === "." && !allowDecimal ? (
              <View key={key} style={styles.spacer} />
            ) : (
              <NumPadKey
                key={key}
                accessibilityLabel={keyLabel(key)}
                onPress={() => onKey(key)}
                onLongPress={key === "delete" ? onClear : undefined}
              >
                {key === "delete" ? (
                  <Icon name="backspace" size={26} color={colors.ink} />
                ) : (
                  <Text style={styles.digit}>{key}</Text>
                )}
              </NumPadKey>
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const keyLabel = (key: AmountKey) =>
  key === "delete" ? "Delete digit" : key === "." ? "Decimal point" : key;

const styles = StyleSheet.create({
  pad: {
    gap: spacing[1],
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[8],
    paddingTop: spacing[3],
  },
  row: { flex: 1, flexDirection: "row", gap: spacing[4] },
  spacer: { flex: 1 },
  digit: {
    color: colors.ink,
    fontFamily: typography.fontHeadingSemibold,
    fontSize: 32,
    lineHeight: 40,
    fontVariant: ["tabular-nums"],
  },
});
