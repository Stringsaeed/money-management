import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { layout, Screen, space } from "@/ui/trove";

import { SetupStepHeader } from "./setup-step-header";
import type { SetupStep } from "./setup-types";

interface SetupStepScreenProps {
  readonly step: SetupStep;
  /** Space between the screen's blocks: 16 on most steps, 14 on Plan amounts. */
  readonly gap?: 14 | 16;
  /** The sticky ActionBar. Without one the content runs to the bottom safe area. */
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

/**
 * Board top padding is 56pt on a 47pt status bar: the safe area plus this offset lands the step
 * header in the same place.
 */
const TOP_OFFSET = 9;

/**
 * The shell of setup steps 2 to 5: the step header scrolls with the content, and the action bar
 * stays put below it. Focused amount fields scroll above the keyboard
 * (`automaticallyAdjustKeyboardInsets`).
 */
export function SetupStepScreen({ step, gap = 16, footer, children }: SetupStepScreenProps) {
  return (
    <Screen edges={footer ? ["top"] : ["top", "bottom"]}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { gap }, footer ? styles.withBar : null]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SetupStepHeader step={step} />
        {children}
      </ScrollView>
      {footer}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: space[2],
    paddingHorizontal: layout.screenGutter,
    paddingTop: TOP_OFFSET,
  },
  withBar: { paddingBottom: space[6] },
});
