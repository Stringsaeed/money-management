import { View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { AccountFormPreview } from "@/components/account/account-form-preview";
import type { AccountFormValues } from "@/components/account/form";
import { GARDEN_STAGES, GrowingGarden } from "@/components/graphics/growing-garden";
import { OnboardingBloomBurst } from "@/components/onboarding/onboarding-bloom-burst";
import { OnboardingCta } from "@/components/onboarding/onboarding-cta";
import { Text } from "@/components/ui/text";

const HEADLINE_DELAY = 640;
const SUBHEAD_DELAY = 740;
const PREVIEW_DELAY = 860;
const CTA_DELAY = 1000;

interface OnboardingCompleteStepProps {
  onFinish: VoidFunction;
  values: AccountFormValues;
}

/**
 * The payoff. The plant finishes blooming, seeds scatter once, and the account
 * the user just built is handed back to them before the app opens.
 */
export function OnboardingCompleteStep({ onFinish, values }: OnboardingCompleteStepProps) {
  return (
    <View className="flex-1 justify-between px-6 pb-2 pt-safe-offset-4">
      <View className="flex-1 justify-center gap-9">
        <View className="items-center">
          <OnboardingBloomBurst />
          <GrowingGarden bloom initialStage={GARDEN_STAGES - 1} stage={GARDEN_STAGES} width={232} />
        </View>

        <View className="items-center gap-3">
          <Animated.View
            entering={FadeInDown.springify().damping(20).stiffness(130).delay(HEADLINE_DELAY)}
          >
            <Text className="text-center font-heading-normal text-[34px] leading-[42px] text-ink">
              Your garden is planted
            </Text>
          </Animated.View>
          <Animated.View entering={FadeIn.duration(400).delay(SUBHEAD_DELAY)}>
            <Text className="text-center font-body-normal text-base leading-6 text-ink/55">
              Log your first transaction and{"\n"}watch the balance move.
            </Text>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.springify().damping(22).stiffness(140).delay(PREVIEW_DELAY)}
        >
          <AccountFormPreview values={values} />
        </Animated.View>
      </View>

      <Animated.View
        className="pb-safe-offset-2"
        entering={FadeInDown.springify().damping(22).stiffness(140).delay(CTA_DELAY)}
      >
        <OnboardingCta
          label="Open Trove"
          onPress={onFinish}
          showArrow={false}
          testID="onboarding-finish"
        />
      </Animated.View>
    </View>
  );
}
