import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountFormPreview } from "@/components/account/account-form-preview";
import type { AccountFormValues } from "@/components/account/form";
import { GARDEN_STAGES, GrowingGarden } from "@/components/graphics/growing-garden";
import { OnboardingBloomBurst } from "@/components/onboarding/onboarding-bloom-burst";
import { OnboardingCta } from "@/components/onboarding/onboarding-cta";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import { returnTo, useAccess } from "@/modules/access";

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
  const access = useAccess();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[4] }]}>
      <View style={styles.content}>
        <View style={styles.gardenWrapper}>
          <OnboardingBloomBurst />
          <GrowingGarden bloom initialStage={GARDEN_STAGES - 1} stage={GARDEN_STAGES} width={232} />
        </View>

        <View style={styles.titleGroup}>
          <Animated.View
            entering={FadeInDown.springify().damping(20).stiffness(130).delay(HEADLINE_DELAY)}
          >
            <Text style={styles.headline}>Your garden is planted</Text>
          </Animated.View>
          <Animated.View entering={FadeIn.duration(400).delay(SUBHEAD_DELAY)}>
            <Text style={styles.subhead}>
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
        style={[styles.ctaWrapper, { paddingBottom: insets.bottom + spacing[2] }]}
        entering={FadeInDown.springify().damping(22).stiffness(140).delay(CTA_DELAY)}
      >
        <OnboardingCta
          label="Open Trove"
          onPress={onFinish}
          showArrow={false}
          testID="onboarding-finish"
        />
        <Pressable
          onPress={() => {
            if (access.kind === "anonymous") {
              access.beginAuth(returnTo.profileHousehold());
              return;
            }
            if (access.kind === "session_revoked") {
              access.reauthenticate(returnTo.profileHousehold());
              return;
            }
            router.push("/(tabs)/settings/household");
          }}
          style={styles.sharePrompt}
          testID="onboarding-share-prompt"
        >
          <Text style={styles.sharePromptText}>Back up & share with a household 🏠</Text>
        </Pressable>
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
    gap: spacing[9],
  },
  gardenWrapper: {
    alignItems: "center",
  },
  titleGroup: {
    alignItems: "center",
    gap: spacing[3],
  },
  headline: {
    textAlign: "center",
    fontFamily: typography.fontHeadingNormal,
    fontSize: 34,
    lineHeight: 42,
    color: colors.ink,
  },
  subhead: {
    textAlign: "center",
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
    lineHeight: 24,
    color: colors.ink,
    opacity: 0.55,
  },
  ctaWrapper: {
    gap: spacing[2],
  },
  sharePrompt: {
    paddingVertical: spacing[2],
    alignItems: "center",
  },
  sharePromptText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },
});
