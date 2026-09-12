import { TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface CreateResourceSheetFooterProps {
  error?: string;
  isSubmitting: boolean;
  onSubmit: VoidFunction;
  submitLabel: string;
  submittingLabel?: string;
}

/**
 * Primary submit uses RN TouchableOpacity (not `@/components/ui/button` or
 * Pressable): device certs kept reporting create-resource-submit hittable while
 * coord taps at the AX frame missed. TouchableOpacity is the secondary harden
 * after removing Expo UI Hosts from the create path; keep this footer inside
 * CreateResourceFormScreen's ScrollView.
 */
export function CreateResourceSheetFooter({
  error,
  isSubmitting,
  onSubmit,
  submitLabel,
  submittingLabel = "Creating…",
}: CreateResourceSheetFooterProps) {
  return (
    <View className="gap-3 p-5" collapsable={false}>
      {error ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
        >
          <Text className="text-center font-body-medium text-sm text-destructive">{error}</Text>
        </Animated.View>
      ) : null}
      <TouchableOpacity
        accessibilityLabel={submitLabel}
        accessibilityRole="button"
        activeOpacity={0.8}
        disabled={isSubmitting}
        onPress={onSubmit}
        testID="create-resource-submit"
        className={cn(
          "min-h-12 items-center justify-center rounded-xl bg-ink px-4 py-3",
          isSubmitting && "opacity-50",
        )}
      >
        <Text className="font-body-semibold text-base text-surface">
          {isSubmitting ? submittingLabel : submitLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
