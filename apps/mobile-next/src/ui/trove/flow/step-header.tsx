import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE, layout, space } from "../tokens";
import { StepHeaderButton, type StepHeaderLeading } from "./step-header-button";
import { StepProgress } from "./step-progress";

export interface StepHeaderProps {
  /** `back` chevron for setup steps, `close` cross to leave a flow (wrap-up). */
  leading: StepHeaderLeading;
  onLeading: () => void;
  /** Overrides "Back" / "Close". */
  leadingLabel?: string;
  /** Done segments (1-based current step). Omit `step` and `of` for no progress bar (review). */
  step?: number;
  of?: number;
  /** Mono stamp after the bar, e.g. "1 / 3", "WRAP-UP", "REVIEW". */
  tag?: string;
  /** Names the progress bar. Defaults to "Step {step} of {of}". */
  accessibilityLabel?: string;
}

/** Flow header: 44pt back/close disc, segmented progress, and a mono tag. */
export function StepHeader({
  leading,
  onLeading,
  leadingLabel,
  step,
  of,
  tag,
  accessibilityLabel,
}: StepHeaderProps) {
  const showProgress = step !== undefined && of !== undefined && of > 0;

  return (
    <View style={styles.row}>
      <StepHeaderButton accessibilityLabel={leadingLabel} kind={leading} onPress={onLeading} />
      {showProgress ? (
        <StepProgress
          accessibilityLabel={accessibilityLabel ?? `Step ${step} of ${of}`}
          of={of}
          step={step}
        />
      ) : null}
      {tag ? (
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          tone="tertiary"
          variant="stamp"
        >
          {tag}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    minHeight: layout.minTouchTarget,
  },
});
