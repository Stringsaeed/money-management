import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { AccountTypePicker } from "@/components/account/account-type-picker";
import type { UseAccountFormReturn } from "@/components/account/form";
import { layoutTransition, stepItemEntering } from "@/components/onboarding/motion";
import { OnboardingStepHeading } from "@/components/onboarding/onboarding-step-heading";
import { OnboardingTextField } from "@/components/onboarding/onboarding-text-field";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import type { AccountType } from "@/types";

interface OnboardingNameStepProps {
  form: UseAccountFormReturn;
  onTypeChange: (type: AccountType) => void;
}

export function OnboardingNameStep({ form, onTypeChange }: OnboardingNameStepProps) {
  return (
    <View style={styles.container}>
      <OnboardingStepHeading
        title="Name your first plot"
        subtitle="Where does most of your money sit right now? You can add more accounts later."
      />

      <Animated.View
        style={styles.fieldGroup}
        entering={stepItemEntering(2)}
        layout={layoutTransition}
      >
        <Text style={styles.label}>Account name</Text>
        <form.Field name="name">
          {(field) => (
            <OnboardingTextField
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={field.handleChange}
              placeholder="Main Checking"
              returnKeyType="next"
              testID="onboarding-name-input"
              value={field.state.value}
            />
          )}
        </form.Field>
      </Animated.View>

      <Animated.View
        style={styles.fieldGroup}
        entering={stepItemEntering(3)}
        layout={layoutTransition}
      >
        <Text style={[styles.label, styles.labelNoPadding]}>Account type</Text>
        <View style={styles.typePickerWrapper}>
          <form.Field name="type">
            {(field) => (
              <AccountTypePicker
                contentContainerStyle={styles.typePickerContent}
                onChange={onTypeChange}
                value={field.state.value}
              />
            )}
          </form.Field>
        </View>
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
  labelNoPadding: {
    paddingHorizontal: 0,
  },
  typePickerWrapper: {
    marginHorizontal: -spacing[6],
  },
  typePickerContent: {
    gap: spacing[2],
    paddingHorizontal: spacing[6],
  },
});
