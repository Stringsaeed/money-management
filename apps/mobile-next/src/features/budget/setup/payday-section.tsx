import { StyleSheet, Text as NativeText, View } from "react-native";

import type { V2PaydayRule } from "@trove/api/v2/contracts";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "@/ui/trove";

import { PaydayPicker } from "./payday-picker";

interface PaydaySectionProps {
  readonly payday: V2PaydayRule | null;
  readonly onChange: (rule: V2PaydayRule) => void;
  /** The mono period line under the chips, once the period is known. */
  readonly period: string | null;
}

/** The payday chips with "THIS MONTH: 25 SEP → 24 OCT · 14 DAYS LEFT" tucked under them. */
export function PaydaySection({ payday, onChange, period }: PaydaySectionProps) {
  return (
    <View style={styles.section}>
      <PaydayPicker value={payday} onChange={onChange} />
      {period ? (
        <NativeText
          accessibilityLiveRegion="polite"
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={styles.period}
        >
          {period}
        </NativeText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // The board pulls the period line 6pt closer than the screen's 16pt gap.
  section: { gap: 10 },
  period: { color: colors.text.secondary, fontFamily: fonts.mono, fontSize: 12, lineHeight: 16 },
});
