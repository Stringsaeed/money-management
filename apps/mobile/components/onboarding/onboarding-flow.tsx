import { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountFormPreview } from "@/components/account/account-form-preview";
import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { useAccountForm } from "@/components/account/form";
import { GrowingGarden } from "@/components/graphics/growing-garden";
import { layoutTransition, stepEntering } from "@/components/onboarding/motion";
import { OnboardingBackground } from "@/components/onboarding/onboarding-background";
import { OnboardingBalanceStep } from "@/components/onboarding/onboarding-balance-step";
import { OnboardingCompleteStep } from "@/components/onboarding/onboarding-complete-step";
import { OnboardingCta } from "@/components/onboarding/onboarding-cta";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { OnboardingNameStep } from "@/components/onboarding/onboarding-name-step";
import { OnboardingStyleStep } from "@/components/onboarding/onboarding-style-step";
import { OnboardingWelcomeStep } from "@/components/onboarding/onboarding-welcome-step";
import {
  FORM_STEPS,
  gardenStageForStep,
  WELCOME_GARDEN_STAGE,
  type FormStep,
} from "@/components/onboarding/steps";
import { useKeyboardVisible } from "@/components/onboarding/use-keyboard-visible";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import type { AccountType } from "@/types";

const GARDEN_WIDTH = 168;
const GARDEN_HEIGHT = Math.round((GARDEN_WIDTH * 148) / 200);

const AMOUNT_PATTERN = /^\d*(\.\d{0,2})?$/;

export function OnboardingFlow() {
  const [phase, setPhase] = useState<"welcome" | "form" | "complete">("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();

  // Type drives the default accent and mark, but only until the user overrides
  // one — after that the type picker stops rewriting their choice.
  const [hasCustomColor, setHasCustomColor] = useState(false);
  const [hasCustomIcon, setHasCustomIcon] = useState(false);

  const keyboardVisible = useKeyboardVisible();

  const form = useAccountForm({
    onCreated: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase("complete");
    },
    onError: setError,
  });

  const goBack = useCallback(() => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStepIndex((index) => {
      if (index === 0) {
        setPhase("welcome");
        return 0;
      }
      return index - 1;
    });
  }, []);

  // Android's system back walks the flow rather than dropping out of it.
  useEffect(() => {
    if (phase !== "form") return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      goBack();
      return true;
    });

    return () => subscription.remove();
  }, [goBack, phase]);

  function handleStart() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase("form");
    setStepIndex(0);
  }

  function handleContinue() {
    setError("");

    if (stepIndex < FORM_STEPS.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStepIndex((index) => index + 1);
      return;
    }

    form.handleSubmit();
  }

  function handleTypeChange(nextType: AccountType) {
    Haptics.selectionAsync();
    form.setFieldValue("type", nextType);
    if (!hasCustomColor) form.setFieldValue("color", ACCOUNT_TYPE_META[nextType].color);
    if (!hasCustomIcon) form.setFieldValue("icon", ACCOUNT_TYPE_META[nextType].emoji);
  }

  function handleColorChange(nextColor: string) {
    Haptics.selectionAsync();
    setHasCustomColor(true);
    form.setFieldValue("color", nextColor);
  }

  function handleIconChange(nextIcon: string) {
    Haptics.selectionAsync();
    setHasCustomIcon(true);
    form.setFieldValue("icon", nextIcon);
  }

  return (
    <View style={styles.root}>
      <OnboardingBackground />

      {phase === "welcome" ? (
        <Animated.View
          style={styles.phaseContainer}
          entering={FadeIn.duration(240)}
          exiting={FadeOut.duration(160)}
        >
          <OnboardingWelcomeStep onStart={handleStart} />
        </Animated.View>
      ) : null}

      {phase === "form" ? (
        <Animated.View style={styles.phaseContainer} entering={FadeIn.duration(280)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.phaseContainer}
          >
            <View style={[styles.headerWrapper, { paddingTop: insets.top + spacing[2] }]}>
              <OnboardingHeader current={stepIndex} onBack={goBack} total={FORM_STEPS.length} />
            </View>

            {/* The garden and the preview are pinned: they persist across all
                three steps, so the plant keeps growing and the account the
                user is building never scrolls out from under them. The garden
                folds away while the keyboard is up to buy back the room. */}
            <View style={styles.pinnedSection}>
              <Animated.View
                style={[
                  styles.gardenWrapper,
                  {
                    height: keyboardVisible ? 0 : GARDEN_HEIGHT,
                    opacity: keyboardVisible ? 0 : 1,
                    transitionProperty: ["height", "opacity"],
                    transitionDuration: [280, 180],
                    transitionTimingFunction: "ease-out",
                  },
                ]}
              >
                <GrowingGarden
                  initialStage={WELCOME_GARDEN_STAGE}
                  stage={gardenStageForStep(stepIndex)}
                  width={GARDEN_WIDTH}
                />
              </Animated.View>

              <form.Subscribe
                selector={(state) => ({
                  amount: state.values.amount,
                  color: state.values.color,
                  currency: state.values.currency,
                  icon: state.values.icon,
                  name: state.values.name,
                  type: state.values.type,
                })}
              >
                {(values) => <AccountFormPreview values={values} />}
              </form.Subscribe>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View key={FORM_STEPS[stepIndex]} entering={stepEntering}>
                <StepContent
                  form={form}
                  onColorChange={handleColorChange}
                  onIconChange={handleIconChange}
                  onTypeChange={handleTypeChange}
                  step={FORM_STEPS[stepIndex]}
                />
              </Animated.View>
            </ScrollView>

            {/* KeyboardAvoidingView already lifts this clear of the keyboard,
                so re-adding the home-indicator inset would double it up. */}
            <View
              style={[
                styles.ctaSection,
                { paddingBottom: keyboardVisible ? spacing[3] : insets.bottom + spacing[3] },
              ]}
            >
              {error ? (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  layout={layoutTransition}
                >
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}

              <form.Subscribe
                selector={(state) => ({
                  amount: state.values.amount,
                  isSubmitting: state.isSubmitting,
                  name: state.values.name,
                })}
              >
                {({ amount, isSubmitting, name }) => (
                  <OnboardingCta
                    disabled={isSubmitting || !canContinue(stepIndex, { amount, name })}
                    label={ctaLabel(stepIndex, isSubmitting)}
                    onPress={handleContinue}
                    showArrow={stepIndex < FORM_STEPS.length - 1}
                    testID="onboarding-continue"
                  />
                )}
              </form.Subscribe>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      ) : null}

      {phase === "complete" ? (
        <Animated.View style={styles.phaseContainer} entering={FadeIn.duration(320)}>
          <form.Subscribe selector={(state) => state.values}>
            {(values) => (
              <OnboardingCompleteStep onFinish={() => router.replace("/")} values={values} />
            )}
          </form.Subscribe>
        </Animated.View>
      ) : null}
    </View>
  );
}

