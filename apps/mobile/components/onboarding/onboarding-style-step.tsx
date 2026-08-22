import { View } from "react-native";
import Animated from "react-native-reanimated";

import { AccountColorPicker } from "@/components/account/account-color-picker";
import { AccountIconPicker } from "@/components/account/account-icon-picker";
import type { UseAccountFormReturn } from "@/components/account/form";
import { layoutTransition, stepItemEntering } from "@/components/onboarding/motion";
import { OnboardingStepHeading } from "@/components/onboarding/onboarding-step-heading";
import { Text } from "@/components/ui/text";

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
    <View className="gap-7">
      <OnboardingStepHeading
        title="Make it yours"
        subtitle="Pick a mark and an accent. This is how the account shows up everywhere else."
      />

      <Animated.View className="gap-2.5" entering={stepItemEntering(2)} layout={layoutTransition}>
        <Text className="font-body-medium text-sm text-ink/50">Icon</Text>
        <form.Field name="icon">
          {(field) => <AccountIconPicker onChange={onIconChange} value={field.state.value} />}
        </form.Field>
      </Animated.View>

      <Animated.View className="gap-2.5" entering={stepItemEntering(3)} layout={layoutTransition}>
        <Text className="font-body-medium text-sm text-ink/50">Accent</Text>
        <form.Field name="color">
          {(field) => <AccountColorPicker onChange={onColorChange} value={field.state.value} />}
        </form.Field>
      </Animated.View>
    </View>
  );
}
