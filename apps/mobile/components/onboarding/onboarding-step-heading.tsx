import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { stepItemEntering } from "@/components/onboarding/motion";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

interface OnboardingStepHeadingProps {
  subtitle: string;
  title: string;
}

/** Serif title over a muted subtitle — the app's voice, one beat apart. */
export function OnboardingStepHeading({ subtitle, title }: OnboardingStepHeadingProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={stepItemEntering(0)}>
        <Text style={styles.title}>{title}</Text>
      </Animated.View>
      <Animated.View entering={stepItemEntering(1)}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  title: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: 28,
    lineHeight: 36,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
    lineHeight: 24,
    color: colors.ink,
    opacity: 0.55,
  },
});
