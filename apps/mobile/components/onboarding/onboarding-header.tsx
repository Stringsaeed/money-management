import { Pressable, View } from "react-native";
import { ArrowLeftIcon } from "phosphor-react-native";

import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Icon } from "@/components/ui/icon";

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
    <View className="h-11 flex-row items-center gap-3 px-5">
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBack}
        className="h-9 w-9 items-center justify-center rounded-full border border-ledger-outline bg-surface/80 active:bg-surface-dim"
        testID="onboarding-back"
      >
        <Icon as={ArrowLeftIcon} className="text-ink" size={16} weight="bold" />
      </Pressable>

      <View className="flex-1">
        <OnboardingProgress current={current} total={total} />
      </View>

      {/* Balances the back slot so progress stays optically centred. */}
      <View className="h-9 w-9" />
    </View>
  );
}
