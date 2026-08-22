import { View } from "react-native";
import Animated from "react-native-reanimated";

import { stepItemEntering } from "@/components/onboarding/motion";
import { Text } from "@/components/ui/text";

interface OnboardingStepHeadingProps {
  subtitle: string;
  title: string;
}

/** Serif title over a muted subtitle — the app's voice, one beat apart. */
export function OnboardingStepHeading({ subtitle, title }: OnboardingStepHeadingProps) {
  return (
    <View className="gap-2">
      <Animated.View entering={stepItemEntering(0)}>
        <Text className="font-heading-normal text-[28px] leading-9 text-ink">{title}</Text>
      </Animated.View>
      <Animated.View entering={stepItemEntering(1)}>
        <Text className="font-body-normal text-base leading-6 text-ink/55">{subtitle}</Text>
      </Animated.View>
    </View>
  );
}
