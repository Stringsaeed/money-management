import { Pressable, StyleSheet, View } from "react-native";
import { ArrowLeftIcon } from "phosphor-react-native";

import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Icon } from "@/components/ui/icon";
import { colors, spacing } from "@/lib/design-tokens";

interface OnboardingHeaderProps {
  current: number;
  onBack: VoidFunction;
  total: number;
}

/**
 * Back control plus progress. Back is always live during the form — from the
 * first step it returns to the welcome screen — and the trailing spacer keeps
 * the progress bar optically centred.
 */
export function OnboardingHeader({ current, onBack, total }: OnboardingHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        testID="onboarding-back"
      >
        <Icon as={ArrowLeftIcon} size={16} weight="bold" style={styles.backIcon} />
      </Pressable>

      <View style={styles.progressWrapper}>
        <OnboardingProgress current={current} total={total} />
      </View>

      {/* Balances the back slot so progress stays optically centred. */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
  },
  backButton: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    opacity: 0.8,
  },
  backButtonPressed: {
    backgroundColor: colors.surfaceDim,
  },
  backIcon: {
    color: colors.ink,
  },
  progressWrapper: {
    flex: 1,
  },
  spacer: {
    height: 36,
    width: 36,
  },
});
