import { StyleSheet, useColorScheme } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { colors, radii, rawColorValues, spacing, typography } from "@/lib/design-tokens";
import type { RecurringRule } from "@/modules/recurring-rules";

interface RecurringRuleWarningProps {
  rule: RecurringRule;
}

export function RecurringRuleWarning({ rule }: RecurringRuleWarningProps) {
  const colorScheme = useColorScheme();
  const terracottaHex =
    colorScheme === "dark" ? rawColorValues.dark.terracotta : rawColorValues.light.terracotta;

  if (rule.health !== "needs_attention") return null;

  return (
    <Animated.View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={[
        styles.banner,
        { borderColor: `${terracottaHex}4D`, backgroundColor: `${terracottaHex}1A` },
      ]}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={layoutTransition}
    >
      <Text style={styles.title}>⚠️ Recurring Rule needs attention</Text>
      <Text style={styles.body}>
        Review the amount and Account details, then save to repair this Rule.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing[5],
    marginTop: spacing[2],
    gap: spacing[1],
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  title: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.terracotta,
  },
  body: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    lineHeight: 20,
    color: colors.ink,
    opacity: 0.6,
  },
});
