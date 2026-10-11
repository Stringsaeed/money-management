import { StyleSheet, View } from "react-native";

import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, motion, radius, space } from "../tokens";
import { BANNER_TONES, type BannerTone } from "./banner-tones";

export interface BannerProps {
  tone?: BannerTone;
  /** Bold first line. Omit for a plain informational sentence. */
  title?: string;
  message?: string;
  /** Text-link action under the message, e.g. "Reconnect". Both fields are needed. */
  actionLabel?: string;
  onAction?: () => void;
}

/** Inline notice: neutral info, positive ("Back under budget"), warning ("Dining out is at 94%") or negative ("Bank sync stopped"). */
export function Banner({ tone = "neutral", title, message, actionLabel, onAction }: BannerProps) {
  const spec = BANNER_TONES[tone];
  const hasAction = Boolean(actionLabel && onAction);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, toneStyles[tone]]}
      testID={`banner-${tone}`}
    >
      <View style={styles.icon}>
        <Icon color={spec.iconColor} name={spec.icon} size={20} />
      </View>
      <View style={styles.body}>
        <View style={styles.text}>
          {title ? <Text variant="labelMd">{title}</Text> : null}
          {message ? (
            <Text tone="secondary" variant="bodySm">
              {message}
            </Text>
          ) : null}
        </View>
        {hasAction ? (
          <View style={styles.action}>
            <PressableScale
              accessibilityRole="button"
              hitSlop={motion.hitSlop}
              onPress={onAction}
              scaleOnPress={false}
            >
              <Text tone="accent" variant="labelMd">
                {actionLabel}
              </Text>
            </PressableScale>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderCurve: "continuous",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: space[3],
    // The 1pt ring is transparent on every tone but neutral, so all four stay the same size.
    borderColor: "transparent",
    borderWidth: 1,
    paddingHorizontal: space[4] - 1,
    paddingVertical: 13,
  },
  icon: { paddingTop: 1 },
  body: { flex: 1, gap: space[2] },
  text: { gap: space[0.5] },
  action: { alignSelf: "flex-start" },
});

const toneStyles = StyleSheet.create({
  warning: { backgroundColor: colors.warning.subtle },
  negative: { backgroundColor: colors.negative.subtle },
  positive: { backgroundColor: colors.positive.subtle },
  neutral: { backgroundColor: colors.surface.default, borderColor: colors.border.subtle },
});
