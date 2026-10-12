import { View, type StyleProp, type ViewStyle } from "react-native";

import { PressableScale } from "../pressable-scale";
import { FlowButtonContent } from "./flow-button-content";
import {
  flowButtonBody,
  pressedStyles,
  type FlowButtonSize,
  type FlowButtonTone,
} from "./flow-button-styles";

export interface FlowButtonProps {
  label: string;
  onPress: () => void;
  /** accent (default) · negative · outline (1.5pt ring) · text (bare secondary label). */
  tone?: FlowButtonTone;
  /** bar 52/17 (default) · pair 52/16 · cta 54/17 · link 44/15 (Nunito 700). */
  size?: FlowButtonSize;
  /** Shows a spinner, keeps the width, and blocks presses. */
  loading?: boolean;
  disabled?: boolean;
  /** Layout of the outer slot, e.g. `{ flex: 1 }` or `{ alignSelf: "stretch" }`. */
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * Pill button of the budgeting flows. Trove `Button` tops out at 52pt with a Nunito 700
 * label; the flow boards print 52–54pt pills in Nunito 800, a 1.5pt outline and a bare
 * secondary link, so they live here.
 */
export function FlowButton({
  label,
  onPress,
  tone = "accent",
  size = "bar",
  loading = false,
  disabled = false,
  style,
  accessibilityLabel = label,
  accessibilityHint,
  testID,
}: FlowButtonProps) {
  const dimmed = disabled && !loading;

  return (
    <View style={style}>
      <PressableScale
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        disabled={disabled || loading}
        onPress={onPress}
        pressedStyle={pressedStyles[tone]}
        style={flowButtonBody(tone, size, dimmed)}
        testID={testID}
      >
        <FlowButtonContent
          dimmed={dimmed}
          label={label}
          loading={loading}
          size={size}
          tone={tone}
        />
      </PressableScale>
    </View>
  );
}
