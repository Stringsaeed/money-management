import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { AccountColorPicker } from "@/components/account/account-color-picker";
import { AccountIconPicker } from "@/components/account/account-icon-picker";
import type { UseAccountFormReturn } from "@/components/account/form";
import { layoutTransition, stepItemEntering } from "@/components/onboarding/motion";
import { OnboardingStepHeading } from "@/components/onboarding/onboarding-step-heading";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

interface OnboardingStyleStepProps {
  form: UseAccountFormReturn;
  onColorChange: (color: string) => void;
  onIconChange: (icon: string) => void;
}

export function OnboardingStyleStep({
  form,
  onColorChange,
  onIconChange,
}: OnboardingStyleStepProps) {
  return (
    <View style={styles.container}>
      <OnboardingStepHeading
        title="Make it yours"
        subtitle="Pick a mark and an accent. This is how the account shows up everywhere else."
      />

      <Animated.View
        style={styles.fieldGroup}
        entering={stepItemEntering(2)}
        layout={layoutTransition}
      >
        <Text style={styles.label}>Icon</Text>
        <form.Field name="icon">
          {(field) => <AccountIconPicker onChange={onIconChange} value={field.state.value} />}
        </form.Field>
      </Animated.View>

      <Animated.View
        style={styles.fieldGroup}
        entering={stepItemEntering(3)}
        layout={layoutTransition}
      >
        <Text style={styles.label}>Accent</Text>
        <form.Field name="color">
          {(field) => <AccountColorPicker onChange={onColorChange} value={field.state.value} />}
        </form.Field>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[7],
  },
  fieldGroup: {
    gap: spacing[2.5],
  },
  label: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
  },
});