interface StepContentProps {
  form: ReturnType<typeof useAccountForm>;
  onColorChange: (color: string) => void;
  onIconChange: (icon: string) => void;
  onTypeChange: (type: AccountType) => void;
  step: FormStep;
}

function StepContent({ form, onColorChange, onIconChange, onTypeChange, step }: StepContentProps) {
  if (step === "name") {
    return <OnboardingNameStep form={form} onTypeChange={onTypeChange} />;
  }

  if (step === "balance") {
    return <OnboardingBalanceStep form={form} />;
  }

  return (
    <OnboardingStyleStep form={form} onColorChange={onColorChange} onIconChange={onIconChange} />
  );
}

function ctaLabel(stepIndex: number, isSubmitting: boolean) {
  if (stepIndex < FORM_STEPS.length - 1) return "Continue";
  return isSubmitting ? "Planting…" : "Plant it";
}

/** Gates the forward action so the user never meets a validation error. */
function canContinue(stepIndex: number, values: { amount: string; name: string }) {
  if (FORM_STEPS[stepIndex] === "name") return values.name.trim().length > 0;
  if (FORM_STEPS[stepIndex] === "balance") {
    const amount = values.amount.trim();
    return !amount || AMOUNT_PATTERN.test(amount);
  }
  return true;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  phaseContainer: {
    flex: 1,
  },
  headerWrapper: {},
  pinnedSection: {
    gap: spacing[4],
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[2],
    paddingTop: spacing[2],
  },
  gardenWrapper: {
    alignItems: "center",
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    paddingTop: spacing[4],
  },
  ctaSection: {
    gap: spacing[3],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
  },
  errorText: {
    textAlign: "center",
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.destructive,
  },
});
