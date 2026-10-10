import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Icon } from "../icon";
import { Text, type TextTone } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, radius, space } from "../tokens";
import {
  deltaPercentAccessibilityLabel,
  deltaToneForPercent,
  formatDeltaPercent,
  type DeltaTone,
} from "./delta";

export interface DeltaBadgeProps {
  /** Change in percent (2.6 = +2.6%). Derives the label, tone and arrow unless overridden. */
  percent?: number;
  /** Explicit text such as "94% used". Wins over the percent label. */
  label?: string;
  /** Overrides the tone derived from `percent`. Defaults to `neutral` without a percent. */
  tone?: DeltaTone;
  /** Custom content, e.g. an `<Amount />` for "+$320.14". Rendered after the arrow. */
  children?: ReactNode;
  accessibilityLabel?: string;
}

const TEXT_TONE = {
  positive: "positive",
  negative: "negative",
  neutral: "secondary",
  warning: "warning",
} as const satisfies Record<DeltaTone, TextTone>;

const resolveTone = (tone: DeltaTone | undefined, percent: number | undefined): DeltaTone => {
  if (tone) return tone;
  return percent === undefined ? "neutral" : deltaToneForPercent(percent);
};

const resolveLabel = (props: DeltaBadgeProps): string | undefined => {
  if (props.label) return props.label;
  return props.percent === undefined ? undefined : formatDeltaPercent(props.percent);
};

const resolveSpoken = ({ accessibilityLabel, label, percent }: DeltaBadgeProps) => {
  if (accessibilityLabel) return accessibilityLabel;
  if (label) return label;
  return percent === undefined ? undefined : deltaPercentAccessibilityLabel(percent);
};

/** Pill showing a change. Positive and negative carry an arrow; neutral and warning are text only. */
export function DeltaBadge(props: DeltaBadgeProps) {
  const { children, percent } = props;
  const tone = resolveTone(props.tone, percent);
  const label = resolveLabel(props);
  const textTone = TEXT_TONE[tone];
  const spoken = resolveSpoken(props);

  return (
    <View
      accessibilityLabel={spoken}
      accessible={spoken !== undefined}
      style={[styles.pill, pillTone[tone]]}
    >
      {tone === "positive" || tone === "negative" ? (
        <Arrow down={tone === "negative"} tone={tone} />
      ) : null}
      {label ? (
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          tone={textTone}
          variant={percent === undefined ? "labelSm" : "amountSm"}
        >
          {label}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function Arrow({ down, tone }: { down: boolean; tone: "positive" | "negative" }) {
  return (
    <View style={down ? styles.arrowDown : null}>
      <Icon
        color={tone === "positive" ? colors.positive.text : colors.negative.text}
        name="expense"
        size={12}
        strokeWidth={2.5}
      />
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
    minHeight: 24,
    paddingHorizontal: space[2] + 2,
  },
  arrowDown: {
    transform: [{ rotate: "90deg" }],
  },
});

const pillTone = StyleSheet.create({
  positive: { backgroundColor: colors.positive.subtle },
  negative: { backgroundColor: colors.negative.subtle },
  neutral: { backgroundColor: colors.fill.neutral },
  warning: { backgroundColor: colors.warning.subtle },
});
