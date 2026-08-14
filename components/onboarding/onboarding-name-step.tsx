import { View } from "react-native";
import Animated from "react-native-reanimated";

import { AccountTypePicker } from "@/components/account/account-type-picker";
import type { UseAccountFormReturn } from "@/components/account/form";
import { layoutTransition, stepItemEntering } from "@/components/onboarding/motion";
import { OnboardingStepHeading } from "@/components/onboarding/onboarding-step-heading";
import { OnboardingTextField } from "@/components/onboarding/onboarding-text-field";
import { Text } from "@/components/ui/text";
import type { AccountType } from "@/types";

interface OnboardingNameStepProps {
  form: UseAccountFormReturn;
  onTypeChange: (type: AccountType) => void;
}

export function OnboardingNameStep({ form, onTypeChange }: OnboardingNameStepProps) {
  return (
    <View className="gap-7">
      <OnboardingStepHeading
        title="Name your first plot"
        subtitle="Where does most of your money sit right now? You can add more accounts later."
      />

      <Animated.View className="gap-2.5" entering={stepItemEntering(2)} layout={layoutTransition}>
        <Text className="font-body-medium text-sm text-ink/50">Account name</Text>
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

      <Animated.View className="gap-2.5" entering={stepItemEntering(3)} layout={layoutTransition}>
        <Text className="px-0 font-body-medium text-sm text-ink/50">Account type</Text>
        <View className="-mx-6">
          <form.Field name="type">
            {(field) => (
              <AccountTypePicker
                contentContainerClassName="gap-2 px-6"
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
