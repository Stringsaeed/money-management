import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { PressableScale } from "../pressable-scale";
import { colors } from "../tokens";
import { RECEIPT_PADDING, type ReceiptInsets } from "./receipt-padding";
import { ReceiptTear } from "./receipt-tear";
import type { TearDepth } from "./tear-path";

export interface ReceiptSlipProps {
  children: ReactNode;
  /** Top corner radius: 12 (default) for receipts, 10 for tickets and the calc receipt. */
  radius?: 10 | 12;
  /** Defaults to `RECEIPT_PADDING.intro` (18/18/14/18). */
  padding?: ReceiptInsets;
  /** Space between the slip's lines (default 6). */
  gap?: number;
  /** Depth of the torn edge (default 10). */
  tearDepth?: TearDepth;
  /** Makes the whole slip a link, e.g. a summary ticket. */
  onPress?: () => void;
  /** Spoken label for a pressable slip. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Outer layout only, e.g. `flex: 1` for tickets side by side. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Paper slip with a torn bottom edge. The paper stays light in both modes, so everything
 * printed on it uses the `paper.*` and `text.onPaper` inks.
 */
export function ReceiptSlip({
  children,
  radius = 12,
  padding = RECEIPT_PADDING.intro,
  gap = 6,
  tearDepth = 10,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ReceiptSlipProps) {
  const body = (
    <>
      <View
        style={[
          styles.slip,
          radius === 10 ? styles.radius10 : styles.radius12,
          {
            gap,
            paddingBottom: padding.bottom,
            paddingLeft: padding.left,
            paddingRight: padding.right,
            paddingTop: padding.top,
          },
        ]}
      >
        {children}
      </View>
      <ReceiptTear depth={tearDepth} />
    </>
  );

  if (onPress) {
    return (
      <PressableScale
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="link"
        onPress={onPress}
        style={style}
        testID={testID}
      >
        {body}
      </PressableScale>
    );
  }

  return (
    <View style={style} testID={testID}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  slip: {
    backgroundColor: colors.surface.paper,
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 2, color: colors.paper.shadow }],
  },
  radius10: { borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  radius12: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
});
