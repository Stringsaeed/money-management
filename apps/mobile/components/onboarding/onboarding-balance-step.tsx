import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { AccountCurrencyPicker } from "@/components/account/account-currency-picker";
import type { UseAccountFormReturn } from "@/components/account/form";
import { layoutTransition, stepItemEntering } from "@/components/onboarding/motion";
import { OnboardingStepHeading } from "@/components/onboarding/onboarding-step-heading";
import { OnboardingTextField } from "@/components/onboarding/onboarding-text-field";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";

/** Digits with at most two decimal places. Empty is allowed and means zero. */
const AMOUNT_PATTERN = /^\d*(\.\d{0,2})?$/;

interface OnboardingBalanceStepProps {
  form: UseAccountFormReturn;
}

export function OnboardingBalanceStep({ form }: OnboardingBalanceStepProps) {
  return (
    <View style={styles.container}>
      <OnboardingStepHeading
        title="What's in it today?"
        subtitle="Your ledger starts counting from here. Leave it at zero if you'd rather begin fresh."
      />

      <Animated.View
        style={styles.fieldGroup}
        entering={stepItemEntering(2)}
        layout={layoutTransition}
      >
        <Text style={styles.label}>Starting balance</Text>
        <form.Field
          name="amount"
          validators={{
            onChange: ({ value }) =>
              value.trim() && !AMOUNT_PATTERN.test(value.trim())
                ? "Use digits and up to two decimals."
                : undefined,
          }}
        >
          {(field) => (
            <View style={styles.inputGroup}>
              <form.Subscribe selector={(state) => state.values.currency}>
                {(currency) => (
                  <OnboardingTextField
                    emphasis
                    keyboardType="decimal-pad"
                    onChangeText={field.handleChange}
                    placeholder="0.00"
                    prefix={<Text style={styles.currencyPrefix}>{currency}</Text>}
                    returnKeyType="done"
                    testID="onboarding-amount-input"
                    value={field.state.value}
                  />
                )}
              </form.Subscribe>
              {field.state.meta.errors.length > 0 ? (
                <Text style={styles.errorText}>{String(field.state.meta.errors[0])}</Text>
              ) : null}
            </View>
          )}
        </form.Field>
      </Animated.View>

      <Animated.View
        style={styles.fieldGroup}
        entering={stepItemEntering(3)}
        layout={layoutTransition}
      >
        <Text style={styles.label}>Currency</Text>
        <form.Field name="currency">
          {(field) => (
            <AccountCurrencyPicker onChange={field.handleChange} value={field.state.value} />
          )}
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
  inputGroup: {
    gap: spacing[2],
  },
  label: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.5,
  },
  currencyPrefix: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.ink,
    opacity: 0.45,
  },
  errorText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.destructive,
  },
});
