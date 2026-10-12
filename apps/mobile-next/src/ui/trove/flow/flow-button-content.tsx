import { ActivityIndicator, Text as NativeText, View } from "react-native";

import { DENSE_MAX_FONT_SCALE } from "../tokens";
import {
  baseStyles,
  LABEL_COLOR,
  labelColors,
  labelStyles,
  type FlowButtonSize,
  type FlowButtonTone,
} from "./flow-button-styles";

interface FlowButtonContentProps {
  label: string;
  tone: FlowButtonTone;
  size: FlowButtonSize;
  loading: boolean;
  dimmed: boolean;
}

/** Centered label; while loading it keeps its width but hides under a spinner. */
export function FlowButtonContent({ label, tone, size, loading, dimmed }: FlowButtonContentProps) {
  return (
    <>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        style={[
          labelStyles[size],
          baseStyles.center,
          labelColors[dimmed ? "disabled" : tone],
          loading ? baseStyles.hidden : null,
        ]}
      >
        {label}
      </NativeText>
      {loading ? (
        <View style={baseStyles.spinner}>
          {/* Loading is never dimmed, so the spinner takes the tone's label colour. */}
          <ActivityIndicator color={LABEL_COLOR[tone]} />
        </View>
      ) : null}
    </>
  );
}
