import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { layout, Screen, space, StepHeader, type StepHeaderLeading } from "@/ui/trove";

/** The boards' 56pt top padding less the 47pt status bar the safe-area inset already covers. */
const TOP_OFFSET = 9;

interface PaydayStepFrameProps {
  /** `close` leaves the flow (its first step), `back` returns to the step before. */
  readonly leading: StepHeaderLeading;
  readonly onLeading: () => void;
  /** Progress segments; omitted when the flow is a single step or the step is unknown. */
  readonly step?: number;
  readonly of?: number;
  /** Mono stamp after the bar, e.g. "WRAP-UP". */
  readonly tag: string;
  /** Space between the sections: 14 on Wrap-up, 16 on the others. */
  readonly gap?: 14 | 16;
  readonly children: ReactNode;
  /** The sticky ActionBar; it pads itself to the home indicator. */
  readonly footer?: ReactNode;
}

/** A payday step: step header, scrolling sections, and the sticky action bar under them. */
export function PaydayStepFrame({
  leading,
  onLeading,
  step,
  of,
  tag,
  gap = 16,
  children,
  footer,
}: PaydayStepFrameProps) {
  const progress = step !== undefined && of !== undefined && of > 1;
  return (
    <Screen edges={footer ? ["top"] : ["top", "bottom"]}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { gap }]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <StepHeader
          accessibilityLabel={progress ? `Payday step ${step} of ${of}` : undefined}
          leading={leading}
          of={progress ? of : undefined}
          onLeading={onLeading}
          step={progress ? step : undefined}
          tag={tag}
        />
        {children}
      </ScrollView>
      {footer}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: space[6],
    paddingHorizontal: layout.screenGutter,
    paddingTop: TOP_OFFSET,
  },
});
