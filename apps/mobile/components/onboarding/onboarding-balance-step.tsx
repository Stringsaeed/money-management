import { View } from "react-native";
import Animated from "react-native-reanimated";

import { AccountCurrencyPicker } from "@/components/account/account-currency-picker";
import type { UseAccountFormReturn } from "@/components/account/form";
import { layoutTransition, stepItemEntering } from "@/components/onboarding/motion";
import { OnboardingStepHeading } from "@/components/onboarding/onboarding-step-heading";
import { OnboardingTextField } from "@/components/onboarding/onboarding-text-field";
import { Text } from "@/components/ui/text";

/** Digits with at most two decimal places. Empty is allowed and means zero. */
const AMOUNT_PATTERN = /^\d*(\.\d{0,2})?$/;

interface OnboardingBalanceStepProps {
  form: UseAccountFormReturn;
}

export function OnboardingBalanceStep({ form }: OnboardingBalanceStepProps) {
  return (
    <View className="gap-7">
      <OnboardingStepHeading
        title="What's in it today?"
        subtitle="Your ledger starts counting from here. Leave it at zero if you'd rather begin fresh."
      />

      <Animated.View className="gap-2.5" entering={stepItemEntering(2)} layout={layoutTransition}>
        <Text className="font-body-medium text-sm text-ink/50">Starting balance</Text>
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
            <View className="gap-2">
              <form.Subscribe selector={(state) => state.values.currency}>
                {(currency) => (
                  <OnboardingTextField
                    emphasis
                    keyboardType="decimal-pad"
                    onChangeText={field.handleChange}
                    placeholder="0.00"
                    prefix={
                      <Text className="font-body-semibold text-base text-ink/45">{currency}</Text>
                    }
                    returnKeyType="done"
                    testID="onboarding-amount-input"
                    value={field.state.value}
                  />
                )}
              </form.Subscribe>
              {field.state.meta.errors.length > 0 ? (
                <Text className="font-body-medium text-xs text-destructive">
                  {String(field.state.meta.errors[0])}
                </Text>
              ) : null}
            </View>
          )}
        </form.Field>
      </Animated.View>

      <Animated.View className="gap-2.5" entering={stepItemEntering(3)} layout={layoutTransition}>
        <Text className="font-body-medium text-sm text-ink/50">Currency</Text>
        <form.Field name="currency">
          {(field) => (
            <AccountCurrencyPicker onChange={field.handleChange} value={field.state.value} />
          )}
        </form.Field>
      </Animated.View>
    </View>
  );
}
