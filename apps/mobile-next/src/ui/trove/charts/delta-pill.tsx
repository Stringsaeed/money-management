import { StyleSheet, View, type ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, radius, space } from "../tokens";
import type { DeltaDirection, DeltaTone } from "./utils";

export interface DeltaPillProps {
  direction: DeltaDirection;
  tone: DeltaTone;
  /** `8% vs Sep`. */
  label: string;
}

const ARROWS = {
  down: "M7 7l10 10M17 8v9H8",
  up: "M7 17L17 7M8 7h9v9",
  flat: "M5 12h14",
} as const satisfies Record<DeltaDirection, string>;

const TEXT_TONE = { positive: "positive", negative: "negative", neutral: "secondary" } as const;
const ARROW_COLOR = {
  positive: colors.positive.text,
  negative: colors.negative.text,
  neutral: colors.text.secondary,
} as const satisfies Record<DeltaTone, ColorValue>;

/** Change pill. Color follows meaning, not direction: less spending is positive. */
export function DeltaPill({ direction, tone, label }: DeltaPillProps) {
  return (
    <View style={[styles.pill, styles[tone]]}>
      <Svg height={12} viewBox="0 0 24 24" width={12}>
        <Path
          d={ARROWS[direction]}
          fill="none"
          stroke={ARROW_COLOR[tone]}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
        />
      </Svg>
      <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone={TEXT_TONE[tone]} variant="labelSm">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: space[1],
    height: 24,
    paddingHorizontal: space[2] + space[0.5],
  },
  positive: { backgroundColor: colors.positive.subtle },
  negative: { backgroundColor: colors.negative.subtle },
  neutral: { backgroundColor: colors.fill.neutral },
});
