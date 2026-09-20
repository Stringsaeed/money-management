import { StyleSheet, View } from "react-native";
import { LeafIcon, LockKeyIcon, TrendUpIcon } from "phosphor-react-native";
import type { Icon as PhosphorIcon } from "phosphor-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GrowingGarden } from "@/components/graphics/growing-garden";
import { OnboardingCta } from "@/components/onboarding/onboarding-cta";
import { STAGGER_MS } from "@/components/onboarding/motion";
import { WELCOME_GARDEN_STAGE } from "@/components/onboarding/steps";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

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
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[4] }]}>
      <View style={styles.content}>
        <Animated.View
          style={styles.gardenWrapper}
          entering={FadeIn.duration(520).delay(GARDEN_DELAY)}
        >
          {/* A young plant, growing in from bare soil. Each step adds a notch. */}
          <GrowingGarden stage={WELCOME_GARDEN_STAGE} width={244} />
        </Animated.View>

        <View style={styles.titleGroup}>
          <Animated.View
            entering={FadeInDown.springify().damping(20).stiffness(130).delay(WORDMARK_DELAY)}
          >
            <Text style={styles.wordmark}>Trove</Text>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.springify().damping(20).stiffness(130).delay(TAGLINE_DELAY)}
          >
            <Text style={styles.tagline}>A quiet ledger for money{"\n"}you want to see grow.</Text>
          </Animated.View>
        </View>

        <View style={styles.promisesGroup}>
          {PROMISES.map((promise, index) => (
            <Animated.View
              key={promise.title}
              style={styles.promiseRow}
              entering={FadeInDown.springify()
                .damping(20)
                .stiffness(140)
                .delay(PROMISES_DELAY + index * STAGGER_MS * 1.6)}
            >
              <View style={styles.promiseIconWrapper}>
                <Icon as={promise.icon} size={17} weight="duotone" style={styles.promiseIcon} />
              </View>
              <View style={styles.promiseTextWrapper}>
                <Text style={styles.promiseTitle}>{promise.title}</Text>
                <Text style={styles.promiseDescription}>{promise.description}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View
        style={[styles.ctaWrapper, { paddingBottom: insets.bottom + spacing[4] }]}
        entering={FadeInDown.springify().damping(22).stiffness(140).delay(CTA_DELAY)}
      >
        <OnboardingCta label="Plant your first seed" onPress={onStart} testID="onboarding-start" />
        <Text style={styles.ctaSubtext}>Takes about a minute. Nothing leaves your phone.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[2],
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: spacing[8],
  },
  gardenWrapper: {
    alignItems: "center",
  },
  titleGroup: {
    alignItems: "center",
    gap: spacing[3],
  },
  wordmark: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: 44,
    lineHeight: 52,
    color: colors.ink,
  },
  tagline: {
    textAlign: "center",
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
    lineHeight: 24,
    color: colors.ink,
    opacity: 0.55,
  },
  promisesGroup: {
    gap: spacing[4],
  },
  promiseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3.5],
  },
  promiseIconWrapper: {
    marginTop: spacing[0.5],
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
  },
  promiseIcon: {
    color: colors.sage,
  },
  promiseTextWrapper: {
    minWidth: 0,
    flex: 1,
  },
  promiseTitle: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  promiseDescription: {
    marginTop: spacing[0.5],
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    lineHeight: 20,
    color: colors.ink,
    opacity: 0.5,
  },
  ctaWrapper: {
    gap: spacing[3],
  },
  ctaSubtext: {
    textAlign: "center",
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
});
