import { View } from "react-native";
import { LeafIcon, LockKeyIcon, TrendUpIcon } from "phosphor-react-native";
import type { Icon as PhosphorIcon } from "phosphor-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { GrowingGarden } from "@/components/graphics/growing-garden";
import { OnboardingCta } from "@/components/onboarding/onboarding-cta";
import { STAGGER_MS } from "@/components/onboarding/motion";
import { WELCOME_GARDEN_STAGE } from "@/components/onboarding/steps";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

interface WelcomePromise {
  description: string;
  icon: PhosphorIcon;
  title: string;
}

const PROMISES: WelcomePromise[] = [
  {
    icon: LeafIcon,
    title: "Plant what you spend",
    description: "Log a transaction in seconds and watch it land in your journal.",
  },
  {
    icon: TrendUpIcon,
    title: "Watch it grow",
    description: "Balances, envelopes and trends update the moment you write them down.",
  },
  {
    icon: LockKeyIcon,
    title: "Yours alone",
    description: "Everything stays on this device. No account, no sync, no snooping.",
  },
];

/**
 * Stagger schedule for the opening beat. The garden lands first and everything
 * else arrives underneath it, so the illustration reads as the cause.
 */
const GARDEN_DELAY = 120;
const WORDMARK_DELAY = 420;
const TAGLINE_DELAY = 520;
const PROMISES_DELAY = 660;
const CTA_DELAY = 900;

interface OnboardingWelcomeStepProps {
  onStart: VoidFunction;
}

export function OnboardingWelcomeStep({ onStart }: OnboardingWelcomeStepProps) {
  return (
    <View className="flex-1 justify-between px-6 pb-2 pt-safe-offset-4">
      <View className="flex-1 justify-center gap-8">
        <Animated.View className="items-center" entering={FadeIn.duration(520).delay(GARDEN_DELAY)}>
          {/* A young plant, growing in from bare soil. Each step adds a notch. */}
          <GrowingGarden stage={WELCOME_GARDEN_STAGE} width={244} />
        </Animated.View>

        <View className="items-center gap-3">
          <Animated.View
            entering={FadeInDown.springify().damping(20).stiffness(130).delay(WORDMARK_DELAY)}
          >
            <Text className="font-heading-normal text-[44px] leading-[52px] text-ink">Trove</Text>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.springify().damping(20).stiffness(130).delay(TAGLINE_DELAY)}
          >
            <Text className="text-center font-body-normal text-base leading-6 text-ink/55">
              A quiet ledger for money{"\n"}you want to see grow.
            </Text>
          </Animated.View>
        </View>

        <View className="gap-4">
          {PROMISES.map((promise, index) => (
            <Animated.View
              key={promise.title}
              className="flex-row items-start gap-3.5"
              entering={FadeInDown.springify()
                .damping(20)
                .stiffness(140)
                .delay(PROMISES_DELAY + index * STAGGER_MS * 1.6)}
            >
              <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full border border-ledger-outline bg-surface-container">
                <Icon as={promise.icon} className="text-sage" size={17} weight="duotone" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-body-semibold text-base text-ink">{promise.title}</Text>
                <Text className="mt-0.5 font-body-normal text-sm leading-5 text-ink/50">
                  {promise.description}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View
        className="gap-3 pb-safe-offset-4"
        entering={FadeInDown.springify().damping(22).stiffness(140).delay(CTA_DELAY)}
      >
        <OnboardingCta label="Plant your first seed" onPress={onStart} testID="onboarding-start" />
        <Text className="text-center font-body-normal text-xs text-ink/40">
          Takes about a minute. Nothing leaves your phone.
        </Text>
      </Animated.View>
    </View>
  );
}
